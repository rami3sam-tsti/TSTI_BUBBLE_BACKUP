const { Worker } = require("bullmq");
const constants = require("../../constants");
const fetchTableData = require("../../fetchTableData");
const logger = require("../../logger");
const client = require("../../db")
const worker = new Worker(
  constants.BACKUP_QUEUE_NAME,
  async (job) => {
    logger.info(`Processing job: ${job.name}, ${job.data}`);
    const tableInfo = job.data.tableInfo;

    await client.connect();
    const db = client.db(tableInfo.APP_NAME);
    logger.info(`Fetching data for table: ${tableInfo}`);

    await fetchTableData(db, tableInfo, async (progress) => {
      await job.updateProgress(progress);
    });

  },
  {
    connection: {
      host: constants.REDIS_HOST,
      port: constants.REDIS_PORT,
    },
  }
);

module.exports = worker;