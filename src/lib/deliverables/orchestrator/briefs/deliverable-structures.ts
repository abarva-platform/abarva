// Deliverable structures — the section flow per artifact type.
//
// Each structure is a senior consultant's BASELINE (Claude may add to it). The brief
// registry composes a structure with an archetype pack so the same artifact type
// (e.g. a business case) is shaped differently for AMS vs cloud vs AI-PDLC.

import type {
  BriefSection,
  DeliverableModule,
  ExpectedExhibit,
  SectionGroundingMode,
} from "../types";

export interface DeliverableStructure {
  module: DeliverableModule;
  deliverableType: string;
  purpose: string;
  decisionToSupport: string;
  sections: BriefSection[];
  requiredSectionKeys: string[];
  /**
   * Some artifacts are approval instruments, not open-ended consulting reports.
   * When true, the planner must treat `sections` as the whole document shape.
   */
  fixedStructure?: boolean;
  /**
   * Topics that belong to a LATER phase and must not appear as sections here
   * (phase discipline). E.g. a P1 Charter frames the decision to fund discovery
   * — it does not pre-empt P2's current-state analysis or P3's target-state
   * design. Matched case-insensitively against a section's key/title; the
   * architect is told to omit them and the plan sanitizer drops any that slip in.
   */
  forbiddenSectionTopics?: string[];
  /** Same idea as forbiddenSectionTopics, stated as prose Claude can reason from. */
  prohibitedContent?: string[];
  /**
   * Exhibits required BY THIS DELIVERABLE TYPE, regardless of archetype — e.g. a
   * Target State Architecture always needs the three architecture views no
   * matter which use case it's for. Merged with (and additive to) the archetype
   * pack's exhibits in composeBrief; archetype packs stay the source of
   * use-case-specific exhibits (a dependency map, a rollout-wave timeline, etc.).
   */
  expectedExhibits?: ExpectedExhibit[];
}

const s = (
  key: string,
  title: string,
  intent: string,
  groundingMode: SectionGroundingMode,
  expectedEvidenceFamilies: string[] = [],
  expertLatitude = "Bring expert structure and synthesis; add sections if they improve the artifact.",
): BriefSection => ({
  key,
  title,
  intent,
  groundingMode,
  expectedEvidenceFamilies,
  expertLatitude,
});

// ── Moves deliverables (strategic transformation artifacts) ──

// A P1 Charter is a COMMITMENT instrument — it frames the decision to fund
// discovery & design, names the sponsor, sets the value hypothesis and the kill
// criterion. It must NOT pre-empt later phases: no current-state evidence
// analysis (that is P2 Discovery), no target/future-state or solution/architecture
// design (that is P3). The earlier structure carried a required "Current-State
// Evidence" section, which produced premature current/target-state perspectives
// and varied run-to-run; these are the canonical decision-sections instead.
const MOVES_CHARTER: DeliverableStructure = {
  module: "moves",
  deliverableType: "charter",
  purpose:
    "Authorize a strategic move with a clear mandate, sponsor commitment, scope, value hypothesis, governance, and kill criterion — and fund the move into discovery & design.",
  decisionToSupport:
    "Approve chartering of the move (a funded discovery & design gate, NOT a build authorization).",
  sections: [
    s(
      "exec_summary",
      "Executive Summary & Decision Ask",
      "One tight section: the problem, why it matters now, the preliminary value hypothesis (labelled PRELIMINARY), and the approval requested. Framing only — NOT a current-state analysis, solution design, or implementation plan.",
      "mixed",
      [],
      "Keep this section under 250 words. Do not add subsections.",
    ),
    s(
      "problem_opportunity",
      "Problem / Opportunity Being Chartered",
      "Define the business problem or opportunity in plain English, including the trigger, affected business area, and the consequence of doing nothing. Do not assert baselines, root causes, or operating metrics unless cited or labelled as assumptions to validate.",
      "mixed",
      [],
      "Keep this section under 250 words. This is hypothesis framing, not P2 findings.",
    ),
    s(
      "sponsor_commitment",
      "Sponsor, Decision Rights & Change Commitment",
      "Capture accountable role/title, operating owners, decision rights, review cadence, and the commitment to drive business-process change and measurement. Use roles/titles; do not invent named people.",
      "mixed",
      [],
      "Keep this section under 300 words. Use a compact RACI-style table if useful.",
    ),
    s(
      "scope",
      "Scope & Out-of-Scope",
      "Explicit in-scope / out-of-scope boundary — specific business process, user cohort, capability, system/data domain, and decision boundary. Keep future-state design out of the charter.",
      "mixed",
      [],
      "Keep this section under 300 words. A simple in/out table is preferred.",
    ),
    s(
      "success_criteria",
      "Success Criteria & Value Hypothesis",
      "Define success as a four-part commitment: business outcomes, key metrics, post-deployment measurement approach, and the business-process changes required. Label every baseline/target/value figure as cited, PRELIMINARY_ESTIMATE, or [CLIENT TO COMPLETE].",
      "mixed",
      [],
      "Keep this section under 450 words. Use a compact table; do not build the P4 business case here.",
    ),
    s(
      "kill_criterion",
      "Risks, Dependencies & Kill Criteria",
      "Top risks, issues, dependencies, and a specific observable condition that would stop or redirect the Move. Keep the register to the highest-signal items.",
      "mixed",
      [],
      "Keep this section under 350 words. Include the risk/issues/dependencies table required by the quality gate.",
    ),
    s(
      "recommendation",
      "Recommendation & P2 Handoff",
      "Give the clear recommendation: approve the charter to start P2 discovery, approve with caveats, or hold. Include the immediate next actions, evidence families, workshops, and owner roles P2 must complete before any design or build decision.",
      "mixed",
      [],
      "Keep this section under 300 words. Use bullets grouped by business, process, systems/data, controls, and value.",
    ),
  ],
  requiredSectionKeys: [
    "exec_summary",
    "problem_opportunity",
    "sponsor_commitment",
    "scope",
    "success_criteria",
    "kill_criterion",
    "recommendation",
  ],
  fixedStructure: true,
  forbiddenSectionTopics: [
    "current state",
    "current-state",
    "as-is",
    "as is assessment",
    "baseline assessment",
    "target state",
    "target-state",
    "future state",
    "future-state",
    "to-be",
    "gap analysis",
    "solution design",
    "solution architecture",
    "reference architecture",
    "technical architecture",
    "detailed design",
    "implementation plan",
  ],
};

const MOVES_BUSINESS_CASE: DeliverableStructure = {
  module: "moves",
  deliverableType: "business_case",
  purpose:
    "Justify investment in a strategic move with a costed, evidence-grounded business case.",
  decisionToSupport:
    "Approve funding for the move at the proposed investment level.",
  prohibitedContent: [
    "This document argues WHY to fund and HOW value is created — it does not re-litigate the target architecture or write the execution plan; reference them, do not repeat their content.",
  ],
  sections: [
    s(
      "exec_summary",
      "Executive Summary",
      "The investment thesis in brief — this must tell one coherent argument (why change now, what economic leakage the problem creates, what the solution changes, where value comes from, what investment is required, what must hold, what the downside looks like, what leadership is being asked to approve), not a list of disconnected subsection summaries.",
      "mixed",
    ),
    s("decision_required", "Decision Required", "The funding ask.", "mixed"),
    s(
      "problem_opportunity",
      "Problem / Opportunity",
      "The case for change.",
      "mixed",
    ),
    s(
      "current_state",
      "Current-State Baseline",
      "Cost/performance baseline.",
      "governed_facts",
    ),
    s("options", "Options Considered", "Alternatives and trade-offs.", "mixed"),
    s(
      "value_hypothesis",
      "Value Hypothesis & Benefits",
      "Quantified benefits and KPIs.",
      "mixed",
    ),
    s(
      "cost_model",
      "Cost Model",
      "Investment and run-cost view.",
      "governed_facts",
    ),
    s(
      "financials",
      "Financial Summary (NPV/Payback)",
      "The financial case.",
      "mixed",
    ),
    s("risks", "Risks, Issues & Dependencies", "Risk-adjusted view.", "mixed"),
    s(
      "recommendation",
      "Recommendation & Next Actions",
      "Fund / shape / decline.",
      "mixed",
    ),
  ],
  requiredSectionKeys: [
    "exec_summary",
    "decision_required",
    "current_state",
    "value_hypothesis",
    "cost_model",
    "recommendation",
  ],
};

const MOVES_ROADMAP: DeliverableStructure = {
  module: "moves",
  deliverableType: "roadmap",
  purpose:
    "Sequence the move into phases and work packages with gates and dependencies.",
  decisionToSupport:
    "Approve the phasing, sequencing, and resourcing of the move.",
  sections: [
    s(
      "exec_summary",
      "Executive Summary",
      "The shape of the journey.",
      "mixed",
    ),
    s(
      "objectives",
      "Objectives & Guiding Principles",
      "What the roadmap optimizes for.",
      "mixed",
    ),
    s(
      "current_state",
      "Starting Point",
      "Where we are today.",
      "governed_facts",
    ),
    s("phases", "Phases & Work Packages", "Phase plan with outcomes.", "mixed"),
    s(
      "sequencing",
      "Sequencing & Dependencies",
      "Critical path and dependencies.",
      "mixed",
    ),
    s(
      "resourcing",
      "Resourcing & Operating Model",
      "Teams and capacity.",
      "mixed",
    ),
    s(
      "gates",
      "Phase Gates & Milestones",
      "Decision gates.",
      "expert_template",
    ),
    s("risks", "Risks, Issues & Dependencies", "Delivery risks.", "mixed"),
    s(
      "recommendation",
      "Recommendation & Next Actions",
      "Approve and mobilize.",
      "mixed",
    ),
  ],
  requiredSectionKeys: [
    "exec_summary",
    "objectives",
    "phases",
    "sequencing",
    "recommendation",
  ],
};

const MOVES_DISCOVERY: DeliverableStructure = {
  module: "moves",
  deliverableType: "discovery_report",
  purpose:
    "Report discovery findings — maturity, gaps, readiness — to frame the move.",
  decisionToSupport: "Agree the diagnosis and the priority gaps to address.",
  sections: [
    s("exec_summary", "Executive Summary", "Headline findings.", "mixed"),
    s(
      "approach",
      "Approach",
      "How discovery was conducted.",
      "expert_template",
    ),
    s(
      "current_state",
      "Current-State Findings",
      "Evidence-grounded findings.",
      "governed_facts",
    ),
    s(
      "maturity",
      "Maturity & Benchmark",
      "Maturity scoring vs benchmark.",
      "mixed",
    ),
    s("gaps", "Gap Analysis", "Foundation vs use-case gaps.", "mixed"),
    s(
      "readiness",
      "Change & Adoption Readiness",
      "Assess the client's ability AND willingness to make the business-process changes the outcome needs, and to stand up the measurement (per the charter's success criteria). Validate the metric baselines and whether each is measurable today. A high-value outcome with no process-change commitment is not ready — say so.",
      "mixed",
    ),
    s("implications", "Implications", "What it means for the move.", "mixed"),
    s(
      "recommendation",
      "Recommended Move & Next Steps",
      "Where to focus.",
      "mixed",
    ),
  ],
  requiredSectionKeys: [
    "exec_summary",
    "current_state",
    "gaps",
    "recommendation",
  ],
};

const MOVES_TARGET_ARCHITECTURE: DeliverableStructure = {
  module: "moves",
  // MUST match the real gate-artifact key used throughout governance.ts /
  // deliverable-registry.ts ("target_state_architecture"), not a shortened
  // variant — getDeliverableStructure() is an exact-string lookup, so any
  // mismatch here silently falls through to the generic, exhibit-less
  // defaultBrief() for the one artifact type that most needs real diagrams.
  deliverableType: "target_state_architecture",
  purpose:
    "Describe the target architecture and the major technology decisions required to execute the move.",
  decisionToSupport:
    "Approve the target-state architecture, integration posture, controls, and implementation implications.",
  prohibitedContent: [
    "This is an architecture approval, not a build plan — do not commit to vendor pricing, contract terms, or a detailed project schedule here; those belong to Sourcing Strategy and the Execution Roadmap.",
  ],
  expectedExhibits: [
    {
      key: "conceptual_architecture",
      title: "Conceptual Architecture",
      kind: "conceptual_architecture",
      purpose:
        "Shows the business and capability model: what the solution is conceptually and how it supports the business.",
      preferredFormat: "docx",
      requiredElements: [
        "users and personas",
        "business capabilities",
        "channels",
        "major solution domains",
        "trust and governance boundaries",
        "business outcomes",
      ],
      legendRequired: false,
    },
    {
      key: "logical_architecture",
      title: "Logical Architecture",
      kind: "logical_architecture",
      purpose:
        "Shows solution components and interactions: how the solution is logically composed.",
      preferredFormat: "docx",
      requiredElements: [
        "experience layer",
        "workflow/orchestration",
        "agents",
        "models",
        "knowledge/context",
        "integration",
        "data products",
        "identity and security",
        "observability",
        "governance",
        "human-in-the-loop controls",
      ],
      legendRequired: false,
    },
    {
      key: "physical_architecture",
      title: "Physical Architecture",
      kind: "physical_architecture",
      purpose:
        "Shows the actual deployable services: what exactly will be deployed, where, and how it will operate.",
      preferredFormat: "docx",
      requiredElements: [
        "cloud subscription/account boundaries",
        "regions",
        "networks",
        "runtime services",
        "model endpoints",
        "data platforms",
        "vector/search services",
        "queues/events",
        "databases",
        "secrets",
        "monitoring",
        "CI/CD",
        "private endpoints",
        "client data plane",
        "resilience and recovery",
      ],
      legendRequired: true,
    },
    {
      key: "agent_orchestration",
      title: "Agentic Orchestration Flow",
      kind: "agent_orchestration",
      purpose:
        "Shows agent orchestration as an explicit flow, not a single floating 'AI agent' box, mapped to physical services.",
      preferredFormat: "docx",
      requiredElements: [
        "user/system trigger",
        "intent router",
        "planner",
        "context assembler",
        "tool/retrieval selection",
        "model execution",
        "evidence challenge",
        "policy/control gate",
        "human approval where required",
        "action execution",
        "trace/monitoring/feedback",
      ],
      legendRequired: true,
    },
  ],
  sections: [
    s(
      "exec_summary",
      "Executive Summary",
      "Architecture decision in brief.",
      "mixed",
    ),
    s(
      "decision_required",
      "Decision Required",
      "The architecture approval ask.",
      "mixed",
    ),
    s(
      "current_state",
      "Current-State Technology Baseline",
      "What the recorded estate shows today.",
      "governed_facts",
    ),
    s(
      "target_state",
      "Target-State Architecture",
      "Frame the architecture thesis: the core components, responsibilities, and how the three views below (conceptual, logical, physical) answer the questions 'what is it conceptually', 'how is it logically composed', and 'what exactly gets deployed, where'.",
      "mixed",
    ),
    s(
      "conceptual_architecture",
      "Conceptual Architecture",
      "The business/capability view: users and personas, business capabilities, channels, major solution domains, trust and governance boundaries, and the business outcomes this supports. This is the CONCEPTUAL_ARCHITECTURE exhibit rendered with its narrative.",
      "mixed",
    ),
    s(
      "logical_architecture",
      "Logical Architecture",
      "The solution-composition view: experience layer, workflow/orchestration, agents, models, knowledge/context, integration, data products, identity and security, observability, governance, and human-in-the-loop controls. This is the LOGICAL_ARCHITECTURE exhibit rendered with its narrative.",
      "mixed",
    ),
    s(
      "physical_architecture",
      "Physical Architecture",
      "The deployable-services view: cloud subscription/account boundaries, regions, networks, runtime services, model endpoints, data platforms, vector/search services, queues/events, databases, secrets, monitoring, CI/CD, private endpoints, client data plane, resilience and recovery. This is the PHYSICAL_ARCHITECTURE exhibit rendered with its narrative — mark each service illustrative, selected, or client-confirmed.",
      "mixed",
    ),
    s(
      "agent_orchestration",
      "Agentic Orchestration",
      "Do not show 'AI agent' as a single floating box. Show the explicit flow: trigger → intent router → planner → context assembler → tool/retrieval selection → model execution → evidence challenge → policy/control gate → human approval where required → action execution → trace/monitoring/feedback — and map each logical step to a physical service from the Physical Architecture.",
      "mixed",
    ),
    s(
      "data_integration",
      "Data, Integration & Platform Implications",
      "Data products, interfaces, and dependency posture.",
      "mixed",
    ),
    s(
      "security_controls",
      "Security, Privacy & Control Model",
      "Control families and required approvals.",
      "mixed",
    ),
    s(
      "implementation_path",
      "Implementation Path",
      "Sequencing, migration posture, and transition risk.",
      "mixed",
    ),
    s(
      "risks",
      "Risks, Issues & Dependencies",
      "Architecture risks and mitigations.",
      "mixed",
    ),
    s(
      "recommendation",
      "Recommendation & Next Actions",
      "Approve or reshape.",
      "mixed",
    ),
  ],
  requiredSectionKeys: [
    "exec_summary",
    "decision_required",
    "current_state",
    "target_state",
    "conceptual_architecture",
    "logical_architecture",
    "physical_architecture",
    "agent_orchestration",
    "recommendation",
  ],
};

const MOVES_OPERATING_MODEL: DeliverableStructure = {
  module: "moves",
  deliverableType: "operating_model",
  purpose:
    "Define the human and agent operating model required to run the move safely.",
  decisionToSupport:
    "Approve ownership, governance, RACI, controls, and run-state roles.",
  sections: [
    s(
      "exec_summary",
      "Executive Summary",
      "Operating model decision in brief.",
      "mixed",
    ),
    s(
      "current_state",
      "Current Operating Baseline",
      "Recorded ownership and process baseline.",
      "governed_facts",
    ),
    s(
      "future_roles",
      "Future Roles & RACI",
      "Humans, agents, SI, and retained owners.",
      "mixed",
    ),
    s(
      "governance",
      "Governance & Decision Rights",
      "Forums, approvals, escalation, and audit.",
      "mixed",
    ),
    s(
      "controls",
      "Responsible AI & Control Points",
      "Human approval and monitoring controls.",
      "mixed",
    ),
    s(
      "change",
      "Business-Process Change, Adoption & Training",
      "The concrete to-be business-process / operating-model changes that ENABLE each success-criteria outcome (which process change drives which outcome/metric), how people adopt them, and the enablement to capture the metrics post-deployment. This is the people-and-process lever the outcome depends on — make it specific, not a generic change-management paragraph.",
      "mixed",
    ),
    s(
      "risks",
      "Risks, Issues & Dependencies",
      "Operating risks and mitigations.",
      "mixed",
    ),
    s(
      "recommendation",
      "Recommendation & Next Actions",
      "Approve the operating model.",
      "mixed",
    ),
  ],
  requiredSectionKeys: [
    "exec_summary",
    "current_state",
    "future_roles",
    "governance",
    "recommendation",
  ],
};

const MOVES_ESTIMATE: DeliverableStructure = {
  module: "moves",
  deliverableType: "estimate_model",
  purpose:
    "Estimate investment, run-cost change, resourcing, and confidence for the move.",
  decisionToSupport:
    "Approve the estimate range and the assumptions requiring validation.",
  sections: [
    s(
      "exec_summary",
      "Executive Summary",
      "Estimate and confidence in brief.",
      "mixed",
    ),
    s(
      "decision_required",
      "Decision Required",
      "The estimate approval ask.",
      "mixed",
    ),
    s(
      "current_state",
      "Cost / Capacity Baseline",
      "Recorded baseline used for estimating.",
      "governed_facts",
    ),
    s(
      "estimate_method",
      "Estimate Method",
      "How the estimate was built.",
      "mixed",
    ),
    s(
      "cost_model",
      "Investment & Run-Cost Model",
      "Cost pools, assumptions, ranges.",
      "mixed",
    ),
    s(
      "resource_model",
      "Resource Model",
      "Human, agent, SI, and platform capacity.",
      "mixed",
    ),
    s(
      "confidence",
      "Confidence, Sensitivities & Open Items",
      "What could move the estimate.",
      "mixed",
    ),
    s(
      "recommendation",
      "Recommendation & Next Actions",
      "Approve, reshape, or gather missing inputs.",
      "mixed",
    ),
  ],
  requiredSectionKeys: [
    "exec_summary",
    "current_state",
    "estimate_method",
    "cost_model",
    "recommendation",
  ],
};

const MOVES_VALUE: DeliverableStructure = {
  module: "moves",
  deliverableType: "value_model",
  purpose:
    "Define the CFO-facing value model, measurement logic, and realization controls.",
  decisionToSupport:
    "Approve the value case, measurement baseline, and realization governance.",
  sections: [
    s("exec_summary", "Executive Summary", "Value thesis in brief.", "mixed"),
    s(
      "decision_required",
      "Decision Required",
      "The value approval ask.",
      "mixed",
    ),
    s(
      "current_state",
      "Baseline & Evidence",
      "Recorded baseline and evidence maturity.",
      "governed_facts",
    ),
    s(
      "value_pools",
      "Value Pools",
      "Benefit pools, owners, and confidence.",
      "mixed",
    ),
    s(
      "measurement_model",
      "Measurement Model & Enablement",
      "The operational post-deployment measurement plan for each success metric: data source/instrumentation, accountable owner, cadence, attribution method, and the enablement required to capture it. Tie each metric back to its charter outcome and the business-process-change adoption signal that drives it. Where a metric is not yet measurable, the enablement to measure it is a named action, not an assumption.",
      "mixed",
    ),
    s(
      "controls",
      "Finance Controls & Attestation",
      "Approval and variance controls.",
      "mixed",
    ),
    s(
      "risks",
      "Risks, Leakage & Dependencies",
      "What could erode value.",
      "mixed",
    ),
    s(
      "recommendation",
      "Recommendation & Next Actions",
      "Approve and lock the baseline.",
      "mixed",
    ),
  ],
  requiredSectionKeys: [
    "exec_summary",
    "current_state",
    "value_pools",
    "measurement_model",
    "recommendation",
  ],
};

const MOVES_MOBILIZATION: DeliverableStructure = {
  module: "moves",
  deliverableType: "mobilization_plan",
  purpose:
    "Translate the approved move into mobilization workstreams, owners, gates, and go/no-go controls.",
  decisionToSupport: "Approve mobilization and the first execution tranche.",
  sections: [
    s(
      "exec_summary",
      "Executive Summary",
      "Mobilization recommendation in brief.",
      "mixed",
    ),
    s(
      "go_decision",
      "Go / No-Go Decision",
      "The immediate mobilization ask.",
      "mixed",
    ),
    s(
      "current_state",
      "Starting Point",
      "Readiness and open evidence.",
      "governed_facts",
    ),
    s(
      "workstreams",
      "Workstreams & Milestones",
      "The mobilization plan.",
      "mixed",
    ),
    s(
      "raci",
      "RACI & Governance",
      "Named owners and decision rights.",
      "mixed",
    ),
    s(
      "controls",
      "Controls, Gates & Reporting",
      "How execution is governed.",
      "mixed",
    ),
    s(
      "risks",
      "Risks, Issues & Dependencies",
      "Launch risks and mitigations.",
      "mixed",
    ),
    s(
      "recommendation",
      "Recommendation & Next Actions",
      "Approve launch or hold.",
      "mixed",
    ),
  ],
  requiredSectionKeys: [
    "exec_summary",
    "go_decision",
    "workstreams",
    "raci",
    "recommendation",
  ],
};

const MOVES_HANDOFF: DeliverableStructure = {
  module: "moves",
  deliverableType: "handoff_pack",
  purpose:
    "Hand the move from strategy/design into execution and value tracking with clear accountability.",
  decisionToSupport:
    "Accept execution handoff and confirm Tower/value tracking responsibilities.",
  sections: [
    s("exec_summary", "Executive Summary", "Handoff state in brief.", "mixed"),
    s(
      "approved_decisions",
      "Approved Decisions",
      "What has been approved and by whom.",
      "mixed",
    ),
    s(
      "current_state",
      "Evidence & Open Gaps",
      "Evidence used and remaining gaps.",
      "governed_facts",
    ),
    s(
      "execution_contract",
      "Execution Contract",
      "Scope, owners, milestones, and controls.",
      "mixed",
    ),
    s(
      "tower_handoff",
      "Tower / Value Ledger Handoff",
      "Metrics, cadence, and ownership.",
      "mixed",
    ),
    s(
      "risks",
      "Risks, Issues & Dependencies",
      "Handoff risks and mitigations.",
      "mixed",
    ),
    s(
      "recommendation",
      "Recommendation & Next Actions",
      "Accept handoff and start execution.",
      "mixed",
    ),
  ],
  requiredSectionKeys: [
    "exec_summary",
    "approved_decisions",
    "execution_contract",
    "tower_handoff",
    "recommendation",
  ],
};

const MOVES_EXECUTIVE_PLAYBACK: DeliverableStructure = {
  module: "moves",
  deliverableType: "executive_playback",
  purpose:
    "Assemble the executive story across charter, evidence, architecture, value, mobilization, and controls.",
  decisionToSupport:
    "Give executives a complete, traceable readout and the next decision.",
  sections: [
    s(
      "exec_summary",
      "Executive Summary",
      "The answer and decision ask.",
      "mixed",
    ),
    s(
      "move_story",
      "Move Story",
      "Why this move exists and where it is going.",
      "mixed",
    ),
    s(
      "current_state",
      "Evidence Basis",
      "The evidence the story rests on.",
      "governed_facts",
    ),
    s(
      "solution",
      "Solution / Architecture / Operating Model",
      "How the move works.",
      "mixed",
    ),
    s(
      "value",
      "Value, Cost & Confidence",
      "The value and cost posture.",
      "mixed",
    ),
    s(
      "mobilization",
      "Mobilization & Controls",
      "How execution starts and stays governed.",
      "mixed",
    ),
    s(
      "risks",
      "Risks, Issues & Dependencies",
      "The honest risk view.",
      "mixed",
    ),
    s(
      "recommendation",
      "Recommendation & Next Actions",
      "The clear next executive move.",
      "mixed",
    ),
  ],
  requiredSectionKeys: [
    "exec_summary",
    "current_state",
    "solution",
    "value",
    "recommendation",
  ],
};

// ── Source deliverables (sourcing & procurement artifacts) ──

const SOURCE_STRATEGY_MEMO: DeliverableStructure = {
  module: "source",
  deliverableType: "sourcing_strategy_memo",
  purpose:
    "Set the sourcing strategy for the event — objective, approach, commercial model, evaluation.",
  decisionToSupport: "Approve the sourcing strategy and go-to-market approach.",
  sections: [
    s(
      "sourcing_objective",
      "Sourcing Objective",
      "What this event must achieve.",
      "mixed",
    ),
    s(
      "event_archetype",
      "Event Archetype & Scope",
      "The type of event and scope.",
      "mixed",
    ),
    s(
      "current_state",
      "Current-State Baseline",
      "Today's baseline.",
      "governed_facts",
    ),
    s(
      "market",
      "Vendor Landscape",
      "Market structure and candidates.",
      "expert_template",
    ),
    s(
      "commercial_model",
      "Commercial Model",
      "Pricing/commercial approach.",
      "mixed",
    ),
    s("evaluation", "Evaluation Approach", "How we will decide.", "mixed"),
    s(
      "negotiation",
      "Negotiation Levers & Protections",
      "Leverage and risk protections.",
      "mixed",
    ),
    s(
      "recommendation",
      "Recommendation & Next Actions",
      "Approve and proceed.",
      "mixed",
    ),
  ],
  requiredSectionKeys: [
    "sourcing_objective",
    "event_archetype",
    "current_state",
    "commercial_model",
    "evaluation",
    "recommendation",
  ],
};

const SOURCE_EVAL_WORKBOOK: DeliverableStructure = {
  module: "source",
  deliverableType: "evaluation_workbook",
  purpose: "Provide the proposal evaluation framework and scoring workbook.",
  decisionToSupport:
    "Adopt the evaluation framework and select the preferred vendor.",
  sections: [
    s(
      "purpose",
      "Purpose & Method",
      "How evaluation works.",
      "expert_template",
    ),
    s(
      "criteria",
      "Criteria & Weights",
      "Weighted criteria.",
      "client_to_complete",
    ),
    s(
      "scoring",
      "Scoring Model",
      "Scoring scale and rules.",
      "expert_template",
    ),
    s(
      "current_state",
      "Requirements Baseline",
      "What is being evaluated against.",
      "governed_facts",
    ),
    s(
      "results",
      "Results Summary",
      "Scores and ranking (placeholder until responses).",
      "client_to_complete",
    ),
    s(
      "recommendation",
      "Recommendation",
      "Preferred vendor and rationale.",
      "mixed",
    ),
  ],
  requiredSectionKeys: ["purpose", "criteria", "scoring", "recommendation"],
};

const SOURCE_EXEC_REC: DeliverableStructure = {
  module: "source",
  deliverableType: "executive_recommendation",
  purpose: "Recommend the award/negotiation decision to executives.",
  decisionToSupport:
    "Approve the recommended vendor selection and negotiation mandate.",
  sections: [
    s(
      "exec_summary",
      "Executive Summary",
      "The recommendation in brief.",
      "mixed",
    ),
    s(
      "decision_required",
      "Decision Required",
      "The award/negotiation ask.",
      "mixed",
    ),
    s("process", "Process Run", "How the event was run.", "expert_template"),
    s(
      "current_state",
      "Baseline & Outcomes",
      "Baseline vs outcome.",
      "governed_facts",
    ),
    s("evaluation", "Evaluation Outcome", "Scores and rationale.", "mixed"),
    s("commercial", "Commercial Outcome", "Pricing and terms.", "mixed"),
    s("risks", "Risks & Protections", "Residual risks.", "mixed"),
    s(
      "recommendation",
      "Recommendation & Next Actions",
      "Award and mandate.",
      "mixed",
    ),
  ],
  requiredSectionKeys: [
    "exec_summary",
    "decision_required",
    "evaluation",
    "recommendation",
  ],
};

export const DELIVERABLE_STRUCTURES: DeliverableStructure[] = [
  MOVES_CHARTER,
  MOVES_BUSINESS_CASE,
  MOVES_ROADMAP,
  MOVES_DISCOVERY,
  MOVES_TARGET_ARCHITECTURE,
  MOVES_OPERATING_MODEL,
  MOVES_ESTIMATE,
  MOVES_VALUE,
  MOVES_MOBILIZATION,
  MOVES_HANDOFF,
  MOVES_EXECUTIVE_PLAYBACK,
  SOURCE_STRATEGY_MEMO,
  SOURCE_EVAL_WORKBOOK,
  SOURCE_EXEC_REC,
];

export function getDeliverableStructure(
  module: string,
  deliverableType: string,
): DeliverableStructure | undefined {
  return DELIVERABLE_STRUCTURES.find(
    (d) => d.module === module && d.deliverableType === deliverableType,
  );
}
