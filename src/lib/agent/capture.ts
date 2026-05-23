import { getAuditedAnthropicClient } from './stream';
import { assembleCapturePrompt, type CaptureContext } from './prompts/relationship-capture';

export interface CapturedNote {
  category: 'personal' | 'style' | 'preference' | 'crisis_pattern';
  text: string;
  decay_days: number;
}

const ALLOWED_CATEGORIES: CapturedNote['category'][] = [
  'personal',
  'style',
  'preference',
  'crisis_pattern',
];

export async function captureRelationshipNotes(ctx: CaptureContext): Promise<CapturedNote[]> {
  if (!process.env.ANTHROPIC_API_KEY || !ctx.tenantId) return [];
  const prompt = assembleCapturePrompt(ctx);
  const { client } = await getAuditedAnthropicClient({
    tenantId: ctx.tenantId,
    userId: ctx.userId ?? undefined,
    workflow: 'agent-relationship-capture',
    model: 'claude-haiku-4-5-20251001',
    prompt,
    dataClass: 'confidential',
    artifactId: ctx.turnId ?? undefined,
    artifactType: 'turn',
  });

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { text: string }).text)
    .join('');

  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return [];
    const parsed = JSON.parse(match[0]) as { notes?: CapturedNote[] };
    if (!Array.isArray(parsed.notes)) return [];
    return parsed.notes.filter(
      (n) =>
        n &&
        typeof n.text === 'string' &&
        n.text.length > 0 &&
        n.text.length <= 200 &&
        ALLOWED_CATEGORIES.includes(n.category) &&
        typeof n.decay_days === 'number' &&
        n.decay_days > 0,
    );
  } catch {
    return [];
  }
}
