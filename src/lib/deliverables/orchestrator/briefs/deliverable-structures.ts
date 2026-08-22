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
import { CHARTER_CONTRACT } from "@/lib/deliverables/shared/artifact-contracts";

/**
 * The Charter's per-section word cap, read from the shared contract
 * (src/lib/deliverables/shared/artifact-contracts.ts) so it can never
 * silently diverge from the golden-bar pipeline's copy — see docs/
 * architecture/MOVES_DUAL_PIPELINE_AUDIT.md.
 */
function charterSectionMaxWords(key: string): number {
  const section = CHARTER_CONTRACT.sections.find((s) => s.key === key);
  if (!section) {
    throw new Error(`No shared contract section for charter key "${key}"`);
  }
  return section.maxWords;
}

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

// A P1 Charter is a COMMITMENT instrument — it authorizes and bounds Discovery,
// names the sponsor, and prepares the client for what Discovery will need. It
// must NOT pre-empt later phases: no current-state evidence analysis (that is
// P2 Discovery), no target/future-state or solution/architecture design (that
// is P3). Redesigned 2026-07-25: the Charter ends with a first-class
// "Discovery Preparation" section (two tables + a short pointer to the
// separate, detailed Discovery Guidebook generated after approval) instead of
// folding that content as bullets inside a generic recommendation section —
// see the shared contract (src/lib/deliverables/shared/artifact-contracts.ts)
// for the canonical 9-section list both pipelines read from.
const MOVES_CHARTER: DeliverableStructure = {
  module: "moves",
  deliverableType: "charter",
  purpose:
    "Authorize a strategic move with a clear mandate, sponsor commitment, scope, value hypothesis, governance, and kill criterion — and fund the move into discovery & design.",
  decisionToSupport:
    "Approve chartering of the move (a funded discovery & design gate, NOT a build authorization).",
  sections: [
    s(
      "charter_decision",
      "Charter Decision",
      "State one of: Authorize Discovery / Authorize Discovery with Conditions / Do Not Authorize Discovery, plus a concise executive decision summary. Framing only — NOT a current-state analysis, solution design, or implementation plan.",
      "mixed",
      [],
      `Keep this section under ${charterSectionMaxWords("charter_decision")} words. Use one short paragraph plus a small decision box; do not add subsections.`,
    ),
    s(
      "opportunity_context",
      "Opportunity & Business Context",
      "Why this Move is being considered, why it matters now, the business opportunity or challenge, and expected business value direction. Only approved P0 capture, sponsor input, and approved enterprise context — do not assert baselines, root causes, or operating metrics unless cited or labelled as assumptions to validate.",
      "mixed",
      [],
      `Keep this section under ${charterSectionMaxWords("opportunity_context")} words. This is hypothesis framing, not P2 findings.`,
    ),
    s(
      "intended_outcomes",
      "Intended Outcomes",
      "The business outcomes Discovery is intended to evaluate — objectives, not commitments or validated findings.",
      "mixed",
      [],
      `Keep this section under ${charterSectionMaxWords("intended_outcomes")} words. Do not state these as validated results.`,
    ),
    s(
      "scope",
      "Scope & Out of Scope",
      "A simple two-column table: In Scope / Out of Scope. Keep future-state design out of the charter.",
      "mixed",
      [],
      `Keep this section under ${charterSectionMaxWords("scope")} words. Use a simple two-column table.`,
    ),
    s(
      "success_measures",
      "Success Measures",
      "How the organization will determine whether Discovery was successful. Do not invent current-state baselines, target metrics, or financial benefits.",
      "mixed",
      [],
      `Keep this section under ${charterSectionMaxWords("success_measures")} words. Do not build the P4 business case here.`,
    ),
    s(
      "sponsorship_governance",
      "Sponsorship & Governance",
      "Executive sponsor, decision authority, working team, and governance cadence (if known). Use roles/titles; do not invent named people. Unknown items labeled Client Decision Required.",
      "mixed",
      [],
      `Keep this section under ${charterSectionMaxWords("sponsorship_governance")} words. Use a compact role/title table; no narrative role biographies.`,
    ),
    s(
      "known_constraints_dependencies",
      "Known Constraints & Dependencies",
      "Only constraints and dependencies already supported by approved evidence — do not infer risks. Unknown items labeled To Validate During Discovery.",
      "mixed",
      [],
      `Keep this section under ${charterSectionMaxWords("known_constraints_dependencies")} words. Include only constraints/dependencies actually supported by evidence.`,
    ),
    s(
      "discovery_preparation",
      "Discovery Preparation",
      "Sets expectations for the Discovery phase — not the assessment itself. An executive table (Area / What to Expect / What We Need From You / Priority) across Business Process, People & Governance, Technology, Data, Performance, and Risk & Controls; a second table of typical Discovery activities and durations; then a short closing paragraph noting that a detailed Discovery Guidebook, tailored to this Move, will be generated after Charter approval. Do not embed that detailed material here.",
      "mixed",
      [],
      `Keep this section under ${charterSectionMaxWords("discovery_preparation")} words. Two tables plus one short closing paragraph — no interview questionnaires or workshop agendas here.`,
    ),
    s(
      "authorization_next_steps",
      "Authorization & Immediate Next Steps",
      "Charter decision, immediate actions, conditions (if any), and the expected transition into P2.",
      "mixed",
      [],
      `Keep this section under ${charterSectionMaxWords("authorization_next_steps")} words. Use bullets grouped by decision, actions, and conditions.`,
    ),
  ],
  requiredSectionKeys: [
    "charter_decision",
    "opportunity_context",
    "intended_outcomes",
    "scope",
    "success_measures",
    "sponsorship_governance",
    "known_constraints_dependencies",
    "discovery_preparation",
    "authorization_next_steps",
  ],
  fixedStructure: true,
  forbiddenSectionTopics: [...CHARTER_CONTRACT.forbiddenTopics],
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
  // Added 2026-07-25 (REF_EXECUTIVE_ROADMAP pilot) — previously this brief had
  // NO expectedExhibits at all, so the roadmap rendered as a generic
  // timeline/flow diagram indistinguishable from any other exhibit. Required
  // elements mirror EXECUTIVE_ROADMAP_REFERENCE.requiredItemFields plus the
  // horizon/workstream structure itself (see shared/reference-library/
  // executive-roadmap-reference.ts — the single source both pipelines and the
  // renderer read from).
  expectedExhibits: [
    {
      key: "executive_roadmap",
      title: "Executive Transition Roadmap",
      kind: "roadmap",
      purpose:
        "Shows the sequencing argument — horizons × workstreams with decision gates and dependencies — not a project schedule.",
      preferredFormat: "docx",
      requiredElements: [
        "Mobilize",
        "Establish Foundation",
        "Deliver Priority Outcomes",
        "Scale and Optimize",
        "decision gate",
        "dependency",
        "owner",
        "success measure",
      ],
      legendRequired: true,
    },
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

const MOVES_ROOT_CAUSE_WORKSHEET: DeliverableStructure = {
  module: "moves",
  deliverableType: "root_cause_worksheet",
  purpose:
    "Explain the small set of evidence-backed root causes behind the current-state symptoms and what they imply for P3 design.",
  decisionToSupport:
    "Agree the root-cause diagnosis, confidence level, and remaining validation gaps before choosing solution options.",
  sections: [
    s(
      "exec_answer",
      "Executive Answer",
      "State the root-cause thesis in 3-5 bullets: what is really driving the problem, how confident we are, and what must still be validated. Do not restate the full discovery report.",
      "mixed",
      [],
      "Keep under 175 words. Lead with the answer, not methodology.",
    ),
    s(
      "symptom_cause_table",
      "Symptoms vs. Causes",
      "Map each major symptom to the likely root cause, cited evidence, confidence, and implication.",
      "mixed",
      [
        "process_evidence",
        "metrics_baseline",
        "systems_inventory",
        "data_quality",
        "operating_model",
      ],
      "Use a compact table. Separate cited facts from hypotheses to validate.",
    ),
    s(
      "root_cause_tree",
      "Root-Cause Tree",
      "Show the 2-4 highest-signal root-cause branches and the evidence that supports or weakens each branch.",
      "mixed",
      [
        "pain_points",
        "handoffs",
        "technology_stack",
        "controls",
        "workforce_signals",
      ],
      "Use issue-tree logic: symptom -> cause branch -> evidence -> implication. Do not create dozens of leaves.",
    ),
    s(
      "confidence_gaps",
      "Confidence & Open Gaps",
      "Separate high-confidence causes from areas that remain unproven, including the specific evidence needed to close each gap.",
      "mixed",
      ["evidence_gaps", "source_register"],
      "Use a short confidence table; never fabricate certainty.",
    ),
    s(
      "p3_implications",
      "Implications for P3 Options",
      "Translate the diagnosis into design constraints and solution-option questions for P3. Do not design the solution here.",
      "mixed",
      [],
      "Keep to decision-useful implications: process, data/platform, controls, change, and value measurement.",
    ),
  ],
  requiredSectionKeys: [
    "exec_answer",
    "symptom_cause_table",
    "root_cause_tree",
    "confidence_gaps",
    "p3_implications",
  ],
  fixedStructure: true,
  forbiddenSectionTopics: [
    "target state",
    "target-state",
    "future state",
    "solution architecture",
    "technical architecture",
    "implementation roadmap",
    "business case",
    "financial model",
  ],
  prohibitedContent: [
    "This is a P2 diagnostic artifact, not a P3 solution design or P4 business case. Do not prescribe the final architecture, operating model, roadmap, vendor path, or investment case.",
    "Do not produce a long discovery report. Keep the artifact issue-tree led and focused on the few root causes that matter for the next decision.",
  ],
  expectedExhibits: [
    {
      key: "symptom_cause_table",
      title: "Symptoms vs. Root Causes",
      kind: "matrix",
      purpose:
        "Shows which observed symptoms map to each likely root cause, with evidence and confidence.",
      preferredFormat: "docx",
      requiredElements: [
        "symptom",
        "likely cause",
        "evidence",
        "confidence",
        "P3 implication",
      ],
    },
    {
      key: "root_cause_tree",
      title: "Root-Cause Tree",
      kind: "diagram",
      purpose:
        "Shows the issue-tree logic from symptoms to root-cause branches and supporting evidence.",
      preferredFormat: "docx",
      requiredElements: [
        "symptom",
        "cause branch",
        "evidence",
        "gap",
        "implication",
      ],
      legendRequired: true,
    },
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

const MOVES_SOLUTION_DESIGN: DeliverableStructure = {
  module: "moves",
  deliverableType: "solution_design",
  purpose:
    "Translate the accepted Target Architecture into an implementable solution design without reopening the approved solution approach.",
  decisionToSupport:
    "Approve the service, workflow, integration, control, and acceptance design that delivery will elaborate.",
  fixedStructure: true,
  prohibitedContent: [
    "Do not repeat the full current-state diagnosis or Target Architecture narrative. Summarize only the implications needed to understand this design.",
    "Do not select a new solution option, vendor, cloud, model, or deployment fact that is not present in the accepted architecture or an explicitly proposed ADR.",
  ],
  expectedExhibits: [
    {
      key: "experience_flow",
      title: "End-to-End Experience Flow",
      kind: "flow",
      purpose:
        "Shows the user, AI, human decision, and system actions end to end.",
      preferredFormat: "docx",
      requiredElements: [
        "user trigger",
        "AI assistance",
        "human checkpoint",
        "system action",
        "outcome telemetry",
      ],
      legendRequired: true,
    },
    {
      key: "component_interaction",
      title: "Component Interaction View",
      kind: "logical_architecture",
      purpose:
        "Shows how the accepted architecture components collaborate for the priority journey.",
      preferredFormat: "docx",
      requiredElements: [
        "experience",
        "orchestration",
        "retrieval",
        "model",
        "policy gate",
        "audit",
      ],
      legendRequired: true,
    },
    {
      key: "exception_control_flow",
      title: "Exception and Control Flow",
      kind: "agent_orchestration",
      purpose: "Shows normal, exception, override, and escalation paths.",
      preferredFormat: "docx",
      requiredElements: [
        "normal path",
        "exception",
        "human approval",
        "override",
        "escalation",
        "audit",
      ],
      legendRequired: true,
    },
  ],
  sections: [
    s(
      "exec_decision",
      "Executive Decision & Design Basis",
      "The approved option, accepted architecture basis, design decision, and material open items in one compact read.",
      "mixed",
      [],
      "Keep under 300 words; lead with the decision and do not restate the full architecture.",
    ),
    s(
      "journey_workflow",
      "End-to-End Journey & Human/AI Workflow",
      "The user journey, AI assistance, human decisions, exceptions, and measurable outcomes.",
      "mixed",
      [],
      "Keep under 450 words plus one workflow exhibit.",
    ),
    s(
      "service_design",
      "Service & Component Design",
      "Responsibilities, interfaces, and interaction of the reusable services inherited from the accepted architecture.",
      "mixed",
      [],
      "Keep under 550 words plus a component interaction exhibit.",
    ),
    s(
      "data_integration",
      "Data, Context & Integration Contracts",
      "Inputs, outputs, system-of-record boundaries, data products, interface patterns, and unresolved contracts.",
      "mixed",
      [],
      "Keep under 500 words; use a compact contract table.",
    ),
    s(
      "controls_exceptions",
      "Controls, Exceptions & Decision Rights",
      "Human checkpoints, policy enforcement, exception handling, audit evidence, and prohibited autonomous actions.",
      "mixed",
      [],
      "Keep under 450 words plus one exception/control exhibit.",
    ),
    s(
      "nfr_operability",
      "Non-Functional Design & Operability",
      "Security, privacy, resilience, observability, performance, support, and model operations requirements.",
      "mixed",
      [],
      "Keep under 450 words; distinguish confirmed requirements from open decisions.",
    ),
    s(
      "acceptance_traceability",
      "Acceptance, Traceability & Open Decisions",
      "Acceptance criteria, trace to architecture decisions/evidence, dependencies, risks, and the decisions required before roadmap planning.",
      "mixed",
      [],
      "Keep under 450 words using concise tables.",
    ),
    s(
      "recommendation",
      "Recommendation & Next Actions",
      "Approve, revise, or hold the solution design with named owners for open decisions.",
      "mixed",
      [],
      "Keep under 150 words.",
    ),
  ],
  requiredSectionKeys: [
    "exec_decision",
    "journey_workflow",
    "service_design",
    "data_integration",
    "controls_exceptions",
    "nfr_operability",
    "acceptance_traceability",
    "recommendation",
  ],
};

const MOVES_OPERATING_MODEL: DeliverableStructure = {
  module: "moves",
  // The Moves registry key `operating_model_design` intentionally routes to
  // the orchestrator's canonical `operating_model` key. Keep the premium P3
  // contract on the canonical key so the live worker cannot fall through to a
  // generic operating-model binder.
  deliverableType: "operating_model",
  purpose:
    "Define the human, AI, governance, and service-management model required to operate the accepted solution safely.",
  decisionToSupport:
    "Approve the human/AI work split, accountable roles, decision rights, controls, cadence, and adoption obligations.",
  fixedStructure: true,
  prohibitedContent: [
    "Do not repeat the solution specification or invent a different architecture.",
    "Do not create named people, organization units, staffing quantities, or approval authorities that are not evidenced or explicitly client-to-confirm.",
  ],
  expectedExhibits: [
    {
      key: "human_ai_work_split",
      title: "Human and AI Work Split",
      kind: "flow",
      purpose:
        "Shows which work is assisted, reviewed, decided, escalated, and monitored.",
      preferredFormat: "docx",
      requiredElements: [
        "human task",
        "AI task",
        "decision",
        "exception",
        "audit",
      ],
      legendRequired: true,
    },
    {
      key: "decision_rights",
      title: "Decision Rights and Escalation",
      kind: "flow",
      purpose:
        "Shows accountable decisions, forums, thresholds, and escalation paths.",
      preferredFormat: "docx",
      requiredElements: [
        "decision",
        "owner role",
        "threshold",
        "forum",
        "escalation",
      ],
      legendRequired: true,
    },
  ],
  sections: [
    s(
      "exec_decision",
      "Executive Decision & Operating Thesis",
      "The operating-model decision, what changes, and what remains client-to-confirm.",
      "mixed",
      [],
      "Keep under 300 words.",
    ),
    s(
      "human_ai_split",
      "Human/AI Work Split",
      "Work allocation across the priority journey, including prohibited autonomous decisions and exceptions.",
      "mixed",
      [],
      "Keep under 500 words plus one exhibit.",
    ),
    s(
      "roles_raci",
      "Roles, Accountabilities & RACI",
      "Retained business, technology, risk, data, service, and partner roles with explicit accountability.",
      "mixed",
      [],
      "Keep under 600 words using role and RACI tables.",
    ),
    s(
      "decision_controls",
      "Decision Rights, Controls & Escalation",
      "Approval thresholds, control ownership, override rights, forums, and escalation paths.",
      "mixed",
      [],
      "Keep under 550 words plus one decision-rights exhibit.",
    ),
    s(
      "run_cadence",
      "Run Cadence, Monitoring & Service Management",
      "Operating forums, telemetry, incident/model handling, policy refresh, and continuous-improvement cadence.",
      "mixed",
      [],
      "Keep under 500 words using a cadence table.",
    ),
    s(
      "adoption",
      "Adoption, Training & Business-Process Change",
      "Role-specific behavior change, enablement, adoption measures, and accountability for benefits realization.",
      "mixed",
      [],
      "Keep under 450 words; tie each action to the changed process and measure.",
    ),
    s(
      "risks_open",
      "Risks, Open Decisions & Mobilization Actions",
      "Material operating risks, unresolved ownership, dependencies, and immediate actions before roadmap planning.",
      "mixed",
      [],
      "Keep under 400 words using concise tables.",
    ),
    s(
      "recommendation",
      "Recommendation & Next Actions",
      "Approve, revise, or hold the operating model.",
      "mixed",
      [],
      "Keep under 120 words.",
    ),
  ],
  requiredSectionKeys: [
    "exec_decision",
    "human_ai_split",
    "roles_raci",
    "decision_controls",
    "run_cadence",
    "adoption",
    "risks_open",
    "recommendation",
  ],
};

const MOVES_REQUIREMENTS_TRACEABILITY: DeliverableStructure = {
  module: "moves",
  deliverableType: "requirements_traceability",
  purpose:
    "Prove that approved requirements, evidence, design choices, controls, and open decisions remain traceable before the design gate closes.",
  decisionToSupport:
    "Approve the traceability baseline for roadmap and business-case planning, or hold for unresolved evidence/design gaps.",
  fixedStructure: true,
  prohibitedContent: [
    "Do not repeat the full target architecture, solution design, operating model, discovery report, or implementation roadmap.",
    "Do not add broad methodology, vendor landscape, funding narrative, or future-state design sections.",
    "Do not invent requirements, owners, metrics, systems, dates, or commercial values to fill the matrix.",
  ],
  sections: [
    s(
      "traceability_verdict",
      "Traceability Verdict",
      "The gate-ready answer: traceable / traceable with conditions / hold, and why.",
      "mixed",
      [],
      "Keep under 180 words. State the verdict, material conditions, and what decision this enables.",
    ),
    s(
      "requirements_baseline",
      "Requirements Baseline",
      "The confirmed and open requirement set, grouped by business capability, process, data, technology, controls, and adoption.",
      "mixed",
      [],
      "Keep under 450 words using a compact requirements table; do not narrate every row.",
    ),
    s(
      "evidence_design_trace",
      "Evidence-to-Design Trace Matrix",
      "Map requirements to evidence, design component, control, owner, and status.",
      "mixed",
      [],
      "Keep under 650 words using one traceability matrix; tables carry the detail, prose only explains exceptions.",
    ),
    s(
      "gaps_controls",
      "Open Gaps, Controls & Acceptance Rules",
      "Unresolved evidence, assumptions to validate, design controls, and acceptance rules required before the next phase.",
      "mixed",
      [],
      "Keep under 450 words using a single exception/control table.",
    ),
    s(
      "recommendation",
      "Recommendation & Next Actions",
      "Approve, approve with conditions, or hold the traceability baseline with named owner actions.",
      "mixed",
      [],
      "Keep under 120 words.",
    ),
  ],
  requiredSectionKeys: [
    "traceability_verdict",
    "requirements_baseline",
    "evidence_design_trace",
    "gaps_controls",
    "recommendation",
  ],
};

const MOVES_SOURCING_STRATEGY: DeliverableStructure = {
  module: "moves",
  deliverableType: "sourcing_strategy",
  purpose:
    "Decide how the capabilities in the accepted architecture and operating model should be built, bought, configured, or partnered.",
  decisionToSupport:
    "Approve the sourcing posture, evaluation basis, commercial guardrails, and next sourcing actions without reopening the solution option.",
  fixedStructure: true,
  prohibitedContent: [
    "Do not reopen or replace the approved solution approach.",
    "Do not invent vendors, prices, contract facts, shortlist status, or platform selections. Unknowns remain open decisions or market-test requirements.",
  ],
  expectedExhibits: [
    {
      key: "sourcing_options_matrix",
      title: "Build / Buy / Configure / Partner Matrix",
      kind: "matrix",
      purpose:
        "Compares sourcing paths by required capability and decision criterion.",
      preferredFormat: "docx",
      requiredElements: [
        "capability",
        "options",
        "criteria",
        "trade-off",
        "recommended posture",
      ],
      legendRequired: false,
    },
  ],
  sections: [
    s(
      "exec_decision",
      "Executive Decision & Recommended Posture",
      "The sourcing decision, recommendation, guardrails, and open inputs in one page-equivalent read.",
      "mixed",
      [],
      "Keep under 200 words.",
    ),
    s(
      "capability_boundary",
      "Capability & Sourcing Boundary",
      "Capabilities inherited from the architecture, what is reusable, what requires market capacity, and explicit exclusions.",
      "mixed",
      [],
      "Keep under 325 words using a capability table.",
    ),
    s(
      "options",
      "Sourcing Options & Trade-Offs",
      "Build, buy, configure, partner, and hybrid options assessed without naming unsupported vendors.",
      "mixed",
      [],
      "Keep under 425 words plus one options matrix.",
    ),
    s(
      "evaluation_commercial",
      "Evaluation & Commercial Guardrails",
      "Decision criteria, evidence required, commercial principles, risk protections, and market-test questions.",
      "mixed",
      [],
      "Keep under 350 words using compact criteria and guardrail tables.",
    ),
    s(
      "delivery_governance",
      "Delivery Model, Governance & Dependencies",
      "Retained ownership, partner boundaries, transition responsibilities, architecture conformance, and dependencies.",
      "mixed",
      [],
      "Keep under 325 words.",
    ),
    s(
      "risks_open",
      "Risks, Open Decisions & Required Inputs",
      "Material sourcing risks, unresolved platform/vendor decisions, and evidence required before an event or award.",
      "mixed",
      [],
      "Keep under 275 words using a single table.",
    ),
    s(
      "recommendation",
      "Recommendation & Next Actions",
      "Approve the posture, authorize a market test, or hold for evidence.",
      "mixed",
      [],
      "Keep under 80 words.",
    ),
  ],
  requiredSectionKeys: [
    "exec_decision",
    "capability_boundary",
    "options",
    "evaluation_commercial",
    "delivery_governance",
    "risks_open",
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
      [],
      "Keep under 350 words. State whether a finance-grade model exists; if not, summarize the input-register status without repeating the business case.",
    ),
    s(
      "decision_required",
      "Decision Required",
      "The estimate approval ask.",
      "mixed",
      [],
      "Keep under 250 words. Name the approval condition and missing inputs; do not add narrative background.",
    ),
    s(
      "current_state",
      "Cost / Capacity Baseline",
      "Recorded baseline used for estimating.",
      "governed_facts",
      [],
      "Keep under 450 words. Use one compact table for baseline status; do not invent cost, ROI, payback, or benefit values.",
    ),
    s(
      "estimate_method",
      "Estimate Method",
      "How the estimate was built.",
      "mixed",
      [],
      "Keep under 450 words. Describe the model formula and evidence requirements, not a full methodology essay.",
    ),
    s(
      "cost_model",
      "Investment & Run-Cost Model",
      "Cost pools, assumptions, ranges.",
      "mixed",
      [],
      "Keep under 700 words. Prefer a compact input-register table. If inputs are absent, mark them open rather than filling numeric placeholders.",
    ),
    s(
      "resource_model",
      "Resource Model",
      "Human, agent, SI, and platform capacity.",
      "mixed",
      [],
      "Keep under 550 words. Name resource categories and confirmation owners; avoid staffing arithmetic without evidence.",
    ),
    s(
      "confidence",
      "Confidence, Sensitivities & Open Items",
      "What could move the estimate.",
      "mixed",
      [],
      "Keep under 650 words. Consolidate sensitivities and open inputs in one table; do not repeat caveats from prior sections.",
    ),
    s(
      "recommendation",
      "Recommendation & Next Actions",
      "Approve, reshape, or gather missing inputs.",
      "mixed",
      [],
      "Keep under 350 words. Make the recommendation crisp and conditional on evidence gates.",
    ),
  ],
  requiredSectionKeys: [
    "exec_summary",
    "current_state",
    "estimate_method",
    "cost_model",
    "recommendation",
  ],
  fixedStructure: true,
  prohibitedContent: [
    "Do not add a second business case narrative.",
    "Do not include invented implementation budgets, annual savings, ROI, NPV, IRR, or payback.",
    "Do not expand into a full financial model when finance-grade inputs are absent; produce an input register instead.",
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
    s(
      "exec_summary",
      "Executive Summary",
      "Value thesis in brief.",
      "mixed",
      [],
      "Keep under 250 words. State the measurement posture, readiness verdict, and immediate owner action; do not repeat the business case.",
    ),
    s(
      "decision_required",
      "Decision Required",
      "The value approval ask.",
      "mixed",
      [],
      "Keep under 180 words. State the measurement approval decision and do not repeat the business case.",
    ),
    s(
      "current_state",
      "Baseline & Evidence",
      "Recorded baseline and evidence maturity.",
      "governed_facts",
      [],
      "Keep under 325 words. Use one compact table for baseline status, owner, and evidence gap.",
    ),
    s(
      "value_pools",
      "Value Pools",
      "Benefit pools, owners, and confidence.",
      "mixed",
      [],
      "Keep under 300 words. Use a compact table: value pool, owner, measure, source, baseline status. Do not repeat the business case.",
    ),
    s(
      "measurement_model",
      "Measurement Model & Enablement",
      "The operational post-deployment measurement plan for each success metric: data source/instrumentation, accountable owner, cadence, attribution method, and the enablement required to capture it. Tie each metric back to its charter outcome and the business-process-change adoption signal that drives it. Where a metric is not yet measurable, the enablement to measure it is a named action, not an assumption.",
      "mixed",
      [],
      "Keep under 425 words. Use one compact table for metrics, owner, source, baseline status, cadence, and acceptance rule. No methodology essay.",
    ),
    s(
      "controls",
      "Finance Controls & Attestation",
      "Approval and variance controls.",
      "mixed",
      [],
      "Keep under 275 words. Focus on attestation gates and variance controls in a table.",
    ),
    s(
      "risks",
      "Risks, Leakage & Dependencies",
      "What could erode value.",
      "mixed",
      [],
      "Keep under 250 words. Consolidate risks and mitigations; do not repeat predecessor-document dependencies.",
    ),
    s(
      "recommendation",
      "Recommendation & Next Actions",
      "Approve and lock the baseline.",
      "mixed",
      [],
      "Keep under 140 words. Make the next action conditional on source-backed measurement readiness.",
    ),
  ],
  requiredSectionKeys: [
    "exec_summary",
    "current_state",
    "value_pools",
    "measurement_model",
    "recommendation",
  ],
  fixedStructure: true,
  prohibitedContent: [
    "Do not add a second business case narrative.",
    "Do not include unsupported realized value, annual savings, ROI, NPV, payback, or target-value claims.",
    "Do not repeat the full solution design; this is a measurement plan.",
    "Do not include a methodology overview, Move history recap, implementation plan, or duplicate risk narrative; use the measurement table as the artifact spine.",
  ],
};

const MOVES_READINESS_AND_CHANGE_PLAN: DeliverableStructure = {
  module: "moves",
  deliverableType: "readiness_and_change_plan",
  purpose:
    "Confirm organizational readiness, adoption path, governance cadence, and mobilization conditions before the move advances into execution.",
  decisionToSupport:
    "Approve readiness to mobilize, approve with conditions, or hold until change/governance evidence is complete.",
  sections: [
    s(
      "exec_readiness_verdict",
      "Executive Readiness Verdict",
      "State ready / ready with conditions / not ready, the evidence basis, and the decision implication.",
      "mixed",
      [],
      "Keep under 300 words. Do not imply funding approval or full implementation authorization.",
    ),
    s(
      "stakeholders_decision_rights",
      "Stakeholders & Decision Rights",
      "Sponsor, accountable owner, technology owner, finance reviewer, delivery/change owner, and unresolved seats.",
      "mixed",
      [],
      "Keep under 450 words using a role-and-authority table.",
    ),
    s(
      "adoption_workplan",
      "Adoption & Change Workplan",
      "Communications, training, operating transition, pilot-readiness activities, and owner/cadence for each.",
      "mixed",
      [],
      "Keep under 600 words using a compact workplan table.",
    ),
    s(
      "governance_cadence",
      "Governance & Cadence",
      "Steering forum, decision calendar, escalation route, evidence reviews, and phase-gate touchpoints.",
      "mixed",
      [],
      "Keep under 450 words using a cadence table.",
    ),
    s(
      "dependencies_risks",
      "Dependencies, Risks & Controls",
      "Change, data, operational, vendor, control, and measurement dependencies that could block mobilization.",
      "mixed",
      [],
      "Keep under 650 words. Use one dependency/risk table with owner and mitigation.",
    ),
    s(
      "mobilization_conditions",
      "Mobilization Conditions",
      "The conditions that must be true before mobilization and Tower handoff, including open evidence or governance actions.",
      "mixed",
      [],
      "Keep under 350 words. Separate approved conditions from open inputs.",
    ),
    s(
      "recommendation",
      "Recommendation & Next Actions",
      "Approve readiness, approve with conditions, or hold, plus the immediate owner-led actions.",
      "mixed",
      [],
      "Keep under 120 words.",
    ),
  ],
  requiredSectionKeys: [
    "exec_readiness_verdict",
    "stakeholders_decision_rights",
    "adoption_workplan",
    "governance_cadence",
    "dependencies_risks",
    "mobilization_conditions",
    "recommendation",
  ],
  fixedStructure: true,
  prohibitedContent: [
    "Do not turn readiness approval into funding approval, full-scale rollout approval, or implementation authorization.",
    "Do not include unsupported annual savings, ROI, NPV, payback, target value, or internal volume claims.",
    "Do not repeat the execution roadmap, business case, financial model, or Tower metrics plan; reference their decisions and gaps only where needed for mobilization readiness.",
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
    s(
      "exec_summary",
      "Executive Summary",
      "Handoff state in brief.",
      "mixed",
      [],
      "Keep under 550 words. Lead with the handoff decision, execution readiness, and what remains owner-led; do not use internal phase labels.",
    ),
    s(
      "approved_decisions",
      "Approved Decisions",
      "What has been approved and by whom.",
      "mixed",
      [],
      "Keep under 800 words using a decision ledger table. Write human phase names such as charter, discovery, design, and roadmap/business-case planning; never write P0, P1, P2, P3, P4, or P5.",
    ),
    s(
      "current_state",
      "Evidence & Open Gaps",
      "Evidence used and remaining gaps.",
      "governed_facts",
      [],
      "Keep under 850 words using one evidence-and-gap table. Do not write Source Register or Evidence Register in the narrative body; save evidence detail for the appendix.",
    ),
    s(
      "execution_contract",
      "Execution Contract",
      "Scope, owners, milestones, and controls.",
      "mixed",
      [],
      "Keep under 1,100 words using compact owner, milestone, and control tables. Do not repeat predecessor-document narrative.",
    ),
    s(
      "tower_handoff",
      "Tower / Value Ledger Handoff",
      "Metrics, cadence, and ownership.",
      "mixed",
      [],
      "Keep under 950 words using a Tower handoff table: metric, owner, source, cadence, threshold, escalation.",
    ),
    s(
      "risks",
      "Risks, Issues & Dependencies",
      "Handoff risks and mitigations.",
      "mixed",
      [],
      "Keep under 950 words using a risk/issue/dependency table with owner, trigger, mitigation, and next review.",
    ),
    s(
      "recommendation",
      "Recommendation & Next Actions",
      "Accept handoff and start execution.",
      "mixed",
      [],
      "Keep under 400 words. Give the accept/hold recommendation and immediate actions only.",
    ),
  ],
  requiredSectionKeys: [
    "exec_summary",
    "approved_decisions",
    "execution_contract",
    "tower_handoff",
    "recommendation",
  ],
  fixedStructure: true,
  prohibitedContent: [
    "Do not use internal phase labels P0, P1, P2, P3, P4, or P5 in the client narrative.",
    "Do not write Source Register, Evidence Register, context rows, tower rows, substrate, or client-to-complete in the narrative body.",
    "Do not become a second business case, value model, roadmap, or implementation manual.",
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
  MOVES_ROOT_CAUSE_WORKSHEET,
  MOVES_TARGET_ARCHITECTURE,
  MOVES_SOLUTION_DESIGN,
  MOVES_OPERATING_MODEL,
  MOVES_REQUIREMENTS_TRACEABILITY,
  MOVES_SOURCING_STRATEGY,
  MOVES_ESTIMATE,
  MOVES_VALUE,
  MOVES_READINESS_AND_CHANGE_PLAN,
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
