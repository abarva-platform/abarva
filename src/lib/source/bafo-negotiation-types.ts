import type { SourceDataReadinessState, SourceEvidenceUsability } from './types';
import type { SourceVendorResponseSeedInput } from './vendor-response-types';
import type { SourcePricingVendorInput, SourcePricingVendorSnapshot } from './pricing-normalization-types';
import type {
  BafoCounterClause,
  BafoProjectedCallVolume,
} from './sourcing/bafo-counter-templates';
import type { VendorInferenceEconomics } from './vendor-inference-economics';

export type SourceBafoNegotiationReadiness = 'ready' | 'partially_ready' | 'not_ready' | 'blocked';

export type SourceVendorBafoReadiness = 'ready' | 'conditional' | 'not_comparable' | 'blocked';

export type SourceBafoQuestionPriority = 'high' | 'medium' | 'low';

export type SourceBafoQuestionCategory =
  | 'pricing'
  | 'scope'
  | 'evidence'
  | 'governance'
  | 'transition'
  | 'exclusion';

export interface SourceBafoNegotiationQuestion {
  question: string;
  reason: string;
  priority: SourceBafoQuestionPriority;
  category: SourceBafoQuestionCategory;
}

export interface SourceBafoVendorNegotiationPlan {
  vendorId: string;
  vendorName: string;
  readiness: SourceVendorBafoReadiness;
  keyIssues: string[];
  negotiationQuestions: SourceBafoNegotiationQuestion[];
  requiredClarifications: string[];
  recommendedAsks: string[];
  expectedValueImpact: string;
  riskNotes: string[];
  evidenceStatus: SourceDataReadinessState | SourceEvidenceUsability;
  blockers: string[];
  counterClauses: BafoCounterClause[];
}

export interface SourceBafoCommercialTrapSummary {
  category: string;
  count: number;
  severity: 'low' | 'medium' | 'high';
  samples: string[];
}

export interface SourceBafoNegotiationPlan {
  eventId: string;
  eventName: string;
  stage: string;
  generatedAt: string;
  overallNegotiationReadiness: SourceBafoNegotiationReadiness;
  vendorNegotiationPlans: SourceBafoVendorNegotiationPlan[];
  assumptionLockList: string[];
  excludedScopeList: string[];
  commercialTrapSummary: SourceBafoCommercialTrapSummary[];
  recommendedBafoPriorities: string[];
  executiveTradeoffSummary: string;
  nexusGuidance: string;
  sentinelEvidenceNotes: string[];
  stewardGateNotes: string[];
  atlasExecutiveImplication: string;
  blockers: string[];
  nextAction: string;
  counterClauses: BafoCounterClause[];
}

export interface SourceBafoVendorInferencePricingInput {
  vendorId: string;
  vendorName: string;
  inferenceEconomics: VendorInferenceEconomics | null;
  projectedCallRamp: BafoProjectedCallVolume[];
}

export interface SourceBafoNegotiationInput {
  event: {
    id: string;
    name: string;
    currentStageKey: string;
    vendorResponses?: SourceVendorResponseSeedInput[];
    dataReadiness?: Array<{
      category: string;
      readinessState?: SourceDataReadinessState;
      evidenceUsability?: SourceEvidenceUsability;
    }>;
    pricingNormalizationSnapshots?: SourcePricingVendorSnapshot[];
    pricingInputs?: SourcePricingVendorInput[];
    vendorInferencePricing?: SourceBafoVendorInferencePricingInput[];
  };
  generatedAt?: string;
}
