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
