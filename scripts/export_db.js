const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

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

async function exportData() {
  try {
    console.log("Connecting to Database...");
    const client = await pool.connect();

    console.log("Fetching 'financial_metrics'...");
    const metrics = await client.query(
      "SELECT * FROM financial_metrics ORDER BY record_date DESC",
    );
    const metricsPath = path.join(__dirname, "../financial_metrics_dump.json");
    fs.writeFileSync(metricsPath, JSON.stringify(metrics.rows, null, 2));
    console.log(`Saved ${metrics.rows.length} rows to ${metricsPath}`);

    console.log("Fetching 'project_budgets'...");
    const budgets = await client.query("SELECT * FROM project_budgets");
    const budgetsPath = path.join(__dirname, "../project_budgets_dump.json");
    fs.writeFileSync(budgetsPath, JSON.stringify(budgets.rows, null, 2));
    console.log(`Saved ${budgets.rows.length} rows to ${budgetsPath}`);

    client.release();
  } catch (err) {
    console.error("Export Failed:", err);
  } finally {
    pool.end();
  }
}

exportData();
