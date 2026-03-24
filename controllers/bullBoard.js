const { Queue } = require("bullmq");
const { createBullBoard } = require("@bull-board/api");
const { BullMQAdapter } = require("@bull-board/api/bullMQAdapter");
const { ExpressAdapter } = require("@bull-board/express");

const backupQueue = require("../queues/backup/backupQueue")
const pullFilesQueue = require("../queues/files/pullFilesQueue")

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

createBullBoard({
  queues: [new BullMQAdapter(backupQueue), new BullMQAdapter(pullFilesQueue)],
  serverAdapter,
});

module.exports = serverAdapter