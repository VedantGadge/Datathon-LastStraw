import { NextResponse } from "next/server";

export async function POST(request) {
  const start = Date.now();
  try {
    const body = await request.json();

    // Proxy to External HF API
    const response = await fetch(
      "https://vedantshirgaonkar-datathon-agents.hf.space/api/metrics/dora",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );

    if (!response.ok) {
      throw new Error(
        `External API returned ${response.status}: ${await response.text()}`,
      );
    }

    const data = await response.json();

    // Sanitize response from potentially leaked model names (e.g. *[model-name]*)
    // Although this is metrics data, if it contains string summaries, we should be safe.
    // Deep traverse or stringify-clean-parse if simpler.
    // For DORA metrics which are mostly numbers/objects, this might be overkill but safe.

    // Simple string sanitization on the whole JSON string if it was text,
    // but here we have an object. `data` is the object.
    // We'll leave it as is unless we see artifacts, but consistent with other routes:
    // If there's a specific text field, we'd clean it.
    // The sample response has "status", "days", "summary", "projects".
    // "summary" might be text? Sample says "summary": {}.

    return NextResponse.json({
      ...data,
      elapsed_s: (Date.now() - start) / 1000,
    });
  } catch (error) {
    console.error("DORA Metrics Proxy Error:", error);
    return NextResponse.json(
      {
        status: "error",
        error: error.message,
        elapsed_s: (Date.now() - start) / 1000,
      },
      { status: 500 },
    );
  }
}
