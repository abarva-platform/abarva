export type HomeKnowMode = "KNOW";

export type HomeKnowIntent =
  "lookup" | "browse" | "table" | "chart" | "gap" | "decision_handoff";

export type HomeKnowAnswerStatus =
  "answered" | "partial" | "no_data" | "handoff" | "blocked";

export type HomeKnowCitationSourceClass =
  | "tenant-record"
  | "tenant-fact"
  | "tenant-relationship"
  | "tenant-source-file"
  | "gap-metadata"
  | "conflict-metadata";

export interface HomeKnowFact {
  id: string;
  dimensionId: string;
  label: string;
  value: string | number | boolean | null;
  citationIds: string[];
}

export interface HomeKnowTableColumn {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
  format?: "text" | "number" | "currency" | "percent" | "date";
}

export interface HomeKnowTable {
  id: string;
  title: string;
  dimensionId: string;
  columns: HomeKnowTableColumn[];
  rows: Array<Record<string, string | number | boolean | null>>;
  citationIds: string[];
  note?: string;
}

export type HomeKnowChartKind = "cost-stack" | "bar";
export type HomeKnowChartType =
  "bar" | "stacked_bar" | "line" | "waterfall" | "cost_stack";

export interface HomeKnowChart {
  id: string;
  title: string;
  kind: HomeKnowChartKind;
  type: HomeKnowChartType;
  dimensionId: string;
  data: Array<{
    label: string;
    value: number;
    color?: string;
  }>;
  sourceIds: string[];
  citationIds: string[];
  caveats: string[];
  status: "tenant-fact" | "pattern-planning" | "unavailable";
}

export interface HomeKnowGraphNode {
  id: string;
  label: string;
  type: string;
}

export interface HomeKnowGraphEdge {
  from: string;
  to: string;
  label: string;
  type: string;
  confidence?: "low" | "medium" | "high";
}

export interface HomeKnowGraph {
  id: string;
  title: string;
  nodes: HomeKnowGraphNode[];
  edges: HomeKnowGraphEdge[];
  nodeTypes: string[];
  edgeTypes: string[];
  sourceIds: string[];
  citationIds: string[];
  confidence: "low" | "medium" | "high";
  gaps: string[];
  inferredEdges: boolean;
  warning?: string;
}

export interface HomeKnowGap {
  id: string;
  dimensionId: string;
  objectType: string;
  expectedField: string;
  displayLabel: string;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  citationIds: string[];
}

export interface HomeKnowConflict {
  id: string;
  dimensionId: string;
  label: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  citationIds: string[];
}

export interface HomeKnowCitation {
  id: string;
  label: string;
  sourceClass: HomeKnowCitationSourceClass;
  sourceFile?: string | null;
  sourceRowNumber?: number | null;
  recordId?: string | null;
  excerpt?: string | null;
  confidence?: "low" | "medium" | "high";
}

export interface HomeKnowHandoff {
  target: "intelligence" | "tower" | "source" | "moves" | null;
  label: string;
  reason: string;
}

export type HomeKnowAnswerability =
  | "answerable_from_loaded_context"
  | "answerable_with_caveat"
  | "planning_grade_only"
  | "requires_tower"
  | "requires_intelligence"
  | "requires_source"
  | "requires_moves"
  | "data_thin"
  | "blocked_wrong_tenant"
  | "unsupported";

export interface HomeKnowContextQualityDimension {
  dimensionName: string;
  coverageScore: number;
  freshnessScore: number;
  confidenceScore: number;
  relationshipScore: number;
  citationScore: number;
  gapCount: number;
  dataThinCount: number;
  loadedFactCount: number;
  assumptionCount: number;
  clientSignoffRequiredCount: number;
  supportedAnswerTypes: string[];
  blockedAnswerTypes: string[];
  handoffSurface: "home" | "intelligence" | "tower" | "source" | "moves" | null;
}

export interface HomeKnowContextQuality {
  answerability: HomeKnowAnswerability;
  overall: "strong" | "medium" | "thin" | "blocked";
  summary: string;
  strongDimensions: string[];
  mediumDimensions: string[];
  thinDimensions: string[];
  recommendedHandoff: HomeKnowHandoff | null;
  dimensions: HomeKnowContextQualityDimension[];
}

export interface HomeKnowSafety {
  serverValidated: boolean;
  blockedExperts: boolean;
  blockedDecisionFrames: boolean;
  blockedInternalCodes: boolean;
  unsupportedClaimsRemoved: number;
  frontendTripwireShouldFire: boolean;
  usableEvidence?: boolean;
  evidenceStatus?: "usable_dossier" | "empty_dossier";
  evidenceReason?: string;
  evidenceChannels?: {
    facts: number;
    tables: number;
    charts: number;
    graphs: number;
    citations: number;
    sourceCoverage: number;
    sections: number;
    rollups: number;
    relationshipPaths: number;
    metrics: number;
    gaps: number;
  };
  composerTrace?: {
    route: "/api/home/know/ask" | "home-know-engine";
    composer:
      | "home_v6_dataset_contract"
      | "golden_home_know_semantic_synthesis"
      | "claude_text_synthesis"
      | "deterministic_fallback"
      | "home_know_template_fallback"
      | "home_know_decision_handoff"
      | "home_know_blocked";
    goldenComposerAttempted: boolean;
    goldenComposerUsed: boolean;
    fallbackUsed: boolean;
    dimensionsUsed: string[];
    factsBound: number;
    tablesBound: number;
    chartsBound?: number;
    graphsBound?: number;
    citationsBound?: number;
    sourceCoverageBound?: number;
    sectionsBound?: number;
    rollupsBound?: number;
    relationshipPathsBound?: number;
    metricsBound?: number;
    gapsBound: number;
    usableEvidence?: boolean;
    evidenceChannels?: HomeKnowSafety["evidenceChannels"];
    answerStatus: HomeKnowAnswerStatus;
    reason?: string;
    promptSnapshot?: {
      system: string;
      user: string;
      full: string;
    };
    anthropicTrace?: {
      finalPrompt: {
        request: unknown;
        requestJson: string;
        system: string;
        messages: Array<{ role: string; content: unknown }>;
        full: string;
        promptByteLength: number;
        promptSha256: string;
      };
      model: string;
      params: {
        max_tokens: number;
        temperature?: number | null;
        timeoutMs: number;
      };
      claudeRaw: {
        events: unknown[];
        message: unknown;
        text: string;
      };
    };
  };
}

export interface HomeKnowResponse {
  mode: HomeKnowMode;
  tenantKey: string;
  question: string;
  intent: HomeKnowIntent;
  answerStatus: HomeKnowAnswerStatus;
  artifactStatus?:
    | "rendered"
    | "recommended_not_rendered"
    | "unavailable_named_gap"
    | "not_requested";
  prose: string;
  dimensionsUsed: string[];
  facts: HomeKnowFact[];
  tables: HomeKnowTable[];
  charts: HomeKnowChart[];
  graphs: HomeKnowGraph[];
  gaps: HomeKnowGap[];
  conflicts: HomeKnowConflict[];
  citations: HomeKnowCitation[];
  handoff: HomeKnowHandoff | null;
  answerability?: HomeKnowAnswerability;
  contextQuality?: HomeKnowContextQuality;
  safety: HomeKnowSafety;
}

export interface HomeKnowAskRequest {
  question: string;
  tenantKey?: string | null;
  client?: string | null;
  operatorTrace?: boolean;
}

export const HOME_KNOW_INTENTS = [
  "lookup",
  "browse",
  "table",
  "chart",
  "gap",
  "decision_handoff",
] as const satisfies readonly HomeKnowIntent[];

export const HOME_KNOW_ANSWER_STATUSES = [
  "answered",
  "partial",
  "no_data",
  "handoff",
  "blocked",
] as const satisfies readonly HomeKnowAnswerStatus[];
