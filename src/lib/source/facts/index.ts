// Source analytics fact model — public surface.
//
// The canonical catalog (fact-catalog), the persisted row model (fact-types), and
// the deterministic structured-map intake contract (template-fact-map). Downstream
// slices (value engine, intake ingestion, UI) consume these; the archetype
// `valueLeverRules` remain the single source of truth the catalog is derived from.

export * from './fact-catalog';
export * from './fact-types';
export * from './template-fact-map';
