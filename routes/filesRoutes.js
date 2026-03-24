const router = require("express").Router();
const pullFiles = require("../controllers/pullFiles");

router.get("/pullFiles", pullFiles);

module.exports = router;