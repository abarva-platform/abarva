import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  const { orgName, orgSize, vertical, challenge } = await request.json();

  const stream = await client.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: `You are Abarva, the world's most experienced enterprise transformation advisor.
You have deep expertise in healthcare and financial services transformations.
You instantly identify root causes, failure patterns, and priority actions.
Be specific, confident, and direct. No generic advice.
Format your response with clear sections:
1. TOP 3 TRANSFORMATION CHALLENGES
2. ROOT CAUSES  
3. PRIORITY ACTIONS (next 90 days)
4. RISK FLAGS
5. BENCHMARK COMPARISON`,
    messages: [
      {
        role: "user",
        content: `Diagnose this organization:
Organization: ${orgName}
Size: ${orgSize}
Industry: ${vertical}
Primary Challenge: ${challenge}

Provide a specific, actionable diagnosis with industry benchmarks.`,
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
