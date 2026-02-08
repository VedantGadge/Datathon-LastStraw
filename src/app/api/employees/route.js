import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    // Get employees with team info
    const employeesRes = await query(`
      SELECT e.id, e.name, e.email, e.role, e.department, e.hire_date, t.name as team_name
      FROM employees e
      LEFT JOIN teams t ON e.team_id = t.id
      ORDER BY e.name
    `);

    // Get teams
    const teamsRes = await query(`
      SELECT id, name, description
      FROM teams
    `);

    // Get employee count by department
    const deptCountRes = await query(`
      SELECT department, COUNT(*) as count
      FROM employees
      GROUP BY department
    `);

    // Calculate tenure distribution
    const tenureRes = await query(`
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
