const { createClient } = require("@libsql/client");
require("dotenv").config({ path: ".env.local" });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function run() {
  console.log("Adding new columns to Book table...");
  const queries = [
    "ALTER TABLE Book ADD COLUMN coverData BLOB;",
    "ALTER TABLE Book ADD COLUMN pdfData BLOB;"
  ];

  for (const q of queries) {
    try {
      await client.execute(q);
      console.log(`✅ Success: ${q}`);
    } catch (e) {
      if (e.message.includes("duplicate column name")) {
        console.log(`⚠️ Already exists: ${q}`);
      } else {
        console.error(`❌ Error: ${e.message}`);
      }
    }
  }
}

run();
