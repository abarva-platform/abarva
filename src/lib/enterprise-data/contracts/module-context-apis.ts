export interface TenantContextRequest {
  tenantKey: string;
  tenantDataVersion?: string;
  actorKey?: string;
}

export interface EvidenceBoundary {
  evidenceKeys: string[];
  excludedEvidenceKeys: string[];
  staleEvidenceKeys: string[];
  unsupportedClaimRisk: "low" | "medium" | "high";
}

export interface ModuleContextPacket {
  tenantKey: string;
  tenantDataVersion: string;
  generatedAt: string;
  evidenceBoundary: EvidenceBoundary;
  facts: unknown[];
  relationships: unknown[];
  derivedInsights: unknown[];
  moduleMemory: unknown[];
}

export type ModuleContextModuleKey =
  | "home"
  | "intelligence"
  | "moves"
  | "source"
  | "tower";

export type ModuleContextMode = "active" | "candidate_preview";

export type ModuleContextSourceMode =
  | "active_tenant_access"
  | "inactive_candidate_read_model"
  | "active_not_available";

export type ModuleContextPurpose =
  | "context_summary"
  | "evidence_extract"
  | "readiness_preview"
  | "answer_context"
  | "handoff_context";

export type ModuleContextRequestedDomain =
  | "functions"
  | "applications_systems"
  | "vendors_contracts"
  | "data_assets_integrations"
  | "programs_priorities"
  | "ai_automation_use_cases"
  | "operational_process_evidence"
  | "org_ownership"
  | "workforce_roles"
  | "infrastructure_platforms"
  | "risks_controls"
  | "metrics_outcomes"
  | "enterprise_profile"
  | "relationships"
  | "evidence_sources";

export type ModuleContextClassification =
  | "agent_ready"
  | "needs_review"
  | "not_ready"
  | "candidate_only"
  | "restricted"
  | "missing_evidence"
  | "relationship_not_validated";

export type ModuleContextCitationStatus =
  | "citable"
  | "not_citable"
  | "needs_review";

export interface ModuleContextScope {
  moveId?: string;
  phase?: string;
  targetPhase?: string;
  useCase?: string;
  charter?: string;
  evidenceFamilies?: string[];
  sourceEventId?: string;
  stage?: string;
  portfolioScope?: string;
  question?: string;
  [key: string]: unknown;
}

export type ModuleContextEvidencePolicy =
  | "strict"
  | "lineage_required"
  | "best_available";

export type ModuleContextRelationshipPolicy =
  | "none"
  | "candidates"
  | "validated_only"
  | "validated_and_candidates";

export interface ModuleContextReadRequest {
  tenantKey: string;
  moduleKey: ModuleContextModuleKey;
  purpose: ModuleContextPurpose;
  mode?: ModuleContextMode;
  scope?: ModuleContextScope;
  requestedDomains?: ModuleContextRequestedDomain[];
  evidencePolicy?: ModuleContextEvidencePolicy;
  relationshipPolicy?: ModuleContextRelationshipPolicy;
  actorKey?: string;
  candidateVersionId?: string;
  activeTenantAccessVersionId?: string;
}

export interface ModuleContextDomainSummary {
  domain: ModuleContextRequestedDomain;
  canonicalDomain: string;
  sourceRows: number;
  acceptedRecords: number;
  skippedRows: number;
  duplicateNames: number;
  readiness: ModuleContextClassification;
}

export interface ModuleContextRecord {
  recordId: string;
  domain: ModuleContextRequestedDomain;
  canonicalDomain: string;
  objectType: string;
  title: string;
  summary: string;
  fields: Record<string, string | number | boolean>;
  sourceEvidenceIds: string[];
  citationStatus: ModuleContextCitationStatus;
  agentReadiness: ModuleContextClassification;
  relationshipReadiness: ModuleContextClassification;
  restricted: boolean;
  confidence: number;
}

export interface ModuleContextEvidenceRef {
  evidenceId: string;
  sourcePath?: string;
  sourceFingerprint?: string;
  rowCount?: number;
  domain?: ModuleContextRequestedDomain;
  citationStatus: ModuleContextCitationStatus;
}

export interface ModuleContextRelationship {
  relationshipId: string;
  sourceRecordId?: string;
  targetRecordId?: string;
  relationshipType: string;
  readiness: ModuleContextClassification;
  evidenceIds: string[];
}

export interface ModuleContextGap {
  gapId: string;
  domain?: ModuleContextRequestedDomain;
  severity: "info" | "warning" | "blocker";
  description: string;
  source?: string;
}

export interface ModuleContextLineage {
  sourceBuildId?: string;
  sourceBuildFingerprint?: string;
  inputFingerprint?: string;
  activeAccessRecordPath?: string;
  candidateReportSource?: string;
  sourceSnapshotIds: string[];
}

export interface ModuleContextReadiness {
  status: ModuleContextClassification;
  evidenceReady: boolean;
  relationshipReady: boolean;
  profileReady: boolean;
  caveats: string[];
  canAnswer: string[];
  mustNotClaim: string[];
}

export interface ModuleContextGuardrails {
  activeByDefault: true;
  requestedMode: ModuleContextMode;
  resolvedMode: ModuleContextMode;
  candidatePreviewRequiresExplicitMode: true;
  candidatePreviewExplicitlyRequested: boolean;
  defaultModuleReadsCandidateData: false;
  candidateDataConsumed: boolean;
  activeTenantAccessLayerUpdated: false;
  productionTenantDataWritten: false;
  candidatePromoted: false;
  moduleRuntimeConsumptionChanged: false;
  moveRuntimeModified: false;
  moveEvidenceCreated: false;
  sourceRuntimeModified: false;
  towerRuntimeModified: false;
  intelligenceRuntimeModified: false;
  homeReadsCandidateByDefault: false;
}

export type ModuleContextCompletenessOverall =
  | "Strong"
  | "Good"
  | "Limited"
  | "Blocked";

export interface ModuleContextCompleteness {
  breadth: number;
  depth: number;
  relationshipCoverage: number;
  evidenceCoverage: number;
  answerability: number;
  overall: ModuleContextCompletenessOverall;
}

export interface ModuleContextExplanation {
  tenantKey: string;
  moduleKey: ModuleContextModuleKey;
  purpose: ModuleContextPurpose;
  mode: ModuleContextMode;
  sourceMode: ModuleContextSourceMode;
  generatedAt: string;
  summary: string;
  strengths: string[];
  limitations: string[];
  supportedQuestions: string[];
  unsupportedQuestions: string[];
  nextActions: string[];
  contextCompleteness: ModuleContextCompleteness;
  guardrails: ModuleContextGuardrails;
}

export interface ServedModuleContextPacket extends ModuleContextPacket {
  moduleKey: ModuleContextModuleKey;
  purpose: ModuleContextPurpose;
  mode: ModuleContextMode;
  sourceMode: ModuleContextSourceMode;
  activeTenantAccessVersionId: string | null;
  candidateVersionId: string | null;
  domains: ModuleContextDomainSummary[];
  records: ModuleContextRecord[];
  evidenceRefs: ModuleContextEvidenceRef[];
  validatedRelationships: ModuleContextRelationship[];
  relationshipCandidates: ModuleContextRelationship[];
  gaps: ModuleContextGap[];
  caveats: string[];
  lineage: ModuleContextLineage;
  readiness: ModuleContextReadiness;
  guardrails: ModuleContextGuardrails;
  contextCompleteness: ModuleContextCompleteness;
}

export interface MoveContextRequest extends TenantContextRequest {
  moveId: string;
  phase?: string;
}

export interface SourceContextRequest extends TenantContextRequest {
  sourceEventId: string;
  stage?: string;
}

export interface TowerContextRequest extends TenantContextRequest {
  scopeKey?: string;
}

export interface ClaimValidationRequest extends TenantContextRequest {
  claim: string;
  evidenceKeys: string[];
}

export interface ClaimValidationResult {
  status: "supported" | "unsupported" | "assumption_required" | "blocked";
  supportingEvidenceKeys: string[];
  blockedReason?: string;
}

export interface ModuleContextApis {
  getModuleContext(
    request: ModuleContextReadRequest,
  ): Promise<ServedModuleContextPacket>;
  explainModuleContext(
    request: ModuleContextReadRequest,
  ): Promise<ModuleContextExplanation>;
  getHomeContext(request: TenantContextRequest): Promise<ModuleContextPacket>;
  getIntelligenceContext(
    request: TenantContextRequest & { question?: string },
  ): Promise<ModuleContextPacket>;
  getMoveContext(request: MoveContextRequest): Promise<ModuleContextPacket>;
  getSourceContext(request: SourceContextRequest): Promise<ModuleContextPacket>;
  getTowerContext(request: TowerContextRequest): Promise<ModuleContextPacket>;
  validateClaimAgainstSources(
    request: ClaimValidationRequest,
  ): Promise<ClaimValidationResult>;
}
