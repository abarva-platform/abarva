import type { CanonicalFact } from "./canonical-fact";
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

export interface TowerContextPack extends ContextPack {
  moduleKey: "tower";
  realizedValueRequiresMeasuredEvidence: true;
}
