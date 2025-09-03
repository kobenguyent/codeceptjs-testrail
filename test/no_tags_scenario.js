/* eslint-disable codeceptjs/no-skipped-tests */
const { expect } = require('chai');
const { faker } = require('@faker-js/faker');

const { I } = inject();

Feature('No TestRail tags tests');

let userData;

Before(() => {
	userData = {
		name: faker.internet.userName(),
		job: 'leader'
	};
});

// These xScenario tests have NO @C tags, so no test case IDs will be extracted
// This should trigger the else condition where ids.length === 0
xScenario('Skipped test without testrail tag', async () => {
	userData.name = faker.internet.userName();
	const res = await I.sendPutRequest('/api/users', userData);
	expect(res.data.name).to.eql(userData.name);
}).tag('@skip');

xScenario('Another skipped test without testrail tag', async () => {
	userData.name = faker.internet.userName();
	const res = await I.sendPutRequest('/api/users', userData);
	expect(res.data.name).to.eql('test');
}).tag('@skip');