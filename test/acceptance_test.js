const { exec } = require('child_process');
const { expect } = require('chai');
const runner = './node_modules/.bin/codeceptjs run';
const mockTestrailConfig = './test/config/mock.testrail.js';
const testrailPlugin = require('../index.js');

describe('Incomplete info', () => {

	describe('Missing host', () => {
		it('should return error', () => {
			try {
				testrailPlugin();
			} catch (e) {
				expect(e.message).contain('Please provide proper Testrail host or credentials');
			}
		});
	});

	describe('Missing user', () => {
		it('should rerun error', () => {
			try {
				testrailPlugin({
					require: '../../index.js',
					host: 'https://peterngtr1.testrail.io',
					user: '',
					password: 'pass',
					suiteId: 1,
					projectId: 1,
					runName: 'Custom run name',
					enabled: true
				});
			} catch (e) {
				expect(e.message).contain('Please provide proper Testrail host or credentials');
			}
		});
	});

	describe('Missing password', () => {
		it('should rerun error', () => {
			try {
				testrailPlugin({
					require: '../../index.js',
					host: 'https://peterngtr1.testrail.io',
					user: 'user',
					password: '',
					suiteId: 1,
					projectId: 1,
					runName: 'Custom run name',
					enabled: true
				});
			} catch (e) {
				expect(e.message).contain('Please provide proper Testrail host or credentials');
			}
		});
	});

	describe('Missing project id', () => {
		it('should rerun error', () => {
			try {
				testrailPlugin({
					require: '../../index.js',
					host: 'https://peterngtr1.testrail.io',
					user: 'user',
					password: 'pass',
					suiteId: 1,
					projectId: '',
					runName: 'Custom run name',
					enabled: true
				});
			} catch (e) {
				expect(e.message).contain('Please provide project id in config file');
			}
		});
	});

});

describe('Valid config file', () => {
	describe('Add run and test result', () => {
		it('should update the results on passed case', (done) => {
			exec(`${runner} --grep @pass -c ${mockTestrailConfig}`, (err, stdout) => {
				expect(stdout).to.include('The run with id: 1 is updated');
				expect(stdout).to.include('The run 1 is updated with');
				expect(stdout).to.include('"status_id":1');
				done();
			});
		});

		it('should update the results on failed case', (done) => {
			exec(`${runner} --grep @fail -c ${mockTestrailConfig}`, (err, stdout) => {
				expect(stdout).to.include('FAIL  | 0 passed, 1 failed');
				expect(stdout).to.include('The case 2 on run 2 is updated');
				expect(stdout).to.include('"status_id":5');
				done();
			});
		});
	});
});
