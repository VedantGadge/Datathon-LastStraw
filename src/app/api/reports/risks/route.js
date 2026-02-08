import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const start = Date.now();
  try {
    const baseUrl =
      process.env.HF_REPORTS_BASE_URL ||
      "https://vedantshirgaonkar-datathon-agents.hf.space";

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);

    const response = await fetch(`${baseUrl}/api/reports/risks`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: "{}",
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(
        `HF risks report returned ${response.status}: ${await response.text()}`,
      );
    }

    const data = await response.json();
    return NextResponse.json({
      ...data,
      elapsed_s: data?.elapsed_s ?? (Date.now() - start) / 1000,
    });
  } catch (error) {
    console.error("Risks Report Proxy Error:", error);
    return NextResponse.json(
      {
        status: "error",
        error: error.message,
        projects: [],
        elapsed_s: (Date.now() - start) / 1000,
      },
      { status: 500 },
    );
  }
}
