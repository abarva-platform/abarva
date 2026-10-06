// Gate-criteria figure labels — the noun agrees with the count it is joined to.
//
// Why this module exists
// ----------------------
// Two gate surfaces build a client-visible figure by concatenating a count to a
// HARD-CODED PLURAL noun:
//
//   gate-ribbon-view.ts          `${metCriteria} of ${totalCriteria} criteria met`
//   gate-approval-drawer-view.ts `${metCount} of ${totalCount} criteria met`
//
// With a single criterion both read "1 of 1 criteria met". That is the same
// construction defect this workstream already fixed on the portfolio
// reconciliation strip ("1 programmes") and on the Originate promote bar
// ("1 of 1 answers captured"): a figure and a fixed noun that can disagree.
//
// It is also an INTERNAL INCONSISTENCY, which is what makes it worth fixing
// rather than leaving: `phaseStepperStateLabel` already agrees its noun for the
// very same underlying quantity, so the top stepper renders "1 of 1 gate
// criterion" while the ribbon below it renders "1 of 1 criteria met".
//
// Reachability — stated precisely, not over-claimed
// -------------------------------------------------
// `total === 1` is NOT reachable from the canonical gate catalog. Every rule in
// `GATE_RULES` carries more than one check (6/3/6/5/11/5 by `fromPhase`, and
// 3/2/6/3/5/4 once hard-scoped), and `buildUnverifiedGateCriteria` maps that
// catalog straight through. Both builders take `gateCriteria` off an already-
// built `ProgramDetailView`, whose fixture/demo paths assemble the array by
// hand, and both only refuse an EMPTY list — so a one-item list is admitted by
// the type and by the guard, but no live catalog path produces one today.
//
// This is therefore a defect of construction, fixed on that basis. It is NOT a
// demonstrated wrong reading on a live screen, and the release record says so.
//
// The plural branch is byte-identical to the previous string, so every existing
// multi-criterion assertion and every live multi-criterion screen is unchanged.

/** "criterion" for exactly one, "criteria" otherwise. */
export function gateCriterionNoun(total: number): string {
  return total === 1 ? "criterion" : "criteria";
}

/**
 * The gate summary line: "2 of 5 criteria met" / "1 of 1 criterion met".
 *
 * Rendered by ProgramDetailPage (the approval drawer) and carried into the
 * workspace-explorer projection via `source-progression.ts`.
 */
export function gateCriteriaMetSummary(met: number, total: number): string {
  return `${met} of ${total} ${gateCriterionNoun(total)} met`;
}

/**
 * The short criteria chip label: "2 of 5 criteria" / "1 of 1 criterion".
 *
 * The previous form was a BARE `${met} of ${total}` with no noun anywhere —
 * the same shape `phaseStepperStateLabel` was fixed for. Unlike the stepper
 * this helper has no product consumer today (only its own suite references
 * it), so the bare form is DIAGNOSED-NOT-A-LIVE-DEFECT: it is corrected here
 * so that wiring it up later cannot reintroduce a nounless figure, and it is
 * not claimed as a user-visible fix.
 */
export function gateCriteriaBadgeLabel(met: number, total: number): string {
  return `${met} of ${total} ${gateCriterionNoun(total)}`;
}
