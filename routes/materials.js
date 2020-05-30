const express = require('express');
const router = express.Router();

const fs = require("fs");

const multiparty = require('multiparty');
const form = new multiparty.Form({ autoFiles: true, uploadDir: "upload" });

router.get(':id/:name', ((req, res) => {
    fs.createReadStream(`upload/${req.params.name}`).pipe(res);
    // res.download(`upload/${req.params.name}.txt`);
}));

router.post('/:id',(req, res) => {
    form.parse(req);
    res.send({});
});

module.exports = router;
