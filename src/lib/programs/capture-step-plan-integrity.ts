// Does every capture question the contract declares actually reach a step of
// the capture flow the user is given?
//
// Two hand-maintained declarations have to agree for a Move to be able to
// advance at all:
//
//   • `phase-capture-contract.ts` declares WHICH questions a phase asks (and,
//     at P3, a different set per confirmed solution route); and
//   • `moves-phase-step-groups.ts` declares WHICH STEP each of those questions
//     is rendered on, as editorial copy keyed by the contract's own section
//     keys.
//
// `phaseStepPlan` already reconciles them and already reports how it got
// there — `basis` (`default` | `variant` | `repaired`), plus the keys it
// dropped and the keys it had to append. Its own doc comment says the basis is
// "exported so the condition is observable". Measured: `phaseStepPlan` has no
// caller outside its own module, and `resolvePhaseStepGroups` — the one thing
// the flow calls — returns `plan.groups` and discards all three signals. So
// nothing observes the condition, and nothing anywhere asserts the two files
// still agree.
//
// Why that matters more than it looks: a drift between these two declarations
// has already stalled the product end to end once. When the workspace's capture
// cards carried ad-hoc ids with zero overlap with the contract's keys, every
// Save persisted zero fields, the phase never evaluated complete, Approve never
// enabled, and no Move could pass its gate. The step plan is the same join,
// one layer up — a question no step holds is a question the user is never
// asked, while `evaluatePhaseCapture` reads the same contract and goes on
// requiring its answer.
//
// This module states the properties the capture flow depends on and that
// nothing checked, as an audit over the REAL contract rather than over a
// restated copy of it:
//
//   INV1  the grouping has exactly the number of steps the flow's step bar is
//         shaped for (see `MOVES_CAPTURE_STEP_BAR_STEPS`);
//   INV2  every declared question is held by exactly one step — none lost,
//         none asked twice;
//   INV3  no step holds a key the contract does not declare, and no step is
//         left holding nothing; and
//   INV4  the grouping anticipated the contract (`basis` is not `repaired`),
//         so no question was placed by repair, without editorial copy.
//
// Measured on the shipped declarations at the time of writing: ZERO defects
// across every phase the route parser serves and every confirmed-route
// configuration the route constants permit — P0-P5 all resolve on the
// `default` basis at three steps, and P3's two route variants resolve on the
// `variant` basis, with nothing dropped and nothing appended. This module adds
// no behaviour; it pins a property that is true today, has broken before, and
// had no guard.
//
// The phase list and the route configurations are both DERIVED, never typed
// out here: the phases come from the route parser that decides which phase
// pages the product serves, and the route configurations from the exported
// route and change-impact constants. A new phase or a new route value is
// therefore covered without editing this file.

import {
  getPhaseCaptureSections,
  type PhaseCaptureSection,
} from "@/lib/programs/phase-capture-contract";
import {
  phaseStepPlan,
  type PhaseStepPlan,
} from "@/lib/programs/moves-phase-step-plan";
import { parseStrategicMovePhaseNum } from "@/lib/programs/strategic-move-route-params";
import {
  CHANGE_IMPACT_LEVELS,
  SOLUTION_ROUTES,
  type ChangeImpactLevel,
  type ConfirmedSolutionRoute,
  type SolutionRoute,
} from "@/lib/programs/solution-route-assessment";

/**
 * How many steps the capture flow's step bar is shaped for.
 *
 * `MovesCaptureFlow` states this twice: its footer counts "Step N of 3", and
 * its `initialStep` is typed `0 | 1 | 2`. The submit action is keyed on
 * `view === 2` being the LAST capture step, so a grouping of a different
 * length would put Submit on the wrong screen — or on no screen.
 */
export const MOVES_CAPTURE_STEP_BAR_STEPS = 3;

export type CaptureStepPlanDefectKind =
  /** INV1 — the grouping is not the length the step bar is shaped for. */
  | "step_count_off_flow_shape"
  /** INV2 — a declared question that no step holds: never asked. */
  | "question_in_no_step"
  /** INV2 — a declared question more than one step holds: asked twice. */
  | "question_in_many_steps"
  /** INV3 — a step holds a key the contract does not declare. */
  | "step_holds_undeclared_question"
  /** INV3 — a step holds nothing: an empty screen to click through. */
  | "step_holds_no_question"
  /** INV4 — the grouping did not anticipate the contract; repair placed keys. */
  | "grouping_did_not_anticipate_contract";

export interface CaptureStepPlanDefect {
  kind: CaptureStepPlanDefectKind;
  phase: number;
  /** Which route configuration this plan was resolved for, for the report. */
  routeLabel: string;
  /** The section keys or step titles the defect is about. */
  subjects: readonly string[];
  basis: PhaseStepPlan["basis"];
}

export interface CaptureRouteConfiguration {
  label: string;
  route: ConfirmedSolutionRoute | null;
}

/**
 * A confirmed route carrying the three fields `getPhaseCaptureSections`
 * discriminates on. The remaining fields of `ConfirmedSolutionRoute` are
 * required by its type but are not read by the section resolver, so they carry
 * neutral placeholder values and no judgement is implied by them.
 */
function confirmedRouteFixture(
  route: Exclude<SolutionRoute, "unresolved">,
  workflowChange: Exclude<ChangeImpactLevel, "unknown">,
  roleAccountabilityChange: Exclude<ChangeImpactLevel, "unknown">,
): ConfirmedSolutionRoute {
  return {
    route,
    recommendation: route,
    solutionOutput: "data_product",
    workflowChange,
    roleAccountabilityChange,
    adoptionOwner: "audit placeholder",
    adoptionResponsibility: "shared",
    decision: "confirm",
    evidenceReference: "audit placeholder",
    validatedBy: "audit placeholder",
    rationale: "audit placeholder",
  };
}

/**
 * Every confirmed-route configuration the exported constants permit, plus the
 * no-confirmed-route case. Derived from `SOLUTION_ROUTES` and
 * `CHANGE_IMPACT_LEVELS` rather than listed, so a new route value or impact
 * level is audited without a change here.
 */
export function captureRouteConfigurations(): readonly CaptureRouteConfiguration[] {
  const configurations: CaptureRouteConfiguration[] = [
    { label: "no confirmed route", route: null },
  ];
  const confirmableRoutes = SOLUTION_ROUTES.filter(
    (route): route is Exclude<SolutionRoute, "unresolved"> =>
      route !== "unresolved",
  );
  const assessableLevels = CHANGE_IMPACT_LEVELS.filter(
    (level): level is Exclude<ChangeImpactLevel, "unknown"> =>
      level !== "unknown",
  );
  for (const route of confirmableRoutes) {
    for (const workflowChange of assessableLevels) {
      for (const roleAccountabilityChange of assessableLevels) {
        configurations.push({
          label: `${route} · workflow ${workflowChange} · role ${roleAccountabilityChange}`,
          route: confirmedRouteFixture(
            route,
            workflowChange,
            roleAccountabilityChange,
          ),
        });
      }
    }
  }
  return configurations;
}

/**
 * The phases whose capture flow is audited: the ones the route parser accepts,
 * which is the single declaration of which phase pages the product serves. A
 * phase it rejects cannot be reached, so auditing it would assert a property of
 * a screen nobody can open.
 *
 * Probed rather than read, because the parser states the range as a comparison
 * and not as a list. The upper bound only has to exceed any phase the product
 * could serve; the parser decides what is in.
 */
const PHASE_PROBE_CEILING = 24;

export function auditedCapturePhases(): readonly number[] {
  const phases: number[] = [];
  for (let candidate = 0; candidate <= PHASE_PROBE_CEILING; candidate += 1) {
    if (parseStrategicMovePhaseNum(String(candidate)) !== null) {
      phases.push(candidate);
    }
  }
  return phases;
}

/** Audit ONE resolved plan against the questions its phase declares. */
export function auditCaptureStepPlan(input: {
  phase: number;
  routeLabel: string;
  sections: readonly PhaseCaptureSection[];
  plan: PhaseStepPlan;
  stepBarSteps?: number;
}): CaptureStepPlanDefect[] {
  const stepBarSteps = input.stepBarSteps ?? MOVES_CAPTURE_STEP_BAR_STEPS;
  const { phase, routeLabel, sections, plan } = input;
  const basis = plan.basis;
  const at = (
    kind: CaptureStepPlanDefectKind,
    subjects: readonly string[],
  ): CaptureStepPlanDefect => ({ kind, phase, routeLabel, subjects, basis });

  const defects: CaptureStepPlanDefect[] = [];

  if (plan.groups.length !== stepBarSteps) {
    defects.push(
      at("step_count_off_flow_shape", [
        `${plan.groups.length} steps, flow is shaped for ${stepBarSteps}`,
      ]),
    );
  }

  // How many steps hold each key the grouping references. Counted over the
  // resolved groups, which are what renders — not over the candidate grouping
  // the plan started from.
  const stepsHoldingKey = new Map<string, number>();
  for (const group of plan.groups) {
    for (const key of group.sectionKeys) {
      stepsHoldingKey.set(key, (stepsHoldingKey.get(key) ?? 0) + 1);
    }
    if (group.sectionKeys.length === 0) {
      defects.push(at("step_holds_no_question", [group.title]));
    }
  }

  const declaredKeys = sections.map((section) => section.key);
  const declared = new Set(declaredKeys);

  const unheld = declaredKeys.filter((key) => !stepsHoldingKey.has(key));
  if (unheld.length > 0) defects.push(at("question_in_no_step", unheld));

  const heldTwice = declaredKeys.filter(
    (key) => (stepsHoldingKey.get(key) ?? 0) > 1,
  );
  if (heldTwice.length > 0) {
    defects.push(at("question_in_many_steps", heldTwice));
  }

  const undeclared = [...stepsHoldingKey.keys()].filter(
    (key) => !declared.has(key),
  );
  if (undeclared.length > 0) {
    defects.push(at("step_holds_undeclared_question", undeclared));
  }

  if (basis === "repaired") {
    defects.push(
      at("grouping_did_not_anticipate_contract", [
        ...plan.droppedKeys.map((key) => `dropped ${key}`),
        ...plan.appendedKeys.map((key) => `appended ${key}`),
      ]),
    );
  }

  return defects;
}

export interface CaptureStepPlanAuditDeps {
  phases?: readonly number[];
  routeConfigurations?: readonly CaptureRouteConfiguration[];
  sectionsFor?: (
    phase: number,
    route: ConfirmedSolutionRoute | null,
  ) => readonly PhaseCaptureSection[];
  planFor?: (
    phase: number,
    sections: readonly PhaseCaptureSection[],
  ) => PhaseStepPlan;
  stepBarSteps?: number;
}

/**
 * Audit every phase the product serves, under every route configuration the
 * constants permit.
 *
 * A phase whose declared questions do not change with the route resolves the
 * same plan for every configuration, so configurations are DEDUPED per phase by
 * the declared key set. That keeps one drift from being reported dozens of
 * times, and — unlike auditing only P3 under routes — it needs no assumption
 * about which phases are route-sensitive: a phase that becomes route-sensitive
 * later is covered on its own.
 */
export function auditEveryCaptureStepPlan(
  deps: CaptureStepPlanAuditDeps = {},
): CaptureStepPlanDefect[] {
  const phases = deps.phases ?? auditedCapturePhases();
  const configurations =
    deps.routeConfigurations ?? captureRouteConfigurations();
  const sectionsFor = deps.sectionsFor ?? getPhaseCaptureSections;
  const planFor = deps.planFor ?? phaseStepPlan;

  const defects: CaptureStepPlanDefect[] = [];
  for (const phase of phases) {
    const seenKeySets = new Set<string>();
    for (const configuration of configurations) {
      const sections = sectionsFor(phase, configuration.route);
      const signature = sections.map((section) => section.key).join("\u0000");
      if (seenKeySets.has(signature)) continue;
      seenKeySets.add(signature);
      defects.push(
        ...auditCaptureStepPlan({
          phase,
          routeLabel: configuration.label,
          sections,
          plan: planFor(phase, sections),
          stepBarSteps: deps.stepBarSteps,
        }),
      );
    }
  }
  return defects;
}

/** One line per defect, for a CI failure message that names the drift. */
export function describeCaptureStepPlanDefects(
  defects: readonly CaptureStepPlanDefect[],
): string {
  if (defects.length === 0) return "No capture step-plan defects.";
  return defects
    .map(
      (defect) =>
        `P${defect.phase} [${defect.routeLabel}] ${defect.kind} (basis ${defect.basis}): ${defect.subjects.join(", ")}`,
    )
    .join("\n");
}
