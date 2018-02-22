const mbaasClient = require('../utils/mbaas');
const mongo = require('../services/mongo');
const {MongoClient, ObjectId} = require('mongodb');
const services = require('../services/cloudapp');
const chai = require('chai');
const config = require('../config.json');

chai.should();

describe('MBaaS', function() {
  this.timeout(0);

  let form;
  let formId;
  let formCollection;
  let userClient;
  let systemClient;

  before(async function() {
    console.log('Before test we are going to');

    //init mbaas client
    console.log('- initialize MBaaS client');
    await mbaasClient.initClient();

    //get form
    form = services.prepareFormDefinition().formDef;

    //deploy form
    console.log('- deploy test form');
    formId = (await mbaasClient.deployForm(form))._id;
    
    // portforward both
    console.log('- make port-forward to primary mongo pod');
    const { userAdminPassword, systemAdminPassword } = await mongo.portForward();

    //compose collection name
    formDB = `${config.domain}_${config.env}`;

    // create connections to mongos
    console.log('- and connect to mongo');
    const userUrl = `mongodb://admin:${userAdminPassword}@localhost:27017`;
    userClient = await MongoClient.connect(userUrl);
    const systemUrl = `mongodb://admin:${systemAdminPassword}@localhost:27018`;
    systemClient = await MongoClient.connect(systemUrl);

  });

  after(async function() {
    console.log('Afterall we are going to');
    //close mongo connections
    console.log('- close mongo connections');
    if (userClient) {
      await userClient.close();
    }
    if (systemClient) {
      await systemClient.close();
    }

    //undeploy form?
    console.log('- undeploy test form');
    await mbaasClient.undeployForm(formId);
    //stop forwading
    console.log('- and stop port-forward');
    await mongo.stopPortForward();

  });

  it('should save form to user space mongo', async function() {
    const db = userClient.db(formDB);
    const collections = (await db.listCollections().toArray()).map(c => c.name);
    collections.should.include('forms');
    const collection = await db.collection('forms');
    const formInCollection = await collection.findOne({_id: ObjectId(formId)});
    formInCollection.should.exist;
  });

  it(`system space mongo should not contain forms database`, async function() {
    const db = systemClient.db(formDB);
    const collections = await db.listCollections().toArray();
    collections.should.be.empty;
  });

});