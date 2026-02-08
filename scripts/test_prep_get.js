async function test() {
  try {
    const response = await fetch("http://localhost:3000/api/prep/1on1", {
      method: "GET",
    });

    console.log("Status:", response.status);
    if (response.ok) {
      const data = await response.json();
      console.log("Developers:", data.developers);
    } else {
      console.log("Error:", await response.text());
    }
  } catch (e) {
    console.error("Test failed:", e);
  }
}

test();
