// Outcome pattern feedback · Wave 3, Slice 3.6.
//
// Public surface for the outcome-feedback mechanism: the typed record
// shape, the pure builder that derives a feedback record from a
// resolved outcome-ledger entry, and the anonymized projection that a
// future cross-tenant pattern graph (Layer 3) consumes.
//
// This is the start of the Layer 2 -> Layer 3 moat path. The builder
// reads outcome-ledger row types but never mutates the ledger; it is
// pure (no clock, no I/O). See build-feedback.ts and anonymize.ts for
// the privacy-first design rationale.

export {
  OUTCOME_ARCHETYPES,
  OUTCOME_DELTA_BUCKETS,
  OUTCOME_FEEDBACK_SCHEMA_VERSION,
  OUTCOME_TERMINAL_RUNGS,
  type DecisionShape,
  type OutcomeArchetype,
  type OutcomeDeltaBucket,
  type OutcomePatternFeedbackRecord,
  type OutcomeTerminalRung,
} from './types';
export {
  buildOutcomePatternFeedback,
  buildOutcomePatternFeedbackBatch,
  isResolvedOutcome,
} from './build-feedback';
export {
  anonymizeOutcomeFeedback,
  anonymizeOutcomeFeedbackBatch,
  type AnonymizedOutcomePattern,
} from './anonymize';
