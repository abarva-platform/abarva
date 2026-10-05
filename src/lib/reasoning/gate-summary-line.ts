/**
 * gate-summary-line — the Explain drawer's gate headline, and the only place
 * its counts are derived.
 *
 * WHY THIS MODULE EXISTS
 *
 * The drawer's summary bar used to render
 *
 *     Gates: {gatesSummary.met} of {gatesSummary.total} met · {unmet} unmet
 *
 * straight off `SynthesisContext.gatesSummary`, above a body that lists every
 * gate criterion at every stage grouped by stage. Four things were wrong with
 * that line at once, and they are independent of each other:
 *
 *  1. THE SET. `gatesSummary` is built from
 *     `evaluator.evaluateStage(currentStage, …)` — the CURRENT stage only —
 *     while the drawer body is built from `evaluateAllStages(…).flatMap(…)`.
 *     So the headline's denominator counted a subset of the list it headed,
 *     and said nothing about which. On any pattern with more than one stage
 *     the two disagree for every reader, with no fixture required.
 *
 *  2. `partial` WAS REPORTED AS UNMET. The builders compute
 *     `unmet: total - metCount`, so every status that is not met-or-waived
 *     lands in `unmet`. A criterion the evaluator scored `partial` (it returns
 *     `'partial'` whenever evidence keys keyword-match the criterion
 *     description — a live path on real evidence) was counted as unmet in the
 *     headline while the body rendered it amber and labelled it partial.
 *
 *  3. `waived` WAS REPORTED AS MET. `metCount` is
 *     `status === 'met' || status === 'waived'`, so a criterion deliberately
 *     bypassed by an authorised user was counted as proven. That is the one
 *     claim this product may never make: a waiver records that nobody checked,
 *     and the drawer exists to show an auditor what was actually established.
 *     (Reachability today: only an evidence map carrying the evaluator's
 *     `<criterionId>_waived` sentinel produces this status; the operated
 *     waiver route keeps its own store and does not feed the evaluator. So
 *     this one is corrected as construction, not as a reading a client is
 *     being shown — see the release record.)
 *
 *  4. THE NOUN. `Gates:` is a fixed plural welded to a figure whose `1` is
 *     reachable — one program context builder constructs `total: 1`
 *     literally — so `Gates: 1 of 1 met` could render. The noun now lives
 *     inside the line and agrees with the figure it counts.
 *
 * The fix is the same one this surface family keeps needing: derive the figure
 * from the set the body renders, and make the line say what it counted. Every
 * count here is a partition of one status list, so the clauses always sum to
 * the total and the headline can never contradict the rows beneath it.
 *
 * NOT CHANGED: `SynthesisContext.gatesSummary` keeps its meaning exactly —
 * its `met` is "cleared for advancement" (met OR waived), which is the right
 * question for the provenance ribbon and the health board, and they still ask
 * it. The drawer asks a different question — what was established — and that
 * is why it may not reuse the same number.
 */

import type { GateEvaluation } from "./types";

/**
 * A partition of one gate-status list. `met + partial + waived + unmet`
 * always equals `total`, because every count is taken from the same array and
 * `GateStatus` has exactly these four members.
 */
export interface GateStatusCounts {
  readonly total: number;
  /** Strictly `status === 'met'`. Never includes a waiver. */
  readonly met: number;
  readonly partial: number;
  readonly waived: number;
  readonly unmet: number;
}

/**
 * Count one gate-status list by status. Takes the evaluations the caller is
 * also rendering, so the figure and the list cannot drift apart.
 */
export function countGateStatuses(
  evaluations: ReadonlyArray<Pick<GateEvaluation, "status">>,
): GateStatusCounts {
  let met = 0;
  let partial = 0;
  let waived = 0;
  let unmet = 0;
  for (const evaluation of evaluations) {
    switch (evaluation.status) {
      case "met":
        met += 1;
        break;
      case "partial":
        partial += 1;
        break;
      case "waived":
        waived += 1;
        break;
      default:
        unmet += 1;
        break;
    }
  }
  return { total: evaluations.length, met, partial, waived, unmet };
}

/** Agree the criterion noun with the figure it is attached to. */
export function gateCriterionNoun(count: number): "criterion" | "criteria" {
  return count === 1 ? "criterion" : "criteria";
}

/**
 * The drawer's gate headline. States the noun it counts, reports only
 * strictly-met criteria as met, and names every other status that is present
 * so the clauses reconcile to the total.
 */
export function buildGateSummaryLine(counts: GateStatusCounts): string {
  if (counts.total === 0) return "No gate criteria evaluated";

  const clauses = [
    `${counts.met} of ${counts.total} gate ${gateCriterionNoun(counts.total)} met`,
  ];
  if (counts.partial > 0) clauses.push(`${counts.partial} partial`);
  if (counts.waived > 0) clauses.push(`${counts.waived} waived, not met`);
  if (counts.unmet > 0) clauses.push(`${counts.unmet} unmet`);
  return clauses.join(" · ");
}
