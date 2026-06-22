// Deliverable Quality Transformation — Source (IT sourcing) profile registry
//
// One typed profile per Source artifact. Mirrors the authoring style of
// `registry.ts` (Moves) exactly: a `const x: DeliverableProfile = {...}` per
// artifact, then a `Readonly<Record<SourceDeliverableKey, DeliverableProfile>>`.
//
// Source family discipline:
//   - Depth follows purpose. RFP / pricing / evaluation / transition / value
//     ledger run deep or exhaustive; memos stay concise/standard. There is NO
//     word cap anywhere (no `maxWords` field exists).
//   - Client-facing artifacts hide phase labels and keep the source register in
//     a closing appendix (sourceRegisterPolicy 'appendix_only', appendixMode
//     'source_register_appendix', sourceTracePolicy 'appendix').
//   - Internal binders (value_target_brief, pricing_workbook) use evidenceMode
//     'working_binder', appendixMode 'evidence_binder', and are clientFacing:false.

import type {
  DeliverableProfile,
  SourceDeliverableKey,
} from "./types";
import { DEFAULT_QUALITY_RUBRIC } from "./types";

const SOURCING_STRATEGY_VISUAL_STANDARD = {
  requiredVisuals: [
    "Options comparison matrix",
    "Recommendation scorecard",
    "Risk/value tradeoff matrix",
    "Value lever map",
    "Decision summary page",
  ],
  requiredCharts: ["Vendor/tower landscape map", "Scenario comparison"],
  requiredTables: ["Sourcing options comparison", "Open Inputs Required"],
  clientToCompleteChecklistRequired: true,
  readinessLabelRequired: true,
} as const;

const SOURCING_VALUE_VISUAL_STANDARD = {
  requiredVisuals: [
    "Value waterfall or value bridge",
    "Cost baseline bridge",
    "Scenario comparison",
    "Benefit realization roadmap",
    "Value ownership matrix",
  ],
  requiredCharts: ["Value waterfall", "One-time vs run-rate cost view"],
  requiredTables: ["Value hypothesis by lever", "Baseline assumptions"],
  clientToCompleteChecklistRequired: true,
  readinessLabelRequired: true,
} as const;

const SOURCING_SCORECARD_VISUAL_STANDARD = {
  requiredVisuals: [
    "Evaluation heatmap",
    "Weighted scorecard",
    "Vendor comparison chart",
    "Recommendation scorecard",
    "Open issues dashboard",
  ],
  requiredCharts: ["Stacked bar chart", "Heatmap"],
  requiredTables: ["Weighted scoring matrix", "Evidence citations by score"],
  clientToCompleteChecklistRequired: true,
  readinessLabelRequired: true,
} as const;

const SOURCING_COMMERCIAL_VISUAL_STANDARD = {
  requiredVisuals: [
    "Pricing comparison chart",
    "Cost baseline bridge",
    "Risk-adjusted value view",
    "Commercial trap heatmap",
    "Negotiation leverage map",
  ],
  requiredCharts: ["Bar chart", "Waterfall chart", "Scenario comparison"],
  requiredTables: ["Normalised pricing comparison", "Pricing traps and mitigations"],
  clientToCompleteChecklistRequired: true,
  readinessLabelRequired: true,
} as const;

const SOURCING_DECISION_VISUAL_STANDARD = {
  requiredVisuals: [
    "One-page executive storyline",
    "Decision tree",
    "Options comparison matrix",
    "Recommendation scorecard",
    "Risk/value tradeoff matrix",
    "Approval flow",
  ],
  requiredTables: ["Decision options and recommendation", "Why-not for rejected options"],
  clientToCompleteChecklistRequired: true,
  readinessLabelRequired: true,
} as const;

const SOURCING_RISK_VISUAL_STANDARD = {
  requiredVisuals: [
    "Risk heatmap",
    "Control gap matrix",
    "Go / No-Go scorecard",
    "Remediation roadmap",
    "Escalation path",
  ],
  requiredTables: ["Risk register with controls and owners", "Open Inputs Required"],
  clientToCompleteChecklistRequired: true,
  readinessLabelRequired: true,
} as const;

const SOURCING_TRANSITION_VISUAL_STANDARD = {
  requiredVisuals: [
    "30/60/90-day action plan",
    "Multi-wave roadmap",
    "Workstream timeline",
    "Dependency map",
    "Critical path view",
    "Stage-gate model",
  ],
  requiredTables: ["Transition workstreams and owners", "Cutover gates"],
  clientToCompleteChecklistRequired: true,
  readinessLabelRequired: true,
} as const;

const sourceStrategyMemo: DeliverableProfile = {
  key: "source_strategy_memo",
  visualRendererRequired: true,
  visualStandard: SOURCING_STRATEGY_VISUAL_STANDARD,
  title: "Sourcing Strategy Memo",
  clientFacing: true,
  audience: ["steering_committee", "cio"],
  decisionPurpose:
    "Set the sourcing thesis — why this market, this approach, and this path to value.",
  defaultFormat: "docx",
  supportingFormats: ["pptx"],
  tone: "senior_consultant",
  visualDensity: "medium",
  allowPhaseLabels: false,
  evidenceMode: "appendix_only",
  sourceRegisterPolicy: "appendix_only",
  missingInputPolicy: "single_open_inputs_table",
  requiredExhibits: ["options_matrix", "decision_box", "value_tree"],
  lengthGuidance: "Senior-partner thesis — as long as the argument needs, not a binder.",
  acceptanceChecks: [
    "first page states the sourcing thesis and the decision it supports",
    "no phase labels in the client narrative",
    "options framed against a recommended path with rationale",
    "missing inputs consolidated into one Open Inputs Required table",
  ],
  intent: "strategy_memo",
  appendixMode: "source_register_appendix",
  requiredTables: ["Sourcing options comparison", "Open Inputs Required"],
  renderer: "docx_narrative",
  qualityRubric: DEFAULT_QUALITY_RUBRIC,
  sourceTracePolicy: "appendix",
  allowedDepth: "standard",
  failureModes: [
    "reads as a market summary with no thesis",
    "options listed without a recommended path",
  ],
};

const sourceValueTargetBrief: DeliverableProfile = {
  key: "source_value_target_brief",
  visualStandard: SOURCING_VALUE_VISUAL_STANDARD,
  title: "Value Target Brief",
  clientFacing: false,
  audience: ["program_leadership", "cfo"],
  decisionPurpose:
    "Set the internal value hypothesis and savings/outcome targets before going to market.",
  defaultFormat: "docx",
  supportingFormats: ["xlsx"],
  tone: "senior_consultant",
  visualDensity: "medium",
  allowPhaseLabels: true,
  evidenceMode: "working_binder",
  sourceRegisterPolicy: "download",
  missingInputPolicy: "single_open_inputs_table",
  requiredExhibits: ["value_tree", "measurement_table"],
  lengthGuidance: "Internal working brief — value hypothesis with traceable assumptions.",
  acceptanceChecks: [
    "value targets are explicit and tied to baseline assumptions",
    "internal-only: never structured as a vendor-facing document",
    "every target value traces to a sourced input or a named assumption",
    "open assumptions consolidated into one table",
  ],
  intent: "value_target_brief",
  appendixMode: "evidence_binder",
  requiredTables: ["Value hypothesis by lever", "Baseline assumptions", "Open Inputs Required"],
  renderer: "docx_narrative",
  qualityRubric: DEFAULT_QUALITY_RUBRIC,
  sourceTracePolicy: "inline_binder",
  allowedDepth: "standard",
  failureModes: [
    "fabricated savings figures presented as fact",
    "leaks internal targets into vendor-facing language",
  ],
};

const sourceScopeMemo: DeliverableProfile = {
  key: "source_scope_memo",
  title: "Scope Memo",
  clientFacing: true,
  audience: ["cio", "procurement"],
  decisionPurpose:
    "Set precise boundaries — what is in scope, what is out, and why.",
  defaultFormat: "docx",
  supportingFormats: ["html"],
  tone: "senior_consultant",
  visualDensity: "low",
  allowPhaseLabels: false,
  evidenceMode: "appendix_only",
  sourceRegisterPolicy: "appendix_only",
  missingInputPolicy: "single_open_inputs_table",
  requiredExhibits: ["decision_box", "open_inputs_required"],
  lengthGuidance: "Tight boundary-setting memo — precise, not exhaustive.",
  acceptanceChecks: [
    "in-scope and out-of-scope items are explicitly separated",
    "boundary rationale is stated, not implied",
    "no phase labels in the client narrative",
    "scope gaps consolidated into one Open Inputs Required table",
  ],
  intent: "scope_memo",
  appendixMode: "source_register_appendix",
  requiredTables: ["In-scope / out-of-scope boundary", "Open Inputs Required"],
  renderer: "docx_narrative",
  qualityRubric: DEFAULT_QUALITY_RUBRIC,
  sourceTracePolicy: "appendix",
  allowedDepth: "concise",
  failureModes: [
    "scope stated as a wish list with no exclusions",
    "boundaries left ambiguous between in and out",
  ],
};

const sourceRfpPackage: DeliverableProfile = {
  key: "source_rfp_package",
  visualRendererRequired: true,
  visualStandard: {
    requiredVisuals: [
      "Requirements matrix",
      "Evaluation criteria and weighting table",
      "Pricing response schedule",
      "Response compliance checklist",
    ],
    requiredTables: [
      "Requirements matrix",
      "Evaluation criteria and weighting",
      "Pricing response schedule",
      "Open Inputs Required",
    ],
    clientToCompleteChecklistRequired: true,
    readinessLabelRequired: true,
  },
  title: "RFP Package",
  clientFacing: true,
  audience: ["vendor_facing", "procurement"],
  decisionPurpose:
    "Solicit comparable, evaluable vendor proposals against a precise requirement set.",
  defaultFormat: "docx",
  supportingFormats: ["pdf", "xlsx"],
  tone: "senior_consultant",
  visualDensity: "low",
  allowPhaseLabels: false,
  evidenceMode: "appendix_only",
  sourceRegisterPolicy: "appendix_only",
  missingInputPolicy: "single_open_inputs_table",
  requiredExhibits: ["options_matrix", "measurement_table", "open_inputs_required"],
  lengthGuidance: "Detailed vendor-facing procurement document — allowed to be long.",
  acceptanceChecks: [
    "requirements are numbered, testable, and comparable across vendors",
    "evaluation criteria and weighting are stated for vendors",
    "submission instructions and response format are unambiguous",
    "no internal value targets or selection bias leaked to vendors",
  ],
  intent: "rfp_package",
  appendixMode: "source_register_appendix",
  requiredTables: [
    "Requirements matrix",
    "Evaluation criteria and weighting",
    "Pricing response schedule",
    "Open Inputs Required",
  ],
  renderer: "docx_narrative",
  qualityRubric: DEFAULT_QUALITY_RUBRIC,
  sourceTracePolicy: "appendix",
  allowedDepth: "exhaustive",
  failureModes: [
    "requirements vague or non-comparable across vendors",
    "leaks internal targets or preferred-vendor signals",
  ],
};

const sourceResponseChecklist: DeliverableProfile = {
  key: "source_response_checklist",
  title: "Response Completeness Checklist",
  clientFacing: true,
  audience: ["procurement"],
  decisionPurpose:
    "Control that every vendor response is complete before it enters evaluation.",
  defaultFormat: "docx",
  supportingFormats: ["xlsx"],
  tone: "delivery_lead",
  visualDensity: "low",
  allowPhaseLabels: false,
  evidenceMode: "appendix_only",
  sourceRegisterPolicy: "appendix_only",
  missingInputPolicy: "single_open_inputs_table",
  requiredExhibits: ["measurement_table", "open_inputs_required"],
  lengthGuidance: "Operational control — concise checklist, one row per requirement.",
  acceptanceChecks: [
    "every RFP requirement maps to a completeness check",
    "complete / incomplete status is unambiguous per item",
    "gaps in any response are consolidated into one table",
  ],
  intent: "response_checklist",
  appendixMode: "source_register_appendix",
  requiredTables: ["Response completeness checklist", "Open Inputs Required"],
  renderer: "docx_narrative",
  qualityRubric: DEFAULT_QUALITY_RUBRIC,
  sourceTracePolicy: "appendix",
  allowedDepth: "concise",
  failureModes: [
    "checklist items not traceable to RFP requirements",
    "completeness status left subjective",
  ],
};

const sourceEvaluationScorecard: DeliverableProfile = {
  key: "source_evaluation_scorecard",
  visualRendererRequired: true,
  visualStandard: SOURCING_SCORECARD_VISUAL_STANDARD,
  title: "Evaluation Scorecard",
  clientFacing: true,
  audience: ["steering_committee", "procurement"],
  decisionPurpose:
    "Score vendor responses against weighted criteria with cited evidence.",
  defaultFormat: "xlsx",
  supportingFormats: ["docx"],
  tone: "senior_consultant",
  visualDensity: "medium",
  allowPhaseLabels: false,
  evidenceMode: "caption_level",
  sourceRegisterPolicy: "appendix_only",
  missingInputPolicy: "single_open_inputs_table",
  requiredExhibits: ["heatmap", "measurement_table", "decision_box"],
  lengthGuidance: "Evidence-cited scoring artifact — every score traces to a response.",
  acceptanceChecks: [
    "every score cites the specific response evidence behind it",
    "criteria weighting is applied consistently across vendors",
    "score gaps and unscored criteria are surfaced explicitly",
    "no score asserted without an evidence citation",
  ],
  intent: "evaluation_scorecard",
  appendixMode: "source_register_appendix",
  requiredTables: ["Weighted scoring matrix", "Evidence citations by score", "Open Inputs Required"],
  renderer: "xlsx_workbook",
  qualityRubric: DEFAULT_QUALITY_RUBRIC,
  sourceTracePolicy: "appendix",
  allowedDepth: "deep",
  failureModes: [
    "scores asserted without cited response evidence",
    "weighting applied inconsistently between vendors",
  ],
};

const sourcePricingWorkbook: DeliverableProfile = {
  key: "source_pricing_workbook",
  visualStandard: SOURCING_COMMERCIAL_VISUAL_STANDARD,
  title: "Pricing Workbook",
  clientFacing: false,
  audience: ["cfo", "procurement"],
  decisionPurpose:
    "Analyse and normalise vendor pricing into comparable total-cost terms.",
  defaultFormat: "xlsx",
  supportingFormats: ["docx"],
  tone: "board_grade",
  visualDensity: "low",
  allowPhaseLabels: true,
  evidenceMode: "working_binder",
  sourceRegisterPolicy: "download",
  missingInputPolicy: "working_binder_detail",
  requiredExhibits: ["measurement_table", "value_tree"],
  lengthGuidance: "Internal commercial workbook — finance-grade, cells trace to inputs.",
  acceptanceChecks: [
    "vendor pricing normalised to comparable total-cost terms",
    "no invented prices; every cell traces to a sourced input",
    "assumptions and exclusions are itemised in the binder",
    "internal-only: not structured as a vendor-facing document",
  ],
  intent: "pricing_workbook",
  appendixMode: "evidence_binder",
  requiredTables: ["Normalised pricing comparison", "Total cost of ownership", "Pricing assumptions"],
  renderer: "xlsx_workbook",
  qualityRubric: DEFAULT_QUALITY_RUBRIC,
  sourceTracePolicy: "inline_binder",
  allowedDepth: "deep",
  failureModes: [
    "invented prices presented as quoted",
    "pricing compared without normalising terms",
  ],
};

const sourcePricingTrapLog: DeliverableProfile = {
  key: "source_pricing_trap_log",
  visualRendererRequired: true,
  visualStandard: SOURCING_COMMERCIAL_VISUAL_STANDARD,
  title: "Pricing Trap Log",
  clientFacing: true,
  audience: ["cfo", "procurement"],
  decisionPurpose:
    "Expose commercial traps — escalators, lock-ins, and hidden costs — before signing.",
  defaultFormat: "docx",
  supportingFormats: ["xlsx"],
  tone: "senior_consultant",
  visualDensity: "low",
  allowPhaseLabels: false,
  evidenceMode: "appendix_only",
  sourceRegisterPolicy: "appendix_only",
  missingInputPolicy: "single_open_inputs_table",
  requiredExhibits: ["risks_and_mitigations", "measurement_table"],
  lengthGuidance: "Commercial risk log — one row per trap with exposure and mitigation.",
  acceptanceChecks: [
    "each trap names the clause/term and the cost exposure it creates",
    "each trap carries a concrete mitigation or negotiation ask",
    "no speculative traps without a cited contract term",
    "open commercial questions consolidated into one table",
  ],
  intent: "pricing_trap_log",
  appendixMode: "source_register_appendix",
  requiredTables: ["Pricing traps and mitigations", "Open Inputs Required"],
  renderer: "docx_narrative",
  qualityRubric: DEFAULT_QUALITY_RUBRIC,
  sourceTracePolicy: "appendix",
  allowedDepth: "standard",
  failureModes: [
    "traps listed without cost exposure or mitigation",
    "speculative traps with no cited contract term",
  ],
};

const sourceBafoQuestionPack: DeliverableProfile = {
  key: "source_bafo_question_pack",
  visualRendererRequired: true,
  visualStandard: SOURCING_COMMERCIAL_VISUAL_STANDARD,
  title: "BAFO Question Pack",
  clientFacing: true,
  audience: ["procurement", "vendor_facing"],
  decisionPurpose:
    "Drive best-and-final-offer negotiation with targeted, leverage-creating questions.",
  defaultFormat: "docx",
  supportingFormats: ["xlsx"],
  tone: "senior_consultant",
  visualDensity: "low",
  allowPhaseLabels: false,
  evidenceMode: "appendix_only",
  sourceRegisterPolicy: "appendix_only",
  missingInputPolicy: "single_open_inputs_table",
  requiredExhibits: ["measurement_table", "decision_box"],
  lengthGuidance: "Negotiation pack — targeted questions tied to specific leverage.",
  acceptanceChecks: [
    "each question ties to a specific gap, trap, or leverage point",
    "questions are precise and answerable, not open-ended fishing",
    "internal target stays out of vendor-facing question text",
    "open negotiation inputs consolidated into one table",
  ],
  intent: "bafo_question_pack",
  appendixMode: "source_register_appendix",
  requiredTables: ["BAFO questions by leverage point", "Open Inputs Required"],
  renderer: "docx_narrative",
  qualityRubric: DEFAULT_QUALITY_RUBRIC,
  sourceTracePolicy: "appendix",
  allowedDepth: "standard",
  failureModes: [
    "generic questions with no tie to leverage",
    "internal target leaked into vendor-facing text",
  ],
};

const sourceAtlasDecisionBrief: DeliverableProfile = {
  key: "source_atlas_decision_brief",
  visualRendererRequired: true,
  visualStandard: SOURCING_DECISION_VISUAL_STANDARD,
  title: "Sourcing Decision Brief",
  clientFacing: true,
  audience: ["board", "steering_committee", "ceo"],
  decisionPurpose:
    "Make the executive sourcing recommendation and the decision it requires.",
  defaultFormat: "pptx",
  supportingFormats: ["docx"],
  tone: "board_grade",
  visualDensity: "high",
  allowPhaseLabels: false,
  evidenceMode: "speaker_notes",
  sourceRegisterPolicy: "speaker_notes",
  missingInputPolicy: "single_open_inputs_table",
  requiredExhibits: ["decision_headline", "risks_and_mitigations", "value_story"],
  lengthGuidance: "Executive brief — one governing message per slide; decision up front.",
  acceptanceChecks: [
    "the recommendation and decision requested are visible by slide 2",
    "each slide carries one governing message; no text-wall slides",
    "risks are paired with mitigations, not just listed",
    "evidence detail held in speaker notes, not on slides",
  ],
  intent: "executive_readout",
  appendixMode: "audit_metadata",
  requiredTables: ["Decision options and recommendation"],
  renderer: "pptx_storyline",
  qualityRubric: DEFAULT_QUALITY_RUBRIC,
  sourceTracePolicy: "audit_metadata",
  allowedDepth: "concise",
  failureModes: [
    "recommendation buried below supporting detail",
    "slides crowded with evidence instead of speaker notes",
  ],
};

const sourceSentinelRiskAttestation: DeliverableProfile = {
  key: "source_sentinel_risk_attestation",
  visualRendererRequired: true,
  visualStandard: SOURCING_RISK_VISUAL_STANDARD,
  title: "Sourcing Risk Attestation",
  clientFacing: true,
  audience: ["ciso", "legal"],
  decisionPurpose:
    "Attest the security, compliance, and governance risk posture of the selected path.",
  defaultFormat: "docx",
  supportingFormats: ["xlsx"],
  tone: "board_grade",
  visualDensity: "low",
  allowPhaseLabels: false,
  evidenceMode: "appendix_only",
  sourceRegisterPolicy: "appendix_only",
  missingInputPolicy: "single_open_inputs_table",
  requiredExhibits: ["risks_and_mitigations", "control_points", "measurement_table"],
  lengthGuidance: "Governance attestation — each risk carries a control and an owner.",
  acceptanceChecks: [
    "each risk names a control, an owner, and a residual-risk position",
    "compliance/regulatory obligations are explicitly addressed",
    "no asserted control without a cited basis",
    "unresolved risk items consolidated into one table",
  ],
  intent: "risk_attestation",
  appendixMode: "source_register_appendix",
  requiredTables: ["Risk register with controls and owners", "Open Inputs Required"],
  renderer: "docx_narrative",
  qualityRubric: DEFAULT_QUALITY_RUBRIC,
  sourceTracePolicy: "appendix",
  allowedDepth: "standard",
  failureModes: [
    "risks listed without controls or owners",
    "controls asserted with no cited basis",
  ],
};

const sourceSelectionMemo: DeliverableProfile = {
  key: "source_selection_memo",
  visualRendererRequired: true,
  visualStandard: SOURCING_DECISION_VISUAL_STANDARD,
  title: "Selection Memo",
  clientFacing: true,
  audience: ["steering_committee", "procurement"],
  decisionPurpose:
    "Record the award decision and the rationale that withstands audit.",
  defaultFormat: "docx",
  supportingFormats: ["pptx"],
  tone: "board_grade",
  visualDensity: "low",
  allowPhaseLabels: false,
  evidenceMode: "appendix_only",
  sourceRegisterPolicy: "appendix_only",
  missingInputPolicy: "single_open_inputs_table",
  requiredExhibits: ["decision_box", "options_matrix", "measurement_table"],
  lengthGuidance: "Award decision record — defensible rationale, not a sales pitch.",
  acceptanceChecks: [
    "the selected vendor and the basis for award are stated up front",
    "rejected options carry an explicit reason for non-selection",
    "rationale ties back to the evaluation scorecard evidence",
    "any conditions on the award are stated explicitly",
  ],
  intent: "selection_memo",
  appendixMode: "source_register_appendix",
  requiredTables: ["Award decision and rationale", "Why-not for rejected options"],
  renderer: "docx_narrative",
  qualityRubric: DEFAULT_QUALITY_RUBRIC,
  sourceTracePolicy: "appendix",
  allowedDepth: "standard",
  failureModes: [
    "award stated without defensible rationale",
    "rejected vendors dismissed without a reason",
  ],
};

const sourceTransitionPlan: DeliverableProfile = {
  key: "source_transition_plan",
  visualRendererRequired: true,
  visualStandard: SOURCING_TRANSITION_VISUAL_STANDARD,
  title: "Transition Plan",
  clientFacing: true,
  audience: ["program_leadership"],
  decisionPurpose:
    "Mobilise delivery — sequence transition, dependencies, and cutover gates.",
  defaultFormat: "docx",
  supportingFormats: ["pptx"],
  tone: "delivery_lead",
  visualDensity: "high",
  allowPhaseLabels: false,
  evidenceMode: "caption_level",
  sourceRegisterPolicy: "appendix_only",
  missingInputPolicy: "single_open_inputs_table",
  requiredExhibits: ["roadmap_lanes", "dependency_map", "decision_calendar"],
  lengthGuidance: "Delivery mobilisation — sequenced transition with owners and gates.",
  acceptanceChecks: [
    "transition is sequenced with owners, gates, and cutover criteria",
    "dependencies and critical path are rendered, not described in prose",
    "knowledge-transfer and run-state handoff are addressed",
    "open mobilisation inputs consolidated into one table",
  ],
  intent: "transition_plan",
  appendixMode: "source_register_appendix",
  requiredTables: ["Transition workstreams and owners", "Cutover gates", "Open Inputs Required"],
  renderer: "docx_narrative",
  qualityRubric: DEFAULT_QUALITY_RUBRIC,
  sourceTracePolicy: "appendix",
  allowedDepth: "deep",
  failureModes: [
    "transition described in prose with no sequenced plan",
    "dependencies and cutover gates left implicit",
  ],
};

const sourceValueLedger: DeliverableProfile = {
  key: "source_value_ledger",
  visualRendererRequired: true,
  visualStandard: SOURCING_VALUE_VISUAL_STANDARD,
  title: "Value Ledger",
  clientFacing: true,
  audience: ["cfo", "program_leadership"],
  decisionPurpose:
    "Track realised benefits against the sourcing value targets over time.",
  defaultFormat: "xlsx",
  supportingFormats: ["docx"],
  tone: "delivery_lead",
  visualDensity: "medium",
  allowPhaseLabels: false,
  evidenceMode: "appendix_only",
  sourceRegisterPolicy: "appendix_only",
  missingInputPolicy: "single_open_inputs_table",
  requiredExhibits: ["measurement_table", "value_tree"],
  lengthGuidance: "Benefits tracking ledger — each line traces target to realised value.",
  acceptanceChecks: [
    "every benefit line has owner, baseline, target, method, and cadence",
    "realised value is separated from forecast value",
    "no fabricated benefit figures; each value traces to a source",
    "open measurement inputs consolidated into one table",
  ],
  intent: "value_ledger",
  appendixMode: "source_register_appendix",
  requiredTables: ["Benefit lines: target vs realised", "Measurement method by benefit", "Open Inputs Required"],
  renderer: "xlsx_workbook",
  qualityRubric: DEFAULT_QUALITY_RUBRIC,
  sourceTracePolicy: "appendix",
  allowedDepth: "deep",
  failureModes: [
    "benefit values fabricated or untraceable",
    "forecast value reported as if realised",
  ],
};

/** The canonical Source profile registry, keyed by SourceDeliverableKey. */
export const SOURCE_PROFILES: Readonly<
  Record<SourceDeliverableKey, DeliverableProfile>
> = {
  source_strategy_memo: sourceStrategyMemo,
  source_value_target_brief: sourceValueTargetBrief,
  source_scope_memo: sourceScopeMemo,
  source_rfp_package: sourceRfpPackage,
  source_response_checklist: sourceResponseChecklist,
  source_evaluation_scorecard: sourceEvaluationScorecard,
  source_pricing_workbook: sourcePricingWorkbook,
  source_pricing_trap_log: sourcePricingTrapLog,
  source_bafo_question_pack: sourceBafoQuestionPack,
  source_atlas_decision_brief: sourceAtlasDecisionBrief,
  source_sentinel_risk_attestation: sourceSentinelRiskAttestation,
  source_selection_memo: sourceSelectionMemo,
  source_transition_plan: sourceTransitionPlan,
  source_value_ledger: sourceValueLedger,
};
