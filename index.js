const event = require('codeceptjs').event;
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const Container = require('codeceptjs').container;
const helpers = Container.helpers();
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
	passed: { status_id: 1, comment: 'This test passed' },
	failed: { status_id: 5, comment: 'This test failed' },
};

function getToday() {
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

class TestRail {
	constructor(defaultConfig) {
		this.host = defaultConfig.host;
		this.user = defaultConfig.user;
		this.password = defaultConfig.password;

		this.uri = '/index.php?/api/v2/';

		axios.defaults.baseURL = this.host + this.uri;
	}

	async getSuites(projectId) {
		try {
			const res = await axios({
				method: 'get',
				url: 'get_suites/' + projectId,
				auth: {
					username: this.user,
					password: this.password
				},
				headers: {
					'content-type': 'application/json'
				}
			});
			return res.data;
		} catch (error) {
			console.log(error.response.data.error);			
		}
	}

	async addRun(projectId, data) {
		try {
			const res = await axios({
				method: 'post',
				url: 'add_run/' + projectId,
				data,
				auth: {
					username: this.user,
					password: this.password
				}
			});
			return res.data;
		} catch (error) {
			console.log(error.response.data.error);
		}
	}

	async updateRun(runId, data) {
		try {
			const res = await axios({
				method: 'post',
				url: 'update_run/' + runId,
				data,
				auth: {
					username: this.user,
					password: this.password
				}
			});
			return res.data;
		} catch (error) {
			console.log(error.response.data.error);
		}

	}

	async addResultForCase(runId, caseId, data) {
		try {
			let res = await axios({
				method: 'post',
				url: 'add_result_for_case/' + runId + '/' + caseId,
				data,
				auth: {
					username: this.user,
					password: this.password
				}
			});
			return res.data;
		} catch (error) {
			console.log(error.response.data.error);
		}

	}

	async addAttachmentToResult(resultId, imageFile) {
		var form = new FormData();
		form.append('attachment', fs.createReadStream(global.output_dir + '/' + imageFile));

		axios({
			method: 'post',
			data: form,
			url: 'add_attachment_to_result/' + resultId,
			auth: {
				username: this.user,
				password: this.password
			},
			headers: form.getHeaders()
		}).catch(err => {
			throw Error(`Cannot attach file due to ${err}`);
		});
	}
}

module.exports = (config) => {
	config = Object.assign(defaultConfig, config);

	if (config.host === '' || config.user === '' || config.password === '') throw new Error('Please provide proper Testrail host or credentials');
	if (!config.projectId) throw new Error('Please provide project id');

	const testrail = new TestRail(config);

	let suiteId;
	let runName;
	let runId;
	let failedTests = [];
	let errors = {};
	let attachments = {};
	let passedTests = [];

	runName = config.runName ? config.runName : `This is a new test run on ${getToday()}`;

	async function _updateTestRun(runId, ids) {
		try {
			await testrail.updateRun(runId, { case_ids: ids });
		} catch (error) {
			console.log(error.response.data.error);
		}
	}

	async function _addTestRun(projectId, suiteId, runName) {
		try {
			return await testrail.addRun(projectId, { suite_id: suiteId, name: runName, include_all: false });
		} catch (error) {
			console.log(`Cannot create new testrun due to ${JSON.stringify(error)}`);
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
			helper.saveScreenshot(fileName);
			failedTests.push({id: tag.split('@C')[1], elapsed: test.elapsed === 0 ? '1s' : `${test.elapsed}s`});
			errors[tag.split('@C')[1]] = err;
			attachments[tag.split('@C')[1]] = fileName;
		});
	});

	event.dispatcher.on(event.test.passed, (test) => {
		test.endTime = Date.now();
		test.elapsed = Math.round((test.endTime - test.startTime) / 1000);
		test.tags.forEach(tag => {
			passedTests.push({id: tag.split('@C')[1], elapsed: test.elapsed === 0 ? '1s' : `${test.elapsed}s`});
		});
	});

	event.dispatcher.on(event.all.result, async () => {
		const mergedTests = failedTests.concat(passedTests);
		let ids = [];

		mergedTests.forEach(test => {
			for (let [key, value] of Object.entries(test)) {
				if (key === 'id') {
					ids.push(value);
				}
			}
		});

		if (config.suiteId === undefined || config.suiteId === null) {
			let res = await testrail.getSuites(config.projectId);
			const suiteId = res[0].id;
			res = await _addTestRun(config.projectId, suiteId, runName);
			runId = res.id;
		} else {
			suiteId = config.suiteId;
			let res = await _addTestRun(config.projectId, suiteId, runName);
			runId = res.id;
		}

		await _updateTestRun(runId, ids);

		passedTests.forEach(test => {
			testCase.passed.elapsed = test.elapsed;
			testrail.addResultForCase(runId, test.id, testCase.passed, (err) => {
				if (err) throw new Error(`Something is wrong while adding result for a test case ${test.id}. Please check ${JSON.stringify(err)}`);
			});
		});

		failedTests.forEach(test => {
			let errorString = '';
			console.log(test);
			if (errors[test.id]['message']) {
				errorString = errors[test.id]['message'].replace(/\u001b\[.*?m/g, '');
			} else {
				errorString = errors[test.id];
			}
			let failedCase = { status_id: 5, comment: `This test is failed due to **${errorString}**`, elapsed: test.elapsed };
			testrail.addResultForCase(runId, test.id, failedCase).then(res => {
				let resultId = res.id;
				testrail.addAttachmentToResult(resultId, attachments[test.id]);
				try {
					fs.unlinkSync(global.output_dir + '/' + attachments[test.id]);
					//file removed
				} catch (err) {
					throw Error(`Cannot remove file due to ${err}`);
				}
			});
		});
	});

	return this;
};
