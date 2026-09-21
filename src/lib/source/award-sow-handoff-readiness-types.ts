import type { SourceArtifactStatus, SourceStageKey } from "./types";
import type { SourceVendorSelectionReadiness } from "./vendor-selection-readiness-types";

export type SourceAwardSowHandoffCheckpointKey =
  | "candidate_selection"
  | "approval_readiness"
  | "contract_formation_package"
  | "executed_agreement_sow"
  | "contract360_handoff";

export type SourceAwardSowHandoffCheckpointStatus =
  | "completed"
  | "ready"
  | "blocked"
  | "not_open";

export type SourceAwardSowHandoffReadinessStatus =
  | "ready_for_contract360_handoff"
  | "blocked_candidate_selection"
  | "blocked_approval_readiness"
  | "blocked_contract_formation_package"
  | "blocked_executed_agreement_sow"
  | "blocked_contract360_handoff";

export type SourceContractFormationState =
  | "draft"
  | "contract_ready"
  | "pending_signature"
  | "executed";

export type SourceContractFormationComponent =
  | "reviewed_selection_memo"
  | "approved_pricing"
  | "governed_clause_library"
  | "sow_scope"
  | "named_approval_authority"
  | "evidence_lineage"
  | "executed_signature_authority";

export interface SourceAwardSowArtifactInput {
  id: string;
  title: string;
  status: SourceArtifactStatus;
  summary?: string;
  sourceCount?: number;
}

export interface SourceAwardSowStageInput {
  key: SourceStageKey;
  label: string;
  status: string;
  gate?: {
    status: string;
    requiredArtifacts?: readonly string[];
    blocker?: string | null;
  };
}

export interface SourceAwardSowHandoffReadinessInput {
  event: {
    id: string;
    name: string;
    currentStageKey: SourceStageKey;
    currentStageLabel: string;
    stages: readonly SourceAwardSowStageInput[];
    artifacts: readonly SourceAwardSowArtifactInput[];
  };
  selectionReadiness?: SourceVendorSelectionReadiness;
  generatedAt?: string;
}

export interface SourceAwardSowHandoffCheckpoint {
  key: SourceAwardSowHandoffCheckpointKey;
  label: string;
  status: SourceAwardSowHandoffCheckpointStatus;
  completedEvidence: string[];
  blockers: string[];
}

export interface SourceContractFormationPackageReadiness {
  state: SourceContractFormationState;
  includedComponents: SourceContractFormationComponent[];
  missingComponents: SourceContractFormationComponent[];
  evidence: string[];
}

export interface SourceAwardSowHandoffReadiness {
  eventId: string;
  eventName: string;
  generatedAt: string;
  readinessStatus: SourceAwardSowHandoffReadinessStatus;
  contractFormationState: SourceContractFormationState;
  contractFormationPackage: SourceContractFormationPackageReadiness;
  readyForContract360Handoff: boolean;
  checkpoints: SourceAwardSowHandoffCheckpoint[];
  completedEvidence: string[];
  blockers: string[];
  recommendedNextAction: string;
  authority: "source-award-sow-handoff-readiness";
  sourceModulesUsed: string[];
  rationale: string;
}
