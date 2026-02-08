const { createClient } = require("@clickhouse/client");
require("dotenv").config({ path: ".env.local" });

async function check() {
  const client = createClient({
    url:
      process.env.CLICKHOUSE_URL ||
      "https://xgo7i4yevb.ap-south-1.aws.clickhouse.cloud:8443",
    username: process.env.CLICKHOUSE_USERNAME || "default",
    password: process.env.CLICKHOUSE_PASSWORD || "~2UlIutr_dmNI",
    database: process.env.CLICKHOUSE_DATABASE || "default",
  });

  try {
    const result = await client.query({
      query: "DESCRIBE TABLE dora_events",
      format: "JSONEachRow",
    });
    const columns = await result.json();
    const fs = require("fs");
    const output = columns.map((c) => `- ${c.name} (${c.type})`).join("\n");
    console.log("Writing columns to schema_output.txt");
    fs.writeFileSync("schema_output.txt", output);
    console.log(output);
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await client.close();
  }
}

check();
