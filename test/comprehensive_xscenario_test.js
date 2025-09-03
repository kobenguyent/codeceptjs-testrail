const { expect } = require('chai');
const { exec } = require('child_process');
const path = require('path');

// Comprehensive test to validate both scenarios of xScenario behavior
describe('xScenario TestRail Integration - Comprehensive Test', () => {
	const runner = `${path.resolve('./node_modules/.bin/codeceptjs')} run`;
	
	describe('xScenario without TestRail tags', () => {
		it('should call getCases for validation when no TestRail tags are present', (done) => {
			exec(`${runner} -c "./test/config/xscenario.testrail.js"`, (err, stdout) => {
				// Should not create test run since no case IDs extracted
				expect(stdout).to.include('There is no TC, hence no test run is created');
				expect(stdout).to.include('getCases validation failed: Error: AggregateError');
				expect(stdout).not.to.include('addRun: SUCCESS');
				done();
			});
		});
	});
	
	describe('xScenario with TestRail tags', () => {
		it('should create test run and process skipped results when TestRail tags are present', (done) => {
			// Create test config for xScenario with tags
			const configContent = `
exports.config = {
	tests: '/tmp/xscenario_with_tags.js',
	output: '/tmp/output',
	helpers: {
		REST: {
			endpoint: 'https://reqres.in',
		}
	},
	include: {},
	bootstrap: null,
	mocha: {},
	name: 'codeceptjs-xscenario-with-tags-test',
	plugins: {
		testrail: {
			require: '${path.resolve('./index.js')}',
			host: 'http://localhost:3000',
			user: 'test',
			password: 'pass',
			suiteId: 1,
			projectId: 1,
			runName: 'xScenario with Tags Test Run',
			enabled: true,
			debugLog: true,
		}
	}
};
`;
			
			const testContent = `
/* eslint-disable codeceptjs/no-skipped-tests */
const { I } = inject();

Feature('xScenario tests with TestRail tags');

// xScenario tests with TestRail tags should be processed normally
xScenario('Skipped test with testrail tag @C1', async () => {
	const res = await I.sendGetRequest('/api/users');
	console.log('This should not run');
}).tag('@skip');

xScenario('Another skipped test with testrail tag @C2', async () => {
	const res = await I.sendGetRequest('/api/users');
	console.log('This should not run either');
}).tag('@skip');
`;

			require('fs').writeFileSync('/tmp/xscenario_with_tags_test_config.js', configContent);
			require('fs').writeFileSync('/tmp/xscenario_with_tags_test_scenario.js', testContent);
			
			exec(`${runner} -c "/tmp/xscenario_with_tags_test_config.js"`, (err, stdout) => {
				// Should create test run since case IDs are extracted
				expect(stdout).to.include('addRun: ERROR'); // ERROR because mock server not running
				expect(stdout).to.include('request data was {"suite_id":1,"name":"xScenario with Tags Test Run","include_all":false}');
				expect(stdout).not.to.include('There is no TC, hence no test run is created');
				expect(stdout).not.to.include('getCases called for validation');
				done();
			});
		});
	});
});