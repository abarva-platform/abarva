import type { CanonicalFact, FactValue } from "./canonical-fact";
import type { ContextGap } from "./context-gap";
import type { EntityProfile } from "./entity-profile";
import type { EvidenceRef, KnowledgeTruthStatus } from "./evidence-ref";
import type { ModuleContextRequest } from "./module-context-request";
import type { RelationshipEdge } from "./relationship-edge";

export interface ContextConfidenceSummary {
  breadth: number;
  depth: number;
  relationshipCoverage: number;
  evidenceCoverage: number;
  answerability: number;
  overall: "strong" | "good" | "limited" | "blocked";
  rationale: string;
}

export interface ContextAssemblyTrace {
  assemblerVersion: string;
  generatedAt: string;
  inputSources: string[];
  includedEntityIds: string[];
  excludedEntityIds: string[];
  includedEvidenceIds: string[];
  excludedEvidenceIds: string[];
  ruleHits: string[];
}

export interface CandidateTruthBoundary {
  activeTenantContextDefault: true;
  candidatePreviewExplicitlyRequested: boolean;
  candidateContextIncluded: boolean;
  sourceAdapterRowsActive: false;
  activeTenantAccessUpdated: false;
  productionTenantDataWritten: false;
  candidatePromoted: false;
  moduleRuntimeBehaviorChanged: false;
}

export interface UnsupportedClaim {
  claimId: string;
  description: string;
  reason:
    | "missing_evidence"
    | "candidate_only"
    | "requires_measured_value"
    | "requires_relationship_validation"
    | "outside_module_scope";
}

export interface ClaudeReadyContextPayload {
  systemInstruction: string;
  contextSummary: string;
  evidenceRefs: string[];
  mustCiteEvidence: true;
  mustMarkInference: true;
  unsupportedClaims: string[];
  excludesAuditOnlyDiagnostics: true;
  excludesInactiveCandidateContextUnlessRequested: true;
  excludesSourceAdapterOnlyFactsUnlessRequested: true;
}

export interface ContextPack {
  contextPackId: string;
  tenantKey: string;
  moduleKey: ModuleContextRequest["moduleKey"];
  purpose: ModuleContextRequest["purpose"];
  mode: NonNullable<ModuleContextRequest["mode"]>;
  truthStatus: KnowledgeTruthStatus;
  executiveSummary: string;
  relevantEntityProfiles: EntityProfile[];
  facts: CanonicalFact[];
  relationships: RelationshipEdge[];
  relationshipCandidates: RelationshipEdge[];
  metrics: CanonicalFact[];
  risks: EntityProfile[];
  evidence: EvidenceRef[];
  gaps: ContextGap[];
  confidenceSummary: ContextConfidenceSummary;
  caveats: string[];
  excludedCandidateOnlyContext: EntityProfile[];
  unsupportedClaims: UnsupportedClaim[];
  recommendedNextEvidence: string[];
  assemblyTrace: ContextAssemblyTrace;
  truthBoundary: CandidateTruthBoundary;
  claudeReadyContextPayload: ClaudeReadyContextPayload;
}

export interface HomeKnowledgePack extends ContextPack {
  moduleKey: "home";
  supportsDoubleClickProfiles: true;
}

export interface IntelligenceContextPack extends ContextPack {
  moduleKey: "intelligence";
  boardQualityContextRequired: true;
}

export interface MovesContextPack extends ContextPack {
  moduleKey: "moves";
  phase:
    | "P0 Intake & Decision Framing"
    | "P1 Charter & Baseline"
    | "P2 Diagnose & Evidence Pressure-Test"
    | "P3 Options & Business Case"
    | "P4 Executive Decision & Commit"
    | "P5 Execution Handoff";
}

export interface SourceContextPack extends ContextPack {
  moduleKey: "source";
  sourcingScopeIncluded: true;
}

export type TowerV3SourceDimensionKey =
  | "08_spend_value"
  | "09_programs_initiatives"
  | "11_risks_controls"
  | "14_metrics_outcomes"
  | "17_service_scope_managed_services"
  | "18_operational_process_evidence";

export interface TowerV3SourceDimensionMapping {
  dimensionKey: TowerV3SourceDimensionKey;
  label: string;
  mappedDomains: CanonicalFact["domain"][];
  towerUse:
    | "budget_value"
    | "portfolio_initiative"
    | "risk_control"
    | "metric_outcome"
    | "service_scope"
    | "operational_evidence";
  recordCount: number;
  evidenceCount: number;
}

export type TowerProjectionPath = "path_a_derived_projection";
export type TowerProjectionStatus =
  | "v3_context_pack_ready"
  | "bridge_only"
  | "not_v3_reconciled";

export interface TowerProjectionLineage {
  lineageId: string;
  sourceDimension: TowerV3SourceDimensionKey;
  sourceFactIds: string[];
  evidenceIds: string[];
  projectionStatus: TowerProjectionStatus;
  notes: string[];
}

export interface TowerMetricRecord {
  metricId: string;
  label: string;
  value: FactValue;
  valueType: CanonicalFact["valueType"];
  sourceDimension: TowerV3SourceDimensionKey;
  evidenceIds: string[];
  projectionStatus: TowerProjectionStatus;
  safeToDisplay: boolean;
}

export interface TowerValueRecord {
  valueRecordId: string;
  label: string;
  value: FactValue;
  valueType: CanonicalFact["valueType"];
  sourceDimension: TowerV3SourceDimensionKey;
  evidenceIds: string[];
  claimBasis:
    | "budget"
    | "baseline"
    | "forecast"
    | "business_case"
    | "measured_actual"
    | "measurement_plan";
  projectionStatus: TowerProjectionStatus;
  safeToDisplay: boolean;
}

export type TowerValueClaimKind =
  | "value_hypothesis"
  | "planned_value"
  | "promised_value"
  | "measured_value"
  | "realized_value";

export type TowerValueClaimGateStatus = "allowed" | "caveated" | "blocked";

export interface TowerValueClaim {
  claimId: string;
  claimKind: TowerValueClaimKind;
  label: string;
  value: FactValue;
  valueType: CanonicalFact["valueType"];
  sourceFactIds: string[];
  evidenceIds: string[];
  gateStatus: TowerValueClaimGateStatus;
  realizedValueLanguageAllowed: boolean;
  reason: string;
  requiredEvidence: string[];
}

export interface TowerContextPack extends ContextPack {
  moduleKey: "tower";
  realizedValueRequiresMeasuredEvidence: true;
  sourceOfTruthPath: "v3_enterprise_context_layer";
  projectionPath: TowerProjectionPath;
  projectionStatus: TowerProjectionStatus;
  v3SourceDimensions: TowerV3SourceDimensionMapping[];
  derivedProjectionLineage: TowerProjectionLineage[];
  towerMetricRecords: TowerMetricRecord[];
  towerValueRecords: TowerValueRecord[];
  towerValueClaims: TowerValueClaim[];
  blockedValueClaims: TowerValueClaim[];
  towerTruthCaveats: string[];
}
