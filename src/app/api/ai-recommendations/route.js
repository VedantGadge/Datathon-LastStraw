import { NextResponse } from "next/server";

// True LLM-powered recommendations using Featherless AI
export async function GET() {
  try {
    const { createClient } = await import("@clickhouse/client");

    const client = createClient({
      url:
        process.env.CLICKHOUSE_URL ||
        "https://xgo7i4yevb.ap-south-1.aws.clickhouse.cloud:8443",
      username: process.env.CLICKHOUSE_USERNAME || "default",
      password: process.env.CLICKHOUSE_PASSWORD || "~2UlIutr_dmNI",
      database: process.env.CLICKHOUSE_DATABASE || "default",
    });

    // 1. Gather all metrics from ClickHouse
    const metricsData = {};

    // Workflow runs (CI builds)
    const workflowResult = await client.query({
      query: `
        SELECT 
          project_id,
          countIf(JSONExtractString(metadata, 'conclusion') = 'success') as success,
          countIf(JSONExtractString(metadata, 'conclusion') != 'success') as failed
        FROM events
        WHERE event_type = 'workflow_run'
        GROUP BY project_id
      `,
      format: "JSONEachRow",
    });
    metricsData.ciBuilds = await workflowResult.json();

    // PR review times
    const reviewResult = await client.query({
      query: `
        SELECT 
          project_id,
          avg(JSONExtractFloat(metadata, 'review_time_minutes')) as avg_review_mins,
          count() as review_count
        FROM events
        WHERE event_type = 'pr_reviewed'
        GROUP BY project_id
      `,
      format: "JSONEachRow",
    });
    metricsData.reviewTimes = await reviewResult.json();

    // Lead times
    const leadTimeResult = await client.query({
      query: `
        SELECT 
          project_id,
          avg(JSONExtractFloat(metadata, 'lead_time_hours')) as avg_lead_time,
          count() as pr_count
        FROM events
        WHERE event_type = 'pr_merged'
        GROUP BY project_id
      `,
      format: "JSONEachRow",
    });
    metricsData.leadTimes = await leadTimeResult.json();

    // Code churn by developer
    const churnResult = await client.query({
      query: `
        SELECT 
          actor_id,
          sum(JSONExtractInt(metadata, 'lines_added')) as lines_added,
          sum(JSONExtractInt(metadata, 'lines_deleted')) as lines_deleted,
          count() as commit_count
        FROM events
        WHERE event_type = 'commit'
        GROUP BY actor_id
        ORDER BY (lines_added + lines_deleted) DESC
        LIMIT 5
      `,
      format: "JSONEachRow",
    });
    metricsData.codeChurn = await churnResult.json();

    await client.close();

    // 2. Check for Featherless API key
    // 2. Call HF Agent for Recommendations
    try {
      const payload = {
        message: `Analyze these engineering metrics and provide 3-5 actionable recommendations.
            Return ONLY a JSON array with objects containing: "title", "description", "priority" (High/Medium/Low), "impact".
            
            Metrics Context:
            ${JSON.stringify(metricsData)}`,
        thread_id: crypto.randomUUID(),
        stream: false,
      };

      console.log("Sending to HF Agent (Recommendations)...");

      const response = await fetch(
        "https://vedantshirgaonkar-datathon-agents.hf.space/api/message",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        throw new Error(
          `HF Agent returned ${response.status}: ${await response.text()}`,
        );
      }

      // Logic to extract JSON from the response text (handling potential markdown blocks)
      const responseData = await response.json();
      let jsonContent = "";
      if (typeof responseData === "string") jsonContent = responseData;
      else if (responseData.response) jsonContent = responseData.response;
      else if (responseData.content) jsonContent = responseData.content;
      else if (responseData.message) jsonContent = responseData.message;
      else jsonContent = JSON.stringify(responseData);
      // Clean up <think> tags if present
      jsonContent = jsonContent.replace(/<think>[\s\S]*?<\/think>/, "").trim();
      // Clean up model name artifacts if present (e.g. *[gpt-4o-mini]*)
      jsonContent = jsonContent.replace(/^\s*\*\[.*?\]\*\s*/, "").trim();

      const jsonMatch =
        jsonContent.match(/```json\n([\s\S]*?)\n```/) ||
        jsonContent.match(/```\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        jsonContent = jsonMatch[1];
      }

      let recommendations = [];
      try {
        recommendations = JSON.parse(jsonContent);
        // Handle if wrapped in an object
        if (
          !Array.isArray(recommendations) &&
          recommendations.recommendations
        ) {
          recommendations = recommendations.recommendations;
        }
      } catch (e) {
        console.warn(
          "Failed to parse JSON from AI response, using rule-based fallback:",
          e,
        );
        return generateRuleBasedRecommendations(metricsData, "Parse Error");
      }

      return NextResponse.json({
        hasData: true,
        source: "hf-agent-mistral",
        recommendations: Array.isArray(recommendations)
          ? recommendations.slice(0, 5)
          : [],
        summary: {
          high: recommendations.filter(
            (r) => r.severity === "High" || r.priority === "High",
          ).length,
          medium: recommendations.filter(
            (r) => r.severity === "Medium" || r.priority === "Medium",
          ).length,
          low: recommendations.filter(
            (r) => r.severity === "Low" || r.priority === "Low",
          ).length,
        },
        metrics: metricsData,
        lastAnalyzed: new Date().toISOString(),
      });
    } catch (err) {
      console.error("HF Agent Error:", err);
      return generateRuleBasedRecommendations(
        metricsData,
        `Agent Error: ${err.message}`,
      );
    }
  } catch (err) {
    console.error("AI Recommendations Error:", err.message);
    return NextResponse.json({
      hasData: false,
      error: err.message,
      recommendations: [
        {
          type: "error",
          severity: "medium",
          title: "Analysis Error",
          description: err.message,
          action: "Check server logs",
        },
      ],
      summary: { high: 0, medium: 1, low: 0 },
    });
  }
}

function buildPrompt(metrics) {
  return `Analyze these engineering metrics and provide 3-5 actionable recommendations:

CI/CD Builds: ${JSON.stringify(metrics.ciBuilds)}
PR Review Times: ${JSON.stringify(metrics.reviewTimes)}
PR Lead Times: ${JSON.stringify(metrics.leadTimes)}
Code Churn: ${JSON.stringify(metrics.codeChurn)}

Return a JSON array:
[{"type": "ci_failure|process|velocity", "severity": "high|medium|low", "title": "Short title", "description": "Data-backed observation", "action": "Specific fix"}]`;
}

function generateRuleBasedRecommendations(metrics, reason = "no API key") {
  const recommendations = [];

  metrics.ciBuilds?.forEach((w) => {
    const total = parseInt(w.success) + parseInt(w.failed);
    const failRate = total > 0 ? (parseInt(w.failed) / total) * 100 : 0;
    if (failRate > 20) {
      recommendations.push({
        type: "ci_failure",
        severity: "high",
        title: `CI Instability: ${w.project_id}`,
        description: `${Math.round(failRate)}% failure rate (${w.failed}/${total} runs)`,
        action: "Add retry logic and review flaky tests",
      });
    }
  });

  metrics.reviewTimes?.forEach((r) => {
    if (r.avg_review_mins > 60) {
      recommendations.push({
        type: "process",
        severity: "medium",
        title: `Slow Reviews: ${r.project_id}`,
        description: `${Math.round(r.avg_review_mins)}min average review time`,
        action: "Consider async reviews or smaller PRs",
      });
    }
  });

  metrics.leadTimes?.forEach((lt) => {
    if (lt.avg_lead_time > 48) {
      recommendations.push({
        type: "velocity",
        severity: "medium",
        title: `High Lead Time: ${lt.project_id}`,
        description: `${Math.round(lt.avg_lead_time)}h average to merge`,
        action: "Implement trunk-based development",
      });
    }
  });

  if (recommendations.length === 0) {
    recommendations.push({
      type: "team_health",
      severity: "low",
      title: "All Systems Healthy",
      description: "No critical issues detected",
      action: "Continue current practices",
    });
  }

  return NextResponse.json({
    hasData: true,
    source: `rule-based (${reason})`,
    recommendations: recommendations.slice(0, 5),
    summary: {
      high: recommendations.filter((r) => r.severity === "high").length,
      medium: recommendations.filter((r) => r.severity === "medium").length,
      low: recommendations.filter((r) => r.severity === "low").length,
    },
    metrics,
    lastAnalyzed: new Date().toISOString(),
  });
}
