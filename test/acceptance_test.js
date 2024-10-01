const { exec } = require('child_process');
const { expect } = require('chai');
const path = require('path');

const testrailPlugin = require('../index.js');

const runner = `${path.resolve('./node_modules/.bin/codeceptjs')} run`;
const mockTestrailConfigs = {
	general: './test/config/mock.testrail.js',
	processor: './test/config/mockProcess.testrail.js'
};


describe('Incomplete info', () => {
	const mainConfig = {
		require: '../../index.js',
		host: 'https://peterngtr1.testrail.io',
		user: 'user',
		password: 'pass',
		suiteId: 1,
		projectId: '99',
		runName: 'Custom run name',
		enabled: true
	};

	describe('Missing host', () => {
		it('should throw error', () => {
			expect(() => testrailPlugin())
				.to.throw('Please provide proper Testrail host');
		});
	});

	describe('Missing user', () => {
		it('should throw error', () => {
			expect(() => testrailPlugin({ ...mainConfig, user: '' }))
				.to.throw('Please provide proper Testrail user');
		});
	});

	describe('Missing password', () => {
		it('should throw error', () => {
			expect(() => testrailPlugin({ ...mainConfig, password: '' }))
				.to.throw('Please provide proper Testrail password');
		});
	});

	describe('Missing project id', () => {
		it('should throw error', () => {
			expect(() => testrailPlugin({ ...mainConfig, projectId: '' }))
				.to.throw('Please provide project id in config file');
		});
	});

	describe('Wrong resultProcessor value', () => {
		it('should throw error for Number', () => {
			expect(() => testrailPlugin({ ...mainConfig, resultProcessor: 1 }))
				.to.throw('Result processor (`resultProcessor` config option) has to be function');
		});

		it('should throw error for String', () => {
			expect(() => testrailPlugin({ ...mainConfig, resultProcessor: 'string value' }))
				.to.throw('Result processor (`resultProcessor` config option) has to be function');
		});

		it('should throw error for Object', () => {
			expect(() => testrailPlugin({ ...mainConfig, resultProcessor: {} }))
				.to.throw('Result processor (`resultProcessor` config option) has to be function');
		});
	});
});

describe('Valid config file', () => {
	describe('Add run and test result', () => {
		it('should update the results on passed case', (done) => {
			exec(`${runner} --grep "@pass" -c "${mockTestrailConfigs.general}"`, (err, stdout) => {
				expect(stdout).to.include('addRun: SUCCESS - the request data is {"suite_id":1,"name":"Custom run name","include_all":false}');
				expect(stdout).to.include('addRun: SUCCESS - the response data is {"suite_id":1,"name":"Custom run name","include_all":false,"id":1}');
				done();
			});
		});

		it('should update the results on failed case', (done) => {
			exec(`${runner} --grep "@fail" -c "${mockTestrailConfigs.general}"`, (err, stdout) => {
				expect(stdout).to.include('FAIL  | 0 passed, 1 failed');
				expect(stdout).to.include('addRun: SUCCESS - the request data is {"suite_id":1,"name":"Custom run name","include_all":false}');
				expect(stdout).to.include('addRun: SUCCESS - the response data is {"suite_id":1,"name":"Custom run name","include_all":false,"id":2}');
				done();
			});
		});

		it('should call resultProcessor for passed case', (done) => {
			exec(`${runner} --grep "@pass" -c "${mockTestrailConfigs.processor}"`, (err, stdout) => {
				expect(stdout).to.include('addResultsForCases: SUCCESS - the request data is {"results":[{"case_id":"1","elapsed":"1s","comment":"FAIL COMMENT","status_id":5,"version":"1","my_test_custom_field":777}]}');
				done();
			});
		});

		it('should call resultProcessor for failed case', (done) => {
			exec(`${runner} --grep "@fail" -c "${mockTestrailConfigs.processor}"`, (err, stdout) => {
				expect(stdout).to.include('addResultsForCases: SUCCESS - the request data is {"results":[{"case_id":"2","elapsed":"1s","comment":"FAIL COMMENT","status_id":5,"version":"1","my_test_custom_field":777}]}');
				done();
			});
		});
	});
});
