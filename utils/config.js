const yargs = require('yargs');
const fs = require('fs');
const path = require('path');

const argv = yargs
  .demandOption(['host', 'user', 'pass', 'env'])
  .default('prefix', 'mongo-art-')
  .default('runtime', 'node6113')
  .alias('h', 'host')
  .alias('u', 'user')
  .alias('p', 'pass')
  .alias('e', 'env')
  .alias('r', 'runtime')
  .alias('x', 'prefix')
  .describe('host', 'RHMAP host')
  .describe('user', 'RHMAP username')
  .describe('pass', 'RHMAP password')
  .describe('env', 'RHMAP environment')
  .describe('runtime', 'Cloud App runtime')
  .describe('prefix', 'Prefix for artifacts')
  .argv;

const config = {
  host: argv.host,
  user: argv.user,
  pass: argv.pass,
  env: argv.env,
  runtime: argv.runtime,
  prefix: argv.prefix
};

const configFile = path.resolve(__dirname, '../config.json');
fs.writeFileSync(configFile, JSON.stringify(config, null, 2));