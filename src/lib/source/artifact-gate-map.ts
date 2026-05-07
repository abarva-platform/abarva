// Maps SourceArtifactFamily → criterion IDs that should be marked `met`
// when an artifact of that family is successfully uploaded and persisted.
//
// The gate evaluator resolves status by direct-key lookup on the evidence
// map (`evidenceMap[criterion.id] === 'met'`), so injecting these IDs into
// the in-memory evidence store is sufficient to flip a criterion green in
// the same process/render.
//
// Coverage: PAT_SRC_AMS_001 criteria only. The mapping is intentionally
// conservative — an uploaded artifact satisfies artifact-presence criteria
// (ART-AMS-*) directly. Hard gate criteria (GATE-AMS-*) that require
// quorum (e.g. "4 vendor responses") are NOT auto-satisfied by a single
// upload; those flip when the fixture count conditions are met.

import type { SourceArtifactFamily } from './artifact-registry/types';

export type ArtifactGateEntry = {
  criterionIds: string[];
};

const ARTIFACT_GATE_MAP: Partial<Record<SourceArtifactFamily, ArtifactGateEntry>> = {
  sourcing_strategy: {
    criterionIds: ['ART-AMS-PLAN-01'],
  },
  scope_document: {
    criterionIds: ['ART-AMS-PLAN-02', 'GATE-AMS-RFI-02'],
  },
  rfi: {
    criterionIds: ['ART-AMS-RFI-01', 'ART-AMS-RFI-02'],
  },
  rfp: {
    criterionIds: ['ART-AMS-RFP-01', 'ART-AMS-RFP-02'],
  },
  scorecard: {
    criterionIds: ['ART-AMS-SHL-03', 'ART-AMS-SEL-01', 'ART-AMS-BAFO-03'],
  },
  pricing_workbook: {
    criterionIds: ['GATE-AMS-BAFO-02', 'ART-AMS-BAFO-04'],
  },
  bafo: {
    criterionIds: ['ART-AMS-BAFO-01', 'ART-AMS-BAFO-02'],
  },
  proposal: {
    criterionIds: ['ART-AMS-BID-01', 'ART-AMS-BID-02'],
  },
  decision_brief: {
    criterionIds: ['GATE-AMS-SEL-02', 'ART-AMS-AWD-02'],
  },
  transition_risk_register: {
    criterionIds: ['ART-AMS-ONB-03'],
  },
  value_ledger: {
    criterionIds: ['ART-AMS-ONB-04'],
  },
  meeting_notes: {
    criterionIds: ['ART-AMS-QA-01'],
  },
};

/**
 * Returns the criterion IDs that should be marked `met` when an artifact
 * of the given family is uploaded. Returns an empty array for families
 * with no direct gate mapping (e.g. `other`, `workshop_output`).
 */
export function getCriterionIdsForArtifactFamily(
  family: SourceArtifactFamily,
): string[] {
  return ARTIFACT_GATE_MAP[family]?.criterionIds ?? [];
}
