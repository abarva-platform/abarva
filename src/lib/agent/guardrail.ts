import { getAuditedAnthropicClient } from './stream';
import { assembleGuardrailPrompt, type GuardrailContext } from './prompts/guardrail';

export interface GuardrailResult {
  violation: boolean;
  reason: string;
}

export async function checkGuardrail(ctx: GuardrailContext): Promise<GuardrailResult> {
  try {
    if (!process.env.ANTHROPIC_API_KEY || !ctx.tenantId) {
      return { violation: false, reason: '' };
    }
    const prompt = assembleGuardrailPrompt(ctx);
    const { client } = await getAuditedAnthropicClient({
      tenantId: ctx.tenantId,
      userId: ctx.userId ?? undefined,
      workflow: 'agent-guardrail-check',
      model: 'claude-haiku-4-5-20251001',
      prompt,
      dataClass: 'confidential',
      artifactId: ctx.turnId ?? undefined,
      artifactType: 'turn',
    });
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
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
