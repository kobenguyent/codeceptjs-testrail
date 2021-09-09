# Contributing

Thanks for getting here because you have a good will to improve CodeceptJS-testrail plugin we are always glad to help.

To start you need:

1.  Fork and clone the repo.
2.  Run `npm i` to install all required libraries
3.  Do the changes.
4.  Add/Update Test (if possible)
5.  Update documentation
6.  Commit and Push to your fork
7.  Make Pull Request

## Core Changes

Before applying any Core changes please raise an issue to discuss that change with core team.
Please try to add corresponding testcase to unit.

## Testing

Whenever you implemented a feature/bugfix

Start json server for tests:

```sh
npm run test-server
```

#### Run acceptance tests

```sh
npm run acceptance_test
```
Note: please check the db.json after the tests execution to not commit any changes.
