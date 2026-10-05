// Explanation-drawer gate figures — each figure names the set it counts.
//
// Why this module exists
// ----------------------
// The explanation drawer renders TWO gate figures, and before this module both
// were bare numbers under the same word "Gates":
//
//   SummaryBar   `Gates: {met} of {total} met`        (ExplainQuoteDrawer.tsx)
//   GatesSection `<SectionHeader title="Gates" count={totalRows} />`
//
// They count DIFFERENT SETS. `gateSummary.total` is the criterion count for the
// instance's CURRENT stage (`gateEvals.length` in each synthesis-context
// builder). `totalRows` is every criterion the surface carried into the trace,
// grouped by stage — on the source and programs surfaces that is
// `allStages.flatMap(s => s.gateEvaluations)`, i.e. ALL stages, and on the tower
// surface it is only `gatesSummary.blocked`, i.e. the blocked subset. So the two
// numbers can differ in either direction while reading as one quantity shown
// twice.
//
// Both defects are the same one this workstream has now fixed eleven times
// elsewhere: a count rendered without saying what it counts, or joined to a
// fixed noun it can disagree with.
//
// Reachability — stated precisely, not over-claimed
// -------------------------------------------------
// `ExplainQuotePill` mounts this drawer on three live surfaces (programs via
// `NexusSynthesisQuote`, source via `SentinelSynthesisQuote`, tower via
// `AtlasSynthesisQuote`), so both figures are user-visible wherever a synthesis
// quote finishes streaming.
//
// The SINGULAR branch of the summary line is reachable: the programs
// shape-only fallback (`buildShapeOnlyContext`, for an instance whose patternId
// is absent from PROGRAM_LIFECYCLE_PATTERNS) hard-codes `total: 1`, so that
// path rendered "Gates: 1 of 1 met" / "Gates: 0 of 1 met". The multi-criterion
// wording is unchanged apart from gaining its noun.

import {
  gateCriteriaMetSummary,
  gateCriterionNoun,
} from "@/lib/programs/gate-criteria-figure-labels";

/** The headline counts, as the serialized payload carries them. */
export interface ExplanationGateSummaryCounts {
  total: number;
  met: number;
  unmet: number;
}

/** One stage group, narrowed to the only field these figures read. */
export interface ExplanationGateRowGroup {
  rows: readonly unknown[];
}

/**
 * The drawer headline: "Gates: 2 of 5 criteria met · 3 unmet".
 *
 * Reuses `gateCriteriaMetSummary` so the noun agrees with the total here
 * exactly as it does on the gate ribbon and the approval drawer — one figure
 * contract for the same quantity across all three surfaces.
 */
export function explanationGateSummaryLine(
  summary: ExplanationGateSummaryCounts,
): string {
  const base = `Gates: ${gateCriteriaMetSummary(summary.met, summary.total)}`;
  return summary.unmet > 0 ? `${base} · ${summary.unmet} unmet` : base;
}

/**
 * The gates section count: "23 criteria · 4 stages" / "6 criteria · 1 stage".
 *
 * Naming the stage span is what stops this figure reading as the headline's
 * current-stage total. The stage count counts groups that actually carry rows,
 * because an empty group contributes nothing a reader can see.
 */
export function explanationGateRowsLabel(
  groups: readonly ExplanationGateRowGroup[],
): string {
  const rows = groups.reduce((acc, g) => acc + g.rows.length, 0);
  if (rows === 0) return `0 ${gateCriterionNoun(0)}`;
  const stages = groups.filter((g) => g.rows.length > 0).length;
  return `${rows} ${gateCriterionNoun(rows)} · ${stages} ${stages === 1 ? "stage" : "stages"}`;
}
