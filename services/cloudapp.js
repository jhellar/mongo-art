const admZip = require('adm-zip');
const path = require('path');
const fs = require('fs');
const browser = require('browser-run');

function zipFolder(folder, zipFile) {
  const zip = new admZip();
  const cloudAppPath = folder;
  const cloudAppFiles = fs.readdirSync(cloudAppPath);
  cloudAppFiles
    .map(file => path.resolve(cloudAppPath, file))
    .forEach(file => zip.addLocalFile(file));
  zip.writeZip(zipFile);
}

function createFHConfigFile(clientApp, project, host, connection) {
  const config = {
    appid: clientApp.guid,
    appkey: clientApp.apiKey,
    apptitle: clientApp.title,
    connectiontag: connection.tag,
    host,
    projectid: project.guid
  };
  const fhConfigFile = path.resolve(__dirname, '../client_app/fhconfig.json');
  fs.writeFileSync(fhConfigFile, JSON.stringify(config, null, 2));
}

async function runClientApp() {
  const clientAppFolder = path.resolve(__dirname, '../client_app');
  const clientAppFile = path.resolve(clientAppFolder, 'index.js');
  await new Promise((resolve, reject) => {
    fs.createReadStream(clientAppFile)
    .pipe(browser({ node: true, basedir: clientAppFolder, ignoreCertErrors: true }))
    .pipe(process.stdout)
    .on('error', reject)
    .on('finish', resolve);
  });
}

module.exports = {
  zipFolder,
  createFHConfigFile,
  runClientApp
}