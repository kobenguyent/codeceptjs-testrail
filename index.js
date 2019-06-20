const event = require('codeceptjs').event;
const Testrail = require('testrail-api');

const defaultConfig = {
	host: '',
	user: '',
	password: '',
};

const testCase = {
	passed: { status_id: 1, comment: 'This test passed' },
	failed: { status_id: 5, comment: 'This test failed' },
};
const tcRegex = /(\@[C])\w+/g;

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

module.exports = (config) => {
	config = Object.assign(defaultConfig, config);

	if (config.host === '' || config.user === '' || config.password === '') throw new Error('Please provide proper Testrail host or credentials');
	if (!config.projectId) throw new Error('Please provide project id');

	const testrail = new Testrail(config);

	let suiteId;
	let runName;
	let runId;
	let caseId;

	runName = config.runName ? config.runName : `This is a new test run on ${getToday()}`;

	function _addTestRun(projectId, suiteId, runName) {
		testrail.addRun(projectId, { suite_id: suiteId, name: runName }, (err, response, run) => {
			if (err) throw new Error(`Something is wrong while adding new run with name ${runName}. Please check ${JSON.stringify(err)}`);
			runId = run.id;
		});
	}

	if (config.suiteId === undefined || config.suiteId === null) {
		testrail.getSuites(config.projectId, function (err, response, suites) {
			if (err) throw new Error(`Something is wrong while getting suites of project ID: ${config.projectId}. Please check ${JSON.stringify(err)}`);
			suiteId = suites[0].id;
			_addTestRun(config.projectId, suiteId, runName);
		});
	} else {
		suiteId = config.suiteId;
		_addTestRun(config.projectId, suiteId, runName);
	}

	event.dispatcher.on(event.test.started, (test) => {
		caseId = tcRegex.exec(test.title)[0].substring(2);
	});

	event.dispatcher.on(event.test.passed, (test) => {
		testrail.addResultForCase(runId, caseId, testCase.passed, (err) => {
			if (err) throw new Error(`Something is wrong while adding result for a test case ${test.title}. Please check ${JSON.stringify(err)}`);
		});
	});

	event.dispatcher.on(event.test.failed, () => {
		testrail.addResultForCase(runId, caseId, testCase.failed, (err) => {
			if (err) throw new Error(`Something is wrong while adding result for a test case ${test.title}. Please check ${JSON.stringify(err)}`);
		});
	});

	return this;
};
