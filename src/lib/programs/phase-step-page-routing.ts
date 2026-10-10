import { resolvePhaseWorkflow } from "@/lib/programs/phase-workflow-registry";
import {
  STEP_PAGE_VIEWS,
  type StepPageView,
} from "@/lib/programs/step-page-views";
import type { ConfirmedSolutionRoute } from "@/lib/programs/solution-route-assessment";

export const EXISTING_STEP_PAGE_VIEWS: readonly StepPageView[] = [
  "root-causes",
  "root-cause-design",
  "architecture-options",
  "gate",
];

export function phaseStepPageFlagEnabled(
  phase: number,
  flags: {
    captureV2: boolean;
    stepPagesV3: boolean;
    p0p1: boolean;
    p4p5: boolean;
  },
): boolean {
  if (!flags.captureV2 || !flags.stepPagesV3) return false;
  if (phase <= 1) return flags.p0p1;
  if (phase >= 4) return flags.p4p5;
  return true;
}

export function availableStepPageView(
  phase: number,
  stepId: string,
  implementedViews: readonly StepPageView[],
): StepPageView | null {
  return (
    implementedViews.find((view) => {
      const entry = STEP_PAGE_VIEWS[view];
      return entry.phase === phase && entry.stepId === stepId;
    }) ?? null
  );
}

export function phaseStepPageHref(
  moveId: string,
  phase: number,
  stepId: string,
  sectionKeys: readonly string[],
  implementedViews: readonly StepPageView[],
): string {
  const base = `/strategic-moves/${encodeURIComponent(moveId)}/phase/${phase}`;
  const view = availableStepPageView(phase, stepId, implementedViews);
  if (view) return `${base}?step=${view}`;
  // A missing page points at only its own capture section during transition.
  const section = sectionKeys[0];
  return section ? `${base}?section=${encodeURIComponent(section)}` : base;
}

/** A full phase switches only when every declared step has a real page. */
export function resolvePhaseStepPageLanding(input: {
  moveId: string;
  phase: number;
  route: ConfirmedSolutionRoute | null;
  implementedViews: readonly StepPageView[];
  doneByStep: Readonly<Record<string, boolean>>;
  enabled: boolean;
  legacy: boolean;
  requestedView: StepPageView | null;
}): string | null {
  if (!input.enabled || input.legacy || input.requestedView) return null;
  const steps = resolvePhaseWorkflow(input.phase, input.route);
  if (
    steps.length === 0 ||
    steps.some(
      (step) =>
        !availableStepPageView(input.phase, step.id, input.implementedViews),
    )
  ) {
    return null;
  }
  const firstOpen = steps.find((step) => !input.doneByStep[step.id]);
  const target = firstOpen ?? steps[steps.length - 1];
  return phaseStepPageHref(
    input.moveId,
    input.phase,
    target.id,
    target.sectionKeys,
    input.implementedViews,
  );
}
