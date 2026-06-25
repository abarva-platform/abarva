export type DossierSurface =
  | "home"
  | "intelligence"
  | "moves"
  | "source"
  | "tower"
  | "ava";

export type DossierDimensionFamily =
  | "organization_leadership"
  | "application_systems"
  | "vendor_contracts"
  | "data_analytics"
  | "operations_process"
  | "ai_value_governance"
  | "budget_financials"
  | "risk_compliance"
  | "source_moves_tower";

export type DossierArtifactType =
  | "prose"
  | "table"
  | "chart"
  | "graph"
  | "handoff"
  | "gap";

export interface DossierSourceRequirement {
  sourceKey: string;
  required: boolean;
  purpose: string;
  dimensionFamily?: DossierDimensionFamily;
  binderRole?: "primary" | "adjacent" | "context";
}

export interface DimensionRoute {
  question: string;
  requestedSurface: DossierSurface;
  targetSurface: DossierSurface;
  intent: "know" | "decide" | "source" | "execute" | "control" | "gap";
  primaryDimension: DossierDimensionFamily;
  relatedDimensions: DossierDimensionFamily[];
  requiredSources: DossierSourceRequirement[];
  artifactPlan: DossierArtifactType[];
  handoffReason?: string;
}

export type DossierRecord = Record<
  string,
  string | number | boolean | null | undefined
>;

export interface DossierSourceCoverage {
  sourceKey: string;
  loaded: boolean;
  count: number;
  purpose: string;
  required: boolean;
  dimensionFamily?: DossierDimensionFamily;
  binderRole?: "primary" | "adjacent" | "context";
}

export interface DossierFact {
  label: string;
  value: string | number;
  sourceKey: string;
  confidence: "high" | "medium" | "low";
}

export interface DossierSection {
  sectionKey: string;
  title: string;
  dimensionFamily: DossierDimensionFamily;
  sourceKeys: string[];
  summary: string;
  recordCount: number;
  sample: DossierRecord[];
}

export interface DossierRelationshipPath {
  pathKey: string;
  label: string;
  from: string;
  relationship: string;
  to: string;
  sourceKeys: string[];
  confidence: "high" | "medium" | "low";
}

export interface DossierMetric {
  metricKey: string;
  label: string;
  value: number | string;
  unit?: string;
  sourceKeys: string[];
  caveat?: string;
}

export interface DossierGap {
  gapKey: string;
  label: string;
  impact: string;
  neededEvidence: string[];
}

export interface DossierAnswerBoundary {
  canAnswer: string[];
  cannotAnswer: string[];
  handoffTarget: DossierSurface | null;
  handoffReason?: string;
}

export interface DossierComposerPacket {
  question: string;
  tenantKey: string;
  primaryDimension: DossierDimensionFamily;
  relatedDimensions: DossierDimensionFamily[];
  dimensionSummary: string;
  sections: DossierSection[];
  rollups: Record<string, number | string | string[]>;
  relationshipPaths: DossierRelationshipPath[];
  metrics: DossierMetric[];
  gaps: DossierGap[];
  citations: UniversalDimensionDossier["citations"];
  artifactPlan: DossierArtifactType[];
  answerBoundary: DossierAnswerBoundary;
}

export interface UniversalDimensionDossier {
  tenantKey: string;
  route: DimensionRoute;
  branchOptions?: Array<{
    id: string;
    label: string;
    dimensionKey: string;
    summary: string;
    coverageScore: number;
    confidence: number;
    entityCount: number;
    factCount: number;
    relationshipCount: number;
    citationCount: number;
  }>;
  sourceCoverage: DossierSourceCoverage[];
  dimensionSummary: string;
  sections: DossierSection[];
  facts: DossierFact[];
  rollups: Record<string, number | string | string[]>;
  relationshipPaths: DossierRelationshipPath[];
  metrics: DossierMetric[];
  gaps: DossierGap[];
  citations: Array<{
    label: string;
    sourceKey: string;
    count: number;
  }>;
  artifactPlan: DossierArtifactType[];
  answerBoundary: DossierAnswerBoundary;
  composerPacket: DossierComposerPacket;
  qualityFlags: string[];
}

export interface BuildUniversalDimensionDossierInput {
  tenantKey: string;
  question: string;
  requestedSurface?: DossierSurface;
  sources: Record<string, DossierRecord[]>;
}

export interface DossierAnswer {
  directAnswer: string;
  composerPacket: DossierComposerPacket;
  artifactPlan: DossierArtifactType[];
  citations: UniversalDimensionDossier["citations"];
  gaps: DossierGap[];
  quality: {
    passed: boolean;
    issues: string[];
  };
}
