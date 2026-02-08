// Check ClickHouse events table schema
async function checkSchema() {
  try {
    const { createClient } = await import("@clickhouse/client");

    const client = createClient({
      url: "https://xgo7i4yevb.ap-south-1.aws.clickhouse.cloud:8443",
      username: "default",
      password: "~2UlIutr_dmNI",
      database: "default",
    });

    console.log("Checking events table schema...\n");

    const result = await client.query({
      query: "DESCRIBE TABLE events",
      format: "JSONEachRow",
    });

    const schema = await result.json();
    console.log("Events Table Schema:");
    schema.forEach((col) => {
      console.log(`  ${col.name}: ${col.type}`);
    });

    // Also check dora_daily_metrics
    console.log("\n\nChecking dora_daily_metrics schema...\n");
    const doraResult = await client.query({
      query: "DESCRIBE TABLE dora_daily_metrics",
      format: "JSONEachRow",
    });

    const doraSchema = await doraResult.json();
    console.log("DORA Metrics Table Schema:");
    doraSchema.forEach((col) => {
      console.log(`  ${col.name}: ${col.type}`);
    });

    // Sample existing data
    console.log("\n\nSample events data:");
    const sampleResult = await client.query({
      query: "SELECT * FROM events LIMIT 3",
      format: "JSONEachRow",
    });
    const sampleData = await sampleResult.json();
    console.log(JSON.stringify(sampleData, null, 2));

    await client.close();
  } catch (err) {
    console.error("Error:", err.message);
  }
}

checkSchema();
