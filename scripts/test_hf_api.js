const https = require("https");

const data = JSON.stringify({
  message: "What is 2+2?",
  thread_id: "test-thread-" + Date.now(),
  stream: true,
});

const options = {
  hostname: "vedantshirgaonkar-datathon-agents.hf.space",
  path: "/api/chat/",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": data.length,
  },
};

const req = https.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);

  res.on("data", (chunk) => {
    console.log(`CHUNK: ${chunk.toString()}`);
  });

  res.on("end", () => {
    console.log("No more data in response.");
  });
});

req.on("error", (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
