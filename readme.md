##### Testrail
 
  Enables Testrail integration.
 
  ##### Configuration
 
  Add this plugin to config file:
 
  ```js
 "plugins": {
     "testrail": {
        host: 'https://peternguyentr.testrail.io',
        user: 'username',
        password: 'password or api key'
        projectId: 1,
        runName: 'Custom run name',
        enabled: true
  }
 }
 ```
 
  Possible config options:
 
 `projectId`: The project Id which is from the Testrail - Required. This should be provided to make this plugin works
 `runName`: your desired test run name - Optional. If you done provide this test run name, default test run name is as `This is a new test run on ${dd/mm/yyy}` which is current day.
 
  ### Parameters
 
  -   `config`