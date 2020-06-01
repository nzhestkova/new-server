const express = require('express');
const router = express.Router();

const url = "mongodb+srv://natalia:RCFIlCKHhpLqMbX7@dbcluster-tfsla.gcp.mongodb.net/test?retryWrites=true&w=majority";
const dbName = "tasks";
const dbCollectionName = "testList";

const MongoClient = require("mongodb").MongoClient;
const mongoDB = new MongoClient(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    auto_reconnect: true,
});

let dbClient;
let dbCollection;
let usersCollection;

mongoDB.connect((mongoError, mongoClient) => {
    dbClient = mongoClient;
    dbCollection = mongoClient.db(dbName).collection(dbCollectionName);
    usersCollection = mongoClient.db("users").collection("users");
    console.log("----------db connected-------------")
});

router.post("/", (req, res) => {
    const task = req.body;
    getNextSequenceValue("taskid").then(data => {
        task["_id"] = data.value.sequence_value;
        dbCollection.insertOne(task, (err, result) => {
            res.send({ _id: result.ops[0]._id });
            let previousInfo;
            usersCollection.findOne(
                { _id: +task["authorID"] },
                (err, user) => {
                    if (err) {}
                    previousInfo = user;
                    usersCollection.updateOne(
                        {_id: +task["authorID"]},
                        {
                            $set: {
                                education: {
                                    materials: previousInfo.materials,
                                    tasks: previousInfo.education.tasks.concat([+task._id])
                                }
                            }
                        },
                    );
                }
            );
        });
    });
});

router.put("/:id", (req, res) => {
    dbCollection.updateOne(
        { _id: +req.body._id },
        { $set: {
                title: req.body.title,
                questions: req.body.questions,
                ready: req.body.ready,
                passingScore: req.body.passingScore,
                lifeCycle: {
                    isTemporary: req.body.lifeCycle.isTemporary,
                    openTime: req.body.lifeCycle.openTime,
                    closeTime: req.body.lifeCycle.closeTime,
                },
                passProcess: {
                    isOnTime: req.body.passProcess.isOnTime,
                    timeToPass: req.body.passProcess.timeToPass,
                },
                rePassAbility: {
                    attemptNotLimited: req.body.rePassAbility.attemptNotLimited,
                    attemptCount: req.body.rePassAbility.attemptCount,
                },
            }},
    );
    res.status(200).send();
});

router.get("/", (req, res) => {
    dbClient.db(dbName).collection("counter").findOne({_id: "taskid"}, (err, data) =>
        res.send(`Tasks count = ${data.sequence_value}`));
});

router.get("/:id", (req, res) => {
    const testID = +req.params.id;
    dbCollection.findOne(
        { _id: testID },
        (err, task) => {
            res.send(task);
        }
    );
});

router.delete("/:id", (req, res) => {
});

module.exports = router;

function getNextSequenceValue(sequenceName) {
    return dbClient.db(dbName).collection("counter").findOneAndUpdate(
        {_id: sequenceName},
        {$inc: {sequence_value: 1}},
        {returnOriginal: false});
}
