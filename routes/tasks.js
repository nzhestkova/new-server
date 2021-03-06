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
        task._id = data.value.sequence_value;
        if (!task.title) { task.title = `Тест #${task._id}` }
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
                                tasks: previousInfo.tasks.concat([+task._id])
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
                title: req.body.title ? req.body.title : `Тест #${req.body._id}`,
                questions: req.body.questions,
                ready: req.body.ready,
                passingScore: req.body.passingScore,
                assigned: req.body.assigned,
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
        (err, result) => {
            if (err) {}
            req.body.assigned.forEach((userID) => {
                usersCollection.findOne({ _id: userID }, (err, user) => {
                    if (!user.tasks.find((task) => task._id === +req.body._id)) {
                        usersCollection.updateOne(
                            { _id: userID },
                            { $set: {
                                tasks: user.tasks.find((task) => task === +req.body._id)
                                    ? user.tasks
                                    : user.tasks.concat([+req.body._id])
                                }
                            });
                    }
                })
            });
            res.status(200).send({ ok: true });
            res.end();
        });
});

router.get("/", (req, res) => {
    if (req.query["taskIDS"]) {
        const tasks = [];
        req.query["tasks"].forEach((id) => {
            dbCollection.findOne({ _id: id }, (err, task) => tasks.push(task));
        });
        res.send(tasks);
        res.end();
    }
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
    dbCollection.findOneAndDelete({ _id: +req.params.id }, (error, result) => {
        res.send(result);
        res.end();
    })
        .then()
});

module.exports = router;

function getNextSequenceValue(sequenceName) {
    return dbClient.db(dbName).collection("counter").findOneAndUpdate(
        {_id: sequenceName},
        {$inc: {sequence_value: 1}},
        {returnOriginal: false});
}
