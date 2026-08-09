// Source artifact profile registry.
//
// Every Source deliverable (d01–d33 + dx series) binds to a profile before
// generation or rendering. The profile controls: audience, format, risk depth,
// reader mode, evidence mode, source-register policy, missing-input handling,
// visual density, allowed internal labels, required exhibits, and banned terms.
//
// No hard caps on length, pages, or sections. Depth is allowed when the
// decision, audience, commercial risk, vendor exposure, or delivery complexity
// requires it. See source-documentation-standards.ts for the quality gates.
//
// Profiles are consumed by:
//   - generation prompts (bind profile before writing)
//   - QA gates (scan against bannedTerms, audience, quality signals)
//   - renderers (route format, apply evidence mode)
//   - tests (fail when client-facing artifact exposes internal labels)

export type ArtifactAudience =
  | "executive"
  | "procurement"
  | "vendor"
  | "finance"
  | "risk"
  | "delivery"
  | "architecture"
  | "internal";

export type EvidenceMode =
  | "none" // vendor-facing: no internal evidence/register language
  | "basis_only" // executive: "basis for conclusion" phrasing; register in appendix
  | "caption_level" // scorecard/PPT: evidence cited inline as short caption
  | "appendix_only" // internal audit: evidence in appendix, not main body
  | "drilldown"; // cockpit/HTML: evidence accessible via expand/link, not in main view

export type SourceRegisterPolicy =
  | "hidden" // no source register reference at all in the document
  | "appendix" // source register present but only in appendix section
  | "download" // register available as linked download, not inline
  | "internal_only" // register present only in internal version, not client-facing
  | "drilldown"; // register accessible via expand/link in HTML cockpit only

export type MissingInputPolicy =
  | "single_open_inputs_table" // one consolidated table: owner/due/consequence
  | "block_until_complete" // artifact must not be generated until all inputs exist
  | "inline_allowed_internal_only"; // open-input markers allowed inline in internal artifacts

export type VisualDensity = "low" | "medium" | "high";

export type DefaultFormat = "docx" | "pptx" | "html" | "xlsx";

// Determines how much evidence, controls, and detail are justified.
export type RiskDepth = "low" | "medium" | "high" | "board-grade";

// Defines the structural reader experience and rendering target.
export type ReaderMode =
  | "executive-narrative" // short, judgment-led, plain language, minimal labels
  | "decision-brief" // recommendation + comparison + decision page
  | "vendor-pack" // precise, complete, legally reviewed, no internal details
  | "workbook-log" // structured tables, traceable assumptions, operational records
  | "html-cockpit" // interactive, progressive disclosure, navigable lifecycle detail
  | "internal-binder"; // internal working paper, audit trail, allowed internal labels

export interface SourceArtifactProfile {
  id: string;
  title: string;
  humanTitle: string; // used in client-facing artifacts instead of d-code
  stage: string;
  audience: ArtifactAudience | ArtifactAudience[];
  clientFacing: boolean;
  decisionPurpose: string; // one sentence: what decision this document enables
  riskDepth: RiskDepth; // depth of evidence, controls, and detail justified
  readerMode: ReaderMode; // structural reader experience and rendering target
  defaultFormat: DefaultFormat;
  secondaryFormats?: DefaultFormat[];
  evidenceMode: EvidenceMode;
  sourceRegisterPolicy: SourceRegisterPolicy;
  missingInputPolicy: MissingInputPolicy;
  visualDensity: VisualDensity;
  allowedInternalLabels: boolean; // false = hide d-codes, AI labels, gate language
  requiredExhibits: string[]; // structural sections/elements the doc must contain
  bannedTerms: string[]; // terms that must not appear in generated output
}

// ── Shared banned-term sets ─────────────────────────────────────────────────

const SCATTERED_OPEN_INPUT_MARKERS = [
  `[CLIENT TO ${"SET"}]`,
  `[${"T"}${"BD"}]`,
  `[TO BE ${"CONFIRMED"}]`,
];

const CLIENT_FACING_BANNED: string[] = [
  // d-codes
  "d01",
  "d02",
  "d03",
  "d04",
  "d05",
  "d06",
  "d07",
  "d08",
  "d09",
  "d10",
  "d11",
  "d12",
  "d13",
  "d14",
  "d15",
  "d16",
  "d17",
  "d18",
  "d19",
  "d20",
  "d21",
  "d22",
  "d23",
  "d24",
  "d25",
  "d26",
  "d27",
  "d28",
  "d29",
  "d30",
  "d31",
  "d32",
  "d33",
  "dx0",
  "dx1",
  "dx2",
  "dx4",
  "dx6a",
  "dx6b",
  "dx7",
  // AI/infrastructure language
  "AI generated",
  "auto-draft",
  "auto-generated",
  "map-reduce",
  "Opus",
  "claude-opus",
  "Anthropic",
  "substrate",
  "vector",
  "embedding",
  "source register",
  "context rows",
  "evidence rows",
  // Gate/stage labels
  "gate-defining",
  "stage gate",
  "quality score",
  "quality gate",
  // Scattered placeholders
  ...SCATTERED_OPEN_INPUT_MARKERS,
  // Internal procurement mechanics
  "not authorized to build",
  "cannot proceed",
];

const VENDOR_FACING_BANNED: string[] = [
  ...CLIENT_FACING_BANNED,
  "internal sensitivity",
  "value floor",
  "walk-away",
  "internal target",
  "source register",
  "evidence register",
  "Steward",
  "Sentinel agent",
  "Atlas agent",
  "scoring mechanics",
  "weighting formula",
];

// ── Profile registry ─────────────────────────────────────────────────────────

const PROFILES: SourceArtifactProfile[] = [
  // ── STAGE 1: STRATEGY ────────────────────────────────────────────────────

  {
    id: "d01",
    title: "Sourcing Strategy Memo",
    humanTitle: "Sourcing Strategy Memo",
    stage: "1 · Strategy",
    audience: "executive",
    clientFacing: true,
    decisionPurpose:
      "Approve the sourcing event and authorize scope and RFP preparation work.",
    riskDepth: "high",
    readerMode: "executive-narrative",
    defaultFormat: "docx",
    evidenceMode: "basis_only",
    sourceRegisterPolicy: "appendix",
    missingInputPolicy: "single_open_inputs_table",
    visualDensity: "medium",
    allowedInternalLabels: false,
    requiredExhibits: [
      "decision_requested",
      "why_now",
      "recommended_approach",
      "what_we_know",
      "what_remains_open",
      "value_hypothesis",
      "next_gate",
    ],
    bannedTerms: [...CLIENT_FACING_BANNED, "d01", "auto-draft"],
  },

  {
    id: "d02",
    title: "Value Target Brief",
    humanTitle: "Value Target Brief",
    stage: "1 · Strategy",
    audience: ["executive", "finance"],
    clientFacing: false,
    decisionPurpose:
      "Establish the value target range and levers; never disclosed externally.",
    riskDepth: "high",
    readerMode: "internal-binder",
    defaultFormat: "docx",
    evidenceMode: "appendix_only",
    sourceRegisterPolicy: "internal_only",
    missingInputPolicy: "inline_allowed_internal_only",
    visualDensity: "low",
    allowedInternalLabels: true,
    requiredExhibits: [
      "value_range",
      "levers",
      "confidence_band",
      "sensitivity_floor",
      "evidence_basis",
    ],
    bannedTerms: ["AI generated", "auto-draft", "map-reduce", "substrate"],
  },

  {
    id: "d03",
    title: "Archetype Decision Record",
    humanTitle: "Archetype Decision Record",
    stage: "1 · Strategy",
    audience: "internal",
    clientFacing: false,
    decisionPurpose:
      "Record and defend the archetype and rigor level selection for audit trail.",
    riskDepth: "medium",
    readerMode: "internal-binder",
    defaultFormat: "html",
    evidenceMode: "appendix_only",
    sourceRegisterPolicy: "internal_only",
    missingInputPolicy: "inline_allowed_internal_only",
    visualDensity: "low",
    allowedInternalLabels: true,
    requiredExhibits: ["archetype_chosen", "two_axis_rationale", "rigor_level"],
    bannedTerms: ["AI generated", "substrate"],
  },

  // ── STAGE 2: SCOPE ───────────────────────────────────────────────────────

  {
    id: "d04",
    title: "Application Inventory & Tiering",
    humanTitle: "Application Inventory",
    stage: "2 · Scope",
    audience: ["procurement", "delivery"],
    clientFacing: true,
    decisionPurpose:
      "Establish the tier-classified application inventory as pricing and scope basis.",
    riskDepth: "medium",
    readerMode: "workbook-log",
    defaultFormat: "xlsx",
    secondaryFormats: ["docx"],
    evidenceMode: "caption_level",
    sourceRegisterPolicy: "download",
    missingInputPolicy: "block_until_complete",
    visualDensity: "medium",
    allowedInternalLabels: false,
    requiredExhibits: [
      "app_name",
      "hosting_model",
      "criticality_tier",
      "fte_count",
      "run_cost",
      "support_tier",
      "in_out_flag",
    ],
    bannedTerms: [...CLIENT_FACING_BANNED],
  },

  {
    id: "d05",
    title: "Scope Memo with Boundaries",
    humanTitle: "Scope Boundary Memo",
    stage: "2 · Scope",
    audience: ["procurement", "delivery"],
    clientFacing: true,
    decisionPurpose:
      "Define exactly what vendors must price and what they must not price.",
    riskDepth: "high",
    readerMode: "decision-brief",
    defaultFormat: "docx",
    evidenceMode: "basis_only",
    sourceRegisterPolicy: "appendix",
    missingInputPolicy: "single_open_inputs_table",
    visualDensity: "medium",
    allowedInternalLabels: false,
    requiredExhibits: [
      "in_scope_towers",
      "support_tiers",
      "exclusions",
      "run_change_boundary",
      "open_scope_questions",
    ],
    bannedTerms: [...CLIENT_FACING_BANNED],
  },

  {
    id: "d06",
    title: "Exclusion Log",
    humanTitle: "Exclusion Register",
    stage: "2 · Scope",
    audience: ["internal", "risk"],
    clientFacing: false,
    decisionPurpose:
      "Name every excluded app, service, and region with audit-defensible rationale.",
    riskDepth: "medium",
    readerMode: "internal-binder",
    defaultFormat: "html",
    evidenceMode: "appendix_only",
    sourceRegisterPolicy: "internal_only",
    missingInputPolicy: "inline_allowed_internal_only",
    visualDensity: "low",
    allowedInternalLabels: true,
    requiredExhibits: [
      "excluded_item",
      "rationale",
      "owner",
      "downstream_risk",
    ],
    bannedTerms: ["AI generated", "substrate", "source register"],
  },

  {
    id: "d07",
    title: "Ticket History Synthesis",
    humanTitle: "Operational Demand Brief",
    stage: "2 · Scope",
    audience: ["procurement", "delivery"],
    clientFacing: true,
    decisionPurpose:
      "Convert ticket volume data into SLA obligations, sizing signals, and transition implications.",
    riskDepth: "medium",
    readerMode: "workbook-log",
    defaultFormat: "docx",
    evidenceMode: "basis_only",
    sourceRegisterPolicy: "appendix",
    missingInputPolicy: "single_open_inputs_table",
    visualDensity: "medium",
    allowedInternalLabels: false,
    requiredExhibits: [
      "l2_l3_volume_by_tier",
      "mttr_baseline",
      "peak_demand",
      "sla_risk_signals",
      "transition_implications",
    ],
    bannedTerms: [...CLIENT_FACING_BANNED],
  },

  {
    id: "d08",
    title: "Pre-mortem on Scope Risk",
    humanTitle: "Scope Pre-mortem",
    stage: "2 · Scope",
    audience: "internal",
    clientFacing: false,
    decisionPurpose:
      "Surface top scope risks before the RFP is issued; one-page challenge view.",
    riskDepth: "medium",
    readerMode: "internal-binder",
    defaultFormat: "docx",
    evidenceMode: "basis_only",
    sourceRegisterPolicy: "internal_only",
    missingInputPolicy: "inline_allowed_internal_only",
    visualDensity: "low",
    allowedInternalLabels: true,
    requiredExhibits: ["top_risks", "mitigations"],
    bannedTerms: ["AI generated", "substrate"],
  },

  // ── STAGE 3: RFP ────────────────────────────────────────────────────────

  {
    id: "d09",
    title: "RFP Package",
    humanTitle: "Request for Proposal",
    stage: "3 · RFP",
    audience: "vendor",
    clientFacing: true,
    decisionPurpose:
      "Obtain complete, comparable vendor bids on a defined scope and assumption set.",
    riskDepth: "high",
    readerMode: "vendor-pack",
    defaultFormat: "docx",
    evidenceMode: "none",
    sourceRegisterPolicy: "internal_only",
    missingInputPolicy: "block_until_complete",
    visualDensity: "medium",
    allowedInternalLabels: false,
    requiredExhibits: [
      "executive_summary",
      "current_state_baseline",
      "scope_towers",
      "estate_summary",
      "sla_obligations",
      "transition_approach",
      "commercial_model",
      "response_instructions",
      "evaluation_framework",
      "risk_register",
      "gap_register",
    ],
    bannedTerms: [...VENDOR_FACING_BANNED],
  },

  {
    id: "d10",
    title: "RFI Summary",
    humanTitle: "Market Landscape Brief",
    stage: "3 · RFP",
    audience: ["procurement", "executive"],
    clientFacing: true,
    decisionPurpose:
      "Summarize the vendor landscape, capability map, and shortlisting rationale.",
    riskDepth: "medium",
    readerMode: "executive-narrative",
    defaultFormat: "docx",
    evidenceMode: "basis_only",
    sourceRegisterPolicy: "appendix",
    missingInputPolicy: "single_open_inputs_table",
    visualDensity: "medium",
    allowedInternalLabels: false,
    requiredExhibits: [
      "vendor_landscape",
      "capability_map",
      "shortlist_rationale",
      "eliminated_vendors",
    ],
    bannedTerms: [...CLIENT_FACING_BANNED],
  },

  {
    id: "d11",
    title: "Vendor Response Control Pack",
    humanTitle: "Vendor Response Control Pack",
    stage: "3 · RFP",
    audience: "vendor",
    clientFacing: true,
    decisionPurpose:
      "Mandate structured, evidence-backed vendor submissions so proposals are comparable, commercially useful, and negotiation-ready.",
    riskDepth: "high",
    readerMode: "vendor-pack",
    defaultFormat: "xlsx",
    secondaryFormats: ["docx"],
    evidenceMode: "none",
    sourceRegisterPolicy: "internal_only",
    missingInputPolicy: "block_until_complete",
    visualDensity: "medium",
    allowedInternalLabels: false,
    requiredExhibits: [
      "response_compliance_mandate",
      "vendor_claim_register",
      "automation_productivity_commitment_table",
      "pricing_response_tab",
      "staffing_and_location_model",
      "sla_commitment_table",
      "assumptions_and_exclusions_log",
      "transition_plan_template",
      "commercial_exceptions_table",
      "commercial_leverage_readiness_matrix",
    ],
    bannedTerms: [...VENDOR_FACING_BANNED],
  },

  {
    id: "d12",
    title: "Vendor Shortlist",
    humanTitle: "Shortlist Decision Note",
    stage: "3 · RFP",
    audience: ["procurement", "executive"],
    clientFacing: false,
    decisionPurpose:
      "Record which vendors are invited to bid and the screening rationale.",
    riskDepth: "medium",
    readerMode: "decision-brief",
    defaultFormat: "html",
    evidenceMode: "basis_only",
    sourceRegisterPolicy: "appendix",
    missingInputPolicy: "single_open_inputs_table",
    visualDensity: "low",
    allowedInternalLabels: true,
    requiredExhibits: [
      "shortlisted_vendors",
      "screening_criteria",
      "eliminated_vendors",
    ],
    bannedTerms: ["AI generated", "substrate"],
  },

  // ── STAGE 4: RESPONSES ──────────────────────────────────────────────────

  {
    id: "d13",
    title: "Vendor Response Pack",
    humanTitle: "Response Intake Dashboard",
    stage: "4 · Responses",
    audience: "procurement",
    clientFacing: false,
    decisionPurpose:
      "Convert vendor submissions into a completeness dashboard and exception list.",
    riskDepth: "medium",
    readerMode: "html-cockpit",
    defaultFormat: "html",
    secondaryFormats: ["docx"],
    evidenceMode: "drilldown",
    sourceRegisterPolicy: "download",
    missingInputPolicy: "inline_allowed_internal_only",
    visualDensity: "high",
    allowedInternalLabels: true,
    requiredExhibits: [
      "receipt_status",
      "completeness_flags",
      "key_claims_by_vendor",
      "exception_list",
    ],
    bannedTerms: ["AI generated", "substrate", "source register"],
  },

  {
    id: "d14",
    title: "Q&A Log",
    humanTitle: "Q&A Parity Log",
    stage: "4 · Responses",
    audience: ["vendor", "procurement"],
    clientFacing: true,
    decisionPurpose:
      "Publish authoritative answers to vendor questions simultaneously to all shortlisted vendors.",
    riskDepth: "medium",
    readerMode: "vendor-pack",
    defaultFormat: "html",
    evidenceMode: "none",
    sourceRegisterPolicy: "internal_only",
    missingInputPolicy: "block_until_complete",
    visualDensity: "low",
    allowedInternalLabels: false,
    requiredExhibits: [
      "question_id",
      "question_text",
      "authoritative_answer",
      "binding_status",
      "published_to_all_flag",
    ],
    bannedTerms: [...VENDOR_FACING_BANNED],
  },

  {
    id: "d15",
    title: "Response Completeness Report",
    humanTitle: "Response Completeness Report",
    stage: "4 · Responses",
    audience: "procurement",
    clientFacing: false,
    decisionPurpose:
      "Confirm each vendor meets the completeness threshold before evaluation opens.",
    riskDepth: "medium",
    readerMode: "html-cockpit",
    defaultFormat: "html",
    evidenceMode: "drilldown",
    sourceRegisterPolicy: "download",
    missingInputPolicy: "inline_allowed_internal_only",
    visualDensity: "high",
    allowedInternalLabels: true,
    requiredExhibits: [
      "vendor_fill_rate",
      "missing_items",
      "remediation_requests",
      "admission_decision",
    ],
    bannedTerms: ["AI generated", "substrate"],
  },

  // ── STAGE 5: EVALUATION ─────────────────────────────────────────────────

  {
    id: "d16",
    title: "Evaluation Scorecard",
    humanTitle: "Evaluation Scorecard",
    stage: "5 · Evaluation",
    audience: ["procurement", "executive"],
    clientFacing: false,
    decisionPurpose:
      "Produce a defensible, evidence-cited ranking of vendors against locked criteria.",
    riskDepth: "high",
    readerMode: "workbook-log",
    defaultFormat: "xlsx",
    secondaryFormats: ["docx"],
    evidenceMode: "caption_level",
    sourceRegisterPolicy: "drilldown",
    missingInputPolicy: "block_until_complete",
    visualDensity: "high",
    allowedInternalLabels: true,
    requiredExhibits: [
      "vendor_x_criteria_matrix",
      "weighted_totals",
      "evidence_citations",
      "panel_scores",
      "disqualification_flags",
      "executive_ranking_summary",
    ],
    bannedTerms: ["AI generated", "substrate", "auto-draft"],
  },

  {
    id: "d17",
    title: "Weight Set Governance Log",
    humanTitle: "Weight Governance Record",
    stage: "5 · Evaluation",
    audience: ["internal", "risk"],
    clientFacing: false,
    decisionPurpose:
      "Prove evaluation weights were locked before any vendor response was scored.",
    riskDepth: "high",
    readerMode: "internal-binder",
    defaultFormat: "html",
    evidenceMode: "appendix_only",
    sourceRegisterPolicy: "internal_only",
    missingInputPolicy: "inline_allowed_internal_only",
    visualDensity: "low",
    allowedInternalLabels: true,
    requiredExhibits: [
      "weight_version",
      "approver",
      "timestamp",
      "lock_confirmation",
    ],
    bannedTerms: ["AI generated", "substrate"],
  },

  {
    id: "d18",
    title: "Disqualification Rationale",
    humanTitle: "Disqualification Note",
    stage: "5 · Evaluation",
    audience: ["internal", "risk"],
    clientFacing: false,
    decisionPurpose:
      "Document the rule triggered and evidence for any eliminated vendor.",
    riskDepth: "high",
    readerMode: "internal-binder",
    defaultFormat: "html",
    evidenceMode: "basis_only",
    sourceRegisterPolicy: "internal_only",
    missingInputPolicy: "inline_allowed_internal_only",
    visualDensity: "low",
    allowedInternalLabels: true,
    requiredExhibits: [
      "rule_triggered",
      "evidence",
      "decision_owner",
      "debrief_implication",
    ],
    bannedTerms: ["AI generated", "substrate"],
  },

  // ── STAGE 6: PRICING ────────────────────────────────────────────────────

  {
    id: "d19",
    title: "Pricing Normalization Workbook",
    humanTitle: "Pricing Normalization Workbook",
    stage: "6 · Pricing",
    audience: ["finance", "procurement"],
    clientFacing: false,
    decisionPurpose:
      "Normalize vendor pricing on locked assumptions and expose TCO bridge and pricing traps.",
    riskDepth: "high",
    readerMode: "workbook-log",
    defaultFormat: "xlsx",
    secondaryFormats: ["docx"],
    evidenceMode: "caption_level",
    sourceRegisterPolicy: "appendix",
    missingInputPolicy: "block_until_complete",
    visualDensity: "high",
    allowedInternalLabels: true,
    requiredExhibits: [
      "tco_comparison_matrix",
      "run_cost_by_tower",
      "transition_costs",
      "contract_escalators",
      "fx_normalization",
      "tco_bridge",
      "year_1_to_5_view",
    ],
    bannedTerms: ["AI generated", "substrate", "fake precision"],
  },

  {
    id: "d20",
    title: "Pricing Trap Log",
    humanTitle: "Pricing Trap Log",
    stage: "6 · Pricing",
    audience: ["finance", "procurement"],
    clientFacing: false,
    decisionPurpose:
      "Surface P0/P1/P2 pricing traps and track resolution before BAFO.",
    riskDepth: "high",
    readerMode: "internal-binder",
    defaultFormat: "html",
    evidenceMode: "basis_only",
    sourceRegisterPolicy: "appendix",
    missingInputPolicy: "inline_allowed_internal_only",
    visualDensity: "medium",
    allowedInternalLabels: true,
    requiredExhibits: [
      "trap_id",
      "severity_p0_p1_p2",
      "vendor",
      "materiality",
      "resolution_path",
      "decision_impact",
    ],
    bannedTerms: ["AI generated", "substrate"],
  },

  {
    id: "d21",
    title: "Locked Assumption Set",
    humanTitle: "Locked Assumptions Record",
    stage: "6 · Pricing",
    audience: ["finance", "risk"],
    clientFacing: false,
    decisionPurpose:
      "Lock the commercial comparison assumptions before pricing normalization is built.",
    riskDepth: "high",
    readerMode: "internal-binder",
    defaultFormat: "html",
    evidenceMode: "appendix_only",
    sourceRegisterPolicy: "internal_only",
    missingInputPolicy: "block_until_complete",
    visualDensity: "low",
    allowedInternalLabels: true,
    requiredExhibits: [
      "assumption_item",
      "value",
      "owner",
      "approved_date",
      "lock_confirmation",
    ],
    bannedTerms: ["AI generated", "substrate"],
  },

  // ── STAGE 7: BAFO ───────────────────────────────────────────────────────

  {
    id: "d22",
    title: "BAFO Question Pack",
    humanTitle: "Best-and-Final-Offer Request",
    stage: "7 · BAFO",
    audience: "vendor",
    clientFacing: true,
    decisionPurpose:
      "Issue precise BAFO questions that close pricing traps, evaluation gaps, and commercial terms.",
    riskDepth: "high",
    readerMode: "vendor-pack",
    defaultFormat: "xlsx",
    secondaryFormats: ["docx"],
    evidenceMode: "none",
    sourceRegisterPolicy: "internal_only",
    missingInputPolicy: "block_until_complete",
    visualDensity: "medium",
    allowedInternalLabels: false,
    requiredExhibits: [
      "question_id",
      "question_text",
      "trap_or_gap_reference",
      "response_format",
      "due_date",
    ],
    bannedTerms: [...VENDOR_FACING_BANNED],
  },

  {
    id: "d23",
    title: "BAFO Round Log",
    humanTitle: "BAFO Round Readout",
    stage: "7 · BAFO",
    audience: ["finance", "procurement"],
    clientFacing: false,
    decisionPurpose:
      "Compare BAFO responses against initial bids and record unresolved issues.",
    riskDepth: "high",
    readerMode: "decision-brief",
    defaultFormat: "html",
    evidenceMode: "caption_level",
    sourceRegisterPolicy: "appendix",
    missingInputPolicy: "inline_allowed_internal_only",
    visualDensity: "high",
    allowedInternalLabels: true,
    requiredExhibits: [
      "before_after_price_delta",
      "trap_resolution_status",
      "terms_changed",
      "unresolved_risks",
      "finalist_impact",
    ],
    bannedTerms: ["AI generated", "substrate"],
  },

  // ── STAGE 8: EXECUTIVE DECISION ─────────────────────────────────────────

  {
    id: "d24",
    title: "Decision Brief",
    humanTitle: "Executive Award Recommendation",
    stage: "8 · Exec Decision",
    audience: "executive",
    clientFacing: true,
    decisionPurpose:
      "Approve the recommended vendor award with a clear recommendation, comparison, and residual risks.",
    riskDepth: "board-grade",
    readerMode: "decision-brief",
    defaultFormat: "pptx",
    secondaryFormats: ["docx"],
    evidenceMode: "caption_level",
    sourceRegisterPolicy: "appendix",
    missingInputPolicy: "single_open_inputs_table",
    visualDensity: "high",
    allowedInternalLabels: false,
    requiredExhibits: [
      "recommendation",
      "why_recommended_vendor_wins",
      "finalist_comparison",
      "tco_bridge",
      "residual_risks",
      "contract_conditions",
      "decision_page",
    ],
    bannedTerms: [
      ...CLIENT_FACING_BANNED,
      "d24",
      "Steward sign-off",
      "Sentinel attestation",
    ],
  },

  {
    id: "d25",
    title: "Risk Attestation",
    humanTitle: "Risk Attestation",
    stage: "8 · Exec Decision",
    audience: ["risk", "executive"],
    clientFacing: false,
    decisionPurpose:
      "Attest to the aggregated risk position and residual risks requiring sponsor acceptance.",
    riskDepth: "high",
    readerMode: "internal-binder",
    defaultFormat: "html",
    evidenceMode: "basis_only",
    sourceRegisterPolicy: "appendix",
    missingInputPolicy: "single_open_inputs_table",
    visualDensity: "medium",
    allowedInternalLabels: true,
    requiredExhibits: [
      "concentration_risk",
      "security_compliance_gaps",
      "vendor_financial_viability",
      "geopolitical_risk",
      "contractual_exposure",
      "top_residual_risks",
      "mitigation_commitments",
    ],
    bannedTerms: ["AI generated", "substrate"],
  },

  {
    id: "d26",
    title: "Steward Sign-off Record",
    humanTitle: "Governance Sign-off Record",
    stage: "8 · Exec Decision",
    audience: ["internal", "risk"],
    clientFacing: false,
    decisionPurpose:
      "Attest that the scorecard is evidence-cited and weights were locked before scoring.",
    riskDepth: "board-grade",
    readerMode: "internal-binder",
    defaultFormat: "html",
    evidenceMode: "appendix_only",
    sourceRegisterPolicy: "internal_only",
    missingInputPolicy: "block_until_complete",
    visualDensity: "low",
    allowedInternalLabels: true,
    requiredExhibits: [
      "scorecard_attestation",
      "weight_lock_confirmation",
      "no_post_hoc_adjustment",
      "signatory",
    ],
    bannedTerms: ["AI generated", "substrate"],
  },

  // ── STAGE 9: SELECTION ──────────────────────────────────────────────────

  {
    id: "d27",
    title: "Selection Memo",
    humanTitle: "Selection Memo",
    stage: "9 · Selection",
    audience: "executive",
    clientFacing: true,
    decisionPurpose:
      "Record the vendor selection decision with rationale, commercial terms, and conditions to close.",
    riskDepth: "high",
    readerMode: "executive-narrative",
    defaultFormat: "docx",
    evidenceMode: "basis_only",
    sourceRegisterPolicy: "appendix",
    missingInputPolicy: "single_open_inputs_table",
    visualDensity: "low",
    allowedInternalLabels: false,
    requiredExhibits: [
      "selected_vendor",
      "selection_rationale",
      "commercial_terms_summary",
      "conditions_to_close",
      "sponsor_sign_off",
    ],
    bannedTerms: [...CLIENT_FACING_BANNED],
  },

  {
    id: "d28",
    title: "Contract Record",
    humanTitle: "Contract Terms Snapshot",
    stage: "9 · Selection",
    audience: ["risk", "finance"],
    clientFacing: false,
    decisionPurpose:
      "Capture the contract terms that govern transition, governance, value, and exit.",
    riskDepth: "high",
    readerMode: "internal-binder",
    defaultFormat: "html",
    evidenceMode: "appendix_only",
    sourceRegisterPolicy: "internal_only",
    missingInputPolicy: "block_until_complete",
    visualDensity: "low",
    allowedInternalLabels: true,
    requiredExhibits: [
      "contract_reference",
      "total_contract_value",
      "annual_run_cost",
      "change_budget",
      "sla_regime",
      "exit_provisions",
    ],
    bannedTerms: ["AI generated", "substrate"],
  },

  // ── STAGE 10: TRANSITION ────────────────────────────────────────────────

  {
    id: "d29",
    title: "Transition Plan",
    humanTitle: "Transition Roadmap",
    stage: "10 · Transition",
    audience: ["delivery", "executive"],
    clientFacing: true,
    decisionPurpose:
      "Define milestones, cutover, knowledge transfer, and go/no-go checkpoints.",
    riskDepth: "high",
    readerMode: "executive-narrative",
    defaultFormat: "html",
    evidenceMode: "caption_level",
    sourceRegisterPolicy: "download",
    missingInputPolicy: "single_open_inputs_table",
    visualDensity: "high",
    allowedInternalLabels: false,
    requiredExhibits: [
      "migration_milestones",
      "knowledge_transfer_schedule",
      "cutover_dates",
      "parallel_run_window",
      "hypercare_period",
      "owner_per_milestone",
    ],
    bannedTerms: [...CLIENT_FACING_BANNED],
  },

  {
    id: "d30",
    title: "Checkpoint Log",
    humanTitle: "Transition Checkpoint Cockpit",
    stage: "10 · Transition",
    audience: "delivery",
    clientFacing: false,
    decisionPurpose:
      "Track go/no-go decisions at every transition milestone in real time.",
    riskDepth: "medium",
    readerMode: "html-cockpit",
    defaultFormat: "html",
    evidenceMode: "drilldown",
    sourceRegisterPolicy: "download",
    missingInputPolicy: "inline_allowed_internal_only",
    visualDensity: "high",
    allowedInternalLabels: true,
    requiredExhibits: [
      "checkpoint_id",
      "planned_date",
      "actual_date",
      "rag_status",
      "go_no_go_decision",
      "blocker",
      "owner",
    ],
    bannedTerms: ["AI generated", "substrate"],
  },

  {
    id: "d31",
    title: "Knowledge-Transfer Evidence",
    humanTitle: "Knowledge-Transfer Evidence",
    stage: "10 · Transition",
    audience: ["delivery", "risk"],
    clientFacing: false,
    decisionPurpose:
      "Prove competency transfer — not just session attendance — system by system.",
    riskDepth: "medium",
    readerMode: "workbook-log",
    defaultFormat: "html",
    evidenceMode: "appendix_only",
    sourceRegisterPolicy: "download",
    missingInputPolicy: "block_until_complete",
    visualDensity: "medium",
    allowedInternalLabels: true,
    requiredExhibits: [
      "system_name",
      "kt_topic",
      "session_date",
      "attendees",
      "competency_check",
      "runbook_verified",
      "signatory",
    ],
    bannedTerms: ["AI generated", "substrate"],
  },

  // ── STAGE 11: VALUE ─────────────────────────────────────────────────────

  {
    id: "d32",
    title: "Value Ledger",
    humanTitle: "Value Realization Ledger",
    stage: "11 · Value",
    audience: ["finance", "executive"],
    clientFacing: true,
    decisionPurpose:
      "Track projected, committed, measuring, and realized value against the original target.",
    riskDepth: "high",
    readerMode: "html-cockpit",
    defaultFormat: "html",
    secondaryFormats: ["xlsx"],
    evidenceMode: "caption_level",
    sourceRegisterPolicy: "drilldown",
    missingInputPolicy: "single_open_inputs_table",
    visualDensity: "high",
    allowedInternalLabels: false,
    requiredExhibits: [
      "projected_value",
      "committed_value",
      "measuring_value",
      "realized_value",
      "lever_breakdown",
      "finance_owner",
      "data_source",
      "delta_to_target",
    ],
    bannedTerms: [...CLIENT_FACING_BANNED],
  },

  {
    id: "d33",
    title: "Governance Review Note",
    humanTitle: "Quarterly Governance Note",
    stage: "11 · Value",
    audience: ["executive", "finance"],
    clientFacing: true,
    decisionPurpose:
      "Report quarterly on SLA performance, value progress, open issues, and re-baseline triggers.",
    riskDepth: "medium",
    readerMode: "executive-narrative",
    defaultFormat: "html",
    evidenceMode: "basis_only",
    sourceRegisterPolicy: "appendix",
    missingInputPolicy: "single_open_inputs_table",
    visualDensity: "medium",
    allowedInternalLabels: false,
    requiredExhibits: [
      "sla_performance",
      "value_ledger_update",
      "open_issues",
      "decisions_needed",
      "rebaseline_triggers",
    ],
    bannedTerms: [...CLIENT_FACING_BANNED],
  },

  // ── LIFECYCLE WAVE (dx series) ───────────────────────────────────────────

  {
    id: "dx0",
    title: "Demand Challenge",
    humanTitle: "Demand Challenge Memo",
    stage: "Pre-sourcing",
    audience: "executive",
    clientFacing: true,
    decisionPurpose:
      "Challenge whether to source at all — versus renew, insource, or defer.",
    riskDepth: "high",
    readerMode: "decision-brief",
    defaultFormat: "docx",
    evidenceMode: "basis_only",
    sourceRegisterPolicy: "appendix",
    missingInputPolicy: "single_open_inputs_table",
    visualDensity: "low",
    allowedInternalLabels: false,
    requiredExhibits: [
      "sourcing_thesis_challenge",
      "alternatives_considered",
      "decision_recommended",
      "conditions_to_proceed",
    ],
    bannedTerms: [...CLIENT_FACING_BANNED],
  },

  {
    id: "dx1",
    title: "Sourcing Approach",
    humanTitle: "Sourcing Approach Plan",
    stage: "Pre-sourcing",
    audience: ["procurement", "executive"],
    clientFacing: true,
    decisionPurpose:
      "Define the market engagement approach, timeline, governance, and sourcing rationale.",
    riskDepth: "medium",
    readerMode: "executive-narrative",
    defaultFormat: "docx",
    evidenceMode: "basis_only",
    sourceRegisterPolicy: "appendix",
    missingInputPolicy: "single_open_inputs_table",
    visualDensity: "medium",
    allowedInternalLabels: false,
    requiredExhibits: [
      "engagement_model",
      "market_engagement_strategy",
      "timeline",
      "governance",
      "rationale",
    ],
    bannedTerms: [...CLIENT_FACING_BANNED],
  },

  {
    id: "dx2",
    title: "Market Scan",
    humanTitle: "Market Scan",
    stage: "3 · RFP",
    audience: ["procurement", "executive"],
    clientFacing: true,
    decisionPurpose:
      "Map the vendor landscape, capability differences, and shortlisting axes.",
    riskDepth: "medium",
    readerMode: "executive-narrative",
    defaultFormat: "html",
    secondaryFormats: ["docx"],
    evidenceMode: "caption_level",
    sourceRegisterPolicy: "drilldown",
    missingInputPolicy: "single_open_inputs_table",
    visualDensity: "high",
    allowedInternalLabels: false,
    requiredExhibits: [
      "vendor_capability_map",
      "differentiation_axes",
      "analyst_inputs",
      "shortlisting_implications",
    ],
    bannedTerms: [...CLIENT_FACING_BANNED],
  },

  {
    id: "dx4",
    title: "TCO Iceberg",
    humanTitle: "TCO Iceberg",
    stage: "6 · Pricing",
    audience: "finance",
    clientFacing: false,
    decisionPurpose:
      "Surface hidden costs the standard pricing template misses and quantify true TCO.",
    riskDepth: "high",
    readerMode: "workbook-log",
    defaultFormat: "html",
    secondaryFormats: ["docx"],
    evidenceMode: "caption_level",
    sourceRegisterPolicy: "appendix",
    missingInputPolicy: "single_open_inputs_table",
    visualDensity: "high",
    allowedInternalLabels: true,
    requiredExhibits: [
      "hidden_cost_bridge",
      "stranded_assets",
      "retained_it_overhead",
      "governance_cost",
      "security_uplift",
      "integration_debt",
      "commercial_implications",
    ],
    bannedTerms: ["AI generated", "substrate", "fake precision"],
  },

  {
    id: "dx6a",
    title: "AI Clause Gap",
    humanTitle: "AI Clause Gap Assessment",
    stage: "8 · Exec Decision",
    audience: ["risk", "procurement"],
    clientFacing: false,
    decisionPurpose:
      "Identify AI/ML vendor capability gaps and negotiable contract clause deficiencies.",
    riskDepth: "high",
    readerMode: "internal-binder",
    defaultFormat: "docx",
    evidenceMode: "basis_only",
    sourceRegisterPolicy: "appendix",
    missingInputPolicy: "single_open_inputs_table",
    visualDensity: "medium",
    allowedInternalLabels: true,
    requiredExhibits: [
      "ai_readiness_assessment",
      "data_rights_gaps",
      "model_governance",
      "automation_commitments",
      "negotiable_terms",
    ],
    bannedTerms: ["AI generated", "substrate"],
  },

  {
    id: "dx6b",
    title: "Vendor Risk Pack",
    humanTitle: "Vendor Risk Pack",
    stage: "8 · Exec Decision",
    audience: ["risk", "executive"],
    clientFacing: false,
    decisionPurpose:
      "Assess vendor financial, operational, strategic, and geopolitical risk before award.",
    riskDepth: "high",
    readerMode: "internal-binder",
    defaultFormat: "html",
    secondaryFormats: ["docx"],
    evidenceMode: "caption_level",
    sourceRegisterPolicy: "drilldown",
    missingInputPolicy: "single_open_inputs_table",
    visualDensity: "high",
    allowedInternalLabels: true,
    requiredExhibits: [
      "risk_heatmap",
      "financial_viability",
      "delivery_concentration",
      "geographic_risk",
      "strategic_alignment",
      "mitigation_terms",
      "executive_top_risks",
    ],
    bannedTerms: ["AI generated", "substrate"],
  },

  {
    id: "dx7",
    title: "Renewal Decision",
    humanTitle: "Renewal Decision Memo",
    stage: "Pre-sourcing",
    audience: "executive",
    clientFacing: true,
    decisionPurpose:
      "Frame the renew / re-compete / renegotiate options with financial and transition tradeoffs.",
    riskDepth: "high",
    readerMode: "decision-brief",
    defaultFormat: "docx",
    evidenceMode: "basis_only",
    sourceRegisterPolicy: "appendix",
    missingInputPolicy: "single_open_inputs_table",
    visualDensity: "medium",
    allowedInternalLabels: false,
    requiredExhibits: [
      "renewal_vs_recompete_options",
      "financial_comparison",
      "transition_cost_avoidance",
      "strategic_relationship_value",
      "recommended_path",
    ],
    bannedTerms: [...CLIENT_FACING_BANNED],
  },
];

// ── Lookup helpers ────────────────────────────────────────────────────────────

const profileMap = new Map<string, SourceArtifactProfile>(
  PROFILES.map((p) => [p.id, p]),
);

export function getSourceArtifactProfile(
  artifactCode: string,
): SourceArtifactProfile | null {
  return profileMap.get(artifactCode) ?? null;
}

export function getAllSourceArtifactProfiles(): SourceArtifactProfile[] {
  return PROFILES;
}

export function getClientFacingProfiles(): SourceArtifactProfile[] {
  return PROFILES.filter((p) => p.clientFacing);
}

export function getProfilesByAudience(
  audience: ArtifactAudience,
): SourceArtifactProfile[] {
  return PROFILES.filter((p) =>
    Array.isArray(p.audience)
      ? p.audience.includes(audience)
      : p.audience === audience,
  );
}
