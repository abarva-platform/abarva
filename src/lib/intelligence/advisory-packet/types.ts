import type {
  AskSource,
  IntentClassification,
} from "@/lib/intelligence/ask/types";
import type {
  IntelligenceDimension,
  IntelligenceDossier,
  IntelligenceIntent,
} from "@/lib/intelligence/dossiers";

export type AdvisoryScore = 1 | 2 | 3 | 4 | 5;

export type AdvisoryCorpusRole =
  "NONE_NEEDED" | "HELPFUL" | "CRITICAL" | "MISSING" | "RISKY";

export type AdvisoryExpertLensName =
  | "CIO"
  | "CFO"
  | "COO"
  | "CDAO"
  | "CISO / risk"
  | "sourcing / vendor"
  | "board advisor"
  | "transformation lead";

export type AdvisoryExpertLensRole =
  "REQUIRED" | "HELPFUL" | "NOT_NEEDED" | "MISSING / WEAK";

export interface AdvisoryFact {
  id: string;
  statement: string;
  sourceRefIds: string[];
  confidence: "high" | "medium" | "low";
}

export interface AdvisoryEntity {
  id: string;
  name: string;
  kind:
    | "capability"
    | "initiative"
    | "system"
    | "vendor"
    | "function"
    | "role"
    | "metric"
    | "data-product"
    | "other";
  sourceRefIds: string[];
}

export interface AdvisoryRelationship {
  id: string;
  from: string;
  relationship: string;
  to: string;
  implication: string;
  sourceRefIds: string[];
  confidence: "high" | "medium" | "low";
}

export interface AdvisoryMetric {
  id: string;
  label: string;
  value: string | number;
  basis: string;
  sourceRefIds: string[];
}

export interface AdvisoryGap {
  id: string;
  statement: string;
  severity: "low" | "medium" | "high" | "critical";
  decisionImplication: string;
  sourceRefIds: string[];
}

export interface AdvisoryCorpusContext {
  id: string;
  label: string;
  summary: string;
  role: AdvisoryCorpusRole;
  tenantBoundary: "industry_context_not_tenant_fact" | "tenant_fact";
  sourceRefIds: string[];
}

export interface AdvisoryExpertLens {
  id: string;
  lens: AdvisoryExpertLensName;
  role: AdvisoryExpertLensRole;
  whySelected: string;
  pressureTest: string;
}

export interface AdvisoryBenchmarkContext {
  id: string;
  claim: string;
  basis: string;
  caveat: string;
  sourceRefIds: string[];
}

export interface AdvisorySourceRef {
  id: string;
  label: string;
  sourceType: AskSource["type"] | "dossier" | "derived";
  sourceId?: string | null;
  confidence?: number | string | null;
  modelVisibleLabel: string;
}

export interface AdvisoryTransformation {
  id: string;
  description: string;
  inputRefIds: string[];
  outputSection: keyof AdvisoryPacket["modelVisiblePacket"];
}

export interface RawLeakageScan {
  passed: boolean;
  hits: Array<{
    kind: string;
    value: string;
  }>;
}

export interface AdvisoryPacket {
  packetId: string;
  createdAt: string;
  tenantIdentity: {
    tenantKey: string;
    tenantName: string;
    industry?: string;
    vertical?: string;
    aliases?: string[];
  };
  questionIntent: {
    originalQuestion: string;
    normalizedQuestion: string;
    intent: IntelligenceIntent | IntentClassification["intent"] | string;
    category?: string;
    selectedDimensions: IntelligenceDimension[];
    selectedLenses: AdvisoryExpertLensName[];
  };
  modelVisiblePacket: {
    tenantFacts: AdvisoryFact[];
    entities: AdvisoryEntity[];
    relationships: AdvisoryRelationship[];
    metrics: AdvisoryMetric[];
    gaps: AdvisoryGap[];
    corpusContext: AdvisoryCorpusContext[];
    expertLenses: AdvisoryExpertLens[];
    benchmarkContext?: AdvisoryBenchmarkContext[];
    outputInstructions: string[];
  };
  auditLineage: {
    sourceRefs: AdvisorySourceRef[];
    hiddenRawRefs?: unknown[];
    transformations: AdvisoryTransformation[];
    sourceDossier?: IntelligenceDossier;
  };
  retrievalDiagnostics: {
    retrievalMode: string;
    sourceCounts: Record<string, number>;
    dimensionsCovered: string[];
    dimensionsMissing: string[];
    rawLeakageScan: RawLeakageScan;
    richnessScore: AdvisoryScore;
    evidenceIntegrityScore: AdvisoryScore;
    corpusRole: AdvisoryCorpusRole;
    expertLensDemand: Record<AdvisoryExpertLensName, AdvisoryExpertLensRole>;
    genericContextFlag: boolean;
    biggestMissingInput?: string;
    recommendedImprovement?: string;
    notes?: string[];
  };
}

export interface AssembleAdvisoryPacketInput {
  tenantKey?: string | null;
  tenantName?: string | null;
  industry?: string | null;
  vertical?: string | null;
  aliases?: string[];
  question: string;
  category?: string;
  classification: IntentClassification;
  sources: AskSource[];
  createdAt?: string;
}
