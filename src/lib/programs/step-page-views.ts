/**
 * The step pages that exist under `moves_step_pages_v3`, by the `?step=`
 * value that opens each one. One map, so the phase page parses the query
 * and every step page links to its siblings from the same source; a step
 * without a page links to the phase. A view may need a flag of its own as
 * well: `rom-estimate` (P3 Step 4) mounts only with `moves_rom_engine_v1`.
 */

export const STEP_PAGE_VIEWS = {
  "p0-signal": { phase: 0, stepId: "P0.1" },
  "p0-scope": { phase: 0, stepId: "P0.2" },
  "p0-value": { phase: 0, stepId: "P0.3" },
  "p0-owner-evidence": { phase: 0, stepId: "P0.4" },
  "p0-approve": { phase: 0, stepId: "P0.5" },
  "p1-sponsor-scope": { phase: 1, stepId: "P1.1" },
  "p1-stakeholders": { phase: 1, stepId: "P1.2" },
  "p1-success": { phase: 1, stepId: "P1.3" },
  "p1-evidence-change": { phase: 1, stepId: "P1.4" },
  "p1-charter-gate": { phase: 1, stepId: "P1.5" },
  "p2-evidence-plan": { phase: 2, stepId: "P2.1" },
  "p2-baseline": { phase: 2, stepId: "P2.2" },
  "root-causes": { phase: 2, stepId: "P2.3" },
  "p2-validate": { phase: 2, stepId: "P2.4" },
  "p2-gate": { phase: 2, stepId: "P2.5" },
  "root-cause-design": { phase: 3, stepId: "P3.1" },
  "architecture-options": { phase: 3, stepId: "P3.2" },
  "operating-adoption": { phase: 3, stepId: "P3.3" },
  "rom-estimate": { phase: 3, stepId: "P3.4" },
  gate: { phase: 3, stepId: "P3.5" },
  "p4-milestones": { phase: 4, stepId: "P4.1" },
  "p4-estimate": { phase: 4, stepId: "P4.2" },
  "p4-value": { phase: 4, stepId: "P4.3" },
  "p4-tower": { phase: 4, stepId: "P4.4" },
  "p4-gate": { phase: 4, stepId: "P4.5" },
  "p5-owners": { phase: 5, stepId: "P5.1" },
  "p5-measurement": { phase: 5, stepId: "P5.2" },
  "p5-first-90": { phase: 5, stepId: "P5.3" },
  "p5-handoff": { phase: 5, stepId: "P5.4" },
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
