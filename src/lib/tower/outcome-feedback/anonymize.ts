// Outcome pattern feedback · Wave 3, Slice 3.6 · anonymized projection.
//
// The structural proof that the feedback record is privacy-safe: this
// module projects an `OutcomePatternFeedbackRecord` onto the
// tenant-agnostic subset that a future cross-tenant aggregation job
// (the Layer 3 pattern graph) consumes.
//
// Anonymization here is a COLUMN DROP, not a scrub. We drop exactly
// the three re-identifying fields — `tenantClientKey`, `clientId`,
// `sourceEntryId` — and what remains is, by construction, an
// anonymized contribution. Because `build-feedback.ts` never copies a
// label, note, evidence pointer, user id, or tenant slug into any
// other field, no residual re-identification path exists. If a future
// change breaks that invariant, this projection breaks loudly: the
// `AnonymizedOutcomePattern` type has no field to put such data in.

import type {
  OutcomeArchetype,
  OutcomeDeltaBucket,
  OutcomePatternFeedbackRecord,
  OutcomeTerminalRung,
} from './types';
import type { DecisionShape } from './types';

/**
 * The anonymized, cross-tenant-safe shape of one outcome contribution.
 * Carries NO tenant identifier, NO source-entry id, NO labels — only
 * the structural pattern signal a cross-tenant graph aggregates.
 */
export interface AnonymizedOutcomePattern {
  readonly decisionShape: DecisionShape;
  readonly outcomeArchetype: OutcomeArchetype;
  readonly outcomeRung: OutcomeTerminalRung;
  readonly deltaSign: -1 | 0 | 1;
  readonly deltaBucket: OutcomeDeltaBucket;
  /** Confidence weight for the contribution. */
  readonly counterfactualConfidence: OutcomePatternFeedbackRecord['counterfactualConfidence'];
  readonly feedbackSchemaVersion: number;
}

/**
 * Project a feedback record onto its anonymized, cross-tenant-safe
 * contribution by dropping every re-identifying field.
 *
 * This is the single function the future Layer 3 aggregation job calls
 * on each tenant's feedback rows before merging them into the shared
 * pattern graph. The raw numeric figures (`projectedAmount`,
 * `realizedAmount`, `deltaAbs`, `deltaRatio`) are deliberately NOT
 * carried through — only the coarsened `deltaBucket` / `deltaSign` —
 * so a tenant's actual numbers never leave the tenant boundary.
 */
export function anonymizeOutcomeFeedback(
  record: OutcomePatternFeedbackRecord,
): AnonymizedOutcomePattern {
  return {
    decisionShape: record.decisionShape,
    outcomeArchetype: record.outcomeArchetype,
    outcomeRung: record.outcomeRung,
    deltaSign: record.deltaSign,
    deltaBucket: record.deltaBucket,
    counterfactualConfidence: record.counterfactualConfidence,
    feedbackSchemaVersion: record.feedbackSchemaVersion,
  };
}

/** Anonymize a batch of feedback records. Order is preserved. */
export function anonymizeOutcomeFeedbackBatch(
  records: readonly OutcomePatternFeedbackRecord[],
): readonly AnonymizedOutcomePattern[] {
  return records.map(anonymizeOutcomeFeedback);
}
