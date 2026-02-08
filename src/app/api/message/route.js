import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const { query, context, thread_id } = body;

    // Use provided thread_id or generate a new one
    // Note: In a real app, you might want to persist this or let the client manage it.
    const threadId = thread_id || crypto.randomUUID();

    // Prepare message with context
    // The agent might expect just the message, but we can augment it with context if needed.
    // However, the user request says "use this hf... use api/chat/", implying reliance on the agent's internal capabilities.
    // If the Context is important (e.g., current dashboard view), we should prepend it to the message.
    let enrichedMessage = query;
    if (context) {
      // Enriched message with context for the agent
      enrichedMessage = `Context: ${JSON.stringify(context)}\n\nUser Query: ${query}`;
    }

    const payload = {
      message: enrichedMessage,
      thread_id: threadId,
      stream: true,
    };

    console.log("Sending to HF Agent:", JSON.stringify(payload, null, 2));

    const response = await fetch(
      "https://vedantshirgaonkar-datathon-agents.hf.space/api/message",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("HF Agent Error:", response.status, errorText);
      throw new Error(`HF Agent returned ${response.status}: ${errorText}`);
    }

    // Process the stream or JSON response
    const contentType = response.headers.get("content-type") || "";
    let aiResponse = "";
    let sources = [];

    if (contentType.includes("text/event-stream")) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        // Parse SSE format
        // Lines start with "data: "
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const jsonStr = line.slice(6);
              if (jsonStr === "[DONE]") continue; // Common SSE end signal

              const data = JSON.parse(jsonStr);

              if (data.event === "stream_start") {
                console.log("Stream started", data);
              } else if (data.event === "stream_end") {
                console.log("Stream ended", data);
              } else if (data.response) {
                aiResponse += data.response;
              } else if (data.content) {
                aiResponse += data.content;
              } else if (data.token) {
                aiResponse += data.token;
              } else if (data.message) {
                aiResponse += data.message;
              } else if (typeof data === "string") {
                aiResponse += data;
              }

              // Also check for "sources" or similar metadata if available
              if (data.sources) {
                sources = data.sources;
              }
            } catch (e) {
              // console.warn("Failed to parse chunk:", line);
            }
          }
        }
      }
    } else {
      // Handle standard JSON response
      try {
        const data = await response.json();
        console.log(
          "Received JSON response:",
          JSON.stringify(data).substring(0, 200),
        );

        if (data.response) {
          aiResponse = data.response;
        } else if (data.content) {
          aiResponse = data.content;
        } else if (data.message) {
          aiResponse = data.message;
        } else if (typeof data === "string") {
          aiResponse = data;
        }

        if (data.sources) {
          sources = data.sources;
        }
      } catch (e) {
        console.error("Failed to parse JSON response:", e);
        const text = await response.text();
        console.log("Raw response text:", text.substring(0, 200));
      }
    }

    // If no specific response extracted, fallback to a generic message or what we captured
    if (!aiResponse) {
      aiResponse =
        "I received your request but couldn't extract the response text. Please check the logs.";
    }

    // Clean up model name artifacts if present (e.g. *[gpt-4o-mini]*)
    aiResponse = aiResponse.replace(/^\s*\*\[.*?\]\*\s*/, "").trim();

    return NextResponse.json({
      hasData: true,
      query,
      aiResponse,
      thread_id: threadId,
      sources: sources.length > 0 ? sources : ["Endurance AI Agent"],
    });
  } catch (err) {
    console.error("AI Search Error:", err);
    return NextResponse.json(
      {
        hasData: false,
        error: err.message,
        aiResponse: "Sorry, I encountered an error connecting to the AI agent.",
      },
      { status: 500 },
    );
  }
}
