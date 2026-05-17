// Tower → Outcome → Context write-back · Wave 3, Slice 3.7.
//
// Public surface for the loop-closure hand-off: the typed Context
// record shape, the pure builder that derives an `outcome_learning`
// Context record from a verified/realized outcome-ledger entry, and the
// thin persist seam that lands it in the tenant Context layer.
//
// This is the final arrow of the decision loop — Context → Intelligence
// → Moves → Source → Tower → Outcome → *Context*. With it wired, a
// verified outcome grounds a future Intelligence query for the same
// tenant, and the story-pack generator can set `loopClosed: true`.
//
// The builder is pure (no clock, no I/O); `persist.ts` owns the single
// upsert. See build-writeback.ts and types.ts for the design rationale.

export {
  OUTCOME_CONTEXT_WRITEBACK_SCHEMA_VERSION,
  OUTCOME_LEARNING_CONTEXT_TABLE,
  OUTCOME_LEARNING_RECORD_TYPE,
  OUTCOME_LEARNING_VERDICTS,
  type OutcomeContextWritebackPlan,
  type OutcomeLearningContextRow,
  type OutcomeLearningPayload,
  type OutcomeLearningVerdict,
} from './types';
export {
  buildOutcomeContextWriteback,
  buildOutcomeContextWritebackBatch,
  isResolvedForWriteback,
} from './build-writeback';
export {
  writeOutcomeLearningBatchToContext,
  writeOutcomeLearningToContext,
  type ContextWritebackStore,
  type OutcomeContextWritebackResult,
} from './persist';
