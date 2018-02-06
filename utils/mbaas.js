const client = require("fh-mbaas-client");

const config = require("../config.json");
const params = {
    fhMbaasHost: "https://mbaas-mbaas1.b5e6.rhm-eng-a.openshiftapps.com",
    domain: 'rhmap',
    servicekey: config.servicekey,
    environment: config.env,
    url: "Necessary param for fh-mbaas-client"
  };

function initClient() {
    return new Promise((resolve,reject) => {
        client.initEnvironment(config.environment, config);
        resolve(true);
    });
}

function deployForm(formDefenition) {
    return new Promise((resolve, reject)=>{
        let requiredFields = Object.assign({form: formDefenition},params);
        client.admin.forms.deploy(requiredFields,(err, res) => {
            if (err) {
                reject(err);
            }

            resolve(res);
        })
    });
}

function undeployForm(formId) {
    return new Promise((resolve, reject)=>{
        client.admin.forms.undeploy({id:formId},(err, res) => {
            if (err) {
                reject(err);
            }

            resolve(res);
        })
    });
}

function removeForm(formId) {
    return new Promise((resolve, reject)=>{
        client.admin.forms.remove({id:formId},(err, res) => {
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