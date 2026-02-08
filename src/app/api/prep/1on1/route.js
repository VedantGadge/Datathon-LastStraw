import { NextResponse } from "next/server";

const DEVELOPERS = {
  Alice: { role: "Senior Backend Engineer", team: "Platform" },
  Bob: { role: "Frontend Developer", team: "Product UI" },
  Charlie: { role: "DevOps Engineer", team: "Infrastructure" },
  Diana: { role: "Product Manager", team: "Growth" },
  Evan: { role: "Full Stack Engineer", team: "Feature X" },
};

export async function GET() {
  return NextResponse.json({
    developers: Object.keys(DEVELOPERS),
  });
}

export async function POST(request) {
  const startTime = Date.now();
  let developerName = "";
  let role = null;
  let team = null;

  try {
    const body = await request.json();
    const { developer_name, manager_context } = body;
    developerName = developer_name;

    // 1. Use provided developer name directly
    // const dev = DEVELOPERS[developer_name]; // No longer validating against mock list

    // Default values if not found in mock list (or just leave null)
    const dev = DEVELOPERS[developer_name] || {};
    role = dev.role || "Developer";
    team = dev.team || "Engineering";

    // 2. Call HF Agent
    const payload = {
      developer_name,
      manager_context,
    };

    console.log("Sending payload to AI:", JSON.stringify(payload, null, 2));

    const aiResponse = await fetch(
      "https://vedantshirgaonkar-datathon-agents.hf.space/api/prep/1on1",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      throw new Error(`AI Agent returned ${aiResponse.status}: ${errText}`);
    }

    // 4. Parse AI Response
    let parsedAiData = {
      briefing: "⚠️ Could not generate briefing.",
      talking_points: [],
    };
    const responseData = await aiResponse.json(); // Expecting JSON response

    // The agent might return { message: "...", ... } or just the JSON we asked for if it followed instructions perfecty.
    // Or it might return { content: "..." }
    // console.log("AI Raw JSON Response:", responseData);

    let content = "";
    if (responseData.response) content = responseData.response;
    else if (responseData.content) content = responseData.content;
    else if (responseData.message) content = responseData.message;
    else if (typeof responseData === "string") content = responseData;
    else content = JSON.stringify(responseData);

    // Clean up model name artifacts if present (e.g. *[gpt-4o-mini]*)
    content = content.replace(/^\s*\*\[.*?\]\*\s*/, "").trim();

    // Try to parse content as JSON
    try {
      // dynamic cleanup of markdown code blocks
      const cleaned = content
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const innerJson = JSON.parse(jsonMatch[0]);
        // Merge with defaults
        parsedAiData = { ...parsedAiData, ...innerJson };
      } else {
        // Not JSON, assume text briefing
        if (cleaned.length > 5) {
          parsedAiData.briefing = cleaned;
          parsedAiData.talking_points = ["Discuss the briefing content."];
        }
      }
    } catch (e) {
      console.error("JSON parse of content failed", e);
      parsedAiData.briefing = content;
    }

    return NextResponse.json({
      status: "success",
      developer_name: developerName,
      team: team,
      role: role,
      briefing: parsedAiData.briefing || "No briefing generated.",
      talking_points: parsedAiData.talking_points || [],
      debug_raw: JSON.stringify(responseData).substring(0, 500),
      elapsed_s: (Date.now() - startTime) / 1000,
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      {
        status: "error",
        developer_name: developerName,
        team: team,
        role: role,
        briefing: `❌ Error preparing briefing: ${error.message}`,
        talking_points: [],
        elapsed_s: (Date.now() - startTime) / 1000,
      },
      { status: 500 },
    );
  }
}
