const constants = require("./constants");
const { MongoClient } = require("mongodb");

const client = new MongoClient(constants.MONGO_URI);
module.exports = client
