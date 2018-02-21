const client = require("fh-mbaas-client");
const exec = require('./execute');

const config = require("../config.json");

let params;

async function prepareMbaasParams() {
    const mongoConfig = JSON.parse(await exec.getStdout('oc get cm mongo-config -o json'));
    const mbaasUrl = JSON.parse(await exec.getStdout('oc get routes mbaas -o json')).spec.host;
    params = {
        username: mongoConfig['mongodb-fhmbaas-user'],
        password: mongoConfig['mongodb-fhmbaas-password'],
        fhMbaasHost: `https://${mbaasUrl}`,
        domain: config.domain,
        servicekey: config.servicekey,
        environment: config.env,
        url: "Necessary param for fh-mbaas-client"
    };
}

async function initClient() {
    await prepareMbaasParams();
    return new Promise((resolve,reject) => {

        client.initEnvironment(config.environment, params);
        resolve(true);
    });
}

async function deployForm(formDefenition) {
    return new Promise((resolve, reject)=>{
        let requiredFields = Object.assign({form: formDefenition, id: 0},params);
        client.admin.forms.deploy(requiredFields,(err, res) => {
            if (err) {
                reject(err);
            }

            resolve(res);
        })
    });
}

async function undeployForm(formId) {
    return new Promise((resolve, reject)=>{
        let requiredFields = Object.assign({id: formId},params);
        client.admin.forms.undeploy(requiredFields,(err, res) => {
            if (err) {
                reject(err);
            }

            resolve(res);
        })
    });
}

function removeForm(formId) {
    return new Promise((resolve, reject)=>{
        let requiredFields = Object.assign({id: formId},params);
        client.admin.forms.remove(requiredFields,(err, res) => {
            if (err) {
                reject(err);
            }

            resolve(res);
        })
    });
}

module.exports = {
    initClient,
    deployForm,
    undeployForm,
    removeForm
};