import { getAuditedAnthropicClient } from '@/lib/agent/stream';

export function buildDeterministicConciseFollowups(args: {
  query: string;
  entities: string[];
}): string[] | null {
  const normalized = args.query.toLowerCase();
  const asksForConciseAnswer =
    /\b(concise|brief|short|one\s+(?:short\s+)?(?:paragraph|sentence)|summari[sz]e\s+in\s+one)\b/.test(normalized);
  if (!asksForConciseAnswer) return null;

  const entity = args.entities.find((item) => item.trim().length > 0)?.trim();
  return [
    entity ? `Show the evidence behind ${entity}` : 'Show the evidence behind this view',
    'What would change this recommendation?',
    'What should we do next?',
  ];
}

export async function generateFollowups(args: {
  query: string;
  answer: string;
  entities: string[];
  tenantId?: string | null;
  userId?: string | null;
}): Promise<string[]> {
  const deterministic = buildDeterministicConciseFollowups(args);
  if (deterministic) return deterministic;

  if (!process.env.ANTHROPIC_API_KEY || !args.tenantId) return [];

  const prompt = `Given the question and the answer, propose 3 follow-up questions the user is
likely to ask next. Each should drill deeper OR pivot to an adjacent concern.
Return JSON only: { "followups": ["...", "...", "..."] }

Question: ${args.query}
Answer: ${args.answer.slice(0, 2000)}
Available next-step contexts: ${args.entities.join(', ')}`;

  try {
    const { client } = await getAuditedAnthropicClient({
      tenantId: args.tenantId,
      userId: args.userId ?? undefined,
      workflow: 'intelligence-ask-followups',
      model: 'claude-haiku-4-5-20251001',
      prompt,
      dataClass: 'confidential',
    });
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
