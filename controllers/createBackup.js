const backupQueue  = require("../queues/backup/backupQueue");
const config = require("../config");

const createBackup = async (req, res) => {
    const appName = req.query.appName;
    try {
        const appConfig = config.find(c => c.APP_NAME === appName)
        if (!appConfig) throw new Error("App configuration not found");

        await backupQueue.add(`backup:${appName}`, {
            config: appConfig
        });

        res.send("Backup started!");
    } catch (error) {
        res.status(500).send("Error fetching data: " + error.message);
    }
}

module.exports = createBackup;