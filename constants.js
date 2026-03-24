const dotenv = require("dotenv");
dotenv.config();
module.exports = {
    MONGO_URI: process.env.MONGO_URI,
    LIMIT: process.env.LIMIT || 100,
    PORT: process.env.PORT || 8000,
    BACKUP_QUEUE_NAME: "backup-queue",
    PULL_FILE_QUEUE_NAME: "pull-file-queue",
    REDIS_HOST: process.env.REDIS_HOST || "127.0.0.1",
    REDIS_PORT: process.env.REDIS_PORT || 6379,
};