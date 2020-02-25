const { exec } = require('child_process');
const { expect } = require('chai');
const runner = './node_modules/.bin/codeceptjs run scenario.js';
const emptyHostConfigFile = './test/config/empty.host.js';
const missingUser = './test/config/missing.user.js';
const missingPassword = './test/config/missing.password.js';
const missingProjectId = './test/config/missing.projectId.js';
const mockTestrailConfig = './test/config/mock.testrail.js';

describe('Incomplete info', () => {
	describe('Missing host', () => {
		it('should return error', (done) => {
			exec(`${runner} --grep @C1 -c ${emptyHostConfigFile} --verbose`, (err, stdout, stderr) => {
				expect(stdout).to.include('Please provide proper Testrail host or credentials');
				done();
			});
		});
	});

	describe('Missing user', () => {
		it('should rerun error', (done) => {
			exec(`${runner} --grep @C1 -c ${missingUser} --verbose`, (err, stdout, stderr) => {
				expect(stdout).to.include('Please provide proper Testrail host or credentials');
				done();
			});
		});
	});

	describe('Missing password', () => {
		it('should rerun error', (done) => {
			exec(`${runner} --grep @C1 -c ${missingPassword} --verbose`, (err, stdout, stderr) => {
				expect(stdout).to.include('Please provide proper Testrail host or credentials');
				done();
			});
		});
	});

	describe('Missing project id', () => {
		it('should rerun error', (done) => {
			exec(`${runner} --grep @C1 -c ${missingProjectId} --verbose`, (err, stdout, stderr) => {
				expect(stdout).to.include('Please provide project id in config file');
				done();
			});
		});
	});

});

describe('Valid config file', () => {
	describe('Add run and test result', () => {
		it('should update the results on passed case', (done) => {
			exec(`${runner} --grep @pass -c ${mockTestrailConfig} --verbose`, (err, stdout, stderr) => {
				expect(stdout).to.include('The run with id: 1 is updated');
				expect(stdout).to.include('The case 1 on run 1 is updated');
				done();
			});
		});

		it('should update the results on failed case', (done) => {
			exec(`${runner} --grep @fail -c ${mockTestrailConfig} --verbose`, (err, stdout, stderr) => {
				expect(stdout).to.include('FAIL  | 0 passed, 1 failed');
				expect(stdout).to.include('The run with id: 1 is updated');
				expect(stdout).to.include('The case 2 on run 1 is updated');
				expect(stdout).to.include('The reponse is {"status_id":5,"comment":"This test is failed due to **expected \'Elias\' to deeply equal \'abc\'**","elapsed":"1s","id":2}');
				done();
			});
		});
	});
});
