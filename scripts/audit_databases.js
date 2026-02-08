const { Pool } = require("pg");
const neo4j = require("neo4j-driver");
const fs = require("fs");

let report = "";
function log(msg) {
  console.log(msg);
  report += msg + "\n";
}

// PostgreSQL
const pgPool = new Pool({
  user: "postgres",
  password: "KJDATATHON2026!",
  host: "engineering-intelligence1.chwmsemq65p7.ap-south-1.rds.amazonaws.com",
  port: 5432,
  database: "engineering_intelligence",
  ssl: { rejectUnauthorized: false },
});

// Neo4j
const neo4jDriver = neo4j.driver(
  "neo4j+s://ca5e560b.databases.neo4j.io",
  neo4j.auth.basic("neo4j", "PzRU_PZrEUFz3xkhJQaE7OxX8z_ONK3oxX5yZcFXXOw"),
);

async function checkPostgres() {
  log("\n========== POSTGRESQL ==========");
  try {
    const client = await pgPool.connect();

    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

    log("Tables found: " + tables.rows.length);

    for (const row of tables.rows) {
      try {
        const countRes = await client.query(
          `SELECT COUNT(*) FROM "${row.table_name}"`,
        );
        log(`  - ${row.table_name}: ${countRes.rows[0].count} rows`);
      } catch (e) {
        log(`  - ${row.table_name}: ERROR`);
      }
    }

    client.release();
  } catch (err) {
    log("Postgres Error: " + err.message);
  }
}

async function checkNeo4j() {
  log("\n========== NEO4J ==========");
  const session = neo4jDriver.session();
  try {
    const labels = await session.run("CALL db.labels()");
    log("Node Labels: " + labels.records.length);
    labels.records.forEach((r) => log(`  - ${r.get("label")}`));

    const rels = await session.run("CALL db.relationshipTypes()");
    log("Relationship Types: " + rels.records.length);
    rels.records.forEach((r) => log(`  - ${r.get("relationshipType")}`));

    const counts = await session.run(
      "MATCH (n) RETURN labels(n)[0] as label, count(n) as count",
    );
    log("Node Counts:");
    counts.records.forEach((r) =>
      log(`  - ${r.get("label")}: ${r.get("count").toNumber()}`),
    );
  } catch (err) {
    log("Neo4j Error: " + err.message);
  } finally {
    await session.close();
  }
}

async function checkClickhouse() {
  log("\n========== CLICKHOUSE ==========");
  try {
    const { createClient } = await import("@clickhouse/client");

    const client = createClient({
      url: "https://xgo7i4yevb.ap-south-1.aws.clickhouse.cloud:8443",
      username: "default",
      password: "~2UlIutr_dmNI",
      database: "default",
    });

    const result = await client.query({
      query: "SHOW TABLES",
      format: "JSONEachRow",
    });

    const tables = await result.json();
    log("Tables found: " + tables.length);
    tables.forEach((t) => log(`  - ${t.name}`));

    // Get row counts for each table
    for (const t of tables) {
      try {
        const countResult = await client.query({
          query: `SELECT count() as cnt FROM ${t.name}`,
          format: "JSONEachRow",
        });
        const countData = await countResult.json();
        log(`    Rows: ${countData[0]?.cnt || 0}`);
      } catch (e) {
        log(`    Rows: ERROR`);
      }
    }

    await client.close();
  } catch (err) {
    log("ClickHouse Error: " + err.message);
  }
}

async function main() {
  log("=== DATABASE AUDIT REPORT ===");
  log("Timestamp: " + new Date().toISOString());

  await checkPostgres();
  await checkNeo4j();
  await checkClickhouse();

  log("\n=== AUDIT COMPLETE ===");

  // Write report to file
  fs.writeFileSync("audit_report.txt", report);
  console.log("\nReport saved to audit_report.txt");

  await pgPool.end();
  await neo4jDriver.close();
}

main();
