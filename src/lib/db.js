import { Pool } from "pg";

const pool = new Pool({
  user: process.env.POSTGRES_USERNAME || "postgres",
  password: process.env.POSTGRES_PASSWORD || "KJDATATHON2026!",
  host:
    process.env.POSTGRES_HOST ||
    "engineering-intelligence1.chwmsemq65p7.ap-south-1.rds.amazonaws.com",
  port: parseInt(process.env.POSTGRES_PORT || "5432"),
  database: process.env.POSTGRES_DATABASE || "engineering_intelligence",
  ssl: {
    rejectUnauthorized: false, // RDS often requires SSL but might have self-signed in some contexts, safer for dev
  },
});

export const query = (text, params) => pool.query(text, params);
