const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const output = require('../lib/output');

class TestRail {
	constructor(defaultConfig) {
		this.host = defaultConfig.host;
		this.user = defaultConfig.user;
		this.password = defaultConfig.password;
		this.uri = '/index.php?/api/v2/';

		const b = new Buffer(`${this.user}:${this.password}`);
		const basicAuth = b.toString('base64');

		this.axios = axios.create({
			baseURL: this.host + this.uri,
			headers: {Authorization: `Basic ${basicAuth}`, 'content-type': 'application/json'}
		});
	}

	async getCases(projectId, suiteId) {
		let fullArr = [];
		try {
			const res = await this.axios.get(`get_cases/${projectId}&suite_id=${suiteId}`);
			output.log(`getCases: SUCCESS - the response data is ${JSON.stringify(res.data)}`);
			if (res.data.cases === undefined) {
				return res.data;
			} else {
				let isLimit = false;
				let offset = 250;
				fullArr = res.data.cases;
				//limit logic works only if we suspect that api call send back limited array === 250 cases
				if(res.data.cases.length === offset){
					isLimit = true;
					while (isLimit === true) {
						const restOffset = await this.axios.get(`get_cases/${projectId}&suite_id=${suiteId}&offset=${offset}`);
						if (restOffset.data.cases !== 0) {
							restOffset.data.cases.forEach(item=> {
								fullArr.push(item);
							});
						}
						if (restOffset.data.cases.length < 250) {
							isLimit = false;
						} else {
							offset = offset+250;
						}
					}
				}
				return fullArr;
			}
		} catch (error) {
			const parsedError = error && error.response && error.response.data ? error.response.data.error : error;
			output.error(`getCases: ERROR - cannot get results for projectId:${projectId} due to ${parsedError}`);
		}
	}

	async addPlan(projectId, data) {
		try {
			const res = await this.axios.post('add_plan/' + projectId, data);
			output.log(`addPlan: SUCCESS - the request data is ${JSON.stringify(data)}`);
			output.log(`addPlan: SUCCESS - the response data is ${JSON.stringify(res.data)}`);
			return res.data;
		} catch (error) {
			const parsedError = error && error.response && error.response.data ? error.response.data.error : error;
			output.error(`addPlan: ERROR - cannot add plan to projectId:${projectId} due to ${parsedError}`);
			output.error(`addPlan: ERROR - request data was ${JSON.stringify(data)}`);
		}
	}

	async addPlanEntry(planId, data) {
		try {
			const res = await this.axios.post('add_plan_entry/' + planId, data);
			output.log(`addPlanEntry: SUCCESS - the request data is ${JSON.stringify(data)}`);
			output.log(`addPlanEntry: SUCCESS - the response data is ${JSON.stringify(res.data)}`);
			return res.data;
		} catch (error) {
			const parsedError = error && error.response && error.response.data ? error.response.data.error : error;
			output.error(`addPlanEntry: ERROR - cannot add plan entry to planId:${planId} due to ${parsedError}`);
			output.error(`addPlanEntry: ERROR - request data was ${JSON.stringify(data)}`);
		}
	}

	async getSuites(projectId) {
		try {
			const res = await this.axios.get('get_suites/' + projectId);
			output.log(`getSuites: SUCCESS - the response data is ${JSON.stringify(res.data)}`);
			return res.data;
		} catch (error) {
			const parsedError = error && error.response && error.response.data ? error.response.data.error : error;
			output.error(`getSuites: ERROR - cannot get suites for projectId:${projectId} due to ${parsedError}`);
		}
	}

	async getConfigs(projectId) {
		try {
			const res = await this.axios.get('get_configs/' + projectId);
			output.log(`getConfigs: SUCCESS - the response data is ${JSON.stringify(res.data)}`);
			return res.data;
		} catch (error) {
			const parsedError = error && error.response && error.response.data ? error.response.data.error : error;
			output.error(`getConfigs: ERROR - cannot get configs for projectId:${projectId} due to ${parsedError}`);
		}
	}

	async addRun(projectId, data) {
		try {
			const res = await this.axios.post('add_run/' + projectId, data);
			output.log(`addRun: SUCCESS - the request data is ${JSON.stringify(data)}`);
			output.log(`addRun: SUCCESS - the response data is ${JSON.stringify(res.data)}`);
			return res.data;
		} catch (error) {
			const parsedError = error && error.response && error.response.data ? error.response.data.error : error;
			output.error(`addRun: ERROR - cannot add run to projectId:${projectId} due to ${parsedError}`);
			output.error(`addRun: ERROR - request data was ${JSON.stringify(data)}`);
		}
	}

	async updateRun(runId, data) {
		try {
			const res = await this.axios.post('update_run/' + runId, data);
			output.log(`updateRun: SUCCESS - the request data is ${JSON.stringify(data)}`);
			output.log(`updateRun: SUCCESS - the response data is ${JSON.stringify(res.data)}`);
			return res.data;
		} catch (error) {
			const parsedError = error && error.response && error.response.data ? error.response.data.error : error;
			output.error(`updateRun: ERROR - cannot update run for runId:${runId} due to ${parsedError}`);
			output.error(`updateRun: ERROR - request data was ${JSON.stringify(data)}`);
		}
	}

	async getRun(runId) {
		try {
			const res = await this.axios.get('get_run/' + runId);
			output.log(`updateRun: SUCCESS - the request data is runId:${runId}`);
			output.log(`updateRun: SUCCESS - the response data is ${JSON.stringify(res.data)}`);
			return res.data;
		} catch (error) {
			const parsedError = error && error.response && error.response.data ? error.response.data.error : error;
			output.error(`updateRun: ERROR - cannot get run for runId:${runId} due to ${parsedError}`);
		}
	}

	async getResultsForCase(runId, caseId) {
		return this.axios.get(`get_results_for_case/${runId}/${caseId}`).then((res) => {
			output.log(`getResultsForCase: SUCCESS - the response data is ${JSON.stringify(res.data)}`);
			return res.data.results;
		}).catch(error => {
			const parsedError = error && error.response && error.response.data ? error.response.data.error : error;
			output.error(`getResultsForCase: ERROR - cannot get results for caseId:${caseId} on runId:${runId} due to ${parsedError}`);
		});
	}

	async addResultsForCases(runId, data) {
		return this.axios.post('add_results_for_cases/' + runId, data).then((res) => {
			output.log(`addResultsForCases: SUCCESS - the request data is ${JSON.stringify(data)}`);
			output.log(`addResultsForCases: SUCCESS - response data is ${JSON.stringify(res.data)}`);
			return res.data;
		}).catch(error => {
			const parsedError = error && error.response && error.response.data ? error.response.data.error : error;
			output.error(`addResultsForCases: ERROR - cannot add result for case due to ${parsedError}`);
			output.error(`addResultsForCases: ERROR - request data was ${JSON.stringify(data)}`);
		});
	}

	async addAttachmentToResult(resultId, imageFile) {
		let form = new FormData();
		form.append('attachment', fs.createReadStream(path.join(global.output_dir, imageFile.toString())));

		await this.axios({
			method: 'post',
			data: form,
			url: 'add_attachment_to_result/' + resultId,
			headers: form.getHeaders()
		}).catch(error => {
			const parsedError = error && error.response && error.response.data ? error.response.data.error : error;
			output.error(`addAttachmentToResult: ERROR - cannot add attachment due to ${parsedError}`);
			output.error(`addAttachmentToResult: ERROR - request data was ${JSON.stringify(form)}`);
		});
	}

	async closeTestRun(runId) {
		return this.axios.post('close_run/' + runId).then((res) => {
			output.log(`close run ${runId}: SUCCESS - response data is ${JSON.stringify(res.data)}`);
			return res.data;
		}).catch(error => {
			const parsedError = error && error.response && error.response.data ? error.response.data.error : error;
			output.error(`close run ${runId}: ERROR - cannot close run due to ${parsedError}`);
		});
	}
}

module.exports = TestRail;
