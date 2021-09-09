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
		try {
			const res = await this.axios.get(`get_cases/${projectId}&suite_id=${suiteId}`);
			return res.data;
		} catch (error) {
			const parsedError = error && error.response && error.response.data ? error.response.data.error : error;
			output.error(`Cannot get cases for projectId:${projectId} & suiteId:${suiteId}, due to ${parsedError}`);
		}
	}

	async addPlan(projectId, data) {
		try {
			const res = await this.axios.post('add_plan/' + projectId, data);
			return res.data;
		} catch (error) {
			output.error(`Cannot add new plan due to ${error}`);
		}
	}

	async addPlanEntry(planId, data) {
		try {
			const res = await this.axios.post('add_plan_entry/' + planId, data);
			return res.data;
		} catch (error) {
			output.error(`Cannot add new test run to existing test plan due to ${error}`);
		}
	}

	async getSuites(projectId) {
		try {
			const res = await this.axios.get('get_suites/' + projectId);
			return res.data;
		} catch (error) {
			output.error(`Cannot get suites due to ${error}`);
		}
	}

	async getConfigs(projectId) {
		try {
			const res = await this.axios.get('get_configs/' + projectId);
			return res.data;
		} catch (error) {
			output.error(`Cannot get configs due to ${error}`);
		}
	}

	async addRun(projectId, data) {
		try {
			const res = await this.axios.post('add_run/' + projectId, data);
			return res.data;
		} catch (error) {
			output.error(`Cannot add new run due to ${error}`);
		}
	}

	async updateRun(runId, data) {
		try {
			const res = await this.axios.post('update_run/' + runId, data);
			output.log(`The run with id: ${runId} is updated`);
			return res.data;
		} catch (error) {
			const parsedError = error && error.response && error.response.data ? error.response.data.error : error;
			output.error(`Cannot update run due to ${parsedError}`);
			output.error(`Request data was: ${JSON.stringify(data)}`);
		}
	}

	async getResultsForCase(runId, caseId) {
		return this.axios.get(`get_results_for_case/${runId}/${caseId}`).then((res) => {
			output.log(`The response is ${JSON.stringify(res.data)}`);
			output.log(`The case ${caseId} on run ${runId} is updated`);
			return res.data;
		}).catch(error => {
			output.error(`Cannot get results for case ${caseId} on run ${runId} due to ${error}`);
		});
	}

	async addResultsForCases(runId, data) {
		return this.axios.post('add_results_for_cases/' + runId, data).then((res) => {
			output.log(`The response is ${JSON.stringify(res.data)}`);
			return res.data;
		}).catch(error => {
			const parsedError = error && error.response && error.response.data ? error.response.data.error : error;
			output.error(`Cannot add result for case due to ${parsedError}`);
			output.error(`Request data was: ${JSON.stringify(data)}`);
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
		}).catch(err => {
			output.error(`Cannot attach file due to ${err}`);
		});
	}
}

module.exports = TestRail;
