const { Worker } = require("bullmq");
const constants = require("../../constants");
const logger = require("../../logger");
const client = require("../../db");
const pullFiles = require("../../pullFiles");
const worker = new Worker(
  constants.PULL_FILE_QUEUE_NAME,
  async (job) => {
    logger.info(`Processing job: ${job.name}, ${job.data}`);
    const appInfo = job.data.appInfo;

    await client.connect();
    const db = client.db(appInfo.APP_NAME);
    logger.info(`Fetching data for table: ${appInfo}`);

    await pullFiles(db, appInfo.APP_NAME, async (progress) => {
      await job.updateProgress(progress);
    });

    logger.info(`Finished processing job: ${job.name}`);

  },
  {
    connection: {
      host: constants.REDIS_HOST,
      port: constants.REDIS_PORT,
    },
  }
);

module.exports = worker;