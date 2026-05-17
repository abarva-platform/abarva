// Tower → Outcome → Context write-back · Wave 3, Slice 3.7 · types.
//
// This is the loop-closure hand-off. The Slice 3.1 outcome ledger
// records realized AI value; the Slice 3.6 outcome-pattern-feedback
// table captures the anonymizable, cross-tenant learning signal. But
// neither writes the learning back into the *tenant's own* Context
// layer — so a future Intelligence query for that tenant could not be
// grounded in "this bet was made, and here is what actually happened".
//
// This module closes that gap. When an outcome-ledger entry reaches a
// VERIFIED / REALIZED state, the pure builder here projects it into an
// `enterprise_context_records` row of `record_type = 'outcome_learning'`
// — a labeled, tenant-scoped Context record. Unlike the 3.6 feedback
// record, this projection is deliberately tenant-FACING: it KEEPS the
// subject label and the realized figures so the tenant's own
// Intelligence retrieval can cite a concrete prior outcome. The 3.6
// table stays the cross-tenant (anonymized) path; this is the
// intra-tenant (grounded) path. They are siblings, not substitutes.

import type {
  ValueCounterfactualConfidence,
  ValueLedgerCategory,
  ValueMeasurementUnit,
} from '@/lib/tower/ai-value-outcome-ledger';
import type { OutcomeSubjectKind } from '@/lib/tower/outcome-ledger';

/** Schema version of the Context write-back projection logic. */
export const OUTCOME_CONTEXT_WRITEBACK_SCHEMA_VERSION = 1;

/**
 * The `record_type` discriminator the write-back lands under in
 * `enterprise_context_records`. A future Intelligence retrieval filters
 * the Context layer on this value to surface prior realized outcomes.
 */
export const OUTCOME_LEARNING_RECORD_TYPE = 'outcome_learning';

/**
 * The physical Context-layer table outcome learning writes back into.
 * Declared as a constant so the builder, the adapter, and tests agree
 * on one name and a rename is a single-line change.
 */
export const OUTCOME_LEARNING_CONTEXT_TABLE = 'enterprise_context_records';

/**
 * How a realized outcome compares to what was projected — the coarse,
 * tenant-FACING verdict an Intelligence answer leads with. Unlike the
 * 3.6 `OutcomeArchetype`, this is allowed to be read back verbatim to
 * the tenant alongside the real figures.
 */
export const OUTCOME_LEARNING_VERDICTS = [
  'exceeded',
  'met',
  'shortfall',
  'declined',
] as const;

export type OutcomeLearningVerdict = (typeof OUTCOME_LEARNING_VERDICTS)[number];

/**
 * The structured `payload` JSONB body of an `outcome_learning` Context
 * record. Everything here is tenant-facing — labels and figures are
 * intentionally preserved so a grounded Intelligence answer can cite a
 * concrete prior bet and its actual result.
 */
export interface OutcomeLearningPayload {
  /** Links back to the resolving `outcome_ledger` row for audit. */
  readonly sourceEntryId: string;
  /** What the value claim was attached to (move / source_event / …). */
  readonly subjectKind: OutcomeSubjectKind;
  /** Opaque ref of the subject within its module. */
  readonly subjectRef: string;
  /** Human-readable subject label — kept for grounded retrieval. */
  readonly subjectLabel: string;
  readonly valueCategory: ValueLedgerCategory;
  readonly measurementUnit: ValueMeasurementUnit;
  /** The coarse tenant-facing verdict. */
  readonly verdict: OutcomeLearningVerdict;
  /** The value rung the outcome resolved to. */
  readonly outcomeRung: string;
  readonly projectedAmount: number;
  /** Realized figure; null only for a `declined` outcome. */
  readonly realizedAmount: number | null;
  /** `realized - projected`, or null when not computable. */
  readonly varianceAbs: number | null;
  /** `realized / projected`, or null when not computable. */
  readonly realizationRatio: number | null;
  readonly counterfactualConfidence: ValueCounterfactualConfidence;
  /** A plain-English line a retrieval layer can surface directly. */
  readonly learningSummary: string;
  /** Provenance — the ledger row's `recordedAt`. */
  readonly recordedAt: string;
  readonly writebackSchemaVersion: number;
}

/**
 * A fully-formed `enterprise_context_records` row body, snake_case
 * column names → values, ready for an `INSERT` / `.upsert()`. The
 * builder produces this; the write adapter persists it verbatim.
 *
 * `canonical_record_id` is deterministic — derived from the source
 * ledger entry id — so a replayed write-back upserts the SAME Context
 * record rather than duplicating it (the loop-closure write is
 * idempotent by construction).
 */
export interface OutcomeLearningContextRow {
  readonly tenant_key: string;
  readonly client_id: string | null;
  readonly canonical_record_id: string;
  readonly record_type: typeof OUTCOME_LEARNING_RECORD_TYPE;
  readonly record_subtype: OutcomeLearningVerdict;
  readonly title: string;
  readonly source_system: 'tower_outcome_ledger';
  readonly source_record_id: string;
  readonly lifecycle_state: 'active';
  readonly evidence_pointer: string | null;
  readonly payload: OutcomeLearningPayload;
}

/**
 * The result of attempting a write-back projection for one ledger row.
 *
 * `written` is `false` (with a `reason`) when the row is not yet at a
 * verified/realized state — such a row carries no closed-loop learning
 * and MUST NOT write back. `written` is `true` with a `row` when the
 * loop can close for that subject.
 */
export type OutcomeContextWritebackPlan =
  | { readonly written: false; readonly reason: 'not_resolved' }
  | { readonly written: true; readonly row: OutcomeLearningContextRow };
