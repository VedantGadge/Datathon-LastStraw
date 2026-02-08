const neo4j = require("neo4j-driver");
require("dotenv").config({ path: ".env.local" });

const driver = neo4j.driver(
  process.env.NEO4J_URI || "neo4j+s://ca5e560b.databases.neo4j.io",
  neo4j.auth.basic(
    process.env.NEO4J_USERNAME || "neo4j",
    process.env.NEO4J_PASSWORD || "PzRU_PZrEUFz3xkhJQaE7OxX8z_ONK3oxX5yZcFXXOw",
  ),
);

async function seed() {
  const session = driver.session();
  try {
    console.log("Clearing existing data...");
    await session.run("MATCH (n) DETACH DELETE n");

    console.log("Seeding Teams...");
    await session.run(`
            CREATE 
            (t1:Team {name: 'Frontend', size: 12, lead: 'Sarah C.'}),
            (t2:Team {name: 'Backend', size: 18, lead: 'Mike R.'}),
            (t3:Team {name: 'DevOps', size: 8, lead: 'Alex T.'}),
            (t4:Team {name: 'Design', size: 6, lead: 'Jessica L.'}),
            (t5:Team {name: 'QA', size: 10, lead: 'David K.'}),
            (t6:Team {name: 'Mobile', size: 8, lead: 'Emily W.'}),
            (t7:Team {name: 'Data', size: 5, lead: 'Robert M.'}),
            (t8:Team {name: 'Security', size: 4, lead: 'Lisa P.'})
        `);

    console.log("Seeding Developers and Relationships...");
    // Generate developers for each team
    await session.run(`
            MATCH (t:Team)
            WITH t, range(1, t.size) AS ids
            UNWIND ids AS id
            CREATE (d:Developer {name: t.name + ' Dev ' + id, role: 'Engineer'})-[:MEMBER_OF]->(t)
        `);

    console.log("Seeding Projects and Contributions (Complex Interactions)...");
    // Create 15 varied projects
    await session.run(`
            UNWIND range(1, 15) AS i
            CREATE (p:Project {name: 'Project ' + i, status: 'Active'})
        `);

    // Simulate realistic collaboration patterns:
    // 1. Full Stack Features (Frontend + Backend + Design + QA) - frequent
    // 2. Infrastructure Overhaul (Backend + DevOps + Security)
    // 3. Mobile App Update (Mobile + Backend + Design)
    // 4. Data Pipeline (Data + Backend)

    // We'll randomly assign contributions based on these patterns to create a dense matrix

    // Pattern 1: Web Feature Teams (High volume interactions between FE, BE, Design, QA)
    await session.run(`
            MATCH (p:Project) WHERE p.name IN ['Project 1', 'Project 2', 'Project 3', 'Project 4', 'Project 5']
            MATCH (fe:Developer)-[:MEMBER_OF]->(:Team {name: 'Frontend'}) WITH p, collect(fe) as fes
            MATCH (be:Developer)-[:MEMBER_OF]->(:Team {name: 'Backend'}) WITH p, fes, collect(be) as bes
            MATCH (de:Developer)-[:MEMBER_OF]->(:Team {name: 'Design'}) WITH p, fes, bes, collect(de) as des
            MATCH (qa:Developer)-[:MEMBER_OF]->(:Team {name: 'QA'}) WITH p, fes, bes, des, collect(qa) as qas
            
            // Assign random subset of devs to each project
            FOREACH (x IN fes[0..3] | MERGE (x)-[:CONTRIBUTES_TO]->(p))
            FOREACH (x IN bes[0..3] | MERGE (x)-[:CONTRIBUTES_TO]->(p))
            FOREACH (x IN des[0..2] | MERGE (x)-[:CONTRIBUTES_TO]->(p))
            FOREACH (x IN qas[0..2] | MERGE (x)-[:CONTRIBUTES_TO]->(p))
        `);

    // Pattern 2: Heavy Backend/DevOps/Security (High Backend<->DevOps, Low Security visibility)
    await session.run(`
            MATCH (p:Project) WHERE p.name IN ['Project 6', 'Project 7', 'Project 8']
            MATCH (be:Developer)-[:MEMBER_OF]->(:Team {name: 'Backend'}) WITH p, collect(be) as bes
            MATCH (op:Developer)-[:MEMBER_OF]->(:Team {name: 'DevOps'}) WITH p, bes, collect(op) as ops
            MATCH (sec:Developer)-[:MEMBER_OF]->(:Team {name: 'Security'}) WITH p, bes, ops, collect(sec) as secs
            
            FOREACH (x IN bes[0..4] | MERGE (x)-[:CONTRIBUTES_TO]->(p))
            FOREACH (x IN ops[0..3] | MERGE (x)-[:CONTRIBUTES_TO]->(p))
            FOREACH (x IN secs[0..1] | MERGE (x)-[:CONTRIBUTES_TO]->(p)) 
        `);

    // Pattern 3: Mobile Focus (Mobile + Backend + Design)
    await session.run(`
            MATCH (p:Project) WHERE p.name IN ['Project 9', 'Project 10', 'Project 11']
            MATCH (mob:Developer)-[:MEMBER_OF]->(:Team {name: 'Mobile'}) WITH p, collect(mob) as mobs
            MATCH (be:Developer)-[:MEMBER_OF]->(:Team {name: 'Backend'}) WITH p, mobs, collect(be) as bes
            MATCH (des:Developer)-[:MEMBER_OF]->(:Team {name: 'Design'}) WITH p, mobs, bes, collect(des) as dess
            
            FOREACH (x IN mobs[0..3] | MERGE (x)-[:CONTRIBUTES_TO]->(p))
            FOREACH (x IN bes[0..2] | MERGE (x)-[:CONTRIBUTES_TO]->(p))
            FOREACH (x IN dess[0..1] | MERGE (x)-[:CONTRIBUTES_TO]->(p))
        `);

    // Pattern 4: Data Analytics (Data + Backend)
    await session.run(`
            MATCH (p:Project) WHERE p.name IN ['Project 12', 'Project 13']
            MATCH (da:Developer)-[:MEMBER_OF]->(:Team {name: 'Data'}) WITH p, collect(da) as das
            MATCH (be:Developer)-[:MEMBER_OF]->(:Team {name: 'Backend'}) WITH p, das, collect(be) as bes
            
            FOREACH (x IN das[0..3] | MERGE (x)-[:CONTRIBUTES_TO]->(p))
            FOREACH (x IN bes[0..1] | MERGE (x)-[:CONTRIBUTES_TO]->(p))
        `);

    // Random "Legacy" Project (few devs from everywhere)
    await session.run(`
            MATCH (p:Project) WHERE p.name = 'Project 14'
            MATCH (d:Developer) WITH p, collect(d) as all_devs
            // Pick a few random devs
            FOREACH (x IN all_devs[0..2] | MERGE (x)-[:CONTRIBUTES_TO]->(p))
            FOREACH (x IN all_devs[10..12] | MERGE (x)-[:CONTRIBUTES_TO]->(p))
        `);

    console.log("Seeding Silo Alerts...");
    // Re-create Silo Alerts with better context
    await session.run(`
            CREATE (:SiloAlert {
                teams: 'Frontend <> Backend',
                severity: 'High',
                message: 'Late API contract alignment causing delays. Only 5% pre-implementation sync detected.',
                recommendation: 'Implement "API First" design reviews before sprint planning.'
            })
            CREATE (:SiloAlert {
                teams: 'Design <> QA',
                severity: 'Medium',
                message: 'Visual regression issues found late. Design team rarely tagged in QA tickets.',
                recommendation: 'Automate visual regression tests and invite Designers to QA demos.'
            })
             CREATE (:SiloAlert {
                teams: 'Security <> DevOps',
                severity: 'High',
                message: 'Security reviews happening post-deployment. High rollback rate due to compliance.',
                recommendation: 'Shift Left: Integrate automated security scanning in CI pipeline.'
            })
            CREATE (:SiloAlert {
                teams: 'Mobile <> Backend',
                severity: 'Low',
                message: 'Mobile team often blocked by backend API changes without versioning.',
                recommendation: 'Enforce semantic versioning for all internal APIs.'
            })
        `);

    console.log("Seeding completed successfully!");
  } catch (error) {
    console.error("Seeding failed:", error);
  } finally {
    await session.close();
    await driver.close();
  }
}

seed();
