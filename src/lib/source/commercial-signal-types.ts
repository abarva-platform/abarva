import type { CommercialRiskSeverity } from './commercial-risk-detection';
import type { SourceBafoNegotiationReadiness, SourceVendorBafoReadiness } from './bafo-negotiation-types';
import type { SourcePricingNormalizationStatus } from './pricing-normalization-types';

export type SourceCommercialReadiness = 'ready' | 'partially_ready' | 'blocked';

export interface SourceCommercialPricingSignals {
  status: SourcePricingNormalizationStatus;
  readinessScore: number;
  comparableVendors: number;
  notComparableVendors: number;
  topTraps: string[];
  blockers: string[];
  narrative: string;
}

export interface SourceCommercialBafoSignals {
  overallReadiness: SourceBafoNegotiationReadiness;
  vendorReadyCount: number;
  vendorConditionalCount: number;
  vendorBlockedCount: number;
  priorities: string[];
  blockers: string[];
  nextAction: string;
}

export interface SourceCommercialRiskSignals {
  overallRiskLevel: CommercialRiskSeverity;
  totalCount: number;
  criticalCount: number;
  highCount: number;
  openExceptionTitles: string[];
}

export interface SourceCommercialVendorTradeoff {
  vendorId: string;
  vendorName: string;
  pricingRank: number | null;
  pricingStatus: SourcePricingNormalizationStatus | 'unknown';
  bafoReadiness: SourceVendorBafoReadiness | 'unknown';
  riskLevel: CommercialRiskSeverity | 'low';
  blockers: string[];
}

export interface SourceCommercialExecutiveImplications {
  nexusGuidance: string;
  atlasExecutiveImplication: string;
  sentinelEvidenceNotes: string[];
  stewardGateNotes: string[];
}

export interface SourceCommercialSignalsInput {
  event: {
    id: string;
    name: string;
    currentStageKey: string;
    vendorIds?: string[];
  };
  generatedAt?: string;
}

export interface SourceCommercialSignals {
  eventId: string;
  generatedAt: string;
  pricingSignals: SourceCommercialPricingSignals;
  bafoSignals: SourceCommercialBafoSignals;
  riskSignals: SourceCommercialRiskSignals;
  vendorTradeoffs: SourceCommercialVendorTradeoff[];
  commercialReadiness: SourceCommercialReadiness;
  executiveImplications: SourceCommercialExecutiveImplications;
  blockers: string[];
  recommendedNextAction: string;
  sourceModulesUsed: string[];
}
