const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();



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

async function fetchAllData(config) {
  for (const table of config.TABLES) {
    let results = [];
    let cursor = 0;
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
          },
        });

        const data = response.data;

        // Append results
        results = results.concat(data.response.results);

        console.log(`Fetched ${results.length} records so far...`);

        // Update cursor
        cursor += LIMIT;

        // Check if more data exists
        hasMore = data.response.remaining > 0;

        if (!hasMore) {
          console.log("All data fetched!");
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
  });