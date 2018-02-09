const request = require('request-promise-native');
const path = require('path');
const MongoClient = require('mongodb').MongoClient;
const chai = require('chai');
const config = require('../config');
const fhc = require('../utils/fhc');
const services = require('../services/cloudapp');
const mongo = require('../services/mongo');

chai.should();

describe('Cloud App', function() {

  this.timeout(0);

  let project;
  let userClient;
  let cloudApp;
  let cloudAppId;
  let form;
  let theme;

  before(async function() {
    /*
    fhc init
    create project
    create form

    zip and import cloud app
    deploy cloud app
    call cloudapp's endpoint to create data in db

    import client app
    (update connection)
    update fhconfig.json in client app
    run client app in browser to create data in db

    call cloudapp's endpoint to create form submission

    get system and user space mongo pod name
    portforward both
    create connections to mongos
    */

    // create project
    console.log('fhc init');
    await fhc.init(config.host, config.user, config.pass);
    console.log('creat project');
    project = await fhc.createProject(`${config.prefix}${Date.now()}`, 'bare_project');

    // create form and theme and associate it with the project
    console.log('creat form and theme');
    const formDef = await services.createForm(project.guid);
    form = formDef.form;
    theme = formDef.theme;

    // cloud app
    console.log('import cloud app');
    const zipFile = path.resolve(__dirname, '../cloudapp.zip')
    services.zipFolder(path.resolve(__dirname, '../cloud_app'), zipFile);
    cloudApp = await fhc.importAppZip('Cloud App', project.guid, zipFile, 'cloud_nodejs');
    console.log('deploy cloud app');
    try {
      await fhc.appDeploy(cloudApp.guid, config.env, config.runtime);
    } catch (_) {
      // issue with openshift - cloud app should be still deployed after some time
      await new Promise(resolve => setTimeout(resolve, 120000));
    }
    console.log('wait for cloud app to be ready');
    await new Promise(resolve => setTimeout(resolve, 60000));
    console.log('create data with cloud app');
    let cloudAppUrl = await fhc.getCloudUrl(cloudApp.guid, config.env);
    await request({ uri: `${cloudAppUrl}/test`, json: true });

    // client app
    console.log('import client app');
    const clientApp = await fhc.importApp(project.guid, 'Client App', 'client_advanced_hybrid', 'https://github.com/feedhenry-templates/helloworld-app.git', 'master', config.env);
    const connections = await fhc.connectionsList(project.guid);
    services.createFHConfigFile(clientApp, project, config.host, connections[0]);
    console.log('run client app');
    await services.runClientApp();

    // form submission
    console.log('create form submission');
    cloudAppUrl = await fhc.getCloudUrl(cloudApp.guid, config.env);
    var options = {
      uri: `${cloudAppUrl}/submission`,
      method: 'POST',
      json: { form, theme, clientApp }
    };
    await request(options);

    // portforward both
    console.log('port-forward mongo');
    const { userAdminPassword, systemAdminPassword } = await mongo.portForward();

    // create connections to mongos
    console.log('connect to mongo');
    const userUrl = `mongodb://admin:${userAdminPassword}@localhost:27017`;
    userClient = await MongoClient.connect(userUrl);
    const systemUrl = `mongodb://admin:${systemAdminPassword}@localhost:27018`;
    systemClient = await MongoClient.connect(systemUrl);

    // get cloud app id
    cloudAppId = cloudAppUrl.substring(cloudAppUrl.indexOf('//') + 2).split('.')[0].split('-')[1];
  });

  after(async function() {
    // close mongo connections
    if (userClient) {
      userClient.close();
    }

    mongo.stopPortForward();

    // delete project
    console.log('delete project');
    await fhc.projectDelete(project.guid);
    
    // delete form and theme
    console.log('delete form and theme');
    await fhc.deleteForm(form._id);
    await fhc.deleteFormTheme(theme._id);
  });

  it(`user space mongo should contain cloud app's database`, async function() {
    const db = userClient.db(cloudAppId);
    await db.listCollections().toArray();
  });

  it(`cloud app's database should contain data created with fh.db`, async function() {
    const db = userClient.db(cloudAppId);
    const collections = (await db.listCollections().toArray()).map(c => c.name);
    collections.should.include('test-collection');
    const testCollection = await db.collection('test-collection');
    const data = await testCollection.find({}).toArray();
    data.should.have.lengthOf(1);
    data[0].value.should.equal('test-value');
  });

  it(`cloud app's database should contain data created with sync`, async function() {
    const db = userClient.db(cloudAppId);
    const collections = (await db.listCollections().toArray()).map(c => c.name);
    collections.should.include('test-dataset');
    const testCollection = await db.collection('test-dataset');
    const data = await testCollection.find({}).toArray();
    data[0].value.should.equal('test-value');
  });

  it(`user space mongo should contain forms database`, async function() {
    const db = userClient.db(`${config.domain}_${config.env}`);
    await db.listCollections().toArray();
  });

  it(`forms database should contain submission`, async function() {
    const db = userClient.db(`${config.domain}_${config.env}`);
    const collections = (await db.listCollections().toArray()).map(c => c.name);
    collections.should.include('formsubmissions');
    const collection = await db.collection('formsubmissions');
    const submissions = await collection.find({}).toArray();
    submissions.find(s => s.appCloudName.includes(cloudApp.guid)).should.exist;
  });

  it(`system space mongo should not contain cloud app's database`, async function() {
    const db = systemClient.db(cloudAppId);
    const collections = await db.listCollections().toArray();
    collections.should.be.empty;
  });

  it(`system space mongo should not contain forms database`, async function() {
    const db = systemClient.db(`${config.domain}_${config.env}`);
    const collections = await db.listCollections().toArray();
    collections.should.be.empty;
  });

});