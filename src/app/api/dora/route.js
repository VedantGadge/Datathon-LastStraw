import { NextResponse } from "next/server";

export const revalidate = 60; // Cache for 60 seconds

const HARDCODED_PROJECT_ID = "proj-api";
const HARDCODED_DAYS = 30;

export async function GET(request) {
  try {
    const backendUrl =
      process.env.DORA_BACKEND_URL ||
      "https://vedantshirgaonkar-datathon-agents.hf.space/api/metrics/dora";

    // Per request: hardcode the metrics request to match the backend expectation.
    // We keep this server-side so the frontend only calls GET /api/dora.
    const project_id = HARDCODED_PROJECT_ID;
    const days = HARDCODED_DAYS;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);

    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ project_id, days }),
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(
        `DORA backend returned ${response.status}: ${await response.text()}`,
      );
    }

    const raw = await response.json();
    const rawSummary = raw?.summary || raw?.data?.summary || {};
    const projects = raw?.projects || raw?.data?.projects || [];

    const asNumberOrUndefined = (value) => {
      if (value === undefined || value === null || value === "") return undefined;
      const n = typeof value === "number" ? value : Number(value);
      return Number.isFinite(n) ? n : undefined;
    };

    const normalizeIncomingSummary = (summary) => ({
      deploymentFrequency: asNumberOrUndefined(
        summary.deploymentFrequency ??
          summary.deployment_frequency ??
          summary.deployment_frequency_per_day ??
          summary.deploymentFrequencyPerDay,
      ),
      leadTime: asNumberOrUndefined(
        summary.leadTime ?? summary.lead_time ?? summary.lead_time_hours ?? summary.leadTimeHours,
      ),
      changeFailureRate: asNumberOrUndefined(
        summary.changeFailureRate ??
          summary.change_failure_rate ??
          summary.failure_rate ??
          summary.failureRate,
      ),
      mttr: asNumberOrUndefined(summary.mttr ?? summary.mttr_minutes ?? summary.mttrMins),
    });

    const incomingSummary = normalizeIncomingSummary(rawSummary);
    const hasIncomingSummaryValue = Object.values(incomingSummary).some(
      (v) => v !== undefined && v !== null,
    );

    const computeSummaryFromProjects = (projectRows, daysWindow) => {
      const rows = Array.isArray(projectRows) ? projectRows : [];

      // Prefer backend-provided frequency when present (matches sample response).
      const perWeekValues = rows
        .map((p) => asNumberOrUndefined(p?.deployment_freq_per_week))
        .filter((v) => v !== undefined);

      const deploymentFrequencyFromBackend =
        perWeekValues.length > 0
          ? Math.round(((perWeekValues.reduce((a, b) => a + b, 0) / perWeekValues.length) / 7) * 10) / 10
          : undefined;

      const totalDeployments = rows.reduce(
        (sum, p) => sum + (Number(p?.deployments) || 0),
        0,
      );
      const totalFailures = rows.reduce(
        (sum, p) => sum + (Number(p?.failed_deployments) || 0),
        0,
      );

      const deploymentFrequency =
        deploymentFrequencyFromBackend !== undefined
          ? deploymentFrequencyFromBackend
          : totalDeployments > 0 && daysWindow > 0
            ? Math.round((totalDeployments / daysWindow) * 10) / 10
            : undefined;

      // Weighted by PRs merged when present; otherwise simple average of non-null values.
      let leadTime;
      const leadRows = rows
        .map((p) => ({
          lead: asNumberOrUndefined(p?.avg_lead_time_hours),
          weight: Number(p?.prs_merged) || 0,
        }))
        .filter((r) => r.lead !== undefined);
      if (leadRows.length > 0) {
        const weightedSum = leadRows.reduce(
          (sum, r) => sum + r.lead * (r.weight > 0 ? r.weight : 1),
          0,
        );
        const weightTotal = leadRows.reduce(
          (sum, r) => sum + (r.weight > 0 ? r.weight : 1),
          0,
        );
        leadTime = weightTotal > 0 ? Math.round((weightedSum / weightTotal) * 10) / 10 : undefined;
      }

      // Prefer backend-provided % when present (matches sample response).
      const failurePctValues = rows
        .map((p) => asNumberOrUndefined(p?.change_failure_rate_pct))
        .filter((v) => v !== undefined);

      const changeFailureRate =
        failurePctValues.length > 0
          ? Math.round((failurePctValues.reduce((a, b) => a + b, 0) / failurePctValues.length) * 10) / 10
          : totalDeployments > 0
            ? Math.round(((totalFailures / totalDeployments) * 100) * 10) / 10
            : undefined;

      return {
        deploymentFrequency,
        leadTime,
        changeFailureRate,
        // Backend doesn't currently supply MTTR; keep undefined so UI falls back to demo.
        mttr: undefined,
      };
    };

    const computedSummary = computeSummaryFromProjects(projects, raw?.days || days);
    const hasComputedSummaryValue = Object.values(computedSummary).some(
      (v) => v !== undefined && v !== null,
    );

    const summary = hasIncomingSummaryValue
      ? incomingSummary
      : hasComputedSummaryValue
        ? computedSummary
        : rawSummary;

    const hasData =
      raw?.hasData ??
      raw?.has_data ??
      raw?.status === "ok" ??
      raw?.status === "success" ??
      (Array.isArray(projects) && projects.length > 0);

    return NextResponse.json({
      ...raw,
      hasData,
      summary,
      source: raw?.source || "vedantshirgaonkar-datathon-agents.hf.space",
    });
  } catch (err) {
    console.error("DORA Proxy Error:", err.message);
    // Fallback data
    return NextResponse.json({
      hasData: false,
      error: err.message,
      summary: {
        deploymentFrequency: 4.2,
        leadTime: 2.1,
        changeFailureRate: 8.5,
        mttr: 45,
      },
      dailyTrend: [],
    });
  }
}
