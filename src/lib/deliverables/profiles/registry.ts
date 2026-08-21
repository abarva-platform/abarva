// Deliverable Quality Transformation — profile registry (W0)
//
// One typed profile per canonical deliverable. This is the contract the
// renderer reads; it does not decide style ad hoc. Faithful to the
// transformation spec §8 (document-by-document) and §7 (reference profiles).
//
// Inert at W0: nothing imports this yet. W1+ wires the synthesis layer and
// renderers to read it.

import type { DeliverableKey, DeliverableProfile } from "./types";
import { SOURCE_PROFILES } from "./registry-source";

const CURRENT_STATE_VISUAL_STANDARD = {
  requiredVisuals: [
    "Enterprise landscape map",
    "Capability heatmap",
    "Process landscape map",
    "Application portfolio summary",
    "Data landscape map",
    "Pain point/root cause map",
    "Risk and control heatmap",
    "Maturity assessment heatmap",
    "Current-state architecture diagram",
    "Current-state data flow diagram",
  ],
  requiredCharts: [
    "Spend by tower/function",
    "Applications by criticality/health",
    "Incidents/service volume by category",
    "Risk exposure by domain",
  ],
  requiredTables: ["Findings-to-implications matrix"],
  clientToCompleteChecklistRequired: true,
  readinessLabelRequired: true,
} as const;

const ARCHITECTURE_VISUAL_STANDARD = {
  requiredVisuals: [
    "Conceptual architecture diagram",
    "Logical architecture diagram",
    "Physical/deployment architecture diagram",
    "Data flow diagram",
    "Integration flow diagram",
    "Security/trust boundary diagram",
    "Application/platform interaction diagram",
    "Operating model interaction pattern",
    "Current-state vs target-state comparison",
  ],
  requiredTables: [
    "Key architecture decisions table",
    "Architecture risks and tradeoffs table",
    "Client-to-complete checklist",
  ],
  clientToCompleteChecklistRequired: true,
  readinessLabelRequired: true,
} as const;

const BUSINESS_CASE_VISUAL_STANDARD = {
  requiredVisuals: [
    "Value waterfall",
    "Cost baseline bridge",
    "Investment vs benefit timeline",
    "Payback chart",
    "Sensitivity analysis chart",
    "Benefit realization roadmap",
    "Risk-adjusted value view",
    "Scenario comparison",
    "Business outcomes mapped to value levers",
  ],
  requiredCharts: [
    "Value waterfall",
    "Payback chart",
    "Scenario comparison: conservative / expected / upside",
    "One-time vs run-rate cost view",
  ],
  requiredTables: [
    "ROI / NPV / IRR summary table where available",
    "Value pool assumptions",
    "Benefit calculation logic",
    "Cost categories",
    "Investment estimate",
    "Financial assumptions",
    "Finance validation status",
    "Measurement plan",
  ],
  clientToCompleteChecklistRequired: true,
  readinessLabelRequired: true,
} as const;

const ROADMAP_VISUAL_STANDARD = {
  requiredVisuals: [
    "30/60/90-day action plan",
    "Multi-wave roadmap",
    "Workstream timeline",
    "Milestone map",
    "Dependency map",
    "Critical path view",
    "Resource ramp chart",
    "Governance cadence model",
    "Stage-gate model",
    "Readiness burndown or maturity progression view",
  ],
  requiredTables: [
    "Workstream plan",
    "Milestone register",
    "Dependency register",
    "Decision log",
    "Risk and mitigation plan",
    "Acceptance criteria by phase",
  ],
  clientToCompleteChecklistRequired: true,
  readinessLabelRequired: true,
} as const;

const GOVERNANCE_VISUAL_STANDARD = {
  requiredVisuals: [
    "Decision tree",
    "Options comparison matrix",
    "Recommendation scorecard",
    "Risk/value tradeoff matrix",
    "Gate readiness dashboard",
    "Decision log",
    "Approval flow",
    "Escalation path",
    "Open issues dashboard",
  ],
  requiredTables: [
    "Decision options and recommendation",
    "Open issues register",
  ],
  clientToCompleteChecklistRequired: true,
  readinessLabelRequired: true,
} as const;

const OPERATING_MODEL_VISUAL_STANDARD = {
  requiredVisuals: [
    "Operating model diagram",
    "RACI / value ownership matrix",
    "Decision-rights model",
    "Governance cadence model",
    "Escalation path",
    "Human / AI responsibility split",
  ],
  requiredTables: ["RACI", "Decision rights", "Operating cadence"],
  clientToCompleteChecklistRequired: true,
  readinessLabelRequired: true,
} as const;

const EXECUTIVE_READOUT_VISUAL_STANDARD = {
  requiredVisuals: [
    "One-page executive storyline",
    "Before/after transformation visual",
    "Value at stake chart",
    "Current-state heatmap",
    "Target-state architecture",
    "Operating model diagram",
    "Roadmap timeline",
    "Business case waterfall",
    "Risk heatmap",
    "Decision summary page",
    "KPI/outcome dashboard",
  ],
  requiredTables: ["Appendix evidence tables"],
  clientToCompleteChecklistRequired: true,
  readinessLabelRequired: true,
} as const;

const VALUE_REALIZATION_VISUAL_STANDARD = {
  requiredVisuals: [
    "Planned vs delivered scope",
    "Benefits planned vs realized",
    "KPI movement chart",
    "Adoption trend",
    "Timeline of delivered milestones",
    "Residual risk heatmap",
    "Sustainment model",
    "Next-wave opportunity map",
  ],
  requiredTables: ["Measurement plan", "Benefits owner register"],
  clientToCompleteChecklistRequired: true,
  readinessLabelRequired: true,
} as const;

const charter: DeliverableProfile = {
  key: "charter",
  renderer: "docx_narrative",
  title: "Initiative Charter",
  clientFacing: true,
  audience: ["steering_committee", "program_leadership"],
  decisionPurpose:
    "Approve a focused discovery/design gate — not build or scale funding.",
  defaultFormat: "docx",
  supportingFormats: ["html"],
  tone: "senior_consultant",
  visualDensity: "medium",
  allowPhaseLabels: false,
  evidenceMode: "appendix_only",
  sourceRegisterPolicy: "appendix_only",
  missingInputPolicy: "single_open_inputs_table",
  requiredExhibits: [
    "decision_box",
    "known_unknown_table",
    "proceed_hold_stop_gate",
    "open_inputs_required",
  ],
  lengthGuidance:
    "Sponsor decision memo — as long as the judgment needs, not a binder.",
  acceptanceChecks: [
    "first page states the decision requested",
    "no phase labels in the client narrative",
    "no source-register language in the main body",
    "missing inputs consolidated into one Open Inputs Required table",
    "recommendation is explicit and bounded (proceed / hold / stop)",
  ],
};

const discoveryReport: DeliverableProfile = {
  key: "discovery_report",
  renderer: "pptx_storyline",
  visualRendererRequired: true,
  visualStandard: CURRENT_STATE_VISUAL_STANDARD,
  title: "Discovery & Diagnostic Readout",
  clientFacing: true,
  audience: ["steering_committee", "program_leadership", "cio"],
  decisionPurpose:
    "Show what is broken, where value is trapped, and what must be validated next.",
  defaultFormat: "pptx",
  supportingFormats: ["docx"], // internal diagnostic binder
  tone: "board_grade",
  visualDensity: "high",
  allowPhaseLabels: false,
  evidenceMode: "speaker_notes",
  sourceRegisterPolicy: "speaker_notes",
  missingInputPolicy: "single_open_inputs_table",
  requiredExhibits: [
    "issue_tree",
    "heatmap",
    "process_pain_map",
    "capability_maturity",
  ],
  lengthGuidance:
    "Executive readout 8–12 slides/pages; internal binder may be longer.",
  acceptanceChecks: [
    "client executive readout and internal binder are separate artifacts",
    "findings lead; evidence supports, not dominates",
    "does not dump every data point into the client readout",
  ],
};

const rootCauseWorksheet: DeliverableProfile = {
  key: "root_cause_worksheet",
  renderer: "pptx_storyline",
  visualRendererRequired: true,
  visualStandard: {
    requiredVisuals: [
      "Pain point/root cause map",
      "Root-cause tree",
      "Process pain map",
      "Findings-to-implications matrix",
    ],
    requiredTables: ["Symptoms vs causes table"],
    clientToCompleteChecklistRequired: true,
    readinessLabelRequired: true,
  },
  title: "Root-Cause Readout",
  clientFacing: true,
  audience: ["program_leadership", "cio"],
  decisionPurpose:
    "Explain why the problem exists and what it means for solution design.",
  defaultFormat: "pptx",
  supportingFormats: ["docx"],
  tone: "senior_consultant",
  visualDensity: "high",
  allowPhaseLabels: false,
  evidenceMode: "caption_level",
  sourceRegisterPolicy: "appendix_only",
  missingInputPolicy: "single_open_inputs_table",
  requiredExhibits: ["root_cause_tree", "symptom_cause_table"],
  lengthGuidance:
    "Issue-tree led; top root causes only — not a list of dozens.",
  acceptanceChecks: [
    "executive answer stated first",
    "uses a symptoms-vs-causes table and a root-cause tree",
    "highest-confidence causes separated from areas needing validation",
    "no long narrative; no fabricated certainty",
  ],
};

const solutionApproachOptions: DeliverableProfile = {
  key: "solution_approach_options",
  renderer: "html_architecture",
  title: "Solution Approach & Options",
  clientFacing: true,
  audience: ["steering_committee", "cio", "cto"],
  decisionPurpose:
    "Choose the solution approach (and option) that will drive the architecture — before any architecture is designed.",
  defaultFormat: "html",
  supportingFormats: ["pptx", "docx"],
  tone: "board_grade",
  visualDensity: "high",
  allowPhaseLabels: false,
  evidenceMode: "appendix_only",
  sourceRegisterPolicy: "appendix_only",
  missingInputPolicy: "single_open_inputs_table",
  requiredExhibits: ["options_matrix", "decision_box", "value_tree"],
  intent: "options_paper",
  visualRendererRequired: true,
  soWhatRequired: true,
  currentStateRequired: true,
  gapAnalysisRequired: true,
  storyArc: [
    "Current state + gaps frame the problem",
    "2-3 credible solution options, scored on what matters",
    "The recommended option, with the tradeoffs accepted",
    "This decision is what the architecture will be built to",
  ],
  acceptanceChecks: [
    "names 2-3 credible options with a scored decision matrix",
    "states the recommended option and the tradeoffs accepted",
    "the choice traces to the use case, KPIs, current state and gaps",
  ],
  failureModes: [
    "no_options",
    "no_recommendation",
    "architecture_before_approval",
  ],
};

const targetStateArchitecture: DeliverableProfile = {
  key: "target_state_architecture",
  renderer: "html_architecture",
  visualStandard: ARCHITECTURE_VISUAL_STANDARD,
  // ── Story-Led / Exhibit-Led Standard (v2 redo) ──
  narrativeQuestion:
    "How does the proposed solution change the way the client senses, decides, acts, governs, and measures the operational event?",
  storyArc: [
    "Current state produces fragmented operational decisions",
    "Gaps reveal missing shared context, decision telemetry, and governed AI support",
    "Target state creates a governed decision system",
    "Conceptual architecture shows the business capabilities",
    "Logical architecture shows components and flows",
    "Physical architecture shows deployment and control boundaries",
    "Implementation waves reduce risk while proving value",
  ],
  currentStateRequired: true,
  gapAnalysisRequired: true,
  targetStateRequired: true,
  conceptualArchitectureRequired: true,
  logicalArchitectureRequired: true,
  physicalArchitectureRequired: true,
  visualRendererRequired: true,
  soWhatRequired: true,
  requiredStoryBeats: [
    "event trigger",
    "current-state decision fragmentation",
    "gap-to-capability bridge",
    "context enrichment",
    "AI recommendation",
    "human approval or override",
    "system action",
    "audit trail",
    "value measurement",
    "implementation waves",
  ],
  decisionMoment:
    "Which architecture decisions must be made before build, and which recovery decisions may be AI-recommended vs manual-only in the pilot.",
  readerTakeaway:
    "The reader can explain, end to end, how the client moves from fragmented current-state decisions to a governed AI-assisted decision system.",
  antiPatterns: [
    "prose_only_architecture",
    "missing_current_state_visual",
    "missing_conceptual_architecture",
    "missing_logical_architecture",
    "missing_physical_architecture",
    "no_so_what",
    "generic_architecture",
    "mechanical_section_pack",
  ],
  title: "Target Architecture",
  clientFacing: true,
  audience: ["cio", "cto"],
  decisionPurpose:
    "Align on future-state design, data flow, AI pattern, controls, and integration choices.",
  defaultFormat: "html",
  supportingFormats: ["pptx", "docx"], // exhibits export to deck; appendix to docx
  tone: "architecture_lead",
  visualDensity: "high",
  allowPhaseLabels: false,
  evidenceMode: "caption_level",
  sourceRegisterPolicy: "appendix_only",
  missingInputPolicy: "single_open_inputs_table",
  requiredExhibits: [
    "current_state_architecture",
    "target_state_architecture",
    "data_flow",
    "ai_decision_flow",
    "agentic_overlay",
    "integration_pattern",
    "control_points",
    "implementation_waves",
  ],
  lengthGuidance:
    "Visual-first HTML; executive captions, not architecture essays.",
  acceptanceChecks: [
    "shows the current-to-target journey (as-is and to-be physical architecture)",
    "data flow is rendered distinct from the AI decision/control flow",
    "names the engagement-solutioned services (cloud NOT predetermined)",
    "shows the agentic overlay — how services come alive",
    "describes human-in-the-loop control points",
    "at least five exhibits render without horizontal overflow",
  ],
};

const solutionDesign: DeliverableProfile = {
  key: "solution_design",
  renderer: "html_architecture",
  visualRendererRequired: true,
  visualStandard: ARCHITECTURE_VISUAL_STANDARD,
  title: "Solution Design",
  clientFacing: true,
  audience: ["cto", "program_leadership", "ciso"],
  decisionPurpose: "Explain how the solution actually works.",
  defaultFormat: "html",
  supportingFormats: ["docx"],
  tone: "architecture_lead",
  visualDensity: "high",
  allowPhaseLabels: false,
  evidenceMode: "caption_level",
  sourceRegisterPolicy: "appendix_only",
  missingInputPolicy: "single_open_inputs_table",
  requiredExhibits: [
    "experience_flow",
    "agent_workflow",
    "exception_handling",
    "control_points",
    "data_flow",
  ],
  lengthGuidance: "8–12 pages; medium/high visual density.",
  acceptanceChecks: [
    "clarifies what the user does, what the AI does, what systems are touched",
    "shows where humans approve and what gets measured",
    "uses swimlanes / workflow diagrams, not generic solution prose",
  ],
};

const operatingModelDesign: DeliverableProfile = {
  key: "operating_model_design",
  renderer: "docx_narrative",
  visualRendererRequired: true,
  visualStandard: OPERATING_MODEL_VISUAL_STANDARD,
  title: "Operating Model",
  clientFacing: true,
  audience: ["program_leadership", "ciso", "cio"],
  decisionPurpose: "Explain how work gets done after the solution exists.",
  defaultFormat: "docx",
  supportingFormats: ["pptx"],
  tone: "delivery_lead",
  visualDensity: "medium",
  allowPhaseLabels: false,
  evidenceMode: "appendix_only",
  sourceRegisterPolicy: "appendix_only",
  missingInputPolicy: "single_open_inputs_table",
  requiredExhibits: [
    "raci",
    "decision_rights",
    "operating_cadence",
    "escalation_path",
  ],
  lengthGuidance:
    "6–10 pages; table/diagram rich; practical, not governance-legal tone.",
  acceptanceChecks: [
    "uses RACI, decision-rights matrix, operating cadence, human/AI split, escalation",
    "plain language, not PMO/compliance jargon",
  ],
};

const sourcingStrategy: DeliverableProfile = {
  key: "sourcing_strategy",
  renderer: "docx_narrative",
  visualRendererRequired: true,
  visualStandard: GOVERNANCE_VISUAL_STANDARD,
  title: "Sourcing Strategy",
  clientFacing: true,
  audience: ["procurement", "cio", "program_leadership"],
  decisionPurpose: "Decide the build / buy / partner / hybrid path.",
  defaultFormat: "docx",
  tone: "senior_consultant",
  visualDensity: "medium",
  allowPhaseLabels: false,
  evidenceMode: "appendix_only",
  sourceRegisterPolicy: "appendix_only",
  missingInputPolicy: "single_open_inputs_table",
  requiredExhibits: ["options_matrix", "decision_box"],
  lengthGuidance: "5–8 pages; options paper, decision-oriented.",
  acceptanceChecks: [
    "uses an options matrix (build / buy / partner / hybrid)",
    "states a recommended path with rationale and guardrails",
    "no unsupported cost claims; not broad and theoretical",
  ],
};

const executionRoadmap: DeliverableProfile = {
  key: "execution_roadmap",
  renderer: "pptx_storyline",
  visualRendererRequired: true,
  visualStandard: ROADMAP_VISUAL_STANDARD,
  title: "Execution Roadmap",
  clientFacing: true,
  audience: ["program_leadership", "cio", "steering_committee"],
  decisionPurpose: "Mobilise the program and manage gates/dependencies.",
  defaultFormat: "pptx",
  supportingFormats: ["docx"],
  tone: "delivery_lead",
  visualDensity: "high",
  allowPhaseLabels: false,
  evidenceMode: "caption_level",
  sourceRegisterPolicy: "appendix_only",
  missingInputPolicy: "single_open_inputs_table",
  requiredExhibits: ["roadmap_lanes", "dependency_map", "decision_calendar"],
  lengthGuidance:
    "Visual 30/60/90 + workstream roadmap; show decision gates clearly.",
  acceptanceChecks: [
    "uses 30/60/90, workstream roadmap, dependency map, decision calendar",
    "shows owners and gates; avoids vague timelines and long narrative",
  ],
};

const businessCase: DeliverableProfile = {
  key: "business_case",
  renderer: "docx_narrative",
  visualRendererRequired: true,
  visualStandard: BUSINESS_CASE_VISUAL_STANDARD,
  title: "Business Case",
  clientFacing: true,
  audience: ["cfo", "steering_committee", "ceo"],
  decisionPurpose: "Decide whether the investment deserves funding.",
  defaultFormat: "docx",
  supportingFormats: ["pptx", "xlsx"],
  tone: "board_grade",
  visualDensity: "medium",
  allowPhaseLabels: false,
  evidenceMode: "appendix_only",
  sourceRegisterPolicy: "appendix_only",
  missingInputPolicy: "single_open_inputs_table",
  requiredExhibits: ["value_tree", "decision_box", "open_inputs_required"],
  supportsModeDowngrade: true,
  lengthGuidance:
    "Mode-dependent: Readiness Memo, Investment Thesis, or full Business Case.",
  acceptanceChecks: [
    "not titled 'Business Case' unless baseline, cost, benefit, and sensitivity exist",
    "downgrades to Readiness Memo when finance-grade inputs are missing",
    "no fabricated NPV/ROI/payback/baseline; states the implication once",
  ],
};

const financialModel: DeliverableProfile = {
  key: "financial_model",
  renderer: "xlsx_workbook",
  title: "Financial Model",
  clientFacing: false,
  audience: ["cfo"],
  decisionPurpose: "Working finance model behind the business case.",
  defaultFormat: "xlsx",
  tone: "board_grade",
  visualDensity: "low",
  allowPhaseLabels: false,
  evidenceMode: "working_binder",
  sourceRegisterPolicy: "download",
  missingInputPolicy: "working_binder_detail",
  requiredExhibits: ["measurement_table"],
  supportsModeDowngrade: true,
  lengthGuidance: "Workbook; only when finance-grade inputs exist, else omit.",
  acceptanceChecks: [
    "no invented financial values; cells trace to sourced inputs",
    "omitted (not faked) when baseline/cost/benefit inputs are absent",
  ],
};

const towerMetricsPlan: DeliverableProfile = {
  key: "tower_metrics_plan",
  renderer: "docx_narrative",
  visualRendererRequired: true,
  visualStandard: VALUE_REALIZATION_VISUAL_STANDARD,
  title: "Value & Metrics Model",
  clientFacing: true,
  audience: ["cfo", "program_leadership"],
  decisionPurpose: "Define how value shows up in ongoing operating metrics.",
  defaultFormat: "docx",
  supportingFormats: ["html"],
  tone: "delivery_lead",
  visualDensity: "medium",
  allowPhaseLabels: false,
  evidenceMode: "appendix_only",
  sourceRegisterPolicy: "appendix_only",
  missingInputPolicy: "single_open_inputs_table",
  requiredExhibits: ["measurement_table", "value_tree"],
  lengthGuidance: "Table-led; ties value to the metrics the Tower will track.",
  acceptanceChecks: [
    "every metric has owner, source, method, frequency",
    "no fabricated benefit values",
  ],
};

const readinessAndChangePlan: DeliverableProfile = {
  key: "readiness_and_change_plan",
  renderer: "docx_narrative",
  visualRendererRequired: true,
  visualStandard: EXECUTIVE_READOUT_VISUAL_STANDARD,
  title: "Readiness & Change Plan",
  clientFacing: true,
  audience: ["program_leadership", "steering_committee"],
  decisionPurpose:
    "Decide whether the organization is ready to mobilize, ready with conditions, or blocked by adoption/governance gaps.",
  defaultFormat: "docx",
  supportingFormats: ["html"],
  tone: "delivery_lead",
  visualDensity: "medium",
  allowPhaseLabels: false,
  evidenceMode: "appendix_only",
  sourceRegisterPolicy: "appendix_only",
  missingInputPolicy: "single_open_inputs_table",
  requiredExhibits: ["raci", "operating_cadence", "risks_and_mitigations"],
  lengthGuidance:
    "Table-led readiness plan; owners, cadence, risks, dependencies, and mobilization conditions.",
  acceptanceChecks: [
    "states ready / ready with conditions / not ready",
    "names owners, cadence, dependencies, and adoption actions",
    "does not convert readiness into funding approval or unsupported value claims",
  ],
};

const handoffPackage: DeliverableProfile = {
  key: "handoff_package",
  renderer: "pptx_storyline",
  visualRendererRequired: true,
  visualStandard: EXECUTIVE_READOUT_VISUAL_STANDARD,
  title: "Executive Handoff",
  clientFacing: true,
  audience: ["board", "steering_committee", "ceo"],
  decisionPurpose: "Make the final decision or approve the next phase.",
  defaultFormat: "pptx",
  supportingFormats: ["docx"],
  tone: "board_grade",
  visualDensity: "high",
  allowPhaseLabels: false,
  evidenceMode: "speaker_notes",
  sourceRegisterPolicy: "speaker_notes",
  missingInputPolicy: "single_open_inputs_table",
  requiredExhibits: [
    "decision_headline",
    "value_story",
    "roadmap_lanes",
    "risks_and_mitigations",
  ],
  lengthGuidance: "8–12 slides; board-grade; one governing message per slide.",
  acceptanceChecks: [
    "decision requested is visible by slide 2",
    "each slide has one governing message; no text-wall slides",
    "evidence detail held in appendix / speaker notes",
  ],
};

const valueMeasurementContract: DeliverableProfile = {
  key: "value_measurement_contract",
  renderer: "docx_narrative",
  visualRendererRequired: true,
  visualStandard: VALUE_REALIZATION_VISUAL_STANDARD,
  title: "Value Measurement Contract",
  clientFacing: true,
  audience: ["cfo", "program_leadership"],
  decisionPurpose:
    "Prevent fake ROI by defining how value will be measured and governed.",
  defaultFormat: "docx",
  tone: "delivery_lead",
  visualDensity: "low",
  allowPhaseLabels: false,
  evidenceMode: "appendix_only",
  sourceRegisterPolicy: "appendix_only",
  missingInputPolicy: "single_open_inputs_table",
  requiredExhibits: ["measurement_table"],
  lengthGuidance: "5–8 pages; table-first.",
  acceptanceChecks: [
    "table-driven: metric, owner, baseline, data source, method, cadence, validation",
    "no value storytelling without a measurement method; no fake benefits",
  ],
};

/** The canonical profile registry, keyed by deliverable. */
export const DELIVERABLE_PROFILES: Readonly<
  Record<DeliverableKey, DeliverableProfile>
> = {
  charter,
  discovery_report: discoveryReport,
  root_cause_worksheet: rootCauseWorksheet,
  target_state_architecture: targetStateArchitecture,
  solution_design: solutionDesign,
  operating_model_design: operatingModelDesign,
  sourcing_strategy: sourcingStrategy,
  execution_roadmap: executionRoadmap,
  business_case: businessCase,
  financial_model: financialModel,
  tower_metrics_plan: towerMetricsPlan,
  readiness_and_change_plan: readinessAndChangePlan,
  handoff_package: handoffPackage,
  value_measurement_contract: valueMeasurementContract,
  solution_approach_options: solutionApproachOptions,
  ...SOURCE_PROFILES,
};

export function getDeliverableProfile(key: DeliverableKey): DeliverableProfile {
  return DELIVERABLE_PROFILES[key];
}

export function listDeliverableProfiles(): ReadonlyArray<DeliverableProfile> {
  return Object.values(DELIVERABLE_PROFILES);
}
