import Anthropic from '@anthropic-ai/sdk';

let _client: Anthropic | null = null;
function getClient(): Anthropic | null {
  if (_client) return _client;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  _client = new Anthropic({ apiKey: key });
  return _client;
}

export async function generateFollowups(args: {
  query: string;
  answer: string;
  entities: string[];
}): Promise<string[]> {
  const client = getClient();
  if (!client) return [];

  const prompt = `Given the question and the answer, propose 3 follow-up questions the user is
likely to ask next. Each should drill deeper OR pivot to an adjacent concern.
Return JSON only: { "followups": ["...", "...", "..."] }

Question: ${args.query}
Answer: ${args.answer.slice(0, 2000)}
Available next-step contexts: ${args.entities.join(', ')}`;

  try {
    const res = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = res.content.filter((b) => b.type === 'text').map((b) => (b as { text: string }).text).join('');
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return [];
    const parsed = JSON.parse(match[0]) as { followups?: unknown };
    if (!Array.isArray(parsed.followups)) return [];
    return parsed.followups
      .filter((f): f is string => typeof f === 'string')
      .slice(0, 3)
      .map((s) => s.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}
