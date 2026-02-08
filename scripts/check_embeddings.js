// Check embeddings table structure and content
const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  password: "KJDATATHON2026!",
  host: "engineering-intelligence1.chwmsemq65p7.ap-south-1.rds.amazonaws.com",
  port: 5432,
  database: "engineering_intelligence",
  ssl: { rejectUnauthorized: false },
});

async function checkEmbeddings() {
  const client = await pool.connect();

  try {
    console.log("=== EMBEDDINGS TABLE ANALYSIS ===\n");

    // 1. Check table structure
    const schemaRes = await client.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'embeddings'
      ORDER BY ordinal_position
    `);

    console.log("Table Schema:");
    schemaRes.rows.forEach((col) => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });

    // 2. Count rows
    const countRes = await client.query("SELECT COUNT(*) FROM embeddings");
    console.log(`\nTotal Rows: ${countRes.rows[0].count}`);

    // 3. Sample data (without the full vector)
    const sampleRes = await client.query(`
      SELECT id, content_type, source_id, metadata, created_at,
             LEFT(content::text, 100) as content_preview
      FROM embeddings
      LIMIT 5
    `);

    console.log("\nSample Data:");
    sampleRes.rows.forEach((row, i) => {
      console.log(`\n--- Row ${i + 1} ---`);
      console.log(`  ID: ${row.id}`);
      console.log(`  Type: ${row.content_type}`);
      console.log(`  Source: ${row.source_id}`);
      console.log(`  Content: ${row.content_preview}...`);
      console.log(`  Metadata: ${JSON.stringify(row.metadata)}`);
    });

    // 4. Check content types
    const typesRes = await client.query(`
      SELECT content_type, COUNT(*) as count
      FROM embeddings
      GROUP BY content_type
    `);

    console.log("\nContent Types:");
    typesRes.rows.forEach((t) => {
      console.log(`  - ${t.content_type}: ${t.count} rows`);
    });

    // 5. Check if pgvector extension is enabled
    const extRes = await client.query(`
      SELECT extname FROM pg_extension WHERE extname = 'vector'
    `);
    console.log(
      `\npgvector Extension: ${extRes.rows.length > 0 ? "ENABLED ✓" : "NOT FOUND"}`,
    );
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkEmbeddings();
