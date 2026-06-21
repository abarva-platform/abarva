// Board-grade Moves artifacts — public surface.
//
// The reference implementations called for by the Moves Board-Grade Artifact
// Blueprint: board-grade dossiers for the Apex "Contact Center AI Routing"
// Move. Renderers share PURE view-models and introduce no new numbers:
//   • `renderApexCostedBusinessCaseHtml` — the Costed Business-Case Pack as a
//     self-contained HTML deck to READ.
//   • `renderApexCostedBusinessCasePptx` — the same pack as an editable
//     PowerPoint to EDIT (hybrid: native text objects + rasterised exhibits).
//   • `renderApexDiscoverBriefHtml` — the Discover Brief as an HTML deck.
//
// The deck CHROME — the menu rail, the stage, the slide scaffold, the inline
// slide-switch script, the print expansion and the locked design-system CSS —
// is the shared `deck-shell` module, so every artifact deck is consistent.

export { renderApexCostedBusinessCaseHtml } from './html-renderer';
export { renderApexCostedBusinessCasePptx } from './pptx-renderer';
export {
  buildApexCostedBusinessCasePack,
  type CostedBusinessCasePack,
  type PackSections,
} from './pack-model';

// The generic, kernel-derived sibling of the Apex reference renderer — the
// board-grade Costed Business-Case Pack for a REAL, originated Move.
export { renderMoveCostedBusinessCaseHtml } from './move-html-renderer';
export {
  buildMoveCostedBusinessCasePack,
  type MoveCostedBusinessCasePack,
  type MoveCostedBusinessCasePackOptions,
  type MoveUnboundResult,
  type MoveCostedBusinessCaseResult,
  type MovePackSections,
} from './move-pack-model';

// WE-3 — Workforce Economics estimate-twice binding for the board-grade pack.
export {
  buildMoveWorkforceEconomics,
  deriveWorkforceEstimateInput,
} from './move-workforce-economics-binding';

export { renderApexDiscoverBriefHtml } from './discover-brief-renderer';
export {
  buildApexDiscoverBrief,
  type DiscoverBrief,
  type BriefSections,
} from './discover-brief-model';

// The generic, kernel-derived sibling of the Apex reference Discover Brief —
// the board-grade Discover Brief for a REAL, originated Move.
export { renderMoveDiscoverBriefHtml } from './move-discover-brief-renderer';
export {
  buildMoveDiscoverBrief,
  type MoveDiscoverBrief,
  type MoveBriefUnboundResult,
  type MoveDiscoverBriefResult,
  type MoveBriefSections,
} from './move-discover-brief-model';

export { renderApexSolutionArchitectureHtml } from './solution-architecture-renderer';
export {
  buildApexSolutionArchitecture,
  type SolutionArchitecture,
  type ArchSections,
  type TargetPattern,
} from './solution-architecture-model';

// The generic, kernel-derived sibling of the Apex reference renderer — the
// board-grade Solution Architecture Pack for a REAL, originated Move.
export { renderMoveSolutionArchitectureHtml } from './move-solution-architecture-renderer';
export {
  buildMoveSolutionArchitecture,
  type MoveSolutionArchitecture,
  type MoveArchUnboundResult,
  type MoveSolutionArchitectureResult,
  type MoveArchSections,
  type MoveTargetPattern,
} from './move-solution-architecture-model';

export { renderApexEstimateModelHtml } from './estimate-model-renderer';
export {
  buildApexEstimateModel,
  type EstimateModel,
  type EstimateSections,
} from './estimate-model-model';
export {
  renderProbabilisticForecastHtml,
  type ProbabilisticForecastRendererInput,
} from './probabilistic-forecast-renderer';

// The generic, kernel-derived sibling of the Apex reference Estimate Model —
// the board-grade Estimate & Financial Model for a REAL, originated Move.
export { renderMoveEstimateModelHtml } from './move-estimate-renderer';
export {
  buildMoveEstimateModel,
  type MoveEstimateModel,
  type MoveEstimateUnbound,
  type MoveEstimateModelResult,
  type MoveEstimateSections,
} from './move-estimate-model';

export { renderApexMobilizePacketHtml } from './mobilize-packet-renderer';
export {
  buildApexMobilizePacket,
  type MobilizePacket,
  type MobilizeSections,
} from './mobilize-packet-model';

// The generic, kernel-derived sibling of the Apex reference Mobilize renderer
// — the board-grade Mobilize & Go-Decision Packet for a REAL, originated Move.
export { renderMoveMobilizePacketHtml } from './move-mobilize-renderer';
export {
  buildMoveMobilizePacket,
  goVerdictWord,
  type MoveMobilizePacket,
  type MoveMobilizeUnbound,
  type MoveMobilizeResult,
  type MoveMobilizeSections,
  type MoveGoVerdict,
} from './move-mobilize-model';
export { renderApexCharterSkeletonHtml } from './charter-skeleton-renderer';
export {
  buildApexCharterSkeleton,
  type CharterSkeleton,
  type CharterSections,
} from './charter-skeleton-model';

// The generic, kernel-derived sibling of the Apex reference Charter Skeleton —
// the board-grade Charter Business-Case Skeleton for a REAL, originated Move.
export { renderMoveCharterSkeletonHtml } from './move-charter-skeleton-renderer';
export {
  buildMoveCharterSkeleton,
  type MoveCharterSkeleton,
  type MoveCharterUnboundResult,
  type MoveCharterSkeletonResult,
  type MoveCharterSections,
  type MoveCharterVerdict,
} from './move-charter-skeleton-model';

export { renderApexCfoPackHtml } from './cfo-pack-renderer';
export {
  buildApexCfoPack,
  type CfoPack,
  type CfoSections,
} from './cfo-pack-model';

// The generic, kernel-derived sibling of the Apex reference CFO Pack — the
// board-grade CFO Pack for a REAL, originated Move.
export { renderMoveCfoPackHtml } from './move-cfo-pack-renderer';
export {
  buildMoveCfoPack,
  type MoveCfoPack,
  type MoveCfoUnboundResult,
  type MoveCfoPackResult,
  type MoveCfoSections,
  type MoveCfoVerdict,
} from './move-cfo-pack-model';

export { renderApexMasterDossierHtml } from './master-dossier-renderer';
export {
  buildApexMasterMoveDossier,
  type MasterMoveDossier,
  type DossierSections,
} from './master-dossier-model';

// The generic, kernel-derived sibling of the Apex reference Master Move
// Dossier — the assembled-book board-grade deck for a REAL, originated Move,
// linking every other generic board-grade deck for that Move.
export { renderMoveMasterDossierHtml } from './move-master-dossier-renderer';
export {
  buildMoveMasterDossier,
  type MoveMasterDossier,
  type MoveDossierUnboundResult,
  type MoveMasterDossierResult,
  type MoveDossierSections,
  type MoveDossierVerdict,
} from './move-master-dossier-model';
