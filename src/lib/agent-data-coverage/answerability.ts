// Derived answerability (Workstream D).
//
// Replaces the hardcoded `expectedAnswerability` constants in agent-golden /
// agent-domain-matrix with a status DERIVED from measured pipeline state. The
// four-state truth — loaded → indexed → retrievable → cited — plus context-
// bundle inclusion and claim support yields one of ten honest statuses, each
// with a reason. Pure + fully unit-testable; the live harness feeds it real
// signals from the trace + governed_object_readiness on Azure Container Apps.

export const ANSWERABILITY_STATUSES = [
  'ANSWERED_AND_GROUNDED',
  'CONTENT_GAP',
  'INGESTION_GAP',
  'INDEXING_GAP',
  'RETRIEVAL_GAP',
  'CONTEXT_BUNDLE_GAP',
  'CITATION_RENDERING_GAP',
  'CLAIM_SUPPORT_GAP',
  'NOT_LOADED',
  'NOT_TESTED',
] as const;

export type AnswerabilityStatus = (typeof ANSWERABILITY_STATUSES)[number];

/**
 * Measured signals for one (tenant, dimension/question). Every field is
 * optional except `tested`: an unmeasured question is NOT_TESTED, never a
 * fabricated FULLY/PARTIALLY constant.
 */
export interface PipelineSignals {
  /** Whether this question was actually exercised against data. */
  tested: boolean;
  /** Committed current facts/records present for the required dimension. */
  loadedCount?: number;
  /** Whether the *specific* required content exists (vs the dimension having
   *  some unrelated rows). Distinguishes CONTENT_GAP from a healthy load. */
  requiredContentPresent?: boolean;
  /** Rows indexed (fts_indexed / search_indexed). */
  indexedCount?: number;
  /** Rows the tenant-scoped retrieval actually returned for the query. */
  retrievedCount?: number;
  /** Whether the retrieved objects made it into the validated context bundle. */
  inContextBundle?: boolean;
  /** Whether the answer emitted citation/evidence objects. */
  citationsEmitted?: boolean;
  /** Whether emitted citations are render-verified (cite-render proof). */
  citationsRendered?: boolean;
  /** Whether the answer's major claims were supported (PR-4 claim validation). */
  claimsSupported?: boolean;
}

export interface AnswerabilityResult {
  status: AnswerabilityStatus;
  reason: string;
}

/** Derive the answerability status from measured pipeline signals. */
export function deriveAnswerability(signals: PipelineSignals): AnswerabilityResult {
  if (!signals.tested) {
    return { status: 'NOT_TESTED', reason: 'Not exercised against data yet (run on Azure Container Apps).' };
  }
  if ((signals.loadedCount ?? 0) === 0) {
    return { status: 'NOT_LOADED', reason: 'No committed facts for the required dimension.' };
  }
  if (signals.requiredContentPresent === false) {
    return {
      status: 'CONTENT_GAP',
      reason: 'Dimension has rows but the specific required content is absent — load the missing facts.',
    };
  }
  if ((signals.indexedCount ?? 0) === 0) {
    return { status: 'INDEXING_GAP', reason: 'Loaded but not indexed (fts/search) — refresh the index.' };
  }
  if ((signals.retrievedCount ?? 0) === 0) {
    return { status: 'RETRIEVAL_GAP', reason: 'Indexed but the tenant-scoped query returned nothing — check the retrieval gate/segments.' };
  }
  if (signals.inContextBundle === false) {
    return { status: 'CONTEXT_BUNDLE_GAP', reason: 'Retrieved but excluded from the validated context bundle (governance/policy).' };
  }
  if (signals.citationsEmitted === false) {
    return { status: 'CITATION_RENDERING_GAP', reason: 'Bundle had the facts but the answer emitted no citations.' };
  }
  if (signals.citationsRendered === false) {
    return { status: 'CITATION_RENDERING_GAP', reason: 'Citations emitted but not render-verified end-to-end.' };
  }
  if (signals.claimsSupported === false) {
    return { status: 'CLAIM_SUPPORT_GAP', reason: 'Answer made claims that no retrieved evidence supports.' };
  }
  return { status: 'ANSWERED_AND_GROUNDED', reason: 'Loaded, indexed, retrieved, cited, and claim-supported.' };
}

/** True when the derived status represents a usable, grounded answer. */
export function isGrounded(status: AnswerabilityStatus): boolean {
  return status === 'ANSWERED_AND_GROUNDED';
}

/** Map a gap status to the remediation lane that owns it. */
export function remediationLaneFor(status: AnswerabilityStatus): string | null {
  switch (status) {
    case 'NOT_LOADED':
    case 'CONTENT_GAP':
      return 'ingestion_data_load';
    case 'INDEXING_GAP':
    case 'RETRIEVAL_GAP':
      return 'retrieval_indexing';
    case 'CONTEXT_BUNDLE_GAP':
      return 'provenance_source_state';
    case 'CITATION_RENDERING_GAP':
      return 'ui_module_binding';
    case 'CLAIM_SUPPORT_GAP':
      return 'answer_prompt_synthesis';
    default:
      return null;
  }
}
