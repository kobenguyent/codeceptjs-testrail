const event = require('codeceptjs').event;
const axios = require('axios');
var FormData = require('form-data');
var fs = require('fs');
const Container = require('codeceptjs').container;
const helpers = Container.helpers();
let helper;

const supportedHelpers = [
	'WebDriverIO',
	'WebDriver',
	'Protractor',
	'Appium',
	'Nightmare',
	'Puppeteer',
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
	if (dd < 10) {
		dd = `0${dd}`;
	}
	if (mm < 10) {
		mm = `0${mm}`;
	}
	return `${dd}/${mm}/${yyyy}`;
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
		let res = await axios({
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

	}

	async addRun(projectId, data) {
		let res = await axios({
			method: 'post',
			url: 'add_run/' + projectId,
			data,
			auth: {
				username: this.user,
				password: this.password
			}
		});
		return res.data;
	}

	async updateRun(runId, data) {
		let res = await axios({
			method: 'post',
			url: 'update_run/' + runId,
			data,
			auth: {
				username: this.user,
				password: this.password
			}
		});
		return res.data;
	}

	async addResultForCase(runId, caseId, data) {
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

	async function _addTestRun(projectId, suiteId, runName) {
		let res = await testrail.addRun(projectId, { suite_id: suiteId, name: runName, include_all: false });
		return res;
	}

	async function _updateTestRun(runId, ids) {
		await testrail.updateRun(runId, { case_ids: ids });
	}

	if (config.suiteId === undefined || config.suiteId === null) {
		testrail.getSuites(config.projectId).then(res => {
			const suiteId = res[0].id;
			_addTestRun(config.projectId, suiteId, runName).then(res => {
				runId = res.id;
			});
		});
	} else {
		suiteId = config.suiteId;
		_addTestRun(config.projectId, suiteId, runName).then(res => {
			runId = res.id;
		});
	}

	event.dispatcher.on(event.test.failed, async (test, err) => {
		test.tags.forEach(async (tag) => {
			const uuid = Math.floor(new Date().getTime() / 1000);
			const fileName = `${uuid}.failed.png`;
			helper.saveScreenshot(fileName);
			failedTests.push(tag.split('@C')[1]);
			errors[tag.split('@C')[1]] = err;
			attachments[tag.split('@C')[1]] = fileName;
		});
	});

	event.dispatcher.on(event.test.passed, (test) => {
		test.tags.forEach(tag => {
			passedTests.push(tag.split('@C')[1]);
		});
	});

	event.dispatcher.on(event.all.result, async () => {
		let ids;
		ids = failedTests.concat(passedTests);

		await _updateTestRun(runId, ids);

		passedTests.forEach(id => {
			testrail.addResultForCase(runId, id, testCase.passed, (err) => {
				if (err) throw new Error(`Something is wrong while adding result for a test case ${id}. Please check ${JSON.stringify(err)}`);
			});
		});

		failedTests.forEach(id => {
			let errorString = '';
			if (errors[id]['message']) {
				errorString = errors[id]['message'].replace(/\u001b\[.*?m/g, '');
			} else {
				errorString = errors[id];
			}
			let failedCase = { status_id: 5, comment: `This test is failed due to **${errorString}**` };
			testrail.addResultForCase(runId, id, failedCase).then(res => {
				let resultId = res.id;
				testrail.addAttachmentToResult(resultId, attachments[id]);
				try {
					fs.unlinkSync(global.output_dir + '/' + attachments[id]);
					//file removed
				} catch(err) {
					throw Error(`Cannot remove file due to ${err}`);
				}
			});
		});
	});

	return this;
};
