import { evidenceById } from './evidence-requirements';
import { criterionById } from './gate-criteria';

export type EvidenceGateEntry = {
  requirementIds: string[];
};

const EVIDENCE_GATE_MAP: Record<string, EvidenceGateEntry> = {
  'GATE-SCOPE-01': {
    requirementIds: ['EVID-SRC-SCOPE-APP-INV'],
  },
  'EVID-SCOPE-01': {
    requirementIds: ['EVID-SRC-SCOPE-TICKET-HISTORY'],
  },
  'GATE-SCOPE-04': {
    requirementIds: [
      'EVID-SRC-SCOPE-APP-INV',
      'EVID-SRC-SCOPE-ORG',
      'EVID-SRC-SCOPE-TICKET-HISTORY',
      'EVID-SRC-SCOPE-FY-CONTRACT',
    ],
  },
  'GATE-RFP-01': {
    requirementIds: ['EVID-SRC-RFP-LEGAL-TEMPLATE'],
  },
  'GATE-RFP-02': {
    requirementIds: ['EVID-SRC-RFP-VENDOR-INTEL'],
  },
  'GATE-RFP-04': {
    requirementIds: ['EVID-SRC-RFP-LEGAL-TEMPLATE'],
  },
  'GATE-RESP-01': {
    requirementIds: ['EVID-SRC-RESP-PROPOSALS'],
  },
  'GATE-RESP-02': {
    requirementIds: ['EVID-SRC-RESP-PROPOSALS'],
  },
  'GATE-RESP-03': {
    requirementIds: ['EVID-SRC-RESP-CLARIFICATIONS'],
  },
  'GATE-EVAL-01': {
    requirementIds: ['EVID-SRC-EVAL-RATER-SCORES'],
  },
  'GATE-EVAL-02': {
    requirementIds: ['EVID-SRC-EVAL-RATER-SCORES'],
  },
  'GATE-EVAL-04': {
    requirementIds: ['EVID-SRC-EVAL-WEIGHT-RATIONALE'],
  },
  'GATE-EVAL-05': {
    requirementIds: ['EVID-SRC-EVAL-RATER-SCORES'],
  },
  'GATE-PRICE-01': {
    requirementIds: [
      'EVID-SRC-PRICE-VENDOR-PRICING',
      'EVID-SRC-PRICE-ASSUMPTIONS',
    ],
  },
  'GATE-PRICE-03': {
    requirementIds: ['EVID-SRC-PRICE-ASSUMPTIONS'],
  },
};

export function evidenceRequirementsForCriterion(criterionId: string): string[] {
  return EVIDENCE_GATE_MAP[criterionId]?.requirementIds ?? [];
}

export function mappedEvidenceCriterionIds(): string[] {
  return Object.keys(EVIDENCE_GATE_MAP);
}

export function validateEvidenceGateMap(): {
  danglingCriterionIds: string[];
  danglingRequirementIds: string[];
} {
  const danglingCriterionIds: string[] = [];
  const danglingRequirementIds: string[] = [];
  for (const [criterionId, entry] of Object.entries(EVIDENCE_GATE_MAP)) {
    if (!criterionById(criterionId)) danglingCriterionIds.push(criterionId);
    for (const requirementId of entry.requirementIds) {
      if (!evidenceById(requirementId)) {
        danglingRequirementIds.push(requirementId);
      }
    }
  }
  return { danglingCriterionIds, danglingRequirementIds };
}
