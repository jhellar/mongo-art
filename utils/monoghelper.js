const mongoClient = require('mongodb'),MongoClient;



function connectToMongo(params) {
    return new Promise((resolve, reject)=>{
        const fullURL = `mongodb://${params.user}:${params.password}@${params.dbHost}:${dbPort}/${dbName}`;
        MongoClient.connect(fullURL, (err, database) => {
            if(err) {
                reject(err);
            }

            resolve(database);
        });
    });
}

// function authenticateToDB() {
//     return new Promise((resolve, reject) => {
        
//     });
// }

function initMongoConnection() {
        return connectToMongo()
        //.authenticateToDB();
}

module.exports = {

};