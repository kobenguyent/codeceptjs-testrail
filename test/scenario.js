const { expect } = require('chai');
const { faker } = require('@faker-js/faker');
let userData;
const {I} = inject();

Feature('PUT tests');

Before(() => {
	userData = {
		name: faker.internet.userName(),
		job: 'leader'
	};

	I.sendPostRequest('/api/users', userData);
});

Scenario('Verify creating new user @C1', async () => {
	userData.name = faker.internet.userName();
	const res = await I.sendPutRequest('/api/users', userData);
	expect(res.data.name).to.eql(userData.name);
}).tag('@pass');

Scenario('Verify creating new user @C2', async () => {
	userData.name = faker.internet.userName();
	const res = await I.sendPutRequest('/api/users', userData);
	expect(res.data.name).to.eql('abc');
}).tag('@fail');
