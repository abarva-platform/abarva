import {
  getPhaseCaptureSections,
  type PhaseCaptureSection,
} from "@/lib/programs/phase-capture-contract";

/**
 * The 3-step capture model for the redesigned Moves phase screens.
 *
 * Every phase is presented as exactly three steps, each asking a short cluster
 * of questions, with one "Continue" between them and a hand-off at the end.
 * This file is ONLY the grouping + step copy: each step references the existing
 * phase-capture section KEYS (`src/lib/programs/phase-capture-contract.ts`), so
 * the canonical questions, their help/examples, their `structured` input types,
 * and the save/gate/generation paths are all reused unchanged. Changing the
 * grouping or step titles here never changes what is stored.
 *
 * Invariant (enforced by `moves-phase-step-groups.test.ts`): for every phase,
 * the step groups reference each of that phase's capture section keys exactly
 * once — no input is dropped and none is shown twice.
 */
export interface PhaseStepGroup {
  /** Short step title shown in the step bar and as the panel heading. */
  title: string;
  /** One-line intro under the heading. */
  intro: string;
  /** Capture-contract section keys rendered in this step, in order. */
  sectionKeys: readonly string[];
}

/**
 * Per-phase step groups. Keys here MUST match the capture-contract section keys
 * for that phase. Most phases land on 2–3 questions per step; P0 Originate
 * carries 11 canonical inputs, so two of its steps hold four.
 */
export const MOVES_PHASE_STEP_GROUPS: Readonly<
  Record<number, readonly PhaseStepGroup[]>
> = {
  0: [
    {
      title: "Why now",
      intro: "What changed, and the problem this Move exists to solve.",
      sectionKeys: [
        "business_trigger",
        "problem_statement",
        "affected_function_process",
        "scope_out",
      ],
    },
    {
      title: "The bet",
      intro: "The value you expect and how you'd know you were right.",
      sectionKeys: [
        "initial_value_hypothesis",
        "outcomes_success",
        "discovery_questions",
      ],
    },
    {
      title: "Readiness",
      intro: "Who owns it, what you know, and whether it should go further.",
      sectionKeys: [
        "stakeholder_owner_view",
        "known_evidence",
        "missing_evidence_open_questions",
        "recommendation_to_advance",
      ],
    },
  ],
  1: [
    {
      title: "Scope the bet",
      intro: "Three answers that define what this Move is, and what it isn't.",
      sectionKeys: ["sponsor_commitment", "scope_boundary", "success_criteria"],
    },
    {
      title: "People & decisions",
      intro: "Who Discovery should involve, and who has the final say.",
      sectionKeys: ["stakeholder_map", "decision_rights"],
    },
    {
      title: "Plan the proof",
      intro: "What you'll collect next, and the change you expect to see.",
      sectionKeys: ["evidence_plan", "business_change_assessment"],
    },
  ],
  2: [
    {
      title: "What we found",
      intro: "The current state, as observed — and the numbers to measure against.",
      sectionKeys: ["current_state_findings", "baseline_metrics"],
    },
    {
      title: "Why it happens",
      intro: "The causes behind the findings.",
      sectionKeys: [
        "gaps_root_causes",
        "process_handoffs",
        "data_quality_governance",
      ],
    },
    {
      title: "Readiness & call",
      intro: "How sure you are, and what should happen next.",
      sectionKeys: [
        "evidence_confidence",
        "recommendation",
        "solution_route_validation",
      ],
    },
  ],
  3: [
    {
      title: "The approach",
      intro: "The options you weighed and the one you'd back.",
      sectionKeys: ["solution_approach", "recommendation"],
    },
    {
      title: "How it works",
      intro: "Who does what once it's live, and how the work flows.",
      sectionKeys: ["operating_model", "process_design"],
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
  4: [
    {
      title: "The plan",
      intro: "The order of work and what it will take.",
      sectionKeys: ["roadmap_sequencing", "estimates_capacity"],
    },
    {
      title: "The case",
      intro: "The value, and what you're asking for.",
      sectionKeys: ["value_plan", "funding_governance"],
    },
    {
      title: "Risks & handoff",
      intro: "What could slow it down and where it goes next.",
      sectionKeys: ["risks_dependencies", "handoff_plan", "recommendation"],
    },
  ],
  5: [
    {
      title: "Who owns it",
      intro: "Clear ownership, and whether the team is ready to take it.",
      sectionKeys: ["mobilization_plan", "launch_readiness"],
    },
    {
      title: "Measurement",
      intro: "How outcomes will be tracked and reviewed.",
      sectionKeys: ["value_proof_rules", "governance_cadence"],
    },
    {
      title: "Go live",
      intro: "Milestones, open risks, and the final call.",
      sectionKeys: ["first_90_days", "risks_open_items", "recommendation"],
    },
  ],
};

/** The 3-step groups for a phase, or `null` when the phase is not modelled. */
export function getPhaseStepGroups(phase: number): readonly PhaseStepGroup[] {
  return MOVES_PHASE_STEP_GROUPS[phase] ?? [];
}

/**
 * The capture section keys this phase declares, as a Set. Used to validate the
 * grouping against the live contract (see the test).
 */
export function phaseSectionKeySet(phase: number): Set<string> {
  return new Set(getPhaseCaptureSections(phase).map((section) => section.key));
}

/**
 * How many questions each step of a phase actually MOUNTS, derived from the
 * capture contract.
 *
 * This is the grouping's key list filtered through the sections the contract
 * declares — the same rule `MovesCaptureFlow` applies when it renders a step
 * (`group.sectionKeys` mapped through the sections it was given, dropping the
 * misses). So a key the contract no longer declares is counted here exactly as
 * it renders: not at all. Returning `group.sectionKeys.length` instead would
 * over-count that case and disagree with the screen.
 *
 * Why it exists (`U-567`): the signed-in wave family used the full mount set
 * across all three steps — `3 + 2 + 2 = 7` for P1 Charter — as its structural
 * non-regression figure for the `moves_capture_v2` path. That reading is no
 * longer obtainable by an unattended walk, because *Continue* is now gated on
 * saved step readiness and the step bar advances only backwards, so steps 2 and
 * 3 cannot be reached without writing answers. The figure therefore moves off
 * the walk and onto the contract: the component suite pins step 1's RENDERED
 * mount count against this derivation, so one reachable step still falsifies a
 * structural change, and the other two steps are evidenced by the derivation
 * rather than by an observation nobody can make. Do not replace this with a
 * literal — the counts are the contract's to decide, not this file's.
 */
export function phaseStepQuestionCounts(
  phase: number,
  sections: readonly PhaseCaptureSection[] = getPhaseCaptureSections(phase),
): readonly number[] {
  const declared = new Set(sections.map((section) => section.key));
  return getPhaseStepGroups(phase).map(
    (group) => group.sectionKeys.filter((key) => declared.has(key)).length,
  );
}
