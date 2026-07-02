import type { ReactElement } from "react";

export const APPROVED_CXO_CANVAS_TYPES = [
  "executive-canvas-sequencing",
  "value-readiness-matrix",
  "gate-to-value-roadmap",
  "proof-boundary-card",
  "risk-control-heatmap",
  "portfolio-allocation-map",
  "process-reinvention-map",
  "architecture-dependency-map",
  "operating-model-canvas",
  "thirty-sixty-ninety-roadmap",
] as const;

export type CxoCanvasType = (typeof APPROVED_CXO_CANVAS_TYPES)[number];

export const LEGACY_CXO_CANVAS_TYPE_ALIASES = {
  investmentSequencingMap: "executive-canvas-sequencing",
  valueReadinessMatrix: "value-readiness-matrix",
  gateToValueRoadmap: "gate-to-value-roadmap",
  proofBoundary: "proof-boundary-card",
} as const satisfies Record<string, CxoCanvasType>;

export type LegacyCxoCanvasType = keyof typeof LEGACY_CXO_CANVAS_TYPE_ALIASES;

export interface CxoCanvasMetric {
  label: string;
  value: string | number;
  tone?: "neutral" | "positive" | "warning" | "danger";
  note?: string;
}

export interface CxoCanvasItem {
  label: string;
  value?: number;
  readiness?: number;
  risk?: number;
  allocation?: number;
  impact?: number;
  confidence?: number;
  action?: string;
  owner?: string;
  gate?: string;
  status?: string;
  dependency?: string;
  valueUnlocked?: string;
  note?: string;
}

export interface CxoCanvasLane {
  label: string;
  items: CxoCanvasItem[];
  summary?: string;
}

export interface CxoCanvasGate {
  label: string;
  owner?: string;
  dependency?: string;
  valueUnlocked?: string;
  status?: string;
  note?: string;
}

export interface CxoCanvasProofBoundary {
  known?: string[];
  assumed?: string[];
  missing?: string[];
  decisionRequired?: string;
}

export interface CxoCanvasPayload {
  canvasType: CxoCanvasType;
  title: string;
  summary?: string;
  items?: CxoCanvasItem[];
  lanes?: CxoCanvasLane[];
  metrics?: CxoCanvasMetric[];
  gates?: CxoCanvasGate[];
  proofBoundary?: CxoCanvasProofBoundary;
  decisionRequired?: string;
  sourceNotes?: string[];
  confidence?: number;
}

export interface CxoCanvasFallback {
  title?: string;
  summary?: string;
  decisionRequired?: string;
  proofBoundary?: CxoCanvasProofBoundary;
}

export interface CxoCanvasRendererContext {
  surface?:
    | "intelligence"
    | "moves"
    | "source"
    | "tower"
    | "home"
    | "artifacts";
  tenantKey?: string;
  companionCardId?: string;
  mode?: "pending" | "model" | "history";
}

export type CxoCanvasRendererComponent = (props: {
  payload: CxoCanvasPayload;
  context?: CxoCanvasRendererContext;
}) => ReactElement;
