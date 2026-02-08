import { NextResponse } from "next/server";
import neo4j from "neo4j-driver";

const driver = neo4j.driver(
  process.env.NEO4J_URI || "neo4j+s://ca5e560b.databases.neo4j.io",
  neo4j.auth.basic(
    process.env.NEO4J_USERNAME || "neo4j",
    process.env.NEO4J_PASSWORD || "PzRU_PZrEUFz3xkhJQaE7OxX8z_ONK3oxX5yZcFXXOw",
  ),
);

export async function GET() {
  const session = driver.session();

  try {
    // Get all skills and their coverage
    const skillsResult = await session.run(`
      MATCH (s:Skill)
      OPTIONAL MATCH (d:Developer)-[:HAS_SKILL]->(s)
      RETURN s.name AS skill, s.category AS category, count(d) AS developers
      ORDER BY developers DESC
    `);

    const skills = skillsResult.records.map((r) => ({
      name: r.get("skill"),
      category: r.get("category") || "General",
      developers: r.get("developers").toNumber(),
    }));

    // Calculate skill gaps (skills with low developer coverage)
    const totalDevs = 6; // From audit
    const skillGaps = skills.map((s) => ({
      ...s,
      coverage: Math.round((s.developers / totalDevs) * 100),
      gap: Math.round((1 - s.developers / totalDevs) * 100),
      status:
        s.developers < 2 ? "critical" : s.developers < 4 ? "warning" : "good",
    }));

    // Get developer-skill matrix
    const matrixResult = await session.run(`
      MATCH (d:Developer)-[:HAS_SKILL]->(s:Skill)
      RETURN d.name AS developer, collect(s.name) AS skills
    `);

    const developerSkills = matrixResult.records.map((r) => ({
      developer: r.get("developer"),
      skills: r.get("skills"),
    }));

    await session.close();

    // Recommended skills to hire for
    const criticalGaps = skillGaps.filter((s) => s.status === "critical");

    return NextResponse.json({
      hasData: true,
      skills: skillGaps,
      developerSkills,
      summary: {
        totalSkills: skills.length,
        criticalGaps: criticalGaps.length,
        avgCoverage: Math.round(
          skillGaps.reduce((s, sk) => s + sk.coverage, 0) /
            Math.max(skillGaps.length, 1),
        ),
      },
      recommendations: criticalGaps.map((s) => ({
        skill: s.name,
        action: `Hire or train for ${s.name}`,
        priority: "High",
      })),
    });
  } catch (err) {
    console.error("Neo4j Skills Error:", err.message);
    return NextResponse.json({
      hasData: false,
      error: err.message,
      skills: [
        { name: "React/Next.js", coverage: 80, gap: 20, status: "good" },
        { name: "Python/AI", coverage: 30, gap: 70, status: "critical" },
        { name: "Kubernetes", coverage: 50, gap: 50, status: "warning" },
        { name: "Rust", coverage: 10, gap: 90, status: "critical" },
      ],
      summary: { totalSkills: 4, criticalGaps: 2, avgCoverage: 42 },
    });
  } finally {
    await session.close();
  }
}
