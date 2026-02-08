// Test Featherless API
async function test() {
  const response = await fetch(
    "https://api.featherless.ai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Bearer rc_4439907a95862fec3e933e09139790c7d5a168c24988290e9c6e390100855ed7",
      },
      body: JSON.stringify({
        model: "Qwen/Qwen3-32B",
        messages: [{ role: "user", content: "Say hello in one word" }],
        max_tokens: 50,
      }),
    },
  );

  console.log("Status:", response.status);
  const data = await response.json();
  console.log("Response:", JSON.stringify(data, null, 2));
}

test().catch(console.error);
