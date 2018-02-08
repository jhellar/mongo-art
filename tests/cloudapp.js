const request = require('request-promise-native');
const path = require('path');
const MongoClient = require('mongodb').MongoClient;
const config = require('../config');
const fhc = require('../utils/fhc');
const services = require('../services/cloudapp');

describe('Cloud App', function() {

  this.timeout(0);

  let project;
  let userClient;

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
    // await fhc.init(config.host, config.user, config.pass);
    // project = await fhc.createProject(`${config.prefix}${Date.now()}`, 'bare_project');

    // // create form and theme and associate it with the project
    // const { form, theme } = await services.createForm(project.guid);

    // // cloud app
    // const zipFile = path.resolve(__dirname, '../cloudapp.zip')
    // services.zipFolder(path.resolve(__dirname, '../cloud_app'), zipFile);
    // const cloudApp = await fhc.importAppZip('Cloud App', project.guid, zipFile, 'cloud_nodejs');
    // try {
    //   await fhc.appDeploy(cloudApp.guid, config.env, config.runtime);
    // } catch (_) {
    //   await fhc.appDeploy(cloudApp.guid, config.env, config.runtime);
    // }
    // const cloudAppUrl = await fhc.getCloudUrl(cloudApp.guid, config.env);
    // await new Promise(resolve => setTimeout(resolve, 60000));
    // const mongoUrl = await request({ uri: `${cloudAppUrl}/test`, json: true });
    // console.log(mongoUrl);

    // // client app
    // const clientApp = await fhc.importApp(project.guid, 'Client App', 'client_advanced_hybrid', 'https://github.com/feedhenry-templates/helloworld-app.git', 'master', config.env);
    // const connections = await fhc.connectionsList(project.guid);
    // services.createFHConfigFile(clientApp, project, config.host, connections[0]);
    // await services.runClientApp();

    // // form submission
    // var options = {
    //   url: `${cloudAppUrl}/submission`,
    //   method: 'POST',
    //   json: { form, theme, clientApp }
    // };
    // const response = await request(options);
    // console.log(response);

    // TODO: get system and user space mongo pod name

    // TODO: portforward both

    // TODO: create connections to mongos
    const userUrl = 'mongodb://admin:uD3DIIhmugC3eQbFCEaMP06DjqtHOiBB5al7Tltw@localhost:27017';
    userClient = await MongoClient.connect(userUrl);

    // TODO: get cloud app pod name

  });

  after(async function() {
    // TODO: close mongo connections
    userClient.close();

    // delete project
    // await fhc.projectDelete(project.guid);
    
    // TODO: delete form and theme
  });

  it(`user space mongo should contain cloud app's database`, async function() {
    const db = userClient.db('rhmap_dev');
    await db.collections();
  });

  it(`cloud app's database should contain data created with fh.db`, async function() {
  });

  it(`cloud app's database should contain data created with sync`, async function() {
  });

  it(`user space mongo should contain forms database`, async function() {
  });

  it(`forms database should contain submission`, async function() {
  });

});