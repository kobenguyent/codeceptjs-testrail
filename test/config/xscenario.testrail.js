exports.config = {
	tests: '../no_tags_scenario.js',
	output: '../output',
	helpers: {
		REST: {
			endpoint: 'https://reqres.in',
		}
	},
	include: {},
	bootstrap: null,
	mocha: {},
	name: 'codeceptjs-no-tags-test',
	plugins: {
		testrail: {
			require: '../../index.js',
			host: 'http://localhost:3000',
			user: 'test',
			password: 'pass',
			suiteId: 1,
			projectId: 1,
			runName: 'No Tags Test Run',
			enabled: true,
			debugLog: true,
		}
	}
};