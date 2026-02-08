const https = require("https");

async function testUrl(url) {
  const body = {
    message: "What is 2+2?",
    thread_id: "test-thread-" + Date.now(),
    stream: true,
  };

  console.log(`Testing URL: ${url}`);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    console.log(`STATUS: ${response.status}`);
    if (!response.ok) {
      console.log(`Response text: ${await response.text()}`);
    } else {
      console.log("Success!");
      // Drain stream
      const reader = response.body.getReader();
      while (true) {
        const { done } = await reader.read();
        if (done) break;
      }
    }
  } catch (error) {
    console.error(`Fetch failed for ${url}:`, error.message);
  }
  console.log("---");
}

async function run() {
  await testUrl("https://vedantshirgaonkar-datathon-agents.hf.space/api/chat");
  await testUrl("https://vedantshirgaonkar-datathon-agents.hf.space/api/chat/");
}

run();
