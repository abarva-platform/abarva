// SOL3 · Solution Archetype Registry.
//
// Pure deterministic registry of broad solution archetypes that sit
// *above* component packs (e.g. SOL2 AI-led PDLC). Each archetype is a
// hand-authored library record describing the problem, business
// outcomes, current-state inputs, architecture building blocks,
// workshops, SMEs, build/buy/partner considerations,
// governance/risk considerations, deliverables, value metrics, and the
// per-agent role for Nexus / Sentinel / Atlas / Steward.
//
// This registry is intentionally broader than SOL2: SOL2 enumerates
// canonical *components* of one specific archetype (AI-led PDLC). SOL3
// enumerates *archetypes* themselves. The `patternsUsed` field holds
// descriptive labels; they do NOT need to be canonical I1 Sentinel
// pattern keys, because SOL3 spans archetypes whose internal patterns
// are domain-specific and outside the I1 product-failure / governance
// pattern set.
//
// The `solutionComponents` field is a list of descriptive labels by
// default; for the AI-led PDLC archetype it MUST reference at least one
// canonical SOL2 AiLedPdlcComponentKey, so the registry is wired into
// the SOL2 pack for that archetype.
//
// This module is a *library*. It does NOT generate live architectures,
// invoke models, or read tenant state. Recommendations are pure
// rule-based union match on sector substring + keyword substring
// against name / problemStatement / businessOutcomes.
//
// No live runtime, no Claude / OpenAI invocation, no Date.now() reads,
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
//   - next/*
//   - react

import type { AiLedPdlcComponentKey } from './ai-led-pdlc-components';

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
  | 'build_buy_partner_evaluation';

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
  problemStatement: string;
  businessOutcomes: ReadonlyArray<string>;
  currentStateInputsRequired: ReadonlyArray<string>;
  patternsUsed: ReadonlyArray<string>;
  solutionComponents: ReadonlyArray<string>;
  architectureBuildingBlocks: ReadonlyArray<string>;
  workshopsRequired: ReadonlyArray<string>;
  smesRequired: ReadonlyArray<string>;
  buildBuyPartnerConsiderations: ReadonlyArray<string>;
  governanceRiskConsiderations: ReadonlyArray<string>;
  deliverablesGenerated: ReadonlyArray<string>;
  valueMetrics: ReadonlyArray<string>;
  agentRoles: SolutionArchetypeAgentRoles;
  createdFrom: 'deterministic_solution_archetype_registry';
}

export interface SolutionArchetypeRegistrySummary {
  totalCount: number;
  sectors: ReadonlyArray<string>;
  uniqueWorkshops: ReadonlyArray<string>;
  uniqueArchitectureBlocks: ReadonlyArray<string>;
}

// ---------------------------------------------------------------------
// Canonical SOL2 component keys referenced by ai_led_pdlc_transformation
// ---------------------------------------------------------------------

const CONTEXT_AS_CODE_FOUNDATION: AiLedPdlcComponentKey = 'context_as_code_foundation';
const DORA_TELEMETRY_LAYER: AiLedPdlcComponentKey = 'dora_telemetry_layer';
const AI_CODE_REVIEW: AiLedPdlcComponentKey = 'ai_code_review';
const VALUE_LEDGER_FOR_PDLC: AiLedPdlcComponentKey = 'value_ledger_for_pdlc';

// ---------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------

const REGISTRY: Record<SolutionArchetypeKey, SolutionArchetype> = {
  ai_led_pdlc_transformation: {
    key: 'ai_led_pdlc_transformation',
    name: 'AI-led product development lifecycle transformation',
    sector: 'Cross-industry',
    problemStatement:
      'Engineering organizations buy AI assistant licenses without a measurement spine, a context layer, or a governance model; velocity claims are anecdotal; reviewer fatigue grows; tool sprawl outpaces evidence of value.',
    businessOutcomes: [
      'Defensible DORA baseline and trend per squad and per service',
      'Reviewer effort shifts from convention nits to design intent',
      'AI tool license rationalization driven by adoption-to-outcome correlation',
      'Regulated changes carry named human approvers without slowing velocity',
    ],
    currentStateInputsRequired: [
      'Inventory of AI tool licenses with renewal dates and named owners',
      'Last quarter of merged pull requests with review comments classified',
      'CI / CD / incident system inventory with API access notes',
      'Repository topology and ownership map per service or package',
    ],
    patternsUsed: [
      'Context-as-code foundation grounds AI suggestions in versioned house conventions',
      'Reviewer-in-the-loop gating on AI-scaffolded changes',
      'DORA telemetry layer as defensible measurement spine',
      'Value ledger ties adoption to outcome metrics',
    ],
    solutionComponents: [
      CONTEXT_AS_CODE_FOUNDATION,
      DORA_TELEMETRY_LAYER,
      AI_CODE_REVIEW,
      VALUE_LEDGER_FOR_PDLC,
    ],
    architectureBuildingBlocks: [
      'Versioned context repository at repo root and package root',
      'AI assistant configuration loader wired to context files',
      'DORA telemetry pipeline from CI / CD / incident systems',
      'Pull-request reviewer pipeline with AI commenter and human gate',
      'Adoption telemetry warehouse with cohort segmentation',
    ],
    workshopsRequired: [
      'current_state_discovery',
      'data_foundation_assessment',
      'architecture_solution_design',
      'governance_risk_review',
      'value_framing',
    ],
    smesRequired: [
      'Engineering productivity lead',
      'Platform engineering architect',
      'Responsible-AI / governance owner',
      'Data engineering lead for DORA telemetry',
    ],
    buildBuyPartnerConsiderations: [
      'Build the context-as-code layer in-house; it encodes proprietary conventions',
      'Buy adoption telemetry from the AI assistant vendors where APIs exist; consolidate in the warehouse',
      'Partner for change-management coaching and adoption rollout if internal capacity is thin',
    ],
    governanceRiskConsiderations: [
      'Privacy review before per-engineer telemetry leaves the engineer / manager pair',
      'Responsible-AI review for any policy-as-code routing rules touching regulated workloads',
      'Audit-log retention policy for AI-scaffolded changes and approval bypasses',
    ],
    deliverablesGenerated: [
      'Repo context manifest (CLAUDE.md / AGENTS.md per repo)',
      'DORA baseline report covering the last two quarters',
      'AI review rubric and reviewer comment-volume baseline',
      'Per-investment value ledger entry tied to DORA telemetry',
    ],
    valueMetrics: [
      'Lead time for changes (DORA)',
      'Change-failure rate (DORA)',
      'Reviewer comment volume per pull request',
      'Adoption-to-outcome correlation per investment',
    ],
    agentRoles: {
      nexus:
        'Synthesizes the context-as-code corpus and grounds engineer-facing answers in the versioned house conventions and ADRs.',
      sentinel:
        'Surfaces program context sparsity and value ledger incompleteness patterns when DORA telemetry or context coverage regresses.',
      atlas:
        'Aggregates adoption-to-outcome correlation across squads and rationalizes the AI tool license portfolio.',
      steward:
        'Owns the policy-as-code rule set, named approvers, and quarterly responsible-AI review of AI assistant changes.',
    },
    createdFrom: 'deterministic_solution_archetype_registry',
  },

  analytics_modernization: {
    key: 'analytics_modernization',
    name: 'Analytics modernization',
    sector: 'Cross-industry',
    problemStatement:
      'Legacy data warehouses, fragmented marts, and inconsistent metric definitions block trustworthy executive reporting; analytics requests pile up while underlying definitions drift across teams.',
    businessOutcomes: [
      'Single source-of-truth metric definitions with named owners',
      'Reduced time-to-insight for the top executive questions',
      'Lower total cost of ownership for the analytics stack',
      'Improved trust in reported numbers across business units',
    ],
    currentStateInputsRequired: [
      'Inventory of data sources, pipelines, and current warehouse / lakehouse footprint',
      'Catalog of executive reports with owner, refresh cadence, and underlying queries',
      'Sample of last quarters analytics requests with cycle time and resolution',
      'Existing data quality and lineage tooling posture',
    ],
    patternsUsed: [
      'Medallion architecture (bronze / silver / gold) for layered data refinement',
      'Semantic layer with versioned metric definitions',
      'Reverse ETL for activation back into operational systems',
      'Data contract pattern between producers and consumers',
    ],
    solutionComponents: [
      'Cloud lakehouse storage layer',
      'Streaming and batch ingestion pipelines',
      'Semantic layer with named metric owners',
      'Self-service BI workspace with row-level access controls',
    ],
    architectureBuildingBlocks: [
      'Cloud object storage as raw landing zone',
      'Lakehouse compute engine for transformation',
      'Workflow orchestrator with lineage capture',
      'Semantic layer mapping metrics to canonical SQL',
      'BI presentation layer with versioned dashboards',
    ],
    workshopsRequired: [
      'data_foundation_assessment',
      'architecture_solution_design',
      'value_framing',
    ],
    smesRequired: [
      'Chief data officer or analytics leader',
      'Data platform architect',
      'Finance / operations metric owners',
      'Data governance steward',
    ],
    buildBuyPartnerConsiderations: [
      'Buy lakehouse and BI platforms from established vendors; avoid bespoke storage layers',
      'Build the semantic layer as the proprietary spine of metric definitions',
      'Partner for migration of legacy reports and historical reconciliation',
    ],
    governanceRiskConsiderations: [
      'Named metric owner per canonical metric with quarterly review cadence',
      'Row-level access controls aligned to data classification policy',
      'Data contract change-management policy between producers and consumers',
    ],
    deliverablesGenerated: [
      'Canonical metric catalog with owners',
      'Lakehouse architecture decision record',
      'Migration plan from legacy warehouse with sequencing',
      'Self-service BI rollout playbook',
    ],
    valueMetrics: [
      'Time-to-insight for the top executive questions',
      'Number of canonical metrics with named owners',
      'Total cost of ownership for the analytics stack',
      'Data trust score from quarterly stakeholder survey',
    ],
    agentRoles: {
      nexus:
        'Answers analytics questions by grounding responses in the semantic layer and versioned metric definitions rather than ad-hoc queries.',
      sentinel:
        'Surfaces metric drift, lineage gaps, and stale dashboards as data foundation patterns.',
      atlas:
        'Reports analytics-stack cost and data trust trends to executive sponsors quarterly.',
      steward:
        'Owns the canonical metric catalog, data contracts, and access-control policy.',
    },
    createdFrom: 'deterministic_solution_archetype_registry',
  },

  healthcare_ambient_clinical_value_chain: {
    key: 'healthcare_ambient_clinical_value_chain',
    name: 'Healthcare ambient clinical value chain',
    sector: 'Healthcare',
    problemStatement:
      'Clinicians spend a large share of their time on documentation; ambient capture pilots stall in disconnected EHR workflows; revenue cycle integrity erodes because narrative notes do not map cleanly to billable structured data.',
    businessOutcomes: [
      'Reduced clinician documentation burden per visit',
      'Improved structured data capture from clinical encounters',
      'Faster note finalization and reduced after-hours charting',
      'Stronger revenue cycle integrity from ambient capture to billing',
    ],
    currentStateInputsRequired: [
      'EHR vendor inventory and integration footprint per clinical service line',
      'Sample of clinician encounters with documentation cycle time captured',
      'Revenue cycle reconciliation report identifying narrative-to-structured drift',
      'Clinician adoption posture for prior ambient or scribe pilots',
    ],
    patternsUsed: [
      'Ambient capture with clinician review-and-sign workflow',
      'EHR-integrated note generation with structured data extraction',
      'Closed-loop reconciliation between narrative note and billed encounter',
      'Specialty-specific template library for downstream coding',
    ],
    solutionComponents: [
      'Ambient capture device or app integrated to clinician workflow',
      'Note generation pipeline with clinician review gate',
      'Structured data extractor mapping to EHR fields',
      'Reconciliation surface for revenue cycle analysts',
    ],
    architectureBuildingBlocks: [
      'On-device or near-device capture layer with privacy controls',
      'EHR integration adapter per vendor and per service line',
      'Note generation service with clinician review queue',
      'Structured extraction pipeline mapping to EHR coded fields',
      'Audit and reconciliation store linking note to claim',
    ],
    workshopsRequired: [
      'current_state_discovery',
      'use_case_framing',
      'governance_risk_review',
      'adoption_change_readiness',
    ],
    smesRequired: [
      'Chief medical information officer',
      'EHR integration architect',
      'Revenue cycle leader',
      'Clinical informatics lead per service line',
      'Privacy and security officer',
    ],
    buildBuyPartnerConsiderations: [
      'Buy ambient capture from vendors with proven EHR integrations rather than building from scratch',
      'Build the reconciliation surface in-house to encode the local revenue cycle policy',
      'Partner with the EHR vendor for certified integration and shared support',
    ],
    governanceRiskConsiderations: [
      'HIPAA and state-level privacy compliance for capture, storage, and processing',
      'Clinician-in-loop review on every ambient-generated note before signing',
      'Audit log linking ambient capture to signed note and billed encounter',
    ],
    deliverablesGenerated: [
      'Clinician documentation cycle time baseline per service line',
      'EHR integration design per vendor',
      'Reconciliation playbook for revenue cycle analysts',
      'Clinician adoption rollout plan with named champions',
    ],
    valueMetrics: [
      'Clinician documentation time per visit',
      'After-hours charting volume per clinician per week',
      'Structured data capture rate per encounter',
      'Revenue cycle reconciliation variance',
    ],
    agentRoles: {
      nexus:
        'Grounds clinician-facing answers in the local note template library and EHR integration map.',
      sentinel:
        'Surfaces note-to-claim reconciliation drift and clinician adoption sparsity as patterns.',
      atlas:
        'Aggregates clinician documentation time and revenue cycle integrity trends for executive sponsors.',
      steward:
        'Owns privacy policy, clinician-in-loop review enforcement, and audit-log retention.',
    },
    createdFrom: 'deterministic_solution_archetype_registry',
  },

  hcc_risk_adjustment_coding_accuracy: {
    key: 'hcc_risk_adjustment_coding_accuracy',
    name: 'HCC risk adjustment coding accuracy',
    sector: 'Healthcare',
    problemStatement:
      'Hierarchical Condition Category coding accuracy drives Medicare Advantage and ACA risk-adjustment revenue and audit exposure; legacy coding workflows depend on retrospective chart review and miss documentation gaps that surface only at audit.',
    businessOutcomes: [
      'Higher coding accuracy on HCC-eligible encounters',
      'Lower retrospective audit findings and recoupment exposure',
      'Reduced coder cycle time per chart',
      'Better-documented clinical specificity supporting risk scores',
    ],
    currentStateInputsRequired: [
      'Inventory of coder workflows and retrospective review backlog',
      'Sample of HCC-eligible charts with current coding accuracy classified',
      'Audit history with finding categories and recoupment volume',
      'EHR documentation patterns per clinical service line',
    ],
    patternsUsed: [
      'AI-assisted suspect HCC identification with coder review-and-confirm',
      'Concurrent coding alongside the encounter rather than retrospective only',
      'Documentation specificity prompts surfaced at the point of care',
      'Audit-trail capture per coding decision with rationale',
    ],
    solutionComponents: [
      'Suspect HCC identification engine over EHR documentation',
      'Coder review queue with rationale capture',
      'Concurrent point-of-care prompt surface for clinicians',
      'Audit-trail store per coding decision',
    ],
    architectureBuildingBlocks: [
      'EHR ingestion adapter with structured and narrative extraction',
      'Suspect identification engine with rule and model layers',
      'Coder workbench with review queue and rationale capture',
      'Clinician prompt surface integrated into encounter workflow',
      'Audit-trail store with retention aligned to compliance policy',
    ],
    workshopsRequired: [
      'current_state_discovery',
      'use_case_framing',
      'governance_risk_review',
    ],
    smesRequired: [
      'Coding compliance leader',
      'Risk adjustment program owner',
      'Clinical documentation improvement lead',
      'Privacy and security officer',
    ],
    buildBuyPartnerConsiderations: [
      'Buy suspect identification engines from vendors with audit-defensible track record',
      'Build the rationale capture layer in-house to encode local audit policy',
      'Partner for clinician-facing change management given workflow sensitivity',
    ],
    governanceRiskConsiderations: [
      'CMS and OIG audit-defensibility requirements for coding decisions',
      'Coder-in-loop confirmation on every AI-suggested HCC',
      'Privacy controls on chart access and retention policy',
    ],
    deliverablesGenerated: [
      'Coding accuracy baseline per service line',
      'Suspect identification engine integration design',
      'Coder workbench rollout plan with training materials',
      'Audit-trail design and retention policy',
    ],
    valueMetrics: [
      'HCC coding accuracy rate per service line',
      'Retrospective audit finding rate',
      'Coder cycle time per chart',
      'Documentation specificity score on HCC-eligible encounters',
    ],
    agentRoles: {
      nexus:
        'Grounds coder-facing answers in the local coding policy, audit history, and documentation specificity guidelines.',
      sentinel:
        'Surfaces patterns of audit-finding clusters by service line and documentation specificity drift.',
      atlas:
        'Reports coding accuracy and audit-finding trends to executive sponsors quarterly.',
      steward:
        'Owns coder-in-loop policy, audit-trail retention, and CMS / OIG response readiness.',
    },
    createdFrom: 'deterministic_solution_archetype_registry',
  },

  prior_authorization_utilization_management: {
    key: 'prior_authorization_utilization_management',
    name: 'Prior authorization and utilization management',
    sector: 'Healthcare',
    problemStatement:
      'Prior authorization queues delay care, frustrate clinicians and members, and consume utilization-management staff capacity; manual review against medical-necessity criteria does not scale and fails regulatory turnaround requirements.',
    businessOutcomes: [
      'Faster turnaround on prior-authorization decisions',
      'Higher first-pass approval rate on clean submissions',
      'Reduced utilization-management staff backlog and burnout',
      'Stronger regulatory compliance with turnaround mandates',
    ],
    currentStateInputsRequired: [
      'Inventory of prior-authorization request volume and decision turnaround per line of business',
      'Medical-necessity criteria library with version history',
      'Sample of prior-authorization cases classified by approval / denial / overturn',
      'Provider portal and intake-channel inventory',
    ],
    patternsUsed: [
      'Criteria-aligned suspect approval with reviewer-in-loop confirmation',
      'Auto-approval on clean cases meeting deterministic criteria',
      'Provider portal pre-check to reduce avoidable denials',
      'Audit-trail capture per decision with rationale and criteria version',
    ],
    solutionComponents: [
      'Intake adapter for provider portal and fax / EDI channels',
      'Criteria-aligned decision engine with reviewer queue',
      'Provider-facing pre-check surface',
      'Audit-trail store with criteria version and rationale',
    ],
    architectureBuildingBlocks: [
      'Multi-channel intake layer (portal, EDI, fax)',
      'Criteria-aligned decision engine with rule and model layers',
      'Reviewer workbench with queue prioritization',
      'Provider-facing pre-check surface integrated into the portal',
      'Audit-trail store with retention aligned to regulatory policy',
    ],
    workshopsRequired: [
      'current_state_discovery',
      'governance_risk_review',
      'operating_model_alignment',
    ],
    smesRequired: [
      'Utilization-management medical director',
      'Compliance and regulatory leader',
      'Provider-experience leader',
      'Operations leader for intake channels',
    ],
    buildBuyPartnerConsiderations: [
      'Buy intake-channel adapters from established vendors with EDI certifications',
      'Build the decision engine criteria mapping in-house; it encodes payer-specific medical necessity policy',
      'Partner with provider organizations for portal pre-check rollout and feedback loops',
    ],
    governanceRiskConsiderations: [
      'CMS and state turnaround mandates per line of business',
      'Reviewer-in-loop confirmation on every adverse determination',
      'Audit-trail retention with criteria version history per decision',
    ],
    deliverablesGenerated: [
      'Prior-authorization turnaround baseline per line of business',
      'Decision engine integration design with criteria version control',
      'Provider portal pre-check rollout plan',
      'Reviewer workbench training materials',
    ],
    valueMetrics: [
      'Turnaround time per prior-authorization decision',
      'First-pass approval rate on clean submissions',
      'Reviewer cycle time per case',
      'Adverse-determination overturn rate at appeal',
    ],
    agentRoles: {
      nexus:
        'Grounds reviewer-facing answers in the criteria library and case history rather than ad-hoc precedent.',
      sentinel:
        'Surfaces patterns of avoidable denials and criteria-version drift across the case corpus.',
      atlas:
        'Reports turnaround and overturn trends to executive sponsors and regulators on cadence.',
      steward:
        'Owns reviewer-in-loop policy, criteria version control, and audit-trail retention.',
    },
    createdFrom: 'deterministic_solution_archetype_registry',
  },

  kyc_customer_onboarding_ai: {
    key: 'kyc_customer_onboarding_ai',
    name: 'KYC and customer onboarding intelligence',
    sector: 'Financial services',
    problemStatement:
      'Know-your-customer onboarding queues stall on document collection, name screening, and enhanced due diligence; manual review extends time-to-account and inflates compliance staff cost without improving risk posture.',
    businessOutcomes: [
      'Reduced time-to-account for clean applicants',
      'Higher straight-through processing rate on low-risk cases',
      'Reduced compliance staff backlog and review cost',
      'Stronger audit posture with documented decision rationale',
    ],
    currentStateInputsRequired: [
      'Inventory of onboarding intake channels and document types per product line',
      'Sample of recent onboarding cases classified by risk tier and decision outcome',
      'Name-screening watchlist sources with refresh cadence',
      'Compliance escalation matrix with named approvers',
    ],
    patternsUsed: [
      'Document classification and extraction with reviewer confirmation',
      'Risk-tiered case routing with straight-through processing on clean cases',
      'Watchlist screening with reviewer disposition capture',
      'Audit-trail per decision with policy version and reviewer rationale',
    ],
    solutionComponents: [
      'Document intake and extraction service',
      'Risk-tiered routing engine',
      'Watchlist-screening adapter with reviewer queue',
      'Audit-trail store with policy version and rationale',
    ],
    architectureBuildingBlocks: [
      'Document intake layer with channel adapters',
      'Extraction and classification engine with confidence thresholds',
      'Risk-tiered routing engine with policy-as-code',
      'Watchlist-screening adapter with refresh cadence per source',
      'Reviewer workbench with case queue and rationale capture',
      'Audit-trail store aligned to regulatory retention',
    ],
    workshopsRequired: [
      'current_state_discovery',
      'governance_risk_review',
      'operating_model_alignment',
    ],
    smesRequired: [
      'Compliance and BSA / AML leader',
      'Onboarding operations leader',
      'Privacy and data-protection officer',
      'Product leader per onboarded product line',
    ],
    buildBuyPartnerConsiderations: [
      'Buy watchlist-screening data feeds from established providers; do not build the watchlists',
      'Build the policy-as-code routing layer in-house to encode firm-specific risk appetite',
      'Partner for document-extraction technology where vendor accuracy is proven on the relevant document types',
    ],
    governanceRiskConsiderations: [
      'BSA / AML, OFAC, and jurisdiction-specific regulatory requirements per product line',
      'Reviewer-in-loop confirmation on every adverse onboarding decision',
      'Privacy and data-protection controls on document storage and retention',
    ],
    deliverablesGenerated: [
      'Time-to-account baseline per product line and risk tier',
      'Policy-as-code routing rule set with named owners',
      'Reviewer workbench rollout plan with training materials',
      'Audit-trail design with retention aligned to regulatory policy',
    ],
    valueMetrics: [
      'Time-to-account per applicant',
      'Straight-through processing rate per risk tier',
      'Reviewer cycle time per case',
      'Adverse-decision audit-finding rate',
    ],
    agentRoles: {
      nexus:
        'Grounds reviewer-facing answers in the policy-as-code rule set and case history rather than ad-hoc precedent.',
      sentinel:
        'Surfaces patterns of routing drift, rule-firing volume, and reviewer override clusters.',
      atlas:
        'Reports time-to-account and audit-finding trends to executive sponsors and regulators on cadence.',
      steward:
        'Owns reviewer-in-loop policy, policy-as-code version control, and audit-trail retention.',
    },
    createdFrom: 'deterministic_solution_archetype_registry',
  },

  predictive_maintenance_modernization: {
    key: 'predictive_maintenance_modernization',
    name: 'Predictive maintenance modernization',
    sector: 'Industrial',
    problemStatement:
      'Industrial operators run a mix of time-based maintenance, vendor-supplied condition monitoring, and reactive repair; asset downtime is anecdotally tied to missed signals; without a unified telemetry spine, predictive maintenance pilots stall.',
    businessOutcomes: [
      'Reduced unplanned asset downtime per fleet',
      'Lower total maintenance cost per asset-hour',
      'Higher first-time-fix rate from predictive work orders',
      'Improved safety posture from earlier failure-mode signals',
    ],
    currentStateInputsRequired: [
      'Inventory of monitored assets, sensors, and historian / SCADA footprint',
      'Maintenance work-order history with failure-mode classification',
      'Asset criticality and safety classification per fleet',
      'Existing vendor condition-monitoring contracts and data access posture',
    ],
    patternsUsed: [
      'Unified telemetry spine across historian / SCADA / vendor monitoring sources',
      'Failure-mode catalog tied to work-order history',
      'Predictive model output review by reliability engineers before work-order release',
      'Closed-loop work-order outcome capture for model refresh',
    ],
    solutionComponents: [
      'Telemetry ingestion adapters per source system',
      'Asset and failure-mode catalog with named owners',
      'Predictive engine with reliability-engineer review queue',
      'Work-order outcome capture surface for closed-loop refresh',
    ],
    architectureBuildingBlocks: [
      'Edge collection and historian integration layer',
      'Telemetry pipeline into the unified spine',
      'Asset and failure-mode catalog with versioned schema',
      'Predictive engine with model registry and refresh cadence',
      'Reliability-engineer review queue and work-order release surface',
      'Outcome capture and refresh feedback loop',
    ],
    workshopsRequired: [
      'current_state_discovery',
      'data_foundation_assessment',
      'architecture_solution_design',
      'value_framing',
    ],
    smesRequired: [
      'Reliability engineering leader',
      'Operations technology architect',
      'Maintenance planning leader',
      'Safety and risk officer',
    ],
    buildBuyPartnerConsiderations: [
      'Buy edge collectors and historian adapters from established industrial vendors',
      'Build the failure-mode catalog and predictive engine integration in-house to encode local asset knowledge',
      'Partner with vendor condition-monitoring providers where contracts and data access already exist',
    ],
    governanceRiskConsiderations: [
      'Safety-classification policy gating any auto-released work order',
      'Reliability-engineer-in-loop confirmation on every predictive work order in safety-critical fleets',
      'Data-access policy for vendor-supplied telemetry per contract',
    ],
    deliverablesGenerated: [
      'Asset and failure-mode catalog with owners',
      'Telemetry-spine integration design per source',
      'Predictive engine rollout plan with reliability-engineer training',
      'Work-order outcome feedback-loop design',
    ],
    valueMetrics: [
      'Unplanned downtime per asset per quarter',
      'Total maintenance cost per asset-hour',
      'First-time-fix rate on predictive work orders',
      'Predictive precision and recall per critical asset class',
    ],
    agentRoles: {
      nexus:
        'Grounds reliability-engineer-facing answers in the asset catalog, failure-mode taxonomy, and work-order history.',
      sentinel:
        'Surfaces telemetry-spine gaps and patterns of model-output drift relative to actual outcomes.',
      atlas:
        'Reports unplanned-downtime and maintenance-cost trends to executive sponsors quarterly.',
      steward:
        'Owns safety-classification policy, reliability-engineer-in-loop review, and vendor data-access compliance.',
    },
    createdFrom: 'deterministic_solution_archetype_registry',
  },

  build_buy_partner_evaluation: {
    key: 'build_buy_partner_evaluation',
    name: 'Build versus buy versus partner evaluation',
    sector: 'Cross-industry',
    problemStatement:
      'Investment decisions on whether to build a capability in-house, buy from a vendor, or partner with a service provider are often made by sponsor preference rather than evidence; commitments lock in cost and risk before the option set is rigorously framed.',
    businessOutcomes: [
      'Defensible build / buy / partner decision per evaluated capability',
      'Reduced sunk cost on commitments later reversed',
      'Faster sponsor sign-off when the evidence chain is captured',
      'Stronger total-cost-of-ownership visibility across the portfolio',
    ],
    currentStateInputsRequired: [
      'Inventory of capabilities under evaluation with sponsor and target outcome',
      'Existing vendor and partner footprint with renewal and exit clauses',
      'Internal engineering capacity and skill mix per relevant domain',
      'Total-cost-of-ownership baseline for current alternatives',
    ],
    patternsUsed: [
      'Structured option framing with build / buy / partner alternatives per capability',
      'Reversibility scoring per option with named exit triggers',
      'Total-cost-of-ownership comparison across a multi-year horizon',
      'Sponsor-in-loop sign-off with captured rationale per decision',
    ],
    solutionComponents: [
      'Capability inventory with sponsor and target outcome per item',
      'Option framing template with reversibility and TCO fields',
      'Decision-rationale capture surface with sponsor sign-off',
      'Quarterly portfolio review surface with revisit triggers',
    ],
    architectureBuildingBlocks: [
      'Capability inventory store with named sponsors',
      'Option framing template repository with versioned schema',
      'Decision-rationale capture pipeline with audit log',
      'Portfolio review dashboard with revisit-trigger reminders',
    ],
    workshopsRequired: [
      'current_state_discovery',
      'architecture_solution_design',
      'executive_decision_review',
      'operating_model_alignment',
    ],
    smesRequired: [
      'Strategy or transformation leader',
      'Procurement and vendor-management leader',
      'Engineering capacity owner per domain',
      'Finance partner for TCO modeling',
    ],
    buildBuyPartnerConsiderations: [
      'Build the decision-rationale capture surface in-house; it encodes firm-specific evaluation policy',
      'Buy procurement and contract-management tools from established vendors',
      'Partner with management consultancies only when internal capacity is thin and the engagement carries explicit knowledge transfer',
    ],
    governanceRiskConsiderations: [
      'Sponsor-in-loop sign-off on every captured decision with named approver',
      'Reversibility and exit-trigger review on every commitment above a threshold',
      'Audit-log retention for build / buy / partner decisions to support later challenge',
    ],
    deliverablesGenerated: [
      'Capability inventory with sponsors and target outcomes',
      'Option framing per capability with reversibility and TCO fields',
      'Decision-rationale record per evaluated capability',
      'Quarterly portfolio review report with revisit triggers',
    ],
    valueMetrics: [
      'Decision cycle time from intake to sponsor sign-off',
      'Reversal rate on commitments within twelve months',
      'Total cost of ownership variance from baseline',
      'Sponsor confidence score on decision quality',
    ],
    agentRoles: {
      nexus:
        'Grounds sponsor-facing answers in the capability inventory and prior decision-rationale records rather than ad-hoc precedent.',
      sentinel:
        'Surfaces patterns of decision reversal, TCO variance, and reversibility-score drift across the portfolio.',
      atlas:
        'Reports decision cycle time and portfolio TCO variance to executive sponsors quarterly.',
      steward:
        'Owns sponsor sign-off policy, reversibility threshold, and decision audit-log retention.',
    },
    createdFrom: 'deterministic_solution_archetype_registry',
  },
};

const ARCHETYPE_KEYS_IN_ORDER: ReadonlyArray<SolutionArchetypeKey> = [
  'ai_led_pdlc_transformation',
  'analytics_modernization',
  'healthcare_ambient_clinical_value_chain',
  'hcc_risk_adjustment_coding_accuracy',
  'prior_authorization_utilization_management',
  'kyc_customer_onboarding_ai',
  'predictive_maintenance_modernization',
  'build_buy_partner_evaluation',
];

// ---------------------------------------------------------------------
// Public exports
// ---------------------------------------------------------------------

export const SOLUTION_ARCHETYPE_KEYS: ReadonlyArray<SolutionArchetypeKey> =
  Object.freeze([...ARCHETYPE_KEYS_IN_ORDER]) as ReadonlyArray<SolutionArchetypeKey>;

export const SOLUTION_ARCHETYPES: Record<SolutionArchetypeKey, SolutionArchetype> = REGISTRY;

// ---------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------

/**
 * Return all eight archetypes in canonical order. Pure: same call →
 * byte-equal output.
 */
export function listSolutionArchetypes(): SolutionArchetype[] {
  return ARCHETYPE_KEYS_IN_ORDER.map((k) => REGISTRY[k]);
}

/**
 * Return one archetype by key. Pure. Returns null on unknown keys.
 */
export function getSolutionArchetype(key: string): SolutionArchetype | null {
  if (!isSolutionArchetypeKey(key)) return null;
  return REGISTRY[key];
}

/**
 * Recommend archetypes whose `sector` substring-matches any caller
 * sector, OR whose name / problemStatement / businessOutcomes
 * substring-match any caller capability keyword. Pure. Order is
 * canonical. Empty input set returns an empty list. Unknown sector or
 * keyword tokens are ignored gracefully (they simply do not match).
 */
export function recommendSolutionArchetypes(input: {
  sectors?: ReadonlyArray<string>;
  capabilityKeywords?: ReadonlyArray<string>;
}): SolutionArchetype[] {
  const sectors = (input.sectors ?? [])
    .map((s) => s.toLowerCase().trim())
    .filter((s) => s.length > 0);
  const keywords = (input.capabilityKeywords ?? [])
    .map((k) => k.toLowerCase().trim())
    .filter((k) => k.length > 0);

  if (sectors.length === 0 && keywords.length === 0) {
    return [];
  }

  return ARCHETYPE_KEYS_IN_ORDER.map((k) => REGISTRY[k]).filter((a) => {
    const sectorText = a.sector.toLowerCase();
    const sectorMatch = sectors.some((s) => sectorText.includes(s));

    const haystack = [
      a.name,
      a.problemStatement,
      ...a.businessOutcomes,
    ]
      .join(' | ')
      .toLowerCase();
    const keywordMatch = keywords.some((k) => haystack.includes(k));

    return sectorMatch || keywordMatch;
  });
}

/**
 * Aggregate the registry into a deterministic summary.
 * - totalCount: always 8.
 * - sectors: unique sector list, sorted ascending.
 * - uniqueWorkshops: unique workshop list across the registry, sorted ascending.
 * - uniqueArchitectureBlocks: unique architecture-block list across the registry, sorted ascending.
 */
export function summarizeSolutionArchetypes(): SolutionArchetypeRegistrySummary {
  const archetypes = ARCHETYPE_KEYS_IN_ORDER.map((k) => REGISTRY[k]);
  const sectors = new Set<string>();
  const workshops = new Set<string>();
  const blocks = new Set<string>();
  for (const a of archetypes) {
    sectors.add(a.sector);
    for (const w of a.workshopsRequired) workshops.add(w);
    for (const b of a.architectureBuildingBlocks) blocks.add(b);
  }
  return {
    totalCount: archetypes.length,
    sectors: Array.from(sectors).sort(),
    uniqueWorkshops: Array.from(workshops).sort(),
    uniqueArchitectureBlocks: Array.from(blocks).sort(),
  };
}

// ---------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------

function isSolutionArchetypeKey(value: string): value is SolutionArchetypeKey {
  return (ARCHETYPE_KEYS_IN_ORDER as ReadonlyArray<string>).includes(value);
}
