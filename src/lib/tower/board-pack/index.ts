// Tower · Wave 3, Slice 3.5 — Board/ELT pack generator.
//
// Public surface for the board pack: the typed pack shapes and the pure
// `buildBoardPack` composer plus its per-section builders. The pack is
// a deterministic composition over the Slice 3.1 outcome ledger view,
// the Slice 3.4 adoption/value-realization view and the Slice 3.2
// executive action queue — it performs no I/O of its own.

export {
  buildBoardPack,
  buildBoardDecisions,
  buildBoardSpendAtRisk,
  buildBoardValueChange,
  buildBoardActionsRequired,
  buildBoardEvidenceLinks,
} from './board-pack-generator';
export type {
  BoardPack,
  BoardDecisionItem,
  BoardSpendAtRisk,
  BoardValueChangeItem,
  BoardActionRequiredItem,
  BoardEvidenceLink,
} from './board-pack-generator';
