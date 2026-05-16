// Outcome ledger · Wave 3, Slice 3.1 · shared types.
//
// The persisted-row shape of the `outcome_ledger` table
// (supabase/migrations/20260516180000_outcome_ledger.sql) and the
// Tower-facing view model derived from it.
//
// The value classification (rung, category, unit, confidence,
// governance status) reuses the canonical enums from the Slice 0.3
// taxonomy in `src/lib/tower/ai-value-outcome-ledger.ts` so the ledger
// and the seed read model speak the same language.

import type {
  ValueCounterfactualConfidence,
  ValueGovernanceReviewStatus,
  ValueLedgerCategory,
  ValueMeasurementUnit,
  ValueReadinessState,
} from '@/lib/tower/ai-value-outcome-ledger';

/** What kind of decision artifact a ledger entry attaches its value to. */
export const OUTCOME_SUBJECT_KINDS = [
  'move',
  'source_event',
  'use_case',
  'program',
] as const;

export type OutcomeSubjectKind = (typeof OUTCOME_SUBJECT_KINDS)[number];

/**
 * The three coarse confidence tiers a CXO reads at a glance. Derived
 * from the finer-grained `value_rung` ladder — see `rungToValueTier`.
 *
 * - `projected` — a claimed figure with no measurement behind it yet.
 * - `tracked`   — a baseline exists and/or pilot measurement is under way.
 * - `verified`  — measured in a pilot or in production.
 */
export const OUTCOME_VALUE_TIERS = ['projected', 'tracked', 'verified'] as const;

export type OutcomeValueTier = (typeof OUTCOME_VALUE_TIERS)[number];

/**
 * One persisted `outcome_ledger` row, as read from the data plane.
 * Field names are camelCase view-model names; the read adapter maps
 * snake_case columns onto this shape.
 */
export interface OutcomeLedgerRow {
  readonly id: string;
  readonly supersedesEntryId: string | null;
  readonly isCurrent: boolean;
  readonly tenantClientKey: string;
  readonly clientId: string | null;
  readonly subjectKind: OutcomeSubjectKind;
  readonly subjectRef: string;
  readonly subjectLabel: string;
  readonly valueRung: ValueReadinessState;
  readonly valueCategory: ValueLedgerCategory;
  readonly measurementUnit: ValueMeasurementUnit;
  readonly projectedAmount: number;
  readonly realizedAmount: number | null;
  readonly baselineAmount: number | null;
  readonly counterfactualConfidence: ValueCounterfactualConfidence;
  readonly governanceReviewStatus: ValueGovernanceReviewStatus;
  readonly measurementOwnerRole: string | null;
  readonly evidencePointer: string | null;
  readonly evidenceClaimIds: readonly string[];
  readonly note: string | null;
  readonly recordedBy: string | null;
  readonly recordedAt: string;
}

/**
 * A single value claim, projected into the Tower view model. Carries
 * the coarse `valueTier`, the variance against the projection, and an
 * explicit `evidenceBacked` flag so the surface never renders an
 * unevidenced verified-tier figure as an audited fact.
 */
export interface OutcomeLedgerEntryView {
  readonly id: string;
  readonly subjectKind: OutcomeSubjectKind;
  readonly subjectRef: string;
  readonly subjectLabel: string;
  readonly valueRung: ValueReadinessState;
  readonly valueTier: OutcomeValueTier;
  readonly valueCategory: ValueLedgerCategory;
  readonly measurementUnit: ValueMeasurementUnit;
  readonly projectedAmount: number;
  readonly realizedAmount: number | null;
  readonly baselineAmount: number | null;
  /** `realizedAmount - projectedAmount`, or null when not measured. */
  readonly varianceAbs: number | null;
  /** `(realized - projected) / projected * 100`, or null. */
  readonly variancePercent: number | null;
  readonly counterfactualConfidence: ValueCounterfactualConfidence;
  readonly governanceReviewStatus: ValueGovernanceReviewStatus;
  readonly measurementOwnerRole: string | null;
  readonly evidencePointer: string | null;
  readonly evidenceClaimIds: readonly string[];
  /** True when the entry has an evidence pointer or ≥ 1 claim id. */
  readonly evidenceBacked: boolean;
  /**
   * True when the entry asserts a verified-tier value but carries no
   * evidence — the inflated-claim risk the ledger exists to surface.
   */
  readonly unevidencedVerifiedClaim: boolean;
  readonly recordedAt: string;
}

/**
 * The Tower-facing outcome ledger view model: the current value claims
 * for one tenant plus a reconciled summary.
 */
export interface OutcomeLedgerView {
  readonly tenantClientKey: string;
  readonly entries: readonly OutcomeLedgerEntryView[];
  readonly summary: OutcomeLedgerSummary;
}

/** Aggregated, reconciled rollup over a set of view entries. */
export interface OutcomeLedgerSummary {
  readonly totalEntries: number;
  readonly byValueTier: Readonly<Record<OutcomeValueTier, number>>;
  readonly byCategory: Readonly<Record<ValueLedgerCategory, number>>;
  readonly bySubjectKind: Readonly<Record<OutcomeSubjectKind, number>>;
  /** Verified-tier entries with no evidence — the figures to challenge. */
  readonly unevidencedVerifiedCount: number;
  /** Entries whose governance review status is `flagged`. */
  readonly flaggedGovernanceCount: number;
}
