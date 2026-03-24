
const { Queue } = require("bullmq");
const constants = require("../../constants");

const backupQueue = new Queue(constants.BACKUP_QUEUE_NAME, {
  connection: {
    host: "127.0.0.1",
    port: 6379,
  },
});

module.exports = backupQueue