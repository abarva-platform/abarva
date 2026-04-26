import type { SourceCommercialSignals } from './commercial-signal-types';
import type { SourceExecutiveDecisionSummary } from './executive-decision-types';
import type { SourceStageGateReadiness } from './source-stage-gate-types';
import type { SourceArtifactStatusStripSeedItem } from './mock-seed';
import type { SourceStageKey } from './types';

export type SourceVendorSelectionReadinessStatus =
  | 'ready_for_selection_review'
  | 'proceed_to_bafo'
  | 'defer_pending_clarifications'
  | 'blocked_missing_pricing'
  | 'blocked_low_evidence'
  | 'blocked_gate_not_ready'
  | 'waiver_required';

export type SourceSelectionReadinessPosture = SourceVendorSelectionReadinessStatus;

export interface SourceVendorSelectionReadinessInput {
  event: {
    id: string;
    name: string;
    currentStageKey: SourceStageKey;
    currentStageLabel: string;
    valueAtStakeUsd?: number;
  };
  generatedAt?: string;
  commercialSignals?: SourceCommercialSignals;
  executiveDecisionSummary?: SourceExecutiveDecisionSummary;
  stageGateReadiness?: SourceStageGateReadiness;
  artifactStatus?: SourceArtifactStatusStripSeedItem[];
  commercialSignalsInput?: {
    event: {
      id: string;
      name: string;
      currentStageKey: SourceStageKey;
    };
    vendorIds?: string[];
    generatedAt?: string;
  };
}

export interface SourceVendorSelectionReadiness {
  eventId: string;
  eventName: string;
  generatedAt: string;
  readinessStatus: SourceVendorSelectionReadinessStatus;
  selectionPosture: SourceSelectionReadinessPosture;
  selectionReviewReady: boolean;
  viableVendors: string[];
  blockedVendors: string[];
  unresolvedCommercialIssues: string[];
  unresolvedEvidenceIssues: string[];
  unresolvedGateIssues: string[];
  requiredArtifacts: string[];
  requiredApprovals: string[];
  requiredApprovalsForSelection: string[];
  recommendedNextAction: string;
  nexusRecommendation: string;
  sentinelCautions: string[];
  stewardGateNotes: string[];
  atlasExecutiveImplication: string;
  sourceModulesUsed: string[];
  rationale: string;
}
