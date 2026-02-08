const https = require("https");

async function testApi() {
  const url = "https://vedantshirgaonkar-datathon-agents.hf.space/api/chat/";
  const body = {
    message: "What is 2+2?",
    thread_id: "test-thread-" + Date.now(),
    stream: true,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    console.log(`STATUS: ${response.status}`);

    if (!response.ok) {
      console.log("Response not OK");
      const text = await response.text();
      console.log("Error Body:", text);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      console.log(`CHUNK: ${chunk}`);
    }
    console.log("Stream complete");
  } catch (error) {
    console.error("Fetch failed:", error);
  }
}

testApi();
