async function seedClickHouse() {
  console.log("🚀 Seeding ClickHouse with DORA Events...\n");

  try {
    const { createClient } = await import("@clickhouse/client");

    const client = createClient({
      url: "https://xgo7i4yevb.ap-south-1.aws.clickhouse.cloud:8443",
      username: "default",
      password: "~2UlIutr_dmNI",
      database: "default",
    });

    // Generate synthetic events for last 90 days
    const events = [];
    const eventTypes = [
      "pr_merged",
      "deployment",
      "incident_resolved",
      "build_failed",
      "build_success",
    ];
    const projects = [
      "core-platform",
      "frontend-app",
      "mobile-api",
      "data-pipeline",
      "auth-service",
    ];
    const actors = [
      "alice@company.com",
      "bob@company.com",
      "carol@company.com",
      "david@company.com",
      "eva@company.com",
    ];

    for (let day = 0; day < 90; day++) {
      const date = new Date();
      date.setDate(date.getDate() - day);

      // More events on weekdays
      const isWeekday = date.getDay() !== 0 && date.getDay() !== 6;
      const eventCount = isWeekday
        ? 8 + Math.floor(Math.random() * 10)
        : 2 + Math.floor(Math.random() * 3);

      for (let e = 0; e < eventCount; e++) {
        const eventType =
          eventTypes[Math.floor(Math.random() * eventTypes.length)];
        const project = projects[Math.floor(Math.random() * projects.length)];
        const actor = actors[Math.floor(Math.random() * actors.length)];

        // Realistic lead times based on event type
        let leadTimeSeconds = 0;
        if (eventType === "pr_merged") {
          leadTimeSeconds = 3600 + Math.floor(Math.random() * 86400); // 1h - 24h
        } else if (eventType === "incident_resolved") {
          leadTimeSeconds = 1800 + Math.floor(Math.random() * 7200); // 30m - 2h (MTTR)
        }

        events.push({
          event_id: `evt-${day}-${e}`,
          timestamp: date.toISOString().replace("T", " ").slice(0, 19),
          event_type: eventType,
          project_id: project,
          actor_id: actor,
          lead_time_seconds: leadTimeSeconds,
          success:
            eventType.includes("success") ||
            eventType === "pr_merged" ||
            eventType === "deployment"
              ? 1
              : 0,
        });
      }
    }

    console.log(`Prepared ${events.length} events for insertion`);

    // Insert in batches
    const batchSize = 100;
    for (let i = 0; i < events.length; i += batchSize) {
      const batch = events.slice(i, i + batchSize);
      await client.insert({
        table: "events",
        values: batch,
        format: "JSONEachRow",
      });
    }

    console.log(`✓ Inserted ${events.length} events into ClickHouse`);

    // Update dora_daily_metrics
    console.log("Computing DORA metrics...");

    // This would normally be done via a materialized view, but for demo:
    await client.query({
      query: `
        INSERT INTO dora_daily_metrics 
        SELECT 
          toDate(timestamp) as metric_date,
          project_id,
          countIf(event_type = 'deployment') as deployment_count,
          avgIf(lead_time_seconds, event_type = 'pr_merged') as avg_lead_time,
          countIf(event_type = 'build_failed') / greatest(countIf(event_type IN ('build_success', 'build_failed')), 1) as change_failure_rate,
          avgIf(lead_time_seconds, event_type = 'incident_resolved') as mttr
        FROM events
        GROUP BY metric_date, project_id
      `,
    });

    console.log("✓ Updated dora_daily_metrics");

    await client.close();
    console.log("\n✅ ClickHouse DORA Data Seeded Successfully!");
  } catch (err) {
    console.error("❌ ClickHouse Error:", err.message);
  }
}

seedClickHouse();
