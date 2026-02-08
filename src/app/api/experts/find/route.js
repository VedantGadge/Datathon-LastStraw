import { NextResponse } from "next/server";

export const maxDuration = 60;

function clampInt(value, { min, max, fallback }) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function getHfExpertsFindUrl() {
  const rawBase =
    process.env.HF_EXPERTS_BASE_URL ||
    process.env.HF_AGENT_BASE_URL ||
    process.env.HF_AGENT_URL ||
    "https://vedantshirgaonkar-datathon-agents.hf.space";
  const base = rawBase.endsWith("/") ? rawBase.slice(0, -1) : rawBase;
  return `${base}/api/experts/find`;
}

export async function POST(request) {
  const start = Date.now();

  try {
    const body = await request.json();
    const query = typeof body?.query === "string" ? body.query.trim() : "";
    const mode = typeof body?.mode === "string" ? body.mode : "full";
    const limit = clampInt(body?.limit, { min: 1, max: 20, fallback: 5 });

    if (!query) {
      return NextResponse.json(
        {
          status: "error",
          mode,
          query: "",
          experts: [],
          report: "Missing query",
          elapsed_s: (Date.now() - start) / 1000,
        },
        { status: 400 },
      );
    }

    const payload = { query, mode, limit };

    const response = await fetch(getHfExpertsFindUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const elapsed_s = (Date.now() - start) / 1000;

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        {
          status: "error",
          mode,
          query,
          experts: [],
          report: `HF experts service error (${response.status})${text ? `: ${text}` : ""}`,
          elapsed_s,
        },
        { status: 502 },
      );
    }

    // Prefer JSON; fall back to text.
    let data;
    try {
      data = await response.json();
    } catch {
      const text = await response.text();
      data = { status: "success", mode, query, experts: [], report: text };
    }

    return NextResponse.json({
      status: data?.status || "success",
      mode: data?.mode || mode,
      query: data?.query || query,
      experts: Array.isArray(data?.experts) ? data.experts : [],
      report: typeof data?.report === "string" ? data.report : "",
      elapsed_s,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        mode: "full",
        query: "",
        experts: [],
        report: error?.message || "Server error",
        elapsed_s: (Date.now() - start) / 1000,
      },
      { status: 500 },
    );
  }
}
