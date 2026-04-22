// Composer · calls Claude Opus 4.7 with identity + mode + format + context
// bundle, streams JSON output. Post-generation passes through voice filter.

import { streamAgentTurn } from '@/lib/agent/stream';
import { NEXUS_IDENTITY } from './prompts/identity';
import { MODE_INSTRUCTIONS } from './prompts/modes';
import { FORMAT_INSTRUCTIONS } from './prompts/formats';
import { COUNTER_ARGUMENT_INSTRUCTIONS, PERSONA_LENS_INSTRUCTIONS } from './prompts/capabilities';
import { filterPayload } from './voiceFilter';
import type { CompositionBundle } from './assembler';
import type { NexusFormat } from '@/lib/intelligence/types';

export interface ComposerInput {
  bundle: CompositionBundle;
  format: NexusFormat;
  capability?: 'counter' | { persona: string };
  /**
   * Rendered session-context block appended to the system prompt so the
   * model knows the invoking user, tenant, VIP status, and recent
   * engagements without being asked.
   */
  sessionContextBlock?: string;
  onTextDelta?: (delta: string) => void;
}

export interface ComposerOutput {
  rawText: string;
  payload: Record<string, unknown>;
  strippedCount: number;
}

function buildSystemPrompt(input: ComposerInput): string {
  const parts: string[] = [NEXUS_IDENTITY, MODE_INSTRUCTIONS[input.bundle.mode], FORMAT_INSTRUCTIONS[input.format]];
  if (input.sessionContextBlock) parts.push(input.sessionContextBlock);
  if (input.capability === 'counter') parts.push(COUNTER_ARGUMENT_INSTRUCTIONS);
  else if (input.capability && typeof input.capability === 'object') {
    parts.push(PERSONA_LENS_INSTRUCTIONS(input.capability.persona));
  }
  return parts.join('\n\n---\n\n');
}

function bundleToContext(bundle: CompositionBundle): string {
  const evidenceBlock = bundle.evidence
    .slice(0, 30)
    .map((c, i) => `[${i + 1}] (${c.source.name}, ${c.confidence}) ${c.text}`)
    .join('\n');
  const valueBlock = bundle.valueHeadline ? `VALUE ENVELOPE\n${bundle.valueHeadline}` : '';
  const contradictionBlock = bundle.contradictions.length
    ? `CONTRADICTIONS\n${bundle.contradictions.map((f) => `- ${f.headline} (${f.severity})`).join('\n')}`
    : '';
  const decisionBlock = bundle.decision.crux
    ? `DECISION FRAMING\nCRUX: ${bundle.decision.crux}\nBranches: ${bundle.decision.branches.map((b) => `${b.verdict} · ${b.condition}`).join(' | ')}`
    : '';
  const sections = [
    `QUERY\n${bundle.query}`,
    `ENTITIES\n${bundle.entities.join(', ') || '(none extracted)'}`,
    evidenceBlock ? `EVIDENCE (${bundle.evidence.length} claims after dedupe)\n${evidenceBlock}` : 'EVIDENCE\n(empty)',
    valueBlock,
    contradictionBlock,
    decisionBlock,
  ].filter(Boolean);
  return sections.join('\n\n');
}

function extractJson(raw: string): Record<string, unknown> | null {
  // Strip markdown code fences, find first balanced {}
  const cleaned = raw.replace(/^```(?:json)?\s*|\s*```$/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

export async function compose(input: ComposerInput): Promise<ComposerOutput> {
  const system = buildSystemPrompt(input);
  const context = bundleToContext(input.bundle);
  let rawText = '';
  const gen = streamAgentTurn({
    system,
    messages: [{ role: 'user', content: context }],
    model: process.env.NEXUS_COMPOSER_MODEL ?? 'claude-opus-4-7',
    maxTokens: 4096,
  });
  for await (const chunk of gen) {
    rawText += chunk;
    input.onTextDelta?.(chunk);
  }

  const payload = extractJson(rawText) ?? { format: input.format, raw: rawText };
  const { filtered, strippedCount } = filterPayload(payload);

  return { rawText, payload: filtered, strippedCount };
}
