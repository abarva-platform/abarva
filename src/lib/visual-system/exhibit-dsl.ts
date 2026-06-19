// Exhibit DSL + renderer-capability map (spec §7/§8).
//
// The Story Director (PR2) produces an exhibit PLAN — a list of `ExhibitType`s per page. The
// Visual Director (PR4) turns each into a concrete exhibit and renders it via the shared engine
// (./index). This module provides:
//   1. the common exhibit-spec envelope (every exhibit carries its evidence + decision relevance —
//      spec §8 traceability), and
//   2. an HONEST capability map: which `ExhibitType`s an existing visual-system renderer already
//      backs, and which the Visual Director must still build (the tree / RACI / org family).
//
// The map is the planning truth for PR4: the architecture + economics families are covered by the
// expert-kernel engine; trees, RACI, org-model, dependency-graph, and a few tables are gaps.

import * as engine from "./index";
import type { ExhibitType, ModelSource } from "@/lib/deliverables/story/types";

/** Every exhibit spec carries enough to trace it back to the decision (spec §8). */
export interface ExhibitSpecBase {
  id: string;
  exhibitType: ExhibitType;
  title: string;
  /** Evidence citation numbers (into the MoveDecisionModel bundle) this exhibit rests on. */
  evidence: number[];
  /** Which part of the decision model populated it. */
  sourceFromModel: ModelSource;
  /** One-line "why this exhibit matters to the decision". */
  decisionRelevance: string;
}

/** Whether an ExhibitType can be rendered today, and by which shared-engine function. */
export type ExhibitRendererStatus =
  | { status: "available"; renderer: EngineRenderer }
  | { status: "needs_build"; note: string };

/** Names that MUST be real exports of ./index — enforced by exhibit-dsl.test.ts. */
export type EngineRenderer =
  | "optionScorecard"
  | "contextDiagram"
  | "layeredFlow"
  | "integrationMap"
  | "boundaryLaneMap"
  | "accountabilityMap"
  | "controlOverlay"
  | "archRiskHeatmap"
  | "openDecisionQueue"
  | "investmentWaterfall"
  | "costStack"
  | "valueBridge"
  | "adoptionCurve"
  | "sensitivityTornado"
  | "paybackRangeCurve"
  | "roadmapSwimlane"
  | "riskHeatmap"
  | "economicsStrip"
  | "baselineImpact"
  | "baselineCoverageMeter"
  | "opportunityRangeBar"
  | "gapClosureQueue"
  | "valueVsEffortSummary";

const avail = (renderer: EngineRenderer): ExhibitRendererStatus => ({ status: "available", renderer });
const build = (note: string): ExhibitRendererStatus => ({ status: "needs_build", note });

/**
 * The coverage truth. Architecture + economics map onto the existing engine; the tree / RACI /
 * org / dependency / table family is what PR4 must add (these are the gaps a board deck needs
 * for Discover & Diagnose, Operating Model, and Value Model trees).
 */
export const EXHIBIT_RENDERER_CAPABILITY: Record<ExhibitType, ExhibitRendererStatus> = {
  // architecture family — covered
  ArchitectureOnPage: avail("layeredFlow"),
  LayeredArchitecture: avail("layeredFlow"),
  WorkflowSwimlane: avail("accountabilityMap"),
  ControlOverlay: avail("controlOverlay"),
  IntegrationLandscape: avail("integrationMap"),
  BuildBuyBoundary: avail("boundaryLaneMap"),
  GovernanceStructure: build("governance/org chart — no existing renderer (PR4)"),
  // decision / matrix family
  DecisionScorecard: avail("optionScorecard"),
  OptionMatrix: avail("optionScorecard"),
  TradeoffMatrix: avail("optionScorecard"),
  CapabilityHeatmap: avail("riskHeatmap"),
  MaturityHeatmap: avail("riskHeatmap"),
  RiskConcentrationMap: avail("archRiskHeatmap"),
  DecisionTree: build("tree renderer — no existing (PR4)"),
  IssueTree: build("tree renderer — no existing (PR4)"),
  RootCauseTree: build("tree renderer — no existing (PR4)"),
  RACIMap: build("RACI matrix — no existing svg (PR4)"),
  OperatingModel: build("org/operating model — no existing renderer (PR4)"),
  EvidenceMatrix: build("evidence table — no existing svg (PR4)"),
  DependencyGraph: build("dependency network — no existing renderer (PR4)"),
  // value / economics family — covered (the Workforce Economics convergence lands here)
  ValueBridge: avail("valueBridge"),
  ValueWaterfall: avail("investmentWaterfall"),
  TransformationRoadmap: avail("roadmapSwimlane"),
  ValueTimeline: avail("adoptionCurve"),
  ReadinessDashboard: avail("baselineCoverageMeter"),
  ConstraintStack: avail("costStack"),
  KeyMessageCard: avail("economicsStrip"),
  ValueTree: build("value tree — no existing renderer (PR4)"),
  MeasurementArchitecture: build("measurement flow — no existing renderer (PR4)"),
  OwnershipMap: build("ownership table — no existing renderer (PR4)"),
};

export function resolveExhibitRenderer(exhibitType: ExhibitType): ExhibitRendererStatus {
  return EXHIBIT_RENDERER_CAPABILITY[exhibitType];
}

/** Is a renderer name actually present on the shared engine surface? (used by the DSL test). */
export function engineHasRenderer(name: EngineRenderer): boolean {
  return typeof (engine as Record<string, unknown>)[name] === "function";
}

export interface ExhibitCoverageReport {
  total: number;
  available: number;
  needsBuild: number;
  coveragePct: number;
  gaps: ExhibitType[];
}

export function exhibitCoverage(): ExhibitCoverageReport {
  const entries = Object.entries(EXHIBIT_RENDERER_CAPABILITY) as Array<[ExhibitType, ExhibitRendererStatus]>;
  const gaps = entries.filter(([, s]) => s.status === "needs_build").map(([t]) => t);
  const available = entries.length - gaps.length;
  return {
    total: entries.length,
    available,
    needsBuild: gaps.length,
    coveragePct: Math.round((available / entries.length) * 100),
    gaps,
  };
}
