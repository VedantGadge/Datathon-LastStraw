import { NextResponse } from "next/server";

export const maxDuration = 60; // Allow longer timeout for AI parsing

function clampInt(value, { min, max, fallback }) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function safeProjectId(projectId) {
  if (!projectId) return null;
  if (typeof projectId !== "string") return null;
  const trimmed = projectId.trim();
  if (!trimmed) return null;
  // Conservative allowlist to avoid SQL injection in the ClickHouse query.
  if (!/^[a-zA-Z0-9_.-]{1,64}$/.test(trimmed)) return null;
  return trimmed;
}

function extractLikelyJson(text) {
  if (!text) return null;

  const fenced = text.match(/```json\s*(\{[\s\S]*?\})\s*```/i);
  if (fenced?.[1]) return fenced[1];

  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    return text.slice(first, last + 1);
  }
  return null;
}

export async function POST(request) {
  const start = Date.now();
  try {
    const body = await request.json();
    const project_id = safeProjectId(body?.project_id);
    const days_current = clampInt(body?.days_current, {
      min: 1,
      max: 90,
      fallback: 7,
    });
    const days_baseline = clampInt(body?.days_baseline, {
      min: 1,
      max: 365,
      fallback: 30,
    });

    if (body?.project_id && !project_id) {
      return NextResponse.json(
        {
          status: "error",
          anomaly_count: 0,
          anomalies: [],
          alert_text:
            "Invalid project_id. Use 1-64 chars: letters, numbers, underscore, dash, dot.",
          quality_score: 0,
          elapsed_s: (Date.now() - start) / 1000,
        },
        { status: 400 },
      );
    }

    // 1. Fetch Metrics from ClickHouse
    const { createClient } = await import("@clickhouse/client");
    const client = createClient({
      url:
        process.env.CLICKHOUSE_URL ||
        "https://xgo7i4yevb.ap-south-1.aws.clickhouse.cloud:8443",
      username: process.env.CLICKHOUSE_USERNAME || "default",
      password: process.env.CLICKHOUSE_PASSWORD || "~2UlIutr_dmNI",
      database: process.env.CLICKHOUSE_DATABASE || "default",
    });

    // Helper to fetch metrics for a specific window
    const getMetrics = async (daysOffset, daysDuration) => {
      // daysOffset: how many days ago the window ENDED (0 = now)
      // daysDuration: length of the window
      // Window: [now - (offset+duration), now - offset]

      // Construct WHERE clause
      const timeFilter = `
            timestamp >= now() - INTERVAL ${daysOffset + daysDuration} DAY 
            AND timestamp < now() - INTERVAL ${daysOffset} DAY
        `;

      const query = `
            SELECT 
                countIf(event_type = 'deployment') as total_deployments,
                avgIf(JSONExtractFloat(metadata, 'lead_time_hours'), event_type = 'pr_merged') as avg_lead_time_hours,
                countIf(event_type = 'deployment' AND JSONExtractString(metadata, 'status') = 'failed') as total_failures,
                avgIf(JSONExtractFloat(metadata, 'mttr_seconds'), event_type = 'incident_resolved') as avg_mttr
            FROM events
            WHERE ${timeFilter}
            ${project_id ? `AND project_id = '${project_id}'` : ""}
        `;

      const result = await client.query({ query, format: "JSONEachRow" });
      const rows = await result.json();
      const data = rows[0] || {};

      const deployments = parseInt(data.total_deployments || 0);
      const failures = parseInt(data.total_failures || 0);

      return {
        deployments,
        deploymentsPerDay: parseFloat((deployments / daysDuration).toFixed(2)),
        leadTimeHours: parseFloat((data.avg_lead_time_hours || 0).toFixed(2)),
        failureRate:
          deployments > 0
            ? parseFloat(((failures / deployments) * 100).toFixed(2))
            : 0,
        mttrMinutes: parseFloat(((data.avg_mttr || 0) / 60).toFixed(2)),
      };
    };

    const currentMetrics = await getMetrics(0, days_current);
    const baselineMetrics = await getMetrics(days_current, days_baseline);

    await client.close();

    // 2. Prepare Prompt for AI
    const prompt = `
You are an expert Engineering Intelligence AI. Analyze these DORA metrics for anomalies.

Current Period (Last ${days_current} days):
- Deployment Frequency: ${currentMetrics.deploymentsPerDay}/day
- Lead Time for Changes: ${currentMetrics.leadTimeHours} hours
- Change Failure Rate: ${currentMetrics.failureRate}%
- MTTR: ${currentMetrics.mttrMinutes} minutes

Baseline Period (Previous ${days_baseline} days):
- Deployment Frequency: ${baselineMetrics.deploymentsPerDay}/day
- Lead Time for Changes: ${baselineMetrics.leadTimeHours} hours
- Change Failure Rate: ${baselineMetrics.failureRate}%
- MTTR: ${baselineMetrics.mttrMinutes} minutes

Task:
1. Compare Current vs Baseline.
2. Detect significant anomalies (positive or negative).
3. Assign a Quality Score (0-100) for the current period based on engineering health.
4. Generate a JSON response with this EXACT structure (valid JSON only, no markdown):
{
  "anomaly_count": <number>,
  "anomalies": [
    {
      "metric": "<Metric Name>",
      "severity": "<Critical|Warning|Info>",
      "deviation": "<e.g. +50%>",
      "root_cause": "<Speculative root cause based on metric relationships>",
      "recommendation": "<Actionable advice>"
    }
  ],
  "alert_text": "<One sentence summary of the status>",
  "quality_score": <number>
}

If no anomalies, return anomaly_count: 0 and empty list.
`;

    // 3. Call HF Agent
    const aiPayload = {
      project_id,
      days_current,
      days_baseline,
      current_metrics: currentMetrics,
      baseline_metrics: baselineMetrics,
    };

    console.log("Sending payload to AI:", JSON.stringify(aiPayload, null, 2));

    const response = await fetch(
      "https://vedantshirgaonkar-datathon-agents.hf.space/api/anomalies",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aiPayload),
      },
    );

    if (!response.ok) {
      throw new Error(`AI Agent returned ${response.status}`);
    }

    // 4. Parse JSON from AI Response
    let aiJson = {
      anomaly_count: 0,
      anomalies: [],
      quality_score: 0,
      alert_text: "Analysis completed.",
    };

    try {
      const responseData = await response.json();
      // Handle potential different response structures
      if (responseData.status) {
        aiJson = responseData;
      } else if (responseData.response) {
        // Fallback if wrapped
        if (typeof responseData.response === "string") {
          let cleanResponse = responseData.response
            .replace(/^\s*\*\[.*?\]\*\s*/, "")
            .trim();
          // Also remove potential markdown code blocks if present
          cleanResponse = cleanResponse
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();
          aiJson = JSON.parse(cleanResponse);
        } else {
          aiJson = responseData.response;
        }
      } else {
        aiJson = responseData;
      }
    } catch (e) {
      console.error("JSON Parse Error:", e);
      aiJson.alert_text = "Analysis returned invalid format.";
    }

    const elapsed = (Date.now() - start) / 1000;

    return NextResponse.json({
      status: "success",
      anomaly_count: aiJson.anomaly_count || 0,
      anomalies: aiJson.anomalies || [],
      alert_text: aiJson.alert_text || "Analysis complete.",
      quality_score: aiJson.quality_score || 0,
      elapsed_s: elapsed,
    });
  } catch (error) {
    console.error("Anomaly API Error:", error);
    return NextResponse.json(
      {
        status: "error",
        anomaly_count: 0,
        anomalies: [],
        alert_text: error?.message
          ? `System Error: ${error.message}`
          : "System Error: Could not run analysis.",
        quality_score: 0,
        elapsed_s: (Date.now() - start) / 1000,
      },
      { status: 500 },
    );
  }
}
