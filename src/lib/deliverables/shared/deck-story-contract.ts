// Deck Story Contract — the executive decision journey across slides.
//
// A deck is not the document reflowed onto slides. The document contains the
// depth; the presentation creates the decision journey. Producing one from the
// other without a separate contract yields the two failure modes worth naming:
// slide-like documents (bullet fragments where argument belongs) and
// document-like slides (paragraph walls nobody reads in a room).
//
// This module sits beside the document contract, not inside it:
//
//   ExecutiveStoryContract          (the story — shared)
//   ├── DocumentArtifactContract
//   │   └── DocumentDesignStandard
//   └── DeckStoryContract           <- this module
//       └── SlideVisualReferenceContract
//
// It PROJECTS the shared spine rather than restating it: every narrative slide
// names the `StoryBeat` it carries, so a deck and its document cannot tell
// different stories. Slides that legitimately have no single beat — a synthesis
// opener, a closing owners/approvals slide — declare that explicitly.
//
// Pure module: data, predicates and string-building. No I/O, no rendering.

import {
  EXECUTIVE_STORY_SPINES,
  type StorySpineId,
} from "./executive-story-contract";

// ---------------------------------------------------------------------------
// Slide density
// ---------------------------------------------------------------------------

/**
 * Visible words on a slide — what a person reads in the room. Speaker notes,
 * exhibit data and appendix content are not visible words.
 *
 * These bands are what separates a C-suite deck from a document printed in
 * landscape. A slide past the blocking ceiling is not a dense slide; it is a
 * page that lost its way onto a projector.
 */
export const SLIDE_DENSITY = {
  preferredMin: 35,
  preferredMax: 70,
  advisoryMax: 100,
  blockingMax: 130,
} as const;

export type SlideDensityVerdict =
  | "sparse"
  | "preferred"
  | "advisory"
  | "too_dense";

export function classifySlideDensity(
  visibleWordCount: number,
): SlideDensityVerdict {
  if (visibleWordCount < SLIDE_DENSITY.preferredMin) return "sparse";
  if (visibleWordCount <= SLIDE_DENSITY.preferredMax) return "preferred";
  if (visibleWordCount <= SLIDE_DENSITY.advisoryMax) return "advisory";
  return "too_dense";
}

/** A "too_dense" slide should be rewritten or split, not shrunk in font size. */
export function slideDensityBlocks(visibleWordCount: number): boolean {
  return visibleWordCount > SLIDE_DENSITY.blockingMax;
}

/** Core (non-appendix) slide count for a C-suite deck. */
export const CORE_SLIDE_COUNT = { min: 8, max: 15 } as const;

/**
 * Supporting points under a slide's primary message. Beyond this the slide is
 * carrying more than one idea and should be split.
 */
export const MAX_SUPPORTING_POINTS = 5;

/**
 * Output-token budget for generating a deck. Deliberately generous: visible
 * slide text is a small fraction of what a deck generation actually produces —
 * speaker notes, exhibit specifications, citations, layout intent and appendix
 * content all consume budget. Starving the budget produces thin slides with no
 * notes, which is the most common way a generated deck fails.
 */
export const DECK_OUTPUT_TOKEN_BUDGET = { min: 10_000, max: 14_000 } as const;

// ---------------------------------------------------------------------------
// Slide contract
// ---------------------------------------------------------------------------

/**
 * What kind of visual carries the slide. `none` is legitimate for a pure
 * decision or ask slide, where a diagram would be decoration.
 */
export type SlideVisualKind =
  | "decision_card"
  | "summary_panel"
  | "chart"
  | "waterfall"
  | "bridge"
  | "tornado"
  | "matrix"
  | "architecture"
  | "data_flow"
  | "runtime_flow"
  | "roadmap"
  | "heatmap"
  | "table"
  | "none";

export interface SlideContract {
  id: string;
  /** Working name. The RENDERED title must be the conclusion — see messageLedTitles. */
  label: string;
  purpose: string;
  /**
   * The shared story beat this slide carries, or null for a slide that
   * legitimately spans the whole story (a synthesis opener) or sits outside it
   * (a closing owners-and-approvals slide). Null always carries a reason in
   * `spansStory`.
   */
  beatId: string | null;
  /** Why this slide has no single beat. Required when beatId is null. */
  spansStory?: string;
  primaryVisual: SlideVisualKind;
  /** Content this slide must actually carry, checked as presence not phrasing. */
  requiredElements: readonly string[];
  required: boolean;
}

export type DeckContractId =
  | "REF_DECK_P2_DISCOVERY_READOUT"
  | "REF_DECK_P3_SOLUTION_DECISION"
  | "REF_DECK_P4_BUSINESS_CASE"
  | "REF_DECK_P4_ROADMAP";

export interface DeckStoryContract {
  id: DeckContractId;
  /** The shared spine this deck projects. */
  spine: StorySpineId;
  audience: readonly string[];
  /** The one question the deck exists to answer. */
  executiveQuestion: string;
  slides: readonly SlideContract[];
  appendixAllowed: boolean;
  /** What belongs behind the appendix divider rather than in the flow. */
  appendixContent: readonly string[];
  messageLedTitles: boolean;
  onePrimaryMessagePerSlide: boolean;
  onePrimaryVisualPerSlide: boolean;
}

// ---------------------------------------------------------------------------
// P4 — Business case deck
// ---------------------------------------------------------------------------

/**
 * The at-a-glance slide is the most valuable page in the deck: a CFO or CIO
 * should understand the whole case from it in about a minute. It is the one
 * slide that deliberately spans every beat, which is why its required elements
 * are enumerated rather than left to judgment.
 */
const AT_A_GLANCE_ELEMENTS = [
  "recommendation — fund, defer, or conditionally approve",
  "initial implementation cost",
  "shared foundation cost",
  "incremental use-case cost",
  "annual run cost",
  "annual benefit",
  "strategic or non-financial benefit",
  "value confidence",
  "three-year TCO",
  "payback",
  "low / expected / high range",
  "expected duration",
  "preferred delivery model",
  "largest single uncertainty",
  "the exact ask today",
] as const;

const P4_BUSINESS_CASE: DeckStoryContract = {
  id: "REF_DECK_P4_BUSINESS_CASE",
  spine: "p4_investment_case",
  audience: ["CIO", "CFO", "CDAO", "SteerCo"],
  executiveQuestion:
    "Should we fund this investment, and under what conditions?",
  appendixAllowed: true,
  appendixContent: [
    "detailed estimate",
    "assumptions",
    "evidence",
    "architecture",
    "sensitivity detail",
    "rate-card detail",
    "technical design",
  ],
  messageLedTitles: true,
  onePrimaryMessagePerSlide: true,
  onePrimaryVisualPerSlide: true,
  slides: [
    {
      id: "decision_ask",
      label: "Decision / Ask",
      purpose: "State what leadership is being asked to approve.",
      beatId: "decision",
      primaryVisual: "decision_card",
      requiredElements: ["the specific ask", "the approving body", "the date"],
      required: true,
    },
    {
      id: "business_case_at_a_glance",
      label: "Business Case at a Glance",
      purpose:
        "Let a CFO or CIO understand the entire case in about sixty seconds.",
      beatId: null,
      spansStory:
        "Deliberately spans every beat — this is the whole case compressed onto one page, not one step of the argument.",
      primaryVisual: "summary_panel",
      requiredElements: AT_A_GLANCE_ELEMENTS,
      required: true,
    },
    {
      id: "why_now",
      label: "Why Now",
      purpose: "Establish the problem, its urgency, and the baseline.",
      beatId: "why_now",
      primaryVisual: "chart",
      requiredElements: ["the baseline", "what is worsening", "why this year"],
      required: true,
    },
    {
      id: "what_we_are_funding",
      label: "What We Are Funding",
      purpose: "Bound the scope and show the solution in context.",
      beatId: "what_we_are_funding",
      primaryVisual: "architecture",
      requiredElements: ["in scope", "explicitly out of scope"],
      required: true,
    },
    {
      id: "investment_required",
      label: "Investment Required",
      purpose:
        "Split shared foundation from incremental use-case cost, plus recurring.",
      beatId: "investment",
      primaryVisual: "waterfall",
      requiredElements: [
        "shared foundation",
        "incremental use-case cost",
        "recurring run cost",
      ],
      required: true,
    },
    {
      id: "value_case",
      label: "Value Case",
      purpose: "State the benefit and how it will be measured.",
      beatId: "value",
      primaryVisual: "bridge",
      requiredElements: ["benefit", "measurement commitment", "owner"],
      required: true,
    },
    {
      id: "economics_sensitivity",
      label: "Economics & Sensitivity",
      purpose: "Show payback, TCO, scenarios and confidence.",
      beatId: "economics",
      primaryVisual: "tornado",
      requiredElements: [
        "payback",
        "three-year TCO",
        "low / expected / high",
        "what moves the case most",
      ],
      required: true,
    },
    {
      id: "delivery_approach",
      label: "Delivery Approach",
      purpose: "Make the sourcing choice explicit and comparable.",
      beatId: "delivery",
      primaryVisual: "matrix",
      requiredElements: ["delivery model", "why this model"],
      required: false,
    },
    {
      id: "roadmap_gates",
      label: "Roadmap & Gates",
      purpose: "Show sequencing, milestones and where the case can be stopped.",
      beatId: "roadmap",
      primaryVisual: "roadmap",
      requiredElements: ["sequence", "decision gates", "value milestones"],
      required: true,
    },
    {
      id: "risks_controls",
      label: "Risks & Controls",
      purpose: "Name what could change the case and what contains it.",
      beatId: "risk",
      primaryVisual: "heatmap",
      requiredElements: ["top risks", "mitigation", "owner"],
      required: true,
    },
    {
      id: "recommendation",
      label: "Recommendation",
      purpose: "State what to fund now — and what not to fund yet.",
      beatId: "recommendation",
      primaryVisual: "decision_card",
      requiredElements: ["what to fund now", "what not to fund yet"],
      required: true,
    },
    {
      id: "next_decisions",
      label: "Next Decisions",
      purpose: "Name owners, approvals and the immediate next step.",
      beatId: null,
      spansStory:
        "Follows the story rather than advancing it — the mechanics of acting on the decision just taken.",
      primaryVisual: "table",
      requiredElements: ["owners", "approvals required", "next step and date"],
      required: true,
    },
  ],
};

// ---------------------------------------------------------------------------
// P2 — Discovery readout deck
// ---------------------------------------------------------------------------

const P2_DISCOVERY_READOUT: DeckStoryContract = {
  id: "REF_DECK_P2_DISCOVERY_READOUT",
  spine: "p2_discovery",
  audience: ["Sponsor", "CIO", "Business owner"],
  executiveQuestion: "Should this Move proceed, hold, or stop?",
  appendixAllowed: true,
  appendixContent: [
    "interview log",
    "evidence detail",
    "process detail",
    "data-quality findings",
  ],
  messageLedTitles: true,
  onePrimaryMessagePerSlide: true,
  onePrimaryVisualPerSlide: true,
  slides: [
    {
      id: "executive_answer",
      label: "Executive Answer",
      purpose: "Give the conclusion before the evidence.",
      beatId: "executive_answer",
      primaryVisual: "decision_card",
      requiredElements: ["the finding in one statement"],
      required: true,
    },
    {
      id: "what_we_assessed",
      label: "What We Assessed",
      purpose: "Bound the claim.",
      beatId: "what_we_assessed",
      primaryVisual: "table",
      requiredElements: ["scope", "evidence base"],
      required: true,
    },
    {
      id: "current_state",
      label: "Current State",
      purpose: "Show how it works today.",
      beatId: "current_state",
      primaryVisual: "data_flow",
      requiredElements: ["current process or landscape"],
      required: true,
    },
    {
      id: "what_is_working",
      label: "What Is Working",
      purpose: "Name what should be preserved.",
      beatId: "what_is_working",
      primaryVisual: "table",
      requiredElements: ["strengths worth keeping"],
      required: false,
    },
    {
      id: "what_is_not_working",
      label: "What Is Not Working",
      purpose: "Name the problem and its cost.",
      beatId: "what_is_not_working",
      primaryVisual: "chart",
      requiredElements: ["failure points", "impact"],
      required: true,
    },
    {
      id: "root_causes",
      label: "Root Causes",
      purpose: "Separate cause from symptom.",
      beatId: "root_causes",
      primaryVisual: "matrix",
      requiredElements: ["causes, not symptoms"],
      required: true,
    },
    {
      id: "metrics_evidence",
      label: "Metrics & Evidence",
      purpose: "Make the findings auditable.",
      beatId: "metrics_evidence",
      primaryVisual: "table",
      requiredElements: ["baseline metrics", "confidence", "gaps"],
      required: true,
    },
    {
      id: "implications",
      label: "Implications",
      purpose: "Connect findings to consequences.",
      beatId: "implications",
      primaryVisual: "none",
      requiredElements: ["what follows if this is true"],
      required: true,
    },
    {
      id: "readiness",
      label: "Readiness",
      purpose: "Assess ability to act.",
      beatId: "readiness",
      primaryVisual: "heatmap",
      requiredElements: ["capability gaps", "data gaps"],
      required: true,
    },
    {
      id: "proceed_hold_stop",
      label: "Proceed, Hold or Stop",
      purpose: "Take the gate decision.",
      beatId: "proceed_hold_stop",
      primaryVisual: "decision_card",
      requiredElements: ["recommendation", "conditions"],
      required: true,
    },
  ],
};

// ---------------------------------------------------------------------------
// P3 — Solution decision deck
// ---------------------------------------------------------------------------

const P3_SOLUTION_DECISION: DeckStoryContract = {
  id: "REF_DECK_P3_SOLUTION_DECISION",
  spine: "p3_solution_decision",
  audience: ["CIO", "CDAO", "Architecture review", "Sponsor"],
  executiveQuestion: "Which solution approach should we commit to?",
  appendixAllowed: true,
  appendixContent: [
    "logical architecture detail",
    "physical architecture",
    "interface inventory",
    "non-functional requirements",
    "detailed tradeoff scoring",
  ],
  messageLedTitles: true,
  onePrimaryMessagePerSlide: true,
  onePrimaryVisualPerSlide: true,
  slides: [
    {
      id: "decision_required",
      label: "Decision Required",
      purpose: "Name the choice before the options.",
      beatId: "decision_required",
      primaryVisual: "decision_card",
      requiredElements: ["the choice", "who decides"],
      required: true,
    },
    {
      id: "what_discovery_tells_us",
      label: "What Discovery Tells Us",
      purpose: "Ground the design in evidence.",
      beatId: "what_p2_tells_us",
      primaryVisual: "table",
      requiredElements: ["constraints established by evidence"],
      required: true,
    },
    {
      id: "design_principles",
      label: "Design Principles",
      purpose: "Make the tradeoffs legible.",
      beatId: "design_principles",
      primaryVisual: "none",
      requiredElements: ["principles this design holds to"],
      required: true,
    },
    {
      id: "approaches_considered",
      label: "Approaches Considered",
      purpose: "Show genuine alternatives.",
      beatId: "approaches_considered",
      primaryVisual: "matrix",
      requiredElements: ["named alternatives, not degrees of effort"],
      required: true,
    },
    {
      id: "tradeoffs",
      label: "Tradeoffs",
      purpose: "Compare on dimensions a reviewer can argue with.",
      beatId: "tradeoffs",
      primaryVisual: "matrix",
      requiredElements: ["comparison across the standard dimensions"],
      required: true,
    },
    {
      id: "recommended_approach",
      label: "Recommended Approach",
      purpose: "State the recommendation and why it wins.",
      beatId: "recommended_approach",
      primaryVisual: "decision_card",
      requiredElements: ["the recommendation", "why it wins"],
      required: true,
    },
    {
      id: "conceptual_architecture",
      label: "Conceptual Architecture",
      purpose: "Show the solution at a business-capability level.",
      beatId: "conceptual_architecture",
      primaryVisual: "architecture",
      requiredElements: ["capabilities", "boundaries"],
      required: true,
    },
    {
      id: "end_to_end_data_flow",
      label: "End-to-End Data Flow",
      purpose: "Show the real lifecycle from source to activation.",
      beatId: "end_to_end_data_flow",
      primaryVisual: "data_flow",
      requiredElements: [
        "sources",
        "layered transformation",
        "activation surface",
      ],
      required: true,
    },
    {
      id: "runtime_activation_flow",
      label: "Runtime & Activation Flow",
      purpose: "Show what happens when the solution operates.",
      beatId: "runtime_activation_flow",
      primaryVisual: "runtime_flow",
      requiredElements: ["trigger", "human review point", "action", "feedback"],
      required: false,
    },
    {
      id: "operating_model_controls",
      label: "Operating Model & Controls",
      purpose: "Establish accountability and oversight.",
      beatId: "operating_model_controls",
      primaryVisual: "matrix",
      requiredElements: ["ownership", "controls"],
      required: true,
    },
    {
      id: "transition_implications",
      label: "Transition Implications",
      purpose: "Hand a real bill of work to the investment case.",
      beatId: "transition_implications",
      primaryVisual: "table",
      requiredElements: ["build / extend / reuse", "sequencing implications"],
      required: true,
    },
  ],
};

// ---------------------------------------------------------------------------
// P4 — Roadmap commitment deck
// ---------------------------------------------------------------------------

/**
 * Projects `p4_roadmap_commitment`, NOT the investment case. A roadmap must
 * lead with the sequence and then establish its lanes before dependencies,
 * critical path or gates can be read — which is a different argument from
 * "is this worth funding", and the reason it has its own spine.
 */
const P4_ROADMAP: DeckStoryContract = {
  id: "REF_DECK_P4_ROADMAP",
  spine: "p4_roadmap_commitment",
  audience: ["Sponsor", "SteerCo", "Delivery leadership", "CIO"],
  executiveQuestion: "Is this the sequence we should commit to?",
  appendixAllowed: true,
  appendixContent: [
    "detailed plan",
    "dependency register",
    "resourcing detail",
    "per-lane backlog",
    "assumptions behind durations",
  ],
  messageLedTitles: true,
  onePrimaryMessagePerSlide: true,
  onePrimaryVisualPerSlide: true,
  slides: [
    {
      id: "commitment_ask",
      label: "Commitment / Ask",
      purpose: "State the sequence being committed to and by whom.",
      beatId: "commitment_required",
      primaryVisual: "decision_card",
      requiredElements: [
        "the commitment sought",
        "the approving body",
        "the horizon it covers",
      ],
      required: true,
    },
    {
      id: "roadmap_on_a_page",
      label: "Roadmap on a Page",
      purpose:
        "Show the whole sequence as swimlanes so the shape is legible before any detail.",
      beatId: null,
      spansStory:
        "Deliberately spans the whole sequence — the swimlane view of everything, not one step of the argument.",
      primaryVisual: "roadmap",
      requiredElements: [
        "one lane per workstream",
        "milestones positioned in time",
        "decision gates marked",
      ],
      required: true,
    },
    {
      id: "why_this_sequence",
      label: "Why This Sequence",
      purpose: "Argue the order rather than presenting it as given.",
      beatId: "sequencing_logic",
      primaryVisual: "none",
      requiredElements: [
        "what must come first and why",
        "what was deliberately deferred",
      ],
      required: true,
    },
    {
      id: "workstream_lanes",
      label: "Workstream Lanes",
      purpose: "Establish the parallel tracks the work splits into.",
      beatId: "workstream_lanes",
      primaryVisual: "roadmap",
      requiredElements: ["each lane and its scope", "lane owner"],
      required: true,
    },
    {
      id: "milestones_by_lane",
      label: "Milestones by Lane",
      purpose: "Make progress observable per track, not in aggregate.",
      beatId: "lane_milestones",
      primaryVisual: "roadmap",
      requiredElements: ["milestones per lane", "dates or horizons"],
      required: true,
    },
    {
      id: "cross_lane_dependencies",
      label: "Cross-Lane Dependencies",
      purpose: "Show where one lane's slip becomes another lane's idle time.",
      beatId: "cross_lane_dependencies",
      primaryVisual: "matrix",
      requiredElements: [
        "blocking relationships between lanes",
        "the milestone that releases each block",
      ],
      required: true,
    },
    {
      id: "critical_path",
      label: "Critical Path",
      purpose: "Focus attention where delay is not recoverable.",
      beatId: "critical_path",
      primaryVisual: "roadmap",
      requiredElements: ["the driving chain", "float elsewhere"],
      required: true,
    },
    {
      id: "decision_gates",
      label: "Decision Gates",
      purpose: "Give the sponsor exits, not just a start date.",
      beatId: "decision_gates",
      primaryVisual: "table",
      requiredElements: [
        "each gate",
        "what is decided there",
        "what evidence it needs",
      ],
      required: true,
    },
    {
      id: "value_milestones",
      label: "Value Milestones",
      purpose:
        "Separate delivery milestones from value milestones, which rarely coincide.",
      beatId: "value_milestones",
      primaryVisual: "chart",
      requiredElements: ["when value lands", "how it is measured"],
      required: true,
    },
    {
      id: "capacity_and_delivery",
      label: "Capacity & Delivery",
      purpose: "Test whether the sequence is staffable, not just logical.",
      beatId: "capacity_and_delivery",
      primaryVisual: "matrix",
      requiredElements: [
        "who delivers each lane",
        "capacity gaps or hiring lead time",
      ],
      required: true,
    },
    {
      id: "schedule_risk",
      label: "Schedule Risk",
      purpose: "Name the failure modes the gates are meant to catch.",
      beatId: "schedule_risk",
      primaryVisual: "heatmap",
      requiredElements: [
        "what would break the sequence",
        "mitigation",
        "owner",
      ],
      required: true,
    },
    {
      id: "commitment",
      label: "Commitment",
      purpose: "Close with a bounded commitment, not open-ended endorsement.",
      beatId: "commitment",
      primaryVisual: "decision_card",
      requiredElements: [
        "what is committed now",
        "what stays optional pending a gate",
      ],
      required: true,
    },
  ],
};

export const DECK_STORY_CONTRACTS: Readonly<
  Record<DeckContractId, DeckStoryContract>
> = {
  REF_DECK_P2_DISCOVERY_READOUT: P2_DISCOVERY_READOUT,
  REF_DECK_P3_SOLUTION_DECISION: P3_SOLUTION_DECISION,
  REF_DECK_P4_BUSINESS_CASE: P4_BUSINESS_CASE,
  REF_DECK_P4_ROADMAP: P4_ROADMAP,
};

export function deckContract(id: DeckContractId): DeckStoryContract {
  return DECK_STORY_CONTRACTS[id];
}

/**
 * Every beat a deck's narrative slides carry must exist in the spine it
 * declares. This is the guard that keeps a deck and its document telling the
 * same story — a typo'd or invented beat id is a contract defect, not a
 * rendering quirk.
 */
export function unknownBeatIds(contract: DeckStoryContract): string[] {
  const known = new Set(
    EXECUTIVE_STORY_SPINES[contract.spine].map((b) => b.id),
  );
  return contract.slides
    .map((s) => s.beatId)
    .filter((id): id is string => id !== null)
    .filter((id) => !known.has(id));
}

/**
 * Titles must state the conclusion, not the category. "Architecture" and
 * "Financials" are labels; a title is what you would say out loud if you had
 * one sentence to make the point.
 */
const GENERIC_SLIDE_TITLE_RE: readonly RegExp[] = [
  /^\s*(architecture|financials?|economics|overview|introduction|background|approach|summary|conclusion|next steps|risks?|roadmap|timeline|scope|options?|recommendations?|analysis|findings|results|data|solution|design|delivery|value|investment|cost)\s*$/i,
];

export function isGenericSlideTitle(title: string): boolean {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  // A single word is a label, never a conclusion.
  if (words.length < 3) return true;
  return GENERIC_SLIDE_TITLE_RE.some((re) => re.test(title));
}

/** Render the deck contract as a prompt instruction. */
export function renderDeckContractPrompt(id: DeckContractId): string {
  const c = deckContract(id);
  const slideLines = c.slides.map((s, i) => {
    const flag = s.required ? "REQUIRED" : "include when relevant";
    return `${i + 1}. ${s.label} [${flag}] — ${s.purpose} Primary visual: ${s.primaryVisual}. Must carry: ${s.requiredElements.join("; ")}.`;
  });
  return [
    `DECK STORY CONTRACT (${c.id})`,
    `Audience: ${c.audience.join(", ")}.`,
    `The deck exists to answer one question: ${c.executiveQuestion}`,
    "",
    "SLIDE FLOW — this order is the decision journey. Do not reorder it.",
    ...slideLines,
    "",
    `DENSITY: ${SLIDE_DENSITY.preferredMin}-${SLIDE_DENSITY.preferredMax} visible words per slide is the target; up to ${SLIDE_DENSITY.advisoryMax} is acceptable; past ${SLIDE_DENSITY.blockingMax} the slide must be split or rewritten. Visible words exclude speaker notes and exhibit data.`,
    `STRUCTURE: ${CORE_SLIDE_COUNT.min}-${CORE_SLIDE_COUNT.max} core slides. One primary message per slide. One primary visual per slide. At most ${MAX_SUPPORTING_POINTS} supporting points. No paragraph walls. No dense multi-column tables — move those to the appendix.`,
    'TITLES: every slide title must state the conclusion, not the category. Not "Architecture" but what the architecture means for the decision. A slide should lead naturally into the next.',
    c.appendixAllowed
      ? `APPENDIX: permitted, and the right home for ${c.appendixContent.join(", ")}. Appendix slides are not part of the core count.`
      : "APPENDIX: not used for this deck.",
  ].join("\n");
}
