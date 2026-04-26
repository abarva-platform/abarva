import type { SourceAgentMission, SourceAgentMissionPriority } from './agent-mission-types';
import type { SourceUserRole } from './agent-context';
import type { SourceCommercialSignals, SourceCommercialVendorTradeoff } from './commercial-signal-types';

export type SourceExecutiveDecisionPosture =
  | 'ready_for_selection_review'
  | 'proceed_to_bafo'
  | 'defer_pending_clarifications'
  | 'blocked_missing_pricing'
  | 'blocked_low_evidence'
  | 'waiver_required';

export type SourceExecutiveRiskLevel = 'low' | 'medium' | 'high';

export type SourceExecutiveEvidenceConfidence = 'high' | 'medium' | 'low';

export interface SourceExecutiveVendorTradeoff {
  vendorId: SourceCommercialVendorTradeoff['vendorId'];
  vendorName: SourceCommercialVendorTradeoff['vendorName'];
  viability: 'viable' | 'conditional' | 'not_viable';
  valuePotential: string;
  costPosition: string;
  pricingRank: number | null;
  pricingStatus: SourceCommercialVendorTradeoff['pricingStatus'];
  bafoReadiness: SourceCommercialVendorTradeoff['bafoReadiness'];
  commercialRisk: SourceExecutiveRiskLevel;
  transitionRisk: SourceExecutiveRiskLevel;
  evidenceConfidence: SourceExecutiveEvidenceConfidence;
  blockers: string[];
  unresolvedAssumptions: string[];
}

export interface SourceExecutiveDecisionValueAtStake {
  amountUsd: number;
  note: string;
}

export interface SourceExecutiveMissionSummary {
  total: number;
  critical: number;
  high: number;
  blocked: number;
  byPriority: Record<SourceAgentMissionPriority, number>;
}

export interface SourceExecutiveDecisionSummary {
  eventId: string;
  generatedAt: string;
  decisionNeeded: string;
  decisionPosture: SourceExecutiveDecisionPosture;
  recommendedDecisionPosture: SourceExecutiveDecisionPosture;
  viableVendors: string[];
  vendorTradeoffs: SourceExecutiveVendorTradeoff[];
  valueAtStake: SourceExecutiveDecisionValueAtStake;
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
  sourceModulesUsed: string[];
  missionSummary: SourceExecutiveMissionSummary;
}

export interface SourceExecutiveDecisionInput {
  event: {
    id: string;
    name: string;
    currentStageKey: string;
    valueAtStakeUsd?: number;
  };
  commercialSignals?: SourceCommercialSignals;
  unifiedMissions?: SourceAgentMission[];
  userRole?: SourceUserRole;
  generatedAt?: string;
}

export interface SourceExecutiveDecisionVendorTradeoffInput {
  commercialSignals: SourceCommercialSignals;
  unifiedMissions: SourceAgentMission[];
}
