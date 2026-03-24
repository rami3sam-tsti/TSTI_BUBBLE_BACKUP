require("dotenv").config();
const axios = require("axios");
const { isString } = require("./utils");
const crypto = require("crypto");
const logger = require("./logger");
const constants = require("./constants");

async function backupTableData(db, tableInfo) {
  const currentDatetime = new Date();
  const metadataCollection = db.collection("metadata");
  const filesCollection = db.collection("files");
  const API_KEY = process.env[`${tableInfo.APP_NAME}_API_KEY`];

  let tableMetadata = await metadataCollection.findOne({ table: tableInfo.TABLE_NAME });


  if (!tableMetadata) {
    tableMetadata = { table: tableInfo.TABLE_NAME, lastModifiedDate: new Date(0).toISOString() };
    await metadataCollection.insertOne(tableMetadata);
  }

  const collection = db.collection(tableInfo.TABLE_NAME);
  let cursor = 0;
  let totalFetched = 0;
  let hasMore = true;

  while (hasMore) {
    try {
      const response = await axios.get(`${tableInfo.BASE_URL}/api/1.1/obj/${tableInfo.TABLE_NAME}`, {
        headers: { Authorization: `Bearer ${API_KEY}` },
        params: {
          cursor,
          limit: constants.LIMIT,
          constraints: JSON.stringify([
            {
              key: "Modified Date",
              constraint_type: "greater than",
              value: new Date(
                new Date(tableMetadata.lastModifiedDate).getTime() - 60000
              ).toISOString(),
            },
          ]),
        },
      });

      const results = response.data.response.results;

      // Update documents in MongoDB
      for (const item of results) {
        await collection.updateOne(
          { _id: item._id },
          { $push: { snapshots: { ...item, savedAt: currentDatetime.toISOString() } } },
          { upsert: true }
        );

        for (value of Object.values(item)) {

          if (isString(value) && (value.includes("cdn.bubble.io") || value.includes("s3.amazonaws.com"))) {
            const hash = crypto.createHash("md5").update(value).digest("hex");
            await filesCollection.updateOne(
              { urlHash: hash, fileUrl: value },
              { $set: { fileUrl: value } },
              { upsert: true }
            );
          }
        }
      }


      totalFetched += results.length;
      cursor += constants.LIMIT;
      hasMore = response.data.response.remaining > 0;

      if (!hasMore) {
        logger.info(
          `[${tableInfo.APP_NAME} - ${tableInfo.TABLE_NAME}] All data fetched! Total records: ${totalFetched}`
        );
        await metadataCollection.updateOne(
          { table: tableInfo.TABLE_NAME },
          { $set: { lastModifiedDate: currentDatetime.toISOString() } }
        );
      }
    } catch (error) {
      logger.error("Error fetching data:", error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = backupTableData;