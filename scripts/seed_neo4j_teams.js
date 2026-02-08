const neo4j = require("neo4j-driver");

const driver = neo4j.driver(
  "neo4j+s://ca5e560b.databases.neo4j.io",
  neo4j.auth.basic("neo4j", "PzRU_PZrEUFz3xkhJQaE7OxX8z_ONK3oxX5yZcFXXOw"),
);

async function seed() {
  const session = driver.session();

  console.log("🚀 Seeding Neo4j with Team Collaboration Data...\n");

  try {
    // Clear existing Team data (preserving Developers, Projects, Skills)
    await session.run("MATCH (t:Team) DETACH DELETE t");
    console.log("✓ Cleared existing Team nodes");

    // 1. Create Teams
    const teams = [
      { name: "Frontend", lead: "Alice Chen", size: 5, focus: "UI/UX" },
      { name: "Backend", lead: "Bob Kumar", size: 6, focus: "APIs" },
      { name: "DevOps", lead: "Carol Smith", size: 3, focus: "Infrastructure" },
      { name: "Product", lead: "David Lee", size: 4, focus: "Strategy" },
      { name: "Design", lead: "Eva Garcia", size: 3, focus: "Visual Design" },
      { name: "QA", lead: "Frank Wilson", size: 4, focus: "Testing" },
      { name: "Data", lead: "Grace Liu", size: 3, focus: "Analytics" },
      { name: "Mobile", lead: "Henry Patel", size: 4, focus: "iOS/Android" },
    ];

    for (const team of teams) {
      await session.run(
        `CREATE (t:Team {name: $name, lead: $lead, size: $size, focus: $focus})`,
        team,
      );
    }
    console.log(`✓ Created ${teams.length} Team nodes`);

    // 2. Create Collaboration Relationships (Realistic Patterns)
    const collaborations = [
      // Strong collaborations (high volume, positive sentiment)
      {
        from: "Product",
        to: "Design",
        volume: 250,
        sentiment: 0.9,
        type: "planning",
      },
      {
        from: "Design",
        to: "Frontend",
        volume: 200,
        sentiment: 0.85,
        type: "handoff",
      },
      {
        from: "Backend",
        to: "DevOps",
        volume: 180,
        sentiment: 0.8,
        type: "deployment",
      },
      {
        from: "QA",
        to: "Backend",
        volume: 150,
        sentiment: 0.75,
        type: "bug_reports",
      },
      {
        from: "Data",
        to: "Backend",
        volume: 120,
        sentiment: 0.8,
        type: "api_requests",
      },

      // Moderate collaborations
      {
        from: "Frontend",
        to: "Backend",
        volume: 80,
        sentiment: 0.6,
        type: "integration",
      }, // SILO RISK!
      {
        from: "Mobile",
        to: "Backend",
        volume: 110,
        sentiment: 0.7,
        type: "api_consumption",
      },
      {
        from: "Product",
        to: "Data",
        volume: 90,
        sentiment: 0.75,
        type: "analytics",
      },

      // Weak collaborations (potential silos)
      {
        from: "Design",
        to: "QA",
        volume: 25,
        sentiment: 0.5,
        type: "visual_qa",
      }, // SILO!
      {
        from: "Mobile",
        to: "Design",
        volume: 40,
        sentiment: 0.55,
        type: "mobile_design",
      },
      {
        from: "DevOps",
        to: "Frontend",
        volume: 30,
        sentiment: 0.4,
        type: "ci_support",
      }, // SILO!
    ];

    for (const collab of collaborations) {
      await session.run(
        `MATCH (a:Team {name: $from}), (b:Team {name: $to})
         CREATE (a)-[:COLLABORATES_WITH {
           volume: $volume, 
           sentiment: $sentiment, 
           type: $type,
           last_updated: datetime()
         }]->(b)`,
        collab,
      );
    }
    console.log(
      `✓ Created ${collaborations.length} COLLABORATES_WITH relationships`,
    );

    // 3. Link existing Developers to Teams
    const devTeamMappings = [
      { dev: "Alice", team: "Frontend" },
      { dev: "Bob", team: "Backend" },
      { dev: "Carol", team: "DevOps" },
      { dev: "David", team: "Backend" },
      { dev: "Eva", team: "Frontend" },
      { dev: "Frank", team: "QA" },
    ];

    for (const mapping of devTeamMappings) {
      await session.run(
        `MATCH (d:Developer) WHERE d.name CONTAINS $dev
         MATCH (t:Team {name: $team})
         MERGE (d)-[:MEMBER_OF]->(t)`,
        mapping,
      );
    }
    console.log(`✓ Linked Developers to Teams`);

    // 4. Create Silo Alert nodes for detection
    await session.run(`
      CREATE (a:SiloAlert {
        teams: 'Frontend <> Backend',
        severity: 'High',
        detected_at: datetime(),
        message: 'API discussions happening late - only 5% pre-implementation communication',
        recommendation: 'Schedule weekly API contract reviews before sprint starts'
      })
    `);

    await session.run(`
      CREATE (a:SiloAlert {
        teams: 'Design <> QA',
        severity: 'Medium',
        detected_at: datetime(),
        message: 'Visual consistency issues found late in cycle',
        recommendation: 'Include QA in design reviews earlier'
      })
    `);
    console.log(`✓ Created 2 SiloAlert nodes`);

    console.log("\n✅ Neo4j Team Graph Seeded Successfully!");
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await session.close();
    await driver.close();
  }
}

seed();
