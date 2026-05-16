// Outcome ledger · Wave 3, Slice 3.1 · view model.
//
// Pure transforms from persisted `outcome_ledger` rows to the
// Tower-facing view model. No clock, no randomness, no I/O — the read
// adapter owns the data-plane coupling and feeds rows in here.
//
// Expert value: every value figure is projected with its confidence
// tier and an explicit evidence flag, so the Tower surface can never
// render an inflated AI value claim as an audited fact. A verified
// figure with no evidence is surfaced as `unevidencedVerifiedClaim`.

import { computeVariance } from '@/lib/tower/ai-value-outcome-ledger';
import type {
  ValueLedgerCategory,
  ValueReadinessState,
} from '@/lib/tower/ai-value-outcome-ledger';
import {
  OUTCOME_SUBJECT_KINDS,
  OUTCOME_VALUE_TIERS,
  type OutcomeLedgerEntryView,
  type OutcomeLedgerRow,
  type OutcomeLedgerSummary,
  type OutcomeLedgerView,
  type OutcomeSubjectKind,
  type OutcomeValueTier,
} from './types';

/**
 * Map a fine-grained value rung onto a coarse CXO-facing value tier.
 *
 * - `projected` — claimed, nothing measured (`projected_only`).
 * - `tracked`   — a baseline / pilot measurement is in motion.
 * - `verified`  — measured in a pilot or in production.
 *
 * `declined` claims map to `projected`: a declined claim has no
 * defensible measured value, so it must never read as verified.
 */
export function rungToValueTier(rung: ValueReadinessState): OutcomeValueTier {
  switch (rung) {
    case 'measured_in_pilot':
    case 'measured_in_production':
      return 'verified';
    case 'baseline_pending':
    case 'baseline_set':
    case 'in_pilot_measurement':
      return 'tracked';
    case 'projected_only':
    case 'declined':
      return 'projected';
    default: {
      // Exhaustiveness guard — a new rung must be classified explicitly.
      const _never: never = rung;
      return _never;
    }
  }
}

/** True when the entry carries an evidence pointer or ≥ 1 claim id. */
function isEvidenceBacked(row: OutcomeLedgerRow): boolean {
  return (
    (row.evidencePointer !== null && row.evidencePointer.trim().length > 0) ||
    row.evidenceClaimIds.length > 0
  );
}

/**
 * Project a single persisted row into the Tower view model. Variance
 * is computed via the Slice 0.3 `computeVariance` builder so the math
 * is identical to the seed read model.
 */
export function toOutcomeLedgerEntryView(
  row: OutcomeLedgerRow,
): OutcomeLedgerEntryView {
  const valueTier = rungToValueTier(row.valueRung);
  const { varianceAbs, variancePercent } = computeVariance({
    // computeVariance only reads projectedValue / realizedValue.
    projectedValue: row.projectedAmount,
    realizedValue: row.realizedAmount,
  } as Parameters<typeof computeVariance>[0]);
  const evidenceBacked = isEvidenceBacked(row);
  return {
    id: row.id,
    subjectKind: row.subjectKind,
    subjectRef: row.subjectRef,
    subjectLabel: row.subjectLabel,
    valueRung: row.valueRung,
    valueTier,
    valueCategory: row.valueCategory,
    measurementUnit: row.measurementUnit,
    projectedAmount: row.projectedAmount,
    realizedAmount: row.realizedAmount,
    baselineAmount: row.baselineAmount,
    varianceAbs,
    variancePercent,
    counterfactualConfidence: row.counterfactualConfidence,
    governanceReviewStatus: row.governanceReviewStatus,
    measurementOwnerRole: row.measurementOwnerRole,
    evidencePointer: row.evidencePointer,
    evidenceClaimIds: row.evidenceClaimIds,
    evidenceBacked,
    unevidencedVerifiedClaim: valueTier === 'verified' && !evidenceBacked,
    recordedAt: row.recordedAt,
  };
}

function emptyTierCounts(): Record<OutcomeValueTier, number> {
  return { projected: 0, tracked: 0, verified: 0 };
}

function emptyCategoryCounts(): Record<ValueLedgerCategory, number> {
  return {
    cost_avoidance: 0,
    productivity: 0,
    revenue_lift: 0,
    risk_reduction: 0,
    customer_experience: 0,
    employee_experience: 0,
    compliance: 0,
  };
}

function emptySubjectKindCounts(): Record<OutcomeSubjectKind, number> {
  return { move: 0, source_event: 0, use_case: 0, program: 0 };
}

/**
 * Build the reconciled summary over a set of view entries.
 *
 * Reconciliation guarantees (test-enforced):
 *
 * - `sum(byValueTier) === totalEntries`.
 * - `sum(byCategory) === totalEntries`.
 * - `sum(bySubjectKind) === totalEntries`.
 * - every canonical tier / category / subject-kind key is present (0 allowed).
 */
export function summarizeOutcomeLedger(
  entries: readonly OutcomeLedgerEntryView[],
): OutcomeLedgerSummary {
  const byValueTier = emptyTierCounts();
  const byCategory = emptyCategoryCounts();
  const bySubjectKind = emptySubjectKindCounts();
  let unevidencedVerifiedCount = 0;
  let flaggedGovernanceCount = 0;

  for (const entry of entries) {
    byValueTier[entry.valueTier] += 1;
    byCategory[entry.valueCategory] += 1;
    bySubjectKind[entry.subjectKind] += 1;
    if (entry.unevidencedVerifiedClaim) unevidencedVerifiedCount += 1;
    if (entry.governanceReviewStatus === 'flagged') flaggedGovernanceCount += 1;
  }

  return {
    totalEntries: entries.length,
    byValueTier,
    byCategory,
    bySubjectKind,
    unevidencedVerifiedCount,
    flaggedGovernanceCount,
  };
}

/**
 * Build the full Tower-facing outcome ledger view model from the
 * current persisted rows for one tenant. Rows are projected, then
 * sorted by `recordedAt` descending (stable on id) so the view is
 * deterministic regardless of read-adapter ordering.
 */
export function buildOutcomeLedgerView(
  tenantClientKey: string,
  rows: readonly OutcomeLedgerRow[],
): OutcomeLedgerView {
  const entries = rows
    .map(toOutcomeLedgerEntryView)
    .sort((a, b) => {
      if (a.recordedAt === b.recordedAt) return a.id.localeCompare(b.id);
      return a.recordedAt < b.recordedAt ? 1 : -1;
    });
  return {
    tenantClientKey,
    entries,
    summary: summarizeOutcomeLedger(entries),
  };
}

/** Re-exported canonical tuples for callers that need the key lists. */
export { OUTCOME_SUBJECT_KINDS, OUTCOME_VALUE_TIERS };
