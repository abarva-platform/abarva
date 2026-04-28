import Anthropic from "@anthropic-ai/sdk";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    message?: string;
    context?: string;
  };

  const message = body.message?.trim();
  if (!message) {
    return new Response(JSON.stringify({ error: "message is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const context = body.context ?? "";

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const stream = await client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    system: `You are AbarVa, an AI enterprise transformation advisor embedded in the Nexus platform. ${context ? `Current context: ${context}` : "Provide helpful, concise responses about AI program management."} Keep responses under 150 words. Be direct, specific, and actionable.`,
    messages: [
      {
        role: "user",
        content: message,
      },
    ],
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          controller.enqueue(encoder.encode(chunk.delta.text));
        }
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
}
