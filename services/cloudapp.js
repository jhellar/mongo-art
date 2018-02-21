const admZip = require('adm-zip');
const path = require('path');
const fs = require('fs');
const browser = require('browser-run');
const formFixture = require('../fixtures/simple-form');
const themeFixture = require('../fixtures/theme');
const config = require('../config');
const fhc = require('../utils/fhc');

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
    .on('error', reject)
    .on('end', resolve)
    .pipe(process.stdout);
  });
}

function prepareFormDefinition() {
  formFixture.updatedBy = config.user;
  formFixture.name = config.prefix + Date.now();

  const definitionPath = path.resolve(__dirname, '../tmpForm.json');

  if (fs.existsSync(definitionPath)) {
    fs.unlinkSync(definitionPath);
  }

  var json = JSON.stringify(formFixture);
  fs.writeFileSync(definitionPath, json);

  return {formDef: formFixture , definitionPath};
}

function prepareThemeDefinition() {
  themeFixture.name = config.prefix + Date.now();

  const definitionPath = path.resolve(__dirname, '../tmpTheme.json');

  if (fs.existsSync(definitionPath)) {
    fs.unlinkSync(definitionPath);
  }

  var json = JSON.stringify(themeFixture);
  fs.writeFileSync(definitionPath, json);

  return definitionPath;
}

async function createForm(projectId) {
  const formObj = prepareFormDefinition();
  const form = await fhc.createForm(formObj.definitionPath);
  await fhc.deployForm(form._id, config.env);
  const themeFile = prepareThemeDefinition();
  const theme = await fhc.createFormTheme(themeFile);
  await fhc.associateFormWithProject(projectId, theme._id, form._id);
  fs.unlinkSync(formObj.definitionPath);
  fs.unlinkSync(themeFile);
  return { form, theme };
}

module.exports = {
  zipFolder,
  createFHConfigFile,
  runClientApp,
  prepareFormDefinition,
  createForm
}