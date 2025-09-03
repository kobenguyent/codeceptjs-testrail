const { expect } = require('chai');

Feature('TestRail Integration Tests');

Scenario('Test case that fails with pass tag @C1', async () => {
	// This test is tagged @pass but designed to fail
	expect(1).to.equal(2);
}).tag('@pass');

Scenario('Test case that fails @C2', async () => {
	// Simple test that always fails
	expect(1).to.equal(2);
}).tag('@fail');