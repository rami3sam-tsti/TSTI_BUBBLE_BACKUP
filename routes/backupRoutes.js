const router = require("express").Router();
const createBackup = require("../controllers/createBackup");

router.get("/startBackup", createBackup);

module.exports = router;