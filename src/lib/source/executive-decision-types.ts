import type { SourceEvidenceUsability, SourcingEventDetail } from './types';
import type { SourcePricingVendorInput, SourcePricingVendorSnapshot } from './pricing-normalization-types';
import type { SourceVendorResponseSeedInput } from './vendor-response-types';

export type SourceExecutiveDecisionPosture =
  | 'ready_for_selection_review'
  | 'proceed_to_bafo'
  | 'defer_pending_clarifications'
  | 'blocked_missing_pricing'
  | 'blocked_low_evidence'
  | 'waiver_required';

export type SourceExecutiveVendorViability = 'viable' | 'conditional' | 'not_viable';

export type SourceExecutiveRiskLevel = 'low' | 'medium' | 'high';

export type SourceExecutiveEvidenceConfidence = 'high' | 'medium' | 'low';

export interface SourceExecutiveVendorTradeoff {
  vendorId: string;
  vendorName: string;
  viability: SourceExecutiveVendorViability;
  valuePotential: string;
  costPosition: string;
  commercialRisk: SourceExecutiveRiskLevel;
  transitionRisk: SourceExecutiveRiskLevel;
  evidenceConfidence: SourceExecutiveEvidenceConfidence;
  evidenceUsability: SourceEvidenceUsability;
  keyStrengths: string[];
  keyConcerns: string[];
  blockers: string[];
  requiredResolutions: string[];
}

export interface SourceExecutiveDecisionSummary {
  eventId: string;
  generatedAt: string;
  decisionNeeded: string;
  recommendedDecisionPosture: SourceExecutiveDecisionPosture;
  viableVendors: string[];
  vendorTradeoffs: SourceExecutiveVendorTradeoff[];
  valueAtStake: {
    amountUsd: number;
    note: string;
  };
  commercialRisk: SourceExecutiveRiskLevel;
  transitionRisk: SourceExecutiveRiskLevel;
  evidenceConfidence: SourceExecutiveEvidenceConfidence;
  unresolvedAssumptions: string[];
  blockers: string[];
  decisionOptions: string[];
  recommendedNextAction: string;
  nexusRecommendation: string;
  sentinelCautions: string[];
  stewardGateNotes: string[];
  atlasExecutiveBrief: string;
}

export interface SourceExecutiveDecisionInput {
  event: Pick<SourcingEventDetail, 'id' | 'name' | 'currentStageKey' | 'valueAtStakeUsd'> & {
    vendorResponses?: SourceVendorResponseSeedInput[];
    dataReadiness?: SourcingEventDetail['dataReadiness'];
    pricingInputs?: SourcePricingVendorInput[];
    pricingNormalizationSnapshots?: SourcePricingVendorSnapshot[];
  };
  generatedAt?: string;
}
