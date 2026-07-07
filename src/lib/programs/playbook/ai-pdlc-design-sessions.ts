// ── AI-PDLC P3 Solution Design Sessions (PR-6) ────────────────────────────────
// The archetype-specific P3 session pack for an AI-Powered Product Development
// Lifecycle Move. This is the McKinsey-style facilitated-design spine: eight
// working sessions, each with a discussion guide, the option/tradeoff
// frameworks to apply, a capture template, pre-session homework, and an
// alignment gate. Running them produces the attested inputs the Solution
// Architecture, Target Operating Model, Roadmap, and Business Case rest on —
// nothing is fabricated; the sessions are where the real input enters Nexus.

import type { MovePhaseSession } from "./move-phase-playbook";

export const AI_PDLC_P3_SESSIONS: MovePhaseSession[] = [
  {
    id: "s1-usecase-framing",
    label: "1 · Use-case framing & success metrics",
    objective:
      "Lock the AI-PDLC use cases in scope and the measurable success metrics each must move.",
    participants: [
      "Product leadership",
      "Engineering leadership",
      "Move lead",
      "Finance partner",
    ],
    discussionGuide: [
      "Which lifecycle stages (requirements, design, code, review, test, release, incident) are in scope?",
      "For each, what is the developer/PM pain we are removing?",
      "What metric proves the use case worked (cycle time, defect rate, review latency, MTTR)?",
      "What is explicitly out of scope for this Move?",
    ],
    frameworks: [
      {
        id: "usecase-value",
        label: "Use-case value map",
        purpose:
          "Tie each candidate use case to a measurable outcome and a baseline.",
        dimensions: [
          "Use case",
          "Lifecycle stage",
          "Success metric",
          "Baseline",
          "In/out",
        ],
      },
    ],
    captureTemplate: [
      "Use cases in scope",
      "Success metric + baseline per use case",
      "Out-of-scope list",
    ],
    homework: [
      "PM brings the current cycle-time and defect baselines per stage.",
    ],
    gate: {
      criterion: "Use cases and success metrics agreed with baselines named.",
      alignedBy: "Sponsor",
      severity: "hard",
    },
    feedsDeliverables: ["ai_enabled_sdlc_architecture"],
  },
  {
    id: "s2-current-state-pdlc",
    label: "2 · Current-state PDLC mapping",
    objective:
      "Map the current product-development lifecycle and where time, quality, and toil leak.",
    participants: [
      "Engineering managers",
      "Senior developers",
      "QA lead",
      "Release engineering",
    ],
    discussionGuide: [
      "Walk a feature from idea to production — what are the stages and handoffs?",
      "Where are the queues, rework loops, and manual toil?",
      "What tools and data already exist at each stage?",
      "Which stages are safe for automation vs require human approval?",
    ],
    frameworks: [
      {
        id: "value-stream",
        label: "Lifecycle value-stream map",
        purpose:
          "Expose lead time vs touch time and the biggest leakage points.",
        dimensions: [
          "Stage",
          "Lead time",
          "Touch time",
          "Toil / rework",
          "Automation eligibility",
        ],
      },
    ],
    captureTemplate: [
      "Current lifecycle map",
      "Leakage points ranked",
      "Existing tools/data per stage",
      "Human-approval stages",
    ],
    homework: [
      "Eng managers bring DORA metrics and the current toolchain inventory.",
    ],
    gate: {
      criterion:
        "Current-state map attested by engineering, leakage points ranked.",
      alignedBy: "Engineering leadership",
      severity: "hard",
    },
    feedsDeliverables: ["ai_enabled_sdlc_architecture", "discovery_report"],
  },
  {
    id: "s3-target-architecture",
    label: "3 · Target AI-enabled PDLC architecture",
    objective:
      "Design the target AI-enabled lifecycle and the candidate architecture options.",
    participants: [
      "Enterprise architect",
      "Platform engineering",
      "Security/risk",
      "Move lead",
    ],
    discussionGuide: [
      "What is the target AI-enabled lifecycle, stage by stage?",
      "What are the 2–3 architecture options (e.g. IDE-embedded vs platform-orchestrated vs agentic)?",
      "How does each option integrate with the existing toolchain and identity?",
      "What is the human-in-the-loop control point in each option?",
    ],
    frameworks: [
      {
        id: "arch-option-tradeoff",
        label: "Architecture option × tradeoff matrix",
        purpose:
          "Compare options on value, feasibility, risk, and time-to-value.",
        dimensions: ["Option", "Value", "Feasibility", "Risk", "Time-to-value"],
      },
    ],
    captureTemplate: [
      "Target lifecycle (stage by stage)",
      "Architecture options + tradeoffs",
      "Integration points",
      "Human-in-the-loop controls",
    ],
    homework: [
      "Architect drafts 2–3 candidate target architectures with diagrams.",
    ],
    gate: {
      criterion:
        "A preferred architecture option chosen with explicit tradeoffs recorded.",
      alignedBy: "Enterprise architect",
      severity: "hard",
    },
    feedsDeliverables: ["ai_enabled_sdlc_architecture"],
  },
  {
    id: "s4-build-buy-partner",
    label: "4 · Build / buy / partner per capability",
    objective:
      "Decide sourcing for each lifecycle capability with a defensible rationale.",
    participants: [
      "Architecture",
      "Procurement",
      "Engineering leadership",
      "Finance",
    ],
    discussionGuide: [
      "Which capabilities are commodity (buy) vs differentiating (build)?",
      "What vendor options exist for the buy candidates, and what is the lock-in risk?",
      "Where is a partner the right model (capacity, expertise, speed)?",
      "What is the total cost of ownership per option?",
    ],
    frameworks: [
      {
        id: "build-buy-scorecard",
        label: "Build / buy / partner scorecard",
        purpose: "Make a per-capability sourcing decision with rationale.",
        dimensions: [
          "Capability",
          "Build",
          "Buy",
          "Partner",
          "Decision + rationale",
        ],
      },
    ],
    captureTemplate: [
      "Capability sourcing decisions",
      "Vendor shortlist (buy)",
      "Lock-in / exit risks",
      "TCO per decision",
    ],
    homework: [
      "Procurement brings the vendor landscape; Finance brings TCO assumptions.",
    ],
    gate: {
      criterion: "Sourcing decided per capability with rationale.",
      alignedBy: "Engineering leadership",
      severity: "soft",
    },
    feedsDeliverables: ["ai_enabled_sdlc_architecture", "business_case"],
  },
  {
    id: "s5-data-eval-guardrails",
    label: "5 · Data, evaluation & guardrails",
    objective:
      "Define the data access, evaluation, and guardrail model for AI in the lifecycle.",
    participants: ["Security/risk", "Data governance", "ML/AI lead", "Legal"],
    discussionGuide: [
      "What code, tickets, and docs can the AI access, and under what controls?",
      "How do we evaluate model output quality before trusting it (eval harness)?",
      "What guardrails prevent IP leakage, insecure code, and hallucinated changes?",
      "What is logged for audit, and who reviews it?",
    ],
    frameworks: [
      {
        id: "guardrail-matrix",
        label: "Guardrail & evaluation matrix",
        purpose: "Map each risk to a control and an evaluation gate.",
        dimensions: ["Risk", "Control", "Evaluation gate", "Owner"],
      },
    ],
    captureTemplate: [
      "Data access policy",
      "Evaluation harness plan",
      "Guardrails per risk",
      "Audit logging plan",
    ],
    homework: [
      "Security brings the AI-workload guardrail checklist; Data gov brings the data classification.",
    ],
    gate: {
      criterion: "Guardrail and evaluation model signed off by security/risk.",
      alignedBy: "Security/risk",
      severity: "hard",
    },
    feedsDeliverables: [
      "ai_enabled_sdlc_architecture",
      "target_operating_model",
    ],
  },
  {
    id: "s6-operating-model",
    label: "6 · Workflow & role redesign (operating model)",
    objective:
      "Redesign developer/PM workflows and roles for the AI-enabled lifecycle.",
    participants: [
      "Engineering leadership",
      "PM leadership",
      "Change lead",
      "HR/People partner",
    ],
    discussionGuide: [
      "How does each role's day change in the target lifecycle?",
      "What new skills/enablement are needed, and for whom?",
      "What handoffs disappear or move, and what new review duties appear?",
      "What adoption risks exist, and how do we de-risk them?",
    ],
    frameworks: [
      {
        id: "role-shift",
        label: "Role-shift map",
        purpose: "Show before/after for each role and the enablement required.",
        dimensions: ["Role", "Before", "After", "New skills", "Adoption risk"],
      },
    ],
    captureTemplate: [
      "Target operating model",
      "Role-shift map",
      "Enablement plan",
      "Adoption risks + mitigations",
    ],
    homework: [
      "People partner brings the current role definitions and headcount.",
    ],
    gate: {
      criterion: "Target operating model and enablement plan agreed.",
      alignedBy: "Engineering leadership",
      severity: "soft",
    },
    feedsDeliverables: ["target_operating_model"],
  },
  {
    id: "s7-roadmap-sequencing",
    label: "7 · Roadmap & sequencing",
    objective:
      "Sequence the build into workstreams and waves for earliest defensible value.",
    participants: ["Delivery lead", "Architecture", "Product", "Finance"],
    discussionGuide: [
      "What workstreams deliver the target architecture, and what depends on what?",
      "Which wave proves value fastest with acceptable risk?",
      "What are the milestones and exit criteria per wave?",
      "What is the critical path and its risks?",
    ],
    frameworks: [
      {
        id: "wave-sequencing",
        label: "Value × effort wave sequencing",
        purpose:
          "Order workstreams into waves by value, effort, and dependency.",
        dimensions: ["Workstream", "Value", "Effort", "Dependency", "Wave"],
      },
    ],
    captureTemplate: [
      "Workstreams + dependencies",
      "Wave plan + milestones",
      "Exit criteria per wave",
      "Critical path + risks",
    ],
    homework: [
      "Delivery brings a draft work breakdown; Architecture confirms dependencies.",
    ],
    gate: {
      criterion:
        "Roadmap sequenced into waves with milestones and exit criteria.",
      alignedBy: "Sponsor",
      severity: "hard",
    },
    feedsDeliverables: ["execution_roadmap"],
  },
  {
    id: "s8-value-estimate",
    label: "8 · Value model & estimate alignment",
    objective:
      "Align estimates and the value model so the business case derives from approved numbers.",
    participants: ["Finance partner", "Delivery lead", "Product", "Sponsor"],
    discussionGuide: [
      "What is the bottom-up estimate per workstream, and what drives it?",
      "What value does each use case unlock, on what timeline, with what confidence?",
      "What assumptions must hold, and what is the downside case?",
      "What value/estimate ranges does Finance approve for the business case?",
    ],
    frameworks: [
      {
        id: "value-bridge",
        label: "Value bridge",
        purpose:
          "Connect baseline → levers → value with explicit assumptions and confidence.",
        dimensions: ["Lever", "Baseline", "Target", "Value", "Confidence"],
      },
    ],
    captureTemplate: [
      "Estimates (with basis)",
      "Value bridge",
      "Assumptions + downside case",
      "Finance-approved ranges",
    ],
    homework: [
      "Finance brings the approved value ranges; Delivery brings bottom-up estimates.",
    ],
    gate: {
      criterion:
        "Estimates and value model approved by Finance; business case may derive from these (never fabricate ROI).",
      alignedBy: "Finance partner",
      severity: "hard",
    },
    feedsDeliverables: ["business_case", "execution_roadmap"],
  },
];

/** AI-PDLC archetype session overrides, keyed by phase, for the playbook
 *  resolver. Currently the P3 design pack. */
export const AI_PDLC_SESSION_OVERRIDES = { 3: AI_PDLC_P3_SESSIONS } as const;
