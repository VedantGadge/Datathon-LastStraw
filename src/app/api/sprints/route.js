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

    // Get sprints
    const sprintsRes = await client.query(`
      SELECT sprint_name, start_date, end_date, committed_points, completed_points, status
      FROM sprints
      ORDER BY start_date DESC
      LIMIT 10
    `);

    const sprints = sprintsRes.rows;

    // Calculate velocity
    const completedSprints = sprints.filter((s) => s.status === "completed");
    const avgVelocity =
      completedSprints.length > 0
        ? Math.round(
            completedSprints.reduce((sum, s) => sum + s.completed_points, 0) /
              completedSprints.length,
          )
        : 0;

    // Current sprint
    const currentSprint = sprints.find((s) => s.status === "active");

    // Velocity trend for chart
    const velocityTrend = completedSprints
      .map((s) => ({
        name: s.sprint_name,
        committed: s.committed_points,
        completed: s.completed_points,
        completion: Math.round((s.completed_points / s.committed_points) * 100),
      }))
      .reverse();

    client.release();

    return NextResponse.json({
      hasData: true,
      sprints,
      currentSprint: currentSprint
        ? {
            name: currentSprint.sprint_name,
            committed: currentSprint.committed_points,
            completed: currentSprint.completed_points,
            progress: Math.round(
              (currentSprint.completed_points /
                currentSprint.committed_points) *
                100,
            ),
            endDate: currentSprint.end_date,
          }
        : null,
      avgVelocity,
      velocityTrend,
    });
  } catch (err) {
    console.error("PostgreSQL Error:", err.message);
    return NextResponse.json({
      hasData: false,
      error: err.message,
      avgVelocity: 42,
      velocityTrend: [],
    });
  }
}
