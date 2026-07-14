import type { CanonicalFact } from "./canonical-fact";
import type { ContextGap } from "./context-gap";
import type { EvidenceRef, KnowledgeTruthStatus } from "./evidence-ref";
import type { RelationshipEdge } from "./relationship-edge";

export type EntityProfileType =
  | "enterprise"
  | "function"
  | "system"
  | "data_domain"
  | "infrastructure"
  | "vendor"
  | "contract"
  | "program"
  | "risk"
  | "metric"
  | "use_case"
  | "process";

export type ModuleReadiness =
  | "agent_ready"
  | "needs_review"
  | "not_ready"
  | "candidate_only"
  | "restricted"
  | "missing_evidence"
  | "relationship_not_validated";

export interface EntityProfile {
  profileId: string;
  tenantKey: string;
  entityType: EntityProfileType;
  entityName: string;
  businessMeaning: string;
  currentStateSummary: string;
  targetStateDirection?: string;
  operatingRole?: string;
  relatedFunctions: string[];
  relatedSystems: string[];
  relatedDataDomains: string[];
  relatedInfrastructure: string[];
  relatedVendorsContracts: string[];
  relatedSpend: string[];
  relatedPrograms: string[];
  relatedRisksControls: string[];
  relatedMetricsOutcomes: string[];
  relatedUseCases: string[];
  facts: CanonicalFact[];
  relationships: RelationshipEdge[];
  evidenceRefs: EvidenceRef[];
  confidence: number;
  knownGaps: ContextGap[];
  caveats: string[];
  truthStatus: KnowledgeTruthStatus;
  sourceLineage: string[];
  asOfDate?: string;
  moduleReadiness: ModuleReadiness;
}

export interface EnterpriseProfile extends EntityProfile {
  entityType: "enterprise";
}

export interface FunctionProfile extends EntityProfile {
  entityType: "function";
}

export interface SystemProfile extends EntityProfile {
  entityType: "system";
}

export interface DataDomainProfile extends EntityProfile {
  entityType: "data_domain";
}

export interface InfrastructureProfile extends EntityProfile {
  entityType: "infrastructure";
}

export interface VendorProfile extends EntityProfile {
  entityType: "vendor";
}

export interface ContractProfile extends EntityProfile {
  entityType: "contract";
}

export interface ProgramProfile extends EntityProfile {
  entityType: "program";
}

export interface RiskProfile extends EntityProfile {
  entityType: "risk";
}

export interface MetricProfile extends EntityProfile {
  entityType: "metric";
}

export interface UseCaseProfile extends EntityProfile {
  entityType: "use_case";
}

export interface ProcessProfile extends EntityProfile {
  entityType: "process";
}
