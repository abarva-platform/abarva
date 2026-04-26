import type { SourceDataReadinessState, SourceEvidenceUsability } from './types';
import type {
  SourceVendorCompletenessStatus,
  SourceVendorComparabilityStatus,
  SourceVendorResponseStatus,
  SourceVendorTemplateStatus,
} from './vendor-response-types';

export type SourcePricingNormalizationStatus =
  | 'comparable'
  | 'partially_comparable'
  | 'not_comparable'
  | 'blocked';

export type SourcePricingNormalizationRowStatus =
  | 'strong'
  | 'risk_adjusted'
  | 'not_comparable'
  | 'blocked';

export interface SourcePricingAssumptionBundle {
  applicationCount: number;
  ticketVolumePerMonth: number;
  supportHoursPerWeek: number;
  severityMix: {
    p1Critical: number;
    p2High: number;
    p3Medium: number;
    p4Low: number;
  };
}

export interface SourcePricingSourceDataCost {
  annualRunCostUsd: number;
  transitionCostUsd: number;
  oneTimeSetupCostUsd: number;
  optionalServicesUsd: number;
  excludedServicesUsd: number;
  changeOrderExposureUsd: number;
  rateEscalationPercent: number;
  securityComplianceHoldbackPercent: number;
}

export interface SourceCommercialTrap {
  vendorId: string;
  vendorName: string;
  category: string;
  signal: string;
  impact: string;
  recommendation: string;
  severity: 'low' | 'medium' | 'high';
}

export interface SourcePricingVendorInput {
  vendorId: string;
  vendorName: string;
  currency: 'USD' | 'USD_EOY';
  annualRunCostUsd: number;
  transitionCostUsd: number;
  oneTimeSetupCostUsd: number;
  optionalServicesUsd: number;
  excludedServicesUsd: number;
  changeOrderExposureUsd: number;
  optionals: string[];
  exclusions: string[];
  supportHoursPerWeek: number;
  applicationCount: number;
  ticketVolumePerMonth: number;
  automationProductivityAssumptionPercent: number;
  rateEscalationPercent: number;
  offshorePercent?: number;
  onshorePercent?: number;
  assumptions: string[];
  securityComplianceNotes: string[];
  evidenceUsability?: SourceEvidenceUsability;
  evidenceStatus?: SourceDataReadinessState;
  responseStatus?: SourceVendorResponseStatus;
  responseRiskLevel?: 'low' | 'medium' | 'high';
  completenessStatus?: SourceVendorCompletenessStatus;
}

export interface SourcePricingVendorContext {
  vendorId: string;
  vendorName: string;
  evidenceUsability: SourceEvidenceUsability;
  evidenceStatus: SourceDataReadinessState;
  pricingTemplateStatus: SourceVendorTemplateStatus;
  transitionPlanStatus: SourceVendorTemplateStatus;
  securityResponseStatus: SourceVendorTemplateStatus;
  automationRoadmapStatus: SourceVendorTemplateStatus;
  responseStatus: SourceVendorResponseStatus;
  comparabilityStatus?: SourceVendorComparabilityStatus;
}

export interface SourcePricingVendorSnapshot {
  vendorId: string;
  vendorName: string;
  readinessStatus: SourcePricingNormalizationRowStatus;
  comparabilityStatus: SourceVendorComparabilityStatus | SourcePricingNormalizationStatus;
  costInputs: SourcePricingSourceDataCost;
  assumptions: SourcePricingAssumptionBundle;
  costByYear: {
    year1: number;
    year2: number;
    year3: number;
  };
  transitionInclusiveYearOneUsd: number;
  costPerApplicationUsd: number;
  costPerTicketUsd: number;
  costPerTicketSavingsAtRiskUsd: number;
  commercialTraps: SourceCommercialTrap[];
  exclusions: string[];
  optionals: string[];
  notes: string[];
  nextAction: string;
  atlasExecutiveImplication: string;
  sentinelEvidenceNotes: string[];
  stewardGateNotes: string[];
  rationale: string[];
}

export interface SourcePricingComparisonRank {
  vendorId: string;
  vendorName: string;
  rank: number;
  comparable: boolean;
  score: number;
  reason: string;
}

export interface SourcePricingNormalizationSummary {
  totalVendors: number;
  comparable: number;
  partiallyComparable: number;
  notComparable: number;
  blocked: number;
  comparableWithoutExclusions: number;
}

export interface SourcePricingNormalization {
  eventId: string;
  eventName: string;
  stage: string;
  generatedAt: string;
  generatedAtSource: 'seeded' | 'event';
  status: SourcePricingNormalizationStatus;
  readinessStatus: SourcePricingNormalizationStatus;
  readinessScore: number;
  requiredInputsComplete: boolean;
  missingInputs: string[];
  requiredArtifacts: string[];
  snapshots: SourcePricingVendorSnapshot[];
  summary: SourcePricingNormalizationSummary;
  comparisonReadiness: SourcePricingNormalizationStatus;
  comparison: SourcePricingComparisonRank[];
  comparableVendors: number;
  notComparableVendors: number;
  traps: SourceCommercialTrap[];
  topCommercialTraps: SourceCommercialTrap[];
  blockers: string[];
  recommendedNextAction: string;
  summaryNarrative: string;
  summaryBlockers: string[];
  rfpSections: string[];
  nexusGuidance: string;
  sentinelEvidenceNotes: string[];
  stewardGateNotes: string[];
  atlasExecutiveImplication: string;
}

export interface SourcePricingNormalizationInput {
  event: {
    id: string;
    name: string;
    currentStageKey: string;
    vendorResponses?: SourcePricingVendorContext[];
    pricingInputs?: SourcePricingVendorInput[];
    dataReadiness?: Array<{
      category: string;
      evidenceUsability: SourceEvidenceUsability;
      readinessState: SourceDataReadinessState;
    }>;
  };
  generatedAt?: string;
}

