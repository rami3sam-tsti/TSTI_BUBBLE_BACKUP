const axios = require("axios");
const logger = require("./logger");
async function pullFiles(db, appName, updateProgress) {
    const filesCollection = db.collection("files");
    const files = await filesCollection.find({ file: { $exists: false }, appName }).toArray();
    let iter = 0
    for (const file of files) {
        try {
            fileUrl = file.fileUrl.startsWith("//") ? `https:${file.fileUrl}` : file.fileUrl;


            const response = await axios.get(fileUrl, { responseType: "arraybuffer" });
            logger.info(`Fetched file: ${fileUrl} (size: ${response.data.length} bytes)`);
            await filesCollection.updateOne(
                { _id: file._id },
                { $set: { file: response.data } }
            );






        } catch (error) {
            logger.error("Error fetching file:", error.stackTrace);
        } finally {
            iter++;
            if (updateProgress) {
                const progress = Math.round((iter / files.length) * 100);
                await updateProgress(progress);
            }
        }
    }
}

module.exports = pullFiles;