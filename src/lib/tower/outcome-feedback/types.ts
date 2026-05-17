// Outcome pattern feedback · Wave 3, Slice 3.6 · shared types.
//
// The persisted-row shape of the `outcome_pattern_feedback` table
// (supabase/migrations/20260516200000_outcome_pattern_feedback.sql) and
// the pure feedback record derived from a resolved outcome-ledger entry.
//
// PRIVACY NOTE — read before adding a field. The pattern-relevant
// fields on `OutcomePatternFeedbackRecord` (everything except
// `tenantClientKey`, `clientId`, and `sourceEntryId`) MUST stay
// tenant-agnostic: no raw tenant slugs, no free-text labels, no
// evidence pointers, no user ids. This is what makes the Layer 2 ->
// Layer 3 cross-tenant pattern graph possible: a later aggregation job
// drops `tenantClientKey` / `clientId` / `sourceEntryId` and what
// remains is, by construction, an anonymized contribution. Keep that
// invariant — anonymization here is a column drop, not a scrub.

import type {
  ValueCounterfactualConfidence,
  ValueLedgerCategory,
  ValueMeasurementUnit,
} from '@/lib/tower/ai-value-outcome-ledger';
import type { OutcomeSubjectKind } from '@/lib/tower/outcome-ledger';

/** Schema version of the feedback-record projection logic. */
export const OUTCOME_FEEDBACK_SCHEMA_VERSION = 1;

/**
 * The coarse, tenant-agnostic bucket a resolved outcome falls into —
 * the primary cross-tenant grouping key for the pattern graph.
 */
export const OUTCOME_ARCHETYPES = [
  'overdelivered',
  'on_target',
  'underdelivered',
  'declined',
] as const;

export type OutcomeArchetype = (typeof OUTCOME_ARCHETYPES)[number];

/** The terminal value rungs an outcome can resolve to. */
export const OUTCOME_TERMINAL_RUNGS = [
  'measured_in_pilot',
  'measured_in_production',
  'declined',
] as const;

export type OutcomeTerminalRung = (typeof OUTCOME_TERMINAL_RUNGS)[number];

/**
 * A coarsened realized-vs-projected band. Aggregation groups on this
 * rather than the raw figures, so the pattern graph never needs a
 * tenant's actual numbers.
 */
export const OUTCOME_DELTA_BUCKETS = [
  'far_below',
  'below',
  'near',
  'above',
  'far_above',
  'not_applicable',
] as const;

export type OutcomeDeltaBucket = (typeof OUTCOME_DELTA_BUCKETS)[number];

/**
 * The tenant-agnostic structural descriptor of the decision a feedback
 * record attaches to. Carries no labels and no free text.
 */
export interface DecisionShape {
  readonly subjectKind: OutcomeSubjectKind;
  readonly valueCategory: ValueLedgerCategory;
  readonly measurementUnit: ValueMeasurementUnit;
}

/**
 * One outcome-pattern-feedback record, derived from a resolved
 * outcome-ledger entry.
 *
 * PRIVACY: `tenantClientKey`, `clientId` and `sourceEntryId` are the
 * ONLY re-identifying fields and exist for RLS / audit only. Every
 * other field is tenant-agnostic — see the file-level privacy note.
 */
export interface OutcomePatternFeedbackRecord {
  /** Opaque UUID of the resolved `outcome_ledger` row. Audit linkage. */
  readonly sourceEntryId: string;
  /** Tenant scope — for RLS only, NOT a pattern field. */
  readonly tenantClientKey: string;
  /** Tenant client id — for RLS only, NOT a pattern field. */
  readonly clientId: string | null;

  /** Tenant-agnostic shape of the decision. */
  readonly decisionShape: DecisionShape;
  /** The coarse cross-tenant bucket the outcome falls into. */
  readonly outcomeArchetype: OutcomeArchetype;
  /** The terminal value rung the outcome resolved to. */
  readonly outcomeRung: OutcomeTerminalRung;

  readonly projectedAmount: number;
  readonly realizedAmount: number | null;
  /** `realized - projected`, or null when not computable. */
  readonly deltaAbs: number | null;
  /** `realized / projected`, or null when not computable. */
  readonly deltaRatio: number | null;
  /** Sign of the delta: -1 / 0 / +1. */
  readonly deltaSign: -1 | 0 | 1;
  /** Coarsened delta band — the aggregation grouping key. */
  readonly deltaBucket: OutcomeDeltaBucket;

  readonly counterfactualConfidence: ValueCounterfactualConfidence;
  readonly feedbackSchemaVersion: number;
  /** Mirrors the resolving ledger entry's `recordedAt`. */
  readonly recordedAt: string;
}
