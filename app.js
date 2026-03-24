const dotenv = require("dotenv");
const { MongoClient } = require("mongodb");
const config = require("./config");
const logger = require("./logger");
const express = require("express");
const backupRoutes = require("./routes/backupRoutes");
const filesRoutes = require("./routes/filesRoutes");
const constants = require("./constants");
const backupWorker = require("./queues/backup/backupWorker");
const pullFilesWorker = require("./queues/files/pullFilesWorker");
const bullBoardRoutes = require("./routes/bullBoardRoutes");
dotenv.config();
debugger

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
app.use(filesRoutes)
app.use("/admin/queues", bullBoardRoutes)

app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).send("Something broke!");
});

app.listen(constants.PORT, () => {
  logger.info(`Server is running on port ${constants.PORT}`);
});

