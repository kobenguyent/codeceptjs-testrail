const { expect } = require('chai');
const faker = require('faker');
let userData;

Feature('PUT tests');

Before((I) => {
	userData = {
		name: faker.name.firstName(),
		job: 'leader'
	};

	I.sendPostRequest('/api/users', userData);
});

Scenario('Verify creating new user @C1', async (I) => {
	userData.name = faker.name.firstName();
	const res = await I.sendPutRequest('/api/users', userData);
	expect(res.data.name).to.eql(userData.name);
}).tag('@pass');

Scenario('Verify creating new user @C2', async (I) => {
	userData.name = faker.name.firstName();
	const res = await I.sendPutRequest('/api/users', userData);
	expect(res.data.name).to.eql('abc');
}).tag('@fail');
