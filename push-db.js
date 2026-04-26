const { createClient } = require("@libsql/client");
const fs = require("fs");
require("dotenv").config({ path: ".env.local" });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function run() {
  const sql = fs.readFileSync("prisma/migrations/20260425022250_init/migration.sql", "utf-8");
  
  // Split the file by statements
  const statements = sql.split(";").filter(s => s.trim().length > 0);
  
  console.log("Pushing tables to Turso...");
  
  for (const statement of statements) {
    try {
      await client.execute(statement);
      console.log("✅ Executed successfully");
    } catch (e) {
      if (e.message.includes("already exists")) {
        console.log("⚠️ Table already exists, skipping...");
      } else {
        console.error("❌ Error executing:", e.message);
      }
    }
  }
  console.log("Done! Database is ready.");
}

run();
