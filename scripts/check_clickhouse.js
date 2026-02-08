// ClickHouse check - writes to file
const { createClient } = require("@clickhouse/client");
const fs = require("fs");

const client = createClient({
  url: "https://xgo7i4yevb.ap-south-1.aws.clickhouse.cloud:8443",
  username: "default",
  password: "~2UlIutr_dmNI",
  database: "default",
});

async function check() {
  let output = "";
  const log = (msg) => {
    console.log(msg);
    output += msg + "\n";
  };

  try {
    // Get event types
    const result = await client.query({
      query: `SELECT event_type, count() as cnt FROM events GROUP BY event_type ORDER BY cnt DESC`,
      format: "JSONEachRow",
    });
    const types = await result.json();

    log("EVENT TYPES IN CLICKHOUSE:");
    log("===========================");
    types.forEach((t) => log(`${t.event_type}: ${t.cnt}`));

    // Get sample of each type
    log("\nSAMPLE EVENTS BY TYPE:");
    log("======================");
    for (const t of types.slice(0, 5)) {
      const sample = await client.query({
        query: `SELECT * FROM events WHERE event_type = '${t.event_type}' LIMIT 1`,
        format: "JSONEachRow",
      });
      const s = await sample.json();
      log(`\n--- ${t.event_type} ---`);
      log(JSON.stringify(s[0], null, 2));
    }

    // Write to file
    fs.writeFileSync("clickhouse_report.txt", output);
    console.log("\nSaved to clickhouse_report.txt");
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await client.close();
  }
}

check();
