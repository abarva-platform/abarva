// ── MovePhasePlaybook (PR-5) ──────────────────────────────────────────────────
// A facilitated-session framework for each Move phase. Where PhasePack tells
// Nexus how to *coach* a phase (questions, evidence, anti-patterns), the
// MovePhasePlaybook tells a consulting team how to *run* the phase as a series
// of facilitated working sessions — each with an objective, the people in the
// room, a discussion guide (agenda), the decision/option frameworks to apply,
// the capture template to fill, the homework to assign, and the alignment gate
// that closes the session. This is the McKinsey-style spine: give the client a
// framework, homework, sessions, templates, capture alignment — THEN compose
// the deliverable. No fabrication: sessions produce attested inputs.

export type MovePhase = 0 | 1 | 2 | 3 | 4 | 5;

/** A decision/option framework applied inside a session (e.g. a 2x2, a
 *  build-vs-buy scorecard, a value-vs-feasibility matrix). */
export interface SessionFramework {
  id: string;
  label: string;
  /** What the framework helps the room decide. */
  purpose: string;
  /** The axes / columns / options the framework lays out. */
  dimensions: string[];
}

/** The alignment gate that closes a session — what "aligned" means and who
 *  must sign. Mirrors the soft/hard gate vocabulary. */
export interface SessionGate {
  /** What must be true for the session output to count as aligned. */
  criterion: string;
  /** Who confirms alignment (role). */
  alignedBy: string;
  severity: "hard" | "soft";
}

/** A pairwise stakeholder alignment check — where two roles must actually agree,
 *  not just both attend. E.g. CFO vs CIO on the funding envelope and timeline. */
export interface AlignmentPoint {
  betweenRoles: [string, string];
  /** What must be verified as genuinely aligned between these two roles. */
  question: string;
}

/** Facilitator instructions for running the session itself — not what to
 *  capture, but how to run the room. */
export interface FacilitationNotes {
  /** How to open the workshop — the framing the facilitator states up front. */
  opening: string;
  /** What must be documented and decided before participants leave. */
  closing: string;
  /** What to probe when a room gives a vague or hand-wavy answer. */
  probeIfWeak: string[];
  /** Signals that indicate real misalignment, not just a rough patch to smooth over. */
  disagreementSignals: string[];
  /** What gets parked/deferred vs decided in this session. */
  parkingLotRule: string;
}

/** The 8 canonical, reusable workshop templates — standalone typed constructs
 *  (not prose lines inside a captureTemplate), shared across every session that
 *  references them by kind. */
export type WorkshopTemplateKind =
  | "decision_log"
  | "open_issue_log"
  | "assumption_register"
  | "evidence_request_tracker"
  | "stakeholder_alignment_matrix"
  | "option_scoring"
  | "action_register"
  | "approval_page";

export interface WorkshopTemplateSpec {
  kind: WorkshopTemplateKind;
  label: string;
  columns: string[];
}

export const WORKSHOP_TEMPLATES: Record<WorkshopTemplateKind, WorkshopTemplateSpec> = {
  decision_log: {
    kind: "decision_log",
    label: "Decision Log",
    columns: ["Decision", "Rationale", "Owner", "Date"],
  },
  open_issue_log: {
    kind: "open_issue_log",
    label: "Open Issue Log",
    columns: ["Issue", "Raised By", "Owner", "Status", "Target Date"],
  },
  assumption_register: {
    kind: "assumption_register",
    label: "Assumption Register",
    columns: ["Assumption", "Basis", "Must Validate?", "Owner"],
  },
  evidence_request_tracker: {
    kind: "evidence_request_tracker",
    label: "Evidence Request Tracker",
    columns: ["Evidence Needed", "Requested From", "Format", "Status", "Due Date"],
  },
  stakeholder_alignment_matrix: {
    kind: "stakeholder_alignment_matrix",
    label: "Stakeholder Alignment Matrix",
    columns: ["Stakeholder", "Role", "Position", "Concerns", "Alignment Status"],
  },
  option_scoring: {
    kind: "option_scoring",
    label: "Option Scoring Template",
    columns: ["Option", "Value", "Feasibility", "Risk", "Weighted Score", "Recommended?"],
  },
  action_register: {
    kind: "action_register",
    label: "Action Register",
    columns: ["Action", "Owner", "Due Date", "Status"],
  },
  approval_page: {
    kind: "approval_page",
    label: "Approval Page",
    columns: ["Role", "Name", "Status", "Date"],
  },
};

export interface MovePhaseSession {
  id: string;
  label: string;
  /** One-sentence objective — what this session produces. */
  objective: string;
  /** Roles that must be in the room. */
  participants: string[];
  /** Ordered agenda — the discussion guide Nexus hands the facilitator. */
  discussionGuide: string[];
  /** Decision/option frameworks to apply during the session. */
  frameworks: SessionFramework[];
  /** The capture template the session fills (headings the team completes). */
  captureTemplate: string[];
  /** Homework assigned BEFORE the session so the room is not cold. */
  homework: string[];
  /** The alignment gate that closes the session. */
  gate: SessionGate;
  /** Which deliverable(s) this session's capture feeds. */
  feedsDeliverables: string[];
  /**
   * Pairwise stakeholder alignment checks this session must resolve. Optional:
   * fully populated for the 5 default phase sessions; archetype-specific
   * session overrides (e.g. AI-PDLC's 8-session P3) do not yet carry these —
   * a scoped follow-up, not silently assumed complete (the renderer omits the
   * section when absent rather than showing an empty one).
   */
  alignmentPoints?: AlignmentPoint[];
  /** How to actually run the room — opening, closing, probes, disagreement signals. Optional; see alignmentPoints. */
  facilitation?: FacilitationNotes;
  /** Canonical reusable workshop templates this session fills. Optional; see alignmentPoints. */
  workshopTemplates?: WorkshopTemplateKind[];
}

export interface MovePhasePlaybook {
  phase: MovePhase;
  label: string;
  /** What running these sessions, in order, produces for the phase. */
  intent: string;
  sessions: MovePhaseSession[];
}

// ── Default per-phase playbooks ───────────────────────────────────────────────
// Pattern-agnostic facilitated-session spines. Archetype-specific session packs
// (e.g. AI-PDLC P3) override/extend these via the resolver.

const P1: MovePhasePlaybook = {
  phase: 1,
  label: "P1 Charter",
  intent:
    "Align sponsor and stakeholders on the problem, the value hypothesis, scope, and decision rights before any diagnosis spend.",
  sessions: [
    {
      id: "charter-framing",
      label: "Charter framing session",
      objective:
        "Name the problem trigger, the target outcome, and the first cohort/use case in one sentence each.",
      participants: [
        "Sponsor",
        "Move lead",
        "Business owner",
        "Finance partner",
      ],
      discussionGuide: [
        "Why now — what changed that makes this a Move, not a backlog item?",
        "What outcome would make the sponsor call this a success in 2 quarters?",
        "What is explicitly in and out of the first cohort?",
        "Who holds decision rights at each gate?",
      ],
      frameworks: [
        {
          id: "value-hypothesis",
          label: "Value hypothesis canvas",
          purpose: "Force a falsifiable problem→outcome→value chain.",
          dimensions: [
            "Problem trigger",
            "Target outcome",
            "Value lever",
            "Counter-evidence that would kill it",
          ],
        },
      ],
      captureTemplate: [
        "Problem statement (1 sentence)",
        "Target outcome + metric",
        "Scope boundary (in / out)",
        "Sponsor + decision rights",
        "Funding / capacity envelope",
      ],
      homework: [
        "Sponsor pre-reads the origination brief.",
        "Finance brings the cost baseline for the affected function.",
      ],
      gate: {
        criterion:
          "Problem, outcome, scope, and decision rights captured and signed by the sponsor.",
        alignedBy: "Sponsor",
        severity: "hard",
      },
      feedsDeliverables: ["program_charter"],
      alignmentPoints: [
        {
          betweenRoles: ["Sponsor", "Finance partner"],
          question:
            "Do they agree on the funding envelope and what it authorizes (discovery & design, not build)?",
        },
        {
          betweenRoles: ["Sponsor", "Business owner"],
          question:
            "Do they define the target outcome the same way, in the same metric?",
        },
      ],
      facilitation: {
        opening:
          "State plainly: this session charters a funded discovery & design gate, not a build authorization. Anything that sounds like solution design gets parked for P3.",
        closing:
          "Before anyone leaves: the problem statement, target outcome + metric, scope boundary, sponsor + decision rights, and funding envelope must all be written down and read back for agreement — not just discussed.",
        probeIfWeak: [
          "If the outcome is stated as a technology (\"deploy an AI assistant\") rather than a business result, ask: what business metric moves, and by when?",
          "If scope is vague (\"the whole department\"), ask for the specific first cohort/use case and what is explicitly excluded.",
        ],
        disagreementSignals: [
          "The sponsor and business owner describe success in different metrics.",
          "Finance partner hesitates on the funding envelope number rather than confirming it.",
        ],
        parkingLotRule:
          "Anything about HOW the solution will work (architecture, vendor, technology choice) is parked for P3 — this session decides WHY and WHETHER to fund discovery, not the design.",
      },
      workshopTemplates: ["decision_log", "assumption_register", "approval_page"],
    },
  ],
};

const P2: MovePhasePlaybook = {
  phase: 2,
  label: "P2 Discover & Diagnose",
  intent:
    "Capture the baseline and diagnose the real gaps with attested evidence, not assumptions, before designing anything.",
  sessions: [
    {
      id: "baseline-workshop",
      label: "Baseline & current-state workshop",
      objective:
        "Attest the baseline metrics and map the current-state workflow with its pain points.",
      participants: [
        "Move lead",
        "Process owners",
        "Data/analytics partner",
        "Frontline SME",
      ],
      discussionGuide: [
        "Walk the current workflow end to end — where does time and quality leak?",
        "What are the baseline metrics, and who attests each number?",
        "Which gaps are foundation (data/process) vs use-case (model/automation)?",
        "What change-readiness signals are present or absent?",
      ],
      frameworks: [
        {
          id: "two-gap",
          label: "Two-gap diagnostic",
          purpose:
            "Separate foundation gaps from use-case gaps so the roadmap sequences correctly.",
          dimensions: ["Foundation gap", "Use-case gap", "Owner", "Severity"],
        },
      ],
      captureTemplate: [
        "Baseline metrics (attested, with owner)",
        "Current-state workflow map",
        "Foundation gaps",
        "Use-case gaps",
        "Change-readiness assessment",
      ],
      homework: [
        "Data partner pulls the last 4 quarters of the baseline metrics.",
        "Process owners bring the current SOP / workflow docs.",
      ],
      gate: {
        criterion:
          "Baseline attested (not planned) and gaps mapped with owners.",
        alignedBy: "Sponsor",
        severity: "hard",
      },
      feedsDeliverables: ["discovery_report"],
      alignmentPoints: [
        {
          betweenRoles: ["Process owners", "Frontline SME"],
          question:
            "Does the mapped workflow match what actually happens day to day, not the documented SOP?",
        },
        {
          betweenRoles: ["Data/analytics partner", "Process owners"],
          question:
            "Do the pulled baseline numbers match the process owners' lived sense of where time/quality is lost?",
        },
      ],
      facilitation: {
        opening:
          "Frame this as evidence-gathering, not solutioning: the room's job is to attest what IS true today, not propose what should change.",
        closing:
          "Confirm every baseline metric has a named attesting owner (not \"the system\" or \"IT\"), and every gap is tagged foundation vs use-case before the room closes.",
        probeIfWeak: [
          "If a baseline number is quoted without a source (\"it's around 20%\"), ask who owns that number and where it can be pulled from.",
          "If a gap is described only as a symptom (\"the process is slow\"), ask what specifically causes the delay and whether it's a data gap, a process gap, or a capability gap.",
        ],
        disagreementSignals: [
          "The data partner's pulled numbers surprise the frontline SME — that gap itself is a finding, not noise to smooth over.",
          "Process owners describe the SOP while frontline SMEs describe a different actual workflow.",
        ],
        parkingLotRule:
          "Any proposed fix or target-state idea raised in this session is logged in the open issue log and carried to P3 — this session diagnoses, it does not design.",
      },
      workshopTemplates: ["open_issue_log", "evidence_request_tracker", "assumption_register"],
    },
  ],
};

const P3: MovePhasePlaybook = {
  phase: 3,
  label: "P3 Design & Decide",
  intent:
    "Design the target solution and operating model through facilitated option-and-tradeoff sessions, capturing a decision log the architecture rests on.",
  sessions: [
    {
      id: "target-design",
      label: "Target design & options session",
      objective:
        "Choose the target architecture and operating-model shift from explicit options with tradeoffs.",
      participants: [
        "Move lead",
        "Enterprise architect",
        "Business owner",
        "Security/risk",
        "Tower lead",
      ],
      discussionGuide: [
        "What is the target future-state workflow?",
        "What are the 2–3 viable architecture options, and how do they trade off?",
        "Build vs buy vs partner for each major component?",
        "What guardrails (security, privacy, model risk) constrain the design?",
      ],
      frameworks: [
        {
          id: "option-tradeoff",
          label: "Option × tradeoff matrix",
          purpose:
            "Compare design options on value, feasibility, risk, and time-to-value.",
          dimensions: [
            "Option",
            "Value",
            "Feasibility",
            "Risk",
            "Time-to-value",
          ],
        },
        {
          id: "build-buy",
          label: "Build / buy / partner scorecard",
          purpose: "Decide sourcing per component with a defensible rationale.",
          dimensions: [
            "Component",
            "Build",
            "Buy",
            "Partner",
            "Decision + rationale",
          ],
        },
      ],
      captureTemplate: [
        "Target future-state workflow",
        "Architecture options + tradeoffs",
        "Decision log (decision, rationale, owner)",
        "Guardrails & constraints",
        "Open questions carried forward",
      ],
      homework: [
        "Architect drafts 2–3 candidate architectures.",
        "Security brings the guardrail checklist for AI workloads.",
      ],
      gate: {
        criterion:
          "Target design and operating-model shift signed off with a decision log and requirements→design→outcome traceability.",
        alignedBy: "Sponsor",
        severity: "hard",
      },
      feedsDeliverables: [
        "ai_enabled_sdlc_architecture",
        "target_operating_model",
      ],
      alignmentPoints: [
        {
          betweenRoles: ["Enterprise architect", "Security/risk"],
          question:
            "Do they agree the chosen architecture satisfies every non-negotiable guardrail, not just the majority?",
        },
        {
          betweenRoles: ["Business owner", "Enterprise architect"],
          question:
            "Does the target workflow actually solve the business owner's stated problem, or just the technically cleanest one?",
        },
      ],
      facilitation: {
        opening:
          "State the ground rule up front: at least 2 real architecture options must be compared with tradeoffs — a single option presented as the only path is not a design session, it's a rubber stamp.",
        closing:
          "The decision log must name, for every major choice, the option chosen, the rejected alternatives, and the rationale — not just the final answer.",
        probeIfWeak: [
          "If only one option is presented, ask what the room considered and rejected, and why.",
          "If a guardrail is waved off (\"we'll handle that later\"), ask security/risk directly whether that's acceptable or a hard blocker.",
        ],
        disagreementSignals: [
          "Security/risk raises a concern that the room moves past without a explicit decision to accept or mitigate it.",
          "The business owner goes quiet during the technical tradeoff discussion — that often means the option doesn't map to their actual need.",
        ],
        parkingLotRule:
          "Vendor pricing, contract terms, and detailed delivery scheduling are parked for Sourcing Strategy and the Execution Roadmap — this session decides the architecture, not the commercial or delivery plan.",
      },
      workshopTemplates: ["option_scoring", "decision_log", "stakeholder_alignment_matrix"],
    },
  ],
};

const P4: MovePhasePlaybook = {
  phase: 4,
  label: "P4 Plan & Commit",
  intent:
    "Shape the roadmap, estimates, and value model through working sessions so the business case derives from approved numbers, never fabricated ones.",
  sessions: [
    {
      id: "roadmap-estimate",
      label: "Roadmap & estimate working session",
      objective:
        "Sequence the work into workstreams with estimates, milestones, and a RACI.",
      participants: [
        "Move lead",
        "Delivery lead",
        "Finance partner",
        "Business owner",
        "Tower lead",
      ],
      discussionGuide: [
        "What are the workstreams and their dependencies?",
        "What is the estimate per workstream, and what drives it?",
        "What are the critical milestones and success criteria?",
        "What value does each workstream unlock, and when?",
      ],
      frameworks: [
        {
          id: "value-effort",
          label: "Value × effort sequencing",
          purpose: "Sequence workstreams for earliest defensible value.",
          dimensions: [
            "Workstream",
            "Value",
            "Effort",
            "Dependency",
            "Sequence",
          ],
        },
      ],
      captureTemplate: [
        "Workstreams + dependencies",
        "Estimates (with basis)",
        "Milestones + success criteria",
        "RACI",
        "Value model inputs (approved ranges only)",
      ],
      homework: [
        "Delivery brings bottom-up estimates per workstream.",
        "Finance brings the approved value ranges from P2 baseline.",
      ],
      gate: {
        criterion:
          "Roadmap, estimates, and value model approved; business case derives from these, not from invented ROI.",
        alignedBy: "Sponsor",
        severity: "hard",
      },
      feedsDeliverables: ["execution_roadmap", "business_case"],
      alignmentPoints: [
        {
          betweenRoles: ["Delivery lead", "Finance partner"],
          question:
            "Do the bottom-up estimates and the approved P2 value ranges actually reconcile, or is the business case quietly assuming a different number?",
        },
        {
          betweenRoles: ["Business owner", "Delivery lead"],
          question:
            "Does the sequencing match what the business owner needs first, or only what's technically easiest to build first?",
        },
      ],
      facilitation: {
        opening:
          "Set the rule explicitly: every number in this room must trace to an approved P2 baseline or a stated, labelled assumption — nothing gets invented to make the business case look better.",
        closing:
          "Confirm the RACI names actual people (not \"the team\"), and that every workstream's value claim has a source before the room closes.",
        probeIfWeak: [
          "If an estimate is given with no stated basis (\"about 6 weeks\"), ask what the estimate is built from — a similar past effort, a vendor quote, a rule of thumb.",
          "If a value number doesn't match the P2 baseline, ask directly where the new number came from before it goes in the business case.",
        ],
        disagreementSignals: [
          "Delivery lead and finance partner give different numbers for the same workstream without reconciling them in the room.",
          "The business owner pushes back on sequencing but the room moves on without resolving it.",
        ],
        parkingLotRule:
          "Detailed technical implementation tasks are parked for the delivery team's own backlog — this session commits to workstreams, estimates, milestones, and value, not task-level planning.",
      },
      workshopTemplates: ["decision_log", "action_register", "assumption_register"],
    },
  ],
};

const P5: MovePhasePlaybook = {
  phase: 5,
  label: "P5 Mobilize & Hand off",
  intent:
    "Mobilize delivery and hand the Move to Control Tower with a measurement spine.",
  sessions: [
    {
      id: "mobilize-handoff",
      label: "Mobilization & Tower handoff session",
      objective:
        "Confirm the delivery RACI, the change/adoption plan, and the Tower measurement spine.",
      participants: [
        "Move lead",
        "Delivery lead",
        "Change lead",
        "Tower lead",
        "Sponsor",
      ],
      discussionGuide: [
        "Is the delivery team stood up with named owners?",
        "What is the adoption/change plan and who owns it?",
        "What metrics will Tower monitor, and what are the thresholds?",
        "What is explicitly handed off vs retained?",
      ],
      frameworks: [
        {
          id: "measurement-spine",
          label: "Tower measurement spine",
          purpose: "Define what Tower watches and when it escalates.",
          dimensions: ["Metric", "Baseline", "Target", "Threshold", "Owner"],
        },
      ],
      captureTemplate: [
        "Delivery RACI",
        "Adoption / change plan",
        "Tower measurement spine",
        "Handoff acceptance checklist",
      ],
      homework: [
        "Tower drafts the metric plan.",
        "Change lead brings the adoption baseline.",
      ],
      gate: {
        criterion:
          "Tower handoff plan accepted and measurement spine signed off.",
        alignedBy: "Tower lead",
        severity: "hard",
      },
      feedsDeliverables: ["mobilization_packet", "handoff_package"],
      alignmentPoints: [
        {
          betweenRoles: ["Tower lead", "Delivery lead"],
          question:
            "Do they agree on the exact metrics, thresholds, and escalation path Tower will actually monitor from day one?",
        },
        {
          betweenRoles: ["Change lead", "Sponsor"],
          question:
            "Is the adoption/change plan something the sponsor believes is realistic, or aspirational?",
        },
      ],
      facilitation: {
        opening:
          "Frame this as the last checkpoint before Tower takes over monitoring — anything not explicitly handed off here is assumed retained by the Move team.",
        closing:
          "Every named metric in the measurement spine must have a baseline, a target, a threshold, and an owner before the room closes — no metric ships without all four.",
        probeIfWeak: [
          "If a metric has no threshold (\"we'll keep an eye on it\"), ask what specific value triggers an escalation and to whom.",
          "If the adoption plan has no named owner, ask who is accountable for adoption not just who is informed of it.",
        ],
        disagreementSignals: [
          "Delivery lead resists Tower's proposed threshold as too aggressive without offering an alternative number.",
          "The sponsor's tone shifts to skeptical when asked to commit to the adoption timeline.",
        ],
        parkingLotRule:
          "Any new scope surfaced during handoff review is logged as a new Move candidate, not folded into this handoff — this session closes the current scope, it does not expand it.",
      },
      workshopTemplates: ["decision_log", "action_register", "approval_page"],
    },
  ],
};

const DEFAULT_PLAYBOOKS: Partial<Record<MovePhase, MovePhasePlaybook>> = {
  1: P1,
  2: P2,
  3: P3,
  4: P4,
  5: P5,
};

/** Resolve the facilitated-session playbook for a phase. `archetypeSessions`
 *  lets an archetype pack (e.g. AI-PDLC P3) replace the default sessions for a
 *  phase while keeping the phase intent. */
export function getMovePhasePlaybook(
  phase: number | null | undefined,
  archetypeSessions?: Partial<Record<MovePhase, MovePhaseSession[]>>,
): MovePhasePlaybook | null {
  if (phase === null || phase === undefined) return null;
  if (phase < 0 || phase > 5) return null;
  const base = DEFAULT_PLAYBOOKS[phase as MovePhase];
  if (!base) return null;
  const override = archetypeSessions?.[phase as MovePhase];
  if (override && override.length) {
    return { ...base, sessions: override };
  }
  return base;
}

export function listPlaybookPhases(): MovePhase[] {
  return Object.keys(DEFAULT_PLAYBOOKS)
    .map((k) => Number(k) as MovePhase)
    .sort((a, b) => a - b);
}
