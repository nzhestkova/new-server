const express = require('express');
const router = express.Router();

// const url = "mongodb://localhost:27017";
const url = "mongodb+srv://natalia:RCFIlCKHhpLqMbX7@dbcluster-tfsla.gcp.mongodb.net/test?retryWrites=true&w=majority";
const dbName = "users";
const dbCollectionName = "users";

const MongoClient = require("mongodb").MongoClient;
const mongoDB = new MongoClient(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    auto_reconnect: true,
});

let dbClient;
let dbCollection;

mongoDB.connect((mongoError, mongoClient) => {
    dbClient = mongoClient;
    dbCollection = mongoClient.db(dbName).collection(dbCollectionName);
});

router.get('/', function (req, res) {
    dbCollection.find().toArray((error, data) => {
        res.send(data);
    });
});

router.get("/:login", function (req, res) {
    dbCollection.findOne({login: req.params.login}, (err, data) => {
        if (err) { console.log(err); }
        data
            ? res.send(data)
            : res.status(404);
    })
});

router.put("/:id", function (req, res) {
    res.status(200).send();
});

router.post("/", function (req, res) {
    const user = req.body;
    getNextSequenceValue("userid").then(data => {
        user["_id"] = data.value.sequence_value;
        dbCollection.insertOne(user, (err, result) => {
            res.send(result.ops);
        });
    });
});

router.delete("/:id", function (req, res) {
    dbCollection.findOneAndDelete({_id: +req.params.id}, (error, result) => {
        res.send(result);
    })
});

module.exports = router;

function getNextSequenceValue(sequenceName) {
    return dbClient.db(dbName).collection("counters").findOneAndUpdate(
        {_id: sequenceName},
        {$inc: {sequence_value: 1}},
        {returnOriginal: false});
}
