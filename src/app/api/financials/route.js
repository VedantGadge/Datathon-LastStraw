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
  connectionTimeoutMillis: 5000, // Fast fail
});

export async function GET() {
  try {
    const client = await pool.connect();

    try {
      const metricsQuery = `
                SELECT service_name, SUM(cost_amount) as total_cost
                FROM financial_metrics
                WHERE record_date >= NOW() - INTERVAL '30 days'
                GROUP BY service_name
                ORDER BY total_cost DESC
                LIMIT 5;
            `;

      const trendQuery = `
                SELECT record_date, SUM(cost_amount) as daily_total
                FROM financial_metrics
                WHERE record_date >= NOW() - INTERVAL '30 days'
                GROUP BY record_date
                ORDER BY record_date ASC;
            `;

      const budgetQuery = `
                SELECT SUM(monthly_limit) as total_budget
                FROM project_budgets;
      `;

      const [servicesRes, trendRes, budgetRes] = await Promise.all([
        client.query(metricsQuery),
        client.query(trendQuery),
        client.query(budgetQuery),
      ]);

      const topServices = servicesRes.rows;
      const dailyTrend = trendRes.rows;
      const totalMonthlyBudget = parseFloat(
        budgetRes.rows[0]?.total_budget || 0,
      );

      // Calculate totals
      const totalSpend30d = dailyTrend.reduce(
        (sum, day) => sum + parseFloat(day.daily_total),
        0,
      );

      client.release();

      return NextResponse.json({
        hasData: true,
        totalSpend30d,
        topServices,
        dailyTrend,
        totalMonthlyBudget,
      });
    } catch (queryErr) {
      client.release();
      console.error(
        "Database query failed (Table likely missing):",
        queryErr.message,
      );
      return NextResponse.json({
        hasData: false,
        error: "Table not found or empty. Please run setup script.",
        details: queryErr.message,
      });
    }
  } catch (connErr) {
    console.error("Database connection failed:", connErr.message);
    return NextResponse.json(
      {
        hasData: false,
        error: "Database Connection Failed",
        details: connErr.message,
      },
      { status: 500 },
    );
  }
}
