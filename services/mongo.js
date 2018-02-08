const MongoClient = require('mongodb').MongoClient;
const exec = require('../utils/execute');

let primaryForwarding;

async function portForward() {
    let resultConfig = {};
    const userConfig = JSON.parse(await exec.getStdout('oc get cm mongo-user-config -o json'));
    resultConfig.adminPassword = userConfig.data['mongodb-admin-password'];
    console.log(resultConfig.adminPassword);
    resultConfig.mongoProject = userConfig.data['mongodb-service-name'].split('.')[1];
    
    // determine primary
    const mongoPod = (await exec.getStdout(`oc get pods -n ${resultConfig.mongoProject} | grep mongo | awk '{print $1}'`)).split('\n')[0];
    const forwarding = exec.getProcess(`oc port-forward ${mongoPod} 27017:27017 -n ${resultConfig.mongoProject}`);
    await new Promise(resolve => setTimeout(resolve, 5000));
    const url = `mongodb://admin:${resultConfig.adminPassword}@localhost:27017`;
    const client = await MongoClient.connect(url);
    const db = client.db('admin');
    const replStatus = await db.command({ 'replSetGetStatus': 1 });
   
    const primary = replStatus.members.find(member => member.stateStr === 'PRIMARY').name.split('.')[0];
   
    forwarding.kill('SIGKILL');

    // port-forward primary
    const primaryPod = (await exec.getStdout(`oc get pods -n ${resultConfig.mongoProject} | grep ${primary} | awk '{print $1}'`));
    primaryForwarding = exec.getProcess(`oc port-forward ${primaryPod} 27017:27017 -n ${resultConfig.mongoProject}`);
    
}

function stopPortForward() {
    primaryForwarding.kill('SIGKILL');
}


module.exports = {
    portForward,
    stopPortForward
};