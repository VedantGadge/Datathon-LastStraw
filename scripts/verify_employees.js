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

async function verify() {
  const client = await pool.connect();
  try {
    console.log("Checking Teams...");
    const teams = await client.query("SELECT * FROM teams");
    console.log(`Found ${teams.rows.length} teams.`);
    teams.rows.forEach((t) => console.log(` - ${t.name}`));

    console.log("\nChecking Employees...");
    const employees = await client.query("SELECT * FROM employees");
    console.log(`Found ${employees.rows.length} employees.`);
    if (employees.rows.length > 0) {
      console.log("Sample employee:", employees.rows[0]);
    } else {
      console.log("No employees found!");
    }
  } catch (err) {
    console.error("Verification failed:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

verify();
