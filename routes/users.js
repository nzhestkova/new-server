const express = require('express');
const router = express.Router();

/* GET users listing. */
router.get('/', function(req, res) {
  res.send({ answer: "it's okay" });
});

module.exports = router;
