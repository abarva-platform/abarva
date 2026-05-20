// Board-grade Moves artifacts — public surface.
//
// The reference implementations called for by the Moves Board-Grade Artifact
// Blueprint: board-grade HTML decks for the Apex "Contact Center AI Routing"
// Move. Every renderer is a PURE function — it produces one self-contained
// HTML string from the existing Expert Kernel, introducing no new numbers.
// The routes stream the strings.
//
// The deck CHROME — the menu rail, the stage, the slide scaffold, the inline
// slide-switch script, the print expansion and the locked design-system CSS —
// is the shared `deck-shell` module, so every artifact deck is consistent.

export { renderApexCostedBusinessCaseHtml } from './html-renderer';
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
