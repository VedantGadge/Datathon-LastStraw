const https = require("https");

async function testUrl(url) {
  const body = {
    message: "What is 2+2?",
    thread_id: "test-thread-" + Date.now(),
    stream: false,
  };

  console.log(`Testing URL: ${url} with stream: false`);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    console.log(`STATUS: ${response.status}`);
    const text = await response.text();
    console.log(`BODY: ${text}`);
  } catch (error) {
    console.error(`Fetch failed for ${url}:`, error.message);
  }
}

testUrl("https://vedantshirgaonkar-datathon-agents.hf.space/api/chat");
