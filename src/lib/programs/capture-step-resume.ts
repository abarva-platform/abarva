/**
 * Which step of a 3-step capture phase the screen should resume to.
 *
 * `MovesCaptureFlow` opens on the first step whose saved answers are not
 * complete, and otherwise on the LAST step, because that is where the governed
 * approval action lives and arriving there is what keeps the decision explicit.
 *
 * The rule needs its own home because of what `moves-phase-step-plan.ts` does
 * on a `repaired` basis. Repair preserves the step COUNT on purpose — a step
 * whose keys the contract no longer declares keeps its place rather than
 * renumbering the others — so a repaired grouping can legitimately contain a
 * step that mounts NO questions. P3 Design is the live shape: its default step
 * two is exactly `operating_model` + `process_design`, and a solution route
 * that declares neither empties that step.
 *
 * An empty step is vacuously done: there is nothing on it to answer, so it can
 * never become complete and must never be the step the screen stops at. Before
 * this module the flow's resume rule counted it as incomplete while the flow's
 * own `stepComplete` counted it as complete — the two readings disagreed about
 * the same step, and the resume reading won, so a fully answered phase opened
 * on a blank panel with its approve action one unexplained Continue away.
 *
 * A step that references a question which is NOT mounted is a different case
 * and stays incomplete: the screen cannot show that question, so the step's
 * answers cannot be known. That reading is unreachable through
 * `resolvePhaseStepGroups`, which repairs exactly those references away before
 * the flow sees them; it is kept because it is the honest rule for any caller
 * that passes an unrepaired grouping, and no test of the flow can distinguish
 * its removal.
 */
export interface CaptureStepReadiness {
  /** Questions this step actually mounts (declared by the capture contract). */
  mounted: number;
  /** Questions this step references that are not mounted. */
  unmounted: number;
  /** Whether every mounted question reads complete. */
  allComplete: boolean;
}

/**
 * The index of the first step that still needs answers, or the last step when
 * none does. Returns 0 for a phase with no steps, which is the only index a
 * three-step shell can open on when it was given nothing to show.
 */
export function captureStepResumeIndex(
  steps: readonly CaptureStepReadiness[],
): number {
  const firstIncomplete = steps.findIndex(
    (step) =>
      step.unmounted > 0 || (step.mounted > 0 && !step.allComplete),
  );
  if (firstIncomplete >= 0) return firstIncomplete;
  return Math.max(steps.length - 1, 0);
}
