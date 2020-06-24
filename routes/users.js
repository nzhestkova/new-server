const express = require('express');
const router = express.Router();

const crypto = require('crypto');
const iv = crypto.randomBytes(16);
const key = crypto.scryptSync('secret', 'salt', 32);
const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

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
let dbEmails;

mongoDB.connect((mongoError, mongoClient) => {
    dbClient = mongoClient;
    dbCollection = mongoClient.db(dbName).collection(dbCollectionName);
    dbEmails = mongoClient.db("teachers").collection("emails");
});

router.get("/students", (req, res) => {
    dbCollection.find({ type: "student" }).toArray((err, results) => {
        if (err) {
        }
        res.status(200).send(results);
    });
});

router.get("/:login", function (req, res) {

    dbCollection.findOne({login: req.params.login}, (err, data) => {
        if (err) {
            console.log(err);
        }
        if (data) {
            if (req.query.password) {
                req.query.password === data.password
                    ? res.send(data)
                    : res.status(502).send()
            } else {
                res.send(data)
            }
        } else {
            res.status(404).send();
        }
    })
});

router.get("/", (req, res) => {
    if (!req.query) { res.status(502).send() }
    dbCollection.findOne({ login: req.query.login }, (err, user) => {
        if (err) { res.send(err); }
        user
            ? user.pswHS === req.query.pswHS
                ? res.send({
                _id: user._id,
                type: user.type,
                since: user.since,
                username: user.username,
                tasks: user.tasks,
                results: user.results
            })
                : res.status(502).send()
            : res.status(404).send();
        res.end();
    });
});

router.get("/results/:id", (req, res) => {
    if (req.params.id) {
        dbCollection.findOne(
            { _id: +req.params.id },
            (error, user) => {
                res.send({
                    username: user.username,
                    results: user.results
                });
                res.end();
            }
        );
    }
});

router.put("/:id", function (req, res) {
    dbCollection.findOneAndUpdate(
        {_id: +req.body._id},
        {
            $set: {
                type: req.body.type,
                username: req.body.username,
                tasks: req.body["assignedTasks"] || req.body["createdTasks"],
                results: req.body.results,
            }
        }, (error, result) => {
            res.status(200).send();
        })
});

router.put("/update", (req, res) => {
    if (req.body.id && req.body.email) {
        dbEmails.findOne({ email: req.body.email }, (err, email) => {});
    }
});

router.put("/password/:id", (req, res) => {

});

router.post("/", function (req, res) {
    const user = req.body.userInfo;
    // let encrypted = cipher.update(req.body.pswHS, 'utf8', 'hex');
    // encrypted += cipher.final('hex');

    getNextSequenceValue("userid").then(id => {
        user["_id"] = id.value.sequence_value;
        user["type"] = "student";
        user["status"] = "active";
        user["since"] = new Date().toDateString();
        user["login"] = req.body.login;
        user["pswHS"] = req.body.pswHS;
        user["results"] = [];
        user["tasks"] = [];

        dbCollection.insertOne(user, (err, result) => {
            const newUserResponded = result.ops[0];
            delete newUserResponded.login;
            delete newUserResponded.pswHS;
            res.send(newUserResponded);
            res.end();
        })
    });
});

router.delete("/:id", function (req, res) {
    dbCollection.findOneAndDelete({_id: +req.params.id}, (error, result) => {
        delete result.login;
        delete result.pswHS;
        res.send(result);
        res.end();
    })
        .then()
});

module.exports = router;

function getNextSequenceValue(sequenceName) {
    return dbClient.db(dbName).collection("counters").findOneAndUpdate(
        {_id: sequenceName},
        {$inc: {sequence_value: 1}},
        {returnOriginal: false});
}
