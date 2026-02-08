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

async function seed() {
  const client = await pool.connect();
  try {
    console.log("Dropping existing tables...");
    await client.query("DROP TABLE IF EXISTS employees CASCADE");
    await client.query("DROP TABLE IF EXISTS teams CASCADE");

    console.log("Creating tables...");

    // Create Teams table
    await client.query(`
            CREATE TABLE teams (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE,
                description TEXT
            );
        `);

    // Create Employees table
    await client.query(`
            CREATE TABLE employees (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                role VARCHAR(100),
                department VARCHAR(100),
                team_id INTEGER REFERENCES teams(id),
                hire_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

    console.log("Clearing existing data...");
    await client.query("TRUNCATE employees, teams RESTART IDENTITY CASCADE");

    console.log("Seeding Teams...");
    const teams = [
      { name: "Frontend", desc: "UI/UX and Client Side" },
      { name: "Backend", desc: "API and Database" },
      { name: "DevOps", desc: "Infrastructure and CI/CD" },
      { name: "Design", desc: "Product Design and Research" },
      { name: "QA", desc: "Quality Assurance" },
      { name: "Mobile", desc: "iOS and Android" },
      { name: "Data", desc: "Data Engineering and Analytics" },
      { name: "Security", desc: "Cybersecurity and Compliance" },
    ];

    for (const t of teams) {
      await client.query(
        "INSERT INTO teams (name, description) VALUES ($1, $2)",
        [t.name, t.desc],
      );
    }

    console.log("Seeding Employees...");
    // Fetch team IDs
    const teamRes = await client.query("SELECT id, name FROM teams");
    const teamMap = {};
    teamRes.rows.forEach((r) => (teamMap[r.name] = r.id));

    const employees = [
      {
        name: "Sarah Chen",
        role: "Senior Frontend Engineer",
        dept: "Engineering",
        team: "Frontend",
        email: "sarah.c@endurance.ai",
        hire_date: "2022-03-15",
      },
      {
        name: "Mike Ross",
        role: "Backend Lead",
        dept: "Engineering",
        team: "Backend",
        email: "mike.r@endurance.ai",
        hire_date: "2021-06-10",
      },
      {
        name: "Alex Thompson",
        role: "DevOps Engineer",
        dept: "Engineering",
        team: "DevOps",
        email: "alex.t@endurance.ai",
        hire_date: "2023-01-20",
      },
      {
        name: "Jessica Lee",
        role: "Product Designer",
        dept: "Design",
        team: "Design",
        email: "jessica.l@endurance.ai",
        hire_date: "2022-11-05",
      },
      {
        name: "David Kim",
        role: "QA Automation Engineer",
        dept: "Engineering",
        team: "QA",
        email: "david.k@endurance.ai",
        hire_date: "2023-05-12",
      },
      {
        name: "Emily White",
        role: "Mobile Developer",
        dept: "Engineering",
        team: "Mobile",
        email: "emily.w@endurance.ai",
        hire_date: "2022-08-30",
      },
      {
        name: "Robert Miller",
        role: "Data Engineer",
        dept: "Data",
        team: "Data",
        email: "robert.m@endurance.ai",
        hire_date: "2021-12-01",
      },
      {
        name: "Lisa Patel",
        role: "Security Analyst",
        dept: "Security",
        team: "Security",
        email: "lisa.p@endurance.ai",
        hire_date: "2023-02-14",
      },
      {
        name: "James Wilson",
        role: "Frontend Developer",
        dept: "Engineering",
        team: "Frontend",
        email: "james.w@endurance.ai",
        hire_date: "2024-01-10",
      },
      {
        name: "Maria Garcia",
        role: "Backend Developer",
        dept: "Engineering",
        team: "Backend",
        email: "maria.g@endurance.ai",
        hire_date: "2023-09-22",
      },
      {
        name: "Tom Holland",
        role: "Junior DevOps",
        dept: "Engineering",
        team: "DevOps",
        email: "tom.h@endurance.ai",
        hire_date: "2024-03-01",
      },
      {
        name: "Anna Smith",
        role: "UX Researcher",
        dept: "Design",
        team: "Design",
        email: "anna.s@endurance.ai",
        hire_date: "2023-07-18",
      },
      {
        name: "Kevin Brown",
        role: "QA Tester",
        dept: "Engineering",
        team: "QA",
        email: "kevin.b@endurance.ai",
        hire_date: "2024-02-05",
      },
      {
        name: "Rachel Green",
        role: "Product Manager",
        dept: "Product",
        team: "Backend",
        email: "rachel.g@endurance.ai",
        hire_date: "2022-01-15",
      }, // Valid matrix manager scenario
      {
        name: "Chris Evans",
        role: "Full Stack Developer",
        dept: "Engineering",
        team: "Frontend",
        email: "chris.e@endurance.ai",
        hire_date: "2023-04-12",
      },
      {
        name: "Natasha Romanoff",
        role: "Security Engineer",
        dept: "Security",
        team: "Security",
        email: "natasha.r@endurance.ai",
        hire_date: "2021-08-08",
      },
      {
        name: "Bruce Banner",
        role: "Data Scientist",
        dept: "Data",
        team: "Data",
        email: "bruce.b@endurance.ai",
        hire_date: "2020-05-20",
      },
      {
        name: "Tony Stark",
        role: "CTO",
        dept: "Executive",
        team: "Backend",
        email: "tony.s@endurance.ai",
        hire_date: "2019-01-01",
      },
    ];

    for (const emp of employees) {
      await client.query(
        `INSERT INTO employees (name, role, department, team_id, email, hire_date) 
                 VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          emp.name,
          emp.role,
          emp.dept,
          teamMap[emp.team],
          emp.email,
          emp.hire_date,
        ],
      );
    }

    console.log("Seeding completed successfully!");
  } catch (err) {
    console.error("Seeding failed:");
    console.error(err);
    if (err.detail) console.error("Detail:", err.detail);
    if (err.table) console.error("Table:", err.table);
    if (err.constraint) console.error("Constraint:", err.constraint);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
