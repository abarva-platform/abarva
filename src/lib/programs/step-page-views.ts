/**
 * The step pages that exist under `moves_step_pages_v3`, by the `?step=`
 * value that opens each one. One map, so the phase page parses the query
 * and every step page links to its siblings from the same source; a step
 * without a page links to the phase.
 */

export const STEP_PAGE_VIEWS = {
  "root-causes": { phase: 2, stepId: "P2.3" },
  "root-cause-design": { phase: 3, stepId: "P3.1" },
  "architecture-options": { phase: 3, stepId: "P3.2" },
  "operating-adoption": { phase: 3, stepId: "P3.3" },
  gate: { phase: 3, stepId: "P3.5" },
} as const satisfies Record<string, { phase: number; stepId: string }>;

export type StepPageView = keyof typeof STEP_PAGE_VIEWS;

export function parseStepPageView(
  raw: string | string[] | undefined,
): StepPageView | null {
  return typeof raw === "string" && Object.hasOwn(STEP_PAGE_VIEWS, raw)
    ? (raw as StepPageView)
    : null;
}

/** The step's own page when it has one, otherwise the phase. */
export function stepPageHref(
  moveId: string,
  phase: number,
  stepId: string,
): string {
  const base = `/strategic-moves/${moveId}/phase/${phase}`;
  const view = (Object.keys(STEP_PAGE_VIEWS) as StepPageView[]).find(
    (v) =>
      STEP_PAGE_VIEWS[v].phase === phase &&
      STEP_PAGE_VIEWS[v].stepId === stepId,
  );
  return view ? `${base}?step=${view}` : base;
}
