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

    // Get employees with team info
    const employeesRes = await client.query(`
      SELECT e.id, e.name, e.email, e.role, e.department, e.hire_date, t.name as team_name
      FROM employees e
      LEFT JOIN teams t ON e.team_id = t.id
      ORDER BY e.name
    `);

    // Get teams
    const teamsRes = await client.query(`
      SELECT id, name, description
      FROM teams
    `);

    // Get employee count by department
    const deptCountRes = await client.query(`
      SELECT department, COUNT(*) as count
      FROM employees
      GROUP BY department
    `);

    // Calculate tenure distribution
    const tenureRes = await client.query(`
      SELECT 
        CASE 
          WHEN hire_date > NOW() - INTERVAL '1 year' THEN 'New (<1yr)'
          WHEN hire_date > NOW() - INTERVAL '3 years' THEN 'Mid (1-3yr)'
          ELSE 'Senior (3+yr)'
        END as tenure_bucket,
        COUNT(*) as count
      FROM employees
      WHERE hire_date IS NOT NULL
      GROUP BY tenure_bucket
    `);

    client.release();

    return NextResponse.json({
      hasData: true,
      employees: employeesRes.rows,
      teams: teamsRes.rows,
      totalEmployees: employeesRes.rows.length,
      byDepartment: deptCountRes.rows,
      tenureDistribution: tenureRes.rows,
    });
  } catch (err) {
    console.error("PostgreSQL Error:", err.message);
    return NextResponse.json({
      hasData: false,
      error: err.message,
      totalEmployees: 18,
      employees: [],
    });
  }
}
