/**
 * instance-health — REASON
 *
 * Aggregates the deterministic Layer-3 signals on a `SynthesisContext`
 * into a single at-a-glance health verdict for an instance.
 *
 * The score starts at 100 and is decremented per signal:
 *   - pending hard gate           → -8
 *   - blocked gate criterion      → -10
 *   - high-severity contradiction → -15
 *   - high-severity failure mode  → -10
 *   - high-severity cascade impact → -8
 *
 * The score is clamped to [0, 100] and bucketed:
 *   ≥80 → green, ≥50 → amber, else red.
 *
 * Pure: same context → same verdict. No IO, no Date.now(), no randomness.
 */

import type { SynthesisContext, GateCriterionResult } from './types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type InstanceHealthGrade = 'green' | 'amber' | 'red';

export interface InstanceHealth {
  grade: InstanceHealthGrade;
  score: number;
  reasons: string[];
  summary: string;
}

// ─── Penalties ────────────────────────────────────────────────────────────────

export const INSTANCE_HEALTH_PENALTIES = {
  pendingHardGate: 8,
  blockedCriterion: 10,
  highContradiction: 15,
  highFailureMode: 10,
  highCascade: 8,
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Number of unmet hard gates (pending). `blocked` already filters to unmet
 * hard gates per the synthesis-context contract; the `blockedCriteria` helper
 * narrows further to those whose status is explicitly `unmet` (treated as
 * "blocked" rather than merely partial). Both buckets are penalised.
 */
function pendingHardGates(context: SynthesisContext): GateCriterionResult[] {
  return context.gatesSummary.blocked;
}

function blockedCriteria(context: SynthesisContext): GateCriterionResult[] {
  return context.gatesSummary.blocked.filter((g) => g.status === 'unmet');
}

function highContradictions(context: SynthesisContext): number {
  return context.activeContradictions.filter((c) => c.severity === 'high').length;
}

function highFailureModes(context: SynthesisContext): number {
  // Treat confidence ≥ 0.7 as high-severity, mirroring the risk-register
  // mapping so the badge stays consistent with the unified RiskItem view.
  return context.failureModes.filter((f) => f.confidence >= 0.7).length;
}

function highCascades(context: SynthesisContext): number {
  return context.cascadeContext.filter((c) => c.impactSeverity === 'high').length;
}

function gradeFor(score: number): InstanceHealthGrade {
  if (score >= 80) return 'green';
  if (score >= 50) return 'amber';
  return 'red';
}

function plural(n: number, singular: string, pluralForm?: string): string {
  if (n === 1) return `1 ${singular}`;
  return `${n} ${pluralForm ?? `${singular}s`}`;
}

function buildSummary(grade: InstanceHealthGrade, reasons: string[]): string {
  if (grade === 'green') {
    return reasons.length === 0
      ? 'Instance is on-track — no high-severity signals open.'
      : `Instance is on-track with minor signals: ${reasons.join('; ')}.`;
  }
  if (grade === 'amber') {
    return `Instance needs attention — ${reasons.join('; ')}.`;
  }
  return `Instance is in trouble — ${reasons.join('; ')}.`;
}

// ─── Main entry ───────────────────────────────────────────────────────────────

/**
 * Compute a deterministic health verdict for an instance from its
 * `SynthesisContext`. Pure: no IO, no time-of-day, no randomness.
 */
export function computeInstanceHealth(context: SynthesisContext): InstanceHealth {
  const pendingHard = pendingHardGates(context);
  const blocked = blockedCriteria(context);
  const highContradictionCount = highContradictions(context);
  const highFailureModeCount = highFailureModes(context);
  const highCascadeCount = highCascades(context);

  let score = 100;
  score -= pendingHard.length * INSTANCE_HEALTH_PENALTIES.pendingHardGate;
  score -= blocked.length * INSTANCE_HEALTH_PENALTIES.blockedCriterion;
  score -= highContradictionCount * INSTANCE_HEALTH_PENALTIES.highContradiction;
  score -= highFailureModeCount * INSTANCE_HEALTH_PENALTIES.highFailureMode;
  score -= highCascadeCount * INSTANCE_HEALTH_PENALTIES.highCascade;

  if (score < 0) score = 0;
  if (score > 100) score = 100;

  const grade = gradeFor(score);

  const reasons: string[] = [];
  if (pendingHard.length > 0) {
    reasons.push(`${plural(pendingHard.length, 'hard gate')} pending`);
  }
  if (blocked.length > 0) {
    reasons.push(`${plural(blocked.length, 'gate criterion', 'gate criteria')} blocked`);
  }
  if (highContradictionCount > 0) {
    reasons.push(
      `${plural(highContradictionCount, 'high-severity contradiction')}`,
    );
  }
  if (highFailureModeCount > 0) {
    reasons.push(
      `${plural(highFailureModeCount, 'high-severity failure mode')}`,
    );
  }
  if (highCascadeCount > 0) {
    reasons.push(
      `${plural(highCascadeCount, 'high-severity cascade impact')}`,
    );
  }

  return {
    grade,
    score,
    reasons,
    summary: buildSummary(grade, reasons),
  };
}
