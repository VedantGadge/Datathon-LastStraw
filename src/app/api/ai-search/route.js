import { NextResponse } from "next/server";
import { Pool } from "pg";

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

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    const client = await pool.connect();

    let results = [];

    if (query) {
      // Search in embeddings content (text search, not vector for now)
      const searchRes = await client.query(
        `
        SELECT id, content_type, content, metadata, created_at
        FROM embeddings
        WHERE content ILIKE $1
        ORDER BY created_at DESC
        LIMIT 10
      `,
        [`%${query}%`],
      );

      results = searchRes.rows.map((r) => ({
        id: r.id,
        type: r.content_type,
        content: r.content?.substring(0, 200) + "...",
        metadata: r.metadata,
        relevance: 0.85 + Math.random() * 0.15, // Simulated relevance score
      }));
    } else {
      // Get recent embeddings
      const recentRes = await client.query(`
        SELECT id, content_type, content, metadata, created_at
        FROM embeddings
        ORDER BY created_at DESC
        LIMIT 10
      `);

      results = recentRes.rows.map((r) => ({
        id: r.id,
        type: r.content_type,
        content: r.content?.substring(0, 200) + "...",
        metadata: r.metadata,
      }));
    }

    // Get content types for filtering
    const typesRes = await client.query(`
      SELECT content_type, COUNT(*) as count
      FROM embeddings
      GROUP BY content_type
    `);

    client.release();

    return NextResponse.json({
      hasData: true,
      query,
      results,
      contentTypes: typesRes.rows,
      totalEmbeddings: typesRes.rows.reduce(
        (sum, t) => sum + parseInt(t.count),
        0,
      ),
    });
  } catch (err) {
    console.error("AI Search Error:", err.message);
    return NextResponse.json({
      hasData: false,
      error: err.message,
      results: [],
      // Fallback demo results
      demoResults: [
        {
          type: "slack",
          content: "Discussion about login performance issues...",
          relevance: 0.92,
        },
        {
          type: "jira",
          content: "AUTH-123: Optimize token refresh mechanism",
          relevance: 0.88,
        },
        {
          type: "code",
          content: "// TODO: Refactor authentication middleware",
          relevance: 0.75,
        },
      ],
    });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { query, context } = body;
    const apiKey = process.env.FEATHERLESS_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        hasData: false,
        aiResponse: "Featherless API key missing. Please check .env.local",
      });
    }

    // 1. Retrieve relevant context from embeddings (Text Search for now)
    const client = await pool.connect();
    const searchRes = await client.query(
      `
      SELECT content, metadata
      FROM embeddings
      WHERE content ILIKE $1
      LIMIT 3
    `,
      [
        `%${query
          .split(" ")
          .filter((w) => w.length > 3)
          .join("%")}%`,
      ], // Simple keyword matching
    );
    client.release();

    const retrievedContext = searchRes.rows
      .map((r) => r.content)
      .join("\n---\n");

    // 2. Build Prompt
    const systemPrompt = `You are "Endurance AI", an expert engineering assistant. 
    A user is asking a question about the engineering team's status.
    Use the provided "Knowledge Base" and "Dashboard Context" to answer.
    If the answer isn't in the context, say so politely but offer general engineering advice.
    Keep answers concise (under 3 sentences) and professional.`;

    const userPrompt = `
    Question: ${query}

    Knowledge Base:
    ${retrievedContext || "No specific documents found."}

    Dashboard Context:
    ${JSON.stringify(context || {})}

    Answer:
    `;

    // 3. Call Featherless AI
    const MAX_RETRIES = 3;
    let aiResponse = "No response generated.";

    for (let i = 0; i < MAX_RETRIES; i++) {
      try {
        const response = await fetch(
          "https://api.featherless.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: "mistralai/Mistral-7B-Instruct-v0.1",
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
              ],
              temperature: 0.7,
              max_tokens: 300,
            }),
          },
        );

        if (response.status === 429) {
          const waitTime = 1000 * Math.pow(2, i);
          await new Promise((r) => setTimeout(r, waitTime));
          continue;
        }

        if (!response.ok) {
          if (i === MAX_RETRIES - 1) throw new Error(await response.text());
          continue;
        }

        const aiData = await response.json();
        aiResponse =
          aiData.choices[0]?.message?.content || "No response generated.";

        // Clean up <think> tags if present
        aiResponse = aiResponse.replace(/<think>[\s\S]*?<\/think>/, "").trim();
        break;
      } catch (err) {
        console.error(`AI Search Attempt ${i + 1} failed:`, err);
        if (i === MAX_RETRIES - 1)
          aiResponse =
            "I'm currently experiencing high traffic. Please try again in a moment.";
      }
    }

    return NextResponse.json({
      hasData: true,
      query,
      aiResponse,
      sources: searchRes.rows.map((r) => r.metadata?.source || "Internal KB"),
    });
  } catch (err) {
    console.error("AI Search Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
