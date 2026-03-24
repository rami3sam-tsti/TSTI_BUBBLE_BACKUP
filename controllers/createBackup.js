const backupQueue = require("../queues/backup/backupQueue");
const config = require("../config");

const createBackup = async (req, res) => {
    const appName = req.query.appName;
    try {
        const appConfig = config.find(c => c.APP_NAME === appName)
        if (!appConfig) throw new Error("App configuration not found");

        for (const table of appConfig.TABLES) {
            await backupQueue.add(`backup:${appName}`, {
                tableInfo: { ...appConfig, TABLE_NAME: table }
            });
        }

        res.send("Backup started!");
    } catch (error) {
        res.status(500).send("Error fetching data: " + error.message);
    }
}

module.exports = createBackup;