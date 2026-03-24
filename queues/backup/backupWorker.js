const { Worker } = require("bullmq");
const constants = require("../../constants");
const fetchTableData = require("../../fetchTableData");
const logger = require("../../logger");
const client = require("../../db")
const worker = new Worker(
  constants.BACKUP_QUEUE_NAME,
  async (job) => {
    logger.info(`Processing job: ${job.name}, ${job.data}`);
    const config = job.data.config;

    await client.connect();
    const db = client.db(config.APP_NAME);
    logger.info(`Fetching data for table: ${config}`);

    for (const table of config.TABLES) {

      await fetchTableData(db, table, config);
    }
  },
  {
    connection: {
      host: "127.0.0.1",
      port: 6379,
    },
  }
);

module.exports = worker;