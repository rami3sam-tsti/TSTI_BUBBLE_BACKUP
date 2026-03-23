const axios = require("axios");
const dotenv = require("dotenv");
const crypto = require("crypto");
const { MongoClient } = require("mongodb");

dotenv.config();
debugger

const MONGO_URI = process.env.MONGO_URI;
const client = new MongoClient(MONGO_URI);

const config = [
  {
    APP_NAME: "TSTI",
    BASE_URL: "https://tsti.ae/version-test",
    TABLES: ["Classes", "Trainees"],
  },
];

function isString(value) {
  return typeof value === "string" || value instanceof String;
}

// Add API keys and update base URL
for (const conf of config) {
  conf.API_KEY = process.env[`${conf.APP_NAME}_API_KEY`];
  conf.BASE_URL = `${conf.BASE_URL}/api/1.1/obj/`;
}

const LIMIT = 100; // optional max items per request

async function fetchTableData(db, table, config) {
  const currentDatetime = new Date();
  const metadataCollection = db.collection("metadata");
  const filesCollection = db.collection("files");

  let tableMetadata = await metadataCollection.findOne({ table });


  if (!tableMetadata) {
    tableMetadata = { table, lastModifiedDate: new Date(0).toISOString() };
    await metadataCollection.insertOne(tableMetadata);
  }

  const collection = db.collection(table);
  let cursor = 0;
  let totalFetched = 0;
  let hasMore = true;

  while (hasMore) {
    try {
      const response = await axios.get(`${config.BASE_URL}${table}`, {
        headers: { Authorization: `Bearer ${config.API_KEY}` },
        params: {
          cursor,
          limit: LIMIT,
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
              {},
              { upsert: true }
            );
          }
        }
      }


      totalFetched += results.length;
      cursor += LIMIT;
      hasMore = response.data.response.remaining > 0;

      if (!hasMore) {
        console.log(
          `[${config.APP_NAME} - ${table}] All data fetched! Total records: ${totalFetched}`
        );
        await metadataCollection.updateOne(
          { table },
          { $set: { lastModifiedDate: currentDatetime.toISOString() } }
        );
      }
    } catch (error) {
      console.error("Error fetching data:", error.response?.data || error.message);
      throw error;
    }
  }
}

async function fetchAllData(config) {
  try {
    await client.connect();
    const db = client.db(config.APP_NAME);

    for (const table of config.TABLES) {
      await fetchTableData(db, table, config);
    }
  } catch (error) {
    console.error("Failed:", error);
    throw error;
  } finally {
    await client.close();
  }
}

// Run the script
fetchAllData(config[0]);