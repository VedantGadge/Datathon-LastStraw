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

const PIPELINE_NAMES = [
  "deploy-main",
  "test-integration",
  "build-frontend",
  "vet-backend",
  "e2e-cypress",
];
const BRANCHES = [
  "main",
  "develop",
  "feat/auth",
  "fix/api-latency",
  "chore/deps",
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seed() {
  try {
    const client = await pool.connect();

    // Create table if not exists ensuring correct schema
    await client.query(`DROP TABLE IF EXISTS ci_pipelines`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS ci_pipelines (
        id SERIAL PRIMARY KEY,
        pipeline_name VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL, -- success, failed, running
        last_run TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        duration_seconds INTEGER,
        success_rate DECIMAL(5,2),
        branch VARCHAR(255)
      );
    `);

    // Insert 50 recent runs
    console.log("Seeding 50 pipeline runs...");

    for (let i = 0; i < 50; i++) {
      const name = PIPELINE_NAMES[randomInt(0, PIPELINE_NAMES.length - 1)];
      const branch = BRANCHES[randomInt(0, BRANCHES.length - 1)];
      const isSuccess = Math.random() > 0.15; // 85% success rate
      const status = isSuccess ? "success" : "failed";
      const duration = randomInt(45, 600); // 45s to 10m
      const daysAgo = randomInt(0, 7);
      const lastRun = new Date();
      lastRun.setDate(lastRun.getDate() - daysAgo);

      await client.query(
        `
            INSERT INTO ci_pipelines (pipeline_name, status, last_run, duration_seconds, success_rate, branch)
            VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [
          name,
          status,
          lastRun.toISOString(),
          duration,
          isSuccess ? 95.5 : 82.0,
          branch,
        ],
      );
    }

    console.log("Seeding complete.");
    client.release();
    pool.end();
  } catch (err) {
    console.error("Error:", err);
  }
}

seed();
