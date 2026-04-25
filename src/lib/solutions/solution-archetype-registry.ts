// SOL3 · Solution Archetype Registry.
//
// Pure deterministic library naming the canonical solution archetypes
// AbarVa supports across sectors. An *archetype* is a named, recurring
// shape of an AI-led transformation engagement — not a stock template
// and not a per-tenant solution. Each archetype anchors what AbarVa
// must learn (current-state inputs), what we should produce
// (deliverables, components, building blocks), what governance we
// must wrap, and what value we expect to harvest.
//
// This module is a *library*. It does NOT compose live architectures
// per tenant, invoke models, or read tenant state. Recommendations
// are pure substring/key union match on the input.
//
// No live runtime, no Claude / OpenAI invocation, no Date.now reads,
// no random IDs, no Supabase reads, no migrations.
//
// This module does NOT import:
//   - src/lib/sentinel/**, src/lib/atlas/**, src/lib/nexus/**
//   - src/lib/agent/**, src/components/agent/**
//   - src/lib/source/**, src/app/(maestro)/source/**
//   - src/app/programs/**, src/app/(maestro)/preview/**, src/app/demo/**
//   - src/lib/programs/mock.ts
//   - src/lib/auth/**
//   - supabase/**

// ---------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------

export type SolutionArchetypeKey =
  | 'ai_led_pdlc_transformation'
  | 'analytics_modernization'
  | 'healthcare_ambient_clinical_value_chain'
  | 'hcc_risk_adjustment_coding_accuracy'
  | 'prior_authorization_utilization_management'
  | 'kyc_customer_onboarding_ai'
  | 'predictive_maintenance_modernization'
  | 'build_buy_partner_evaluation'
  | 'service_operations_agentic_automation'
  | 'ai_governance_operating_model'
  | 'contact_center_ai_transformation'
  | 'finance_fpna_ai_automation';

export interface SolutionArchetypeAgentRoles {
  nexus: string;
  sentinel: string;
  atlas: string;
  steward: string;
}

export interface SolutionArchetype {
  key: SolutionArchetypeKey;
  name: string;
  sector: string;
  capabilityFamily: string;
  problemStatement: string;
  businessOutcomes: ReadonlyArray<string>;
  currentStateInputsRequired: ReadonlyArray<string>;
  patternsUsed: ReadonlyArray<string>;
  failureModesAddressed: ReadonlyArray<string>;
  solutionComponents: ReadonlyArray<string>;
  architectureBuildingBlocks: ReadonlyArray<string>;
  workshopsRequired: ReadonlyArray<string>;
  smesRequired: ReadonlyArray<string>;
  buildBuyPartnerConsiderations: ReadonlyArray<string>;
  governanceRiskConsiderations: ReadonlyArray<string>;
  deliverablesGenerated: ReadonlyArray<string>;
  valueMetrics: ReadonlyArray<string>;
  agentRoles: SolutionArchetypeAgentRoles;
  recommendedFirstWorkshop: string;
  createdFrom: 'deterministic_solution_archetype_registry';
}

export interface SolutionArchetypeSummary {
  totalCount: number;
  sectors: ReadonlyArray<string>;
  uniqueWorkshops: ReadonlyArray<string>;
  uniqueArchitectureBlocks: ReadonlyArray<string>;
}

// ---------------------------------------------------------------------
// Canonical key order
// ---------------------------------------------------------------------

const ARCHETYPE_KEYS_IN_ORDER: ReadonlyArray<SolutionArchetypeKey> = [
  'ai_led_pdlc_transformation',
  'analytics_modernization',
  'healthcare_ambient_clinical_value_chain',
  'hcc_risk_adjustment_coding_accuracy',
  'prior_authorization_utilization_management',
  'kyc_customer_onboarding_ai',
  'predictive_maintenance_modernization',
  'build_buy_partner_evaluation',
  'service_operations_agentic_automation',
  'ai_governance_operating_model',
  'contact_center_ai_transformation',
  'finance_fpna_ai_automation',
];

// ---------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------

const REGISTRY: Record<SolutionArchetypeKey, SolutionArchetype> = {
  ai_led_pdlc_transformation: {
    key: 'ai_led_pdlc_transformation',
    name: 'AI-led product development lifecycle transformation',
    sector: 'cross_sector',
    capabilityFamily: 'engineering_pdlc',
    problemStatement:
      'Engineering organizations adopt AI assistants ad hoc; suggestions drift from house conventions, review burden grows, defects rise, and value is impossible to defend to executive sponsors.',
    businessOutcomes: [
      'Lead time for changes (DORA) improves measurably against a captured baseline',
      'Change-failure rate (DORA) holds or improves at higher deploy frequency',
      'AI adoption is tied to evidence of velocity, quality, or cost outcomes in a value ledger',
      'Reviewer fatigue declines as AI handles convention-level findings',
    ],
    currentStateInputsRequired: [
      'Current DORA telemetry posture per service or value stream',
      'Inventory of AI assistants in use, with seat counts and active-user mix',
      'Engineering handbook, ADR, and style-guide inventory and named owners',
      'Repository topology, ownership map, and protected-branch policy',
    ],
    patternsUsed: [
      'value_ledger_incompleteness',
      'evidence_chain_gap',
      'gate_governance_gap',
      'program_context_sparsity',
    ],
    failureModesAddressed: [
      'no_value_ledger',
      'no_measurable_baseline',
      'missing_governance_risk',
      'unclear_human_in_loop_surface',
    ],
    solutionComponents: [
      'context_as_code_foundation',
      'ai_code_review',
      'dora_telemetry_layer',
      'ai_adoption_measurement',
      'human_in_loop_approval',
      'value_ledger_for_pdlc',
    ],
    architectureBuildingBlocks: [
      'Versioned context layer (CLAUDE.md / AGENTS.md / ADRs) consumed by AI assistants',
      'DORA telemetry pipeline producing the four canonical metrics per service',
      'Adoption telemetry capturing assistant active use, acceptance, and convention drift',
      'Human-in-loop approval surface for regulated changes',
      'Value ledger binding outcomes to assistant adoption and convention adherence',
    ],
    workshopsRequired: [
      'current_state_discovery',
      'data_foundation_assessment',
      'architecture_solution_design',
      'governance_risk_review',
      'value_framing',
    ],
    smesRequired: [
      'Head of engineering or platform engineering lead',
      'DevEx / developer productivity owner',
      'Security / appsec representative',
      'Engineering finance partner for value framing',
    ],
    buildBuyPartnerConsiderations: [
      'Assistant tooling choice (Claude Code / Copilot / Cursor) is portable; the context layer and telemetry are the lock-in, not the assistant',
      'Buy DORA telemetry from an existing observability vendor where one is already trusted; build only the adoption-telemetry shim',
      'Partner with platform engineering on context-as-code rollout to avoid bypassing existing repo governance',
    ],
    governanceRiskConsiderations: [
      'Named owner per context document with quarterly review cadence',
      'Human-in-loop approval required for AI-authored changes to regulated paths',
      'Audit trail of assistant suggestion, acceptance, and reviewer override is retained for governance review',
    ],
    deliverablesGenerated: [
      'AI-led PDLC current-state assessment with DORA baseline',
      'Context-as-code rollout plan with named owners and review cadence',
      'AI assistant adoption and value-ledger readout for the executive sponsor',
    ],
    valueMetrics: [
      'Lead time for changes (DORA)',
      'Change-failure rate (DORA)',
      'Convention-drift defect ratio',
      'Reviewer override rate on AI-authored changes',
    ],
    agentRoles: {
      nexus: 'Composes the engagement architecture and sequences the PDLC component rollout',
      sentinel: 'Detects value-ledger and evidence-chain gaps across the engineering portfolio',
      atlas: 'Surfaces engineering pressure cards and DORA outliers to the executive sponsor',
      steward: 'Enforces governance gates on context ownership, human-in-loop, and audit retention',
    },
    recommendedFirstWorkshop: 'current_state_discovery',
    createdFrom: 'deterministic_solution_archetype_registry',
  },

  analytics_modernization: {
    key: 'analytics_modernization',
    name: 'Analytics modernization with governed semantic layer',
    sector: 'cross_sector',
    capabilityFamily: 'data_and_analytics',
    problemStatement:
      'Reporting is fragmented across legacy warehouses and tactical dashboards; the data foundation is unevenly governed, definitions drift, and AI / analytics initiatives stall on inconsistent metrics.',
    businessOutcomes: [
      'A governed data foundation with named owners replaces ad hoc warehouse sprawl',
      'A canonical semantic layer publishes business metrics with single-source definitions',
      'Time-to-insight on executive questions drops measurably against the captured baseline',
      'AI / ML use cases reuse the same semantic layer instead of re-deriving metrics',
    ],
    currentStateInputsRequired: [
      'Inventory of warehouses, lakes, marts, and reverse-ETL paths',
      'Catalog of business-critical metrics with owners and definitions',
      'Data foundation governance posture: stewardship, quality, lineage, access',
      'Top ten executive questions the analytics estate must answer',
    ],
    patternsUsed: [
      'evidence_chain_gap',
      'program_context_sparsity',
      'gate_governance_gap',
    ],
    failureModesAddressed: [
      'weak_data_foundation',
      'no_measurable_baseline',
      'missing_governance_risk',
    ],
    solutionComponents: [
      'governed_data_foundation_blueprint',
      'semantic_layer_metric_catalog',
      'data_quality_and_lineage_controls',
      'analytics_value_ledger',
    ],
    architectureBuildingBlocks: [
      'Governed data foundation (lakehouse or warehouse) with named domain owners',
      'Semantic layer publishing canonical metrics with versioned definitions',
      'Data quality, lineage, and access governance pipeline',
      'BI / consumption layer bound to the semantic layer rather than raw tables',
    ],
    workshopsRequired: [
      'current_state_discovery',
      'data_foundation_assessment',
      'architecture_solution_design',
      'governance_risk_review',
    ],
    smesRequired: [
      'Chief data officer or head of data',
      'Domain data steward for each priority business domain',
      'Analytics engineering lead',
      'BI / reporting platform owner',
    ],
    buildBuyPartnerConsiderations: [
      'Buy the data foundation platform (lakehouse / warehouse) where a strategic vendor is already in place',
      'Build the semantic layer in code with version control rather than locking into a single BI vendor',
      'Partner with the BI platform owner on consumption-side governance to avoid shadow metrics',
    ],
    governanceRiskConsiderations: [
      'Every published metric in the semantic layer carries a named steward and definition history',
      'Data foundation access is policy-governed with audit trail per query class',
      'Quality and lineage SLOs are reviewed at the same cadence as availability SLOs',
    ],
    deliverablesGenerated: [
      'Analytics modernization current-state and target-state architecture',
      'Semantic layer metric catalog with stewards and definitions',
      'Data foundation governance plan and rollout sequence',
    ],
    valueMetrics: [
      'Time-to-insight on the top ten executive questions',
      'Number of metrics published through the governed semantic layer',
      'Share of dashboards bound to the semantic layer rather than raw tables',
      'Data quality incident rate against the captured baseline',
    ],
    agentRoles: {
      nexus: 'Composes the analytics target-state architecture from current-state evidence',
      sentinel: 'Detects metric-definition drift and data foundation governance gaps',
      atlas: 'Surfaces analytics readiness pressure cards to the data executive sponsor',
      steward: 'Enforces metric stewardship, lineage SLO, and access governance gates',
    },
    recommendedFirstWorkshop: 'data_foundation_assessment',
    createdFrom: 'deterministic_solution_archetype_registry',
  },

  healthcare_ambient_clinical_value_chain: {
    key: 'healthcare_ambient_clinical_value_chain',
    name: 'Ambient clinical documentation value chain',
    sector: 'healthcare_payer_provider',
    capabilityFamily: 'clinical_workflow',
    problemStatement:
      'Clinicians spend disproportionate time on documentation; ambient scribe pilots improve note quality but stall when integration with the clinical workflow, governance, and value capture is incomplete.',
    businessOutcomes: [
      'Clinician documentation burden falls measurably against the captured baseline',
      'Note quality and completeness improve under named clinical governance review',
      'Ambient scribe output flows into the EHR clinical workflow without rework',
      'Value capture (HCC, quality measures, billing accuracy) improves against pre-rollout cohort',
    ],
    currentStateInputsRequired: [
      'Clinician documentation time per encounter today, with specialty mix',
      'Current ambient scribe pilots, vendors, and integration posture with the EHR',
      'Clinical governance committee membership and documentation policy ownership',
      'Top documentation defect classes and rework drivers',
    ],
    patternsUsed: [
      'evidence_chain_gap',
      'gate_governance_gap',
      'program_context_sparsity',
    ],
    failureModesAddressed: [
      'missing_governance_risk',
      'no_value_ledger',
      'no_measurable_baseline',
    ],
    solutionComponents: [
      'ambient_scribe_clinical_workflow_integration',
      'clinical_documentation_quality_controls',
      'phi_governance_and_audit_trail',
      'ambient_scribe_value_ledger',
    ],
    architectureBuildingBlocks: [
      'Ambient capture device and scribe service with PHI handling controls',
      'EHR integration path that lands the note in the clinical workflow under review',
      'Clinical documentation quality scoring and named-clinician review loop',
      'Governance and audit layer covering PHI, consent, and clinician sign-off',
      'Value ledger binding documentation outcomes to the clinical and revenue cycle',
    ],
    workshopsRequired: [
      'current_state_discovery',
      'governance_risk_review',
      'architecture_solution_design',
      'value_framing',
    ],
    smesRequired: [
      'Chief medical information officer or clinical informatics lead',
      'Clinical documentation specialist / coder representative',
      'Privacy / HIPAA officer',
      'EHR integration architect',
    ],
    buildBuyPartnerConsiderations: [
      'Ambient scribe vendor selection covers PHI controls, EHR integration depth, and clinician-review evidence',
      'Build the value ledger and governance overlay in-house; do not let the scribe vendor own value attribution',
      'Partner with the EHR vendor to keep the clinical workflow integration on a supported path',
    ],
    governanceRiskConsiderations: [
      'PHI handling and clinical workflow integration cleared by the privacy officer before rollout',
      'Clinical governance committee approves documentation policy and review cadence',
      'Audit trail of scribe output, clinician edits, and sign-off is retained for governance review',
    ],
    deliverablesGenerated: [
      'Ambient clinical documentation current-state and target-state architecture',
      'Clinical governance and PHI-handling readout',
      'Ambient scribe value ledger and rollout sequence',
    ],
    valueMetrics: [
      'Documentation time per encounter against baseline',
      'Note completeness and quality score against the captured baseline',
      'Clinician edit rate on scribe output',
      'Coding capture and billing accuracy uplift against pre-rollout cohort',
    ],
    agentRoles: {
      nexus: 'Composes the ambient clinical value-chain architecture per service line',
      sentinel: 'Detects clinical workflow integration gaps and governance evidence chain breaks',
      atlas: 'Surfaces clinician burden and documentation outcome pressure cards',
      steward: 'Enforces PHI, consent, and clinical sign-off governance gates',
    },
    recommendedFirstWorkshop: 'governance_risk_review',
    createdFrom: 'deterministic_solution_archetype_registry',
  },

  hcc_risk_adjustment_coding_accuracy: {
    key: 'hcc_risk_adjustment_coding_accuracy',
    name: 'HCC risk-adjustment coding accuracy',
    sector: 'healthcare_payer_provider',
    capabilityFamily: 'risk_adjustment',
    problemStatement:
      'HCC risk-adjustment coding leans on retrospective chart review; AI-assisted coding pilots improve recall but stall on clinical workflow integration, coder governance, and audit-defensible evidence chains.',
    businessOutcomes: [
      'HCC capture rate improves against the captured baseline cohort',
      'Coder productivity improves while coder accuracy holds or improves',
      'Audit-defensible evidence chain accompanies every AI-suggested code',
      'RADV / regulatory exposure declines as governance review evidence improves',
    ],
    currentStateInputsRequired: [
      'Current HCC capture rate and chart-review backlog by service line',
      'Coder team composition, productivity baseline, and quality scoring',
      'Existing AI-assisted coding pilots and integration posture with the clinical workflow',
      'Audit and governance posture for AI-suggested codes (evidence retention, reviewer sign-off)',
    ],
    patternsUsed: [
      'evidence_chain_gap',
      'gate_governance_gap',
      'value_ledger_incompleteness',
    ],
    failureModesAddressed: [
      'missing_governance_risk',
      'no_measurable_baseline',
      'no_value_ledger',
    ],
    solutionComponents: [
      'ai_assisted_hcc_coding_workflow',
      'coder_review_governance_loop',
      'audit_defensible_evidence_chain',
      'risk_adjustment_value_ledger',
    ],
    architectureBuildingBlocks: [
      'AI-assisted coding service that proposes HCCs with linked clinical evidence',
      'Coder workflow integration that surfaces AI suggestions inside the existing tool',
      'Clinical workflow handoff for ambiguous suggestions requiring clinician confirmation',
      'Audit-defensible evidence chain bound to source chart citations',
      'Governance and quality review loop with named coder and clinician owners',
    ],
    workshopsRequired: [
      'current_state_discovery',
      'governance_risk_review',
      'architecture_solution_design',
      'value_framing',
    ],
    smesRequired: [
      'HCC coding leadership / coding compliance officer',
      'Clinical informatics representative for clinical workflow integration',
      'Risk-adjustment finance partner',
      'Audit / regulatory compliance lead',
    ],
    buildBuyPartnerConsiderations: [
      'AI coding vendor selection covers RADV defensibility, evidence-chain quality, and coder workflow integration',
      'Build the governance review loop and value ledger in-house; do not let the vendor own audit posture',
      'Partner with the clinical informatics team so AI suggestions land in the existing coder workflow without parallel tools',
    ],
    governanceRiskConsiderations: [
      'Every AI-suggested HCC carries a named coder reviewer and audit-retained evidence chain',
      'Clinical governance approves the clinical-confirmation path for ambiguous suggestions',
      'Quality and audit review cadence is contracted with named owners and SLO targets',
    ],
    deliverablesGenerated: [
      'HCC risk-adjustment current-state and target-state architecture',
      'Coder governance loop and audit evidence-chain readout',
      'Risk-adjustment value ledger and rollout sequence',
    ],
    valueMetrics: [
      'HCC capture rate against the captured baseline cohort',
      'Coder productivity (charts per coder per day) without quality regression',
      'Coder override rate on AI suggestions',
      'Audit defensibility score on a sampled cohort of AI-suggested codes',
    ],
    agentRoles: {
      nexus: 'Composes the risk-adjustment architecture and sequences coder workflow integration',
      sentinel: 'Detects evidence-chain gaps and governance breaks across coding operations',
      atlas: 'Surfaces capture-rate and audit-defensibility pressure cards to leadership',
      steward: 'Enforces coder review, clinical sign-off, and audit retention governance gates',
    },
    recommendedFirstWorkshop: 'governance_risk_review',
    createdFrom: 'deterministic_solution_archetype_registry',
  },

  prior_authorization_utilization_management: {
    key: 'prior_authorization_utilization_management',
    name: 'Prior authorization and utilization management modernization',
    sector: 'healthcare_payer_provider',
    capabilityFamily: 'clinical_workflow',
    problemStatement:
      'Prior authorization adds clinical workflow friction, member abrasion, and provider abrasion; AI-assisted decisioning pilots improve cycle time but stall on clinical governance, evidence chain, and regulatory defensibility.',
    businessOutcomes: [
      'Median prior authorization cycle time falls measurably against the captured baseline',
      'Auto-approval rate on low-risk requests rises under named clinical governance',
      'Provider and member abrasion declines on tracked friction metrics',
      'Regulatory defensibility on denials improves with audit-retained evidence',
    ],
    currentStateInputsRequired: [
      'Current prior authorization volume, cycle time, and approval distribution by service line',
      'Clinical guideline corpus and decision-rule ownership',
      'Existing AI-assisted decisioning pilots and clinical workflow integration posture',
      'Regulatory posture and member / provider escalation history',
    ],
    patternsUsed: [
      'evidence_chain_gap',
      'gate_governance_gap',
      'program_context_sparsity',
    ],
    failureModesAddressed: [
      'missing_governance_risk',
      'unclear_human_in_loop_surface',
      'no_measurable_baseline',
    ],
    solutionComponents: [
      'ai_assisted_prior_auth_decisioning',
      'clinical_guideline_evidence_chain',
      'human_in_loop_clinical_review',
      'pa_um_value_ledger',
    ],
    architectureBuildingBlocks: [
      'AI decisioning service grounded in named clinical guidelines',
      'Clinical workflow integration that surfaces AI recommendations inside the UM nurse / clinician tool',
      'Human-in-loop clinical review loop for non-auto-approval and denial paths',
      'Audit-defensible evidence chain bound to clinical guideline citations',
      'Provider / member communication path with auditable rationale',
    ],
    workshopsRequired: [
      'current_state_discovery',
      'governance_risk_review',
      'architecture_solution_design',
      'value_framing',
    ],
    smesRequired: [
      'Utilization management medical director',
      'UM nurse / clinical reviewer representative',
      'Regulatory / compliance officer',
      'Provider relations / network leader',
    ],
    buildBuyPartnerConsiderations: [
      'AI decisioning vendor selection covers clinical guideline coverage, evidence-chain quality, and EHR integration depth',
      'Build the clinical review loop and value ledger in-house; do not let the vendor own clinical governance posture',
      'Partner with regulatory counsel on the denial-rationale audit path before rollout',
    ],
    governanceRiskConsiderations: [
      'Every AI auto-approval is reviewable on demand with the linked clinical guideline citation',
      'Denials follow a human-in-loop clinical review path with named medical director sign-off',
      'Audit retention covers AI recommendation, clinician decision, and member communication for the regulatory window',
    ],
    deliverablesGenerated: [
      'Prior authorization current-state and target-state architecture',
      'Clinical governance and human-in-loop review readout',
      'Utilization management value ledger and rollout sequence',
    ],
    valueMetrics: [
      'Median prior authorization cycle time against baseline',
      'Auto-approval rate on low-risk requests under clinical governance',
      'Clinician override rate on AI recommendations',
      'Provider and member abrasion score against the captured baseline',
    ],
    agentRoles: {
      nexus: 'Composes the prior-authorization clinical workflow and decisioning architecture',
      sentinel: 'Detects evidence-chain gaps and governance breaks across UM operations',
      atlas: 'Surfaces cycle-time and abrasion pressure cards to UM leadership',
      steward: 'Enforces human-in-loop, audit retention, and regulatory governance gates',
    },
    recommendedFirstWorkshop: 'governance_risk_review',
    createdFrom: 'deterministic_solution_archetype_registry',
  },

  kyc_customer_onboarding_ai: {
    key: 'kyc_customer_onboarding_ai',
    name: 'KYC and customer onboarding AI uplift',
    sector: 'banking',
    capabilityFamily: 'governance_and_risk',
    problemStatement:
      'Customer onboarding and KYC operations carry high manual review load; AI uplift pilots improve throughput but stall on regulatory defensibility, governance ownership, and evidence chain.',
    businessOutcomes: [
      'Median onboarding cycle time falls measurably against the captured baseline',
      'Reviewer auto-clear rate on low-risk applicants rises under named governance',
      'False-negative leakage on high-risk applicants holds or improves',
      'Regulatory defensibility on adverse decisions improves with audit-retained evidence',
    ],
    currentStateInputsRequired: [
      'Current onboarding volume, cycle time, and reviewer disposition by segment',
      'KYC policy corpus, watchlists, and regulatory obligation map',
      'Existing AI screening pilots, vendors, and case-management integration posture',
      'Regulatory posture and adverse-decision audit history',
    ],
    patternsUsed: [
      'evidence_chain_gap',
      'gate_governance_gap',
      'value_ledger_incompleteness',
    ],
    failureModesAddressed: [
      'missing_governance_risk',
      'unclear_human_in_loop_surface',
      'no_measurable_baseline',
    ],
    solutionComponents: [
      'ai_screening_workflow',
      'kyc_evidence_chain',
      'human_in_loop_reviewer_console',
      'onboarding_value_ledger',
    ],
    architectureBuildingBlocks: [
      'AI screening service grounded in the KYC policy corpus and named watchlists',
      'Reviewer console integration that surfaces AI suggestions with citations',
      'Human-in-loop review loop for adverse-decision and high-risk paths',
      'Audit-defensible evidence chain retained for the regulatory window',
      'Regulatory communication path with auditable rationale',
    ],
    workshopsRequired: [
      'current_state_discovery',
      'governance_risk_review',
      'architecture_solution_design',
      'value_framing',
    ],
    smesRequired: [
      'Chief compliance officer or KYC policy owner',
      'Reviewer / case-management operations leader',
      'Regulatory / financial-crime advisor',
      'Onboarding product owner',
    ],
    buildBuyPartnerConsiderations: [
      'AI screening vendor selection covers policy coverage, regulator-grade evidence, and case-management integration',
      'Build the reviewer console overlay and value ledger in-house; do not let the vendor own governance posture',
      'Partner with regulatory counsel on adverse-decision rationale before rollout',
    ],
    governanceRiskConsiderations: [
      'Every AI auto-clear is reviewable on demand with the linked policy citation',
      'Adverse decisions follow a human-in-loop reviewer path with named compliance sign-off',
      'Audit retention covers AI recommendation, reviewer decision, and applicant communication for the regulatory window',
    ],
    deliverablesGenerated: [
      'KYC and onboarding current-state and target-state architecture',
      'Compliance governance and human-in-loop reviewer readout',
      'Onboarding value ledger and rollout sequence',
    ],
    valueMetrics: [
      'Median onboarding cycle time against baseline',
      'Reviewer auto-clear rate on low-risk applicants under governance',
      'Reviewer override rate on AI recommendations',
      'False-negative leakage rate on high-risk applicants',
    ],
    agentRoles: {
      nexus: 'Composes the KYC and onboarding architecture and reviewer workflow',
      sentinel: 'Detects evidence-chain gaps and governance breaks across onboarding operations',
      atlas: 'Surfaces cycle-time and risk-leakage pressure cards to the compliance executive',
      steward: 'Enforces human-in-loop, audit retention, and regulatory governance gates',
    },
    recommendedFirstWorkshop: 'governance_risk_review',
    createdFrom: 'deterministic_solution_archetype_registry',
  },

  predictive_maintenance_modernization: {
    key: 'predictive_maintenance_modernization',
    name: 'Predictive maintenance modernization',
    sector: 'industrial',
    capabilityFamily: 'operations_automation',
    problemStatement:
      'Asset-heavy operations rely on calendar-based maintenance and reactive callouts; predictive maintenance pilots stall on data foundation gaps, integration with the work-order system, and measurable value capture.',
    businessOutcomes: [
      'Unplanned downtime hours fall measurably against the captured baseline',
      'Mean time between failures improves on instrumented asset classes',
      'Maintenance cost per asset class declines against pre-rollout cohort',
      'Field operations adoption holds at the agreed cadence under named ownership',
    ],
    currentStateInputsRequired: [
      'Asset register with criticality, sensor coverage, and current maintenance regime',
      'Historical work-order, failure-mode, and downtime telemetry',
      'CMMS / ERP integration posture for work orders and parts',
      'Field operations team composition and current adoption posture for predictive workflows',
    ],
    patternsUsed: [
      'evidence_chain_gap',
      'value_ledger_incompleteness',
      'program_context_sparsity',
    ],
    failureModesAddressed: [
      'weak_data_foundation',
      'no_measurable_baseline',
      'no_value_ledger',
    ],
    solutionComponents: [
      'asset_telemetry_data_foundation',
      'predictive_failure_model_service',
      'work_order_integration_layer',
      'predictive_maintenance_value_ledger',
    ],
    architectureBuildingBlocks: [
      'Asset telemetry data foundation with sensor onboarding and quality controls',
      'Predictive failure model service grounded in the failure-mode catalog',
      'Work-order integration with the CMMS / ERP system',
      'Field operations console that surfaces predicted-failure work orders',
      'Value ledger binding downtime and maintenance cost to predicted-failure adoption',
    ],
    workshopsRequired: [
      'current_state_discovery',
      'data_foundation_assessment',
      'architecture_solution_design',
      'value_framing',
    ],
    smesRequired: [
      'VP of operations or plant manager for the priority asset class',
      'Reliability / maintenance engineering lead',
      'CMMS / ERP integration architect',
      'Field operations workforce representative',
    ],
    buildBuyPartnerConsiderations: [
      'Buy the predictive model platform from a strategic OT vendor where one is already in place; build only the failure-mode overlay',
      'Partner with the CMMS / ERP vendor on supported integration paths to avoid shadow work-order systems',
      'Build the value ledger in-house so downtime attribution is not owned by the model vendor',
    ],
    governanceRiskConsiderations: [
      'Predicted-failure work orders follow a named reliability-engineering review for high-criticality assets',
      'Sensor and telemetry quality SLOs are reviewed at the same cadence as availability SLOs',
      'Audit trail of model output, work-order disposition, and field outcome is retained for governance review',
    ],
    deliverablesGenerated: [
      'Predictive maintenance current-state and target-state architecture',
      'Asset data foundation and integration plan',
      'Predictive maintenance value ledger and rollout sequence',
    ],
    valueMetrics: [
      'Unplanned downtime hours against the captured baseline',
      'Mean time between failures on instrumented asset classes',
      'Maintenance cost per asset class against pre-rollout cohort',
      'Predicted-failure work-order acceptance rate by field operations',
    ],
    agentRoles: {
      nexus: 'Composes the predictive maintenance target-state architecture per asset class',
      sentinel: 'Detects data foundation gaps and value-ledger breaks across the asset estate',
      atlas: 'Surfaces downtime and maintenance-cost pressure cards to the operations executive',
      steward: 'Enforces telemetry SLO, reliability review, and audit retention governance gates',
    },
    recommendedFirstWorkshop: 'data_foundation_assessment',
    createdFrom: 'deterministic_solution_archetype_registry',
  },

  build_buy_partner_evaluation: {
    key: 'build_buy_partner_evaluation',
    name: 'Build vs buy vs partner evaluation',
    sector: 'cross_sector',
    capabilityFamily: 'governance_and_risk',
    problemStatement:
      'Capability investment decisions land without a defensible build vs buy vs partner posture; vendor and startup assessment is ad hoc and partner alignment drifts over time.',
    businessOutcomes: [
      'A documented build vs buy vs partner posture per priority capability',
      'Vendor and startup assessment evidence is captured per option with named reviewers',
      'Partner alignment is governed with named owners and a review cadence',
      'Investment decisions reach the steering committee with audit-retained rationale',
    ],
    currentStateInputsRequired: [
      'Capability inventory with current ownership and adoption posture',
      'Existing vendor and partner contracts, with named relationship owners',
      'Strategic direction and constraints from the executive sponsor',
      'Risk appetite and regulatory constraints relevant to each capability',
    ],
    patternsUsed: [
      'gate_governance_gap',
      'program_context_sparsity',
      'evidence_chain_gap',
    ],
    failureModesAddressed: [
      'missing_governance_risk',
      'no_measurable_baseline',
      'unclear_human_in_loop_surface',
    ],
    solutionComponents: [
      'capability_inventory_baseline',
      'vendor_and_startup_assessment_framework',
      'partner_alignment_governance_loop',
      'investment_decision_evidence_chain',
    ],
    architectureBuildingBlocks: [
      'Capability inventory baseline with current ownership and posture',
      'Vendor and startup assessment scorecard grounded in named criteria',
      'Partner alignment governance loop with named owners and review cadence',
      'Investment decision evidence chain bound to the steering-committee record',
      'Honest-fallback narrative when assessment evidence is incomplete',
    ],
    workshopsRequired: [
      'current_state_discovery',
      'architecture_solution_design',
      'governance_risk_review',
      'executive_decision_review',
    ],
    smesRequired: [
      'Strategy / corporate development representative',
      'Procurement / vendor management leader',
      'Architecture lead for the capability under review',
      'Risk and compliance representative',
    ],
    buildBuyPartnerConsiderations: [
      'Vendor assessment covers product fit, integration depth, regulatory posture, and total cost over the contracted horizon',
      'Startup assessment covers traction evidence, governance posture, and concentration risk before partnering',
      'Build option carries a named architecture owner, staffing plan, and exit-path narrative',
    ],
    governanceRiskConsiderations: [
      'Every shortlisted option carries a named reviewer and audit-retained assessment evidence',
      'Partner alignment is reviewed at a contracted cadence with named owners on both sides',
      'Investment decisions are recorded with rationale and dissent for the steering-committee audit trail',
    ],
    deliverablesGenerated: [
      'Build vs buy vs partner readout per priority capability',
      'Vendor and startup assessment scorecard with reviewer evidence',
      'Investment decision evidence chain bound to the steering-committee record',
    ],
    valueMetrics: [
      'Share of priority capabilities with a documented build vs buy vs partner posture',
      'Vendor and startup assessment cycle time against baseline',
      'Partner alignment review cadence adherence',
      'Investment decisions reaching the steering committee with audit-retained rationale',
    ],
    agentRoles: {
      nexus: 'Composes the build vs buy vs partner architecture per capability',
      sentinel: 'Detects governance gaps and evidence-chain breaks across the assessment portfolio',
      atlas: 'Surfaces capability-coverage and partner-alignment pressure cards to leadership',
      steward: 'Enforces named-reviewer, audit-retention, and steering-committee governance gates',
    },
    recommendedFirstWorkshop: 'architecture_solution_design',
    createdFrom: 'deterministic_solution_archetype_registry',
  },

  service_operations_agentic_automation: {
    key: 'service_operations_agentic_automation',
    name: 'Service operations agentic automation',
    sector: 'shared_services',
    capabilityFamily: 'operations_automation',
    problemStatement:
      'IT and shared-services operations carry high case volume, repetitive triage, and uneven knowledge reuse; agentic automation pilots stall on integration depth, governance, and value defensibility.',
    businessOutcomes: [
      'Median case cycle time falls measurably against the captured baseline',
      'Auto-resolution rate rises on tracked low-risk request classes',
      'Agent and analyst productivity rises while quality holds or improves',
      'Knowledge reuse rises as agentic capture feeds the knowledge base under governance',
    ],
    currentStateInputsRequired: [
      'Case volume, cycle time, and disposition mix by request class',
      'Existing automation footprint and integration posture with the ITSM platform',
      'Knowledge base coverage, ownership, and freshness posture',
      'Regulatory and security constraints relevant to automated actions',
    ],
    patternsUsed: [
      'evidence_chain_gap',
      'gate_governance_gap',
      'program_context_sparsity',
    ],
    failureModesAddressed: [
      'missing_governance_risk',
      'unclear_human_in_loop_surface',
      'no_measurable_baseline',
    ],
    solutionComponents: [
      'agentic_triage_service',
      'itsm_integration_layer',
      'human_in_loop_analyst_console',
      'service_operations_value_ledger',
    ],
    architectureBuildingBlocks: [
      'Agentic triage service grounded in the knowledge base and policy corpus',
      'ITSM integration layer landing agentic actions on supported endpoints',
      'Analyst console that surfaces agentic recommendations with citations',
      'Human-in-loop review path for high-risk or out-of-policy actions',
      'Value ledger binding case outcomes to agentic adoption and knowledge reuse',
    ],
    workshopsRequired: [
      'current_state_discovery',
      'architecture_solution_design',
      'governance_risk_review',
      'value_framing',
    ],
    smesRequired: [
      'Service operations leader / VP of shared services',
      'ITSM platform owner',
      'Knowledge management lead',
      'Security / IT risk representative',
    ],
    buildBuyPartnerConsiderations: [
      'Buy the agentic platform where the ITSM vendor offers a supported path; build only the policy and human-in-loop overlay',
      'Partner with knowledge management on the knowledge-base feedback loop to avoid shadow knowledge silos',
      'Vendor selection covers regulator-grade audit posture and integration depth',
    ],
    governanceRiskConsiderations: [
      'High-risk and out-of-policy actions follow a named human-in-loop review with audit retention',
      'Knowledge base contributions from agentic capture follow a named-owner review before publication',
      'Audit trail of agentic recommendation, analyst decision, and customer communication is retained for governance review',
    ],
    deliverablesGenerated: [
      'Service operations current-state and target-state architecture',
      'Agentic governance and human-in-loop readout',
      'Service operations value ledger and rollout sequence',
    ],
    valueMetrics: [
      'Median case cycle time against the captured baseline',
      'Auto-resolution rate on tracked low-risk request classes',
      'Analyst override rate on agentic recommendations',
      'Knowledge base freshness and reuse rate against baseline',
    ],
    agentRoles: {
      nexus: 'Composes the service operations agentic architecture and analyst workflow',
      sentinel: 'Detects evidence-chain gaps and governance breaks across operations',
      atlas: 'Surfaces cycle-time and quality pressure cards to the operations executive',
      steward: 'Enforces human-in-loop, audit retention, and policy governance gates',
    },
    recommendedFirstWorkshop: 'current_state_discovery',
    createdFrom: 'deterministic_solution_archetype_registry',
  },

  ai_governance_operating_model: {
    key: 'ai_governance_operating_model',
    name: 'AI governance operating model',
    sector: 'cross_sector',
    capabilityFamily: 'governance_and_risk',
    problemStatement:
      'Multiple AI initiatives ship without a shared governance operating model; gates, evidence retention, and value capture drift across programs and the enterprise carries an indefensible AI posture.',
    businessOutcomes: [
      'A documented AI governance operating model with named owners is adopted across programs',
      'Hard gates G1..G4 are enforced uniformly on AI-bearing programs',
      'Evidence retention and audit posture is uniform across the AI program portfolio',
      'Value capture is consistent and defensible to the steering committee and external regulators',
    ],
    currentStateInputsRequired: [
      'Inventory of AI programs across the enterprise with named program owners',
      'Current governance, risk, and compliance committee membership and cadence',
      'Existing AI policies, principles, and prior governance artifacts',
      'Regulatory posture relevant to each program class',
    ],
    patternsUsed: [
      'gate_governance_gap',
      'evidence_chain_gap',
      'value_ledger_incompleteness',
      'ai_governance_operating_model_gap',
    ],
    failureModesAddressed: [
      'missing_governance_risk',
      'unclear_human_in_loop_surface',
      'no_value_ledger',
    ],
    solutionComponents: [
      'ai_governance_committee_charter',
      'gate_g1_g4_evaluator_blueprint',
      'evidence_retention_audit_chain',
      'enterprise_value_ledger',
    ],
    architectureBuildingBlocks: [
      'AI governance committee charter with named owners and cadence',
      'Hard gate G1..G4 evaluator blueprint applied across the AI program portfolio',
      'Evidence retention and audit chain shared across programs',
      'Enterprise value ledger consolidating value capture per program',
      'Honest-fallback narrative when governance inputs are incomplete',
    ],
    workshopsRequired: [
      'current_state_discovery',
      'governance_risk_review',
      'operating_model_alignment',
      'executive_decision_review',
    ],
    smesRequired: [
      'Chief AI officer or executive AI sponsor',
      'Risk and compliance leader',
      'Internal audit representative',
      'Privacy / data protection officer',
    ],
    buildBuyPartnerConsiderations: [
      'Governance tooling is portable across vendors; the operating model and named owners are the lock-in, not the tool',
      'Partner with internal audit early to avoid an audit posture that arrives only after the operating model is in flight',
      'Buy the audit / evidence retention platform where one is already in place; build only the AI-specific overlay',
    ],
    governanceRiskConsiderations: [
      'Every AI program clears the same hard gates G1..G4 with named owners',
      'Evidence retention and audit posture is reviewed at the committee cadence',
      'Regulatory posture per program is recorded and refreshed at the contracted cadence',
    ],
    deliverablesGenerated: [
      'AI governance operating model readout',
      'Hard gate G1..G4 evaluator blueprint and enforcement plan',
      'Enterprise AI value ledger and audit chain rollout',
    ],
    valueMetrics: [
      'Share of AI programs governed by the operating model',
      'Hard gate clearance rate across the portfolio',
      'Evidence retention and audit posture coverage',
      'Enterprise value capture against the captured baseline',
    ],
    agentRoles: {
      nexus: 'Composes the AI governance operating model and rolls it out across the program portfolio',
      sentinel: 'Detects governance, evidence, and value-ledger gaps across the AI portfolio',
      atlas: 'Surfaces governance pressure cards and portfolio-level risk to the executive sponsor',
      steward: 'Enforces hard gate G1..G4 clearance, audit retention, and committee cadence',
    },
    recommendedFirstWorkshop: 'operating_model_alignment',
    createdFrom: 'deterministic_solution_archetype_registry',
  },

  contact_center_ai_transformation: {
    key: 'contact_center_ai_transformation',
    name: 'Contact center AI transformation',
    sector: 'cross_sector',
    capabilityFamily: 'customer_engagement',
    problemStatement:
      'Contact center operations carry high agent attrition, uneven service quality, and rising volume; AI transformation pilots stall on integration with the contact center stack, governance, and value defensibility.',
    businessOutcomes: [
      'Median handle time falls measurably against the captured baseline',
      'First-contact resolution rises on tracked intents under named governance',
      'Agent attrition and ramp time improve as AI assist absorbs lower-value work',
      'Customer satisfaction holds or improves through the rollout',
    ],
    currentStateInputsRequired: [
      'Volume, handle time, and disposition mix by intent and channel',
      'Existing AI assist, IVR, and self-service footprint and integration posture',
      'Quality monitoring program coverage and evaluator ownership',
      'Workforce management posture and agent attrition baseline',
    ],
    patternsUsed: [
      'evidence_chain_gap',
      'gate_governance_gap',
      'value_ledger_incompleteness',
    ],
    failureModesAddressed: [
      'missing_governance_risk',
      'unclear_human_in_loop_surface',
      'no_measurable_baseline',
    ],
    solutionComponents: [
      'agent_assist_workflow',
      'self_service_intent_resolution',
      'quality_monitoring_evidence_chain',
      'contact_center_value_ledger',
    ],
    architectureBuildingBlocks: [
      'Agent-assist service grounded in the knowledge base and policy corpus',
      'Self-service intent resolution path for tracked low-risk intents',
      'Quality monitoring overlay with evaluator-grade evidence retention',
      'Workforce management integration aligning capacity to predicted intent mix',
      'Value ledger binding handle time, FCR, and CSAT to AI assist adoption',
    ],
    workshopsRequired: [
      'current_state_discovery',
      'architecture_solution_design',
      'governance_risk_review',
      'value_framing',
    ],
    smesRequired: [
      'Contact center operations leader / VP of customer service',
      'Quality monitoring program owner',
      'Workforce management lead',
      'CRM / contact center platform architect',
    ],
    buildBuyPartnerConsiderations: [
      'Buy the contact center AI assist where the CCaaS vendor offers a supported path; build only the policy and quality overlay',
      'Partner with workforce management on capacity alignment to avoid shadow staffing models',
      'Vendor selection covers regulator-grade audit posture, intent coverage, and integration depth',
    ],
    governanceRiskConsiderations: [
      'High-risk intents follow a named human-in-loop path with audit retention',
      'Quality monitoring evidence is retained for the regulatory window with named evaluator ownership',
      'Audit trail of AI assist suggestion, agent decision, and customer outcome is retained for governance review',
    ],
    deliverablesGenerated: [
      'Contact center current-state and target-state architecture',
      'Agent assist and self-service governance readout',
      'Contact center value ledger and rollout sequence',
    ],
    valueMetrics: [
      'Median handle time against the captured baseline',
      'First-contact resolution on tracked intents',
      'Agent attrition and ramp time against baseline',
      'Customer satisfaction trend through the rollout',
    ],
    agentRoles: {
      nexus: 'Composes the contact center target-state architecture per intent and channel',
      sentinel: 'Detects evidence-chain gaps and quality monitoring breaks across operations',
      atlas: 'Surfaces handle-time, FCR, and attrition pressure cards to the operations executive',
      steward: 'Enforces human-in-loop, audit retention, and quality governance gates',
    },
    recommendedFirstWorkshop: 'current_state_discovery',
    createdFrom: 'deterministic_solution_archetype_registry',
  },

  finance_fpna_ai_automation: {
    key: 'finance_fpna_ai_automation',
    name: 'Finance and FP&A AI automation',
    sector: 'shared_services',
    capabilityFamily: 'finance_back_office',
    problemStatement:
      'Finance and FP&A operations carry repetitive close, variance, and forecast tasks; AI automation pilots stall on data foundation gaps, control posture, and value defensibility to the CFO.',
    businessOutcomes: [
      'Close cycle time falls measurably against the captured baseline',
      'Variance explanation cycle time falls under named control ownership',
      'Forecast accuracy improves on tracked planning lines',
      'Audit-defensible control posture holds or improves through the rollout',
    ],
    currentStateInputsRequired: [
      'Close cycle time, variance disposition, and forecast accuracy baselines',
      'ERP and consolidation platform footprint and integration posture',
      'Existing AI / RPA pilots in the finance estate and named owners',
      'Control posture and audit obligations relevant to each process class',
    ],
    patternsUsed: [
      'evidence_chain_gap',
      'value_ledger_incompleteness',
      'program_context_sparsity',
    ],
    failureModesAddressed: [
      'weak_data_foundation',
      'no_measurable_baseline',
      'no_value_ledger',
    ],
    solutionComponents: [
      'finance_data_foundation_blueprint',
      'ai_assisted_close_workflow',
      'variance_explanation_assistant',
      'fpna_value_ledger',
    ],
    architectureBuildingBlocks: [
      'Finance data foundation grounded in the consolidation platform and source ERPs',
      'AI-assisted close workflow with audit-grade evidence retention',
      'Variance explanation assistant grounded in the consolidation hierarchy',
      'Forecast assistant grounded in the planning model and history',
      'Value ledger binding close cycle, variance, and forecast outcomes to AI adoption',
    ],
    workshopsRequired: [
      'current_state_discovery',
      'data_foundation_assessment',
      'governance_risk_review',
      'value_framing',
    ],
    smesRequired: [
      'Controller or finance operations leader',
      'FP&A leader for the priority planning lines',
      'Finance systems / ERP architect',
      'Internal audit / SOX representative',
    ],
    buildBuyPartnerConsiderations: [
      'Buy the close and variance assistant where the ERP vendor offers a supported path; build only the control overlay and value ledger',
      'Partner with internal audit on control posture before rollout to avoid a SOX gap landing late',
      'Vendor selection covers regulator-grade audit posture, control coverage, and integration depth',
    ],
    governanceRiskConsiderations: [
      'Every AI-assisted close action carries a named preparer and reviewer with audit retention',
      'Variance explanation evidence is retained for the audit window with named owner sign-off',
      'Forecast assistant outputs are reviewed by the named planning owner before steering-committee use',
    ],
    deliverablesGenerated: [
      'Finance and FP&A current-state and target-state architecture',
      'Close, variance, and forecast governance readout',
      'Finance value ledger and rollout sequence',
    ],
    valueMetrics: [
      'Close cycle time against the captured baseline',
      'Variance explanation cycle time against baseline',
      'Forecast accuracy on tracked planning lines',
      'Auditor finding rate on AI-assisted control evidence',
    ],
    agentRoles: {
      nexus: 'Composes the finance and FP&A target-state architecture per process class',
      sentinel: 'Detects data foundation and control evidence gaps across the finance estate',
      atlas: 'Surfaces close, variance, and forecast pressure cards to the CFO sponsor',
      steward: 'Enforces preparer-reviewer separation, audit retention, and control governance gates',
    },
    recommendedFirstWorkshop: 'data_foundation_assessment',
    createdFrom: 'deterministic_solution_archetype_registry',
  },
};

// ---------------------------------------------------------------------
// Public exports
// ---------------------------------------------------------------------

/**
 * Frozen tuple of canonical archetype keys in canonical order.
 * Pure: byte-equal across reads.
 */
export const SOLUTION_ARCHETYPE_KEYS: ReadonlyArray<SolutionArchetypeKey> =
  Object.freeze([...ARCHETYPE_KEYS_IN_ORDER]) as ReadonlyArray<SolutionArchetypeKey>;

/**
 * The full registry keyed by canonical archetype key.
 */
export const SOLUTION_ARCHETYPES: Record<SolutionArchetypeKey, SolutionArchetype> = REGISTRY;

/**
 * Return the full archetype list in canonical order. Pure: same call →
 * identical output (byte-equal across calls).
 */
export function listSolutionArchetypes(): ReadonlyArray<SolutionArchetype> {
  return ARCHETYPE_KEYS_IN_ORDER.map((k) => REGISTRY[k]);
}

/**
 * Return one archetype by key. Pure. Returns null for unknown keys.
 */
export function getSolutionArchetype(key: string): SolutionArchetype | null {
  if (!isSolutionArchetypeKey(key)) return null;
  return REGISTRY[key];
}

/**
 * Recommend archetypes whose `sector` matches a caller-supplied sector
 * substring OR whose surface text overlaps with caller-supplied
 * capability keywords.
 *
 * Semantics:
 * - Union: an archetype matched by sector OR by capability keyword
 *   appears once.
 * - Canonical order: results follow the canonical archetype key order
 *   regardless of input order.
 * - Deterministic: same input → identical output across calls.
 * - Unknown / empty tokens are ignored.
 */
export function recommendSolutionArchetypes(input: {
  sectors?: ReadonlyArray<string>;
  capabilityKeywords?: ReadonlyArray<string>;
}): ReadonlyArray<SolutionArchetype> {
  const rawSectors = input.sectors ?? [];
  const rawKeywords = input.capabilityKeywords ?? [];

  const sectorTokens = rawSectors
    .map((s) => (typeof s === 'string' ? s.trim().toLowerCase() : ''))
    .filter((s) => s.length > 0);
  const keywordTokens = rawKeywords
    .map((k) => (typeof k === 'string' ? k.trim().toLowerCase() : ''))
    .filter((k) => k.length > 0);

  if (sectorTokens.length === 0 && keywordTokens.length === 0) {
    return [];
  }

  return ARCHETYPE_KEYS_IN_ORDER.map((k) => REGISTRY[k]).filter((a) => {
    const sectorLower = a.sector.toLowerCase();
    const sectorHit = sectorTokens.some((t) => sectorLower.includes(t));
    if (sectorHit) return true;

    if (keywordTokens.length === 0) return false;
    const haystack = buildArchetypeHaystack(a);
    return keywordTokens.some((t) => haystack.includes(t));
  });
}

/**
 * Aggregate archetype counts and unique sets across the supplied
 * archetypes (defaults to the full canonical list). Sorted ascending
 * for byte-equal determinism. Pure.
 */
export function summarizeSolutionArchetypes(
  archetypes?: ReadonlyArray<SolutionArchetype>,
): SolutionArchetypeSummary {
  const list =
    archetypes && archetypes.length >= 0
      ? archetypes
      : ARCHETYPE_KEYS_IN_ORDER.map((k) => REGISTRY[k]);

  const sectorSet = new Set<string>();
  const workshopSet = new Set<string>();
  const blockSet = new Set<string>();
  for (const a of list) {
    sectorSet.add(a.sector);
    for (const w of a.workshopsRequired) workshopSet.add(w);
    for (const b of a.architectureBuildingBlocks) blockSet.add(b);
  }

  return {
    totalCount: list.length,
    sectors: Array.from(sectorSet).sort(),
    uniqueWorkshops: Array.from(workshopSet).sort(),
    uniqueArchitectureBlocks: Array.from(blockSet).sort(),
  };
}

// ---------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------

function isSolutionArchetypeKey(value: string): value is SolutionArchetypeKey {
  return (ARCHETYPE_KEYS_IN_ORDER as ReadonlyArray<string>).includes(value);
}

function buildArchetypeHaystack(a: SolutionArchetype): string {
  const parts: string[] = [
    a.key,
    a.name,
    a.sector,
    a.capabilityFamily,
    a.problemStatement,
    a.recommendedFirstWorkshop,
    ...a.businessOutcomes,
    ...a.currentStateInputsRequired,
    ...a.patternsUsed,
    ...a.failureModesAddressed,
    ...a.solutionComponents,
    ...a.architectureBuildingBlocks,
    ...a.workshopsRequired,
    ...a.smesRequired,
    ...a.buildBuyPartnerConsiderations,
    ...a.governanceRiskConsiderations,
    ...a.deliverablesGenerated,
    ...a.valueMetrics,
    a.agentRoles.nexus,
    a.agentRoles.sentinel,
    a.agentRoles.atlas,
    a.agentRoles.steward,
  ];
  return parts.join(' | ').toLowerCase();
}
