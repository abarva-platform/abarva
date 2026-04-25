// SOL5 · Healthcare AI Archetype Pack.
//
// Pure deterministic library naming the canonical healthcare AI
// archetypes AbarVa carries into discovery / design with payer and
// provider clients. Programs, Atlas, Nexus, and Steward can subscribe
// to this pack to recommend, scope, and govern healthcare AI work
// without inventing archetypes at runtime.
//
// This module is a *library*. It does NOT generate live architectures,
// invoke models, read tenant state, or endorse a named vendor. Vendor
// startup considerations are kept at the category level (e.g. "ambient
// documentation specialists") so the pack stays defensible across
// tenants whose vendor short-list differs.
//
// No live runtime, no Claude / OpenAI / Pinecone invocation, no
// Date.now() reads, no random IDs, no Supabase reads, no migrations.
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

export type HealthcareAiArchetypeKey =
  | 'ambient_clinical_value_chain'
  | 'hcc_risk_adjustment_coding_accuracy'
  | 'prior_authorization_automation'
  | 'clinical_documentation_improvement'
  | 'care_management_next_best_action'
  | 'patient_access_scheduling_optimization'
  | 'revenue_integrity_ai'
  | 'population_health_analytics'
  | 'clinical_contact_center_ai'
  | 'provider_network_intelligence'
  | 'denial_prevention_ai'
  | 'patient_experience_personalization';

export interface HealthcareAiArchetype {
  key: HealthcareAiArchetypeKey;
  name: string;
  clinicalBusinessProblem: string;
  workflowImpacted: ReadonlyArray<string>;
  currentStateInputsRequired: ReadonlyArray<string>;
  dataSourcesRequired: ReadonlyArray<string>;
  architectureBuildingBlocks: ReadonlyArray<string>;
  vendorStartupConsiderations: ReadonlyArray<string>;
  buildBuyPartnerConsiderations: ReadonlyArray<string>;
  governanceRiskConsiderations: ReadonlyArray<string>;
  valueMetrics: ReadonlyArray<string>;
  requiredWorkshops: ReadonlyArray<string>;
  smesRequired: ReadonlyArray<string>;
  deliverablesGenerated: ReadonlyArray<string>;
  patternsUsed: ReadonlyArray<string>;
  failureModesAddressed: ReadonlyArray<string>;
  likelySystemsImpacted: ReadonlyArray<string>;
  createdFrom: 'deterministic_healthcare_archetype_pack';
}

export interface HealthcareAiArchetypePackSummary {
  totalCount: number;
  uniqueWorkflows: ReadonlyArray<string>;
  uniqueArchitectureBlocks: ReadonlyArray<string>;
  uniqueWorkshops: ReadonlyArray<string>;
  uniqueDataSources: ReadonlyArray<string>;
}

// ---------------------------------------------------------------------
// Archetype pack
// ---------------------------------------------------------------------

const PACK: Record<HealthcareAiArchetypeKey, HealthcareAiArchetype> = {
  ambient_clinical_value_chain: {
    key: 'ambient_clinical_value_chain',
    name: 'Ambient clinical value chain',
    clinicalBusinessProblem:
      'Clinicians lose hours per shift to documentation, which drives burnout, drags throughput, and degrades downstream coding, billing, and quality reporting because the note is the source for all of them.',
    workflowImpacted: [
      'Outpatient encounter documentation at the point of care',
      'Inpatient progress note authoring and rounding handoff',
      'Downstream coding and billing review of the note for charge capture',
      'Downstream quality measure abstraction from the note',
    ],
    currentStateInputsRequired: [
      'Inventory of specialties, encounter volume, and average documentation time per visit',
      'Current EHR template and macro library with usage telemetry where available',
      'Existing coding and billing review workflow including denial and rework volume tied to documentation gaps',
    ],
    dataSourcesRequired: [
      'EHR encounter and note repository',
      'EHR scheduling and visit type catalog',
      'Coding and billing system charge capture and denial reason data',
      'Quality measure abstraction registry where applicable',
    ],
    architectureBuildingBlocks: [
      'Ambient capture device or smartphone-class capture surface tied to the encounter ID',
      'Speech recognition and clinical language understanding service',
      'Note draft generator with structured-data extraction for problem list, plan, and orders',
      'Clinician review and edit surface inside the EHR with co-sign workflow',
      'Audit trail capturing draft, edits, signer, and timestamp for every note',
    ],
    vendorStartupConsiderations: [
      'Ambient documentation specialists',
      'Clinical speech recognition platforms',
      'Clinical natural language processing platforms',
      'EHR-embedded documentation assistants surfaced through certified integration channels',
    ],
    buildBuyPartnerConsiderations: [
      'Buy a category leader for capture and clinical NLP; the moat is dataset scale, not application code',
      'Partner with EHR for the in-context review surface to avoid clinician context-switch cost',
      'Build the audit, governance, and value-ledger wrapper internally so the program does not depend on a single vendor for evidence',
    ],
    governanceRiskConsiderations: [
      'Patient consent capture and disclosure standard before any ambient session begins',
      'Clinician sign-off remains required on every generated note before the note enters the legal record',
      'Bias and equity review across patient demographics for transcription and summarization quality',
    ],
    valueMetrics: [
      'Documentation time per encounter',
      'Clinician burnout score trend on a captured instrument',
      'Note completion latency from encounter end to signed note',
      'Downstream coding rework volume tied to documentation gaps',
    ],
    requiredWorkshops: [
      'use_case_framing',
      'governance_risk_review',
      'adoption_change_readiness',
    ],
    smesRequired: [
      'Practicing clinician champions across the top three specialties by volume',
      'Clinical informatics lead',
      'Health information management and coding lead',
      'Compliance and privacy officer',
    ],
    deliverablesGenerated: [
      'Specialty-by-specialty rollout plan with named champions',
      'Documentation time and burnout baseline report',
      'Clinician training and feedback capture playbook',
    ],
    patternsUsed: ['program_context_sparsity', 'evidence_chain_gap'],
    failureModesAddressed: ['poor_use_case_framing', 'no_adoption_change_plan'],
    likelySystemsImpacted: [
      'EHR clinical documentation module',
      'EHR scheduling',
      'Coding and billing system',
      'Clinical quality reporting platform',
    ],
    createdFrom: 'deterministic_healthcare_archetype_pack',
  },
  hcc_risk_adjustment_coding_accuracy: {
    key: 'hcc_risk_adjustment_coding_accuracy',
    name: 'HCC risk adjustment coding accuracy',
    clinicalBusinessProblem:
      'Risk-adjusted populations under-capture and over-capture chronic conditions because the documentation-to-code path is manual, retrospective, and inconsistent across coders and providers, which distorts RAF scores and exposes the organization to audit risk.',
    workflowImpacted: [
      'Annual wellness visit and chronic-condition recapture workflow',
      'Coder review and final code submission for risk-adjustable encounters',
      'RAF score calculation and submission to the payer',
      'Internal audit and external RADV audit response workflow',
    ],
    currentStateInputsRequired: [
      'Two years of submitted claims with HCC categories and RAF history per member',
      'Coder productivity and accuracy telemetry where available',
      'List of risk-adjustable contracts and their submission cadence',
    ],
    dataSourcesRequired: [
      'EHR problem list, encounter notes, and assessment data',
      'Claims history including diagnosis codes and dates of service',
      'Provider attestation and addenda log',
      'Payer risk-adjustment submission and reconciliation feed',
    ],
    architectureBuildingBlocks: [
      'Clinical natural language processing layer for chart abstraction',
      'HCC suggestion engine grounded in the official risk-adjustment model version in use',
      'Coder review queue with side-by-side evidence display from the chart',
      'Provider attestation surface for in-visit and post-visit confirmation',
      'Submission package generator with audit-defensible evidence binding',
    ],
    vendorStartupConsiderations: [
      'Risk-adjustment coding platforms',
      'Clinical natural language processing platforms',
      'Audit and compliance analytics specialists',
    ],
    buildBuyPartnerConsiderations: [
      'Buy the chart abstraction and suggestion engine; specialized models trained on coded charts outperform general models',
      'Partner with the EHR for in-visit provider attestation to avoid abandoning the workflow',
      'Build the audit-defensible submission package and the coder review queue internally so the evidence chain stays under house ownership',
    ],
    governanceRiskConsiderations: [
      'RADV and OIG audit defensibility for every suggested code with chart-pinpoint evidence',
      'Bias and equity review to avoid over-capture or under-capture by demographic group',
      'Provider attestation standard so suggestions never become codes without a clinician in the loop',
    ],
    valueMetrics: [
      'RAF score accuracy compared to chart-validated truth',
      'Coder review throughput per coder per day',
      'Audit finding rate on suggested codes after submission',
      'Proportion of risk-adjustable members with a completed annual recapture visit',
    ],
    requiredWorkshops: [
      'use_case_framing',
      'governance_risk_review',
      'data_foundation_assessment',
    ],
    smesRequired: [
      'Risk-adjustment coding lead',
      'Compliance and audit officer',
      'Practicing primary care clinician champion',
      'Actuarial or finance representative for RAF impact',
    ],
    deliverablesGenerated: [
      'Coder review and provider attestation playbook',
      'Audit-defensible submission package specification',
      'RAF accuracy baseline report',
    ],
    patternsUsed: ['evidence_chain_gap', 'value_ledger_incompleteness'],
    failureModesAddressed: ['no_measurable_baseline', 'missing_governance_risk'],
    likelySystemsImpacted: [
      'EHR coding and problem list',
      'Claims and billing system',
      'Payer risk-adjustment submission system',
      'Audit and compliance platform',
    ],
    createdFrom: 'deterministic_healthcare_archetype_pack',
  },
  prior_authorization_automation: {
    key: 'prior_authorization_automation',
    name: 'Prior authorization automation',
    clinicalBusinessProblem:
      'Prior authorization is the highest-friction transaction between provider and payer; it delays care, drives clinician and staff burnout, and produces avoidable denials when the evidence packet does not match the clinical policy on the payer side.',
    workflowImpacted: [
      'Order entry at the point of care that triggers a prior authorization requirement',
      'Documentation and evidence packet assembly by clinical staff',
      'Payer workflow for review, pend, approve, or deny',
      'Appeal workflow when an initial determination is unfavorable',
    ],
    currentStateInputsRequired: [
      'Top order types by volume that require prior authorization across the top three payers',
      'Current turnaround time and denial-rate baseline by service and payer',
      'Inventory of clinical policy documents and frequency of policy updates by payer',
    ],
    dataSourcesRequired: [
      'EHR order, encounter, and clinical documentation feed',
      'Payer prior authorization portals or X12 278 transaction connectivity',
      'Clinical policy library per payer with versioning',
      'Claims history for the member to identify prior services and outcomes',
    ],
    architectureBuildingBlocks: [
      'Order-time requirement detection rule engine keyed on payer plus service code',
      'Evidence packet assembler that pulls documentation from the EHR per the clinical policy template',
      'Payer integration channel covering portal automation, X12 278, and FHIR Da Vinci profiles where available',
      'Status tracking and clinician notification surface',
      'Appeal workflow generator with prior-determination context',
    ],
    vendorStartupConsiderations: [
      'Prior authorization automation specialists',
      'Payer-provider interoperability platforms',
      'Clinical policy intelligence specialists',
    ],
    buildBuyPartnerConsiderations: [
      'Buy the payer integration channel and policy library; coverage and recency are the moat',
      'Partner with the EHR for order-time requirement detection so clinicians see the gate inside their workflow',
      'Build the evidence packet assembler and appeal workflow internally so the organization owns the audit trail',
    ],
    governanceRiskConsiderations: [
      'Documentation completeness check before any packet is sent to the payer to avoid a no-info denial',
      'Audit trail of every decision, override, and appeal with named actor and timestamp',
      'Patient communication standard when an authorization is pending or denied',
    ],
    valueMetrics: [
      'Median turnaround time from order to determination',
      'First-pass approval rate by service and by payer',
      'Staff hours per authorization',
      'Appeal overturn rate where the initial determination was a denial',
    ],
    requiredWorkshops: [
      'use_case_framing',
      'architecture_solution_design',
      'governance_risk_review',
    ],
    smesRequired: [
      'Utilization management lead',
      'Revenue cycle director',
      'Practicing clinician champion across the top order types',
      'Payer relations or contracting representative',
    ],
    deliverablesGenerated: [
      'Order type and payer prioritization plan',
      'Evidence packet templates aligned to clinical policy per payer',
      'Turnaround and approval-rate baseline report',
    ],
    patternsUsed: ['evidence_chain_gap', 'gate_governance_gap'],
    failureModesAddressed: ['weak_workflow_integration', 'missing_governance_risk'],
    likelySystemsImpacted: [
      'EHR order entry and documentation',
      'Revenue cycle and billing system',
      'Payer prior authorization system',
      'Patient communication platform',
    ],
    createdFrom: 'deterministic_healthcare_archetype_pack',
  },
  clinical_documentation_improvement: {
    key: 'clinical_documentation_improvement',
    name: 'Clinical documentation improvement',
    clinicalBusinessProblem:
      'Inpatient documentation gaps cause downstream coding inaccuracy, missed severity capture, and compliance exposure; CDI specialists cannot review every chart and existing alerting is noisy and retrospective.',
    workflowImpacted: [
      'Concurrent inpatient documentation review during the stay',
      'Provider query workflow where documentation is incomplete or non-specific',
      'Coding final review on the discharged chart',
      'Quality and severity reporting to internal and external bodies',
    ],
    currentStateInputsRequired: [
      'Two years of inpatient stays with DRG, severity, and case mix index',
      'Current CDI specialist span and review coverage by service line',
      'Provider query response rate and turnaround baseline',
    ],
    dataSourcesRequired: [
      'EHR inpatient note repository and order data',
      'ADT feed for admission, discharge, and transfer events',
      'Coding system DRG, ICD, and procedure code data',
      'Quality and severity reporting registries',
    ],
    architectureBuildingBlocks: [
      'Concurrent CDI prioritization engine keyed on diagnosis specificity gaps',
      'Provider query generator grounded in compliant query templates',
      'CDI specialist review surface with chart-pinpoint evidence',
      'Coder reconciliation surface for final review',
      'Audit trail of every query, response, and final code',
    ],
    vendorStartupConsiderations: [
      'Clinical documentation improvement platforms',
      'Clinical natural language processing platforms',
      'Coding analytics specialists',
    ],
    buildBuyPartnerConsiderations: [
      'Buy the CDI prioritization engine and the clinical NLP layer for chart abstraction',
      'Partner with the EHR for the in-context query surface to keep clinicians in workflow',
      'Build the audit trail and reconciliation surface internally so the evidence chain stays defensible',
    ],
    governanceRiskConsiderations: [
      'Compliant query templates that do not lead the clinician to a specific diagnosis',
      'Clinician sign-off required on every query response before it enters the legal record',
      'Bias and equity review across service lines and demographics',
    ],
    valueMetrics: [
      'Case mix index trend',
      'Provider query response rate and turnaround time',
      'CDI review coverage as a share of inpatient stays',
      'Coding accuracy on post-discharge audit',
    ],
    requiredWorkshops: [
      'use_case_framing',
      'data_foundation_assessment',
      'governance_risk_review',
    ],
    smesRequired: [
      'CDI program lead',
      'Hospitalist and intensivist clinician champions',
      'Health information management and coding lead',
      'Compliance officer',
    ],
    deliverablesGenerated: [
      'Service-line prioritization plan',
      'Compliant query template library',
      'CMI and query-response baseline report',
    ],
    patternsUsed: ['evidence_chain_gap'],
    failureModesAddressed: ['no_measurable_baseline', 'weak_workflow_integration'],
    likelySystemsImpacted: [
      'EHR inpatient documentation',
      'Coding and billing system',
      'Quality reporting registry',
      'Compliance audit platform',
    ],
    createdFrom: 'deterministic_healthcare_archetype_pack',
  },
  care_management_next_best_action: {
    key: 'care_management_next_best_action',
    name: 'Care management next-best-action',
    clinicalBusinessProblem:
      'Care managers carry panels too large to triage manually; the highest-impact next action for each member is buried under fragmented signals across claims, EHR, and patient-reported data, which leaves preventable admissions on the table.',
    workflowImpacted: [
      'Daily care manager triage and outreach planning',
      'Care plan authoring and update at the member level',
      'Inter-disciplinary team rounds for complex members',
      'Outreach and engagement workflow including SMS, phone, and portal',
    ],
    currentStateInputsRequired: [
      'Care manager span and panel size by program',
      'Current risk stratification model and its inputs',
      'Outreach engagement rate baseline by channel',
    ],
    dataSourcesRequired: [
      'Claims feed including admissions, ED visits, and pharmacy fills',
      'EHR encounter, problem list, and care plan data',
      'ADT feed for real-time admission and discharge events',
      'Patient-reported outcome and engagement data where available',
      'Social determinants and community resource data where available',
    ],
    architectureBuildingBlocks: [
      'Risk and rising-risk stratification engine',
      'Next-best-action recommender grounded in care plan templates',
      'Care manager triage surface with member context and evidence',
      'Outreach orchestration across SMS, phone, portal, and in-person',
      'Audit trail of recommendations, actions taken, and outcomes',
    ],
    vendorStartupConsiderations: [
      'Care management platforms',
      'Risk stratification analytics specialists',
      'Patient engagement and outreach specialists',
    ],
    buildBuyPartnerConsiderations: [
      'Buy the risk stratification engine because data scale and label quality are the moat',
      'Partner with the EHR for the in-context care plan surface to avoid duplicate data entry',
      'Build the audit trail and outcome attribution layer internally so the value ledger stays under house ownership',
    ],
    governanceRiskConsiderations: [
      'Bias and equity review of risk and rising-risk models across demographics',
      'Member consent and disclosure standard for outreach across channels',
      'Care manager override standard so recommendations never auto-execute on a member',
    ],
    valueMetrics: [
      'Avoidable admission rate per thousand for the managed population',
      'Care plan completion and update rate',
      'Outreach engagement rate by channel',
      'Care manager time on the highest-leverage members',
    ],
    requiredWorkshops: [
      'use_case_framing',
      'data_foundation_assessment',
      'value_framing',
    ],
    smesRequired: [
      'Care management program lead',
      'Population health analytics lead',
      'Practicing primary care clinician champion',
      'Member engagement and outreach lead',
    ],
    deliverablesGenerated: [
      'Program prioritization plan by panel and condition',
      'Outreach engagement baseline report',
      'Avoidable-admission baseline and tracking plan',
    ],
    patternsUsed: ['program_context_sparsity', 'value_ledger_incompleteness'],
    failureModesAddressed: ['no_measurable_baseline', 'weak_data_foundation'],
    likelySystemsImpacted: [
      'EHR care plan module',
      'Care management platform',
      'Claims and ADT feed',
      'Patient engagement and outreach platform',
    ],
    createdFrom: 'deterministic_healthcare_archetype_pack',
  },
  patient_access_scheduling_optimization: {
    key: 'patient_access_scheduling_optimization',
    name: 'Patient access and scheduling optimization',
    clinicalBusinessProblem:
      'Patients abandon care when scheduling is hard; provider templates are over- or under-booked; no-show rates and same-day cancellations leave revenue and access on the table while patients wait weeks for the next opening.',
    workflowImpacted: [
      'Patient self-scheduling on the digital front door',
      'Call-center scheduling and reschedule workflow',
      'Referral intake and specialty matching',
      'Provider template management and overbook policy',
    ],
    currentStateInputsRequired: [
      'Specialty-by-specialty third-next-available appointment baseline',
      'No-show, late-cancel, and same-day-cancel rate by service',
      'Current provider template policy by specialty including overbook ratios',
    ],
    dataSourcesRequired: [
      'EHR scheduling and visit type catalog',
      'Provider directory with credentialing and specialty data',
      'Patient demographics and prior visit history',
      'Referral feed from internal and external sources',
    ],
    architectureBuildingBlocks: [
      'Demand forecasting layer per specialty and service',
      'Smart scheduling matcher that pairs patient need to the right provider and slot',
      'No-show and late-cancel risk model',
      'Self-scheduling and call-center scheduling surface',
      'Template optimization recommendation engine for practice managers',
    ],
    vendorStartupConsiderations: [
      'Digital front door and self-scheduling specialists',
      'Provider directory and matching specialists',
      'Demand forecasting and operations analytics specialists',
    ],
    buildBuyPartnerConsiderations: [
      'Buy the digital front door and matching layer because consumer-grade UX is the moat',
      'Partner with the EHR for canonical scheduling state to avoid double bookings',
      'Build the template optimization layer internally because policy is local',
    ],
    governanceRiskConsiderations: [
      'Equity review on which patients get faster access through digital channels',
      'Patient consent and disclosure on automated reminders and waitlist outreach',
      'Practice manager override standard on template recommendations',
    ],
    valueMetrics: [
      'Third-next-available appointment by specialty',
      'No-show and same-day-cancel rate',
      'Scheduling abandonment rate on the digital front door',
      'Slot utilization rate by specialty',
    ],
    requiredWorkshops: [
      'use_case_framing',
      'value_framing',
      'adoption_change_readiness',
    ],
    smesRequired: [
      'Patient access program lead',
      'Practice operations and scheduling lead',
      'Provider directory and credentialing lead',
      'Patient experience representative',
    ],
    deliverablesGenerated: [
      'Specialty prioritization plan with named champions',
      'Third-next-available baseline by specialty',
      'No-show baseline and reduction plan',
    ],
    patternsUsed: ['evidence_chain_gap', 'program_context_sparsity'],
    failureModesAddressed: ['no_adoption_change_plan', 'weak_workflow_integration'],
    likelySystemsImpacted: [
      'EHR scheduling',
      'Digital front door and patient portal',
      'Call center telephony and CRM',
      'Provider directory',
    ],
    createdFrom: 'deterministic_healthcare_archetype_pack',
  },
  revenue_integrity_ai: {
    key: 'revenue_integrity_ai',
    name: 'Revenue integrity AI',
    clinicalBusinessProblem:
      'Charge capture leakage, undercoding, and missed-modifier errors quietly erode realized revenue before claims even leave the building; existing edits are rule-based, brittle, and noisy, so reviewers desensitize and revenue leaks persist.',
    workflowImpacted: [
      'Charge capture review prior to claim submission',
      'Coding edit and modifier review for the encounter',
      'Pre-bill audit on high-dollar and high-risk encounters',
      'Charge description master maintenance and review',
    ],
    currentStateInputsRequired: [
      'Two years of submitted claims with line-level charge and code data',
      'Current pre-bill edit and audit rule inventory with hit rates',
      'Charge description master and last review date by item',
    ],
    dataSourcesRequired: [
      'EHR encounter, order, and procedure data',
      'Charge capture and billing system data including modifiers and units',
      'Claims history with adjudication outcomes',
      'Charge description master with versioning',
    ],
    architectureBuildingBlocks: [
      'Pre-bill anomaly detection layer for missing or mismatched charges',
      'Modifier and undercoding suggestion engine',
      'Reviewer queue with side-by-side encounter evidence',
      'Charge description master analytics layer',
      'Audit trail of every suggestion, accept, and reject decision',
    ],
    vendorStartupConsiderations: [
      'Revenue integrity analytics specialists',
      'Charge capture and pre-bill audit specialists',
      'Coding optimization platforms',
    ],
    buildBuyPartnerConsiderations: [
      'Buy the anomaly detection layer because cross-tenant claim data is the moat',
      'Partner with the EHR and billing system for canonical encounter and charge state',
      'Build the reviewer queue and audit trail internally so the evidence chain stays defensible',
    ],
    governanceRiskConsiderations: [
      'Suggestions never auto-post; a coder accepts or rejects with named-actor audit',
      'Equity and anti-upcoding governance to avoid systemic over-coding under the banner of optimization',
      'Charge description master change control with sign-off authority',
    ],
    valueMetrics: [
      'Pre-bill edit yield in net realized revenue per claim',
      'Coder reviewer throughput per coder per day',
      'Late-charge volume after submission',
      'Charge description master review coverage',
    ],
    requiredWorkshops: [
      'use_case_framing',
      'value_framing',
      'governance_risk_review',
    ],
    smesRequired: [
      'Revenue integrity director',
      'Coding lead',
      'Compliance officer',
      'Finance and reimbursement representative',
    ],
    deliverablesGenerated: [
      'Pre-bill leakage baseline report',
      'Charge description master review plan',
      'Reviewer playbook with audit standards',
    ],
    patternsUsed: ['evidence_chain_gap', 'value_ledger_incompleteness'],
    failureModesAddressed: ['no_value_ledger', 'no_measurable_baseline'],
    likelySystemsImpacted: [
      'EHR charge capture',
      'Billing system',
      'Charge description master',
      'Compliance audit platform',
    ],
    createdFrom: 'deterministic_healthcare_archetype_pack',
  },
  population_health_analytics: {
    key: 'population_health_analytics',
    name: 'Population health analytics',
    clinicalBusinessProblem:
      'Value-based contracts demand defensible measurement of cost, utilization, and quality across attributed populations; existing reports lag, segment poorly, and cannot defend a contract decision at the next steering touchpoint.',
    workflowImpacted: [
      'Quarterly population health steering review with payers',
      'Quality measure abstraction and submission',
      'Total cost of care analysis by attributed population',
      'Network leakage and steerage analysis',
    ],
    currentStateInputsRequired: [
      'List of value-based contracts with attribution methodology and measurement cadence',
      'Current quality measure submission inventory with last-cycle performance',
      'Existing total-cost-of-care reporting baseline',
    ],
    dataSourcesRequired: [
      'Claims feed including pharmacy and behavioral health where in scope',
      'EHR clinical data feed including problem list and labs',
      'ADT feed for utilization signal',
      'Provider directory with attribution metadata',
      'Payer reconciliation feeds for risk and shared savings',
    ],
    architectureBuildingBlocks: [
      'Attribution engine reconciling member to provider and program',
      'Cost and utilization analytics layer with risk adjustment',
      'Quality measure abstraction layer with submission packaging',
      'Steering and network leakage analytics layer',
      'Audit trail of every measure, every patient included or excluded, and every override',
    ],
    vendorStartupConsiderations: [
      'Population health analytics platforms',
      'Quality measure analytics specialists',
      'Total-cost-of-care analytics specialists',
    ],
    buildBuyPartnerConsiderations: [
      'Buy the attribution and cost analytics layer because cross-payer normalization is the moat',
      'Partner with payers for reconciliation feeds rather than reinventing them',
      'Build the steering review presentation layer internally because narrative is local',
    ],
    governanceRiskConsiderations: [
      'Numerator, denominator, and exclusion definitions are versioned with named owner',
      'Equity review on outcome and access metrics by demographic group',
      'Audit-defensible inclusion and exclusion logic for every quality measure',
    ],
    valueMetrics: [
      'Quality measure performance against contract targets',
      'Total cost of care trend by attributed population',
      'Network leakage rate by service line',
      'Time from measurement period close to defensible report',
    ],
    requiredWorkshops: [
      'use_case_framing',
      'data_foundation_assessment',
      'value_framing',
    ],
    smesRequired: [
      'Population health director',
      'Value-based care contracting lead',
      'Quality reporting lead',
      'Actuarial and finance representative',
    ],
    deliverablesGenerated: [
      'Contract-by-contract measurement playbook',
      'Quality and total-cost baseline report',
      'Attribution and exclusion logic documentation',
    ],
    patternsUsed: ['value_ledger_incompleteness', 'evidence_chain_gap'],
    failureModesAddressed: ['no_value_ledger', 'no_measurable_baseline'],
    likelySystemsImpacted: [
      'Claims and billing system',
      'EHR clinical data warehouse',
      'Quality reporting registry',
      'Payer reconciliation feed',
    ],
    createdFrom: 'deterministic_healthcare_archetype_pack',
  },
  clinical_contact_center_ai: {
    key: 'clinical_contact_center_ai',
    name: 'Clinical contact center AI',
    clinicalBusinessProblem:
      'Contact centers absorb scheduling, billing, triage, and clinical questions at high volume; agents lack the context, the protocols, and the time to resolve calls in one touch, which drives abandonment and unnecessary clinical visits.',
    workflowImpacted: [
      'Inbound call routing and intent capture',
      'Self-service patient interaction across IVR, chat, and SMS',
      'Agent-assisted call resolution including scheduling and billing',
      'Clinical triage handoff to a licensed clinician when criteria are met',
    ],
    currentStateInputsRequired: [
      'Inbound call volume with intent breakdown over the last four quarters',
      'Average handle time, abandonment rate, and first-call resolution rate by intent',
      'Agent and clinician staffing model and seasonality',
    ],
    dataSourcesRequired: [
      'EHR scheduling, billing, and patient profile data',
      'Contact center telephony and CRM data',
      'Clinical triage protocol library',
      'Provider directory and on-call schedule',
    ],
    architectureBuildingBlocks: [
      'Intent capture and routing layer across voice and digital channels',
      'Self-service resolution layer for scheduling and billing intents',
      'Agent assist layer with grounded knowledge retrieval',
      'Clinical triage layer with licensed-clinician escalation criteria',
      'Audit trail of every interaction, intent, action, and escalation',
    ],
    vendorStartupConsiderations: [
      'Contact center conversational AI specialists',
      'Clinical triage protocol specialists',
      'Healthcare CRM and patient communication platforms',
    ],
    buildBuyPartnerConsiderations: [
      'Buy the conversational AI and routing layer because telephony scale is the moat',
      'Partner with a clinical triage protocol library to avoid authoring protocols from scratch',
      'Build the EHR and CRM integration internally so the agent has canonical context',
    ],
    governanceRiskConsiderations: [
      'Licensed-clinician escalation is mandatory when triage criteria are met',
      'Patient consent and disclosure on automated interactions',
      'Equity review on intent recognition and resolution by demographic group',
    ],
    valueMetrics: [
      'First-call resolution rate by intent',
      'Average handle time and abandonment rate',
      'Self-service containment rate by intent',
      'Avoided clinical visits where self-service or triage resolved the need',
    ],
    requiredWorkshops: [
      'use_case_framing',
      'adoption_change_readiness',
      'governance_risk_review',
    ],
    smesRequired: [
      'Contact center operations director',
      'Clinical triage program lead',
      'Patient experience representative',
      'Compliance and privacy officer',
    ],
    deliverablesGenerated: [
      'Intent prioritization plan',
      'Self-service containment baseline report',
      'Clinical triage protocol coverage map',
    ],
    patternsUsed: ['program_context_sparsity', 'evidence_chain_gap'],
    failureModesAddressed: ['weak_workflow_integration', 'no_adoption_change_plan'],
    likelySystemsImpacted: [
      'Contact center telephony and CRM',
      'EHR scheduling and billing',
      'Patient communication platform',
      'Provider directory',
    ],
    createdFrom: 'deterministic_healthcare_archetype_pack',
  },
  provider_network_intelligence: {
    key: 'provider_network_intelligence',
    name: 'Provider network intelligence',
    clinicalBusinessProblem:
      'Provider network management depends on stale directory data, manual credentialing, and reactive performance review; access, accuracy, and steerage all suffer, and No Surprises Act exposure rises when directory entries are wrong.',
    workflowImpacted: [
      'Credentialing and recredentialing workflow',
      'Provider directory accuracy maintenance',
      'Network adequacy analysis and reporting',
      'Provider performance review and tiering',
    ],
    currentStateInputsRequired: [
      'Current provider directory inventory with last-verified date per record',
      'Credentialing turnaround baseline by specialty',
      'Network adequacy reporting cadence and compliance baseline',
    ],
    dataSourcesRequired: [
      'Provider directory of record',
      'Credentialing and primary source verification data',
      'Claims feed for utilization and performance signal',
      'External provider data sources for cross-verification',
    ],
    architectureBuildingBlocks: [
      'Directory accuracy and freshness scoring engine',
      'Credentialing workflow with primary source verification automation',
      'Network adequacy analytics layer',
      'Provider performance and tiering analytics layer',
      'Audit trail of every directory change, credentialing decision, and tiering update',
    ],
    vendorStartupConsiderations: [
      'Provider data management specialists',
      'Credentialing automation specialists',
      'Network adequacy analytics specialists',
    ],
    buildBuyPartnerConsiderations: [
      'Buy the directory accuracy and primary source verification layer because cross-tenant verification is the moat',
      'Partner with regulators and payers for adequacy reporting standards',
      'Build the performance review and tiering layer internally because tier policy is local',
    ],
    governanceRiskConsiderations: [
      'No Surprises Act and equivalent regulatory exposure on directory accuracy',
      'Provider notice and dispute standard on tiering decisions',
      'Audit-defensible primary source verification record per credential decision',
    ],
    valueMetrics: [
      'Directory accuracy rate against verified ground truth',
      'Credentialing turnaround time by specialty',
      'Network adequacy compliance rate',
      'Tier-change disputes overturned',
    ],
    requiredWorkshops: [
      'data_foundation_assessment',
      'governance_risk_review',
      'operating_model_alignment',
    ],
    smesRequired: [
      'Network management director',
      'Credentialing lead',
      'Compliance officer',
      'Provider relations representative',
    ],
    deliverablesGenerated: [
      'Directory accuracy baseline report',
      'Credentialing turnaround playbook',
      'Network adequacy reporting cadence',
    ],
    patternsUsed: ['evidence_chain_gap', 'gate_governance_gap'],
    failureModesAddressed: ['weak_data_foundation', 'missing_governance_risk'],
    likelySystemsImpacted: [
      'Provider directory',
      'Credentialing system',
      'Claims and billing system',
      'Regulatory reporting platform',
    ],
    createdFrom: 'deterministic_healthcare_archetype_pack',
  },
  denial_prevention_ai: {
    key: 'denial_prevention_ai',
    name: 'Denial prevention AI',
    clinicalBusinessProblem:
      'Claim denials drive avoidable rework cost and delay cash collection; existing denial work is reactive and per-claim, so root causes recur and denial rates plateau even after years of investment.',
    workflowImpacted: [
      'Claim scrub and edit workflow before submission',
      'Denial work queue triage and appeal authoring',
      'Root-cause analysis across denial reasons and payers',
      'Front-end registration and eligibility verification',
    ],
    currentStateInputsRequired: [
      'Two years of denied claims with denial reason, payer, and service line',
      'Current denial work queue staffing and throughput baseline',
      'Front-end eligibility and authorization process inventory',
    ],
    dataSourcesRequired: [
      'Claims and remittance feed including 835 transactions',
      'EHR encounter, order, and documentation data',
      'Eligibility and benefits verification data including 270 / 271 transactions',
      'Prior authorization status feed',
    ],
    architectureBuildingBlocks: [
      'Pre-submission denial risk scorer keyed on claim, payer, and service',
      'Denial root-cause clustering and trend layer',
      'Appeal authoring layer with payer-specific evidence templates',
      'Front-end eligibility and authorization gap detector',
      'Audit trail of every prediction, action, and outcome',
    ],
    vendorStartupConsiderations: [
      'Denial management analytics specialists',
      'Claims editing and scrubbing platforms',
      'Patient access and eligibility specialists',
    ],
    buildBuyPartnerConsiderations: [
      'Buy the denial risk scorer because cross-tenant remittance data is the moat',
      'Partner with payers for canonical denial reason taxonomy where available',
      'Build the appeal authoring layer internally because evidence narrative is local',
    ],
    governanceRiskConsiderations: [
      'Audit-defensible appeal evidence with named-actor sign-off',
      'Anti-fraud governance to ensure denial prevention does not become claim manipulation',
      'Patient communication standard on out-of-pocket exposure when a denial is unavoidable',
    ],
    valueMetrics: [
      'Initial denial rate by service and payer',
      'Days in accounts receivable',
      'Appeal overturn rate',
      'Cost to collect per net patient revenue',
    ],
    requiredWorkshops: [
      'use_case_framing',
      'value_framing',
      'governance_risk_review',
    ],
    smesRequired: [
      'Revenue cycle director',
      'Denial management lead',
      'Patient access and eligibility lead',
      'Compliance officer',
    ],
    deliverablesGenerated: [
      'Denial root-cause baseline report',
      'Front-end eligibility gap report',
      'Appeal authoring playbook with evidence templates',
    ],
    patternsUsed: ['evidence_chain_gap', 'value_ledger_incompleteness'],
    failureModesAddressed: ['no_measurable_baseline', 'weak_workflow_integration'],
    likelySystemsImpacted: [
      'EHR registration and orders',
      'Billing system',
      'Payer claims and remittance system',
      'Eligibility verification system',
    ],
    createdFrom: 'deterministic_healthcare_archetype_pack',
  },
  patient_experience_personalization: {
    key: 'patient_experience_personalization',
    name: 'Patient experience personalization',
    clinicalBusinessProblem:
      'Patients receive generic outreach, generic billing communication, and generic education that ignores their language, channel preference, condition mix, and prior interactions; engagement falls and clinical adherence stalls.',
    workflowImpacted: [
      'Pre-visit preparation and reminders',
      'Post-visit instruction delivery and follow-up',
      'Billing and financial counseling communication',
      'Condition-specific education and engagement campaigns',
    ],
    currentStateInputsRequired: [
      'Patient communication channel inventory with engagement rates',
      'Language and accessibility profile coverage rate across the patient population',
      'Existing condition-specific education program inventory',
    ],
    dataSourcesRequired: [
      'EHR encounter, problem list, and patient profile data',
      'Patient communication and engagement history across channels',
      'Billing and financial counseling history',
      'Patient-reported preference and consent data',
    ],
    architectureBuildingBlocks: [
      'Preference and channel resolver per patient',
      'Personalized content and template generator with clinician-approved sources',
      'Outreach orchestration across SMS, email, voice, portal, and in-person',
      'Engagement and outcome attribution layer',
      'Audit trail of every personalized touch with consent and channel record',
    ],
    vendorStartupConsiderations: [
      'Patient engagement personalization specialists',
      'Healthcare CRM and patient communication platforms',
      'Patient education content specialists',
    ],
    buildBuyPartnerConsiderations: [
      'Buy the orchestration and CRM layer because channel scale is the moat',
      'Partner with content specialists for clinician-approved education libraries',
      'Build the consent and audit layer internally so privacy stays under house ownership',
    ],
    governanceRiskConsiderations: [
      'Patient consent capture per channel with audit-defensible record',
      'Equity and accessibility review on language and channel coverage',
      'Clinician sign-off on any personalized content that crosses into clinical advice',
    ],
    valueMetrics: [
      'Engagement rate by channel and segment',
      'Self-pay collection rate after personalized financial communication',
      'Adherence and follow-up completion rate for condition-specific programs',
      'Patient experience survey score trend',
    ],
    requiredWorkshops: [
      'use_case_framing',
      'adoption_change_readiness',
      'governance_risk_review',
    ],
    smesRequired: [
      'Patient experience director',
      'Patient communication and CRM lead',
      'Health equity officer',
      'Practicing clinician champion',
    ],
    deliverablesGenerated: [
      'Channel and language coverage baseline report',
      'Engagement and adherence baseline report',
      'Consent capture and audit playbook',
    ],
    patternsUsed: ['program_context_sparsity', 'evidence_chain_gap'],
    failureModesAddressed: ['no_adoption_change_plan', 'weak_data_foundation'],
    likelySystemsImpacted: [
      'EHR patient profile',
      'Patient communication and CRM platform',
      'Billing system',
      'Patient portal',
    ],
    createdFrom: 'deterministic_healthcare_archetype_pack',
  },
};

const PACK_KEYS_IN_ORDER: ReadonlyArray<HealthcareAiArchetypeKey> = Object.freeze([
  'ambient_clinical_value_chain',
  'hcc_risk_adjustment_coding_accuracy',
  'prior_authorization_automation',
  'clinical_documentation_improvement',
  'care_management_next_best_action',
  'patient_access_scheduling_optimization',
  'revenue_integrity_ai',
  'population_health_analytics',
  'clinical_contact_center_ai',
  'provider_network_intelligence',
  'denial_prevention_ai',
  'patient_experience_personalization',
]) as ReadonlyArray<HealthcareAiArchetypeKey>;

// ---------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------

/**
 * Return the full archetype pack in canonical order. Pure: same call →
 * identical output.
 */
export function listHealthcareAiArchetypes(): ReadonlyArray<HealthcareAiArchetype> {
  return PACK_KEYS_IN_ORDER.map((k) => PACK[k]);
}

/**
 * Return one archetype by key. Pure. Returns null for unknown keys.
 */
export function getHealthcareAiArchetype(
  key: string,
): HealthcareAiArchetype | null {
  if (!isHealthcareAiArchetypeKey(key)) return null;
  return PACK[key];
}

/**
 * Recommend archetypes whose workflow / value-metric text overlaps with
 * the caller's keyword set. Pure. Order is canonical. Matching is
 * case-insensitive substring on the joined fields. Empty input returns
 * an empty list.
 */
export function recommendHealthcareAiArchetypes(input: {
  workflowKeywords?: ReadonlyArray<string>;
  valueDriverKeywords?: ReadonlyArray<string>;
}): ReadonlyArray<HealthcareAiArchetype> {
  const workflowKeywords = (input.workflowKeywords ?? []).filter((k) => k.trim().length > 0);
  const valueKeywords = (input.valueDriverKeywords ?? []).filter((k) => k.trim().length > 0);
  if (workflowKeywords.length === 0 && valueKeywords.length === 0) {
    return [];
  }
  const wkLower = workflowKeywords.map((k) => k.toLowerCase());
  const vkLower = valueKeywords.map((k) => k.toLowerCase());
  return PACK_KEYS_IN_ORDER.map((k) => PACK[k]).filter((a) => {
    const workflowText = a.workflowImpacted.join(' | ').toLowerCase();
    const valueText = a.valueMetrics.join(' | ').toLowerCase();
    const wkHit = wkLower.some((kw) => workflowText.includes(kw));
    const vkHit = vkLower.some((kw) => valueText.includes(kw));
    return wkHit || vkHit;
  });
}

/**
 * Aggregate the unique workflows, architecture building blocks,
 * required workshops, and data sources across the canonical pack.
 * Each list is sorted ascending. totalCount equals the canonical pack
 * size (12).
 */
export function summarizeHealthcareAiArchetypes(): HealthcareAiArchetypePackSummary {
  const archetypes = PACK_KEYS_IN_ORDER.map((k) => PACK[k]);
  const workflowSet = new Set<string>();
  const archBlockSet = new Set<string>();
  const workshopSet = new Set<string>();
  const dataSourceSet = new Set<string>();
  for (const a of archetypes) {
    for (const w of a.workflowImpacted) workflowSet.add(w);
    for (const b of a.architectureBuildingBlocks) archBlockSet.add(b);
    for (const w of a.requiredWorkshops) workshopSet.add(w);
    for (const d of a.dataSourcesRequired) dataSourceSet.add(d);
  }
  return {
    totalCount: archetypes.length,
    uniqueWorkflows: Array.from(workflowSet).sort(),
    uniqueArchitectureBlocks: Array.from(archBlockSet).sort(),
    uniqueWorkshops: Array.from(workshopSet).sort(),
    uniqueDataSources: Array.from(dataSourceSet).sort(),
  };
}

// ---------------------------------------------------------------------
// Re-exports for test introspection
// ---------------------------------------------------------------------

export const HEALTHCARE_AI_ARCHETYPE_KEYS: ReadonlyArray<HealthcareAiArchetypeKey> =
  PACK_KEYS_IN_ORDER;

export const HEALTHCARE_AI_ARCHETYPES: Record<HealthcareAiArchetypeKey, HealthcareAiArchetype> =
  PACK;

// ---------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------

function isHealthcareAiArchetypeKey(value: string): value is HealthcareAiArchetypeKey {
  return (PACK_KEYS_IN_ORDER as ReadonlyArray<string>).includes(value);
}
