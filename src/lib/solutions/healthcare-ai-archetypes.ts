// SOL5 · Healthcare AI Solution Archetypes registry.
//
// Pure deterministic library naming the canonical high-impact AI
// archetypes a healthcare provider, payer, or integrated delivery
// network typically pursues. Programs, Atlas, and the workshop
// surfaces can subscribe to this pack to surface candidate archetypes
// without inventing them at runtime.
//
// This module is a *library*. It does NOT generate live architectures,
// invoke models, or read tenant state. Recommendations are pure
// substring-overlap on the input.
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
//
// Vendor / startup considerations are phrased as generic vendor
// CATEGORIES. The library does not endorse named brands as facts.
// SOL6 will introduce a rigorous build / buy / partner framework that
// integrates vendor evaluation against tenant context.

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
  | 'population_health_analytics';

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
  createdFrom: 'deterministic_healthcare_archetype_pack';
}

export interface HealthcareAiArchetypeSummary {
  totalCount: number;
  uniqueWorkflows: ReadonlyArray<string>;
  uniqueArchitectureBlocks: ReadonlyArray<string>;
  uniqueWorkshops: ReadonlyArray<string>;
}

// ---------------------------------------------------------------------
// Archetype pack
// ---------------------------------------------------------------------

const PACK: Record<HealthcareAiArchetypeKey, HealthcareAiArchetype> = {
  ambient_clinical_value_chain: {
    key: 'ambient_clinical_value_chain',
    name: 'Ambient clinical value chain',
    clinicalBusinessProblem:
      'Clinicians spend hours per day in after-visit documentation; note quality drives downstream coding, billing, and quality reporting; ambient documentation tools alone leave value on the table when downstream workflows are not redesigned to consume the captured encounter.',
    workflowImpacted: [
      'Provider encounter documentation at point of care',
      'Downstream coding workflow consuming the ambient note',
      'Downstream billing and claim assembly workflow',
      'Downstream quality measure capture and reporting workflow',
      'Patient communication and after-visit summary delivery',
    ],
    currentStateInputsRequired: [
      'Specialty mix and average encounter volume per clinician per day',
      'Current after-hours documentation burden survey or pajama-time telemetry',
      'Existing EHR template inventory and macro / dot-phrase usage report',
      'Coding turnaround time and query rate baseline',
    ],
    dataSourcesRequired: [
      'EHR encounter and note metadata (Epic, Cerner, Meditech, athenahealth)',
      'Audio capture from in-room or mobile devices with patient consent records',
      'Coding and claim data for downstream value attribution',
      'Quality measure capture data (eCQM / HEDIS) for downstream value attribution',
    ],
    architectureBuildingBlocks: [
      'Consented audio capture and secure transport pipeline',
      'Speaker-diarized speech-to-text with healthcare-tuned acoustic model',
      'Clinical NLP and note structuring layer producing SOAP-shaped output',
      'EHR write-back integration with clinician edit-and-sign loop',
      'Downstream feed to coding, quality, and patient summary workflows',
    ],
    vendorStartupConsiderations: [
      'Ambient documentation specialists (category) for the capture-to-note layer',
      'Healthcare-tuned speech-to-text providers (category) for transcription quality',
      'EHR-native ambient extensions (category) for write-back integration',
      'Clinical NLP platforms (category) for downstream structuring',
    ],
    buildBuyPartnerConsiderations: [
      'Buy the ambient capture layer; the category is mature and table-stakes',
      'Partner on EHR write-back integration where the EHR vendor has a published extension model',
      'Build the downstream coding / quality value chain integration internally where the tenant has unique workflow assets',
    ],
    governanceRiskConsiderations: [
      'Patient consent capture and revocation handling at the point of care',
      'PHI handling, retention, and minimum-necessary scope across the capture-to-note pipeline',
      'Clinician sign-off remains required on every ambient-generated note before it enters the legal record',
      'Bias and accuracy monitoring across specialty, accent, and patient demographic cohorts',
    ],
    valueMetrics: [
      'After-hours documentation minutes per clinician per day',
      'Note turnaround time from encounter close to signed note',
      'Coding query rate on ambient-generated notes vs. baseline',
      'Clinician burnout / professional fulfillment index trend',
      'Downstream quality measure capture rate trend',
    ],
    requiredWorkshops: [
      'Clinician workflow current state and pajama-time discovery',
      'Downstream value chain mapping (coding, billing, quality)',
      'Adoption and change readiness for ambient rollout',
    ],
    smesRequired: [
      'Practicing physician and advanced practice provider representatives across top specialties',
      'Clinical informatics and EHR build lead',
      'Coding operations lead and quality reporting lead',
      'Compliance and privacy officer',
    ],
    deliverablesGenerated: [
      'Ambient pilot specialty selection and rollout plan',
      'Downstream value-chain integration design (coding, billing, quality)',
      'Clinician adoption and training plan',
      'Governance, consent, and PHI handling runbook',
    ],
    patternsUsed: [
      'value_ledger_incompleteness',
      'program_context_sparsity',
    ],
    createdFrom: 'deterministic_healthcare_archetype_pack',
  },
  hcc_risk_adjustment_coding_accuracy: {
    key: 'hcc_risk_adjustment_coding_accuracy',
    name: 'HCC risk-adjustment coding accuracy',
    clinicalBusinessProblem:
      'Risk-adjusted populations are systematically under-coded relative to true disease burden; chart review is labor-intensive and inconsistent; CMS audit exposure rises as RAF scores are challenged downstream; payer-provider abrasion grows when documentation does not support submitted codes.',
    workflowImpacted: [
      'Pre-visit chart preparation and HCC suspect surfacing for the clinician',
      'In-visit documentation prompting for unaddressed HCC conditions',
      'Post-visit retrospective chart review and coding workflow',
      'RAF score computation and CMS submission workflow',
      'Audit-defense workflow when CMS or payer challenges submitted codes',
    ],
    currentStateInputsRequired: [
      'Attributed risk-adjusted population list with current RAF distribution',
      'Historical HCC capture rate and recapture rate by condition family',
      'Current coding vendor / partner contract and turnaround time baseline',
      'Audit history and challenged-code rate baseline',
    ],
    dataSourcesRequired: [
      'EHR clinical notes and structured problem-list data',
      'Claims history (medical and pharmacy) for the attributed population',
      'CMS HCC model definition and current model version',
      'ADT feeds for hospitalization and SNF events that surface acute HCC opportunities',
      'Lab and diagnostics data for evidence supporting suspect conditions',
    ],
    architectureBuildingBlocks: [
      'Clinical NLP layer extracting condition mentions and supporting evidence from notes',
      'HCC suspect engine combining NLP, claims, labs, and pharmacy signals',
      'Pre-visit and in-visit clinician-facing presentation layer with evidence trail',
      'Coder-facing review queue with explainable suspect rationale and required documentation gaps',
      'RAF computation and CMS submission integration with audit-trail capture',
    ],
    vendorStartupConsiderations: [
      'Risk-adjustment analytics platforms (category) for the suspect engine',
      'Clinical NLP platforms (category) for note evidence extraction',
      'Coding workflow vendors (category) for the coder review queue',
      'Audit-defense tooling vendors (category) for submission and challenge handling',
    ],
    buildBuyPartnerConsiderations: [
      'Buy the suspect engine when the tenant lacks a mature analytics team for risk adjustment',
      'Partner on chart-review augmentation where a vendor has an established coder workforce',
      'Build the in-EHR clinician prompting layer where workflow integration is differentiated and tightly tied to local templates',
    ],
    governanceRiskConsiderations: [
      'Suspect prompts must require evidence in the chart before coding; the workflow must not encourage upcoding without documentation',
      'Audit trail captures every suspect surfaced, every accepted/rejected suspect, and the supporting evidence cited',
      'Clinician sign-off remains required on every condition documented in the encounter note',
      'Bias and accuracy monitoring across condition families, demographics, and care settings',
      'Retention and minimum-necessary handling of PHI across the suspect pipeline',
    ],
    valueMetrics: [
      'HCC capture rate on attributed risk-adjusted population',
      'Recapture rate on chronic HCC conditions year over year',
      'Documentation-supported coding rate on submitted codes',
      'Audit challenge rate and successful audit-defense rate',
      'Coder hours per chart reviewed vs. baseline',
    ],
    requiredWorkshops: [
      'Risk-adjusted population current state and capture-gap discovery',
      'Clinician documentation workflow and prompting design',
      'Audit-defense and governance review',
    ],
    smesRequired: [
      'Population health and risk-adjustment leader',
      'Practicing physician representative across primary care and key specialties',
      'Coding operations lead and certified risk-adjustment coder',
      'Compliance officer and audit-defense lead',
    ],
    deliverablesGenerated: [
      'Suspect-engine design and rollout plan by condition family',
      'Clinician prompting workflow and EHR integration plan',
      'Coder review-queue operating model',
      'Audit-defense governance and evidence-trail runbook',
    ],
    patternsUsed: [
      'evidence_chain_gap',
      'gate_governance_gap',
      'value_ledger_incompleteness',
    ],
    createdFrom: 'deterministic_healthcare_archetype_pack',
  },
  prior_authorization_automation: {
    key: 'prior_authorization_automation',
    name: 'Prior authorization automation',
    clinicalBusinessProblem:
      'Prior authorization delays care, frustrates clinicians, and consumes administrative capacity on both sides of the payer workflow; manual evidence packet assembly is repetitive yet error-prone; clinical policy alignment between provider and payer is opaque to the requesting clinician.',
    workflowImpacted: [
      'Order entry workflow where the authorization requirement is detected',
      'Evidence packet assembly workflow inside the provider organization',
      'Payer workflow that adjudicates the request against clinical policy',
      'Status communication workflow back to clinician, scheduler, and patient',
      'Appeal workflow when an initial denial is challenged',
    ],
    currentStateInputsRequired: [
      'Top authorization-volume service categories and payer mix',
      'Current authorization turnaround time and denial rate baseline by service category',
      'Existing authorization vendor / partner contract and integration model',
      'Clinical policy library currently referenced by clinicians and authorization staff',
    ],
    dataSourcesRequired: [
      'EHR order, encounter, and clinical note data for evidence packet assembly',
      'Payer policy and medical necessity criteria (publicly published clinical policy where available)',
      'Prior authorization request and response history (including denials and appeals)',
      'Eligibility and benefits data via X12 270/271 or payer API',
      'Pharmacy data for medication-related authorizations',
    ],
    architectureBuildingBlocks: [
      'Authorization-requirement detection at order entry against payer rules',
      'Evidence packet assembly engine pulling structured and unstructured chart data',
      'Clinical policy mapping layer aligning ordered service to applicable payer clinical policy',
      'Submission and status integration with the payer workflow (X12 278, payer APIs, FHIR Da Vinci PAS where available)',
      'Clinician and patient status surface with appeal-ready evidence trail',
    ],
    vendorStartupConsiderations: [
      'Prior authorization automation platforms (category) for end-to-end orchestration',
      'Clinical NLP platforms (category) for evidence packet assembly',
      'Payer connectivity vendors (category) for X12 / FHIR submission rails',
      'Clinical policy intelligence vendors (category) for payer policy alignment',
    ],
    buildBuyPartnerConsiderations: [
      'Buy the connectivity layer; X12 / FHIR rails are commodity and not a differentiator',
      'Partner with payers on shared clinical policy publication and Da Vinci PAS adoption',
      'Build internal evidence packet assembly only where the tenant has unique chart-mining capability and a sustained engineering team',
    ],
    governanceRiskConsiderations: [
      'Clinician sign-off remains required on every clinical statement asserted in the evidence packet',
      'Audit trail captures the cited evidence, the applicable clinical policy version, and the payer workflow response',
      'Bias and accuracy monitoring across service category, payer, and patient demographic cohorts',
      'PHI handling and minimum-necessary scope across the assembly and submission pipeline',
    ],
    valueMetrics: [
      'Authorization turnaround time from order to decision',
      'First-pass approval rate by service category and payer',
      'Administrative hours per authorization vs. baseline',
      'Care-delay days attributable to authorization friction',
      'Appeal overturn rate when initial denial is challenged',
    ],
    requiredWorkshops: [
      'Authorization current state and payer-mix discovery',
      'Clinical policy alignment and evidence packet design workshop',
      'Payer workflow integration and connectivity readiness review',
    ],
    smesRequired: [
      'Revenue cycle leader with authorization scope',
      'Practicing physician representative across high-authorization-volume service lines',
      'Authorization operations lead',
      'Payer relations / contracting lead',
      'Compliance and privacy officer',
    ],
    deliverablesGenerated: [
      'Service-category and payer prioritization plan',
      'Evidence packet assembly design with citation rules',
      'Clinical policy alignment runbook by top payers',
      'Payer workflow integration and rollout plan',
    ],
    patternsUsed: [
      'evidence_chain_gap',
      'gate_governance_gap',
      'program_context_sparsity',
    ],
    createdFrom: 'deterministic_healthcare_archetype_pack',
  },
  clinical_documentation_improvement: {
    key: 'clinical_documentation_improvement',
    name: 'Clinical documentation improvement',
    clinicalBusinessProblem:
      'Inpatient and outpatient documentation often fails to capture the full clinical picture supporting case-mix index, severity of illness, risk of mortality, and quality measures; CDI specialists cannot review every chart; queries are reactive, late, and frustrate clinicians.',
    workflowImpacted: [
      'Concurrent CDI review workflow during the inpatient stay',
      'Pre-bill review workflow before claim assembly',
      'Clinician query workflow and response loop',
      'Coding finalization workflow consuming CDI clarifications',
      'Quality reporting workflow consuming the documented severity and risk data',
    ],
    currentStateInputsRequired: [
      'Inpatient and outpatient case volume by service line',
      'Current CDI staffing model and review coverage rate',
      'Historical query rate, response rate, and agreement rate by clinician group',
      'Case-mix index and severity-of-illness baseline by service line',
    ],
    dataSourcesRequired: [
      'EHR clinical notes, problem list, and order data',
      'Lab, imaging, and diagnostics results data',
      'Claims and DRG history for downstream value attribution',
      'Quality reporting data (eCQM / HEDIS) for downstream value attribution',
    ],
    architectureBuildingBlocks: [
      'Clinical NLP layer surfacing documentation gaps tied to specific clinical evidence',
      'CDI specialist review queue with explainable rationale and prioritization',
      'Clinician-facing query workflow integrated into the EHR inbox',
      'Pre-bill quality and DRG validation layer feeding the coding workflow',
    ],
    vendorStartupConsiderations: [
      'CDI workflow platforms (category) for the specialist review queue',
      'Clinical NLP platforms (category) for documentation gap detection',
      'EHR-integrated clinician messaging extensions (category) for query delivery',
    ],
    buildBuyPartnerConsiderations: [
      'Buy the CDI workflow platform; the category is mature',
      'Partner on NLP-driven gap detection where a specialty vendor has a strong evidence base',
      'Build internal prioritization and value-attribution analytics where the tenant has unique service-line economics',
    ],
    governanceRiskConsiderations: [
      'Queries must cite specific clinical evidence; documentation must not be steered toward higher reimbursement without evidence',
      'Audit trail captures every query, the cited evidence, and the clinician response',
      'Clinician sign-off remains required on every documentation change',
      'Bias and accuracy monitoring across service lines, clinician groups, and patient demographics',
    ],
    valueMetrics: [
      'Case-mix index trend on reviewed cases vs. baseline',
      'Severity-of-illness and risk-of-mortality capture rate',
      'Query response rate and agreement rate',
      'CDI review coverage rate vs. total eligible cases',
      'Pre-bill DRG validation accuracy rate',
    ],
    requiredWorkshops: [
      'CDI current state and coverage-gap discovery',
      'Clinician query workflow and EHR integration design',
      'Service-line value attribution and governance review',
    ],
    smesRequired: [
      'CDI operations leader',
      'Practicing physician representative across high-volume service lines',
      'Coding operations lead',
      'Quality reporting lead',
      'Compliance officer',
    ],
    deliverablesGenerated: [
      'CDI coverage expansion plan by service line',
      'Query workflow and EHR integration design',
      'Pre-bill validation operating model',
      'Governance and audit-trail runbook',
    ],
    patternsUsed: [
      'evidence_chain_gap',
      'value_ledger_incompleteness',
    ],
    createdFrom: 'deterministic_healthcare_archetype_pack',
  },
  care_management_next_best_action: {
    key: 'care_management_next_best_action',
    name: 'Care management next best action',
    clinicalBusinessProblem:
      'Care management teams are overwhelmed by long member panels and finite outreach capacity; outreach is often calendar-driven rather than risk-driven; the next best action for a given member is opaque without integrating clinical, claims, ADT, and social context.',
    workflowImpacted: [
      'Member stratification and panel assignment workflow',
      'Care manager daily worklist and outreach prioritization',
      'In-visit and in-call decision support during member contact',
      'Closed-loop referral workflow to community and social-needs partners',
      'Outcome measurement workflow tying outreach to clinical and utilization outcomes',
    ],
    currentStateInputsRequired: [
      'Care management panel size and assignment model',
      'Historical outreach volume, contact rate, and engagement rate baseline',
      'Current stratification model and inputs',
      'Existing community and social-needs referral partner network',
    ],
    dataSourcesRequired: [
      'EHR clinical notes, problem list, and care plan data',
      'Claims history (medical and pharmacy) for the attributed population',
      'ADT feeds for admission, discharge, and ED utilization signals',
      'Care management platform interaction history',
      'Social determinants of health intake data and community-resource directories',
    ],
    architectureBuildingBlocks: [
      'Member risk and rising-risk stratification layer combining clinical, claims, ADT, and SDOH signals',
      'Next-best-action engine producing a prioritized worklist with rationale',
      'Care-manager workspace integration surfacing the rationale and history',
      'Closed-loop referral integration to community and social-needs partners',
      'Outcome measurement layer tying actions to clinical and utilization outcomes',
    ],
    vendorStartupConsiderations: [
      'Population health platforms (category) for stratification and worklist',
      'Care management workflow platforms (category) for the care-manager workspace',
      'Closed-loop referral platforms (category) for community partner integration',
      'SDOH data and analytics vendors (category) for social-needs context',
    ],
    buildBuyPartnerConsiderations: [
      'Buy the stratification and worklist platform when the tenant lacks a sustained data-science team',
      'Partner with community-based organizations on closed-loop referral interoperability',
      'Build internal outcome-attribution analytics where the tenant has unique value-based-care contracts requiring it',
    ],
    governanceRiskConsiderations: [
      'Stratification fairness review across demographics and language preference',
      'Audit trail captures every recommended action, the rationale, and the member-level disposition',
      'Care manager sign-off remains required on every action taken; the engine recommends, it does not act unilaterally',
      'PHI handling and minimum-necessary scope across the stratification and outreach pipeline',
    ],
    valueMetrics: [
      'Engagement rate on outreach vs. baseline',
      'Avoidable admission and ED utilization rate trend',
      'Care plan adherence rate trend',
      'Closed-loop referral completion rate',
      'Care manager outreach-to-outcome ratio',
    ],
    requiredWorkshops: [
      'Care management current state and panel-stratification discovery',
      'Care-manager workspace and worklist design',
      'Closed-loop referral and SDOH partner alignment workshop',
    ],
    smesRequired: [
      'Care management operations leader',
      'Practicing physician representative for primary care and complex care',
      'Population health analytics lead',
      'Community partnership / SDOH lead',
      'Compliance and privacy officer',
    ],
    deliverablesGenerated: [
      'Member stratification model design and validation plan',
      'Care-manager worklist and workspace design',
      'Closed-loop referral integration plan',
      'Outcome-attribution measurement plan',
    ],
    patternsUsed: [
      'value_ledger_incompleteness',
      'program_context_sparsity',
    ],
    createdFrom: 'deterministic_healthcare_archetype_pack',
  },
  patient_access_scheduling_optimization: {
    key: 'patient_access_scheduling_optimization',
    name: 'Patient access scheduling optimization',
    clinicalBusinessProblem:
      'Patient access workflows leak revenue and erode patient experience: high call abandonment, long time-to-third-next-available appointment, suboptimal slot utilization, and template inflexibility that no human scheduling team can resolve at scale.',
    workflowImpacted: [
      'Inbound scheduling call and digital self-service workflow',
      'Provider template design and slot-allocation workflow',
      'No-show prediction and overbooking workflow',
      'Referral-to-scheduled-appointment conversion workflow',
      'Pre-visit preparation and patient communication workflow',
    ],
    currentStateInputsRequired: [
      'Call center volume, abandonment, and answer-time baseline',
      'Time-to-third-next-available baseline by specialty and location',
      'Slot utilization, no-show rate, and same-day cancellation baseline',
      'Existing scheduling vendor / EHR scheduling configuration inventory',
    ],
    dataSourcesRequired: [
      'EHR scheduling and template data',
      'Call center telephony and digital channel interaction data',
      'Referral data from internal and external referring sources',
      'Historical no-show and cancellation outcome data',
      'Patient demographic and contact-preference data',
    ],
    architectureBuildingBlocks: [
      'Demand and supply forecasting layer combining historical scheduling and referral signals',
      'Slot-allocation and template optimization engine',
      'No-show prediction layer with member-level rationale',
      'Digital self-service surface integrated with EHR scheduling',
      'Outbound communication orchestration layer with patient-preference routing',
    ],
    vendorStartupConsiderations: [
      'Patient access platforms (category) for digital self-service',
      'Scheduling optimization vendors (category) for slot-allocation engines',
      'Communication orchestration vendors (category) for patient outreach',
      'Conversational AI vendors (category) for inbound call automation where appropriate',
    ],
    buildBuyPartnerConsiderations: [
      'Buy the digital self-service surface; the category is mature and patient-experience driven',
      'Partner with the EHR vendor where deep template integration is required',
      'Build internal demand-and-supply forecasting only where the tenant has unique service-line economics and a sustained analytics team',
    ],
    governanceRiskConsiderations: [
      'Fairness review on no-show prediction across demographics and language preference; predictions must not result in inequitable scheduling treatment',
      'Audit trail captures predictions, scheduling decisions, and patient communications',
      'Patient consent and contact-preference handling across digital and outbound channels',
      'Accessibility review on the digital self-service surface',
    ],
    valueMetrics: [
      'Time-to-third-next-available appointment trend',
      'Slot utilization and no-show rate trend',
      'Call abandonment and digital self-service share trend',
      'Referral-to-scheduled-appointment conversion rate',
      'Patient access experience score trend',
    ],
    requiredWorkshops: [
      'Patient access current state and channel-mix discovery',
      'Template and slot-allocation design workshop',
      'Digital self-service and patient experience review',
    ],
    smesRequired: [
      'Patient access operations leader',
      'Specialty practice manager representative across high-volume service lines',
      'EHR scheduling configuration lead',
      'Patient experience leader',
      'Compliance and accessibility officer',
    ],
    deliverablesGenerated: [
      'Channel-mix and self-service strategy plan',
      'Template and slot-allocation redesign plan',
      'No-show prediction governance and rollout plan',
      'Patient communication orchestration design',
    ],
    patternsUsed: [
      'program_context_sparsity',
      'value_ledger_incompleteness',
    ],
    createdFrom: 'deterministic_healthcare_archetype_pack',
  },
  revenue_integrity_ai: {
    key: 'revenue_integrity_ai',
    name: 'Revenue integrity AI',
    clinicalBusinessProblem:
      'Revenue leakage from charge capture gaps, denials, and underpayment is endemic; revenue integrity teams cannot review every claim; existing rule-based edits miss subtle, context-dependent leakage; denial management is reactive and labor-intensive.',
    workflowImpacted: [
      'Charge capture review workflow before claim assembly',
      'Pre-bill edit and scrubber workflow',
      'Denial root-cause analysis and prevention workflow',
      'Underpayment detection and recovery workflow',
      'Contract modeling and payer performance workflow',
    ],
    currentStateInputsRequired: [
      'Net revenue and revenue-leakage baseline by service line and payer',
      'Denial rate, denial-overturn rate, and write-off baseline',
      'Underpayment rate and recovery rate baseline',
      'Existing revenue integrity vendor / partner contract inventory',
    ],
    dataSourcesRequired: [
      'EHR encounter, order, and clinical note data',
      'Charge master and chargemaster reference data',
      'Claims and remittance data (835 / 837)',
      'Payer contract terms and reimbursement schedules',
      'Historical denial and appeal outcome data',
    ],
    architectureBuildingBlocks: [
      'Charge capture gap detection layer combining EHR, charge master, and claim signals',
      'Denial root-cause classification layer with explainable rationale',
      'Underpayment detection layer modeling expected reimbursement against contract terms',
      'Pre-bill scrubber augmentation layer adding context-aware edits to existing rule sets',
      'Revenue integrity workspace surfacing prioritized work with explainable rationale',
    ],
    vendorStartupConsiderations: [
      'Revenue integrity platforms (category) for charge capture and underpayment detection',
      'Denial management workflow vendors (category) for the workspace and prevention loop',
      'Contract modeling vendors (category) for expected-reimbursement analytics',
      'Claims clearinghouse vendors (category) for data and connectivity',
    ],
    buildBuyPartnerConsiderations: [
      'Buy the platform layer when the tenant lacks a sustained revenue integrity engineering team',
      'Partner with the EHR vendor where deep charge capture integration is required',
      'Build internal contract modeling only where the tenant has unusually complex value-based-care arrangements',
    ],
    governanceRiskConsiderations: [
      'Charge capture gap detection must require evidence; the workflow must not encourage upcoding without documentation',
      'Audit trail captures every recommended edit, the cited evidence, and the disposition',
      'Reviewer sign-off remains required on every charge change',
      'Bias and accuracy monitoring across service lines and payer mix',
    ],
    valueMetrics: [
      'Net revenue per encounter and per service line',
      'Denial rate and denial-overturn rate trend',
      'Underpayment recovery rate trend',
      'Pre-bill scrubber catch rate vs. baseline',
      'Revenue integrity reviewer hours per case',
    ],
    requiredWorkshops: [
      'Revenue cycle current state and leakage discovery',
      'Charge capture and denial-prevention workflow design',
      'Contract modeling and payer performance review',
    ],
    smesRequired: [
      'Revenue cycle leader',
      'Revenue integrity operations lead',
      'Denial management lead',
      'Contracting and payer relations lead',
      'Compliance officer',
    ],
    deliverablesGenerated: [
      'Leakage-source prioritization plan',
      'Charge capture and denial-prevention design',
      'Underpayment detection and recovery plan',
      'Governance and audit-trail runbook',
    ],
    patternsUsed: [
      'evidence_chain_gap',
      'value_ledger_incompleteness',
    ],
    createdFrom: 'deterministic_healthcare_archetype_pack',
  },
  population_health_analytics: {
    key: 'population_health_analytics',
    name: 'Population health analytics',
    clinicalBusinessProblem:
      'Value-based-care contracts demand defensible population-level performance reporting and rising-risk identification; analytics estates are fragmented across EHR, claims, and pharmacy data; quality and total cost of care performance cannot be reconciled against contract definitions in a timely way.',
    workflowImpacted: [
      'Attributed-population definition and reconciliation workflow',
      'Quality measure capture and gap-closure workflow',
      'Total cost of care monitoring and variance review workflow',
      'Rising-risk identification and intervention assignment workflow',
      'Performance reporting workflow to payers and to internal leadership',
    ],
    currentStateInputsRequired: [
      'Active value-based-care contract inventory and definitions',
      'Attributed population baseline by contract and by line of business',
      'Quality measure performance baseline by measure family',
      'Total cost of care baseline by contract',
    ],
    dataSourcesRequired: [
      'EHR clinical and demographic data',
      'Claims (medical and pharmacy) data for the attributed populations',
      'ADT feeds for utilization signals',
      'Quality measure source data (eCQM / HEDIS feeds)',
      'Contract definitions and attribution rules',
    ],
    architectureBuildingBlocks: [
      'Attributed-population reconciliation layer aligning EHR and claims to contract definitions',
      'Quality measure capture layer with measure-family explainability',
      'Total cost of care analytics layer with variance attribution',
      'Rising-risk identification layer integrating clinical, claims, and ADT signals',
      'Performance reporting layer with versioned definitions and audit trail',
    ],
    vendorStartupConsiderations: [
      'Population health analytics platforms (category) for attribution and quality',
      'Quality measure engines (category) for eCQM / HEDIS computation',
      'Total cost of care analytics vendors (category) for variance attribution',
      'Contract intelligence vendors (category) for contract-definition reconciliation',
    ],
    buildBuyPartnerConsiderations: [
      'Buy the quality measure engine; the category is mature and certification-driven',
      'Partner with the payer on attribution reconciliation where the contract permits',
      'Build internal contract-definition reconciliation only where the tenant has unusually complex value-based-care arrangements',
    ],
    governanceRiskConsiderations: [
      'Attribution reconciliation must be auditable and version-controlled',
      'Quality measure computation must use certified sources; the workflow must not adjust definitions without governance',
      'Bias and accuracy monitoring across demographics and line of business',
      'PHI handling and minimum-necessary scope across the analytics estate',
    ],
    valueMetrics: [
      'Quality measure performance trend by measure family',
      'Total cost of care variance vs. contract benchmark',
      'Rising-risk-to-intervention conversion rate',
      'Attribution reconciliation cycle time',
      'Performance reporting cycle time vs. contract requirement',
    ],
    requiredWorkshops: [
      'Value-based-care contract current state and attribution discovery',
      'Quality measure capture and gap-closure design',
      'Total cost of care variance review and intervention design',
    ],
    smesRequired: [
      'Population health leader',
      'Value-based-care contracting lead',
      'Quality reporting lead',
      'Population health analytics lead',
      'Compliance officer',
    ],
    deliverablesGenerated: [
      'Attribution reconciliation plan by contract',
      'Quality measure gap-closure plan by measure family',
      'Total cost of care variance review operating model',
      'Performance reporting governance and audit-trail runbook',
    ],
    patternsUsed: [
      'value_ledger_incompleteness',
      'evidence_chain_gap',
      'program_context_sparsity',
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
]) as ReadonlyArray<HealthcareAiArchetypeKey>;

// ---------------------------------------------------------------------
// Public exports
// ---------------------------------------------------------------------

export const HEALTHCARE_AI_ARCHETYPE_KEYS: ReadonlyArray<HealthcareAiArchetypeKey> =
  PACK_KEYS_IN_ORDER;

export const HEALTHCARE_AI_ARCHETYPES: Readonly<
  Record<HealthcareAiArchetypeKey, HealthcareAiArchetype>
> = PACK;

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
 * Recommend archetypes whose workflowImpacted entries contain any of
 * the caller's workflowKeywords (substring, case-insensitive) OR whose
 * valueMetrics entries contain any of the caller's valueDriverKeywords
 * (substring, case-insensitive). Pure. Order is canonical.
 */
export function recommendHealthcareAiArchetypes(input: {
  workflowKeywords?: ReadonlyArray<string>;
  valueDriverKeywords?: ReadonlyArray<string>;
}): ReadonlyArray<HealthcareAiArchetype> {
  const workflowKeywords = (input.workflowKeywords ?? []).map((k) => k.toLowerCase()).filter((k) => k.length > 0);
  const valueDriverKeywords = (input.valueDriverKeywords ?? []).map((k) => k.toLowerCase()).filter((k) => k.length > 0);
  if (workflowKeywords.length === 0 && valueDriverKeywords.length === 0) {
    return [];
  }
  return PACK_KEYS_IN_ORDER.map((k) => PACK[k]).filter((a) => {
    const workflowText = a.workflowImpacted.join(' | ').toLowerCase();
    const valueText = a.valueMetrics.join(' | ').toLowerCase();
    const workflowOverlap = workflowKeywords.some((kw) => workflowText.includes(kw));
    const valueOverlap = valueDriverKeywords.some((kw) => valueText.includes(kw));
    return workflowOverlap || valueOverlap;
  });
}

/**
 * Aggregate the unique workflows, architecture blocks, and required
 * workshops observed across the pack. Sorted ascending. Pure.
 */
export function summarizeHealthcareAiArchetypes(): HealthcareAiArchetypeSummary {
  const archetypes = PACK_KEYS_IN_ORDER.map((k) => PACK[k]);
  const workflows = new Set<string>();
  const blocks = new Set<string>();
  const workshops = new Set<string>();
  for (const a of archetypes) {
    for (const w of a.workflowImpacted) workflows.add(w);
    for (const b of a.architectureBuildingBlocks) blocks.add(b);
    for (const w of a.requiredWorkshops) workshops.add(w);
  }
  return {
    totalCount: archetypes.length,
    uniqueWorkflows: Array.from(workflows).sort(),
    uniqueArchitectureBlocks: Array.from(blocks).sort(),
    uniqueWorkshops: Array.from(workshops).sort(),
  };
}

// ---------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------

function isHealthcareAiArchetypeKey(value: string): value is HealthcareAiArchetypeKey {
  return (PACK_KEYS_IN_ORDER as ReadonlyArray<string>).includes(value);
}
