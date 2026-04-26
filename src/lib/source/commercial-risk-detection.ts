// Commercial risk exception detection for Source module.
// Deterministic — no model calls, no network calls.

export type CommercialRiskCategory =
  | 'pricing_anomaly'
  | 'scope_ambiguity'
  | 'governance_gap'
  | 'evidence_deficit'
  | 'contract_trap'
  | 'transition_risk'
  | 'liability_exposure'
  | 'timeline_compression';

export type CommercialRiskSeverity = 'critical' | 'high' | 'medium' | 'low';

export type CommercialRiskStatus =
  | 'open'
  | 'acknowledged'
  | 'mitigated'
  | 'accepted'
  | 'resolved';

export interface CommercialRiskException {
  exceptionId: string;
  vendorId: string;
  category: CommercialRiskCategory;
  severity: CommercialRiskSeverity;
  status: CommercialRiskStatus;
  title: string;
  description: string;
  trigger: string;           // what triggered this detection
  evidenceRef: string[];     // slice IDs or doc refs
  recommendedAction: string;
  detectedAt: string;
}

export interface CommercialRiskPattern {
  patternId: string;
  category: CommercialRiskCategory;
  name: string;
  description: string;
  triggerConditions: string[];
  defaultSeverity: CommercialRiskSeverity;
}

export interface CommercialRiskDetectionInput {
  eventId: string;
  eventName: string;
  vendorIds: string[];
  hasIncompleteEvidence: boolean;
  hasPricingAnomalies: boolean;
  hasScopeAmbiguity: boolean;
  hasGovernanceGap: boolean;
}

export interface CommercialRiskDetectionResult {
  eventId: string;
  eventName: string;
  generatedAt: string;
  exceptions: CommercialRiskException[];
  patterns: CommercialRiskPattern[];
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  totalCount: number;
  overallRiskLevel: CommercialRiskSeverity;
  summaryNarrative: string;
}

export const RISK_PATTERNS: CommercialRiskPattern[] = [
  {
    patternId: 'pat-pricing-anomaly',
    category: 'pricing_anomaly',
    name: 'Pricing Anomaly',
    description: 'Vendor pricing deviates significantly from market benchmarks or peer quotes.',
    triggerConditions: ['price > 1.2x median', 'price < 0.7x median'],
    defaultSeverity: 'high',
  },
  {
    patternId: 'pat-scope-ambiguity',
    category: 'scope_ambiguity',
    name: 'Scope Ambiguity',
    description: 'Scope of work contains undefined terms or implicit inclusions.',
    triggerConditions: ['missing exclusion list', 'undefined assumption bundle'],
    defaultSeverity: 'high',
  },
  {
    patternId: 'pat-governance-gap',
    category: 'governance_gap',
    name: 'Governance Gap',
    description: 'No formal SLA, performance review, or escalation path defined.',
    triggerConditions: ['missing SLA', 'no penalty clause'],
    defaultSeverity: 'medium',
  },
  {
    patternId: 'pat-evidence-deficit',
    category: 'evidence_deficit',
    name: 'Evidence Deficit',
    description: 'Insufficient evidence to substantiate vendor claims or pricing basis.',
    triggerConditions: ['evidence coverage < 50%', 'missing reference data'],
    defaultSeverity: 'high',
  },
  {
    patternId: 'pat-contract-trap',
    category: 'contract_trap',
    name: 'Contract Trap',
    description: 'Contract terms that disproportionately favour the vendor.',
    triggerConditions: ['auto-renewal clause', 'broad IP assignment', 'one-sided termination'],
    defaultSeverity: 'critical',
  },
];

export function detectCommercialRisks(
  input: CommercialRiskDetectionInput,
): CommercialRiskDetectionResult {
  const exceptions: CommercialRiskException[] = [];

  if (input.hasPricingAnomalies) {
    for (const vendorId of input.vendorIds) {
      exceptions.push({
        exceptionId: `exc-${vendorId}-pricing`,
        vendorId,
        category: 'pricing_anomaly',
        severity: 'high',
        status: 'open',
        title: 'Pricing deviation detected',
        description: 'Vendor pricing deviates from market benchmark by more than 20%.',
        trigger: 'hasPricingAnomalies flag set',
        evidenceRef: [],
        recommendedAction: 'Request vendor to provide benchmark comparison and justify pricing.',
        detectedAt: '2026-04-26',
      });
    }
  }

  if (input.hasScopeAmbiguity) {
    for (const vendorId of input.vendorIds) {
      exceptions.push({
        exceptionId: `exc-${vendorId}-scope`,
        vendorId,
        category: 'scope_ambiguity',
        severity: 'high',
        status: 'open',
        title: 'Scope ambiguity detected',
        description: 'Statement of work lacks explicit exclusion list or assumption bundle.',
        trigger: 'hasScopeAmbiguity flag set',
        evidenceRef: [],
        recommendedAction: 'Require vendor to provide explicit exclusion list before BAFO.',
        detectedAt: '2026-04-26',
      });
    }
  }

  if (input.hasGovernanceGap) {
    exceptions.push({
      exceptionId: `exc-event-governance`,
      vendorId: 'all',
      category: 'governance_gap',
      severity: 'medium',
      status: 'open',
      title: 'Governance gap detected',
      description: 'No SLA or performance review cadence defined in any vendor submission.',
      trigger: 'hasGovernanceGap flag set',
      evidenceRef: [],
      recommendedAction: 'Include mandatory SLA and review cadence in BAFO requirements.',
      detectedAt: '2026-04-26',
    });
  }

  if (input.hasIncompleteEvidence) {
    exceptions.push({
      exceptionId: `exc-event-evidence`,
      vendorId: 'all',
      category: 'evidence_deficit',
      severity: 'high',
      status: 'open',
      title: 'Incomplete evidence coverage',
      description: 'Evidence coverage is below 50% for one or more required data categories.',
      trigger: 'hasIncompleteEvidence flag set',
      evidenceRef: [],
      recommendedAction: 'Pause evaluation until evidence coverage reaches 80%.',
      detectedAt: '2026-04-26',
    });
  }

  const criticalCount = exceptions.filter((e) => e.severity === 'critical').length;
  const highCount = exceptions.filter((e) => e.severity === 'high').length;
  const mediumCount = exceptions.filter((e) => e.severity === 'medium').length;
  const lowCount = exceptions.filter((e) => e.severity === 'low').length;

  const overallRiskLevel: CommercialRiskSeverity =
    criticalCount > 0 ? 'critical' :
    highCount > 0 ? 'high' :
    mediumCount > 0 ? 'medium' : 'low';

  return {
    eventId: input.eventId,
    eventName: input.eventName,
    generatedAt: '2026-04-26',
    exceptions,
    patterns: RISK_PATTERNS,
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
    totalCount: exceptions.length,
    overallRiskLevel,
    summaryNarrative: exceptions.length === 0
      ? 'No commercial risk exceptions detected.'
      : `${exceptions.length} exception(s) detected. Overall risk: ${overallRiskLevel}.`,
  };
}
