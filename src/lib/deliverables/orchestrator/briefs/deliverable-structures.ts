// Deliverable structures — the section flow per artifact type.
//
// Each structure is a senior consultant's BASELINE (Claude may add to it). The brief
// registry composes a structure with an archetype pack so the same artifact type
// (e.g. a business case) is shaped differently for AMS vs cloud vs AI-PDLC.

import type {
  BriefSection,
  DeliverableModule,
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
   * Topics that belong to a LATER phase and must not appear as sections here
   * (phase discipline). E.g. a P1 Charter frames the decision to fund discovery
   * — it does not pre-empt P2's current-state analysis or P3's target-state
   * design. Matched case-insensitively against a section's key/title; the
   * architect is told to omit them and the plan sanitizer drops any that slip in.
   */
  forbiddenSectionTopics?: string[];
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
      "Executive Summary",
      "One tight section: the problem, the recommended approach at a headline level, the preliminary value hypothesis ($M–$M, labelled PRELIMINARY), program duration, and the decision sought. Framing only — NOT a current-state analysis.",
      "mixed",
    ),
    s(
      "decision_required",
      "Decision Required",
      "State the explicit charter ask and exactly what approval authorizes: a funded discovery & design gate, not a build.",
      "mixed",
    ),
    s(
      "sponsor_commitment",
      "Sponsor Commitment & Change Readiness",
      "Named sponsor, role, decision rights, review cadence, commitment evidence; key decision-makers, contributors, and blockers as named roles. State change readiness explicitly: the sponsor's commitment is not only to FUND the technology but to DRIVE the business-process change and OWN the measurement the outcome depends on. Where the client is not yet willing to change a process, record it as a readiness risk, not a gap to paper over.",
      "mixed",
    ),
    s(
      "problem_opportunity",
      "Problem, Opportunity & Why Now",
      "Why now and the value at stake — executive framing only. Do NOT pre-empt P2 with a detailed current-state evidence analysis.",
      "mixed",
    ),
    s(
      "objectives",
      "Strategic Objectives",
      "Target outcomes and the success measures that define done.",
      "mixed",
    ),
    s(
      "scope",
      "Scope & Out-of-Scope",
      "Explicit in-scope / out-of-scope boundary — specific capabilities and business processes, not generic.",
      "mixed",
    ),
    s(
      "success_criteria",
      "Success Criteria, Value Hypothesis & Measurement",
      "Define success as a four-part commitment (see SUCCESS-CRITERIA-STANDARD): (1) BUSINESS OUTCOMES — the business result the move must produce, stated as a business change, not a feature/technology; (2) KEY METRICS — the KPIs that prove each outcome, each with a current baseline and a target (label every figure PRELIMINARY_ESTIMATE with its assumption, or cite it); (3) MEASUREMENT AFTER DEPLOYMENT — how each metric will actually be measured post-go-live: data source/instrumentation, owner, cadence, and the enablement needed to capture it (if it cannot be measured with what exists today, that enablement is a scope item — surface it, mark [CLIENT TO COMPLETE], never assume it); (4) BUSINESS-PROCESS CHANGE — the specific process/operating-model changes the client commits to make to enable the outcome (technology alone rarely delivers it). Include the preliminary value range $M–$M.",
      "mixed",
    ),
    s(
      "governance_gates",
      "Governance, Operating Model & Phase Gates",
      "Steering committee, escalation path, decision velocity, high-level RACI, and the stage gates ahead (P2→P5) with entry criteria.",
      "mixed",
    ),
    s(
      "kill_criterion",
      "Key Risks, Dependencies & Kill Criterion",
      "Top risks, issues and dependencies with mitigations, plus a specific, observable condition that would terminate the program — not a vague risk statement.",
      "mixed",
    ),
    s(
      "evidence_gaps",
      "Evidence Gaps & Client-to-Complete",
      "What must still be confirmed in discovery; mark each [CLIENT TO COMPLETE], never invent.",
      "client_to_complete",
    ),
    s(
      "recommendation",
      "Recommendation & Next Actions",
      "Clear recommendation and the immediate next steps into P2 discovery.",
      "mixed",
    ),
  ],
  requiredSectionKeys: [
    "exec_summary",
    "decision_required",
    "sponsor_commitment",
    "problem_opportunity",
    "objectives",
    "scope",
    "success_criteria",
    "governance_gates",
    "kill_criterion",
    "recommendation",
  ],
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
  sections: [
    s(
      "exec_summary",
      "Executive Summary",
      "The investment thesis in brief.",
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
  deliverableType: "target_architecture",
  purpose:
    "Describe the target architecture and the major technology decisions required to execute the move.",
  decisionToSupport:
    "Approve the target-state architecture, integration posture, controls, and implementation implications.",
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
      "Core architecture components and responsibilities.",
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
