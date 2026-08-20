// Executive Story Contract — the shared narrative model.
//
// A phase's story is ONE thing. The document explores it in depth; a deck
// compresses it into an executive decision journey. Both must tell the same
// story in the same order, or a reader who saw the deck cannot follow the
// document (and a reviewer cannot tell whether they disagree with the analysis
// or just read two different arguments).
//
// This module owns the story. It does NOT own how either surface renders it:
//
//   ExecutiveStoryContract          <- this module
//   ├── DocumentArtifactContract    (what the document must say)
//   │   └── DocumentDesignStandard  (how it is organised, navigated, branded)
//   └── DeckStoryContract           (the slide decision journey)
//       └── SlideVisualReferenceContract
//
// Keeping the beats here is what lets the document and deck contracts ship as
// separate increments without drifting apart: neither defines its own story,
// both project this one.
//
// Pure module: data and string-building only. No I/O.

import type { MovesDeliverableKey } from "@/lib/deliverables/profiles/types";

/**
 * One beat of an executive story. A beat is a QUESTION the reader needs
 * answered, not a section title — which is why the same beat can surface as a
 * 900-word document section and as a single slide.
 */
export interface StoryBeat {
  id: string;
  label: string;
  /** The question this beat answers for the reader. */
  question: string;
  /** What decision work the beat does. A beat that does none does not belong. */
  decisionRole: string;
}

export type StorySpineId =
  | "p2_discovery"
  | "p3_solution_decision"
  | "p4_investment_case"
  | "p4_roadmap_commitment";

/**
 * The canonical delivery lanes a data/AI roadmap splits into. A roadmap is not
 * one sequence — it is parallel tracks that each carry their own milestones and
 * block each other at specific points. Naming the lanes once means every
 * roadmap is readable against the same structure, and a dependency can be
 * expressed as "lane X's milestone blocks lane Y" rather than as prose.
 *
 * Lanes are a vocabulary, not a mandate: a Move that genuinely has no
 * governance work should omit that lane rather than pad it.
 */
export const ROADMAP_LANES = [
  {
    id: "foundation",
    label: "Platform foundation",
    scope:
      "Accounts, environments, networking, identity, secrets, CI/CD, observability, security baseline.",
  },
  {
    id: "ingestion_medallion",
    label: "Ingestion and medallion build",
    scope:
      "Source onboarding, landing, and the bronze/silver/gold pipelines that conform enterprise entities.",
  },
  {
    id: "governance",
    label: "Data governance enablement",
    scope:
      "Catalog, lineage, data quality, access policy, and the controls that make the estate usable and auditable.",
  },
  {
    id: "analytics_reporting",
    label: "Analytics and reporting",
    scope:
      "Semantic layer, data products, models, and the reporting surfaces built on governed data.",
  },
  {
    id: "activation",
    label: "Activation and adoption",
    scope:
      "Workflow integration, write-back, operating-procedure change, training and adoption.",
  },
] as const;

export type RoadmapLaneId = (typeof ROADMAP_LANES)[number]["id"];

/**
 * P2 — Discovery readout. The story runs from the answer, through what was
 * actually found, to whether the Move should continue at all.
 */
const P2_DISCOVERY: readonly StoryBeat[] = [
  {
    id: "executive_answer",
    label: "Executive answer",
    question: "What did we find, in one statement?",
    decisionRole: "Gives the reader the conclusion before the evidence.",
  },
  {
    id: "what_we_assessed",
    label: "What we assessed",
    question: "What was in scope, and on what evidence?",
    decisionRole:
      "Bounds the claim — what this readout can and cannot speak to.",
  },
  {
    id: "current_state",
    label: "Current state",
    question: "How does it work today?",
    decisionRole:
      "Establishes the baseline every later claim is measured against.",
  },
  {
    id: "what_is_working",
    label: "What is working",
    question: "What should be preserved?",
    decisionRole:
      "Prevents a redesign that discards something already effective.",
  },
  {
    id: "what_is_not_working",
    label: "What is not working",
    question: "Where does it break, and at what cost?",
    decisionRole: "Names the problem the Move exists to solve.",
  },
  {
    id: "root_causes",
    label: "Root causes",
    question: "Why does it break — cause, not symptom?",
    decisionRole: "Stops the design from treating symptoms.",
  },
  {
    id: "metrics_evidence",
    label: "Metrics and evidence",
    question: "What proves this, and how confident are we?",
    decisionRole: "Makes the findings auditable rather than asserted.",
  },
  {
    id: "implications",
    label: "Implications",
    question: "What follows if this is true?",
    decisionRole: "Connects findings to consequences the sponsor must weigh.",
  },
  {
    id: "readiness",
    label: "Readiness",
    question: "Is the organisation able to act on this?",
    decisionRole:
      "Surfaces capability and data gaps before they become surprises.",
  },
  {
    id: "proceed_hold_stop",
    label: "Proceed, hold or stop",
    question: "Should this Move continue?",
    decisionRole: "The actual gate decision this readout exists to support.",
  },
];

/**
 * P3 — Solution decision. The story runs from the decision needed, through
 * genuine alternatives, to a recommended design and what it implies for P4.
 */
const P3_SOLUTION_DECISION: readonly StoryBeat[] = [
  {
    id: "decision_required",
    label: "Decision required",
    question: "What are we being asked to choose?",
    decisionRole: "Names the choice before describing the options.",
  },
  {
    id: "what_p2_tells_us",
    label: "What discovery tells us",
    question: "What did the evidence establish that constrains this design?",
    decisionRole: "Grounds the design in findings rather than preference.",
  },
  {
    id: "design_principles",
    label: "Design principles",
    question: "What rules is this design holding itself to?",
    decisionRole: "Makes the tradeoffs that follow legible and challengeable.",
  },
  {
    id: "approaches_considered",
    label: "Approaches considered",
    question: "What credible alternatives exist?",
    decisionRole: "Proves a choice was made, not assumed.",
  },
  {
    id: "tradeoffs",
    label: "Tradeoffs",
    question: "How do the approaches actually differ?",
    decisionRole: "Lets a reviewer disagree on a dimension, not on the whole.",
  },
  {
    id: "recommended_approach",
    label: "Recommended approach",
    question: "Which one, and why does it win?",
    decisionRole: "States the recommendation and the reasoning behind it.",
  },
  {
    id: "conceptual_architecture",
    label: "Conceptual architecture",
    question: "What capabilities does this need?",
    decisionRole: "Shows the shape of the solution at a business level.",
  },
  {
    id: "end_to_end_data_flow",
    label: "End-to-end data flow",
    question: "Where does information come from, and how is it transformed?",
    decisionRole:
      "Exposes the real lifecycle, not a source-to-dashboard sketch.",
  },
  {
    id: "runtime_activation_flow",
    label: "Runtime and activation flow",
    question: "What happens when this actually operates?",
    decisionRole: "Shows where humans review, decide and act.",
  },
  {
    id: "operating_model_controls",
    label: "Operating model and controls",
    question: "Who runs it, and what governs it?",
    decisionRole: "Establishes accountability and oversight before build.",
  },
  {
    id: "transition_implications",
    label: "Transition implications",
    question: "What does this mean for cost and sequencing?",
    decisionRole: "Hands a real bill of work to the investment case.",
  },
];

/**
 * P4 — Investment case. The story runs from the ask, through what is being
 * funded and what it returns, to a recommendation with conditions.
 */
const P4_INVESTMENT_CASE: readonly StoryBeat[] = [
  {
    id: "decision",
    label: "Decision",
    question: "What is leadership being asked to approve?",
    decisionRole:
      "States the ask first, so everything after is evidence for it.",
  },
  {
    id: "why_now",
    label: "Why now",
    question: "What makes this urgent, and what is the baseline?",
    decisionRole: "Justifies timing, not just merit.",
  },
  {
    id: "what_we_are_funding",
    label: "What we are funding",
    question: "What is in scope — and explicitly out?",
    decisionRole: "Prevents an approval whose boundary nobody agreed.",
  },
  {
    id: "investment",
    label: "Investment",
    question: "What does it cost — foundation, incremental and recurring?",
    decisionRole:
      "Separates shared foundation from use-case cost so the first mover is not overcharged.",
  },
  {
    id: "value",
    label: "Value",
    question: "What is the benefit, and how will it be measured?",
    decisionRole: "Ties the return to a measurement commitment.",
  },
  {
    id: "economics",
    label: "Economics",
    question: "Payback, TCO, and how confident are we?",
    decisionRole:
      "Puts a range and a confidence on the return, never a single number.",
  },
  {
    id: "delivery",
    label: "Delivery",
    question: "Who delivers it, and under which model?",
    decisionRole: "Makes the sourcing choice explicit and comparable.",
  },
  {
    id: "roadmap",
    label: "Roadmap and gates",
    question: "In what sequence, with which decision gates?",
    decisionRole: "Gives leadership places to stop, not just a start date.",
  },
  {
    id: "risk",
    label: "Risks and controls",
    question: "What could change this case, and what contains it?",
    decisionRole: "Names what would invalidate the recommendation.",
  },
  {
    id: "recommendation",
    label: "Recommendation",
    question: "What should be funded now — and what not yet?",
    decisionRole:
      "Closes with a specific ask, including what to decline for now.",
  },
];

/**
 * P4 — Roadmap commitment. A DIFFERENT argument from the investment case, which
 * is why it gets its own spine rather than a reordered projection of that one.
 *
 * The investment case argues "is this worth funding?" and reaches sequencing
 * late, after value and delivery. A roadmap argues "is this the right sequence
 * to commit to?" and must lead with the sequence. It is also not linear: the
 * work splits into parallel lanes (see `ROADMAP_LANES`) that carry their own
 * milestones and block each other, so the story has to establish the lanes
 * before it can discuss dependencies, critical path, or gates.
 */
const P4_ROADMAP_COMMITMENT: readonly StoryBeat[] = [
  {
    id: "commitment_required",
    label: "Commitment required",
    question: "What sequence are we being asked to commit to?",
    decisionRole: "Names the commitment before defending it.",
  },
  {
    id: "sequencing_logic",
    label: "Why this sequence",
    question: "Why this order, and not another?",
    decisionRole:
      "Turns the plan into an argument — sequence is a choice, not a given.",
  },
  {
    id: "workstream_lanes",
    label: "Workstream lanes",
    question: "What parallel tracks does this work actually split into?",
    decisionRole:
      "Establishes the lanes, without which dependencies and critical path cannot be read.",
  },
  {
    id: "lane_milestones",
    label: "Milestones by lane",
    question: "What lands when, in each lane?",
    decisionRole:
      "Makes progress observable per track rather than in aggregate.",
  },
  {
    id: "cross_lane_dependencies",
    label: "Cross-lane dependencies",
    question: "What blocks what, across lanes?",
    decisionRole:
      "Exposes where one lane's slip becomes another lane's idle time.",
  },
  {
    id: "critical_path",
    label: "Critical path",
    question: "What actually determines the end date?",
    decisionRole:
      "Focuses attention on the few items where delay is not recoverable.",
  },
  {
    id: "decision_gates",
    label: "Decision gates",
    question: "Where can leadership stop, slow, or redirect?",
    decisionRole:
      "Gives the sponsor exits, not just a start date — a plan with no gate is a commitment to everything.",
  },
  {
    id: "value_milestones",
    label: "Value milestones",
    question: "When does value actually reach the business?",
    decisionRole:
      "Separates delivery milestones from value milestones, which rarely coincide.",
  },
  {
    id: "capacity_and_delivery",
    label: "Capacity and delivery",
    question: "Who does this work, and do they exist yet?",
    decisionRole: "Tests whether the sequence is staffable, not just logical.",
  },
  {
    id: "schedule_risk",
    label: "Schedule risk",
    question: "What would break this sequence?",
    decisionRole: "Names the failure modes the gates are meant to catch.",
  },
  {
    id: "commitment",
    label: "Commitment",
    question: "What are we committing to now, and what stays optional?",
    decisionRole:
      "Closes with a bounded commitment rather than open-ended endorsement.",
  },
];

export const EXECUTIVE_STORY_SPINES: Readonly<
  Record<StorySpineId, readonly StoryBeat[]>
> = {
  p2_discovery: P2_DISCOVERY,
  p3_solution_decision: P3_SOLUTION_DECISION,
  p4_investment_case: P4_INVESTMENT_CASE,
  p4_roadmap_commitment: P4_ROADMAP_COMMITMENT,
};

/**
 * Which story an artifact tells. Artifacts that are instruments rather than
 * arguments (charter, value-measurement contract, financial workbook) return
 * null — they have a job, not a narrative arc.
 */
const ARTIFACT_SPINE: Partial<Record<MovesDeliverableKey, StorySpineId>> = {
  discovery_report: "p2_discovery",
  root_cause_worksheet: "p2_discovery",
  solution_approach_options: "p3_solution_decision",
  target_state_architecture: "p3_solution_decision",
  solution_design: "p3_solution_decision",
  business_case: "p4_investment_case",
  // The roadmap argues a commitment to a sequence, not a funding case — see
  // P4_ROADMAP_COMMITMENT for why it is not a reordering of the investment story.
  execution_roadmap: "p4_roadmap_commitment",
};

export function storySpineFor(
  artifact: MovesDeliverableKey,
): StorySpineId | null {
  return ARTIFACT_SPINE[artifact] ?? null;
}

export function storyBeatsFor(
  artifact: MovesDeliverableKey,
): readonly StoryBeat[] {
  const spine = storySpineFor(artifact);
  return spine ? EXECUTIVE_STORY_SPINES[spine] : [];
}

/**
 * Render the spine as a prompt instruction. The beats are given in order and
 * described by the question each answers, so the model organises around the
 * reader's questions rather than around headings it invents.
 *
 * Deliberately says the story may be told in FEWER sections than beats but not
 * in a different ORDER: compressing two beats into one section is an editorial
 * judgment; answering "what does it cost" before "what are we funding" is a
 * broken argument.
 */
export function renderStorySpinePrompt(spineId: StorySpineId): string {
  const beats = EXECUTIVE_STORY_SPINES[spineId];
  const lines = beats.map(
    (b, i) => `${i + 1}. ${b.label} — ${b.question} (${b.decisionRole})`,
  );
  return [
    "EXECUTIVE STORY SPINE: this artifact answers the reader's questions in this order.",
    ...lines,
    "",
    "Two beats may be combined into one section where that reads better, and a",
    "beat with nothing evidenced to say should say so rather than be padded. Do",
    "NOT reorder them: the sequence is the argument.",
  ].join("\n");
}
