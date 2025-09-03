exports.config = {
	tests: '../integration_scenario.js',
	output: '../output',
	helpers: {},
	include: {},
	bootstrap: null,
	mocha: {},
	name: 'codeceptjs-rest-demo',
	plugins: {
		testrail: {
			require: '../../index.js',
			host: 'http://localhost:3000',
			user: 'test',
			password: 'pass',
			suiteId: 1,
			projectId: 1,
			runName: 'Custom run name',
			enabled: true,
			debugLog: true,
		}
	}
};
