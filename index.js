const { event } = require('codeceptjs');
const { deepMerge, clearString } = require('codeceptjs/lib/utils');
const Container = require('codeceptjs').container;
const helpers = Container.helpers();
const output = require('./lib/output');
const TestRail = require('./lib/testrail');
const supportedHelpers = [
	'WebDriver',
	'Appium',
	'Nightmare',
	'Puppeteer',
	'Playwright',
	'TestCafe'
];

const defaultConfig = {
	host: '',
	user: '',
	password: '',
	enabled: false,
	testCase: {
		passed: { status_id: 1 },
		failed: { status_id: 5 },
	},
	runId: undefined,
	closeTestRun: true,
	version: '1', // this is the build version - OPTIONAL,
	resultProcessor: undefined
};

let helper;

for (const helperName of supportedHelpers) {
	if (Object.keys(helpers).indexOf(helperName) > -1) {
		helper = helpers[helperName];
	}
}

module.exports = (config) => {
	config = deepMerge (defaultConfig, config);
	output.showDebugLog(config.debugLog);

	if (!config.host)  throw new Error('Please provide proper Testrail host');
	if (!config.user) throw new Error('Please provide proper Testrail user');
	if (!config.password) throw new Error('Please provide proper Testrail password');
	if (!config.projectId) throw new Error('Please provide project id in config file');
	if (config.resultProcessor && typeof config.resultProcessor !== 'function') {
		throw new Error('Result processor (`resultProcessor` config option) has to be function');
	}

	const testrail = new TestRail(config);

	let runName;
	let runId;
	let failedTests = [];
	let passedTests = [];
	let skippedTest = [];
	let errors = {};
	let attachments = {};
	let prefixTag;
	let defaultElapsedTime = '1s';

	runName = config.runName ? config.runName : `New test run on ${_getToday()}`;
	prefixTag = config.prefixTag || '@C';

	const prefixRegExp = new RegExp(`${prefixTag}\\d+`);

	async function _updateTestRun(runId, ids) {
		try {
			await testrail.updateRun(runId, { case_ids: ids });
		} catch (error) {
			output.error(`Cannot update run due to ${error}`);
		}
	}

	async function _getTestRun(runId) {
		try {
			return testrail.getRun(runId);
		} catch (error) {
			output.error(`Cannot get run due to ${error}`);
		}
	}

	async function _addTestRun(projectId, suiteId, runName) {
		try {
			return testrail.addRun(projectId, { suite_id: suiteId, name: runName, include_all: false });
		} catch (error) {
			output.error(`Cannot create new test run due to ${JSON.stringify(error)}`);
		}
	}

	async function _addTestPlan(projectId, planName, data) {
		const planData = Object.assign({ name: planName }, data);
		return testrail.addPlan(projectId, planData);
	}

	event.dispatcher.on(event.test.started, async (test) => {
		if (test.body) {
			if (test.body.includes('addExampleInTable')) {
				const testRailTagRegExp = new RegExp(`"testRailTag":"(${prefixTag}\\d+)"`);
				const testRailTag = testRailTagRegExp.exec(test.title);
				if (testRailTag) {
					test.tags.push(testRailTag[1]);
				}
			}
		}
		test.startTime = Date.now();
	});

	const failedTestCaseIds = new Set();

	event.dispatcher.on(event.test.skipped, async (test) => {
		test.endTime = Date.now();
		test.elapsed = Math.round((test.endTime - test.startTime) / 1000);
		test.tags.forEach(tag => {
			if (prefixRegExp.test(tag)) {
				const caseId = tag.split(prefixTag)[1];
				const elapsed = !test.elapsed ? defaultElapsedTime : `${test.elapsed}s`;
				if (!failedTestCaseIds.has(caseId)) {
					// else it also failed on retry, so we shouldn't add in a duplicate
					skippedTest.push({ case_id: caseId, elapsed: elapsed });
				}
			}
		});
	});

	event.dispatcher.on(event.test.failed, async (test, err) => {
		test.endTime = Date.now();
		test.elapsed = test.duration ? test.duration / 1000 : Math.round((test.endTime - test.startTime) / 1000);
		for (const tag of test.tags) {
			const uuid = Math.floor(new Date().getTime() / 1000);
			const fileName = `${uuid}.failed.png`;
			try {
				if (helper) {
					output.log('Saving the screenshot...');
					await helper.saveScreenshot(fileName);
				}
			} catch (error) {
				output.log(`Cannot save screenshot due to ${error}`);
			}

			if (prefixRegExp.test(tag)) {
				const caseId = tag.split(prefixTag)[1];
				const elapsed = test.elapsed === 0 ? defaultElapsedTime : `${test.elapsed}s`;
				if (!failedTestCaseIds.has(caseId)) {
					// else it also failed on retry so we shouldnt add in a duplicate
					failedTestCaseIds.add(caseId);
					failedTests.push({ case_id: caseId, elapsed: elapsed });
				}
				errors[tag.split(prefixTag)[1]] = err || test.err;
				attachments[tag.split(prefixTag)[1]] = fileName;
			}
		}
	});

	event.dispatcher.on(event.test.passed, (test) => {
		test.endTime = Date.now();
		test.elapsed = test.startTime ? Math.round((test.endTime - test.startTime) / 1000) : 0;
		test.tags.forEach(tag => {
			if (prefixRegExp.test(tag)) {
				const caseId = tag.split(prefixTag)[1];
				const elapsed = test.elapsed === 0 ? defaultElapsedTime : `${test.elapsed}s`;
				// remove duplicates caused by retries
				if (failedTestCaseIds.has(caseId)) {
					failedTests = failedTests.filter(({ case_id }) => case_id !== caseId);
				}
				passedTests.push({ case_id: caseId, elapsed: elapsed });
			}
		});
	});

	event.dispatcher.on(event.workers.result, async (result) => {
		for (const test of result.tests.passed) {
			test.tags.forEach(tag => {
				if (prefixRegExp.test(tag)) {
					const caseId = tag.split(prefixTag)[1];
					const elapsed = !test.duration ? defaultElapsedTime : `${test.duration / 1000}s`;
					passedTests.push({ case_id: caseId , elapsed });
				}
			});
		}

		for (const test of result.tests.failed) {
			test.tags.forEach(tag => {
				if (prefixRegExp.test(tag)) {
					const caseId = tag.split(prefixTag)[1];
					const elapsed = !test.duration ? defaultElapsedTime : `${test.duration / 1000}s`;

					failedTests.push({ case_id: caseId, elapsed });
					errors[caseId] = test.err;
					attachments[caseId] = clearString(test.title) + '.failed.png';
				}
			});
		}

		await _publishResultsToTestrail();
	});

	event.dispatcher.on(event.all.result, async () => {
		if (!process.env.RUNS_WITH_WORKERS) {
			await _publishResultsToTestrail();
		}
	});

	async function _publishResultsToTestrail() {
		const mergedTests = [...failedTests, ...passedTests, ...skippedTest];

		let ids = [];
		let config_ids = [];

		mergedTests.forEach(test => {
			for (const [key, value] of Object.entries(test)) {
				if (key === 'case_id') {
					ids.push(value);
				}
			}
		});

		if (ids.length > 0) {
			let suiteId;
			if (config.suiteId === undefined || config.suiteId === null) {
				let res = await testrail.getSuites(config.projectId);
				suiteId = res[0].id;
			} else {
				suiteId = config.suiteId;
			}

			if (config.configuration) {
				const res = await testrail.getConfigs(config.projectId);
				for (let i = 0; i < res.length; i++) {
					if (res[i].name === config.configuration.groupName) {
						for (let j = 0; j < res[i].configs.length; j++) {
							if (res[i].configs[j].name === config.configuration.configName) {
								config_ids.push(res[i].configs[j].id);
							}
						}
					}
				}
			}
			if (config.plan) {
				if (config.plan.existingPlanId) {

					let data = {
						suite_id: suiteId,
						name: runName,
						include_all: !config.plan.onlyCaseIds,
						config_ids,
						runs: [{
							include_all: false,
							case_ids: ids,
							config_ids
						}]
					};

					if (config.plan.onlyCaseIds) {
						data = { ...data, case_ids: ids };
					}

					const res = await testrail.addPlanEntry(config.plan.existingPlanId, data);
					runId = config.runId ? config.runId : res.runs[0].id;
				} else {
					const data = {
						description: config.plan.description || '',
						entries: [{
							suite_id: suiteId,
							name: runName,
							include_all: true,
							config_ids,
							runs: [{
								include_all: false,
								case_ids: ids,
								config_ids
							}]
						}]
					};

					const res = await _addTestPlan(config.projectId, config.plan.name, data);
					runId = res.entries[0].runs[0].id;
				}

			} else {
				try {
					if (config.runId) {
						runId = config.runId;
					} else {
						const res = await _addTestRun(config.projectId, suiteId, runName);
						process.env.TESTRAIL_RUN_URL = res.url;
						runId = res.id;
					}

					// Do not update the run if it is part of a plan, but this has not been specified in the config
					const runData = await _getTestRun(runId);
					if (runData && !runData.plan_id) {
						await _updateTestRun(runId, ids);
					}
				} catch (error) {
					output.error(error);
				}
			}

			// Assign extra/missing params for each PASSED test case
			passedTests.forEach(test => {
				const testCase = {
					passed: {
						comment: config.testCase.passed.comment || `Test case ${prefixTag}${test.case_id} is *PASSED*.`,
						status_id: config.testCase.passed.status_id,
						version: config.version
					}
				};
				Object.assign(test, testCase.passed);
			});

			// Assign extra/missing params for each FAILED test case
			failedTests.forEach(test => {
				let errorString = '';
				if (errors[test.case_id] && errors[test.case_id]['message']) {
					errorString = errors[test.case_id]['message'].replace(/\u001b\[.*?m/g, '');
				} else {
					errorString = errors[test.case_id];
				}
				const testCase = {
					failed: {
						comment: config.testCase.failed.comment || `Test case C${test.case_id} is *FAILED* due to **${JSON.stringify(errorString)}**`,
						status_id: config.testCase.failed.status_id,
						version: config.version
					}
				};
				Object.assign(test, testCase.failed);
			});

			skippedTest.forEach(test => {
				const testCase = {
					failed: {
						comment: `SKIPPED - ${config.skipInfo.message}`,
						status_id: config.testCase.skipped.status_id,
						version: config.version
					}
				};
				Object.assign(test, testCase.failed);
			});

			const allResults = passedTests.concat(failedTests.concat(skippedTest));

			testrail.getCases(config.projectId, config.suiteId).then(testCases => {
				if (testCases.length) {
					// Before POST-ing the results, filter the array for any non-existing tags in TR test bucket assigned to this test run
					// This is to avoid any failure to POST results due to labels in the results array not part of the test run
					const { validResults, missingLabels } = allResults.reduce(
						(acc, testResult) => {
							const testCase = testCases.find(it => it.id == testResult.case_id);
							// If there is `resultProcessor` callback in config, then we need to process test result
							const processedResult = config.resultProcessor
								? config.resultProcessor(testResult, { testCase, allResults, allTestCases: testCases })
								: testResult;

							if (processedResult) {
								if (testCase) {
									acc.validResults.push(processedResult);
								} else {
									acc.missingLabels.push(processedResult);
								}
							}
							return acc;
						},
						{ validResults: [], missingLabels: [] }
					);

					if (missingLabels.length) {
						output.error(`Error: some labels are missing from the test run and the results were not send through: ${JSON.stringify(missingLabels.map(l => l.case_id))}`);
					}

					return { validResults };
				}
				return { validResults: [] };
			}).then(({ validResults }) => {
				if (validResults.length) {
					testrail.addResultsForCases(runId, {results: validResults}).then(res => {
						output.log(`The run ${runId} is updated with ${JSON.stringify(res)}`);

						for (const test of failedTests) {
							testrail.getResultsForCase(runId, test.case_id).then(async res => {
								try {
									helper && await testrail.addAttachmentToResult(res[0].id, attachments[test.case_id]);
								} catch (err) {
									output.error(`Cannot add attachment due to error: ${err}`);
								}
							});
						}
					});
					_closeTestRun();
				}
			});
		} else {
			output.log('There is no TC, hence no test run is created');
		}
	}

	function _closeTestRun() {
		if (config.closeTestRun === true) {
			testrail.closeTestRun(runId).then(res => {
				output.log(`The run ${runId} is updated with ${JSON.stringify(res)}`);
			});
		}
	}

	return this;
};

function _getToday() {
	const today = new Date();
	let dd = today.getDate();
	let mm = today.getMonth() + 1; // January is 0!
	const yyyy = today.getFullYear();

	let hour = today.getHours();
	let minute = today.getMinutes();

	if (dd < 10) {
		dd = `0${dd}`;
	}
	if (mm < 10) {
		mm = `0${mm}`;
	}
	if (minute < 10) {
		minute = `0${minute}`;
	}

	return `${dd}/${mm}/${yyyy} ${hour}:${minute}`;
}
