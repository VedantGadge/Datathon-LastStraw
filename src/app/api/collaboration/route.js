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
    // 1. Derive collaboration from shared project contributions
    const collabResult = await session.run(`
      MATCH (d1:Developer)-[:MEMBER_OF]->(t1:Team),
            (d2:Developer)-[:MEMBER_OF]->(t2:Team),
            (d1)-[:CONTRIBUTES_TO]->(p:Project)<-[:CONTRIBUTES_TO]-(d2)
      WHERE t1 <> t2
      RETURN t1.name AS source, t2.name AS target, 
             count(DISTINCT p) AS sharedProjects,
             count(*) AS interactionVolume
      ORDER BY interactionVolume DESC
    `);

    const interactionMatrix = collabResult.records.map((r) => ({
      source: r.get("source"),
      target: r.get("target"),
      sharedProjects: r.get("sharedProjects").toNumber(),
      volume: r.get("interactionVolume").toNumber(),
      strength:
        r.get("interactionVolume").toNumber() > 50
          ? "Strong"
          : r.get("interactionVolume").toNumber() > 20
            ? "Medium"
            : "Weak",
    }));

    // 2. Get all teams for completeness
    const teamsResult = await session.run(`
      MATCH (t:Team)
      RETURN t.name AS name, t.size AS size, t.lead AS lead
    `);

    const teams = teamsResult.records.map((r) => ({
      name: r.get("name"),
      size: r.get("size")?.toNumber?.() || 0,
      lead: r.get("lead"),
    }));

    // 3. Get silo alerts
    const alertsResult = await session.run(`
      MATCH (a:SiloAlert)
      RETURN a.teams AS teams, a.severity AS severity, 
             a.message AS message, a.recommendation AS recommendation
    `);

    const siloAlerts = alertsResult.records.map((r) => ({
      teams: r.get("teams"),
      severity: r.get("severity"),
      message: r.get("message"),
      recommendation: r.get("recommendation"),
    }));

    // 4. Compute collaboration score (simplified)
    const totalInteractions = interactionMatrix.reduce(
      (sum, i) => sum + i.volume,
      0,
    );
    const maxPossible = teams.length * (teams.length - 1) * 100; // Theoretical max
    const collaborationScore = Math.min(
      100,
      Math.round((totalInteractions / Math.max(maxPossible, 1)) * 100 * 10),
    );

    return NextResponse.json({
      hasData: true,
      collaborationScore,
      teams,
      interactionMatrix,
      siloAlerts,
    });
  } catch (err) {
    console.error("Neo4j Query Error:", err.message);
    return NextResponse.json({
      hasData: false,
      error: err.message,
      // Fallback data
      collaborationScore: 72,
      interactionMatrix: [
        {
          source: "Frontend",
          target: "Design",
          volume: 200,
          strength: "Strong",
        },
        {
          source: "Backend",
          target: "DevOps",
          volume: 150,
          strength: "Strong",
        },
        { source: "Frontend", target: "Backend", volume: 30, strength: "Weak" },
      ],
      siloAlerts: [
        {
          teams: "Frontend <> Backend",
          severity: "High",
          message: "Late API discussions",
        },
      ],
    });
  } finally {
    await session.close();
  }
}
