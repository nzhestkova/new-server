function insertOne(mongoDB, dbName, collectionName, body) {
    mongoDB.connect((mongoError, mongoClient) => {
        if (mongoError) { console.log(mongoError); }

        const db = mongoClient.db(dbName);
        const usersCollection = db.collection(collectionName);

        usersCollection.insertOne(body, () => mongoClient.close() ).then();
    });
}

module.exports.find = function (mongoDB, dbName, collectionName, request = {}) {
    mongoDB.connect(function (mongoError, mongoClient) {
        if (mongoError) { console.log(mongoError); }

        const db = mongoClient.db(dbName);
        const collection = db.collection(collectionName);

        collection.find(request).toArray(function (err, data) {
            if (err) { console.log(err); }
            // data extract
        });
    });
};
