const constants = require("./constants");

const client = new MongoClient(constants.MONGO_URI);

module.exports = client;