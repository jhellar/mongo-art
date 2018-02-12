const MongoClient = require('mongodb').MongoClient;
const exec = require('../utils/execute');

let userForwarding;
let systemForwarding;

async function getPrimary(password, project) {
    const forwarding = await portForwardPod('mongo', 27019, project);
    const url = `mongodb://admin:${password}@localhost:27019`;
    const client = await MongoClient.connect(url);
    const db = client.db('admin');
    const replStatus = await db.command({ 'replSetGetStatus': 1 });
    const primary = replStatus.members.find(member => member.stateStr === 'PRIMARY').name.split('.')[0];
    forwarding.kill('SIGKILL');
    return primary;
}

async function portForwardPod(name, port, project) {
    const projParam = project ? `-n ${project}` : '';
    const podName = (await exec.getStdout(`oc get pods ${projParam} | grep ${name} | awk '{print $1}'`)).split('\n')[0];
    forwarding = exec.getProcess(`oc port-forward ${podName} ${port}:27017 ${projParam}`);
    await new Promise(resolve => setTimeout(resolve, 5000));
    return forwarding;
}

async function portForward() {
    let resultConfig = {};

    const userConfig = JSON.parse(await exec.getStdout('oc get cm mongo-user-config -o json'));
    const systemConfig = JSON.parse(await exec.getStdout('oc get cm mongo-config -o json'));
    resultConfig.userAdminPassword = userConfig.data['mongodb-admin-password'];
    resultConfig.userMongoProject = userConfig.data['mongodb-service-name'].split('.')[1];
    resultConfig.systemAdminPassword = systemConfig.data['mongodb-admin-password'];
    
    const userPrimary = await getPrimary(resultConfig.userAdminPassword, resultConfig.userMongoProject);
    const systemPrimary = await getPrimary(resultConfig.systemAdminPassword);

    userForwarding = await portForwardPod(userPrimary, 27017, resultConfig.userMongoProject);
    systemForwarding = await portForwardPod(systemPrimary, 27018);
    
    return resultConfig;
}

function stopPortForward() {
    if (userForwarding) {
        userForwarding.kill('SIGKILL');
    }
    if (systemForwarding) {
        systemForwarding.kill('SIGKILL');
    }
}

module.exports = {
    portForward,
    stopPortForward
};