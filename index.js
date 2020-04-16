const event = require('codeceptjs').event;
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const Container = require('codeceptjs').container;
const path = require('path');
const helpers = Container.helpers();
const output = require('./lib/output');
let helper;

const supportedHelpers = [
	'WebDriver',
	'Protractor',
	'Appium',
	'Nightmare',
	'Puppeteer',
	'Playwright',
	'TestCafe'
];

for (const helperName of supportedHelpers) {
	if (Object.keys(helpers).indexOf(helperName) > -1) {
		helper = helpers[helperName];
	}
}

const defaultConfig = {
	host: '',
	user: '',
	password: '',
	enabled: false
};

const testCase = {
	passed: { status_id: 1 },
	failed: { status_id: 5 },
};

class TestRail {
	constructor(defaultConfig) {
		this.host = defaultConfig.host;
		this.user = defaultConfig.user;
		this.password = defaultConfig.password;
		this.uri = '/index.php?/api/v2/';

		const b = new Buffer(`${this.user}:${this.password}`);
		const basicAuth = b.toString('base64');

		axios.defaults.baseURL = this.host + this.uri;
		axios.defaults.headers.Authorization = `Basic ${basicAuth}`;
	}

	async addPlan(projectId, data) {
		try {
			const res = await axios({
				method: 'post',
				url: 'add_plan/' + projectId,
				data,
			});
			return res.data;
		} catch (error) {
			output.error(`Cannnot add new plan due to ${error}`);
		}
	}

	async addPlanEntry(planId, data) {
		try {
			const res = await axios({
				method: 'post',
				url: 'add_plan_entry/' + planId,
				data,
			});
			return res.data;
		} catch (error) {
			output.error(`Cannnot add new test run to existing test plan due to ${error}`);
		}
	}

	async getSuites(projectId) {
		try {
			const res = await axios({
				method: 'get',
				url: 'get_suites/' + projectId,
				headers: {
					'content-type': 'application/json'
				}
			});
			return res.data;
		} catch (error) {
			output.error(`Cannnot get suites due to ${error}`);
		}
	}

	async getConfigs(projectId) {
		try {
			const res = await axios({
				method: 'get',
				url: 'get_configs/' + projectId,
				headers: {
					'content-type': 'application/json'
				}
			});
			return res.data;
		} catch (error) {
			output.error(`Cannnot get configs due to ${error}`);
		}
	}

	async addRun(projectId, data) {
		try {
			const res = await axios({
				method: 'post',
				url: 'add_run/' + projectId,
				data,
			});

			return res.data;
		} catch (error) {
			output.error(`Cannnot add new run due to ${error}`);
		}
	}

	async updateRun(runId, data) {
		try {
			const res = await axios({
				method: 'post',
				url: 'update_run/' + runId,
				data,
			});
			output.log(`The run with id: ${runId} is updated`);
			return res.data;
		} catch (error) {
			output.error(`Cannnot update run due to ${error}`);
		}
	}

	async getResultsForCase(runId, caseId) {
		return axios({
			method: 'get',
			url: 'get_results_for_case/' + runId + '/' + caseId,
			headers: {
				'content-type': 'application/json'
			}
		}).then((res) => {
			output.log(`The response is ${JSON.stringify(res.data)}`);
			output.log(`The case ${caseId} on run ${runId} is updated`);
			return res.data;
		}).catch(error => {
			output.error(`Cannnot get results for case ${caseId} on run ${runId} due to ${error}`);
		});
	}

	async addResultsForCases(runId, data) {
		return axios({
			method: 'post',
			url: 'add_results_for_cases/' + runId,
			data,
		}).then((res) => {
			output.log(`The response is ${JSON.stringify(res.data)}`);

			return res.data;
		}).catch(error => {
			output.error(`Cannnot add result for case due to ${error}`);
		});
	}

	async addAttachmentToResult(resultId, imageFile) {
		var form = new FormData();
		form.append('attachment', fs.createReadStream(path.join(global.output_dir, imageFile.toString())));

		axios({
			method: 'post',
			data: form,
			url: 'add_attachment_to_result/' + resultId,
			headers: form.getHeaders()
		}).catch(err => {
			output.error(`Cannot attach file due to ${err}`);
		});
	}
}

module.exports = (config) => {
	config = Object.assign(defaultConfig, config);
	output.showDebugLog(config.debugLog);

	if (config.host === '' || config.user === '' || config.password === '') throw new Error('Please provide proper Testrail host or credentials');
	if (!config.projectId) throw new Error('Please provide project id in config file');

	const testrail = new TestRail(config);
	
	let runName;
	let runId;
	let failedTests = [];
	let passedTests = [];
	let errors = {};
	let attachments = {};

	runName = config.runName ? config.runName : `New test run on ${_getToday()}`;

	async function _updateTestRun(runId, ids) {
		try {
			await testrail.updateRun(runId, { case_ids: ids });
		} catch (error) {
			output.error(`Cannnot update run due to ${error}`);
		}
	}

	async function _addTestRun(projectId, suiteId, runName) {
		try {
			return testrail.addRun(projectId, { suite_id: suiteId, name: runName, include_all: false });
		} catch (error) {
			output.error(`Cannot create new testrun due to ${JSON.stringify(error)}`);
		}
	}

	async function _addTestPlan(projectId, planName, data) {
		try {
			const planData = Object.assign({ name: planName }, data);
			return testrail.addPlan(projectId, planData);
		} catch (error) {
			output.error(`Cannot create new test plan due to ${JSON.stringify(error)}`);
		}
	}

	event.dispatcher.on(event.test.started, async (test) => {
		test.startTime = Date.now();
	});

	event.dispatcher.on(event.test.failed, async (test, err) => {
		test.endTime = Date.now();
		test.elapsed = Math.round((test.endTime - test.startTime) / 1000);
		test.tags.forEach(async (tag) => {
			const uuid = Math.floor(new Date().getTime() / 1000);
			const fileName = `${uuid}.failed.png`;
			try {
				output.log('Saving the screenshot...');
				if (helper) {
					helper.saveScreenshot(fileName);
				}
			} catch (error) {
				output.log(`Cannot save screenshot due to ${error}`);
			}

			if (tag.includes('@C')) {
				failedTests.push({ case_id: tag.split('@C')[1], elapsed: test.elapsed === 0 ? '1s' : `${test.elapsed}s` });
				errors[tag.split('@C')[1]] = err;
				attachments[tag.split('@C')[1]] = fileName;
			}
		});
	});

	event.dispatcher.on(event.test.passed, (test) => {
		test.endTime = Date.now();
		test.elapsed = Math.round((test.endTime - test.startTime) / 1000);
		test.tags.forEach(tag => {
			if (tag.includes('@C')) {
				passedTests.push({ case_id: tag.split('@C')[1], elapsed: test.elapsed === 0 ? '1s' : `${test.elapsed}s` });
			}
		});
	});

	event.dispatcher.on(event.all.result, async () => {
		const mergedTests = failedTests.concat(passedTests);
		let ids = [];
		let config_ids = [];

		mergedTests.forEach(test => {
			for (let [key, value] of Object.entries(test)) {
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
					const data = {
						suite_id: suiteId,
						name: runName,
						include_all: true,
						config_ids: config_ids,
						runs: [{
							include_all: false,
							case_ids: ids,
							config_ids: config_ids
						}]
					};

					const res = await testrail.addPlanEntry(config.plan.existingPlanId, data);
					runId = res.runs[0].id;
				} else {
					const data = {
						description: config.plan.description || '',
						entries: [{
							suite_id: suiteId,
							name: runName,
							include_all: true,
							config_ids: config_ids,
							runs: [{
								include_all: false,
								case_ids: ids,
								config_ids: config_ids
							}]
						}]
					};

					const res = await _addTestPlan(config.projectId, config.plan.name, data);
					runId = res.entries[0].runs[0].id;
				}

			} else {
				const res = await _addTestRun(config.projectId, suiteId, runName);
				runId = res.id;
				await _updateTestRun(runId, ids);
			}

			passedTests.forEach(test => {
				testCase.passed.comment = `Test case C${test.case_id} is PASSED.`;
				test = Object.assign(test, testCase.passed);
			});

			failedTests.forEach(test => {
				let errorString = '';
				if (errors[test.case_id]['message']) {
					errorString = errors[test.case_id]['message'].replace(/\u001b\[.*?m/g, '');
				} else {
					errorString = errors[test.case_id];
				}
				testCase.failed.comment = `Test case C${test.case_id} is FAILED due to **${errorString}**`;
				test = Object.assign(test, testCase.failed);
			});

			const allResults = passedTests.concat(failedTests);

			testrail.addResultsForCases(runId, { results: allResults }).then(res => {
				output.log(`The run ${runId} is updated with ${JSON.stringify(res)}`);

				failedTests.forEach(test => {
					testrail.getResultsForCase(runId, test.case_id).then(res => {
						if (helper) {
							testrail.addAttachmentToResult(res[0].id, attachments[test.case_id]);
						}
					});

				});
			});

		} else {
			output.log('There is no TC, hence no test run is created');
		}
	});

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
