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

export { renderApexDiscoverBriefHtml } from './discover-brief-renderer';
export {
  buildApexDiscoverBrief,
  type DiscoverBrief,
  type BriefSections,
} from './discover-brief-model';

export { renderApexSolutionArchitectureHtml } from './solution-architecture-renderer';
export {
  buildApexSolutionArchitecture,
  type SolutionArchitecture,
  type ArchSections,
  type TargetPattern,
} from './solution-architecture-model';

export { renderApexCharterSkeletonHtml } from './charter-skeleton-renderer';
export {
  buildApexCharterSkeleton,
  type CharterSkeleton,
  type CharterSections,
} from './charter-skeleton-model';

export { renderApexCfoPackHtml } from './cfo-pack-renderer';
export {
  buildApexCfoPack,
  type CfoPack,
  type CfoSections,
} from './cfo-pack-model';
