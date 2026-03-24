
const { Queue } = require("bullmq");
const constants = require("../../constants");

const pullFileQueue = new Queue(constants.PULL_FILE_QUEUE_NAME, {
  connection: {
    host: constants.REDIS_HOST,
    port: constants.REDIS_PORT,
  },
});

module.exports = pullFileQueue