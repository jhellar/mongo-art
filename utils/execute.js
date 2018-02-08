
const util = require('util');
const exec = util.promisify(require('child_process').exec);

async function execute(command) {
    const { stdout } = await exec(command);
    return stdout.slice(0, -1);
  }

module.exports = {
    getStdout: execute,
    getProcess: require('child_process').exec
};