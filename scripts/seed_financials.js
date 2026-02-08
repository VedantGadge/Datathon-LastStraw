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

const sql = `
-- 1. Create the Table
CREATE TABLE IF NOT EXISTS financial_metrics (
    id SERIAL PRIMARY KEY,
    record_date DATE NOT NULL,
    service_name VARCHAR(50) NOT NULL,
    cost_amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    project_id VARCHAR(50),
    metadata JSONB
);

-- 2. Create a separate Budgets table
CREATE TABLE IF NOT EXISTS project_budgets (
    project_id VARCHAR(50) PRIMARY KEY,
    monthly_limit DECIMAL(10, 2) NOT NULL,
    alert_threshold_percent INTEGER DEFAULT 80
);

-- 3. Clear existing data to avoid duplicates on re-run
DELETE FROM financial_metrics;
DELETE FROM project_budgets;

-- 4. Synthetic Data Generation (Last 90 Days)

INSERT INTO project_budgets (project_id, monthly_limit) VALUES 
('proj-core-platform', 15000.00), -- Increased to match reality
('proj-ai-research', 8000.00),
('proj-frontend', 3000.00);

-- Insert Dummy Costs for 'proj-core-platform' (AWS EC2 - Variable load)
INSERT INTO financial_metrics (record_date, service_name, cost_amount, project_id)
SELECT 
    CURRENT_DATE - (i || ' days')::INTERVAL,
    'AWS EC2',
    180.00 + (random() * 80), -- Varying between 180-260
    'proj-core-platform'
FROM generate_series(0, 90) AS i;

-- Insert Dummy Costs for 'proj-ai-research' (OpenAI - Spiky but growing)
INSERT INTO financial_metrics (record_date, service_name, cost_amount, project_id)
SELECT 
    CURRENT_DATE - (i || ' days')::INTERVAL,
    'OpenAI API',
    CASE 
        WHEN i % 7 = 0 THEN 450.00 + (random() * 100) -- Spike
        ELSE 60.00 + (random() * 20) 
    END, 
    'proj-ai-research'
FROM generate_series(0, 90) AS i;

-- Insert Dummy Costs for 'GitHub Copilot' (Steady)
INSERT INTO financial_metrics (record_date, service_name, cost_amount, project_id)
SELECT 
    CURRENT_DATE - (i || ' days')::INTERVAL,
    'GitHub Copilot',
    190.00,
    'global'
FROM generate_series(0, 90) AS i;

-- Insert Dummy Costs for 'Datadog' (Steady Obs)
INSERT INTO financial_metrics (record_date, service_name, cost_amount, project_id)
SELECT 
    CURRENT_DATE - (i || ' days')::INTERVAL,
    'Datadog',
    120.00,
    'global'
FROM generate_series(0, 90) AS i;

-- Insert Dummy Costs for 'Vercel' (Small variable)
INSERT INTO financial_metrics (record_date, service_name, cost_amount, project_id)
SELECT 
    CURRENT_DATE - (i || ' days')::INTERVAL,
    'Vercel',
    40.00 + (random() * 10),
    'proj-frontend'
FROM generate_series(0, 90) AS i;
`;

async function seed() {
  try {
    console.log("Connecting to Database...");
    const client = await pool.connect();
    console.log("Connected. Running Seed Script...");

    await client.query(sql);

    console.log("Seed Completed Successfully!");
    client.release();
  } catch (err) {
    console.error("Seed Failed:", err);
  } finally {
    pool.end();
  }
}

seed();
