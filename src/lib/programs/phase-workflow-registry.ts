import type { ConfirmedSolutionRoute } from "@/lib/programs/solution-route-assessment";

/**
 * The Moves phase workflow, declared once.
 *
 * Each phase runs the same small set of steps (the P2/P3 design packs define
 * five each). The use case decides how deep a step goes — "full", "light" or
 * "skip" — and that depth is derived from ONE change profile, read from the
 * solution route the consultant confirmed in P2.
 *
 * Before this registry the depth rule lived as an if/else inside
 * `getPhaseCaptureSections`, and a second, separate rule chose which documents
 * to build. Declaring the steps here gives capture (and, next, sessions,
 * documents and the gate) one answer to read. This first version reproduces
 * today's capture contract exactly — the parity tests pin that — so nothing a
 * consultant sees or a document receives changes yet.
 *
 * Depth means how fully a step is ASSESSED AND ESTIMATED, never executed:
 * Moves decides, sizes and justifies the work; execution delivers it. A skipped
 * step still leaves an attestation (the technical-product route's
 * `business_change_boundary` is exactly that).
 */

export type StepDepth = "full" | "light" | "skip";

/**
 * How much the Move changes the way people work, derived from the confirmed
 * route. This is the rule `getPhaseCaptureSections` applied inline before:
 * - technical: a technical product (reports, a data product) with no
 *   operating-model work to design;
 * - limited: a process change whose workflow AND role change are both below
 *   "material";
 * - full: everything else, including an unconfirmed route.
 */
export type ChangeProfile = "technical" | "limited" | "full";

export function resolveChangeProfile(
  route: ConfirmedSolutionRoute | null | undefined,
): ChangeProfile {
  if (route?.route === "technical_product") return "technical";
  if (
    route?.route === "process_change" &&
    route.workflowChange !== "material" &&
    route.roleAccountabilityChange !== "material"
  ) {
    return "limited";
  }
  return "full";
}

export interface PhaseWorkflowStep {
  /** Design-pack step id, e.g. "P3.3". */
  id: string;
  phase: 2 | 3;
  title: string;
  /** How deep this step goes for each change profile. */
  depth: Readonly<Record<ChangeProfile, StepDepth>>;
  /**
   * The capture section keys this step owns, per change profile. These keys
   * are the contract with document generation (`phaseCaptureContext` reads
   * captured values by key), so a step may only claim keys the capture
   * contract declares.
   */
  sectionKeys: Readonly<Record<ChangeProfile, readonly string[]>>;
}

const same = (
  keys: readonly string[],
): Record<ChangeProfile, readonly string[]> => ({
  technical: keys,
  limited: keys,
  full: keys,
});

const allFull: Record<ChangeProfile, StepDepth> = {
  technical: "full",
  limited: "full",
  full: "full",
};

const P2_STEPS: readonly PhaseWorkflowStep[] = [
  {
    id: "P2.1",
    phase: 2,
    title: "Evidence plan",
    depth: allFull,
    // Served by evidence readiness and the file cabinet, not a capture field.
    sectionKeys: same([]),
  },
  {
    id: "P2.2",
    phase: 2,
    title: "Baseline",
    depth: allFull,
    sectionKeys: same(["current_state_findings", "baseline_metrics"]),
  },
  {
    id: "P2.3",
    phase: 2,
    title: "Root causes",
    depth: allFull,
    sectionKeys: same([
      "gaps_root_causes",
      "process_handoffs",
      "data_quality_governance",
    ]),
  },
  {
    id: "P2.4",
    phase: 2,
    title: "Validate hypotheses",
    depth: allFull,
    sectionKeys: same(["solution_route_validation"]),
  },
  {
    id: "P2.5",
    phase: 2,
    title: "Gate readiness",
    depth: allFull,
    sectionKeys: same(["evidence_confidence", "recommendation"]),
  },
];

const P3_STEPS: readonly PhaseWorkflowStep[] = [
  {
    id: "P3.1",
    phase: 3,
    title: "Root cause → design",
    depth: { technical: "light", limited: "full", full: "full" },
    // No capture key yet: traceability exists only as the generated
    // Requirements Traceability Matrix. Tracked in KNOWN_CAPTURE_GAPS.
    sectionKeys: same([]),
  },
  {
    id: "P3.2",
    phase: 3,
    title: "Architecture options",
    depth: { technical: "light", limited: "full", full: "full" },
    sectionKeys: same([
      "solution_approach",
      "controls_governance",
      "architecture_integration",
      "recommendation",
    ]),
  },
  {
    id: "P3.3",
    phase: 3,
    title: "Operating & adoption",
    depth: { technical: "skip", limited: "light", full: "full" },
    sectionKeys: {
      technical: ["business_change_boundary"],
      limited: ["workflow_delta", "process_adoption_boundary"],
      full: ["operating_model", "process_design"],
    },
  },
  {
    id: "P3.4",
    phase: 3,
    title: "Delivery & estimate",
    depth: { technical: "light", limited: "full", full: "full" },
    // Only the limited route captures estimate assumptions today; the design
    // pack asks for them on every route. Tracked in KNOWN_CAPTURE_GAPS.
    sectionKeys: {
      technical: [],
      limited: ["estimate_assumptions"],
      full: [],
    },
  },
  {
    id: "P3.5",
    phase: 3,
    title: "Gate readiness",
    depth: allFull,
    sectionKeys: same(["evidence_confidence"]),
  },
];

const STEPS_BY_PHASE: Readonly<Record<number, readonly PhaseWorkflowStep[]>> = {
  2: P2_STEPS,
  3: P3_STEPS,
};

/**
 * Steps that should capture something at their depth but have no capture key
 * yet. Listed so the gap is visible and tested: a new empty step fails the
 * suite, and closing a gap requires removing its entry here.
 */
export const KNOWN_CAPTURE_GAPS: ReadonlyArray<{
  stepId: string;
  profiles: readonly ChangeProfile[];
  reason: string;
}> = [
  {
    stepId: "P2.1",
    profiles: ["technical", "limited", "full"],
    reason:
      "Evidence planning is served by evidence readiness, not a capture field.",
  },
  {
    stepId: "P3.1",
    profiles: ["technical", "limited", "full"],
    reason:
      "No root-cause-to-design traceability capture; only the generated matrix.",
  },
  {
    stepId: "P3.4",
    profiles: ["technical", "full"],
    reason: "Estimate assumptions are captured on the limited route only.",
  },
];

export interface ResolvedWorkflowStep {
  id: string;
  title: string;
  depth: StepDepth;
  sectionKeys: readonly string[];
}

/**
 * The steps of a phase as they apply to this Move. Returns an empty list for
 * a phase the registry does not model yet.
 */
export function resolvePhaseWorkflow(
  phase: number,
  route: ConfirmedSolutionRoute | null | undefined,
): ResolvedWorkflowStep[] {
  const profile = resolveChangeProfile(route);
  return (STEPS_BY_PHASE[phase] ?? []).map((step) => ({
    id: step.id,
    title: step.title,
    depth: step.depth[profile],
    sectionKeys: step.sectionKeys[profile],
  }));
}
