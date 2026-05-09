// Source · Deliverable Spec types (Path C migration foundations).
//
// Pure type module. Mirrors src/lib/programs/exports/types.ts so Source
// + Programs share the same envelope shape across the platform. The
// only Source-specific surface is the `kind` union — Source's 11
// artifact codes get their own canonical kind names here.
//
// Per-kind narrow payload shapes are NOT defined in this slice. Each
// renderer slice (Slice 8.2 d05, Slice 8.3 the rest) ships its narrow
// shape alongside the renderer; the envelope below keeps Slice 8.1
// land-able without forcing 11 unfinished payload types into main.

import type { DeliverableSpec, DeliverableFormat } from '@/lib/programs/exports/types';

export type { DeliverableFormat };

/**
 * Source's canonical deliverable kinds — one per artifact-code that
 * has a structured export today. Stable strings (kebab-case) for
 * cross-format dispatch + URL-safe routing.
 *
 * Mapping to canonical artifact codes (artifact-specs.ts):
 *   scope-memo            → d05_scope_memo
 *   rfp-package           → d09_rfp_pack
 *   decision-brief        → d24_decision_brief
 *   selection-memo        → d27_selection_memo
 *   app-inventory         → d04_app_inv
 *   response-checklist    → d11_response_checklist
 *   scorecard             → d16_scorecard
 *   pricing-template      → d19_pricing_workbook (variant=template)
 *   pricing-comparison    → d19_pricing_workbook (variant=comparison)
 *   trap-log              → d20_trap_log
 *   bafo-question-pack    → d22_bafo_question_pack
 */
export type SourceDeliverableKind =
  | 'scope-memo'
  | 'rfp-package'
  | 'decision-brief'
  | 'selection-memo'
  | 'app-inventory'
  | 'response-checklist'
  | 'scorecard'
  | 'pricing-template'
  | 'pricing-comparison'
  | 'trap-log'
  | 'bafo-question-pack';

/**
 * Source's deliverable spec — extends the Programs envelope with a
 * Source-specific kind union + a sourceEventId field used by every
 * Source binder for context resolution.
 */
export interface SourceDeliverableSpec
  extends Omit<DeliverableSpec, 'kind' | 'programId'> {
  kind: SourceDeliverableKind;
  /** Source event id (event slug or UUID). Required for Source. */
  sourceEventId: string;
  /** Optional artifact-variant discriminator (e.g. 'template' / 'comparison'). */
  variant?: string;
}

/**
 * Map from canonical artifact code → kind. Used by the route handler
 * to translate URL params into kinds, and by the canvas client to
 * route artifact cards to the right deliverable kind.
 */
export const ARTIFACT_CODE_TO_KIND: Record<string, SourceDeliverableKind> = {
  d05_scope_memo: 'scope-memo',
  d09_rfp_pack: 'rfp-package',
  d24_decision_brief: 'decision-brief',
  d27_selection_memo: 'selection-memo',
  d04_app_inv: 'app-inventory',
  d11_response_checklist: 'response-checklist',
  d16_scorecard: 'scorecard',
  d20_trap_log: 'trap-log',
  d22_bafo_question_pack: 'bafo-question-pack',
  // d19 has two kinds depending on variant — handled in the route
  // handler not here (both map to the same artifact code).
};

/** Reverse map for renderer authoring + tests. */
export const KIND_TO_ARTIFACT_CODE: Record<SourceDeliverableKind, string> = {
  'scope-memo': 'd05_scope_memo',
  'rfp-package': 'd09_rfp_pack',
  'decision-brief': 'd24_decision_brief',
  'selection-memo': 'd27_selection_memo',
  'app-inventory': 'd04_app_inv',
  'response-checklist': 'd11_response_checklist',
  'scorecard': 'd16_scorecard',
  'pricing-template': 'd19_pricing_workbook',
  'pricing-comparison': 'd19_pricing_workbook',
  'trap-log': 'd20_trap_log',
  'bafo-question-pack': 'd22_bafo_question_pack',
};
