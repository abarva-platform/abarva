// Source Event Archetype registry.
//
// Add new archetypes here — NO Source core code change required. Each archetype
// declares its own evidence, vendor questions, RFP structure, pricing model,
// evaluation model, risk model, negotiation levers, deliverables, and gates.

import type { EvidenceFamilySpec, SourceEventArchetype } from './types';

// ── shared evidence families (referenced across archetypes) ──────────────────
const APPLICATION_INVENTORY: EvidenceFamilySpec = {
  key: 'application_inventory', label: 'Application & system inventory', kind: 'inventory',
  whyNeeded: 'Defines in-scope estate and tiers; without it scope and pricing are guesses.',
  sourceDocHint: 'CMDB export / application portfolio (CSV/XLSX)', acceptedFormats: ['csv', 'xlsx'],
  backing: { table: 'tower_cmdb_cis', keyColumn: 'tenant_key' },
  feedsMethods: ['transition_risk_model', 'data_migration_complexity'],
};
const RUN_COST_BASELINE: EvidenceFamilySpec = {
  key: 'run_cost_baseline', label: 'Current run cost baseline', kind: 'financial',
  whyNeeded: 'The independent cost basis for should-cost and savings claims.',
  sourceDocHint: 'IT financials / GL by tower (CSV/XLSX)', acceptedFormats: ['csv', 'xlsx'],
  backing: { table: 'tower_it_financials', keyColumn: 'tenant_key' }, feedsMethods: ['should_cost', 'tco_normalization'],
};
const CONTRACT_BASELINE: EvidenceFamilySpec = {
  key: 'contract_baseline', label: 'Current contract baseline', kind: 'commercial',
  whyNeeded: 'Establishes incumbent terms, rates, and exit conditions for leverage.',
  sourceDocHint: 'Current MSA/SOW + rate card (PDF/DOCX/XLSX)', acceptedFormats: ['pdf', 'docx', 'xlsx'],
  feedsMethods: ['tco_normalization', 'market_benchmark'],
};

const f = (s: EvidenceFamilySpec): EvidenceFamilySpec => s;

// ═════════════════════════════════════════════════════════════════════════════
// 1 · IT OUTSOURCING / AMS / MANAGED SERVICES
// ═════════════════════════════════════════════════════════════════════════════
export const AMS_MANAGED_SERVICES: SourceEventArchetype = {
  id: 'AMS_MANAGED_SERVICES',
  name: 'IT Outsourcing / AMS / Managed Services',
  description: 'Sourcing an application-management / managed-services partner across service towers.',
  version: '1.0.0', status: 'validated', eventType: 'ams',
  applicableSpendCategories: ['application_management', 'managed_services', 'infrastructure_operations'],
  requiredEvidenceFamilies: [
    APPLICATION_INVENTORY,
    f({ key: 'service_tower_scope', label: 'Service tower scope', kind: 'inventory', whyNeeded: 'Towers define the unit of service, SLA, and pricing.', sourceDocHint: 'Tower scope matrix (XLSX)', acceptedFormats: ['xlsx', 'csv'], feedsMethods: ['retained_org_sizing'] }),
    RUN_COST_BASELINE,
    f({ key: 'ticket_volumes', label: 'Ticket volumes (L1/L2/L3)', kind: 'metric_baseline', whyNeeded: 'Drives resource-unit pricing and shift coverage.', sourceDocHint: 'ServiceNow ticket export (CSV)', acceptedFormats: ['csv', 'xlsx'], backing: { table: 'tower_incidents', keyColumn: 'tenant_key' }, feedsMethods: ['should_cost'] }),
    f({ key: 'incident_problem_change', label: 'Incident / problem / change data', kind: 'metric_baseline', whyNeeded: 'Baselines service health and SLA gap.', sourceDocHint: 'ITSM export (CSV)', acceptedFormats: ['csv'], feedsMethods: ['sla_gap'] }),
    f({ key: 'sla_baseline', label: 'SLA baseline', kind: 'metric_baseline', whyNeeded: 'Sets the service bar the partner must beat.', sourceDocHint: 'Current SLA schedule (PDF/XLSX)', acceptedFormats: ['pdf', 'xlsx'], feedsMethods: ['sla_gap'] }),
    f({ key: 'staffing_baseline', label: 'Staffing baseline + onshore/offshore mix', kind: 'org', whyNeeded: 'Should-cost and retained-org sizing.', sourceDocHint: 'Org/staffing roster (XLSX)', acceptedFormats: ['xlsx', 'csv'], feedsMethods: ['should_cost', 'retained_org_sizing'] }),
    f({ key: 'tooling_landscape', label: 'Tooling landscape', kind: 'inventory', whyNeeded: 'Automation/productivity baseline and licensing handover.', sourceDocHint: 'Tooling inventory (CSV)', acceptedFormats: ['csv'] }),
    CONTRACT_BASELINE,
    f({ key: 'transition_constraints', label: 'Transition constraints', kind: 'qualitative', whyNeeded: 'Sizes transition risk and parallel-run gates.', sourceDocHint: 'Transition constraints memo (DOCX)', acceptedFormats: ['docx', 'pdf'], feedsMethods: ['transition_risk_model'] }),
    f({ key: 'retained_org_model', label: 'Retained organization model', kind: 'org', whyNeeded: 'Governance/vendor-mgmt the buyer keeps in-house.', sourceDocHint: 'Retained-org design (DOCX/XLSX)', acceptedFormats: ['docx', 'xlsx'], feedsMethods: ['retained_org_sizing'] }),
  ],
  optionalEvidenceFamilies: [
    f({ key: 'vendor_performance', label: 'Incumbent vendor performance', kind: 'metric_baseline', whyNeeded: 'Quantifies incumbent leverage / dissatisfaction.', sourceDocHint: 'Vendor scorecards (XLSX)', acceptedFormats: ['xlsx'] }),
  ],
  requiredStakeholders: ['CIO', 'Head of IT Operations', 'Procurement / Vendor Management', 'Enterprise Architecture', 'Finance (run-cost owner)', 'Retained-org lead'],
  sourcingStrategyQuestions: [
    'Which towers do we outsource vs retain, and why?',
    'What is our should-cost by tower, and where is the incumbent above it?',
    'What productivity / automation glide-path do we require year over year?',
    'What retained organization must we stand up to govern the partner?',
    'What is our transition risk and parallel-run requirement?',
  ],
  vendorDiscussionGuide: {
    topics: ['Tower delivery model', 'Resource units & shift coverage', 'Automation/productivity commitments', 'SLA + credits regime', 'Transition & knowledge transfer', 'Termination assistance'],
    ask: ['Show your resource-unit definition and how it flexes with volume', 'What automation/productivity glide-path will you commit to, with credits?', 'How do you price transition, and what is at risk if milestones slip?', 'What termination-assistance terms will you sign?'],
    doNotRevealYet: ['Our internal should-cost number', 'Our walk-away / retained-cost position', 'The incumbent’s current rates'],
    likelyPushback: ['Resisting volume-band pricing in favor of fixed FTE', 'Soft productivity commitments without credits', 'Capping termination assistance'],
    challengeAssumptions: ['Assumed ticket volumes only ever grow', 'Assumed offshore ratio without quality evidence', 'One-time transition cost with no ramp risk'],
  },
  rfpDocumentStructure: [
    { key: 'exec_overview', title: 'Executive overview', required: true, evidenceDependencies: [] },
    { key: 'service_towers', title: 'Scope of services by tower', required: true, evidenceDependencies: ['service_tower_scope', 'application_inventory'] },
    { key: 'current_state', title: 'Current-state context (volumes, cost, SLA)', required: true, evidenceDependencies: ['ticket_volumes', 'run_cost_baseline', 'sla_baseline'] },
    { key: 'sla_kpi', title: 'SLA / KPI schedule + credits', required: true, evidenceDependencies: ['sla_baseline'] },
    { key: 'resource_units', title: 'Resource-unit & pricing schedule', required: true, evidenceDependencies: ['ticket_volumes', 'staffing_baseline'] },
    { key: 'productivity', title: 'Productivity & automation commitments', required: true, evidenceDependencies: ['tooling_landscape'] },
    { key: 'transition', title: 'Transition & knowledge-transfer requirements', required: true, evidenceDependencies: ['transition_constraints'] },
    { key: 'retained_org', title: 'Retained-organization & governance model', required: true, evidenceDependencies: ['retained_org_model'] },
    { key: 'security', title: 'Security / compliance requirements', required: true, evidenceDependencies: [] },
    { key: 'commercial_terms', title: 'Commercial terms appendix (rate card, COLA, audit rights)', required: true, evidenceDependencies: ['contract_baseline'] },
    { key: 'response_instructions', title: 'Response instructions & evaluation criteria', required: true, evidenceDependencies: [] },
  ],
  pricingModel: {
    model: 'resource-unit + ticket-band with productivity glide-path',
    costComponents: ['resource units by tower', 'shift coverage premium', 'transition (one-time)', 'tooling/licensing', 'COLA/indexation', 'gainshare'],
    traps: ['FTE pricing that does not flex down with volume/automation', 'Soft productivity with no credits', 'Hidden transition labor', 'Uncapped COLA'],
    shouldCost: true,
  },
  evaluationModel: {
    criteria: [
      { key: 'service_capability', label: 'Service capability & SLA credibility', weight: 0.30 },
      { key: 'price', label: 'Normalized price / should-cost gap', weight: 0.30 },
      { key: 'transition', label: 'Transition & retained-org fit', weight: 0.15 },
      { key: 'productivity', label: 'Automation / productivity commitment', weight: 0.15 },
      { key: 'risk', label: 'Delivery & concentration risk', weight: 0.10 },
    ],
    disqualifiers: ['No committed SLA credits', 'No termination-assistance terms', 'Cannot evidence comparable tower-scale delivery'],
  },
  riskModel: {
    dimensions: ['transition risk', 'concentration risk', 'productivity-shortfall risk', 'retained-org capability gap', 'offshore quality risk'],
    contractProtections: ['SLA credits', 'productivity glide-path with credits', 'termination assistance', 'benchmarking clause', 'audit rights', 'rate-card transparency'],
  },
  negotiationLevers: [
    { key: 'volume_band', label: 'Volume-band pricing', rationale: 'Forces price to flex down as volume/automation reduces tickets.', timing: 'rfp' },
    { key: 'productivity_glidepath', label: 'Productivity glide-path with credits', rationale: 'Captures automation savings the buyer would otherwise forfeit.', timing: 'bafo' },
    { key: 'incumbent_leverage', label: 'Incumbent dissatisfaction / multi-bidder tension', rationale: 'Credible switch threat compresses price.', timing: 'pre_rfp' },
    { key: 'termination_assistance', label: 'Termination assistance + exit rates', rationale: 'Protects the next transition and caps lock-in.', timing: 'final_contracting' },
  ],
  deliverablePack: [
    { key: 'ams_strategy_memo', label: 'AMS Sourcing Strategy Memo', stage: 'strategy', audience: 'CIO · Sponsor', sections: ['Objective', 'Tower retain/outsource decision', 'Should-cost summary', 'Productivity targets', 'Transition posture'], qualityBar: { minSections: 5, requiresCitations: true, altitude: 'exec', rubric: ['Names this client’s towers/volumes (not generic)', 'Every cost claim cited or marked missing', 'Productivity stated as a glide-path, not a point'] }, formats: ['html', 'docx'], gateArtifact: true },
    { key: 'ams_rfp', label: 'AMS RFP (tower-structured)', stage: 'rfp', audience: 'Vendors', sections: ['Service towers', 'SLA/KPI schedule', 'Resource-unit pricing', 'Productivity commitments', 'Transition', 'Retained-org', 'Commercial terms'], qualityBar: { minSections: 7, requiresCitations: true, altitude: 'full', rubric: ['Tower-structured, not generic', 'Volumes/cost cited from evidence', 'Pricing schedule = resource-unit + band'] }, formats: ['docx', 'pdf', 'xlsx'], gateArtifact: true },
    { key: 'ams_negotiation_memo', label: 'AMS Pricing & Negotiation Memo', stage: 'bafo', audience: 'CIO · Procurement', sections: ['Should-cost vs proposals', 'Lever plan', 'BAFO asks by vendor', 'Walk-away'], qualityBar: { minSections: 4, requiresCitations: true, altitude: 'exec', rubric: ['Vendor-specific asks', 'Should-cost cited', 'Walk-away stated'] }, formats: ['html', 'docx'] },
  ],
  gateCriteria: [
    { key: 'ams_scope_evidenced', describe: 'Tower scope + volumes + run-cost are usable evidence before RFP.', fromStage: 'scope', toStage: 'rfp', severity: 'hard' },
    { key: 'ams_pricing_normalized', describe: 'Proposals normalized to should-cost before BAFO.', fromStage: 'pricing', toStage: 'bafo', severity: 'hard' },
  ],
  agentGuidance: {
    systemFraming: 'This is an IT outsourcing / AMS managed-services sourcing event. Reason over committed application inventory, ticket volumes, run cost, SLA, staffing, and contract evidence. Never assert a savings number without committed run-cost + should-cost evidence; never assert an SLA gap without committed incident data; name missing evidence explicitly.',
    keyQuestions: ['What is the should-cost by tower?', 'Where is the incumbent above should-cost?', 'What productivity glide-path is defensible?', 'What retained org must we stand up?'],
    requiresGroundedAnswer: true,
  },
  stageModel: [
    { stage: 'strategy', requiredEvidence: [{ family: 'run_cost_baseline', severity: 'hard' }, { family: 'service_tower_scope', severity: 'hard' }], analysisMethods: ['should_cost'], deliverables: ['ams_strategy_memo'] },
    { stage: 'scope', requiredEvidence: [{ family: 'application_inventory', severity: 'hard' }, { family: 'ticket_volumes', severity: 'hard' }, { family: 'sla_baseline', severity: 'hard' }, { family: 'staffing_baseline', severity: 'hard' }], analysisMethods: ['sla_gap', 'retained_org_sizing'], deliverables: [] },
    { stage: 'rfp', requiredEvidence: [{ family: 'service_tower_scope', severity: 'hard' }, { family: 'sla_baseline', severity: 'hard' }, { family: 'transition_constraints', severity: 'soft' }], analysisMethods: [], deliverables: ['ams_rfp'] },
    { stage: 'pricing', requiredEvidence: [{ family: 'run_cost_baseline', severity: 'hard' }, { family: 'contract_baseline', severity: 'soft' }], analysisMethods: ['tco_normalization', 'should_cost'], deliverables: [] },
    { stage: 'bafo', requiredEvidence: [], analysisMethods: ['market_benchmark'], deliverables: ['ams_negotiation_memo'] },
  ],
};

// ═════════════════════════════════════════════════════════════════════════════
// 2 · ERP / WORKDAY / SAP / ORACLE — SI IMPLEMENTATION SELECTION
// ═════════════════════════════════════════════════════════════════════════════
export const ERP_SI_IMPLEMENTATION: SourceEventArchetype = {
  id: 'ERP_SI_IMPLEMENTATION',
  name: 'ERP / SI Implementation Partner Selection',
  description: 'Selecting a systems integrator to implement/migrate an ERP (SAP/Oracle/Workday).',
  version: '1.0.0', status: 'validated', eventType: 'enterprise_software',
  applicableSpendCategories: ['systems_integration', 'enterprise_software', 'transformation'],
  requiredEvidenceFamilies: [
    f({ key: 'current_erp_landscape', label: 'Current ERP landscape', kind: 'inventory', whyNeeded: 'Defines the as-is and migration source.', sourceDocHint: 'ERP module/landscape map (XLSX/DOCX)', acceptedFormats: ['xlsx', 'docx'] }),
    f({ key: 'transformation_scope', label: 'Target transformation scope', kind: 'document', whyNeeded: 'Bounds the SI engagement.', sourceDocHint: 'Transformation scope memo (DOCX)', acceptedFormats: ['docx', 'pdf'] }),
    f({ key: 'process_inventory', label: 'Process inventory', kind: 'process', whyNeeded: 'Sizes configuration vs reengineering effort.', sourceDocHint: 'Process catalog (XLSX)', acceptedFormats: ['xlsx', 'csv'] }),
    f({ key: 'integration_landscape', label: 'Integration landscape', kind: 'inventory', whyNeeded: 'Integrations dominate SI risk and cost.', sourceDocHint: 'Integration inventory (XLSX)', acceptedFormats: ['xlsx'], feedsMethods: ['data_migration_complexity'] }),
    f({ key: 'data_migration_scope', label: 'Data migration complexity', kind: 'inventory', whyNeeded: 'Migration is the top SI failure mode.', sourceDocHint: 'Data object inventory (XLSX)', acceptedFormats: ['xlsx'], feedsMethods: ['data_migration_complexity'] }),
    f({ key: 'customization_inventory', label: 'Customization inventory', kind: 'inventory', whyNeeded: 'Drives clean-core vs custom decisions.', sourceDocHint: 'RICEFW / customization list (XLSX)', acceptedFormats: ['xlsx'], feedsMethods: ['data_migration_complexity'] }),
    f({ key: 'rollout_scope', label: 'Geographic / entity rollout scope', kind: 'document', whyNeeded: 'Waves drive timeline and staffing.', sourceDocHint: 'Rollout plan (DOCX/XLSX)', acceptedFormats: ['docx', 'xlsx'] }),
    f({ key: 'business_readiness', label: 'Business / change readiness', kind: 'qualitative', whyNeeded: 'Adoption risk; SIs over-promise here.', sourceDocHint: 'Change-readiness assessment (DOCX)', acceptedFormats: ['docx'] }),
  ],
  optionalEvidenceFamilies: [
    f({ key: 'si_delivery_expectations', label: 'SI delivery-model expectations', kind: 'qualitative', whyNeeded: 'Onshore/offshore, agile/waterfall, fixed/T&M.', sourceDocHint: 'Delivery expectations memo (DOCX)', acceptedFormats: ['docx'] }),
    f({ key: 'testing_cutover', label: 'Testing / cutover expectations', kind: 'qualitative', whyNeeded: 'Cutover is the go-live risk gate.', sourceDocHint: 'Cutover strategy (DOCX)', acceptedFormats: ['docx'] }),
  ],
  requiredStakeholders: ['CIO', 'CFO / Process owners', 'Programme Director', 'Enterprise Architecture', 'Data / Integration lead', 'Change management lead'],
  sourcingStrategyQuestions: [
    'What is clean-core scope vs custom, and who owns the trade-off?',
    'How complex is data migration and integration, and how do we de-risk it?',
    'What delivery model (fixed-price vs T&M vs blended) fits our risk posture?',
    'What rollout wave sequence balances speed and risk?',
    'How do we hold the SI accountable for adoption, not just go-live?',
  ],
  vendorDiscussionGuide: {
    topics: ['Delivery methodology', 'Data migration approach', 'Integration ownership', 'Testing & cutover', 'Staffing model & continuity', 'Fixed-price vs T&M split'],
    ask: ['Show comparable implementations at our scale/complexity', 'Who owns data migration risk, and how is it priced?', 'What is your named-team continuity commitment?', 'What is fixed-price vs T&M, and what triggers change orders?'],
    doNotRevealYet: ['Our internal budget ceiling', 'Our flexibility on go-live date', 'Our willingness to accept custom'],
    likelyPushback: ['Pushing T&M to shift risk to buyer', 'Excluding data migration from fixed price', 'Junior bench after sales team'],
    challengeAssumptions: ['Assumed clean-core with no custom', 'Assumed business readiness without evidence', 'Optimistic cutover with no dress rehearsals'],
  },
  rfpDocumentStructure: [
    { key: 'exec_overview', title: 'Executive overview', required: true, evidenceDependencies: [] },
    { key: 'process_scope', title: 'Process scope & clean-core boundary', required: true, evidenceDependencies: ['process_inventory', 'customization_inventory'] },
    { key: 'rollout_waves', title: 'Rollout waves & timeline', required: true, evidenceDependencies: ['rollout_scope'] },
    { key: 'integrations', title: 'Integration requirements & ownership', required: true, evidenceDependencies: ['integration_landscape'] },
    { key: 'data_migration', title: 'Data migration requirements', required: true, evidenceDependencies: ['data_migration_scope'] },
    { key: 'testing_cutover', title: 'Testing & cutover requirements', required: true, evidenceDependencies: ['testing_cutover'] },
    { key: 'change_adoption', title: 'Change management & adoption', required: true, evidenceDependencies: ['business_readiness'] },
    { key: 'staffing_model', title: 'SI staffing model & continuity', required: true, evidenceDependencies: [] },
    { key: 'commercial_terms', title: 'Commercial model (fixed-price vs T&M, change control)', required: true, evidenceDependencies: [] },
    { key: 'response_instructions', title: 'Response instructions & evaluation criteria', required: true, evidenceDependencies: [] },
  ],
  pricingModel: {
    model: 'fixed-price (defined scope) + T&M (variable) with change control',
    costComponents: ['fixed-price build', 'T&M for variable scope', 'data migration', 'integration build', 'hypercare', 'change orders'],
    traps: ['Data migration excluded from fixed price', 'Open-ended change orders', 'Hypercare priced as new phase', 'Blended rate hiding junior bench'],
    shouldCost: false,
  },
  evaluationModel: {
    criteria: [
      { key: 'delivery_credibility', label: 'Delivery credibility at comparable scale', weight: 0.30 },
      { key: 'methodology_risk', label: 'Methodology & data-migration de-risking', weight: 0.25 },
      { key: 'price', label: 'Total price & change-control discipline', weight: 0.20 },
      { key: 'team_continuity', label: 'Named-team continuity', weight: 0.15 },
      { key: 'adoption', label: 'Change & adoption commitment', weight: 0.10 },
    ],
    disqualifiers: ['No comparable-scale references', 'Data migration excluded from price', 'No named-team continuity'],
  },
  riskModel: {
    dimensions: ['data-migration risk', 'integration risk', 'scope-creep / change-order risk', 'adoption risk', 'team-continuity risk'],
    contractProtections: ['fixed-price for defined scope', 'change-control governance', 'named-team continuity clause', 'go-live acceptance criteria', 'hypercare included', 'liquidated damages for missed cutover'],
  },
  negotiationLevers: [
    { key: 'fixed_price_scope', label: 'Fixed-price the defined scope', rationale: 'Shifts delivery risk to the SI for the known scope.', timing: 'rfp' },
    { key: 'change_control', label: 'Change-control discipline', rationale: 'Caps the scope-creep margin SIs rely on.', timing: 'bafo' },
    { key: 'team_continuity', label: 'Named-team continuity with penalties', rationale: 'Prevents bait-and-switch after award.', timing: 'final_contracting' },
    { key: 'go_live_ld', label: 'Liquidated damages for cutover slip', rationale: 'Aligns the SI to the go-live, not the billable hour.', timing: 'final_contracting' },
  ],
  deliverablePack: [
    { key: 'erp_strategy_memo', label: 'ERP/SI Sourcing Strategy Memo', stage: 'strategy', audience: 'CIO · CFO · Sponsor', sections: ['Objective', 'Clean-core vs custom posture', 'Complexity assessment', 'Delivery-model decision', 'Rollout-wave sequence'], qualityBar: { minSections: 5, requiresCitations: true, altitude: 'exec', rubric: ['Names client processes/integrations', 'Complexity cited from inventory', 'Delivery model justified by risk'] }, formats: ['html', 'docx'], gateArtifact: true },
    { key: 'erp_rfp', label: 'ERP/SI RFP (implementation)', stage: 'rfp', audience: 'SI vendors', sections: ['Process scope', 'Rollout waves', 'Integrations', 'Data migration', 'Testing/cutover', 'Change/adoption', 'Staffing model', 'Commercial model'], qualityBar: { minSections: 8, requiresCitations: true, altitude: 'full', rubric: ['Implementation-structured, not AMS-style', 'Migration/integration cited', 'Fixed vs T&M boundary explicit'] }, formats: ['docx', 'pdf'], gateArtifact: true },
  ],
  gateCriteria: [
    { key: 'erp_complexity_assessed', describe: 'Migration/integration complexity assessed before RFP.', fromStage: 'scope', toStage: 'rfp', severity: 'hard' },
  ],
  agentGuidance: {
    systemFraming: 'This is an ERP / SI implementation partner selection. Reason over committed ERP landscape, process inventory, integration/data-migration/customization inventories, rollout scope, and readiness. Never assert effort/price without committed complexity evidence; name missing evidence.',
    keyQuestions: ['How complex is data migration/integration?', 'What clean-core vs custom posture?', 'What delivery model and rollout sequence?', 'How do we hold the SI to adoption and cutover?'],
    requiresGroundedAnswer: true,
  },
  stageModel: [
    { stage: 'strategy', requiredEvidence: [{ family: 'transformation_scope', severity: 'hard' }, { family: 'current_erp_landscape', severity: 'hard' }], analysisMethods: ['data_migration_complexity'], deliverables: ['erp_strategy_memo'] },
    { stage: 'scope', requiredEvidence: [{ family: 'process_inventory', severity: 'hard' }, { family: 'integration_landscape', severity: 'hard' }, { family: 'data_migration_scope', severity: 'hard' }, { family: 'customization_inventory', severity: 'hard' }], analysisMethods: ['data_migration_complexity'], deliverables: [] },
    { stage: 'rfp', requiredEvidence: [{ family: 'rollout_scope', severity: 'hard' }, { family: 'business_readiness', severity: 'soft' }], analysisMethods: [], deliverables: ['erp_rfp'] },
  ],
};

// ═════════════════════════════════════════════════════════════════════════════
// 3 · DATA / ANALYTICS / AI PLATFORM SOURCING
// ═════════════════════════════════════════════════════════════════════════════
export const AI_DATA_PLATFORM: SourceEventArchetype = {
  id: 'AI_DATA_PLATFORM',
  name: 'Data / Analytics / AI Platform Sourcing',
  description: 'Sourcing a data/analytics/AI platform (and/or implementation partner).',
  version: '1.0.0', status: 'validated', eventType: 'data_platform',
  applicableSpendCategories: ['data_platform', 'analytics', 'ai_platform'],
  requiredEvidenceFamilies: [
    f({ key: 'current_data_platform', label: 'Current data platform', kind: 'inventory', whyNeeded: 'As-is stack and migration source.', sourceDocHint: 'Data platform inventory (XLSX)', acceptedFormats: ['xlsx', 'docx'] }),
    f({ key: 'data_domains', label: 'Data domains & ownership', kind: 'inventory', whyNeeded: 'Scopes governance and integration.', sourceDocHint: 'Data domain catalog (XLSX)', acceptedFormats: ['xlsx', 'csv'] }),
    f({ key: 'governance_maturity', label: 'Data governance maturity', kind: 'qualitative', whyNeeded: 'Determines readiness for AI use.', sourceDocHint: 'Governance maturity assessment (DOCX)', acceptedFormats: ['docx'] }),
    f({ key: 'use_case_portfolio', label: 'Use-case portfolio', kind: 'document', whyNeeded: 'Value is realized through use cases, not the platform.', sourceDocHint: 'Use-case backlog (XLSX/DOCX)', acceptedFormats: ['xlsx', 'docx'], feedsMethods: ['consumption_forecast'] }),
    f({ key: 'model_tooling_requirements', label: 'Model / tooling requirements', kind: 'document', whyNeeded: 'Defines functional fit.', sourceDocHint: 'Requirements doc (DOCX)', acceptedFormats: ['docx'] }),
    f({ key: 'security_privacy_requirements', label: 'Security / privacy requirements', kind: 'document', whyNeeded: 'Non-negotiable for data/AI.', sourceDocHint: 'Security requirements (DOCX)', acceptedFormats: ['docx'] }),
    f({ key: 'integration_architecture', label: 'Integration architecture', kind: 'inventory', whyNeeded: 'Platform must fit the estate.', sourceDocHint: 'Integration map (XLSX)', acceptedFormats: ['xlsx'] }),
    f({ key: 'value_kpi_baseline', label: 'Value / KPI baseline', kind: 'metric_baseline', whyNeeded: 'Anchors value-tracking.', sourceDocHint: 'KPI baseline (XLSX)', acceptedFormats: ['xlsx'] }),
  ],
  optionalEvidenceFamilies: [
    f({ key: 'operating_model_readiness', label: 'Operating-model readiness', kind: 'qualitative', whyNeeded: 'Who runs the platform day-2.', sourceDocHint: 'Operating model (DOCX)', acceptedFormats: ['docx'] }),
  ],
  requiredStakeholders: ['CDO / CDAO', 'CIO', 'Enterprise / Data Architecture', 'CISO / Privacy', 'Business value owners', 'Procurement'],
  sourcingStrategyQuestions: [
    'What use cases drive value, and what platform capabilities do they require?',
    'What is our data-governance readiness, and what must improve first?',
    'Build vs buy vs partner for the platform and the use cases?',
    'What consumption model right-sizes commitment to real demand?',
    'How do we tie the contract to value/KPI realization?',
  ],
  vendorDiscussionGuide: {
    topics: ['Architecture fit', 'Data governance & lineage', 'Security/privacy & data residency', 'Consumption pricing', 'Model/tooling flexibility', 'Value realization support'],
    ask: ['How does your platform fit our integration architecture?', 'Show data-residency and no-training-on-our-data terms', 'How does consumption pricing protect us from runaway cost?', 'How do you commit to value, not just provisioning?'],
    doNotRevealYet: ['Our forecast consumption ceiling', 'Our build-vs-buy fallback', 'Our willingness to commit volume'],
    likelyPushback: ['Resisting consumption caps', 'Vague data-residency/training terms', 'Tying value to their professional services'],
    challengeAssumptions: ['Assumed governance maturity', 'Assumed use cases are AI-ready', 'Optimistic consumption forecast'],
  },
  rfpDocumentStructure: [
    { key: 'exec_overview', title: 'Executive overview', required: true, evidenceDependencies: [] },
    { key: 'use_cases', title: 'Use-case portfolio & required capabilities', required: true, evidenceDependencies: ['use_case_portfolio', 'model_tooling_requirements'] },
    { key: 'data_domains', title: 'Data domains & governance requirements', required: true, evidenceDependencies: ['data_domains', 'governance_maturity'] },
    { key: 'architecture', title: 'Target architecture & integration', required: true, evidenceDependencies: ['integration_architecture', 'current_data_platform'] },
    { key: 'security_privacy', title: 'Security / privacy / data-residency requirements', required: true, evidenceDependencies: ['security_privacy_requirements'] },
    { key: 'consumption_pricing', title: 'Consumption & commercial model', required: true, evidenceDependencies: ['use_case_portfolio'] },
    { key: 'value_tracking', title: 'Value / KPI tracking requirements', required: true, evidenceDependencies: ['value_kpi_baseline'] },
    { key: 'response_instructions', title: 'Response instructions & evaluation criteria', required: true, evidenceDependencies: [] },
  ],
  pricingModel: {
    model: 'platform (per-seat / per-capacity) + consumption with caps + optional services',
    costComponents: ['platform/seat', 'compute/consumption', 'storage', 'egress', 'professional services', 'support tier'],
    traps: ['Uncapped consumption', 'Egress lock-in', 'Value tied to mandatory services', 'Training-on-our-data ambiguity'],
    shouldCost: true,
  },
  evaluationModel: {
    criteria: [
      { key: 'capability_fit', label: 'Use-case capability fit', weight: 0.30 },
      { key: 'governance_security', label: 'Governance / security / residency', weight: 0.25 },
      { key: 'architecture_fit', label: 'Architecture & integration fit', weight: 0.15 },
      { key: 'price', label: 'Consumption-normalized price', weight: 0.20 },
      { key: 'value_support', label: 'Value-realization support', weight: 0.10 },
    ],
    disqualifiers: ['No data-residency / no-training guarantee', 'No consumption caps', 'Cannot evidence comparable use cases'],
  },
  riskModel: {
    dimensions: ['consumption-runaway risk', 'data-residency / privacy risk', 'lock-in / egress risk', 'governance-readiness risk', 'value-realization risk'],
    contractProtections: ['consumption caps / alerts', 'no-training-on-our-data', 'data-residency clause', 'egress terms', 'exit/portability', 'value-linked commercial terms'],
  },
  negotiationLevers: [
    { key: 'consumption_caps', label: 'Consumption caps & alerts', rationale: 'Protects against runaway AI/data cost.', timing: 'rfp' },
    { key: 'data_rights', label: 'No-training + data-residency', rationale: 'Non-negotiable data protection; high vendor sensitivity.', timing: 'rfp' },
    { key: 'value_linked', label: 'Value-linked commercial terms', rationale: 'Ties spend to realized KPI value.', timing: 'bafo' },
    { key: 'egress_exit', label: 'Egress / portability terms', rationale: 'Caps lock-in for the next platform decision.', timing: 'final_contracting' },
  ],
  deliverablePack: [
    { key: 'aidp_strategy_memo', label: 'AI/Data Platform Sourcing Strategy Memo', stage: 'strategy', audience: 'CDO · CIO · Sponsor', sections: ['Objective', 'Use-case value map', 'Governance readiness', 'Build/buy/partner', 'Consumption posture'], qualityBar: { minSections: 5, requiresCitations: true, altitude: 'exec', rubric: ['Names client data domains/use cases', 'Governance maturity cited', 'Consumption forecast grounded'] }, formats: ['html', 'docx'], gateArtifact: true },
    { key: 'aidp_rfp', label: 'AI/Data Platform RFP', stage: 'rfp', audience: 'Platform vendors', sections: ['Use cases', 'Data domains & governance', 'Architecture', 'Security/privacy/residency', 'Consumption pricing', 'Value tracking'], qualityBar: { minSections: 6, requiresCitations: true, altitude: 'full', rubric: ['Use-case + governance structured', 'Residency/no-training mandatory', 'Consumption caps required'] }, formats: ['docx', 'pdf'], gateArtifact: true },
  ],
  gateCriteria: [
    { key: 'aidp_governance_assessed', describe: 'Governance maturity + use-case portfolio are usable evidence before RFP.', fromStage: 'scope', toStage: 'rfp', severity: 'hard' },
  ],
  agentGuidance: {
    systemFraming: 'This is a data/analytics/AI platform sourcing event. Reason over committed data platform, data domains, governance maturity, use-case portfolio, security/privacy requirements, integration architecture, and value/KPI baseline. Never assert value without committed use-case + KPI evidence; never assert governance readiness without committed maturity evidence; name missing evidence.',
    keyQuestions: ['What use cases drive value?', 'What governance must improve first?', 'What consumption model right-sizes commitment?', 'How do we tie spend to value?'],
    requiresGroundedAnswer: true,
  },
  stageModel: [
    { stage: 'strategy', requiredEvidence: [{ family: 'use_case_portfolio', severity: 'hard' }, { family: 'value_kpi_baseline', severity: 'hard' }], analysisMethods: ['consumption_forecast'], deliverables: ['aidp_strategy_memo'] },
    { stage: 'scope', requiredEvidence: [{ family: 'data_domains', severity: 'hard' }, { family: 'governance_maturity', severity: 'hard' }, { family: 'security_privacy_requirements', severity: 'hard' }], analysisMethods: [], deliverables: [] },
    { stage: 'rfp', requiredEvidence: [{ family: 'integration_architecture', severity: 'hard' }, { family: 'model_tooling_requirements', severity: 'soft' }], analysisMethods: [], deliverables: ['aidp_rfp'] },
  ],
};

// ═════════════════════════════════════════════════════════════════════════════
// 4 · CONTRACT RENEWAL / RENEGOTIATION
// ═════════════════════════════════════════════════════════════════════════════
export const CONTRACT_RENEWAL: SourceEventArchetype = {
  id: 'CONTRACT_RENEWAL',
  name: 'Contract Renewal / Renegotiation',
  description: 'Renewing or renegotiating an existing vendor contract from a position of leverage.',
  version: '1.0.0', status: 'validated', eventType: 'managed_service',
  applicableSpendCategories: ['renewal', 'renegotiation', 'any'],
  requiredEvidenceFamilies: [
    f({ key: 'current_contract', label: 'Current contract', kind: 'commercial', whyNeeded: 'The terms being renegotiated.', sourceDocHint: 'Current MSA/SOW (PDF/DOCX)', acceptedFormats: ['pdf', 'docx'], feedsMethods: ['switching_cost_model'] }),
    f({ key: 'spend_baseline', label: 'Spend baseline', kind: 'financial', whyNeeded: 'What is actually being paid.', sourceDocHint: 'Spend by line (XLSX)', acceptedFormats: ['xlsx', 'csv'], feedsMethods: ['market_benchmark'] }),
    f({ key: 'utilization', label: 'Consumption / utilization', kind: 'metric_baseline', whyNeeded: 'Over/under-provisioning leverage.', sourceDocHint: 'Utilization report (CSV/XLSX)', acceptedFormats: ['csv', 'xlsx'], feedsMethods: ['consumption_forecast'] }),
    f({ key: 'sla_performance', label: 'SLA performance', kind: 'metric_baseline', whyNeeded: 'SLA misses are credits leverage.', sourceDocHint: 'SLA performance (XLSX)', acceptedFormats: ['xlsx'] }),
    f({ key: 'switching_cost', label: 'Switching cost', kind: 'qualitative', whyNeeded: 'Sets the credible walk-away.', sourceDocHint: 'Switching-cost analysis (DOCX/XLSX)', acceptedFormats: ['docx', 'xlsx'], feedsMethods: ['switching_cost_model'] }),
    f({ key: 'renewal_timeline', label: 'Renewal date & timeline', kind: 'commercial', whyNeeded: 'Timing is the primary lever.', sourceDocHint: 'Renewal calendar (XLSX)', acceptedFormats: ['xlsx'], feedsMethods: ['switching_cost_model'] }),
  ],
  optionalEvidenceFamilies: [
    f({ key: 'comparable_pricing', label: 'Comparable / benchmark pricing', kind: 'commercial', whyNeeded: 'Anchors the renegotiation ask.', sourceDocHint: 'Benchmark data (XLSX)', acceptedFormats: ['xlsx'], feedsMethods: ['market_benchmark'] }),
  ],
  requiredStakeholders: ['Procurement / Vendor Management', 'IT service owner', 'Finance', 'Legal'],
  sourcingStrategyQuestions: [
    'What is our walk-away (BATNA), grounded in switching cost?',
    'Where are we over-provisioned or under-consuming?',
    'What SLA misses entitle us to credits or concessions?',
    'What does the renewal-timing window let us extract?',
    'Sole-source renegotiation vs competitive re-bid?',
  ],
  vendorDiscussionGuide: {
    topics: ['Price-to-utilization alignment', 'SLA credits owed', 'Renewal timing', 'Volume/consumption commitments', 'Benchmarking clause'],
    ask: ['Re-rate to our actual utilization', 'Settle outstanding SLA credits', 'Add a benchmarking clause for the term', 'What multi-year discount for a commitment?'],
    doNotRevealYet: ['Our true switching cost', 'Whether we have a credible alternative', 'Our budget'],
    likelyPushback: ['Auto-renewal / uplift defense', 'Disputing SLA credits', 'Resisting benchmarking clause'],
    challengeAssumptions: ['Assumed switching cost is prohibitive', 'Assumed consumption keeps growing', 'Accepting the standard uplift'],
  },
  rfpDocumentStructure: [
    { key: 'renewal_position', title: 'Renewal negotiation position (internal)', required: true, evidenceDependencies: ['current_contract', 'spend_baseline', 'switching_cost'] },
    { key: 'concession_asks', title: 'Concession asks & justification', required: true, evidenceDependencies: ['utilization', 'sla_performance'] },
    { key: 'walk_away', title: 'Walk-away (BATNA) & re-bid trigger', required: true, evidenceDependencies: ['switching_cost', 'renewal_timeline'] },
  ],
  pricingModel: {
    model: 're-rate to utilization + credits recovery + multi-year commitment discount',
    costComponents: ['re-rated unit price', 'SLA credits owed', 'consumption commitment discount', 'COLA/indexation', 'benchmarking adjustment'],
    traps: ['Auto-renewal uplift', 'Unrecovered SLA credits', 'Locked indexation', 'Over-committed volume'],
    shouldCost: false,
  },
  evaluationModel: {
    criteria: [
      { key: 'price_concession', label: 'Price concession vs baseline', weight: 0.40 },
      { key: 'terms_improvement', label: 'Terms improvement (credits, benchmarking, exit)', weight: 0.35 },
      { key: 'risk_reduction', label: 'Risk reduction', weight: 0.25 },
    ],
    disqualifiers: ['No movement on price or terms', 'Refusal of benchmarking clause'],
  },
  riskModel: {
    dimensions: ['lock-in risk', 'price-creep risk', 'service-degradation risk', 'switching risk'],
    contractProtections: ['benchmarking clause', 'SLA credits', 'capped indexation', 'exit/portability', 'no auto-renewal uplift'],
  },
  negotiationLevers: [
    { key: 'renewal_timing', label: 'Renewal-timing pressure', rationale: 'Vendor revenue risk peaks near renewal; primary lever.', timing: 'pre_rfp' },
    { key: 'utilization_rerate', label: 'Re-rate to utilization', rationale: 'Recovers over-provisioning the vendor banks.', timing: 'rfp' },
    { key: 'sla_credits', label: 'SLA credits recovery', rationale: 'Converts service misses into commercial concession.', timing: 'rfp' },
    { key: 'rebid_threat', label: 'Credible competitive re-bid threat', rationale: 'Switching-cost-grounded BATNA compresses price.', timing: 'bafo' },
    { key: 'benchmarking_clause', label: 'Benchmarking clause', rationale: 'Protects price for the whole term.', timing: 'final_contracting' },
  ],
  deliverablePack: [
    { key: 'renewal_strategy_memo', label: 'Renewal / Renegotiation Strategy Memo', stage: 'strategy', audience: 'Procurement · Finance · Service owner', sections: ['Objective', 'Leverage analysis', 'Concession asks', 'Walk-away (BATNA)', 'Sole-source vs re-bid'], qualityBar: { minSections: 5, requiresCitations: true, altitude: 'exec', rubric: ['Names contract/spend/utilization specifics', 'Walk-away grounded in switching cost', 'Benchmark cited or marked missing'] }, formats: ['html', 'docx'], gateArtifact: true },
    { key: 'renewal_negotiation_memo', label: 'Renewal Negotiation Memo', stage: 'bafo', audience: 'Procurement', sections: ['Lever plan', 'Concession asks by line', 'Credits recovery', 'Walk-away script'], qualityBar: { minSections: 4, requiresCitations: true, altitude: 'exec', rubric: ['Asks tied to utilization/SLA evidence', 'Credits quantified', 'Walk-away explicit'] }, formats: ['html', 'docx'] },
  ],
  gateCriteria: [
    { key: 'renewal_leverage_evidenced', describe: 'Switching cost + utilization + SLA performance are usable evidence before negotiation.', fromStage: 'strategy', toStage: 'pricing', severity: 'hard' },
  ],
  agentGuidance: {
    systemFraming: 'This is a contract renewal / renegotiation. Reason over committed current contract, spend, utilization, SLA performance, switching cost, and renewal timeline. Never assert a savings/concession number without committed spend + utilization evidence; never assert a walk-away without committed switching-cost evidence; name missing evidence.',
    keyQuestions: ['What is the walk-away (BATNA)?', 'Where are we over-provisioned?', 'What SLA credits are owed?', 'What does renewal timing let us extract?'],
    requiresGroundedAnswer: true,
  },
  stageModel: [
    { stage: 'strategy', requiredEvidence: [{ family: 'current_contract', severity: 'hard' }, { family: 'spend_baseline', severity: 'hard' }, { family: 'switching_cost', severity: 'hard' }, { family: 'renewal_timeline', severity: 'hard' }], analysisMethods: ['switching_cost_model'], deliverables: ['renewal_strategy_memo'] },
    { stage: 'pricing', requiredEvidence: [{ family: 'utilization', severity: 'hard' }, { family: 'sla_performance', severity: 'hard' }], analysisMethods: ['market_benchmark', 'consumption_forecast'], deliverables: [] },
    { stage: 'bafo', requiredEvidence: [], analysisMethods: [], deliverables: ['renewal_negotiation_memo'] },
  ],
};

// ── registry ─────────────────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════
// 5 · CLOUD / INFRASTRUCTURE / FINOPS
// ═════════════════════════════════════════════════════════════════════════════
export const CLOUD_FINOPS: SourceEventArchetype = {
  id: 'CLOUD_FINOPS',
  name: 'Cloud / Infrastructure / FinOps',
  description: 'Sourcing or optimizing cloud + infrastructure spend (commitments, utilization, managed cloud, FinOps governance).',
  version: '1.0.0', status: 'validated', eventType: 'infrastructure',
  applicableSpendCategories: ['cloud_infrastructure', 'infrastructure_operations', 'managed_services'],
  requiredEvidenceFamilies: [
    RUN_COST_BASELINE,
    f({ key: 'cloud_billing', label: 'Cloud billing / cost-and-usage export', kind: 'financial', whyNeeded: 'The only true basis for utilization waste, commitment coverage, and pass-through markup.', sourceDocHint: 'CUR / billing export (CSV) by account/service', acceptedFormats: ['csv', 'xlsx'], feedsMethods: ['should_cost', 'tco_normalization'] }),
    f({ key: 'utilization_telemetry', label: 'Utilization telemetry', kind: 'metric_baseline', whyNeeded: 'Sizes idle/oversized capacity — the largest FinOps lever.', sourceDocHint: 'Utilization/rightsizing report (CSV)', acceptedFormats: ['csv', 'xlsx'], feedsMethods: ['should_cost'] }),
    f({ key: 'commitment_inventory', label: 'Commitment inventory (RI / Savings Plans / CUDs)', kind: 'inventory', whyNeeded: 'Coverage and expiry drive re-commitment leverage and stranded-commitment risk.', sourceDocHint: 'Reservation/commitment export (CSV)', acceptedFormats: ['csv', 'xlsx'] }),
    f({ key: 'workload_inventory', label: 'Workload / environment inventory', kind: 'inventory', whyNeeded: 'Defines the in-scope estate for managed-cloud pricing and migration risk.', sourceDocHint: 'Account/subscription + workload inventory (CSV)', acceptedFormats: ['csv', 'xlsx'], feedsMethods: ['transition_risk_model'] }),
    f({ key: 'infra_sla_incidents', label: 'Infra SLA + incident baseline', kind: 'metric_baseline', whyNeeded: 'Sets the availability/coverage bar a managed-cloud partner must beat.', sourceDocHint: 'Incident/availability export (CSV)', acceptedFormats: ['csv'], feedsMethods: ['sla_gap'] }),
    CONTRACT_BASELINE,
    f({ key: 'tooling_landscape', label: 'Cloud tooling landscape', kind: 'inventory', whyNeeded: 'Exposes duplicate observability/security/FinOps tooling for consolidation.', sourceDocHint: 'Tooling inventory (CSV)', acceptedFormats: ['csv'] }),
  ],
  optionalEvidenceFamilies: [
    f({ key: 'private_pricing_agreements', label: 'Private pricing / EDP / MSA discounts', kind: 'commercial', whyNeeded: 'Establishes the true net rate for pass-through-markup detection.', sourceDocHint: 'EDP/PPA terms (PDF)', acceptedFormats: ['pdf', 'xlsx'] }),
  ],
  requiredStakeholders: ['CIO / VP Infrastructure', 'Cloud / Platform Engineering lead', 'FinOps / Cloud Financial Management', 'Procurement', 'Finance (infra cost owner)', 'Security / Compliance'],
  sourcingStrategyQuestions: [
    'Is this a managed-cloud sourcing, a hyperscaler commitment negotiation, or a FinOps optimization — and what is the value thesis for each?',
    'What is our should-cost after rightsizing and commitment optimization, before any vendor discount?',
    'What commitment coverage and flexibility do we require, and what is our stranded-commitment risk?',
    'Where is a managed-cloud partner marking up pass-through hyperscaler cost, and is that transparent?',
    'What duplicate tooling can we consolidate as part of this event?',
  ],
  vendorDiscussionGuide: {
    topics: ['Managed-cloud pricing model', 'Pass-through vs marked-up hyperscaler cost', 'Commitment management + flexibility', 'Automation / optimization commitments', 'Availability SLA + credits', 'Tooling + observability'],
    ask: ['Show hyperscaler cost as pass-through at net rate, separate from your management fee', 'What rightsizing / optimization savings will you commit to, with credits?', 'How do you manage commitments and who owns stranded-commitment risk?', 'What availability SLA and credits will you sign?'],
    doNotRevealYet: ['Our post-rightsizing should-cost', 'Our current utilization-waste percentage', 'Our willingness to self-manage FinOps'],
    likelyPushback: ['Bundling hyperscaler cost with management fee to hide markup', 'Optimization "advice" without committed savings/credits', 'Owning commitment purchases to capture the arbitrage'],
    challengeAssumptions: ['Assumed steady growth justifying large upfront commitments', 'Assumed current utilization is efficient', 'Marked-up pass-through presented as a single blended rate'],
  },
  rfpDocumentStructure: [
    { key: 'exec_overview', title: 'Executive overview', required: true, evidenceDependencies: [] },
    { key: 'workload_scope', title: 'Workload / environment scope', required: true, evidenceDependencies: ['workload_inventory'] },
    { key: 'current_state', title: 'Current-state cost, utilization & commitments', required: true, evidenceDependencies: ['cloud_billing', 'utilization_telemetry', 'commitment_inventory'] },
    { key: 'pricing_model', title: 'Pricing model — pass-through + management fee', required: true, evidenceDependencies: ['cloud_billing'] },
    { key: 'optimization', title: 'Optimization & automation commitments', required: true, evidenceDependencies: ['utilization_telemetry'] },
    { key: 'commitment_mgmt', title: 'Commitment management & risk ownership', required: true, evidenceDependencies: ['commitment_inventory'] },
    { key: 'sla_availability', title: 'Availability SLA + credits', required: true, evidenceDependencies: ['infra_sla_incidents'] },
    { key: 'security', title: 'Security / compliance requirements', required: true, evidenceDependencies: [] },
    { key: 'tooling', title: 'Tooling / observability + consolidation', required: false, evidenceDependencies: ['tooling_landscape'] },
    { key: 'commercial_terms', title: 'Commercial terms appendix (rate transparency, audit, exit)', required: true, evidenceDependencies: ['contract_baseline'] },
    { key: 'response_instructions', title: 'Response instructions & evaluation criteria', required: true, evidenceDependencies: [] },
  ],
  pricingModel: {
    model: 'pass-through hyperscaler cost + transparent management fee + committed optimization',
    costComponents: ['hyperscaler consumption (pass-through, net rate)', 'management fee', 'reserved/committed capacity', 'optimization/automation services', 'tooling/licensing', 'egress/support tiers'],
    traps: ['Marked-up pass-through hidden in a blended rate', 'Reserved-capacity / utilization waste not repriced', 'Optimization "advice" without committed savings or credits', 'Vendor owning commitment purchases to capture the arbitrage', 'Duplicate tooling billed on top', 'Egress / support-tier surprises'],
    shouldCost: true,
  },
  evaluationModel: {
    criteria: [
      { key: 'price_transparency', label: 'Price transparency & normalized should-cost gap', weight: 0.30 },
      { key: 'optimization', label: 'Committed optimization / automation savings', weight: 0.25 },
      { key: 'capability', label: 'Managed-cloud capability & SLA credibility', weight: 0.20 },
      { key: 'commitment_risk', label: 'Commitment management & risk ownership', weight: 0.15 },
      { key: 'security', label: 'Security & compliance', weight: 0.10 },
    ],
    disqualifiers: ['Cannot show hyperscaler cost as transparent pass-through', 'No committed optimization savings or credits', 'No availability SLA credits'],
  },
  riskModel: {
    dimensions: ['pass-through markup opacity', 'stranded-commitment risk', 'utilization-waste persistence', 'lock-in / exit risk', 'security/compliance drift'],
    contractProtections: ['pass-through rate transparency + audit rights', 'optimization glide-path with credits', 'commitment-risk ownership clause', 'egress/exit assistance', 'benchmarking clause'],
  },
  negotiationLevers: [
    { key: 'passthrough_transparency', label: 'Pass-through rate transparency', rationale: 'Splitting hyperscaler cost from management fee exposes and removes hidden markup.', timing: 'rfp' },
    { key: 'optimization_credits', label: 'Committed optimization savings with credits', rationale: 'Converts vendor "advice" into contractual savings the buyer keeps.', timing: 'bafo' },
    { key: 'commitment_flexibility', label: 'Commitment flexibility / buyer-owned commitments', rationale: 'Keeps the commitment arbitrage with the buyer and caps stranded risk.', timing: 'rfp' },
    { key: 'multicloud_tension', label: 'Multi-provider / self-manage tension', rationale: 'Credible self-manage or alternate-provider threat compresses the management fee.', timing: 'pre_rfp' },
  ],
  deliverablePack: [
    { key: 'cloud_strategy_memo', label: 'Cloud / FinOps Sourcing Strategy Memo', stage: 'strategy', audience: 'CIO · VP Infra', sections: ['Objective', 'Managed vs self-manage decision', 'Should-cost after optimization', 'Commitment strategy', 'Consolidation targets'], qualityBar: { minSections: 5, requiresCitations: true, altitude: 'exec', rubric: ['Names this estate’s accounts/services (not generic)', 'Utilization waste cited from telemetry', 'Should-cost stated after rightsizing, before discount'] }, formats: ['html', 'docx'], gateArtifact: true },
    { key: 'cloud_rfp', label: 'Cloud / Managed-Cloud RFP', stage: 'rfp', audience: 'Vendors', sections: ['Workload scope', 'Pricing (pass-through + fee)', 'Optimization commitments', 'Commitment management', 'Availability SLA', 'Commercial terms'], qualityBar: { minSections: 6, requiresCitations: true, altitude: 'full', rubric: ['Pass-through separated from management fee', 'Optimization stated as committed savings', 'Cost/utilization cited from billing evidence'] }, formats: ['docx', 'pdf', 'xlsx'], gateArtifact: true },
    { key: 'cloud_negotiation_memo', label: 'Cloud Pricing & Negotiation Memo', stage: 'bafo', audience: 'CIO · Procurement', sections: ['Should-cost vs proposals', 'Markup exposure', 'Optimization asks by vendor', 'Walk-away'], qualityBar: { minSections: 4, requiresCitations: true, altitude: 'exec', rubric: ['Vendor-specific asks', 'Markup quantified', 'Walk-away stated'] }, formats: ['html', 'docx'] },
  ],
  gateCriteria: [
    { key: 'cloud_baseline_evidenced', describe: 'Billing, utilization, and commitment inventory are usable evidence before RFP.', fromStage: 'scope', toStage: 'rfp', severity: 'hard' },
    { key: 'cloud_pricing_normalized', describe: 'Proposals normalized to pass-through + fee and to should-cost before BAFO.', fromStage: 'pricing', toStage: 'bafo', severity: 'hard' },
  ],
  agentGuidance: {
    systemFraming: 'This is a cloud / infrastructure / FinOps sourcing or optimization event. Reason over committed billing, utilization, commitment inventory, and contract evidence. Never assert a savings number without committed billing + utilization evidence; separate hyperscaler pass-through from vendor management fee; name missing evidence explicitly.',
    keyQuestions: ['What is should-cost after rightsizing + commitment optimization?', 'Where is pass-through cost marked up?', 'What is the stranded-commitment risk?', 'What tooling can be consolidated?'],
    requiresGroundedAnswer: true,
  },
  stageModel: [
    { stage: 'strategy', requiredEvidence: [{ family: 'cloud_billing', severity: 'hard' }, { family: 'utilization_telemetry', severity: 'hard' }], analysisMethods: ['should_cost'], deliverables: ['cloud_strategy_memo'] },
    { stage: 'scope', requiredEvidence: [{ family: 'workload_inventory', severity: 'hard' }, { family: 'commitment_inventory', severity: 'hard' }, { family: 'infra_sla_incidents', severity: 'soft' }], analysisMethods: ['sla_gap'], deliverables: [] },
    { stage: 'rfp', requiredEvidence: [{ family: 'workload_inventory', severity: 'hard' }, { family: 'cloud_billing', severity: 'hard' }], analysisMethods: [], deliverables: ['cloud_rfp'] },
    { stage: 'pricing', requiredEvidence: [{ family: 'cloud_billing', severity: 'hard' }, { family: 'contract_baseline', severity: 'soft' }], analysisMethods: ['tco_normalization', 'should_cost'], deliverables: [] },
    { stage: 'bafo', requiredEvidence: [], analysisMethods: ['market_benchmark'], deliverables: ['cloud_negotiation_memo'] },
  ],
};

export const SOURCE_ARCHETYPE_REGISTRY: Record<string, SourceEventArchetype> = {
  [AMS_MANAGED_SERVICES.id]: AMS_MANAGED_SERVICES,
  [ERP_SI_IMPLEMENTATION.id]: ERP_SI_IMPLEMENTATION,
  [AI_DATA_PLATFORM.id]: AI_DATA_PLATFORM,
  [CONTRACT_RENEWAL.id]: CONTRACT_RENEWAL,
  [CLOUD_FINOPS.id]: CLOUD_FINOPS,
  // Add new archetypes here — no Source core code change required.
};

export function getSourceArchetype(id: string): SourceEventArchetype | undefined {
  return SOURCE_ARCHETYPE_REGISTRY[id];
}

export function listSourceArchetypes(): SourceEventArchetype[] {
  return Object.values(SOURCE_ARCHETYPE_REGISTRY);
}

/** Resolve an archetype from a source_events.event_type label. */
export function archetypeForEventType(eventType: string): SourceEventArchetype | undefined {
  return listSourceArchetypes().find((a) => a.eventType === eventType);
}
