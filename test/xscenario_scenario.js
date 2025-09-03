/* eslint-disable codeceptjs/no-skipped-tests */
const { expect } = require('chai');
const { faker } = require('@faker-js/faker');

const { I } = inject();

Feature('xScenario tests');

let userData;

Before(() => {
	userData = {
		name: faker.internet.userName(),
		job: 'leader'
	};
});

// These scenarios use xScenario which should trigger the fix
// The plugin should still call getCases for validation even though no tests run
xScenario('Skipped test case 1 @C1', async () => {
	userData.name = faker.internet.userName();
	const res = await I.sendPutRequest('/api/users', userData);
	expect(res.data.name).to.eql(userData.name);
}).tag('@skip');

xScenario('Skipped test case 2 @C2', async () => {
	userData.name = faker.internet.userName();
	const res = await I.sendPutRequest('/api/users', userData);
	expect(res.data.name).to.eql('test');
}).tag('@skip');

// Test using Scenario.skip() syntax as well
Scenario.skip('Another skipped test @C3', async () => {
	const res = await I.sendGetRequest('/api/users');
	expect(res.status).to.eql(200);
}).tag('@skip');