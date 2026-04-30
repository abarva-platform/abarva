// Sourcing Stage Pack registry - PR-SRC-A
//
// Public surface mirrors Programs phase-packs. Runtime callers can resolve a
// pack null-safely while Source is being reshaped into the AgentCanvas model.

import type { StagePack, SourcingStageNumber } from './types';
import { S0_INTAKE } from './S0_intake';
import { S1_MARKET_SHAPE } from './S1_market_shape';
import { S2_SHORTLIST } from './S2_shortlist';
import { S5_BAFO } from './S5_bafo';

const PACKS: Partial<Record<SourcingStageNumber, StagePack>> = {
  0: S0_INTAKE,
  1: S1_MARKET_SHAPE,
  2: S2_SHORTLIST,
  5: S5_BAFO,
};

export function getStagePack(stage: number | null | undefined): StagePack | null {
  if (stage === null || stage === undefined) return null;
  if (stage < 0 || stage > 7) return null;
  return PACKS[stage as SourcingStageNumber] ?? null;
}

export function listAuthoredStages(): SourcingStageNumber[] {
  return Object.keys(PACKS)
    .map((k) => Number(k) as SourcingStageNumber)
    .sort((a, b) => a - b);
}

export function formatStagePackForPrompt(pack: StagePack): string {
  const lines: string[] = [];

  lines.push(`## ACTIVE SOURCING STAGE PLAYBOOK - ${pack.label}`);
  lines.push('');
  lines.push(
    'You are supporting the user through this sourcing stage. The playbook below is your ' +
      'authority for what to ask, what to flag, and what evidence to drive toward. ' +
      'Use it actively and stay citation-first; do not let the event advance on narrative alone.',
  );
  lines.push('');

  if (pack.sourceStageKeys?.length) {
    lines.push(`Source workflow mapping: ${pack.sourceStageKeys.join(', ')}`);
    lines.push('');
  }

  if (pack.crossReferences?.patternIds.length) {
    lines.push(`Corpus references: ${pack.crossReferences.patternIds.join(', ')}`);
    lines.push('');
  }

  lines.push('### Stage outcome (what "done" produces)');
  lines.push(pack.outcome);
  lines.push('');

  lines.push('### Definition of done');
  for (const item of pack.definitionOfDone) {
    lines.push(`- [${item.severity.toUpperCase()}] ${item.label}`);
    lines.push(`    Evaluation: ${item.evaluationHint}`);
  }
  lines.push('');

  lines.push('### Right questions, by stage arc');
  lines.push('Ask these in roughly this order. Surface them proactively; do not wait');
  lines.push('for the user to volunteer the missing procurement discipline.');
  lines.push('');

  lines.push('OPEN (first turns of the stage):');
  for (const q of pack.rightQuestions.open) {
    lines.push(`  - ${q.text}`);
    lines.push(`    Why: ${q.why}`);
    if (q.expectedAnswerShape) lines.push(`    Good-answer shape: ${q.expectedAnswerShape}`);
  }
  lines.push('');

  lines.push('CONVERGE (mid stage):');
  for (const q of pack.rightQuestions.converge) {
    lines.push(`  - ${q.text}`);
    lines.push(`    Why: ${q.why}`);
    if (q.expectedAnswerShape) lines.push(`    Good-answer shape: ${q.expectedAnswerShape}`);
  }
  lines.push('');

  lines.push('CLOSE (pre-gate):');
  for (const q of pack.rightQuestions.close) {
    lines.push(`  - ${q.text}`);
    lines.push(`    Why: ${q.why}`);
    if (q.expectedAnswerShape) lines.push(`    Good-answer shape: ${q.expectedAnswerShape}`);
  }
  lines.push('');

  lines.push('### Anti-patterns to flag proactively');
  lines.push('When you detect any of these in conversation or evidence, surface the');
  lines.push('flag immediately and redirect to the mitigation.');
  lines.push('');
  for (const ap of pack.antiPatterns) {
    lines.push(`  - ${ap.label}`);
    lines.push(`    Detect: ${ap.detectionHint}`);
    lines.push(`    Flag: ${ap.whatToFlag}`);
    lines.push(`    Redirect to: ${ap.mitigation}`);
  }
  lines.push('');

  lines.push('### Coaching arc (your posture changes across the stage)');
  lines.push(`ENTRY (first 1-2 turns): ${pack.coachingArc.entry}`);
  lines.push(`MID STAGE: ${pack.coachingArc.midPhase}`);
  lines.push(`EXIT (pre-gate): ${pack.coachingArc.exit}`);
  lines.push('');

  lines.push('### Cross-stage dependencies');
  lines.push('Requires from prior stages:');
  for (const dep of pack.dependencies.requiresFromPrior) lines.push(`  - ${dep}`);
  lines.push('Produces for next stage:');
  for (const dep of pack.dependencies.producesForNext) lines.push(`  - ${dep}`);

  return lines.join('\n');
}

export { S0_INTAKE } from './S0_intake';
export { S1_MARKET_SHAPE } from './S1_market_shape';
export { S2_SHORTLIST } from './S2_shortlist';
export { S5_BAFO } from './S5_bafo';
export type { StagePack, SourcingStageNumber } from './types';
