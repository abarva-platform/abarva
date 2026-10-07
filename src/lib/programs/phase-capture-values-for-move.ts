// phase-capture-values-for-move.ts
//
// The per-phase saved-answer map that aVa and the phase-input draft assist read,
// resolved against the capture set the Move was ACTUALLY asked for.
//
// `getPhaseCaptureSections(phase)` returns a phase's DEFAULT section list.
// P3 Design is not that list once P2 confirms a solution route
// (`getPhaseCaptureSections(3, confirmedSolutionRoute)`):
//
// - `technical_product` drops the operating-model and process-design questions
//   and adds `business_change_boundary`;
// - a `process_change` route with immaterial workflow AND role change drops the
//   same two and adds `workflow_delta`, `process_adoption_boundary` and
//   `estimate_assumptions`.
//
// Two readers built that map from the phase number alone, so on those routes they
// were wrong in both directions at once: the route's own question was never read
// (its saved answer invisible to aVa, and never counted as answered), while two
// questions the route deliberately dropped were read as permanently empty. The
// capture and gate-approval endpoints already resolve the route before reading
// sections; this module is the same resolution for the read-only paths, so the
// three of them cannot drift apart again.
//
// Pure: callers supply the saved-answer lookup and the approved P2 evidence ids.

import {
  getPhaseCaptureSections,
  phaseCaptureModuleKey,
} from "@/lib/programs/phase-capture-contract";
import {
  resolveConfirmedSolutionRoute,
  type ConfirmedSolutionRoute,
} from "@/lib/programs/solution-route-assessment";

/** The canonical Moves phases a capture map covers: P0 Originate → P5 Mobilize. */
export const PHASE_CAPTURE_PHASES: readonly number[] = [0, 1, 2, 3, 4, 5];

/** Saved answer for one capture section, or `""` when nothing is saved. */
export type PhaseCaptureModuleValue = (
  phase: number,
  sectionKey: string,
) => string;

/**
 * Build the saved-answer lookup from a module-state list, the same way the
 * capture and gate-approval endpoints do (`phaseCaptureModuleKey` + `state.value`).
 */
export function phaseCaptureModuleValueReader(
  modules: ReadonlyArray<{
    moduleKey: string;
    state?: Record<string, unknown> | null;
  }>,
): PhaseCaptureModuleValue {
  return (phase, sectionKey) => {
    const key = phaseCaptureModuleKey(phase, sectionKey);
    const row = modules.find((entry) => entry.moduleKey === key);
    const value = row?.state?.value;
    return typeof value === "string" ? value : "";
  };
}

/**
 * The Move's confirmed solution route, resolved from its own saved captures.
 *
 * The route is a P2 OUTPUT: it needs P1's business-change assessment, P2's route
 * validation, and that validation's evidence reference to be among the APPROVED
 * P2 evidence. Any of those missing resolves to `null`, which means "not yet
 * routed" — and `getPhaseCaptureSections(3, null)` is then correctly the full
 * default P3 set, not a narrowed one.
 */
export function resolveMoveConfirmedSolutionRoute(
  moduleValue: PhaseCaptureModuleValue,
  approvedPhaseTwoEvidenceIds: readonly string[],
): ConfirmedSolutionRoute | null {
  return resolveConfirmedSolutionRoute({
    businessChangeAssessment: moduleValue(1, "business_change_assessment"),
    routeValidation: moduleValue(2, "solution_route_validation"),
    approvedEvidenceReferences: approvedPhaseTwoEvidenceIds,
  });
}

/**
 * Saved answers per phase, keyed by the section keys that phase declares for
 * this Move. A section with nothing saved is present with `""` — callers count
 * empties to decide what is still open, so a missing key and an empty answer
 * must not be the same thing.
 */
export function phaseCaptureValuesByPhase(args: {
  moduleValue: PhaseCaptureModuleValue;
  confirmedSolutionRoute: ConfirmedSolutionRoute | null;
  phases?: readonly number[];
}): Record<number, Record<string, string>> {
  const byPhase: Record<number, Record<string, string>> = {};
  for (const phase of args.phases ?? PHASE_CAPTURE_PHASES) {
    const values: Record<string, string> = {};
    for (const section of getPhaseCaptureSections(
      phase,
      args.confirmedSolutionRoute,
    )) {
      values[section.key] = args.moduleValue(phase, section.key);
    }
    byPhase[phase] = values;
  }
  return byPhase;
}
