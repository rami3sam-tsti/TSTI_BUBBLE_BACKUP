const axios = require("axios");
const dotenv = require("dotenv");
const { MongoClient } = require("mongodb");

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
const client = new MongoClient(MONGO_URI);

const config = [{
  APP_NAME: "TSTI",
  BASE_URL: "https://tsti.ae/version-test",
  TABLES: ["Classes", "Trainees", "New Request"]
}]

config.forEach((conf) => {
  conf.API_KEY = process.env[conf.APP_NAME + "_API_KEY"];
  conf.BASE_URL = `${conf.BASE_URL}/api/1.1/obj/`
});


const API_KEY = process.env.API_KEY;

// Optional: max items per request (Bubble default is 100)
const LIMIT = 100;

async function fetchAllData(config) {
  await client.connect();
  const currentDatetime = new Date()
  const db = client.db(config.APP_NAME);
  const metadataCollection = db.collection("metadata");
  for (const table of config.TABLES) {
    const tableMetadata = await metadataCollection.findOne({ table })


    if (tableMetadata === null) {
      await metadataCollection.insertOne({ table, lastModifiedDate: new Date(0).toISOString() });
    }

    const collection = db.collection(table);
    let cursor = 0;
    let totalFetched = 0;
    let hasMore = true;
    try {
      while (hasMore) {
        const response = await axios.get(`${config.BASE_URL}${table}`, {
          headers: {
            Authorization: `Bearer ${config.API_KEY}`,
          },
          params: {
            cursor: cursor,
            limit: LIMIT,
            constraints: JSON.stringify([
              {
                key: "Modified Date",   // your field
                constraint_type: "greater than",   // greater than
                value: tableMetadata ? new Date(new Date(tableMetadata.lastModifiedDate).getTime() - 60000).toISOString() : new Date(0).toISOString() // e.g. "2026-03-23T00:00:00Z"
              }
            ])
          },
        });

        const data = response.data;

        await data.response.results.forEach(async (item) => {
          await collection.updateOne({ _id: item._id }, { $push: { snapshots: { ...item, savedAt: currentDatetime.toISOString() } } }, { upsert: true });
        });

        // Update cursor
        cursor += LIMIT;

        // Check if more data exists
        hasMore = data.response.remaining > 0;
        totalFetched += data.response.results.length;

        if (!hasMore) {
          console.log(`[${config.APP_NAME} - ${table}] All data fetched! Total records: ${totalFetched}`);
          await metadataCollection.updateOne({ table }, { $set: { lastModifiedDate: currentDatetime.toISOString() } });
        }
      }

    } catch (error) {
      console.error("Error fetching data:", error.response?.data || error.message);
      throw error;
    }
  }
}

// Run the script

fetchAllData(config[0])
  .catch((err) => {
    console.error("Failed:", err);
  }).finally(() => {
    client.close();
  });
