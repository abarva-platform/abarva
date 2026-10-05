/**
 * Count/noun agreement for the portfolio-index and deliverable-canvas figures.
 *
 * These are further instances of the figure class this workstream has been
 * sweeping: a count joined to a HARD-CODED plural noun, which can never agree
 * with its own figure. "1 deliverables complete" and "1 moves shown" are the
 * same construction error in two components.
 *
 * Each verdict below was COUNTED, not asserted, because the three figures are
 * NOT equally consequential:
 *
 *  - `formatDeliverableCanvasSummary` is USER-VISIBLE. It is consumed by
 *    ProgramDetailPage, and `buildDeliverableCanvasPolishView` refuses an
 *    EMPTY deliverable list (`deliverables.length === 0` returns null) while
 *    admitting a list of exactly one — so the singular case is reachable by
 *    construction, not hypothetically.
 *
 *  - `formatProgramsIndexFilterSummary` is CONSTRUCTION-ONLY today. It is
 *    consumed by ProgramsIndexPage, but the host passes
 *    `view.programs.length`, which the live catalog fixes at 3 for one tenant
 *    and 0 for the other. No catalog path yields a total of 1, so the singular
 *    branch is currently unreachable; it becomes user-visible the moment any
 *    tenant carries exactly one Move. Fixed on that basis.
 *
 *  - `formatWorkshopCoverageNote` is CONSTRUCTION-ONLY with no product
 *    consumer at all: `buildProgramHealthScorecard` and
 *    `buildProgramHealthSummary` are referenced only inside their own module
 *    and its suites. It must not be claimed as a wrong reading anyone saw.
 *
 * The noun agrees to the TOTAL, never to the numerator: "1 of 5 deliverables"
 * is correct and "1 of 5 deliverable" is not.
 */

import type { ProgramsIndexFilterKey } from "./programs-page-view";

export function agreeCountNoun(
  count: number,
  singular: string,
  plural: string,
): string {
  return count === 1 ? singular : plural;
}

/** "3 of 5 deliverables complete" · "1 of 1 deliverable complete" */
export function formatDeliverableCanvasSummary(
  doneCount: number,
  totalCount: number,
): string {
  const noun = agreeCountNoun(totalCount, "deliverable", "deliverables");
  return `${doneCount} of ${totalCount} ${noun} complete`;
}

/** "6 moves shown" · "4 of 6 moves shown · active filter" · "1 move shown" */
export function formatProgramsIndexFilterSummary(
  filter: ProgramsIndexFilterKey,
  visibleCount: number,
  totalCount: number,
): string {
  const noun = agreeCountNoun(totalCount, "move", "moves");
  if (filter === "all") return `${totalCount} ${noun} shown`;
  return `${visibleCount} of ${totalCount} ${noun} shown · ${filter} filter`;
}

/** "4 of 6 workshop categories covered across 12 library templates." */
export function formatWorkshopCoverageNote(
  coveredCategories: number,
  totalCategories: number,
  totalTemplates: number,
): string {
  const categoryNoun = agreeCountNoun(
    totalCategories,
    "workshop category",
    "workshop categories",
  );
  const templateNoun = agreeCountNoun(
    totalTemplates,
    "library template",
    "library templates",
  );
  return `${coveredCategories} of ${totalCategories} ${categoryNoun} covered across ${totalTemplates} ${templateNoun}.`;
}
