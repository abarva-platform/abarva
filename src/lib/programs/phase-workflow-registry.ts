import type { ConfirmedSolutionRoute } from "@/lib/programs/solution-route-assessment";

/**
 * The Moves phase workflow, declared once.
 *
 * Each phase declares its own small set of steps. The use case decides how
 * deep a step goes — "full", "light" or
 * "skip" — and that depth is derived from ONE change profile, read from the
 * solution route the consultant confirmed in P2.
 *
 * Before this registry the depth rule lived as an if/else inside
 * `getPhaseCaptureSections`, and a second, separate rule chose which documents
 * to build. Declaring the steps here gives capture (and, next, sessions,
 * documents and the gate) one answer to read. This first version reproduces
 * today's capture contract exactly — the parity tests pin that — so nothing a
 * consultant sees or a document receives changes outside the flagged step
 * pages.
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
  phase: 0 | 1 | 2 | 3 | 4 | 5;
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
  /**
   * Step-page records this step owns: structured answers a step page writes
   * through the capture route but that are not capture questions, so the
   * capture flow never asks them (see `PHASE_STEP_RECORD_SECTIONS`).
   */
  recordKeys?: Readonly<Record<ChangeProfile, readonly string[]>>;
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

const P0_STEPS: readonly PhaseWorkflowStep[] = [
  {
    id: "P0.1",
    phase: 0,
    title: "Signal & problem",
    depth: allFull,
    sectionKeys: same(["business_trigger", "problem_statement"]),
    recordKeys: same(["p0_signal_step"]),
  },
  {
    id: "P0.2",
    phase: 0,
    title: "Scope boundary",
    depth: allFull,
    sectionKeys: same(["affected_function_process", "scope_out"]),
    recordKeys: same(["p0_scope_step"]),
  },
  {
    id: "P0.3",
    phase: 0,
    title: "Value hypothesis",
    depth: allFull,
    sectionKeys: same([
      "initial_value_hypothesis",
      "outcomes_success",
      "discovery_questions",
    ]),
    recordKeys: same(["p0_value_step"]),
  },
  {
    id: "P0.4",
    phase: 0,
    title: "Owner & evidence",
    depth: allFull,
    sectionKeys: same([
      "stakeholder_owner_view",
      "known_evidence",
      "missing_evidence_open_questions",
    ]),
    recordKeys: same(["p0_owner_evidence_step"]),
  },
  {
    id: "P0.5",
    phase: 0,
    title: "Approve origination",
    depth: allFull,
    sectionKeys: same(["recommendation_to_advance"]),
  },
];

const P1_STEPS: readonly PhaseWorkflowStep[] = [
  {
    id: "P1.1",
    phase: 1,
    title: "Sponsor & scope",
    depth: allFull,
    sectionKeys: same(["sponsor_commitment", "scope_boundary"]),
    recordKeys: same(["p1_sponsor_scope_step"]),
  },
  {
    id: "P1.2",
    phase: 1,
    title: "Stakeholders & decision rights",
    depth: allFull,
    sectionKeys: same(["stakeholder_map", "decision_rights"]),
    recordKeys: same(["p1_stakeholders_step"]),
  },
  {
    id: "P1.3",
    phase: 1,
    title: "Success measures",
    depth: allFull,
    sectionKeys: same(["success_criteria"]),
    recordKeys: same(["p1_success_step"]),
  },
  {
    id: "P1.4",
    phase: 1,
    title: "Evidence plan & change",
    depth: allFull,
    sectionKeys: same(["evidence_plan", "business_change_assessment"]),
    recordKeys: same(["p1_evidence_change_step"]),
  },
  {
    id: "P1.5",
    phase: 1,
    title: "Charter & gate",
    depth: allFull,
    sectionKeys: same([]),
  },
];

const P4_STEPS: readonly PhaseWorkflowStep[] = [
  {
    id: "P4.1",
    phase: 4,
    title: "Workstreams & milestones",
    depth: allFull,
    sectionKeys: same(["roadmap_sequencing"]),
  },
  {
    id: "P4.2",
    phase: 4,
    title: "Estimate & capacity",
    depth: allFull,
    sectionKeys: same(["estimates_capacity"]),
  },
  {
    id: "P4.3",
    phase: 4,
    title: "Value plan & funding",
    depth: allFull,
    sectionKeys: same(["value_plan", "funding_governance"]),
  },
  {
    id: "P4.4",
    phase: 4,
    title: "Tower metrics & handoff plan",
    depth: allFull,
    sectionKeys: same(["handoff_plan"]),
  },
  {
    id: "P4.5",
    phase: 4,
    title: "Risks, readiness & gate",
    depth: allFull,
    sectionKeys: same(["risks_dependencies", "recommendation"]),
  },
];

const P5_STEPS: readonly PhaseWorkflowStep[] = [
  {
    id: "P5.1",
    phase: 5,
    title: "Handoff owners & readiness",
    depth: allFull,
    sectionKeys: same(["mobilization_plan", "launch_readiness"]),
  },
  {
    id: "P5.2",
    phase: 5,
    title: "Tower measurement",
    depth: allFull,
    sectionKeys: same(["value_proof_rules", "governance_cadence"]),
  },
  {
    id: "P5.3",
    phase: 5,
    title: "First 90 days & open items",
    depth: allFull,
    sectionKeys: same(["first_90_days", "risks_open_items"]),
  },
  {
    id: "P5.4",
    phase: 5,
    title: "Handoff package & acceptance",
    depth: allFull,
    sectionKeys: same(["recommendation"]),
  },
];

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
    // Not a capture question: the step page's structured record of each root
    // cause's design element (`design-traceability.ts`).
    sectionKeys: same([]),
    recordKeys: same(["design_traceability"]),
  },
  {
    id: "P3.2",
    phase: 3,
    title: "Architecture options",
    depth: { technical: "light", limited: "full", full: "full" },
    // The chosen option and its coverage of Step 1's design elements are a
    // step record (`architecture-choice.ts`); the rationale stays the
    // `recommendation` answer the approval route records.
    recordKeys: same(["architecture_choice"]),
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
    // The owners grid, the baseline owner, the drafts and who wrote them are
    // a step record (`operating-adoption.ts`); the team's words stay in the
    // capture answers below, which generation and the gate read.
    recordKeys: same(["operating_adoption"]),
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
    // The bottom-up ROM's inputs and its approved snapshot are a step record
    // (`rom-estimate.ts`) on every route; the limited route also keeps its
    // `estimate_assumptions` capture answer.
    sectionKeys: {
      technical: [],
      limited: ["estimate_assumptions"],
      full: [],
    },
    recordKeys: same(["rom_estimate"]),
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
  0: P0_STEPS,
  1: P1_STEPS,
  2: P2_STEPS,
  3: P3_STEPS,
  4: P4_STEPS,
  5: P5_STEPS,
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
    stepId: "P1.5",
    profiles: ["technical", "limited", "full"],
    reason:
      "The gate builds and signs the charter and discovery plan; it has no capture question.",
  },
  {
    stepId: "P2.1",
    profiles: ["technical", "limited", "full"],
    reason:
      "Evidence planning is served by evidence readiness, not a capture field.",
  },
];

export interface ResolvedWorkflowStep {
  id: string;
  title: string;
  depth: StepDepth;
  sectionKeys: readonly string[];
  recordKeys: readonly string[];
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
    recordKeys: step.recordKeys?.[profile] ?? [],
  }));
}

/** A structured answer a step page writes that is not a capture question. */
export interface PhaseStepRecordSection {
  key: string;
  stepId: string;
  label: string;
  description: string;
}

/**
 * Step-page records by phase. The capture route stores them beside the
 * phase's answers (same module table, same revision fence), and every text
 * reader renders them through `structured-capture-text.ts`; the capture flow
 * and its question counts never see them.
 */
export const PHASE_STEP_RECORD_SECTIONS: Readonly<
  Record<number, readonly PhaseStepRecordSection[]>
> = {
  0: [
    {
      key: "p0_signal_step",
      stepId: "P0.1",
      label: "Signal and problem review",
      description:
        "Team-reviewed capture answers and pending session-note drafts.",
    },
    {
      key: "p0_scope_step",
      stepId: "P0.2",
      label: "Scope boundary review",
      description:
        "Team-reviewed capture answers and pending session-note drafts.",
    },
    {
      key: "p0_value_step",
      stepId: "P0.3",
      label: "Value hypothesis review",
      description:
        "Team-reviewed capture answers and pending session-note drafts.",
    },
    {
      key: "p0_owner_evidence_step",
      stepId: "P0.4",
      label: "Owner and evidence review",
      description:
        "Team-reviewed capture answers and pending session-note drafts.",
    },
  ],
  1: [
    {
      key: "p1_sponsor_scope_step",
      stepId: "P1.1",
      label: "Sponsor and scope review",
      description:
        "Team-reviewed capture answers and pending session-note drafts.",
    },
    {
      key: "p1_stakeholders_step",
      stepId: "P1.2",
      label: "Stakeholder and decision rights review",
      description:
        "Team-reviewed capture answers and pending session-note drafts.",
    },
    {
      key: "p1_success_step",
      stepId: "P1.3",
      label: "Success measures review",
      description:
        "Team-reviewed capture answers and pending session-note drafts.",
    },
    {
      key: "p1_evidence_change_step",
      stepId: "P1.4",
      label: "Evidence and change review",
      description:
        "Team-reviewed capture answers and pending session-note drafts.",
    },
  ],
  3: [
    {
      key: "design_traceability",
      stepId: "P3.1",
      label: "Root cause → design traceability",
      description:
        "For each P2 root cause, in the consultant's order, the design element that fixes it, or the program it is handed to with a named owner.",
    },
    {
      key: "architecture_choice",
      stepId: "P3.2",
      label: "Chosen architecture option and coverage",
      description:
        "The option the team chose from the options it brought, as written, and what it answers of each Step 1 design element.",
    },
    {
      key: "operating_adoption",
      stepId: "P3.3",
      label: "Owners, decision rights and baseline owner",
      description:
        "An accountable owner and decision rights for each Step 1 design element and any row the team added, who receives the baseline, and who wrote each entry.",
    },
    {
      key: "rom_estimate",
      stepId: "P3.4",
      label: "Bottom-up estimate (ROM)",
      description:
        "The inputs of the bottom-up estimate, each with its source and status: counts per use case, a register or benchmark reference for each component's unit hours, the delivery pod, the delivery factors and the release grouping, plus the snapshot a person approved.",
    },
  ],
};

export function phaseStepRecordSections(
  phase: number,
): readonly PhaseStepRecordSection[] {
  return PHASE_STEP_RECORD_SECTIONS[phase] ?? [];
}
