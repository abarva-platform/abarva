import { getAnthropicClient } from './stream';
import { assembleGuardrailPrompt, type GuardrailContext } from './prompts/guardrail';

export interface GuardrailResult {
  violation: boolean;
  reason: string;
}

export async function checkGuardrail(ctx: GuardrailContext): Promise<GuardrailResult> {
  try {
    const response = await getAnthropicClient().messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [{ role: 'user', content: assembleGuardrailPrompt(ctx) }],
    });
    const text = response.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { text: string }).text)
      .join('');
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return { violation: false, reason: '' };
    const parsed = JSON.parse(match[0]) as { violation?: unknown; violation_reason?: unknown };
    return {
      violation: parsed.violation === true,
      reason: typeof parsed.violation_reason === 'string' ? parsed.violation_reason : '',
    };
  } catch (err) {
    console.error('[guardrail]', err);
    // Fail-open: never break the turn because the guardrail failed.
    return { violation: false, reason: '' };
  }
}
