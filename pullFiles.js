const axios = require("axios");
const logger = require("./logger");
async function pullFiles(db) {
    const filesCollection = db.collection("files");
    const files = await filesCollection.find({ file: { $exists: false } }).toArray();
    for (const file of files) {
        try {
            fileUrl = !file.fileUrl.startsWith("//") ? file.fileUrl : `https://${file.fileUrl}`;
            const response = await axios.get(fileUrl, { responseType: "arraybuffer" });
            logger.info(`Fetched file: ${file.fileUrl} (size: ${response.data.length} bytes)`);
            await filesCollection.updateOne(
                { _id: file._id },
                { $set: { file: response.data } }
            );
        } catch (error) {
            logger.error("Error fetching file:", error.response?.data || error.message);
        }
    }
}

module.exports = pullFiles;