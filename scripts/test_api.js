async function testApi() {
  try {
    console.log("Fetching http://localhost:3000/api/employees...");
    const res = await fetch("http://localhost:3000/api/employees");
    const status = res.status;
    console.log("Status:", status);

    if ((ok = res.ok)) {
      const data = await res.json();
      console.log("Response Data Keys:", Object.keys(data));
      console.log("hasData:", data.hasData);
      console.log("Employees count:", data.employees?.length);
      console.log("First employee:", data.employees?.[0]);
    } else {
      console.log("Text:", await res.text());
    }

    console.log("\nFetching http://localhost:3000/api/skills...");
    const skillRes = await fetch("http://localhost:3000/api/skills");
    console.log("Skills Status:", skillRes.status);
    if (skillRes.ok) {
      const sData = await skillRes.json();
      console.log("Skills hasData:", sData.hasData);
      console.log("Skills count:", sData.skills?.length);
    }
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

testApi();
