// Outcome pattern feedback · Wave 3, Slice 3.6 · pure builder.
//
// Pure transform from a resolved `outcome_ledger` row to an
// `OutcomePatternFeedbackRecord`. No clock, no randomness, no I/O —
// the caller supplies the row; this module only projects it.
//
// PRIVACY-FIRST DESIGN. The record this builds is structured so a
// later cross-tenant aggregation job can anonymize it by simply
// DROPPING `tenantClientKey` / `clientId` / `sourceEntryId`. Every
// other field is tenant-agnostic by construction: the builder reads
// only structural enums (subject kind, value category, unit, rung),
// the numeric figures, and the confidence tier — never labels, notes,
// evidence pointers, user ids, or the tenant slug. If you add a field,
// keep that invariant: see types.ts for the full privacy note.

import type { OutcomeLedgerRow } from '@/lib/tower/outcome-ledger';
import type { ValueReadinessState } from '@/lib/tower/ai-value-outcome-ledger';
import {
  OUTCOME_FEEDBACK_SCHEMA_VERSION,
  type OutcomeArchetype,
  type OutcomeDeltaBucket,
  type OutcomePatternFeedbackRecord,
  type OutcomeTerminalRung,
} from './types';

/**
 * The value rungs that represent a *resolved* outcome — one with a
 * realized figure or an explicit abandonment. Only ledger rows at one
 * of these rungs produce a feedback record.
 */
const RESOLVED_RUNGS: ReadonlySet<ValueReadinessState> = new Set<ValueReadinessState>([
  'measured_in_pilot',
  'measured_in_production',
  'declined',
]);

/**
 * True when a ledger row represents a resolved outcome and therefore
 * carries a learning signal worth feeding into the pattern graph.
 */
export function isResolvedOutcome(row: OutcomeLedgerRow): boolean {
  return RESOLVED_RUNGS.has(row.valueRung);
}

/** Coarsen a realized/projected ratio into a tenant-agnostic band. */
function deltaBucketOf(ratio: number | null): OutcomeDeltaBucket {
  if (ratio === null || !Number.isFinite(ratio)) return 'not_applicable';
  if (ratio < 0.5) return 'far_below';
  if (ratio < 0.9) return 'below';
  if (ratio <= 1.1) return 'near';
  if (ratio <= 1.5) return 'above';
  return 'far_above';
}

/** Classify a resolved outcome into its coarse cross-tenant archetype. */
function archetypeOf(
  rung: OutcomeTerminalRung,
  bucket: OutcomeDeltaBucket,
): OutcomeArchetype {
  if (rung === 'declined') return 'declined';
  switch (bucket) {
    case 'far_above':
    case 'above':
      return 'overdelivered';
    case 'far_below':
    case 'below':
      return 'underdelivered';
    default:
      // 'near' — and 'not_applicable' on a non-declined rung (e.g. a
      // zero projection) is treated as on-target rather than mislabeled.
      return 'on_target';
  }
}

/**
 * Build the outcome-pattern-feedback record for one resolved
 * outcome-ledger row.
 *
 * Returns `null` when the row is not a resolved outcome (no realized
 * figure / not declined) — such rows carry no learning signal yet.
 *
 * @param row a persisted `outcome_ledger` row (read, never mutated).
 */
export function buildOutcomePatternFeedback(
  row: OutcomeLedgerRow,
): OutcomePatternFeedbackRecord | null {
  if (!isResolvedOutcome(row)) return null;

  const outcomeRung = row.valueRung as OutcomeTerminalRung;
  const projected = row.projectedAmount;
  const realized = row.realizedAmount;

  const canCompute =
    outcomeRung !== 'declined' &&
    realized !== null &&
    Number.isFinite(realized) &&
    Number.isFinite(projected) &&
    projected !== 0;

  const deltaAbs = canCompute ? (realized as number) - projected : null;
  const deltaRatio = canCompute ? (realized as number) / projected : null;
  const deltaBucket = deltaBucketOf(deltaRatio);
  const deltaSign: -1 | 0 | 1 =
    deltaAbs === null || deltaAbs === 0 ? 0 : deltaAbs > 0 ? 1 : -1;
  const outcomeArchetype = archetypeOf(outcomeRung, deltaBucket);

  return {
    sourceEntryId: row.id,
    tenantClientKey: row.tenantClientKey,
    clientId: row.clientId,
    decisionShape: {
      subjectKind: row.subjectKind,
      valueCategory: row.valueCategory,
      measurementUnit: row.measurementUnit,
    },
    outcomeArchetype,
    outcomeRung,
    projectedAmount: projected,
    realizedAmount: realized,
    deltaAbs,
    deltaRatio,
    deltaSign,
    deltaBucket,
    counterfactualConfidence: row.counterfactualConfidence,
    feedbackSchemaVersion: OUTCOME_FEEDBACK_SCHEMA_VERSION,
    recordedAt: row.recordedAt,
  };
}

/**
 * Build feedback records for a batch of ledger rows, skipping any that
 * are not resolved outcomes. Order is preserved.
 */
export function buildOutcomePatternFeedbackBatch(
  rows: readonly OutcomeLedgerRow[],
): readonly OutcomePatternFeedbackRecord[] {
  const out: OutcomePatternFeedbackRecord[] = [];
  for (const row of rows) {
    const record = buildOutcomePatternFeedback(row);
    if (record !== null) out.push(record);
  }
  return out;
}
