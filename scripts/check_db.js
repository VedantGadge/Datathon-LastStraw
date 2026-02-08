const { Pool } = require("pg");

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

    console.log("\n--- Project Budgets ---");
    const budgets = await client.query("SELECT * FROM project_budgets");
    console.table(budgets.rows);

    console.log("\n--- Recent Financial Metrics (Last 5) ---");
    const metrics = await client.query(
      "SELECT * FROM financial_metrics ORDER BY record_date DESC LIMIT 5",
    );
    console.table(metrics.rows);

    client.release();
  } catch (err) {
    console.error("Check Failed:", err);
  } finally {
    pool.end();
  }
}

check();
