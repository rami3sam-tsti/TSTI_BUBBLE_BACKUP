const pullFilesQueue = require("../queues/files/pullFilesQueue");
const config = require("../config");

const pullFiles = async (req, res) => {
    const appName = req.query.appName;
    try {
        const appConfig = config.find(c => c.APP_NAME === appName)
        if (!appConfig) throw new Error("App configuration not found");


        await pullFilesQueue.add(`pullFiles:${appName}`, {
            appInfo: { ...appConfig }
        });

        res.send("Started pulling files!");
    } catch (error) {
        res.status(500).send("Error fetching data: " + error.message);
    }
}

module.exports = pullFiles;