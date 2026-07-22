export const MOVES_LEARNING_WRITEBACK_SCHEMA_VERSION = 1;
export const MOVES_LEARNING_RECORD_TYPE = "moves_learning";
export const MOVES_LEARNING_SOURCE_SYSTEM = "moves_learning_ledger";
export const MOVES_LEARNING_CONTEXT_TABLE = "enterprise_context_records";
export const MOVES_LEARNING_FACTS_TABLE = "enterprise_context_facts";
export const MOVES_LEARNING_READINESS_TABLE = "governed_object_readiness";

export type MovesLearningSourceBasis =
  | "approved_evidence"
  | "client_approved_deliverable"
  | "gate_decision";

export type MovesLearningClaimType =
  | "evidence"
  | "deliverable"
  | "gate"
  | "decision"
  | "gap"
  | "value_hypothesis"
  | "operating_model"
  | "system"
  | "process"
  | "risk"
  | "control";

export interface MovesLearningMove {
  readonly id: string;
  readonly tenantKey: string;
  readonly clientId: string | null;
  readonly name: string;
  readonly currentPhase: number | null;
  readonly functionPackKey?: string | null;
  readonly archetype?: string | null;
}

export interface MovesLearningEvidenceInput {
  readonly id: string;
  readonly tenantKey: string;
  readonly clientId: string | null;
  readonly moveId: string;
  readonly phase: number | null;
  readonly evidenceType: string;
  readonly title: string;
  readonly summary: string | null;
  readonly extractedText?: string | null;
  readonly attachmentId?: string | null;
  readonly confidence?: number | string | null;
  readonly reviewDecision: "approved" | "pending" | "rejected" | string | null;
  readonly reviewedAt?: string | null;
  readonly classification?: string | null;
}

export interface MovesLearningDeliverableInput {
  readonly id: string;
  readonly tenantKey: string;
  readonly clientId: string | null;
  readonly moveId: string;
  readonly phase: number | null;
  readonly deliverableTypeKey: string;
  readonly title: string;
  readonly status: string | null;
  readonly signedOffVersion?: number | null;
  readonly signedOffAt?: string | null;
  readonly signedOffBy?: string | null;
  readonly approvedArtifactId?: string | null;
  readonly latestContent?: string | null;
}

export interface MovesLearningGateDecisionInput {
  readonly id: string;
  readonly tenantKey: string;
  readonly clientId: string | null;
  readonly moveId: string;
  readonly phase: number | null;
  readonly title: string;
  readonly status: string | null;
  readonly sourceBasis?: string | null;
  readonly generatedAt?: string | null;
  readonly metadata?: Record<string, unknown> | null;
}

export interface MovesLearningPayload {
  readonly moveId: string;
  readonly moveName: string;
  readonly tenantKey: string;
  readonly phase: number | null;
  readonly sourceBasis: MovesLearningSourceBasis;
  readonly sourceId: string;
  readonly sourceArtifactVersion?: number | null;
  readonly claimType: MovesLearningClaimType;
  readonly title: string;
  readonly summary: string;
  readonly evidenceRefs: readonly string[];
  readonly confidenceLevel: "high" | "medium" | "low";
  readonly functionPackKey?: string | null;
  readonly archetype?: string | null;
  readonly writebackSchemaVersion: number;
}

export interface MovesLearningEnterpriseContextRecordRow {
  readonly client_id: string | null;
  readonly tenant_key: string;
  readonly canonical_record_id: string;
  readonly record_type: typeof MOVES_LEARNING_RECORD_TYPE;
  readonly record_subtype: MovesLearningSourceBasis;
  readonly title: string;
  readonly source_system: typeof MOVES_LEARNING_SOURCE_SYSTEM;
  readonly source_record_id: string;
  readonly source_file: string | null;
  readonly source_sheet: null;
  readonly source_row_number: null;
  readonly last_synced_at: string;
  readonly confidence: number;
  readonly freshness_status: "fresh";
  readonly evidence_pointer: string;
  readonly lifecycle_state: "active";
  readonly payload_hash: string;
  readonly payload: MovesLearningPayload;
}

export interface MovesLearningEnterpriseContextFactDraft {
  readonly canonical_record_id: string;
  readonly client_id: string | null;
  readonly tenant_key: string;
  readonly fact_key: string;
  readonly fact_type: "text";
  readonly fact_value: Record<string, unknown>;
  readonly fact_text: string;
  readonly source_system: typeof MOVES_LEARNING_SOURCE_SYSTEM;
  readonly source_record_id: string;
  readonly source_file: string | null;
  readonly source_sheet: null;
  readonly source_row_number: null;
  readonly last_synced_at: string;
  readonly confidence: number;
  readonly freshness_status: "fresh";
  readonly evidence_pointer: string;
  readonly lifecycle_state: "active";
  readonly value_hash: string;
}

export interface MovesLearningEnterpriseContextFactRow
  extends Omit<MovesLearningEnterpriseContextFactDraft, "canonical_record_id"> {
  readonly record_id: string;
}

export interface MovesLearningReadinessDraft {
  readonly canonical_record_id: string;
  readonly object_table: typeof MOVES_LEARNING_CONTEXT_TABLE;
  readonly object_id: string;
  readonly client_key: string;
  readonly tenant_id: string | null;
  readonly source_layer: "tenant_context";
  readonly agent_readiness_status: "not_reviewed";
  readonly retrievability: "committed_not_indexed";
  readonly classification: "internal";
  readonly source_basis: MovesLearningSourceBasis;
  readonly confidence_level: "high" | "medium" | "low";
  readonly confidence_rationale: string;
  readonly applicable_agents: readonly ["nexus", "tower", "steward"];
  readonly policy_validation_status: "pending";
  readonly provenance: Record<string, unknown>;
  readonly backfill_reason: string;
}

export type MovesLearningReadinessRow = Omit<
  MovesLearningReadinessDraft,
  "canonical_record_id"
>;

export interface MovesLearningWritebackSkip {
  readonly sourceBasis: MovesLearningSourceBasis | "unknown";
  readonly sourceId: string;
  readonly reason:
    | "wrong_tenant"
    | "not_approved"
    | "restricted"
    | "missing_summary"
    | "not_signed_off"
    | "not_gate_decision";
}

export interface MovesLearningWritebackPlan {
  readonly records: readonly MovesLearningEnterpriseContextRecordRow[];
  readonly factDrafts: readonly MovesLearningEnterpriseContextFactDraft[];
  readonly readinessDrafts: readonly MovesLearningReadinessDraft[];
  readonly skipped: readonly MovesLearningWritebackSkip[];
}

export type MovesLearningWritebackResult =
  | {
      readonly status: "skipped";
      readonly reason: "no_eligible_learning";
      readonly skipped: readonly MovesLearningWritebackSkip[];
    }
  | {
      readonly status: "written";
      readonly recordsWritten: number;
      readonly factsWritten: number;
      readonly readinessRowsWritten: number;
      readonly skipped: readonly MovesLearningWritebackSkip[];
    }
  | { readonly status: "failed"; readonly detail: string };
