export type HomeKnowMode = "KNOW";

export type HomeKnowIntent =
  | "lookup"
  | "browse"
  | "table"
  | "chart"
  | "gap"
  | "decision_handoff";

export type HomeKnowAnswerStatus =
  | "answered"
  | "partial"
  | "no_data"
  | "handoff"
  | "blocked";

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
  | "bar"
  | "stacked_bar"
  | "line"
  | "waterfall"
  | "cost_stack";

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
  target: "intelligence" | "tower" | "moves" | null;
  label: string;
  reason: string;
}

export interface HomeKnowSafety {
  serverValidated: boolean;
  blockedExperts: boolean;
  blockedDecisionFrames: boolean;
  blockedInternalCodes: boolean;
  unsupportedClaimsRemoved: number;
  frontendTripwireShouldFire: boolean;
}

export interface HomeKnowResponse {
  mode: HomeKnowMode;
  tenantKey: string;
  question: string;
  intent: HomeKnowIntent;
  answerStatus: HomeKnowAnswerStatus;
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
  safety: HomeKnowSafety;
}

export interface HomeKnowAskRequest {
  question: string;
  tenantKey?: string | null;
  client?: string | null;
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
