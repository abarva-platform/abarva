export type KnowledgeModuleKey =
  | "home"
  | "intelligence"
  | "moves"
  | "source"
  | "tower";

export type ContextPackMode = "active" | "candidate_preview" | "synthetic_fixture";

export type ContextPackPurpose =
  | "executive_orientation"
  | "answer_context"
  | "evidence_extract"
  | "phase_readiness"
  | "sourcing_context"
  | "measurement_context"
  | "strategy_context";

export type RequestedKnowledgeDomain =
  | "enterprise_profile"
  | "functions"
  | "applications_systems"
  | "data_domains"
  | "infrastructure"
  | "vendors_contracts"
  | "programs"
  | "risks_controls"
  | "metrics_outcomes"
  | "use_cases"
  | "processes"
  | "relationships"
  | "evidence";

export interface ModuleContextScope {
  moveId?: string;
  phase?: "P0" | "P1" | "P2" | "P3" | "P4" | "P5";
  sourceEventId?: string;
  useCase?: string;
  question?: string;
  portfolioScope?: string;
  requiredEvidenceFamilies?: string[];
}

export interface ModuleContextRequest {
  tenantKey: string;
  moduleKey: KnowledgeModuleKey;
  purpose: ContextPackPurpose;
  mode?: ContextPackMode;
  requestedDomains: RequestedKnowledgeDomain[];
  scope?: ModuleContextScope;
  evidencePolicy: "strict" | "lineage_required" | "best_available";
  relationshipPolicy:
    | "none"
    | "validated_only"
    | "candidate_edges"
    | "validated_and_candidate";
  actorKey?: string;
  activeTenantAccessVersionId?: string;
  candidateVersionId?: string;
}
