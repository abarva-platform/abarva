import type { SourceDataReadinessState, SourceEvidenceUsability } from './types';

export type SourceVendorResponseStatus = 'not_started' | 'in_progress' | 'submitted' | 'blocked' | 'rejected';

export type SourceVendorTemplateStatus =
  | 'not_started'
  | 'incomplete'
  | 'complete'
  | 'not_applicable'
  | 'missing';

export type SourceVendorSectionStatus =
  | 'present'
  | 'weak'
  | 'missing'
  | 'not_required';

export type SourceVendorCompletenessStatus =
  | 'complete'
  | 'partially_complete'
  | 'incomplete'
  | 'not_comparable'
  | 'blocked';

export type SourceVendorComparabilityStatus = 'comparable' | 'partially_comparable' | 'not_comparable' | 'blocked';

export interface SourceVendorResponseSeedInput {
  vendorId: string;
  vendorName: string;
  responseStatus: SourceVendorResponseStatus;
  receivedAt: string | null;
  requiredSections: string[];
  submittedSections: string[];
  assumptions: string[];
  exclusions: string[];
  pricingTemplateStatus: SourceVendorTemplateStatus;
  transitionPlanStatus: SourceVendorTemplateStatus;
  securityResponseStatus: SourceVendorTemplateStatus;
  automationRoadmapStatus: SourceVendorTemplateStatus;
  evidenceStatus: SourceDataReadinessState;
  evidenceUsability: SourceEvidenceUsability;
  responseRiskLevel: 'low' | 'medium' | 'high';
}

export interface SourceVendorResponseCompletenessRecord {
  vendorId: string;
  vendorName: string;
  responseStatus: SourceVendorResponseStatus;
  receivedAt: string | null;
  requiredSections: string[];
  submittedSections: string[];
  missingSections: string[];
  assumptions: string[];
  exclusions: string[];
  pricingTemplateStatus: SourceVendorTemplateStatus;
  transitionPlanStatus: SourceVendorTemplateStatus;
  securityResponseStatus: SourceVendorTemplateStatus;
  automationRoadmapStatus: SourceVendorTemplateStatus;
  evidenceStatus: SourceDataReadinessState;
  comparabilityStatus: SourceVendorComparabilityStatus;
  blockers: string[];
  completenessStatus: SourceVendorCompletenessStatus;
  rationale: string[];
  recommendedNextAction: string;
  nexusGuidance: string;
  sentinelEvidenceNotes: string[];
  stewardGateNotes: string[];
  atlasExecutiveImplication: string;
}

export interface SourceVendorResponseCompletenessSummary {
  totalVendors: number;
  complete: number;
  partiallyComplete: number;
  incomplete: number;
  notComparable: number;
  blocked: number;
}

export interface SourceVendorResponseCompleteness {
  eventId: string;
  eventName: string;
  generatedAt: string;
  stage: string;
  records: SourceVendorResponseCompletenessRecord[];
  summary: SourceVendorResponseCompletenessSummary;
  comparabilityReadiness: SourceVendorCompletenessStatus;
  blockers: string[];
  recommendedNextAction: string;
}

export interface SourceVendorResponseCompletenessInput {
  event: {
    id: string;
    name: string;
    currentStageKey: string;
    vendorResponses?: SourceVendorResponseSeedInput[];
    dataReadiness?: ReadonlyArray<{
      category: string;
      evidenceUsability: SourceEvidenceUsability;
      readinessState: SourceDataReadinessState;
    }>;
  };
  generatedAt?: string;
}

export interface SourceVendorResponseSeed {
  eventId: string;
  responses: SourceVendorResponseSeedInput[];
}
