const colors = require('chalk');

const styles = {
	error: colors.bgRed.white.bold,
	log: colors.grey,
};

let showLog = false;

module.exports = {
	colors,
	styles,

	showDebugLog(flag = false) {
		showLog = flag;
		return showLog;
	},

	log(msg) {
		if (showLog) {
			console.log(styles.log(msg));
		}
	},

	error(msg) {
		console.log(styles.error(msg));
	},
};