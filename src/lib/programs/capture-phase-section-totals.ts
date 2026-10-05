import { getPhaseCaptureSections } from "@/lib/programs/phase-capture-contract";
import type { ConfirmedSolutionRoute } from "@/lib/programs/solution-route-assessment";

/**
 * How many capture sections a phase asks for, derived with the SAME inputs the
 * capture surface itself uses.
 *
 * P3 Design is the only phase whose question set depends on a Move-level fact:
 * once a solution route is confirmed, `getPhaseCaptureSections` returns a
 * narrower set for a technical-product route and a wider one for a limited
 * process change. Every figure that states a phase's total therefore has to pass
 * the route, or it reports the default set's size for a phase that is not asking
 * that set — and a row whose answered count comes from the route-aware set can
 * then exceed, or never reach, its own total.
 *
 * The route is a property of the Move, not of the phase on screen, so the same
 * value is correct for every row of a per-phase strip.
 */
export function capturePhaseSectionTotal(
  phase: number,
  confirmedSolutionRoute?: ConfirmedSolutionRoute | null,
): number {
  return getPhaseCaptureSections(phase, confirmedSolutionRoute).length;
}

/**
 * True when this phase's total would be misstated by omitting the route — i.e.
 * the route-aware set and the default set differ in size. Exposed so a test can
 * assert that at least one phase actually discriminates; a fix whose inputs are
 * never consulted is indistinguishable from the bug it replaces.
 */
export function capturePhaseTotalDependsOnRoute(
  phase: number,
  confirmedSolutionRoute?: ConfirmedSolutionRoute | null,
): boolean {
  return (
    capturePhaseSectionTotal(phase, confirmedSolutionRoute) !==
    capturePhaseSectionTotal(phase, null)
  );
}
