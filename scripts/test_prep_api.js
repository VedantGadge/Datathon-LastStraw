async function test() {
  try {
    const response = await fetch("http://localhost:3000/api/prep/1on1", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        developer_name: "Alice",
        manager_context:
          "Performance review coming up. Discuss recent project delays.",
      }),
    });

    console.log("Status:", response.status);
    const text = await response.text();
    console.log("Raw Response received");
    try {
      const data = JSON.parse(text);
      console.log(JSON.stringify(data, null, 2));
    } catch {
      console.log("Failed to parse JSON:", text);
    }
  } catch (e) {
    console.error("Test failed:", e);
  }
}

test();
