const { Pool } = require("pg");
require("dotenv").config({ path: ".env.local" });

const pool = new Pool({
  user: process.env.POSTGRES_USERNAME || "postgres",
  password: process.env.POSTGRES_PASSWORD || "KJDATATHON2026!",
  host:
    process.env.POSTGRES_HOST ||
    "engineering-intelligence1.chwmsemq65p7.ap-south-1.rds.amazonaws.com",
  port: parseInt(process.env.POSTGRES_PORT || "5432"),
  database: process.env.POSTGRES_DATABASE || "engineering_intelligence",
  ssl: { rejectUnauthorized: false },
});

async function check() {
  try {
    const client = await pool.connect();
    // Check if table exists
    const tableRes = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ci_pipelines'
      );
    `);

    console.log("Table 'ci_pipelines' exists:", tableRes.rows[0].exists);

    if (tableRes.rows[0].exists) {
      const countRes = await client.query("SELECT COUNT(*) FROM ci_pipelines");
      console.log("Row count:", countRes.rows[0].count);
    }

    client.release();
    pool.end();
  } catch (err) {
    console.error("Error:", err);
  }
}

check();
