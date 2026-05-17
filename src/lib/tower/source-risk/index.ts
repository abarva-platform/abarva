// Source risk in Tower · Wave 3, Slice 3.3.
//
// Public surface for the Tower source-risk read model: the typed view
// shapes and the pure builders that join the Slice 1.6 Source-to-Move
// handoff records against the Slice 3.1 outcome ledger view.
//
// This module performs no data-plane read of its own — callers pass in
// already-built handoff records and an `OutcomeLedgerView`. See
// `source-risk-view.ts` for the join + classification rationale.

export type {
  MoveSourceRisk,
  SourceRiskDriver,
  SourceRiskLevel,
  SourceRiskSummary,
  SourceRiskView,
  SourceRiskViewInput,
} from './types';
export { SOURCE_RISK_LEVELS } from './types';
export {
  buildSourceRiskView,
  summarizeSourceRisk,
  toMoveSourceRisk,
} from './source-risk-view';
