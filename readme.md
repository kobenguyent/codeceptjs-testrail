[![Codacy Badge](https://api.codacy.com/project/badge/Grade/e935df05fa244cf1bf435c3f59a66fe4)](https://www.codacy.com/manual/PeterNgTr/codeceptjs-testrail?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=PeterNgTr/codeceptjs-testrail&amp;utm_campaign=Badge_Grade)
![npm](https://img.shields.io/npm/v/codeceptjs-testrail?color=light%20green) [![Greenkeeper badge](https://badges.greenkeeper.io/PeterNgTr/codeceptjs-testrail.svg)](https://greenkeeper.io/)

##### Testrail

Testrail integration with CodeceptJS is never simple like this. The test run is created automatically after the execution. The screenshots of failed tests are also attached to test results.

![Attachemnt for failed case](http://g.recordit.co/ajaa2QRlnW.gif)

Now there is new feature, add the configuration to test run of test plan
![Attachemnt for failed case](http://g.recordit.co/uQLvQUq7cT.gif)

##### Requirement

To use this custom plugin

```sh
npm i codeceptjs-testrail --save
```

**Note:**

- You should include the test case id to make it works, otherwise, this plugin has no clue which case id to be added to test run on Testrail.
- To avoid creating multiple testruns, add `--suites` to `run-workers` command

```sh
npx codeceptjs run-workers 3 --suites
```

An example:

```js
...
  Scenario('Search function is displayed @C12345', (I, homePage) => {
    I.seeElement(homePage.searchTextbox);
    I.seeElement(homePage.searchButton);
  });
...
```

##### Configuration

Add this plugin to config file:
  
```js
...
plugins: {
  testrail: {
    require: 'codeceptjs-testrail',
    host: 'https://peternguyentr.testrail.io',
    user: 'username',
    password: 'password or api key',
    suiteId: 1,
    projectId: 1,
    runName: 'Custom run name',
    plan: {
      existingPlanId: 484,
      name: 'Custom Plan name',
      description: 'Something about your plan',
    },
    configuration: {
      groupName: 'macos',
      configName: 'leopard'
    },
    enabled: true
  }
}
...
```

**Possible config options:**

- `suiteId`: when your project is not under the single-suite mode, `suiteId` is needed. When you don't provide the `suiteId`, the first `suiteId` will be used as default.
- `projectId` (Required): The project Id which is from the Testrail. This should be provided to make this plugin works
- `runName` (Optional): your desired test run name. If you done provide this test run name, default test run name is as `This is a new test run on ${dd/mm/yyy H:M}` which is current day.
- `plan - existingPlanId`: if you provide an existing plan ID, the new test run is added to that test plan. Otherwise, new test plan is created and new test run is added to that test plan.
- `plan - name`: your desired plan name.
- `plan - description`: your desired description to your test plan.
- `configuration`: provide the created configuration group name - configuration name that you want to add to the test run. If you don't provide anything or wrong either group name or config name, there will be no configuration added to test run.
- `debugLog`: show more logs for debugging purposes.
