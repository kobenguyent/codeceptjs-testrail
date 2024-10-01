module.exports = {
	env: {
		browser: true,
		es6: true,
		node: true,
		mocha: true
	},
	extends: ['eslint:recommended', 'plugin:codeceptjs/recommended'],
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 2020
	},
	rules: {
		indent: [
			'error',
			'tab'
		],
		'linebreak-style': [
			'error',
			'unix'
		],
		quotes: [
			'error',
			'single'
		],
		semi: [
			'error',
			'always'
		],
		'no-control-regex': 0
	}
};