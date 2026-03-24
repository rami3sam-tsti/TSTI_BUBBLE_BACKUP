const dotenv = require("dotenv");
const { MongoClient } = require("mongodb");
const config = require("./config");
const logger = require("./logger");
const express = require("express");
const backupRoutes = require("./routes/backupRoutes");
const fetchTableData = require("./fetchTableData");
const CONSTANTS = require("./constants");
const pullFiles = require("./pullFiles");
const backupWorker = require("./queues/backup/backupWorker");
const bullBoardRoutes = require("./routes/bullBoardRoutes");
dotenv.config();
debugger

// Add API keys and update base URL
for (const conf of config) {
  conf.API_KEY = process.env[`${conf.APP_NAME}_API_KEY`];
  conf.BASE_URL = `${conf.BASE_URL}/api/1.1/obj/`;
}


// async function pullAllFiles() {
//   try {
//     await client.connect();
//     const db = client.db(config[0].APP_NAME);
//     await pullFiles(db);
//   } catch (error) {
//     console.error("Failed to pull files:", error);
//     throw error;
//   } finally {
//     await client.close();
//   }
// }

// Run the script
const app = express();


// app.get("/pull-files", async (req, res) => {
//   try {
//     pullAllFiles();
//     res.send("Files fetching started!");
//   } catch (error) {
//     res.status(500).send("Error fetching files: " + error.message);
//   }
// });

app.use(backupRoutes)
app.use("/admin/queues", bullBoardRoutes)

app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).send("Something broke!");
});

app.listen(CONSTANTS.PORT, () => {
  logger.info(`Server is running on port ${CONSTANTS.PORT}`);
});

