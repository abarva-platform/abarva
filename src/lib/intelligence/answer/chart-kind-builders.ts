// Chart-kind → renderer-builder map — W4.3.
//
// The gate validates each output-recipe `chartKind` against AnswerChartKind, but
// the recipes' free-text `chartBuilder` values were authored loosely and mostly
// do NOT match the real board-grade svg-charts exports (which are domain-named:
// investmentWaterfall, sensitivityTornado, opportunityRangeBar, …). So the
// renderer must map the validated `chartKind` to a real builder here — this is
// the single source of truth for the recipe→renderer contract. The W4.1 chart
// renderer dispatches on chartKind through this map; the recipe's own
// `chartBuilder` field is advisory only.
//
// Every value below is a real exported builder in
// `src/lib/programs/expert-kernel/exports/board-grade/svg-charts.ts`
// (asserted by the W4.3 test). Where the board-grade kit has no exact generic
// builder (bar, line), the closest honest stand-in is used and noted.

import type { AnswerChartKind } from "@/lib/ava-answer/contract";

export const CHART_KIND_TO_BUILDER: Record<AnswerChartKind, string> = {
  bar: "opportunityRangeBar", // no generic categorical bar in the kit; ranked horizontal bars are the closest
  "stacked-bar": "workstreamCostStack",
  line: "adoptionCurve", // no generic line; the adoption-curve line builder is the closest
  waterfall: "investmentWaterfall",
  "value-bridge": "valueBridge",
  tornado: "sensitivityTornado",
  "range-bar": "opportunityRangeBar",
  heatmap: "riskHeatmap",
  swimlane: "roadmapSwimlane",
  "cost-stack": "costStack",
  "quadrant-matrix": "quadrantMatrix",
};

/** The real builder name for a chart kind (always defined for valid kinds). */
export function builderForChartKind(kind: AnswerChartKind): string {
  return CHART_KIND_TO_BUILDER[kind];
}
