const axios = require("axios");
const dotenv = require("dotenv");
const { MongoClient } = require("mongodb");

dotenv.config();
debugger
const MONGO_URI = process.env.MONGO_URI;
const client = new MongoClient(MONGO_URI);

const config = [{
  APP_NAME: "TSTI",
  BASE_URL: "https://tsti.ae/version-test/api/1.1/obj/",
  TABLES: ["Classes", "Trainees", "New Request"]
}]

config.forEach((conf) => {
  conf.API_KEY = process.env[conf.APP_NAME + "_API_KEY"];
});


const API_KEY = process.env.API_KEY;

// Optional: max items per request (Bubble default is 100)
const LIMIT = 100;

async function fetchAllData(config, lastModifiedDate) {
  await client.connect();
  const db = client.db(config.APP_NAME);
  const metadataCollection = db.collection("metadata");
  for (const table of config.TABLES) {
    const doc = await metadataCollection.findOne({ table })


    if (doc === null) {
      await metadataCollection.insertOne({ table, lastModifiedDate: new Date(0).toISOString() });
    } else if (new Date(doc.lastModifiedDate) >= lastModifiedDate) {
      continue
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
                value: lastModifiedDate.toISOString() // e.g. "2026-03-23T00:00:00Z"
              }
            ])
          },
        });

        const data = response.data;

        await data.response.results.forEach(async (item) => {
          await collection.updateOne({ _id: item._id }, { $set: { [new Date()]: item } }, { upsert: true });
        });

        // Update cursor
        cursor += LIMIT;

        // Check if more data exists
        hasMore = data.response.remaining > 0;
        totalFetched += data.response.results.length;

        if (!hasMore) {
          console.log(`All data fetched! Total records: ${totalFetched}`);
          await metadataCollection.updateOne({ table }, { $set: { lastModifiedDate: lastModifiedDate.toISOString() } });
        }
      }

    } catch (error) {
      console.error("Error fetching data:", error.response?.data || error.message);
      throw error;
    }
  }
}

// Run the script
fetchAllData(config[0], new Date("2026-01-24T00:00:00Z"))
  .catch((err) => {
    console.error("Failed:", err);
  });