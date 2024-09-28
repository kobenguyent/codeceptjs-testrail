exports.config = {
	tests: '../scenario.js',
	output: '../output',
	helpers: {
		REST: {
			endpoint: 'https://reqres.in',
		}
	},
	include: {},
	bootstrap: null,
	mocha: {},
	name: 'codeceptjs-rest-demo',
	plugins: {
		testrail: {
			require: '../../index.js',
			enabled: true,
			host: 'http://localhost:3000',
			user: 'test',
			password: 'pass',
			suiteId: 1,
			projectId: 1,
			runId: 1,
			runName: 'Custom run name',
			debugLog: true,
			closeTestRun: false,
			testCase: {
				passed: { comment: 'PASS COMMENT' },
				failed: { comment: 'FAIL COMMENT' },
			},
			resultProcessor: (result) => ({ ...result, my_test_custom_field: 777 })
		}
	}
};
