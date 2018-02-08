const exec = require('../utils/execute');

async function portForward() {
    let resultConfig = {};
    const userConfig = JSON.parse(await exec('oc get cm mongo-user-config -o json'));
    resultConfig.adminPassword = userConfig.data['mongodb-admin-password'];
    console.log(resultConfig.adminPassword);
    resultConfig.mongoProject = userConfig.data['mongodb-service-name'].split('.')[1];
    
    resultConfig.pods = (await exec(`oc get pods -n ${resultConfig.mongoProject} | grep mongo | awk '{print $1}'`)).split('\n');
    await exec(`oc port-forward ${resultConfig.podName} 27017:27017 -n ${resultConfig.mongoProject}`);
    //make exec return a child process
    return resultConfig;    
}

portForward();

module.exports = {
    portForward
};