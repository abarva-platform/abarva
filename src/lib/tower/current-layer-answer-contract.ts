import type { VisibleAnswerContractResult } from "@/lib/agent/visible-answer-contract";
import type { TowerVisualContract } from "@/lib/tower/visual-contract";

export interface CioTowerVisibleContextCriteria {
  renderingPolicy: string[];
  artifactCapabilities: string[];
  exportTargets: string[];
  valueProposition: string;
}

export interface CioTowerPageContext {
  activeTab?: string | null;
  activeTabLabel?: string | null;
  activeView?: string | null;
  activeViewLabel?: string | null;
  selectedEntity?: {
    kind: "program" | "ai" | "gap" | "action";
    id: string;
    label?: string | null;
    ordinal?: number | null;
  } | null;
  visibleRows?: Array<{
    id: string;
    label: string;
    kind: string;
  }>;
  filters?: Record<string, string | number | boolean | null>;
}

export interface CioTowerVisibleTable {
  id: string;
  title: string;
  columns: string[];
  rows: string[][];
}

export interface CioTowerVisibleTab {
  id: string;
  label: string;
  prose: string;
  tables?: CioTowerVisibleTable[];
}

export interface CioTowerVisibleAnswerContract {
  version: "cio_tower_visible_answer_v1";
  answer: string;
  tables?: CioTowerVisibleTable[];
  tabs?: CioTowerVisibleTab[];
  visualContract?: TowerVisualContract | null;
  followUpQuestion?: string | null;
}

export interface CioTowerAnswerResult {
  response: string;
  modelOutputRaw: string;
  modelOutput: CioTowerVisibleAnswerContract;
  promptPackageKey: string;
  traceKey: string;
  promptHash: string;
  model: string;
  validationStatus: "passed" | "failed";
  validationErrors: string[];
  latencyMs: number;
  metricCards: Array<{ label: string; value: string }>;
  gaps: string[];
  v6VisibleOutputAudit: VisibleAnswerContractResult;
}
