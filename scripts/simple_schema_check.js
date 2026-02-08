const { createClient } = require("@clickhouse/client");
require("dotenv").config({ path: ".env.local" });

async function main() {
  const client = createClient({
    url: process.env.CLICKHOUSE_HOST,
    username: process.env.CLICKHOUSE_USER,
    password: process.env.CLICKHOUSE_PASSWORD,
  });

  try {
    const rows = await client.query({
      query: "DESCRIBE dora_daily_metrics",
      format: "JSONEachRow",
    });
    const result = await rows.json();
    console.log("Columns in dora_daily_metrics:");
    result.forEach((row) => console.log(`- ${row.name} (${row.type})`));
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

main();
