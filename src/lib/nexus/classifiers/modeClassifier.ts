// Mode classifier · deterministic rules per spec §2.6.
// Rule-based, not LLM-soft. LLM reasons WITHIN a mode, not across.

import type { NexusMode } from '@/lib/intelligence/types';

export interface ModeClassifierInput {
  query: string;
  turnCount: number;
  // program-pivot score signals (0-5)
  majorIrreversibleDecision?: boolean;
  successCriteriaMissing?: boolean;
  stakeholderCount?: number;
  dollarImpactUsd?: number;
  preloadablePhases?: number;
}

export interface ModeClassifierOutput {
  mode: NexusMode;
  programPivotScore: number;
  rationale: string[];
}

const DOLLAR_THRESHOLD = 500_000;
const STAKEHOLDER_THRESHOLD = 3;
const PRELOADABLE_THRESHOLD = 2;

function isDecisionFramed(query: string): boolean {
  return /\b(should I|which should|how should|pick|choose between|vs|versus|compare)\b/i.test(query);
}

function isFactual(query: string): boolean {
  return /\b(what is|define|how does|explain|summarize|summary|top \d+|benchmark|list)\b/i.test(query);
}

export function classifyMode(input: ModeClassifierInput): ModeClassifierOutput {
  const rationale: string[] = [];
  const pivotSignals = [
    input.majorIrreversibleDecision === true,
    input.successCriteriaMissing === true,
    (input.stakeholderCount ?? 0) >= STAKEHOLDER_THRESHOLD,
    (input.dollarImpactUsd ?? 0) >= DOLLAR_THRESHOLD,
    (input.preloadablePhases ?? 0) >= PRELOADABLE_THRESHOLD,
  ];
  const pivotScore = pivotSignals.filter(Boolean).length;

  // Mode 3 · program pivot · ≥2 signals firing
  if (pivotScore >= 2) {
    rationale.push(`pivot score ${pivotScore}/5 (≥2 fires → Mode 3)`);
    return { mode: 'pivot', programPivotScore: pivotScore, rationale };
  }

  // Mode 2 · grounded advisory
  if (isDecisionFramed(input.query)) {
    rationale.push('decision-framed query → Mode 2 grounded');
    return { mode: 'grounded', programPivotScore: pivotScore, rationale };
  }

  // Mode 1 · research (default)
  if (isFactual(input.query)) rationale.push('factual pattern detected');
  else rationale.push('default fallback → Mode 1 research');
  return { mode: 'research', programPivotScore: pivotScore, rationale };
}
