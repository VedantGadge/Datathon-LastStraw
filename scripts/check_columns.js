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

    // Check table schema
    const schemaRes = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'ci_pipelines';
    `);

    console.log("Columns in ci_pipelines:");
    schemaRes.rows.forEach((r) =>
      console.log(`- ${r.column_name} (${r.data_type})`),
    );

    client.release();
    pool.end();
  } catch (err) {
    console.error("Error:", err);
  }
}

check();
