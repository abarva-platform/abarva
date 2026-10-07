/**
 * Which human decisions the P2 solution-route validation can actually offer.
 *
 * `resolveConfirmedSolutionRoute` returns `null` — no confirmed route — when
 * `decision === "confirm"` and `selectedRoute !== recommendation`. The
 * `SolutionRouteValidation` type excludes `"unresolved"` from `selectedRoute`,
 * so when `recommendSolutionRoute` resolves to `"unresolved"` that inequality
 * holds for EVERY storable value: confirming is arithmetically incapable of
 * producing a route, whatever the reviewer picks.
 *
 * That matters because `solution_route_validated` is `hard` in two consecutive
 * gates — P2 -> P3 and P3 -> P4 — and its third conjunct is
 * `confirmedSolutionRoute !== null` with no capture-text or deliverable
 * fallback. So a reviewer who confirms an unresolved recommendation is not
 * merely saving an incomplete answer; they are parked against a hard gate that
 * no later capture can clear, and the only exit is the other decision
 * (`"correct"`, which skips the equality check and takes the route plus a
 * rationale from the reviewer).
 *
 * The capture form offered "Confirm recommendation" unconditionally while
 * displaying the recommendation as "Not yet determined", and writing that
 * answer stored `selectedRoute: ""` — a record `parseSolutionRouteValidation`
 * rejects outright. Every select on the form was filled in, nothing on screen
 * objected, and the gate then reported the route as unvalidated without naming
 * the confirm/unresolved combination as the cause or `"correct"` as the way
 * out. `"unresolved"` is reachable from 4 of the 45 answer combinations the
 * form's own three selects can express (`solutionOutput: "mixed"` with
 * workflow and role impact both below `material`).
 *
 * This module is the single place that answers "can confirm work here?", so the
 * form, its notice, and any future surface read the same rule rather than
 * re-deriving it from the recommendation value.
 */
import type { SolutionRoute } from "@/lib/programs/solution-route-assessment";

export type SolutionRouteDecision = "confirm" | "correct";

export interface SolutionRouteDecisionChoice {
  value: SolutionRouteDecision;
  label: string;
}

const CONFIRM_CHOICE: SolutionRouteDecisionChoice = {
  value: "confirm",
  label: "Confirm recommendation",
};

const CORRECT_CHOICE: SolutionRouteDecisionChoice = {
  value: "correct",
  label: "Correct recommendation",
};

/**
 * Whether a `"confirm"` decision against this recommendation can ever yield a
 * confirmed route. False only for `"unresolved"` — see the module comment.
 */
export function canConfirmSolutionRouteRecommendation(
  recommendation: SolutionRoute,
): boolean {
  return recommendation !== "unresolved";
}

/** The decisions worth offering, in display order. */
export function solutionRouteDecisionChoices(
  recommendation: SolutionRoute,
): readonly SolutionRouteDecisionChoice[] {
  return canConfirmSolutionRouteRecommendation(recommendation)
    ? [CONFIRM_CHOICE, CORRECT_CHOICE]
    : [CORRECT_CHOICE];
}

/**
 * Why confirming is unavailable, for display next to the decision control, or
 * `null` when it is available. Names the cause and the exit, because the gate
 * this protects reports neither.
 */
export function solutionRouteConfirmUnavailableReason(
  recommendation: SolutionRoute,
): string | null {
  if (canConfirmSolutionRouteRecommendation(recommendation)) return null;
  return [
    "No route follows from this combination of solution output and current-state impact,",
    "so there is no recommendation to confirm.",
    "Record the route yourself with Correct recommendation and a rationale,",
    "or revise the solution output and impact answers above.",
  ].join(" ");
}
