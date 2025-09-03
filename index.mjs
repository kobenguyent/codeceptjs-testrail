import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const testrailPlugin = require('./index.js');
export default testrailPlugin;