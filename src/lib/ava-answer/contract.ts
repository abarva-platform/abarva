export type AvaSurface = "home" | "intelligence" | "moves" | "source" | "tower";

export type AvaMode =
  | "KNOW"
  | "ANALYZE"
  | "DECIDE"
  | "EXECUTE"
  | "SOURCE"
  | "CONTROL";

export type AvaAnswerStatus =
  | "answered"
  | "partial"
  | "no_data"
  | "handoff"
  | "blocked";

export type AvaConfidence = "high" | "medium" | "low";

export interface AvaFactRef {
  id: string;
  label: string;
  value?: string | number | boolean | null;
  citationIds?: string[];
}

export interface AvaMetricRef {
  id: string;
  label: string;
  value: string | number;
  unit?: string;
  citationIds?: string[];
}

export interface AvaRelationshipRef {
  id: string;
  label: string;
  fromLabel?: string;
  toLabel?: string;
  relationshipType?: string;
  citationIds?: string[];
}

export type CitationSourceClass =
  | "tenant-fact"
  | "tenant-chunk"
  | "graph"
  | "corpus-pattern"
  | "worldview"
  | "expert-pack";

export interface AnswerCitation {
  id: string;
  label: string;
  sourceClass: CitationSourceClass;
  recordId?: string;
  excerpt?: string;
  url?: string;
  confidence?: AvaConfidence;
}

export type TableColumnFormat =
  | "text"
  | "number"
  | "currency"
  | "percent"
  | "date";

export interface AnswerTableColumn {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
  format?: TableColumnFormat;
}

export interface AnswerTable {
  id: string;
  title?: string;
  columns: AnswerTableColumn[];
  rows: Array<Record<string, string | number | null>>;
  note?: string;
  citationIds?: string[];
}

export type AnswerChartKind =
  | "bar"
  | "stacked-bar"
  | "line"
  | "waterfall"
  | "value-bridge"
  | "tornado"
  | "range-bar"
  | "heatmap"
  | "swimlane"
  | "cost-stack"
  | "quadrant-matrix";

export interface AnswerChart {
  id: string;
  kind: AnswerChartKind;
  title?: string;
  data: unknown;
  builder?: string;
  citationIds?: string[];
}

export interface AnswerGraphNode {
  id: string;
  label: string;
  kind?: string;
}

export interface AnswerGraphEdge {
  from: string;
  to: string;
  label?: string;
  kind?: string;
}

export interface AnswerGraph {
  id: string;
  title?: string;
  nodes: AnswerGraphNode[];
  edges: AnswerGraphEdge[];
  citationIds?: string[];
}

export interface AvaCorpusRef {
  id: string;
  label: string;
  corpusType?: string;
  confidence?: AvaConfidence;
}

export interface AvaExpertRef {
  id: string;
  name: string;
}

export type ExpertRef = AvaExpertRef;

export type AvaArtifact =
  | ({ artifact: "table" } & AnswerTable)
  | ({ artifact: "chart" } & AnswerChart)
  | ({ artifact: "graph" } & AnswerGraph);

export type AvaCitation = AnswerCitation;

export interface AvaGap {
  id: string;
  label: string;
  detail: string;
  severity?: "low" | "medium" | "high" | "critical";
  citationIds?: string[];
}

export interface AvaCaveat {
  id: string;
  label: string;
  detail: string;
}

export interface AvaNextStep {
  id: string;
  label: string;
  rationale?: string;
  targetSurface?: AvaSurface;
}

export interface AvaAnswerQuality {
  confidence: AvaConfidence;
  evidenceStrength: "strong" | "partial" | "thin";
  tenantGrounding: "complete" | "partial" | "missing";
  answerCompleteness: "complete" | "partial" | "blocked";
}

export interface AvaAnswerSafety {
  tenantFencePassed: boolean;
  rawIdsSuppressed: boolean;
  forbiddenLanguagePassed: boolean;
  unsupportedClaimsBlocked: boolean;
}

export interface AvaAnswerPacket {
  surface: AvaSurface;
  mode: AvaMode;
  tenantKey: string;
  question: string;
  intent: string;
  status: AvaAnswerStatus;
  directAnswer: string;
  /** Compatibility mirror for older AgentAnswer consumers. */
  prose?: string;
  interpretation?: string;
  businessImplication?: string;
  recommendation?: string;
  decisionFrame?: unknown;
  factsUsed: AvaFactRef[];
  metricsUsed: AvaMetricRef[];
  relationshipsUsed: AvaRelationshipRef[];
  corpusUsed?: AvaCorpusRef[];
  expertsUsed?: AvaExpertRef[];
  /** Compatibility mirror for older AgentAnswer consumers. */
  contributingExperts?: AvaExpertRef[];
  /**
   * Compatibility fields for older gates and consumers that still score typed
   * exhibits directly on the answer object. `artifacts` remains canonical for
   * rendering; these are derived mirrors and must not drift from it.
   */
  tables?: AnswerTable[];
  charts?: AnswerChart[];
  graphs?: AnswerGraph[];
  artifacts: AvaArtifact[];
  citations: AvaCitation[];
  gaps: AvaGap[];
  caveats: AvaCaveat[];
  nextSteps: AvaNextStep[];
  quality: AvaAnswerQuality;
  safety: AvaAnswerSafety;
}

export interface AvaRetrievalSummary {
  substrate:
    | "semantic2"
    | "module_read_model"
    | "production_view"
    | "chunk"
    | "corpus"
    | "none";
  dimensions?: string[];
  factCount?: number;
  metricCount?: number;
  relationshipCount?: number;
  sourceCount?: number;
  hasTenantFacts: boolean;
  hasCorpus?: boolean;
  hasExperts?: boolean;
}
