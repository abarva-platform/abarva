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
  | "sla_service_level_provenance"
  | "exit_rights_provenance"
  | "change_control_provenance"
  | "named_approval_authority"
  | "evidence_lineage"
  | "executed_signature_authority";

export type SourceContract360PublicationPlannerState =
  | "blocked_contract_formation_package"
  | "blocked_no_accepted_executed_evidence"
  | "blocked_stage_not_transition"
  | "ready_for_publication_review";

export type SourceContract360PublicationTarget =
  "canonical_contract_and_contract360";

export type SourceContract360BlockedWrite =
  | "canonical_contract_row"
  | "contract360_projection_row"
  | "supplier_notification";

export type SourceCanonicalContractProjectionState =
  | "blocked_contract_formation_package"
  | "blocked_no_accepted_executed_evidence"
  | "blocked_stage_not_transition"
  | "ready_for_identity_review";

export type SourceCanonicalContractProjectionBlockedWrite =
  | "canonical_contract_identity"
  | "contract360_projection_row"
  | "optimize_case";

export type SourceOptimizePathState =
  | "blocked_canonical_contract_identity"
  | "ready_for_optimize_review";

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

export interface SourceContract360PublicationPlanner {
  state: SourceContract360PublicationPlannerState;
  target: SourceContract360PublicationTarget;
  publicationAllowed: false;
  acceptedExecutedEvidence: string[];
  plannedReviewSteps: string[];
  blockedWrites: SourceContract360BlockedWrite[];
  blockers: string[];
}

export interface SourceCanonicalContractProjectionPlan {
  state: SourceCanonicalContractProjectionState;
  candidateIdentityKey: string | null;
  identityBasis: string[];
  evidence: string[];
  reviewSteps: string[];
  writeAllowed: false;
  blockedWrites: SourceCanonicalContractProjectionBlockedWrite[];
  blockers: string[];
}

export interface SourceOptimizePathPlan {
  state: SourceOptimizePathState;
  route: "/source/optimize";
  prefillContractId: null;
  launchAllowed: false;
  evidence: string[];
  reviewSteps: string[];
  blockers: string[];
}

export interface SourceAwardSowHandoffReadiness {
  eventId: string;
  eventName: string;
  generatedAt: string;
  readinessStatus: SourceAwardSowHandoffReadinessStatus;
  contractFormationState: SourceContractFormationState;
  contractFormationPackage: SourceContractFormationPackageReadiness;
  publicationPlanner: SourceContract360PublicationPlanner;
  canonicalContractProjection: SourceCanonicalContractProjectionPlan;
  optimizePath: SourceOptimizePathPlan;
  readyForContract360Handoff: boolean;
  checkpoints: SourceAwardSowHandoffCheckpoint[];
  completedEvidence: string[];
  blockers: string[];
  recommendedNextAction: string;
  authority: "source-award-sow-handoff-readiness";
  sourceModulesUsed: string[];
  rationale: string;
}
