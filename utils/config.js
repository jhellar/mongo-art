const yargs = require('yargs');
const fs = require('fs');
const path = require('path');

const argv = yargs
  .demandOption(['host', 'user', 'pass', 'env'])
  .default('prefix', 'mongo-art-')
  .default('runtime', 'node6')
  .default('domain', 'rhmap')
  .alias('h', 'host')
  .alias('u', 'user')
  .alias('p', 'pass')
  .alias('s', 'servicekey')
  .alias('e', 'env')
  .alias('r', 'runtime')
  .alias('x', 'prefix')
  .alias('d', 'domain')
  .describe('host', 'RHMAP host')
  .describe('user', 'RHMAP username')
  .describe('pass', 'RHMAP password')
  .describe('servicekey', 'MBaaS servicekey')
  .describe('env', 'RHMAP environment')
  .describe('runtime', 'Cloud App runtime')
  .describe('prefix', 'Prefix for artifacts')
  .describe('domain', 'RHMAP domain')
  .argv;

const config = {
  host: argv.host,
  user: argv.user,
  pass: argv.pass,
  servicekey: argv.servicekey,
  env: argv.env,
  runtime: argv.runtime,
  prefix: argv.prefix,
  domain: argv.domain
};

const configFile = path.resolve(__dirname, '../config.json');
fs.writeFileSync(configFile, JSON.stringify(config, null, 2));