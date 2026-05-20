// Board-grade Costed Business-Case Pack — public surface.
//
// The reference implementation called for by blueprint §9 / §13: a board-grade
// dossier for the Apex "Contact Center AI Routing" Move. Two renderers share
// one PURE view-model and introduce no new numbers:
//   • `renderApexCostedBusinessCaseHtml` — a self-contained HTML deck to READ.
//   • `renderApexCostedBusinessCasePptx` — an editable PowerPoint to EDIT,
//     hybrid fidelity (native text objects + rasterised exhibits).

export { renderApexCostedBusinessCaseHtml } from './html-renderer';
export { renderApexCostedBusinessCasePptx } from './pptx-renderer';
export {
  buildApexCostedBusinessCasePack,
  type CostedBusinessCasePack,
  type PackSections,
} from './pack-model';
