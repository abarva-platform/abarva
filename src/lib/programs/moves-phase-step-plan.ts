import {
  getPhaseStepGroups,
  type PhaseStepGroup,
} from "@/lib/programs/moves-phase-step-groups";
import type { PhaseCaptureSection } from "@/lib/programs/phase-capture-contract";

/**
 * Which 3-step grouping the redesigned capture screens should use for a phase,
 * given the capture sections that phase ACTUALLY declares.
 *
 * `MOVES_PHASE_STEP_GROUPS` is one grouping per phase, written against the
 * phase's default section set. For P3 Design that is not the whole contract:
 * `getPhaseCaptureSections(3, confirmedSolutionRoute)` returns a DIFFERENT set
 * once P2 confirms a solution route —
 *
 * - `technical_product` replaces the operating-model and process-design
 *   questions with one `business_change_boundary` question;
 * - a `process_change` route with immaterial workflow AND role change replaces
 *   them with `workflow_delta`, `process_adoption_boundary` and
 *   `estimate_assumptions`.
 *
 * `MovesCaptureFlow` renders a step by mapping the group's keys through the
 * sections it was given and dropping the misses, so a route-blind grouping
 * fails twice over on those routes: the route's own required questions are
 * mounted NOWHERE (so `evaluatePhaseCapture` reports them missing for ever and
 * the phase can never be built), and the step that referenced the two dropped
 * keys renders as an empty panel — which is also the step a reload resumes to,
 * because a group whose keys do not all resolve can never read complete.
 *
 * So the grouping is resolved from the declared sections, not from the phase
 * number alone. Variants below are matched by key set rather than by route, so
 * this stays correct for any future route that re-shapes a phase, and the
 * repair path guarantees the property that matters even for a set no variant
 * anticipates: every declared question is reachable in some step, and no step
 * references a question the contract no longer declares.
 */

/**
 * How many steps the capture flow's step bar is shaped for.
 *
 * `MovesCaptureFlow` hardcodes this shape: it renders `Step {view + 1} of 3`,
 * treats `view === 2` as the step that offers Submit, and advances only while
 * `view < 2`. So a grouping with fewer steps than this does not merely look
 * wrong — it never reaches the step that submits the phase.
 *
 * Declared here, in the module that has to PRODUCE a plan of this shape, and
 * re-exported by `capture-step-plan-integrity.ts` (which audits the shape) so
 * the producer and the audit cannot drift apart.
 */
export const MOVES_CAPTURE_STEP_BAR_STEPS = 3;

/** How `resolvePhaseStepGroups` arrived at the grouping it returned. */
export type PhaseStepPlanBasis =
  /** The phase's default grouping already covers exactly the declared keys. */
  | "default"
  /** A declared route variant matched the declared keys exactly. */
  | "variant"
  /** No grouping matched; the default was repaired to cover the declared keys. */
  | "repaired";

export interface PhaseStepPlan {
  groups: readonly PhaseStepGroup[];
  basis: PhaseStepPlanBasis;
  /** Keys a candidate grouping referenced that the contract does not declare. */
  droppedKeys: readonly string[];
  /**
   * Declared keys no candidate grouping referenced. Appended to the last step,
   * or — when there was no grouping to repair at all — carried by the steps
   * `synthesizeSteps` produced for them.
   */
  appendedKeys: readonly string[];
}

/**
 * Route-shaped groupings for P3 Design, keyed by nothing — each is matched
 * against the declared key set. The copy is editorial, exactly as in
 * `MOVES_PHASE_STEP_GROUPS`; the keys are the contract's.
 */
const P3_ROUTE_STEP_GROUPS: readonly (readonly PhaseStepGroup[])[] = [
  // `technical_product`: the technical team designs and estimates the product;
  // a named business owner carries training, adoption and any later process
  // change. No operating-model or process design is asked for.
  [
    {
      title: "The approach",
      intro: "The options you weighed and the one you'd back.",
      sectionKeys: ["solution_approach", "recommendation"],
    },
    {
      title: "Where the change lands",
      intro: "The boundary: what this build covers, and who owns adoption.",
      sectionKeys: ["business_change_boundary"],
    },
    {
      title: "Make it safe & real",
      intro: "The controls, the architecture, and how sure you are.",
      sectionKeys: [
        "controls_governance",
        "architecture_integration",
        "evidence_confidence",
      ],
    },
  ],
  // A `process_change` route whose workflow AND role impact are both
  // immaterial: capture the delta and the sizing inputs, not a full redesign.
  [
    {
      title: "The approach",
      intro: "The options you weighed and the one you'd back.",
      sectionKeys: ["solution_approach", "recommendation"],
    },
    {
      title: "What changes for people",
      intro: "Only the steps that move, and who owns the adoption.",
      sectionKeys: ["workflow_delta", "process_adoption_boundary"],
    },
    {
      title: "Make it safe & real",
      intro: "The controls, the architecture, and what P4 still has to size.",
      sectionKeys: [
        "controls_governance",
        "architecture_integration",
        "evidence_confidence",
        "estimate_assumptions",
      ],
    },
  ],
];

function routeVariantsForPhase(
  phase: number,
): readonly (readonly PhaseStepGroup[])[] {
  return phase === 3 ? P3_ROUTE_STEP_GROUPS : [];
}

function referencedKeys(groups: readonly PhaseStepGroup[]): string[] {
  return groups.flatMap((group) => [...group.sectionKeys]);
}

function coversExactly(
  groups: readonly PhaseStepGroup[],
  declared: readonly string[],
): boolean {
  const referenced = referencedKeys(groups);
  if (referenced.length !== declared.length) return false;
  const declaredSet = new Set(declared);
  const referencedSet = new Set(referenced);
  if (referencedSet.size !== referenced.length) return false;
  for (const key of declaredSet) if (!referencedSet.has(key)) return false;
  return true;
}

/**
 * Repair a grouping against the declared keys: drop references the contract no
 * longer declares, then append any declared key nothing referenced to the LAST
 * step, in contract order. The step COUNT is preserved — the flow's step bar
 * and its `initialStep` are three-step shaped — and a step emptied by the drop
 * keeps its place rather than silently renumbering the others.
 */
/**
 * A grouping for a phase that declares questions but has no step copy at all.
 *
 * Exactly `MOVES_CAPTURE_STEP_BAR_STEPS` steps, because the flow cannot submit
 * a phase with fewer, carrying the declared keys in contract order and spread
 * as evenly as the count allows. The copy is deliberately plain rather than
 * invented editorial: `basis` is `repaired` and `appendedKeys` lists every key,
 * so the condition stays observable and reads as what it is — a phase whose
 * step copy was never written.
 *
 * Where the two invariants cannot both hold (fewer declared keys than steps)
 * the step COUNT wins: a trailing step holding nothing is vacuously complete
 * (see `capture-step-resume.ts`) and the phase can still be submitted, whereas
 * a short grouping can never reach Submit.
 */
function synthesizeSteps(keys: readonly string[]): PhaseStepGroup[] {
  const steps = MOVES_CAPTURE_STEP_BAR_STEPS;
  const base = Math.floor(keys.length / steps);
  const remainder = keys.length % steps;
  const groups: PhaseStepGroup[] = [];
  let at = 0;
  for (let index = 0; index < steps; index += 1) {
    const size = base + (index < remainder ? 1 : 0);
    groups.push({
      title: `Capture (step ${index + 1} of ${steps})`,
      intro:
        "This phase has no written step copy yet, so its questions are grouped in the order the capture contract declares them.",
      sectionKeys: keys.slice(at, at + size),
    });
    at += size;
  }
  return groups;
}

function repair(
  groups: readonly PhaseStepGroup[],
  declared: readonly string[],
): { groups: readonly PhaseStepGroup[]; dropped: string[]; appended: string[] } {
  const declaredSet = new Set(declared);
  const seen = new Set<string>();
  const dropped: string[] = [];
  const kept: PhaseStepGroup[] = groups.map((group) => {
    const sectionKeys = group.sectionKeys.filter((key) => {
      if (!declaredSet.has(key) || seen.has(key)) {
        dropped.push(key);
        return false;
      }
      seen.add(key);
      return true;
    });
    return { ...group, sectionKeys };
  });
  const appended = declared.filter((key) => !seen.has(key));
  if (appended.length > 0) {
    if (kept.length > 0) {
      const last = kept[kept.length - 1];
      kept[kept.length - 1] = {
        ...last,
        sectionKeys: [...last.sectionKeys, ...appended],
      };
    } else {
      // There was no grouping to repair, so there is no last step to append
      // to. Appending to nothing used to leave `groups` EMPTY while still
      // REPORTING every declared key in `appendedKeys` — the repair claimed a
      // placement it had not made, and the flow rendered a blank three-step
      // shell: no question mounted, `groups[view]` undefined, so `stepComplete`
      // false and Continue disabled for ever, while `evaluatePhaseCapture`
      // read the same contract and went on requiring all of those answers.
      // That is precisely the lost-question failure this module exists to
      // prevent, so synthesize the steps instead of dropping the keys.
      kept.push(...synthesizeSteps(appended));
    }
  }
  return { groups: kept, dropped, appended };
}

/**
 * The grouping, and how it was reached. Exported so the condition is
 * observable: a `repaired` basis means the contract declared a question no
 * grouping anticipated, which is reachable but grouped without editorial copy.
 */
export function phaseStepPlan(
  phase: number,
  sections: readonly PhaseCaptureSection[],
): PhaseStepPlan {
  const declared = sections.map((section) => section.key);
  const fallback = getPhaseStepGroups(phase);

  if (coversExactly(fallback, declared)) {
    return { groups: fallback, basis: "default", droppedKeys: [], appendedKeys: [] };
  }
  for (const variant of routeVariantsForPhase(phase)) {
    if (coversExactly(variant, declared)) {
      return { groups: variant, basis: "variant", droppedKeys: [], appendedKeys: [] };
    }
  }
  const repaired = repair(fallback, declared);
  return {
    groups: repaired.groups,
    basis: "repaired",
    droppedKeys: repaired.dropped,
    appendedKeys: repaired.appended,
  };
}

/** The 3-step grouping to render for a phase, given its declared sections. */
export function resolvePhaseStepGroups(
  phase: number,
  sections: readonly PhaseCaptureSection[],
): readonly PhaseStepGroup[] {
  return phaseStepPlan(phase, sections).groups;
}
