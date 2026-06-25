import type { AskSource, IntentClassification } from "@/lib/intelligence/ask/types";
import type { ExpertRef } from "@/lib/ava-answer/contract";

export const INTELLIGENCE_INTENTS = [
  "strategy",
  "investment_prioritization",
  "operating_model",
  "risk_assessment",
  "value_realization",
  "portfolio_review",
  "market_benchmark",
  "kill_hold_scale",
  "architecture_constraint",
  "transformation_roadmap",
  "sourcing_strategy",
  "vendor_concentration",
  "application_modernization",
  "data_estate_modernization",
  "operational_automation",
  "ai_governance",
  "benefits_realization",
  "cost_optimization",
  "capability_transformation",
  "enterprise_architecture",
] as const;

export type IntelligenceIntent = (typeof INTELLIGENCE_INTENTS)[number];

export type IntelligenceDimension =
  | "enterprise_strategy"
  | "operating_model"
  | "applications_systems"
  | "data_analytics"
  | "vendor_contracts"
  | "budget_financials"
  | "operations_process"
  | "ai_value_governance"
  | "risk_compliance"
  | "business_function";

export type IntelligenceArtifactType =
  | "executive_answer"
  | "table"
  | "chart"
  | "graph"
  | "option_matrix"
  | "risk_panel"
  | "source_list";

export type EvidenceStrength = "strong" | "partial" | "thin";
export type DossierConfidence = "strong" | "moderate" | "directional";

export interface IntelligenceRoute {
  tenantKey: string | null;
  question: string;
  intelligenceIntent: IntelligenceIntent;
  primaryDimension: IntelligenceDimension;
  relatedDimensions: IntelligenceDimension[];
  tenantEvidenceRequired: string[];
  corpusPatternFamiliesRequired: string[];
  expertLensesRequired: string[];
  benchmarkTypesRequired: string[];
  decisionFrameRequired: boolean;
  expectedArtifacts: IntelligenceArtifactType[];
  handoffTargets: Array<"home" | "moves" | "source" | "tower">;
}

export interface IntelligenceCitation {
  id: string;
  label: string;
  sourceClass:
    | "tenant-fact"
    | "tenant-source"
    | "graph"
    | "corpus-pattern"
    | "worldview"
    | "benchmark"
    | "expert-pack";
  sourceId?: string | null;
  confidence?: "high" | "medium" | "low";
}

export interface TenantEvidenceDossier {
  sourceFamiliesIncluded: string[];
  sections: Array<{
    id: string;
    label: string;
    sourceType: AskSource["type"];
    summary: string;
    factCount: number;
    citationIds: string[];
  }>;
  rollups: Record<string, number | string | string[]>;
  metrics: Array<{
    id: string;
    label: string;
    value: string | number;
    basis: string;
    citationIds: string[];
  }>;
  relationshipPaths: Array<{
    id: string;
    label: string;
    from: string;
    relationship: string;
    to: string;
    citationIds: string[];
    confidence: "high" | "medium" | "low";
  }>;
  gaps: Array<{
    id: string;
    label: string;
    detail: string;
    severity: "low" | "medium" | "high" | "critical";
  }>;
  citations: IntelligenceCitation[];
  confidence: EvidenceStrength;
}

export interface CorpusPatternDossier {
  patternFamilies: string[];
  patternsIncluded: Array<{
    patternFamilyId: string;
    patternFamilyName: string;
    relevanceReason: string;
    industryFit: string;
    functionFit: string;
    valueLever: string;
    patterns: Array<{
      patternId: string;
      title: string;
      summary: string;
      applicability: string;
      prerequisites: string[];
      risks: string[];
      evidenceStrength: DossierConfidence;
      citationIds: string[];
    }>;
  }>;
  patternsExcluded: Array<{
    patternName: string;
    reasonExcluded: string;
  }>;
  applicabilitySummary: string;
  citations: IntelligenceCitation[];
}

export interface ExpertCouncilDossier {
  selectedExperts: Array<{
    expertId: string;
    nameOrRole: string;
    lens: string;
    whySelected: string;
    expectedContribution: string;
    questionsThisExpertShouldPressureTest: string[];
    citationIds: string[];
  }>;
  excludedExperts: Array<{
    expertId: string;
    nameOrRole: string;
    reasonExcluded: string;
  }>;
  expertLensSummary: string;
  citations: IntelligenceCitation[];
}

export interface BenchmarkDossier {
  benchmarkSources: Array<{
    id: string;
    claim: string;
    source: string;
    freshness: string;
    applicability: string;
    caveat: string;
    citationIds: string[];
  }>;
  peerExamples: string[];
  roiRanges: Array<{
    range: string;
    basis: string;
    confidence: DossierConfidence;
    caveat: string;
  }>;
  implementationCaveats: string[];
  freshness: string;
  confidence: DossierConfidence;
}

export interface DecisionOptionsDossier {
  options: Array<{
    optionId: string;
    title: string;
    description: string;
    tenantEvidenceSupport: string[];
    corpusSupport: string[];
    expertSupport: string[];
    expectedValue: string;
    executionComplexity: "low" | "medium" | "high";
    riskLevel: "low" | "medium" | "high";
    prerequisites: string[];
    missingEvidence: string[];
    recommendedUse: "scale" | "pilot" | "hold" | "sequence" | "avoid" | "investigate";
  }>;
  tradeoffs: string[];
  recommendedDecisionFrame: string;
  confidence: DossierConfidence;
}

export interface RiskCaveatDossier {
  tenantEvidenceGaps: string[];
  dataReadinessGaps: string[];
  operatingModelRisks: string[];
  governanceRisks: string[];
  executionRisks: string[];
  measurementRisks: string[];
}

export interface EvidenceBoundary {
  tenantFacts: string[];
  corpusPatterns: string[];
  expertInterpretations: string[];
  benchmarkClaims: string[];
  missingTenantEvidence: string[];
  cannotConclude: string[];
}

export interface IntelligenceDossier {
  tenantKey: string;
  tenantName: string;
  question: string;
  intelligenceIntent: IntelligenceIntent;
  primaryDimension: IntelligenceDimension;
  relatedDimensions: IntelligenceDimension[];
  tenantEvidenceDossier: TenantEvidenceDossier;
  corpusPatternDossier: CorpusPatternDossier;
  expertCouncilDossier: ExpertCouncilDossier;
  benchmarkDossier: BenchmarkDossier;
  decisionOptionsDossier: DecisionOptionsDossier;
  riskCaveatDossier: RiskCaveatDossier;
  evidenceBoundary: EvidenceBoundary;
  artifactPlan: IntelligenceArtifactType[];
  citations: IntelligenceCitation[];
  qualityFlags: string[];
}

export interface BuildIntelligenceDossierInput {
  tenantKey?: string | null;
  tenantName?: string | null;
  question: string;
  classification: IntentClassification;
  sources: AskSource[];
  contributingExperts?: ExpertRef[];
}

export interface IntelligenceDossierQualityResult {
  passed: boolean;
  critical: boolean;
  issues: string[];
}
