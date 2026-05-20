// Board-grade Costed Business-Case Pack — public surface.
//
// The reference implementation called for by blueprint §9 / §13: a board-grade
// HTML dossier for the Apex "Contact Center AI Routing" Move. The renderer is a
// PURE function — it produces one self-contained HTML string from the existing
// Expert Kernel, introducing no new numbers. The route streams the string.

export { renderApexCostedBusinessCaseHtml } from './html-renderer';
export {
  buildApexCostedBusinessCasePack,
  type CostedBusinessCasePack,
  type PackSections,
} from './pack-model';
