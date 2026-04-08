import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  const { message } = await request.json();

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: message,
      },
    ],
    system:
      "You are Nexus, an AI-native enterprise transformation platform. You help CIOs and CDOs make better transformation decisions faster. Be concise, confident, and specific.",
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  return Response.json({ response: text });
}