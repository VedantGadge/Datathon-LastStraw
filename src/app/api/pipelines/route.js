import { NextResponse } from "next/server";

export const revalidate = 60;

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

    // Get CI pipelines data
    // USING pipeline_name explicitly
    const pipelinesRes = await client.query(`
      SELECT id, pipeline_name as name, status, last_run, duration_seconds, success_rate, branch
      FROM ci_pipelines
      ORDER BY last_run DESC
      LIMIT 20
    `);

    const pipelines = pipelinesRes.rows;

    // Calculate summary stats
    const successCount = pipelines.filter((p) => p.status === "success").length;
    const failCount = pipelines.filter((p) => p.status === "failed").length;
    const runningCount = pipelines.filter((p) => p.status === "running").length;

    const avgDuration =
      pipelines.reduce((sum, p) => sum + (p.duration_seconds || 0), 0) /
      Math.max(pipelines.length, 1);
    const avgSuccessRate =
      pipelines.reduce((sum, p) => sum + (parseFloat(p.success_rate) || 0), 0) /
      Math.max(pipelines.length, 1);

    client.release();

    return NextResponse.json({
      hasData: true,
      pipelines,
      summary: {
        total: pipelines.length,
        success: successCount,
        failed: failCount,
        running: runningCount,
        avgDurationMinutes: Math.round((avgDuration / 60) * 10) / 10,
        avgSuccessRate: Math.round(avgSuccessRate * 10) / 10,
      },
    });
  } catch (err) {
    console.error("PostgreSQL Error:", err.message);
    return NextResponse.json({
      hasData: false,
      error: err.message,
      pipelines: [],
      summary: { total: 10, success: 8, failed: 1, running: 1 },
    });
  }
}
