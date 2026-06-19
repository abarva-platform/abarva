// Shared visual-system surface — the ONE stable import point for AbarVa's deterministic,
// gap-honest exhibit engine (spec §7/§8 reconciliation).
//
// The deliverable orchestrator and the Visual Director (PR4) reach the SVG engine through this
// barrel instead of importing expert-kernel internals — so there is a single visual identity
// across the dossier AND the orchestrator path (the "no second visual engine" rule from
// docs/build/DELIVERABLE_TRANSFORMATION_RECONCILIATION.md).
//
// The implementation currently lives under expert-kernel; both `svg-architecture.ts` and
// `svg-charts.ts` are fully self-contained (zero imports), so a later physical relocation into
// this directory is invisible to consumers — the barrel is the public contract regardless of
// where the source sits. Rasterisation (the @resvg/resvg-js binary boundary) is intentionally a
// SEPARATE entry point (`./raster`) so consumers that only build SVG strings don't drag the
// native binary in.

// Architecture exhibits (9): optionScorecard, contextDiagram, layeredFlow, integrationMap,
// boundaryLaneMap, accountabilityMap, controlOverlay, archRiskHeatmap, openDecisionQueue + types.
export * from "@/lib/programs/expert-kernel/exports/board-grade/svg-architecture";

// Economics / value charts (14): investmentWaterfall, costStack, valueBridge, adoptionCurve,
// sensitivityTornado, paybackRangeCurve, roadmapSwimlane, riskHeatmap, economicsStrip,
// baselineImpact, baselineCoverageMeter, opportunityRangeBar, gapClosureQueue,
// valueVsEffortSummary + types.
export * from "@/lib/programs/expert-kernel/exports/board-grade/svg-charts";
