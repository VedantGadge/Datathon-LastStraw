const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  password: "KJDATATHON2026!",
  host: "engineering-intelligence1.chwmsemq65p7.ap-south-1.rds.amazonaws.com",
  port: 5432,
  database: "engineering_intelligence",
  ssl: { rejectUnauthorized: false },
});

async function seed() {
  console.log("🚀 Seeding PostgreSQL with Sprint & Task Data...\n");

  const client = await pool.connect();

  try {
    // 1. Create sprints table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS sprints (
        id SERIAL PRIMARY KEY,
        sprint_name VARCHAR(50) NOT NULL,
        project_id INTEGER,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        committed_points INTEGER DEFAULT 0,
        completed_points INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'active'
      )
    `);
    console.log("✓ Ensured sprints table exists");

    // Clear existing sprint data
    await client.query("DELETE FROM sprints");

    // 2. Seed Sprints (Last 6 sprints, 2-week cycles)
    const sprints = [];
    for (let i = 5; i >= 0; i--) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (i * 14 + 14));
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 13);

      const committed = 40 + Math.floor(Math.random() * 20); // 40-60 points
      const completed =
        i === 0
          ? Math.floor(committed * 0.6) // Current sprint ~60% done
          : Math.floor(committed * (0.75 + Math.random() * 0.25)); // Past: 75-100%

      sprints.push({
        name: `Sprint ${24 - i}`,
        start: startDate.toISOString().split("T")[0],
        end: endDate.toISOString().split("T")[0],
        committed,
        completed,
        status: i === 0 ? "active" : "completed",
      });
    }

    for (const s of sprints) {
      await client.query(
        `INSERT INTO sprints (sprint_name, start_date, end_date, committed_points, completed_points, status)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [s.name, s.start, s.end, s.committed, s.completed, s.status],
      );
    }
    console.log(`✓ Created ${sprints.length} sprints`);

    // 3. Clear and seed tasks
    await client.query("DELETE FROM tasks");

    const taskTypes = ["feature", "bug", "chore", "spike"];
    const priorities = ["P0", "P1", "P2", "P3"];
    const statuses = ["todo", "in_progress", "in_review", "done"];

    const taskTitles = [
      "Implement user authentication flow",
      "Fix memory leak in dashboard",
      "Refactor API error handling",
      "Add dark mode support",
      "Optimize database queries",
      "Update dependency versions",
      "Add unit tests for payment module",
      "Design new onboarding screens",
      "Implement real-time notifications",
      "Fix mobile responsive issues",
      "Add export to CSV feature",
      "Improve loading performance",
      "Setup CI/CD pipeline",
      "Add logging middleware",
      "Implement rate limiting",
      "Update documentation",
      "Add accessibility features",
      "Fix timezone handling",
      "Implement search functionality",
      "Add analytics tracking",
    ];

    let tasksCreated = 0;
    for (let i = 0; i < 50; i++) {
      const title =
        taskTitles[i % taskTitles.length] +
        ` #${Math.floor(i / taskTitles.length) + 1}`;
      const type = taskTypes[Math.floor(Math.random() * taskTypes.length)];
      const priority =
        priorities[Math.floor(Math.random() * priorities.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const points = [1, 2, 3, 5, 8, 13][Math.floor(Math.random() * 6)];

      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 60));

      await client.query(
        `INSERT INTO tasks (title, description, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $4)`,
        [title, `${type} | ${priority} | ${points} pts`, status, createdAt],
      );
      tasksCreated++;
    }
    console.log(`✓ Created ${tasksCreated} tasks`);

    // 4. Seed task_events for velocity tracking
    await client.query("DELETE FROM task_events");

    let eventsCreated = 0;
    for (let i = 0; i < 100; i++) {
      const eventDate = new Date();
      eventDate.setDate(eventDate.getDate() - Math.floor(Math.random() * 90));

      const eventTypes = [
        "created",
        "status_changed",
        "assigned",
        "commented",
        "completed",
      ];
      const eventType =
        eventTypes[Math.floor(Math.random() * eventTypes.length)];

      await client.query(
        `INSERT INTO task_events (task_id, event_type, event_data, created_at)
         VALUES ($1, $2, $3, $4)`,
        [
          Math.floor(Math.random() * 50) + 1,
          eventType,
          JSON.stringify({ source: "synthetic", detail: `Event ${i}` }),
          eventDate,
        ],
      );
      eventsCreated++;
    }
    console.log(`✓ Created ${eventsCreated} task events`);

    // 5. Update employee_monthly_metrics with synthetic data
    await client.query("DELETE FROM employee_monthly_metrics");

    // Get employee IDs
    const employeesRes = await client.query(
      "SELECT id FROM employees LIMIT 10",
    );
    const employeeIds = employeesRes.rows.map((r) => r.id);

    let metricsCreated = 0;
    for (const empId of employeeIds) {
      // Last 3 months of metrics
      for (let m = 0; m < 3; m++) {
        const metricDate = new Date();
        metricDate.setMonth(metricDate.getMonth() - m);

        await client.query(
          `INSERT INTO employee_monthly_metrics (employee_id, metric_month, commits, prs_merged, reviews_done, tickets_closed)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT DO NOTHING`,
          [
            empId,
            metricDate.toISOString().slice(0, 7), // YYYY-MM format
            30 + Math.floor(Math.random() * 50), // commits
            5 + Math.floor(Math.random() * 15), // PRs
            8 + Math.floor(Math.random() * 12), // reviews
            4 + Math.floor(Math.random() * 10), // tickets
          ],
        );
        metricsCreated++;
      }
    }
    console.log(`✓ Created ${metricsCreated} employee metrics records`);

    console.log("\n✅ PostgreSQL Sprint/Task Data Seeded Successfully!");
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
