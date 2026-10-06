/**
 * How many of a phase's capture questions have a SAVED ANSWER, for the five
 * rows of the capture flow's phase strip that the screen cannot measure.
 *
 * ## Why this exists
 *
 * The strip renders one row per phase, but the host holds live capture values
 * for exactly one phase: the one on screen. `capturePhaseAnsweredCount` is
 * therefore right to return `null` for every other row — advancing past a
 * phase does not answer it, and a row that claims a count it never measured is
 * the failure mode this product treats as most serious.
 *
 * The cost of that correction is that five of six rows state only a question
 * count, so a person stepping through the flow never sees the work behind them.
 * Closing that needed "a persisted rollup, or six section reads" — and it turns
 * out the host already holds the rows. `getModuleState(ctx, moveId)` returns
 * EVERY `program_modules` row for the Move, and the phase route then filters to
 * the viewed phase and discards the rest. So the other five phases' saved
 * answers are already in hand, at no extra read.
 *
 * ## What this counts, and what it deliberately does not
 *
 * A saved answer is a persisted non-empty string for the section's module row.
 * That is STRICTLY WEAKER than the "answered" the viewed row shows, which comes
 * from `phaseCaptureStatusForSection` and additionally requires structured
 * validity, evidence readiness, and — on P1 — a satisfied charter basis. A
 * section can hold a saved answer and still not be complete.
 *
 * So this count is NOT the viewed row's count under another name, and the two
 * must never be rendered as the same noun. The caller keeps them apart:
 *
 *   - the viewed row keeps its live measured `answered`, and only it may draw a
 *     completion tick;
 *   - an unmeasured row may state `savedAnswers` under its own noun, and
 *     claims no completion.
 *
 * Collapsing the two would relabel saved work as finished work, which is the
 * same over-claim #9003 removed, reintroduced from the other direction.
 */

import {
  getPhaseCaptureSections,
  phaseCaptureModuleKey,
} from "@/lib/programs/phase-capture-contract";
import type { ConfirmedSolutionRoute } from "@/lib/programs/solution-route-assessment";

/** The slice of a `program_modules` row this derivation needs. */
export type CaptureModuleStateRow = {
  moduleKey: string;
  state?: Record<string, unknown> | null;
};

/** Phase (0-5) to the number of its questions holding a saved answer. */
export type CapturePhaseSavedAnswerCounts = Readonly<Record<number, number>>;

const CAPTURE_PHASES = [0, 1, 2, 3, 4, 5] as const;

/**
 * True when a module row holds a persisted, non-empty answer.
 *
 * Mirrors the host's own hydration rule — `typeof value === "string"` off
 * `state.value`, then trimmed — so a section the route would hydrate as blank
 * is not counted here. A whitespace-only value is not an answer; the capture
 * route trims both sides when it diffs values, so an untrimmed count here would
 * report a saved answer the product treats as absent.
 */
function hasSavedAnswer(row: CaptureModuleStateRow | undefined): boolean {
  const value = row?.state?.value;
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * The saved-answer count for every phase, from the module rows the host already
 * loaded for the whole Move.
 *
 * `route` is threaded because P3 is the only route-dependent phase: its section
 * list is 6, 7 or 8 long depending on the confirmed solution route, so a
 * route-blind derivation would count against the wrong question set. The route
 * is a Move-level fact, so one value is correct for all six phases.
 */
export function capturePhaseSavedAnswerCounts(
  rows: readonly CaptureModuleStateRow[],
  route: ConfirmedSolutionRoute | null,
): CapturePhaseSavedAnswerCounts {
  const byKey = new Map<string, CaptureModuleStateRow>();
  for (const row of rows) {
    if (typeof row?.moduleKey === "string") byKey.set(row.moduleKey, row);
  }
  const counts: Record<number, number> = {};
  for (const phase of CAPTURE_PHASES) {
    counts[phase] = getPhaseCaptureSections(phase, route).filter((section) =>
      hasSavedAnswer(byKey.get(phaseCaptureModuleKey(phase, section.key))),
    ).length;
  }
  return counts;
}
