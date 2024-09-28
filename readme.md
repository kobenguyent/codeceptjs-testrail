[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/peternguyew)
[![Donate with PayPal](https://img.shields.io/badge/Donate-PayPal-blue.svg)](https://paypal.me/peternguyentr?country.x=DE&locale.x=en_US)

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/e935df05fa244cf1bf435c3f59a66fe4)](https://www.codacy.com/manual/PeterNgTr/codeceptjs-testrail?utm_source=github.com&utm_medium=referral&utm_content=PeterNgTr/codeceptjs-testrail&utm_campaign=Badge_Grade)
![npm](https://img.shields.io/npm/v/codeceptjs-testrail?color=light%20green) 

[![NPM Package Publish](https://github.com/kobenguyent/codeceptjs-testrail/actions/workflows/npm-publish.yml/badge.svg)](https://github.com/kobenguyent/codeceptjs-testrail/actions/workflows/npm-publish.yml)
[![Tests](https://github.com/kobenguyent/codeceptjs-testrail/actions/workflows/run-tests.yml/badge.svg)](https://github.com/kobenguyent/codeceptjs-testrail/actions/workflows/run-tests.yml)


## Introduction

Testrail CodeceptJS Integration. The test run is created automatically after the test execution. The screenshots of failed tests are also attached to test results.

![Attachemnt for failed case](http://g.recordit.co/ajaa2QRlnW.gif)

New feature, add the configuration to test run of test plan
![Attachemnt for failed case](http://g.recordit.co/uQLvQUq7cT.gif)

## Requirement

Install to use this custom plugin

```sh
npm i codeceptjs-testrail --save
```

**Note:**

- You should provide the test case id to make it works, otherwise, this plugin has no clue which case id to be added to test run on Testrail.

**An example:**

```js
// ...
  Scenario('Search function is displayed @C12345', ({I, homePage}) => {
    I.seeElement(homePage.searchTextbox);
    I.seeElement(homePage.searchButton);
  });
// ...
```

```sh
npx codeceptjs run-workers 3
```

#### Data driven tests

If you want to have different Data-driven test cases with different IDs in Testrail for each iteration of the test you will need to populate the Data object with your a tag. This works because CodeceptJS extracts tags from test names, and data for Data-driven tests is populated in the test name.

**An example:**

```js
// ...
  let accounts = new DataTable(['testRailTag', 'user', 'password']);
  accounts.add(['@C12345', 'davert', '123456']); // add a tag for each user along with their test data
  accounts.add(['@C45678', 'admin', '123456']);
  
  Data(accounts).Scenario('Test Login', ({ I, current }) => {
    I.fillField('Username', current.login); // current is reserved!
    I.fillField('Password', current.password);
    I.click('Sign In');
    I.see('Welcome '+ current.login);
  });
// ...
```

**A Gherkin example:**

```gherkin
  @smoke
  @12345
  Scenario: Search function is displayed
    Given I am on the home page
    Then I see search textbox
    And I see search button
```

**Note:**

TestRail tag in **Examples** from **Scenario Outline** available from version `1.7.4` and above

```gherkin
  @someTag
  Scenario Outline: Fill some field
    When I fill some field by text <text>
    Then I see text <text>
  
    Examples:
      | testRailTag | text      |
      | @C1234      | someText1 |
      | @C1235      | someText2 |
```

## Configuration

Add this plugin to config file:

```js
// ...
plugins: {
  // ...
  testrail: {
    require: 'codeceptjs-testrail',
    host: 'https://kobenguyent.testrail.io',
    user: 'username',
    password: 'password or api key',
    suiteId: 1,
    projectId: 1,
    runName: 'Custom run name',
    runId: 123,
    plan: {
      existingPlanId: 484,
      name: 'Custom Plan name',
      description: 'Something about your plan',
    },
    configuration: {
      groupName: 'macos',
      configName: 'leopard'
    },
    testCase: {
      passed: { status_id: 1, comment: 'This is passed on build 123' },
      failed: { status_id: 5, comment: 'This is failed on build 123' },
    },
    enabled: true,
    closeTestRun: true,
    skipInfo: {
      message: "Skipped due to failure in 'before' hook"
    },
    version: '1',
    resultProcessor: (testResult, { testCase, allResults, allTestCases }) => {
      if (testResult.status_id == 7) {
        // do not publish
        return null;
      }
      const additionFields = {};
      if (testResult.status_id == 1) {
        additionFields.custom_testrail_field_1 = 'OK';
      }
      return { ...testResult, ...additionFields, custom_testrail_field_222: 2 };
    }
  }
  // ...
}
// ...
```

### Possible config options:

| config name           | required | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
|-----------------------| -------- |-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| suiteId               | yes      | When your project is not under the single-suite mode,`suiteId` is needed. When you don't provide the `suiteId`, the first `suiteId` will be used as default.                                                                                                                                                                                                                                                                                                                        |
| projectId             | yes      | The project Id which is from the Testrail. This should be provided to make this plugin works                                                                                                                                                                                                                                                                                                                                                                                        |
| prefixTag             | no       | By default it is set to`'@C'`                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| runName               | no       | Your desired test run name. If you done provide this test run name, default test run name is as`This is a new test run on ${dd/mm/yyy H:M}` which is current day.                                                                                                                                                                                                                                                                                                                   |
| runId                 | no       | Provide the existing run Id when you want to update the existing one instead of creating new testrun.                                                                                                                                                                                                                                                                                                                                                                               |
| plan - existingPlanId | no       | If you provide an existing plan ID, the new test run is added to that test plan. Otherwise, new test plan is created and new test run is added to that test plan.                                                                                                                                                                                                                                                                                                                   |
| plan - name           | no       | Your desired plan name.                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| plan - description    | no       | Your desired description to your test plan.                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| plan - onlyCaseIds    | no       | If `true` it will consider only test cases that actually run while posting results to testrail                                                                                                                                                                                                                                                                                                                                                                                      |
| testCase              | no       | If you configured testrail to use custom test case statuses, you can override default status_id with yours, or your custom comment.                                                                                                                                                                                                                                                                                                                                                 |
| configuration         | no       | Provide the created configuration group name - configuration name that you want to add to the test run. If you don't provide anything or wrong either group name or config name, there will be no configuration added to test run.                                                                                                                                                                                                                                                  |
| debugLog              | no       | Show more logs for debugging purposes.                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| closeTestRun          | no       | If you wish to close the test run afterwards,by default test run is not closed afterwards.                                                                                                                                                                                                                                                                                                                                                                                          |
| skipInfo - message    | no       | Message to comment for skipped cases                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| version               | no       | Build version. E.g. `version: packageJson.version`                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| resultProcessor       | no       | `function(testResult, { testCase, allResults, allTestCases })`.<br/>It is expected to return test result object (you could add/replace in this object any required [custom fields](https://support.testrail.com/hc/en-us/articles/7373850291220-Configuring-custom-fields) to follow your [Testrail configuration](https://support.testrail.com/hc/en-us/articles/7077871398036-Result-Fields)).<br/>If this function returns `null` then this result will not be sent to Testrail. |

## Contributing

[Read here](./.github/CONTRIBUTING.md)