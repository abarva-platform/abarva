// Phase Pack registry · Programs Strict Completion v1.2 · Surface 2 PR-A
//
// T-D.2 migration bridge: V1 + V2 packs coexist.
// Feature flag: PHASE_PACK_V2 (env var, default false)
//   false → V1 packs (current behavior, safe fallback)
//   true  → V2 packs (21-field training pack schema per T-D.1)
//
// The flag is read at module load time so it is consistent within a request.
// To roll out: set PHASE_PACK_V2=true in Vercel env, redeploy.
// To rollback: unset PHASE_PACK_V2, redeploy.
//
// S-4 migration (post-validation): delete V1 pack files + V2 bridge.
//
// Public surface:
//   - getPhasePack(phase): V1 pack or null (null when USE_V2=true → use getPhasePackV2)
//   - getPhasePackV2(phase): V2 pack or null
//   - formatPhasePackForPrompt(pack): V1 renderer
//   - formatPhasePackV2ForPrompt(pack): V2 renderer
//
// Why null-safe: runtime callers may still pass null, undefined, or an
// out-of-range phase while data is loading or while older program records are
// being normalized. A missing/invalid phase should degrade cleanly rather than
// throwing inside the agent route.

import type { PhaseNumber, PhasePack } from './types';
import { P0_ORIGINATE } from './P0_originate';
import { P1_DISCOVERY } from './P1_discovery';
import { P2_SYNTHESIS } from './P2_synthesis';
import { P3_DESIGN } from './P3_design';
import { P4_BUILD } from './P4_build';
import { P5_ACTIVATE } from './P5_activate';
import { getPhasePackV2 as _getPhasePackV2 } from './v2/index';
import { formatPhasePackV2ForPrompt } from './format-v2';

const USE_V2 = process.env.PHASE_PACK_V2 === 'true';

const PACKS: Partial<Record<PhaseNumber, PhasePack>> = {
  0: P0_ORIGINATE,
  1: P1_DISCOVERY,
  2: P2_SYNTHESIS,
  3: P3_DESIGN,
  4: P4_BUILD,
  5: P5_ACTIVATE,
};

/** Returns the V1 pack (or null when USE_V2=true — callers should use getPhasePackV2 in that case). */
export function getPhasePack(phase: number | null | undefined): PhasePack | null {
  if (USE_V2) return null; // V2 callers use getPhasePackV2 directly
  if (phase === null || phase === undefined) return null;
  if (phase < 0 || phase > 5) return null;
  return PACKS[phase as PhaseNumber] ?? null;
}

/** Returns the V2 pack regardless of USE_V2 flag (used by route.ts V2 branch). */
export { _getPhasePackV2 as getPhasePackV2 };
export { formatPhasePackV2ForPrompt };

export function listAuthoredPhases(): PhaseNumber[] {
  return Object.keys(PACKS)
    .map((k) => Number(k) as PhaseNumber)
    .sort((a, b) => a - b);
}

/**
 * Render a V1 pack into a Nexus-readable prompt section. The format is
 * deliberately verbose — Nexus reads this at the start of every turn,
 * and prior experiments (cf. F0.3 instruction layer) showed terse
 * playbooks get ignored while structured ones change posture.
 *
 * The output is plain text (no markdown) so it composes cleanly into
 * the existing system block built in src/app/api/chat/agent/route.ts.
 */
export function formatPhasePackForPrompt(pack: PhasePack): string {
  const lines: string[] = [];

  lines.push(`## ACTIVE PHASE PLAYBOOK · ${pack.label}`);
  lines.push('');
  lines.push(
    'You are coaching the user through this phase. The playbook below is your ' +
      'authority for what to ask, what to flag, and what evidence to drive toward. ' +
      'Use it actively — do not wait for the user to ask the right question.',
  );
  lines.push('');

  lines.push('### Phase outcome (what "done" produces)');
  lines.push(pack.outcome);
  lines.push('');

  lines.push('### Definition of done');
  for (const item of pack.definitionOfDone) {
    lines.push(`- [${item.severity.toUpperCase()}] ${item.label}`);
    lines.push(`    Evaluation: ${item.evaluationHint}`);
  }
  lines.push('');

  lines.push('### Right questions, by phase arc');
  lines.push('Ask these in roughly this order. Surface them proactively — do not');
  lines.push('wait for the user to volunteer the topic.');
  lines.push('');
  lines.push('OPEN (first turns of the phase):');
  for (const q of pack.rightQuestions.open) {
    lines.push(`  • ${q.text}`);
    lines.push(`    Why: ${q.why}`);
    if (q.expectedAnswerShape) {
      lines.push(`    Good-answer shape: ${q.expectedAnswerShape}`);
    }
  }
  lines.push('');
  lines.push('CONVERGE (mid phase):');
  for (const q of pack.rightQuestions.converge) {
    lines.push(`  • ${q.text}`);
    lines.push(`    Why: ${q.why}`);
    if (q.expectedAnswerShape) {
      lines.push(`    Good-answer shape: ${q.expectedAnswerShape}`);
    }
  }
  lines.push('');
  lines.push('CLOSE (pre-gate):');
  for (const q of pack.rightQuestions.close) {
    lines.push(`  • ${q.text}`);
    lines.push(`    Why: ${q.why}`);
    if (q.expectedAnswerShape) {
      lines.push(`    Good-answer shape: ${q.expectedAnswerShape}`);
    }
  }
  lines.push('');

  lines.push('### Anti-patterns to flag proactively');
  lines.push('When you detect any of these in conversation or evidence, surface the');
  lines.push('flag immediately — do not let the user advance past it.');
  lines.push('');
  for (const ap of pack.antiPatterns) {
    lines.push(`  • ${ap.label}`);
    lines.push(`    Detect: ${ap.detectionHint}`);
    lines.push(`    Flag: ${ap.whatToFlag}`);
    lines.push(`    Redirect to: ${ap.mitigation}`);
  }
  lines.push('');

  lines.push('### Coaching arc (your posture changes across the phase)');
  lines.push(`ENTRY (first 1-2 turns): ${pack.coachingArc.entry}`);
  lines.push(`MID PHASE: ${pack.coachingArc.midPhase}`);
  lines.push(`EXIT (pre-gate): ${pack.coachingArc.exit}`);
  lines.push('');

  lines.push('### Cross-phase dependencies');
  lines.push('Requires from prior phases:');
  for (const dep of pack.dependencies.requiresFromPrior) {
    lines.push(`  - ${dep}`);
  }
  lines.push('Produces for next phase:');
  for (const dep of pack.dependencies.producesForNext) {
    lines.push(`  - ${dep}`);
  }

  return lines.join('\n');
}

export type { PhasePack, PhaseNumber } from './types';
