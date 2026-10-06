// Phase top-stepper state label — what the figure under each phase name COUNTS.
//
// The phase workspace stacks two six-phase strips within ~200px of each other:
// this top stepper, and (behind `moves_capture_v2`) the capture strip, whose
// rows read "11 questions" / "0 of 7 answered". The stepper's own figure used
// to render as a bare `${met} of ${total}` — no noun anywhere, not in the
// visible `<small>` and not in the `title` tooltip. A reader has nothing on
// screen to tell the two strips apart, so a stepper reading "3 of 3" above a
// capture row reading "11 questions" looks like a contradiction about the same
// phase. It is not: the stepper counts GATE CRITERIA (`getMovePhaseTallies`,
// scoped to hard-severity rules from the canonical `gateCriteriaForPhase`
// catalog), the capture strip counts capture questions. The fix is to say so.
//
// Pluralisation is load-bearing, not polish: `total` reaches 1 (a phase whose
// hard-scoped rule set is a single criterion, and the current phase's live
// `scoped.length`), and a figure joined to a fixed plural noun is the defect
// class this workstream has already hit on the portfolio reconciliation strip
// ("1 programmes"). Agree the noun with the count.

import type { PhaseTallyRow } from "./phase-explorer-tallies";

export type PhaseStepperState = "done" | "current" | "up";

export function gateCriteriaNoun(total: number): string {
  return total === 1 ? "gate criterion" : "gate criteria";
}

/**
 * The label rendered under a phase name in the top stepper.
 *
 * With a tally the figure states what it counts. Without one it falls back to
 * the phase's own state word — that branch is unreachable from the product
 * today (`getMovePhaseTallies` emits a row for every phase 0..TOTAL_PHASES-1,
 * and the stepper walks the same six), so it is defensive only and is NOT
 * claimed as a fixed defect. It is kept because the component takes
 * `phaseTallies` as a prop and a caller could pass a short list.
 */
export function phaseStepperStateLabel(
  tally: Pick<PhaseTallyRow, "met" | "total"> | undefined,
  state: PhaseStepperState,
): string {
  if (tally) {
    return `${tally.met} of ${tally.total} ${gateCriteriaNoun(tally.total)}`;
  }
  if (state === "done") return "Complete";
  if (state === "current") return "In progress";
  return "Upcoming";
}
