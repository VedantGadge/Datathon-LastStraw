import { NextResponse } from "next/server";
import { Pool } from "pg";

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

export async function GET() {
  try {
    const client = await pool.connect();

    // Get blocked tasks
    const blockersRes = await client.query(`
      SELECT id, title, status, description, created_at
      FROM tasks
      WHERE status = 'blocked' OR description ILIKE '%blocked%'
      ORDER BY created_at DESC
      LIMIT 10
    `);

    // Get task cycle time metrics
    const cycleTimeRes = await client.query(`
      SELECT 
        AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400) as avg_cycle_days
      FROM tasks
      WHERE status = 'done'
    `);

    // Get task distribution by status
    const statusRes = await client.query(`
      SELECT status, COUNT(*) as count
      FROM tasks
      GROUP BY status
    `);

    client.release();

    const blockers = blockersRes.rows;
    const avgCycleTime = parseFloat(
      cycleTimeRes.rows[0]?.avg_cycle_days || 2.4,
    );
    const tasksByStatus = statusRes.rows;

    return NextResponse.json({
      hasData: true,
      blockers,
      metrics: {
        activeBlockers: blockers.length,
        avgCycleTimeDays: Math.round(avgCycleTime * 10) / 10,
        tasksByStatus,
      },
    });
  } catch (err) {
    console.error("Blockers API Error:", err.message);
    return NextResponse.json({
      hasData: false,
      error: err.message,
      blockers: [
        {
          id: 1,
          title: "API Integration Blocked",
          reason: "Waiting for auth team",
        },
        { id: 2, title: "Database Migration", reason: "DBA approval pending" },
        { id: 3, title: "Design Review", reason: "Design team capacity" },
      ],
      metrics: {
        activeBlockers: 3,
        avgCycleTimeDays: 2.4,
      },
    });
  }
}
