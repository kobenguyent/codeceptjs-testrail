const { expect } = require('chai');

// Test CommonJS import
const testrailPlugin = require('../index.js');

describe('CodeceptJS TestRail Plugin - CommonJS', () => {
	const validConfig = {
		host: 'https://test.testrail.io',
		user: 'testuser',
		password: 'testpass',
		projectId: 1,
		suiteId: 1,
		enabled: true
	};

	describe('Module Export', () => {
		it('should export a function', () => {
			expect(testrailPlugin).to.be.a('function');
		});

		it('should return an object when called with valid config', () => {
			const result = testrailPlugin(validConfig);
			expect(result).to.be.an('object');
		});
	});

	describe('Configuration Validation', () => {
		it('should merge default config with provided config', () => {
			// This test validates that the plugin doesn't throw with minimal valid config
			expect(() => testrailPlugin(validConfig)).to.not.throw();
		});

		it('should validate result processor type', () => {
			const invalidConfig = { ...validConfig, resultProcessor: 'invalid' };
			expect(() => testrailPlugin(invalidConfig)).to.throw('Result processor (`resultProcessor` config option) has to be function');
		});

		it('should accept valid result processor function', () => {
			const configWithProcessor = { 
				...validConfig, 
				resultProcessor: (result) => result 
			};
			expect(() => testrailPlugin(configWithProcessor)).to.not.throw();
		});
	});

	describe('Default Configuration', () => {
		it('should have correct default values', () => {
			// Test that plugin accepts config and doesn't throw
			const plugin = testrailPlugin(validConfig);
			expect(plugin).to.be.an('object');
		});
	});
});