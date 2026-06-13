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

const MOVES_CHARTER: DeliverableStructure = {
  module: "moves",
  deliverableType: "charter",
  purpose:
    "Authorize a strategic move with a clear mandate, scope, value hypothesis, and governance.",
  decisionToSupport:
    "Approve chartering of the move and its scope/operating model.",
  sections: [
    s(
      "exec_summary",
      "Executive Summary",
      "Frame the move and the decision sought.",
      "mixed",
    ),
    s(
      "decision_required",
      "Decision Required",
      "State the explicit ask.",
      "mixed",
    ),
    s(
      "problem_opportunity",
      "Problem / Opportunity",
      "Why now; the value at stake.",
      "mixed",
    ),
    s(
      "current_state",
      "Current-State Evidence",
      "What the evidence shows today.",
      "governed_facts",
    ),
    s(
      "objectives",
      "Strategic Objectives",
      "Outcomes and success measures.",
      "mixed",
    ),
    s("scope", "Scope & Out-of-Scope", "Boundaries.", "mixed"),
    s(
      "value_hypothesis",
      "Value Hypothesis & KPIs",
      "How value is created and measured.",
      "mixed",
    ),
    s("operating_model", "Operating Model & RACI", "Who does what.", "mixed"),
    s(
      "risks",
      "Risks, Issues & Dependencies",
      "Top risks and mitigations.",
      "mixed",
    ),
    s(
      "phase_gates",
      "Phase Gates",
      "Stage gates and criteria.",
      "expert_template",
    ),
    s(
      "evidence_gaps",
      "Evidence Gaps & Client-to-Complete",
      "What is missing.",
      "client_to_complete",
    ),
    s(
      "recommendation",
      "Recommendation & Next Actions",
      "Clear recommendation + next steps.",
      "mixed",
    ),
  ],
  requiredSectionKeys: [
    "exec_summary",
    "decision_required",
    "current_state",
    "objectives",
    "value_hypothesis",
    "recommendation",
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
      "Readiness assessment.",
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
      "Change, Adoption & Training",
      "How work changes and how people adopt.",
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
      "Measurement Model",
      "How value will be measured and attributed.",
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
