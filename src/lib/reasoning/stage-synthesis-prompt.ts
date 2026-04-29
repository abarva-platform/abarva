/**
 * Stage synthesis prompt — focused LLM context for ONE stage.
 *
 * Where `buildStageMicroSynthesis` produces a deterministic 1–2 sentence
 * advisory from rules alone, this helper assembles the structured prompt that
 * feeds the optional LLM-streamed deeper synthesis (REASON-32 follow-up). The
 * LLM is asked to produce up to ~80 words specific to ONE stage's gates,
 * evidence, and instance context.
 *
 * Pure: no IO, no LLM call, no Date.now. Same inputs → identical strings.
 *
 * The prompt is split into two parts:
 *   - `system`: validator-register voice, scoped to ONE stage.
 *   - `user`: structured facts (stage label, gate criteria + statuses,
 *             missing artifacts slice, instance label).
 *
 * The route handler concatenates `system` with the shared agent demo block
 * and passes `user` as the message body.
 */

import type { LifecyclePatternSeed } from '@/lib/intelligence/seed-types';
import type { StageEvaluationResult, GateEvaluation } from './types';

export interface StageSynthesisPromptInput {
  /** Stage being synthesized. */
  stageId: string;
  /** Pre-computed evaluation for `stageId` (one element of `evaluateAllStages`). */
  evaluation: StageEvaluationResult;
  /** Governing lifecycle pattern — used for criterion descriptions. */
  pattern: LifecyclePatternSeed;
  /** Display label for the instance (e.g. event name or program name). */
  instanceLabel: string;
  /** Surface origin — biases prompt voice. */
  surface: 'source' | 'programs';
}

export interface StageSynthesisPrompt {
  system: string;
  user: string;
}

const SYSTEM_VALIDATOR = `You are AbarVa's reasoning layer producing a focused stage synthesis.

Task: given the structured state of ONE stage in a lifecycle pattern (gate criteria with statuses, missing artifacts, instance context), produce a precise 60–80 word explanation of where this stage stands and what specifically must change to advance it.

Voice register:
- Lead with what is verified vs. asserted vs. unknown for THIS stage.
- Cite specific gate criteria by their description when relevant.
- Name the single highest-leverage move to unblock advance.
- Precise. No hedging language. No procurement boilerplate. No filler.

Format: Plain prose, 60–80 words. No headers, no bullets, no markdown.`;

function describeCriterion(
  pattern: LifecyclePatternSeed,
  criterionId: string,
): string {
  const c = pattern.gateCriteria.find((x) => x.id === criterionId);
  return c?.description?.trim() || criterionId;
}

function gateLine(g: GateEvaluation, pattern: LifecyclePatternSeed): string {
  const desc = describeCriterion(pattern, g.criterionId);
  const status = g.status.toUpperCase();
  return `  - [${g.gateType}/${status}] ${desc}`;
}

/**
 * Build a structured `{ system, user }` prompt pair for the per-stage LLM
 * synthesis. Pure: stable across renders.
 */
export function buildStageSynthesisPrompt(
  input: StageSynthesisPromptInput,
): StageSynthesisPrompt {
  const { stageId, evaluation, pattern, instanceLabel, surface } = input;
  const stageLabel = evaluation.stageLabel || stageId;
  const gates = evaluation.gateEvaluations ?? [];
  const total = evaluation.gatesTotal ?? gates.length;
  const met = evaluation.gatesMet ?? 0;
  const missing = evaluation.missingArtifacts ?? [];

  const lines: string[] = [
    `Surface: ${surface}`,
    `Instance: ${instanceLabel}`,
    `Stage: ${stageLabel} (id: ${stageId}, status: ${evaluation.status})`,
    `Gate progress: ${met} of ${total} criteria met.`,
  ];

  if (gates.length > 0) {
    lines.push('Gate criteria:');
    for (const g of gates) {
      lines.push(gateLine(g, pattern));
    }
  } else {
    lines.push('Gate criteria: none defined for this stage.');
  }

  // Surface up to 5 missing artifacts (hard first) so the LLM has a concrete
  // hook for "what evidence to gather"; truncate the rest deterministically.
  const sortedMissing = [...missing].sort((a, b) => {
    if (a.gateType === b.gateType) return 0;
    return a.gateType === 'hard' ? -1 : 1;
  });
  const slice = sortedMissing.slice(0, 5);
  if (slice.length > 0) {
    lines.push('Missing artifacts:');
    for (const a of slice) {
      lines.push(`  - [${a.gateType}/${a.requirement}] ${a.label}`);
    }
    if (sortedMissing.length > slice.length) {
      lines.push(`  - …and ${sortedMissing.length - slice.length} more`);
    }
  }

  lines.push('');
  lines.push(
    `Synthesize a 60–80 word focused assessment of stage "${stageLabel}". ` +
      `Cite the most decision-relevant gate criterion by name and identify the single highest-leverage move to unblock advance.`,
  );

  return {
    system: SYSTEM_VALIDATOR,
    user: lines.join('\n'),
  };
}
