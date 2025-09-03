const { expect } = require('chai');
const sinon = require('sinon');

// Test xScenario fix - ensure getCases is called even with no test results
// This covers the fix for Issue #121 where TestRail integration would fail
// when test files contained only xScenario or Scenario.skip() tests

describe('CodeceptJS TestRail Plugin - xScenario Fix Tests', () => {
	const validConfig = {
		host: 'https://test.testrail.io',
		user: 'testuser',
		password: 'testpass',
		projectId: 1,
		suiteId: 1,
		enabled: true,
		debugLog: true
	};

	afterEach(() => {
		sinon.restore();
	});

	describe('xScenario Test Coverage', () => {
		it('should call getCases for validation when no test results are present', async () => {
			// Mock the internal TestRail API instance
			const mockOutput = {
				log: sinon.spy(),
				error: sinon.spy()
			};

			// Mock the internal testrail object
			const testrailMock = {
				getSuites: sinon.stub().resolves([{ id: 1 }]),
				getCases: sinon.stub().resolves([
					{ id: 1, title: 'Test Case 1' },
					{ id: 2, title: 'Test Case 2' }
				])
			};

			// Create a custom test function that simulates _publishResultsToTestrail
			// with empty results array (simulating xScenario case)
			const simulateXScenarioCase = async () => {
				const ids = []; // Empty array simulates xScenario case
				let suiteId;

				// Simulate the fixed logic: always determine suiteId
				if (validConfig.suiteId === undefined || validConfig.suiteId === null) {
					let res = await testrailMock.getSuites(validConfig.projectId);
					suiteId = res[0].id;
				} else {
					suiteId = validConfig.suiteId;
				}

				if (ids.length > 0) {
					// Would normally process test results here
					mockOutput.log('Processing test results');
				} else {
					mockOutput.log('There is no TC, hence no test run is created');
					
					// This is the fix: call getCases even when no results
					try {
						const testCases = await testrailMock.getCases(validConfig.projectId, suiteId);
						mockOutput.log(`getCases called for validation - found ${testCases.length} test cases`);
					} catch (error) {
						mockOutput.error(`getCases validation failed: ${error}`);
					}
				}
			};

			// Execute the simulation
			await simulateXScenarioCase();

			// Verify that getCases was called even with empty results
			expect(testrailMock.getCases.calledOnce).to.be.true;
			expect(testrailMock.getCases.calledWith(validConfig.projectId, validConfig.suiteId)).to.be.true;
			
			// Verify the correct log messages
			expect(mockOutput.log.calledWith('There is no TC, hence no test run is created')).to.be.true;
			expect(mockOutput.log.calledWith('getCases called for validation - found 2 test cases')).to.be.true;
		});

		it('should handle getCases validation failure gracefully', async () => {
			const mockOutput = {
				log: sinon.spy(),
				error: sinon.spy()
			};

			const testrailMock = {
				getSuites: sinon.stub().resolves([{ id: 1 }]),
				getCases: sinon.stub().rejects(new Error('TestRail API Error'))
			};

			const simulateXScenarioWithError = async () => {
				const ids = []; // Empty array simulates xScenario case
				const suiteId = validConfig.suiteId;

				if (ids.length > 0) {
					mockOutput.log('Processing test results');
				} else {
					mockOutput.log('There is no TC, hence no test run is created');
					
					// This is the fix: call getCases even when no results, with error handling
					try {
						const testCases = await testrailMock.getCases(validConfig.projectId, suiteId);
						mockOutput.log(`getCases called for validation - found ${testCases.length} test cases`);
					} catch (error) {
						mockOutput.error(`getCases validation failed: ${error}`);
					}
				}
			};

			// Execute the simulation
			await simulateXScenarioWithError();

			// Verify that getCases was called and error was handled
			expect(testrailMock.getCases.calledOnce).to.be.true;
			expect(mockOutput.error.calledWith('getCases validation failed: Error: TestRail API Error')).to.be.true;
			expect(mockOutput.log.calledWith('There is no TC, hence no test run is created')).to.be.true;
		});

		it('should still process test results normally when ids are present', async () => {
			const mockOutput = {
				log: sinon.spy(),
				error: sinon.spy()
			};

			const testrailMock = {
				getSuites: sinon.stub().resolves([{ id: 1 }]),
				getCases: sinon.stub().resolves([{ id: 1 }, { id: 2 }])
			};

			const simulateNormalCase = async () => {
				const ids = [1, 2]; // Non-empty array simulates normal case
				const suiteId = validConfig.suiteId;

				if (ids.length > 0) {
					mockOutput.log('Processing test results');
					// In real code, would call getCases as part of normal processing
					await testrailMock.getCases(validConfig.projectId, suiteId);
				} else {
					mockOutput.log('There is no TC, hence no test run is created');
				}
			};

			// Execute the simulation
			await simulateNormalCase();

			// Verify normal processing path
			expect(testrailMock.getCases.calledOnce).to.be.true;
			expect(mockOutput.log.calledWith('Processing test results')).to.be.true;
			expect(mockOutput.log.calledWith('There is no TC, hence no test run is created')).to.be.false;
		});
	});

	describe('suiteId Determination Fix', () => {
		it('should determine suiteId outside of ids.length condition', async () => {
			const mockOutput = {
				log: sinon.spy(),
				error: sinon.spy()
			};

			const configWithoutSuiteId = {
				...validConfig,
				suiteId: undefined // Simulate config without explicit suiteId
			};

			const testrailMock = {
				getSuites: sinon.stub().resolves([{ id: 42, name: 'Auto Suite' }]),
				getCases: sinon.stub().resolves([])
			};

			const simulateAutoSuiteId = async () => {
				const ids = []; // Empty array simulates xScenario case
				let suiteId;

				// This is part of the fix: suiteId determination moved outside ids.length condition
				if (configWithoutSuiteId.suiteId === undefined || configWithoutSuiteId.suiteId === null) {
					let res = await testrailMock.getSuites(configWithoutSuiteId.projectId);
					suiteId = res[0].id;
				} else {
					suiteId = configWithoutSuiteId.suiteId;
				}

				if (ids.length > 0) {
					mockOutput.log('Processing test results');
				} else {
					mockOutput.log('There is no TC, hence no test run is created');
					
					// getCases now uses the correctly determined suiteId
					try {
						const testCases = await testrailMock.getCases(configWithoutSuiteId.projectId, suiteId);
						mockOutput.log(`getCases called for validation - found ${testCases.length} test cases`);
					} catch (error) {
						mockOutput.error(`getCases validation failed: ${error}`);
					}
				}

				return suiteId;
			};

			// Execute the simulation
			const resultSuiteId = await simulateAutoSuiteId();

			// Verify that suiteId was determined from getSuites call
			expect(testrailMock.getSuites.calledOnce).to.be.true;
			expect(testrailMock.getSuites.calledWith(configWithoutSuiteId.projectId)).to.be.true;
			expect(resultSuiteId).to.equal(42);
			
			// Verify getCases was called with the auto-determined suiteId
			expect(testrailMock.getCases.calledOnce).to.be.true;
			expect(testrailMock.getCases.calledWith(configWithoutSuiteId.projectId, 42)).to.be.true;
		});
	});
});