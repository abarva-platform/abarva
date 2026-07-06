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
  valueLeverRules: [
    { key: 'AMS.ENHANCEMENT_LEAKAGE', name: 'Enhancement / change-order leakage', category: 'scope_leakage', whatToWatch: 'Recurring support work billed as enhancement or change-order rather than base run scope.', requiredEvidence: ['ticket_volumes', 'contract_baseline', 'service_tower_scope'], triggerLogic: 'Recurring ticket/enhancement categories appear outside the base run scope, or historical change-order spend is a material share of run cost.', valueBasis: 'Avoidable portion of recurring change-order / enhancement spend converted to base scope or a fixed service catalog.', defaultConfidence: 'med', rfpClause: 'Require vendors to classify recurring support vs enhancement and price a fixed service catalog / unit-rate catalog for recurring items.', evaluationImpact: 'Penalize vague enhancement exclusions and open-ended change-order language.', bafoAsk: 'Convert the recurring change-order categories into a fixed service catalog or capped unit-rate structure.', executiveImplication: 'Unresolved scope ambiguity is the most common source of post-award leakage on AMS deals.' },
    { key: 'AMS.VOLUME_BAND_PRICING', name: 'Volume-band price flex-down', category: 'pricing', whatToWatch: 'Resource-unit / FTE pricing that does not step down as ticket volume falls or automation removes work.', requiredEvidence: ['ticket_volumes', 'run_cost_baseline'], triggerLogic: 'Pricing is fixed-FTE or a single blended unit rate with no volume-band step-down clause.', valueBasis: 'Run-cost reduction from repricing to the actual lower volume band over the term (projected volume decline × unit rate delta).', defaultConfidence: 'med', rfpClause: 'Require a resource-unit pricing schedule with explicit volume bands and step-down thresholds.', evaluationImpact: 'Disqualify pricing with no band step-down; score band granularity.', bafoAsk: 'Add volume-band step-down pricing so cost falls when volumes/automation reduce tickets.', executiveImplication: 'Without band flex-down, the buyer keeps paying peak-volume rates as demand declines.' },
    { key: 'AMS.PRODUCTIVITY_CREDITS', name: 'Productivity / automation not priced back', category: 'productivity', whatToWatch: 'Automation or productivity improvements claimed but not converted into committed year-over-year credits.', requiredEvidence: ['ticket_volumes', 'tooling_landscape'], triggerLogic: 'Vendor asserts automation/productivity gains with no credit schedule or gainshare.', valueBasis: 'Committed productivity-credit percentage × the automatable ticket/effort pool per year.', defaultConfidence: 'med', rfpClause: 'Require a year-by-year productivity/automation commitment with a credit schedule tied to ticket-volume / incident reduction.', evaluationImpact: 'Reward committed credits; treat uncredited claims as evaluation risk.', bafoAsk: 'Add a productivity-credit schedule tied to measured ticket-volume and incident reduction.', executiveImplication: 'Automation savings the vendor keeps are savings the buyer forfeits for the contract term.' },
    { key: 'AMS.RETAINED_COST', name: 'Retained client / SME cost omitted from TCO', category: 'retained_cost', whatToWatch: 'Governance, vendor-management, and SME effort the buyer keeps in-house, left out of the comparison.', requiredEvidence: ['retained_org_model', 'staffing_baseline'], triggerLogic: 'Proposals compare run cost without the retained-organization and client-side effort each model requires.', valueBasis: 'Difference in retained FTE effort between models, valued at loaded cost, plus reduction commitment over the term.', defaultConfidence: 'low', rfpClause: 'Require vendors to state the retained client effort their model assumes and how it reduces over time.', evaluationImpact: 'Normalize all proposals to include retained cost before ranking on price.', bafoAsk: 'Commit to reducing retained client/SME effort over the term with named milestones.', executiveImplication: 'A vendor can look cheapest on paper while shifting hidden effort onto the buyer.' },
    { key: 'AMS.SLA_ECONOMICS', name: 'SLA credit economics', category: 'sla_economics', whatToWatch: 'SLA credits/remedies that are weak relative to the business criticality of the towers.', requiredEvidence: ['sla_baseline', 'incident_problem_change'], triggerLogic: 'Credit caps are low, or there is no chronic-miss remedy, versus the criticality in the incident/SLA baseline.', valueBasis: 'Value protected = expected credit pool + avoided business impact from chronic-miss remedies (protection, not headline savings).', defaultConfidence: 'low', rfpClause: 'Require an SLA/KPI schedule with credits scaled to criticality and a chronic-miss remedy.', evaluationImpact: 'Do not let a low headline price outrank a vendor with materially stronger SLA remedies once normalized.', bafoAsk: 'Increase the credit pool and add a chronic-miss remedy for the critical towers.', executiveImplication: 'Weak SLA economics convert vendor underperformance into the buyer’s operational and financial risk.' },
    { key: 'AMS.TRANSITION_RISK', name: 'Transition fees not milestone-based', category: 'transition_risk', whatToWatch: 'Transition/KT priced as a lump sum with no fee-at-risk tied to milestones or acceptance.', requiredEvidence: ['transition_constraints'], triggerLogic: 'Transition is under-specified or fees are not tied to KT checkpoints, cutover acceptance, or milestone slippage.', valueBasis: 'Avoided failed/extended-transition cost = probability-weighted transition overrun × transition value at risk.', defaultConfidence: 'low', rfpClause: 'Require a milestone-based transition plan with KT evidence, cutover acceptance criteria, and fee-at-risk on slippage.', evaluationImpact: 'Do not award full transition score to a generic transition narrative.', bafoAsk: 'Tie transition fees to KT milestones and cutover acceptance, with remedies for slippage.', executiveImplication: 'Transition ambiguity commonly becomes retained-cost exposure and delayed value realization.' },
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

// ═════════════════════════════════════════════════════════════════════════════
// 6+ · ADDITIONAL SOURCING ARCHETYPES
// ═════════════════════════════════════════════════════════════════════════════
export const BPO_SHARED_SERVICES: SourceEventArchetype = {
  id: 'BPO_SHARED_SERVICES',
  name: 'BPO / Shared Services (Transaction Processing)',
  description: 'Sourcing a transaction-processing BPO / shared-services partner across HR, Finance & Accounting (F&A), and Supply Chain (SCM) towers — priced on process volumes, held to quality/error and cycle-time SLAs, and steered toward automation and retained-cost reduction, not labor arbitrage alone.',
  version: '1.0.0', status: 'validated', eventType: 'other',
  applicableSpendCategories: ['business_process_outsourcing', 'shared_services', 'finance_accounting', 'hr_operations', 'supply_chain_operations'],
  requiredEvidenceFamilies: [
    f({ key: 'process_scope_matrix', label: 'Process scope matrix by tower (HR / F&A / SCM)', kind: 'process', whyNeeded: 'The process (payroll run, invoice, PO-match) is the unit of service, SLA, and price — without it scope and unit pricing are guesses.', sourceDocHint: 'Process/L2-L3 scope matrix by tower (XLSX)', acceptedFormats: ['xlsx', 'csv'], feedsMethods: ['should_cost', 'retained_org_sizing'] }),
    f({ key: 'transaction_volume_baseline', label: 'Transaction volume baseline by process', kind: 'metric_baseline', whyNeeded: 'Cases/invoices/payroll events by process and month drive volume-BAND pricing and prevent band leakage when volumes fall.', sourceDocHint: 'Volume export by process & period — payroll events, AP invoices, PO/invoice matches, HR cases (CSV/XLSX)', acceptedFormats: ['csv', 'xlsx'], backing: { table: 'tower_incidents', keyColumn: 'tenant_key' }, feedsMethods: ['should_cost', 'market_benchmark'] }),
    f({ key: 'unit_cost_baseline', label: 'Current unit-cost baseline', kind: 'financial', whyNeeded: 'Independent cost-per-transaction basis for should-cost and any savings claim; separates volume effects from price.', sourceDocHint: 'Cost per process / fully-loaded run cost by tower (CSV/XLSX)', acceptedFormats: ['csv', 'xlsx'], backing: { table: 'tower_it_financials', keyColumn: 'tenant_key' }, feedsMethods: ['should_cost', 'tco_normalization'] }),
    RUN_COST_BASELINE,
    f({ key: 'quality_error_baseline', label: 'Quality / error / rework baseline', kind: 'metric_baseline', whyNeeded: 'Payroll/benefits errors, invoice-accuracy misses, and PO/invoice mismatches carry rework cost the bidder must own commercially — not just report.', sourceDocHint: 'Error/rework logs by process — payroll corrections, invoice-accuracy %, match exception rate (CSV/XLSX)', acceptedFormats: ['csv', 'xlsx'], feedsMethods: ['sla_gap', 'should_cost'] }),
    f({ key: 'cycle_time_aging_baseline', label: 'Cycle-time / aging / SLA baseline', kind: 'metric_baseline', whyNeeded: 'Close-cycle days, case aging, DSO impact, and supplier-onboarding lead time set the service bar and expose exception-handling leakage.', sourceDocHint: 'Cycle-time & aging report — close days, HR case age, AP DSO, onboarding lead time (CSV/XLSX)', acceptedFormats: ['csv', 'xlsx'], feedsMethods: ['sla_gap'] }),
    f({ key: 'exception_handling_baseline', label: 'Exception / non-standard work baseline', kind: 'process', whyNeeded: 'Exceptions (off-cycle payroll, invoice disputes, match failures, master-data fixes) are where per-unit BPO pricing leaks into T&M and margin hides.', sourceDocHint: 'Exception volume & effort by process (XLSX)', acceptedFormats: ['xlsx', 'csv'], feedsMethods: ['should_cost', 'sla_gap'] }),
    f({ key: 'automation_deflection_baseline', label: 'Automation / self-service / deflection baseline', kind: 'metric_baseline', whyNeeded: 'Share of manual repetitive work vs self-service/RPA today; the untapped deflection pool is the real value case beyond arbitrage.', sourceDocHint: 'Automation/RPA coverage + self-service adoption by process (XLSX)', acceptedFormats: ['xlsx', 'csv'], feedsMethods: ['should_cost'] }),
    f({ key: 'retained_team_sme_model', label: 'Retained team / client-SME effort model', kind: 'org', whyNeeded: 'Retained approvers, controllers, HRBPs, and SME effort must sit in TCO — omitting it makes the bidder look cheaper than the real total.', sourceDocHint: 'Retained-org + client-side effort model by tower (XLSX/DOCX)', acceptedFormats: ['xlsx', 'docx'], feedsMethods: ['tco_normalization', 'retained_org_sizing'] }),
    f({ key: 'compliance_controls_inventory', label: 'Compliance / controls / SoD inventory', kind: 'document', whyNeeded: 'SOX controls, segregation-of-duties, data-privacy (PII/payroll), and control attestation obligations bound the delivery model and geography.', sourceDocHint: 'Controls matrix + SoD map + data-privacy/SOX obligations (DOCX/XLSX)', acceptedFormats: ['docx', 'xlsx', 'pdf'], feedsMethods: ['transition_risk_model'] }),
    CONTRACT_BASELINE,
    f({ key: 'transition_constraints', label: 'Transition & knowledge-transfer constraints', kind: 'qualitative', whyNeeded: 'Sizes transition risk, parallel-run needs for payroll/close, and controls continuity during cutover.', sourceDocHint: 'Transition constraints memo (DOCX)', acceptedFormats: ['docx', 'pdf'], feedsMethods: ['transition_risk_model'] }),
  ],
  optionalEvidenceFamilies: [
    f({ key: 'master_data_quality', label: 'Master-data quality baseline (vendor/employee/catalog)', kind: 'metric_baseline', whyNeeded: 'Master-data drift (supplier, catalog, employee) drives SCM match failures and payroll errors; quantifies avoidable rework.', sourceDocHint: 'Master-data quality/exception report (XLSX)', acceptedFormats: ['xlsx', 'csv'] }),
    f({ key: 'employee_supplier_experience', label: 'Employee / supplier experience signals', kind: 'metric_baseline', whyNeeded: 'HR case CSAT and supplier-portal satisfaction expose service failures that unit metrics miss.', sourceDocHint: 'CSAT / experience survey export (CSV/XLSX)', acceptedFormats: ['csv', 'xlsx'] }),
    f({ key: 'incumbent_scorecards', label: 'Incumbent BPO performance scorecards', kind: 'metric_baseline', whyNeeded: 'Quantifies incumbent dissatisfaction and switch leverage.', sourceDocHint: 'Vendor scorecards (XLSX)', acceptedFormats: ['xlsx'] }),
  ],
  requiredStakeholders: ['COO / Shared Services Lead', 'CHRO / HR Operations Lead', 'CFO / Controller (F&A)', 'CPO / Head of Supply Chain Operations', 'Procurement / Vendor Management', 'Internal Audit / SOX & Controls', 'Data Privacy / Security', 'Retained-org lead'],
  sourcingStrategyQuestions: [
    'Which processes per tower (HR / F&A / SCM) do we outsource, retain, or automate — and why is each the right unit of service?',
    'What is our cost-per-transaction should-cost by process, and where is the incumbent above it after normalizing for volume?',
    'What automation/self-service deflection pool exists, and how do we make the partner share those savings rather than bank them?',
    'How do we price exceptions and rework so error economics are commercial, not absorbed silently into margin?',
    'Which controls, SoD, and data-privacy obligations (SOX, payroll PII) constrain geography and require attestation?',
    'What retained client/SME effort remains, and how does it reduce over the term?',
  ],
  vendorDiscussionGuide: {
    topics: ['Process delivery model by tower', 'Transaction-unit definition & volume bands', 'Error/rework & exception economics', 'Automation/deflection roadmap & gainshare', 'Cycle-time / accuracy SLAs + credits', 'Controls / SOX / data-privacy / SoD', 'Onshore/nearshore/offshore tiering & escalation', 'Transition, parallel-run & retained-org'],
    ask: [
      'Show your transaction-unit definition per process and exactly how price re-steps DOWN when volumes drop through a band.',
      'How do you price exceptions and rework — and what accuracy/error remedy (credits or re-do at your cost) will you commit to?',
      'What automation/self-service deflection will you commit to year over year, and how is that saving shared with us?',
      'How does your onshore/nearshore/offshore tiering map to each process, and what is the escalation path when a tier underperforms?',
      'How do you evidence SOX-control operation, segregation-of-duties, and payroll/PII data-privacy across your delivery geographies?',
    ],
    doNotRevealYet: ['Our internal cost-per-transaction should-cost', 'Our automation/deflection ceiling and retained-cost target', 'The incumbent’s current unit rates', 'Our walk-away / insource-fallback position'],
    likelyPushback: ['Pricing a single blended unit rate that never re-steps on volume drop', 'Treating rework/errors as included effort with no remedy', 'Soft automation intent with no gainshare or credits', 'Excluding exceptions from unit price and back-billing them as T&M', 'Offering offshore tiering with vague escalation and no quality floor'],
    challengeAssumptions: ['Assumed volumes only grow (no band-down repricing)', 'Assumed offshore ratio without accuracy/error evidence', 'Assumed retained/SME effort is zero once transitioned', 'Assumed automation savings accrue only to the provider', 'Assumed close-cycle/DSO unaffected by exception backlog'],
  },
  rfpDocumentStructure: [
    { key: 'exec_overview', title: 'Executive overview & sourcing objectives', required: true, evidenceDependencies: [] },
    { key: 'process_scope', title: 'Process scope by tower (HR / F&A / SCM)', required: true, evidenceDependencies: ['process_scope_matrix'] },
    { key: 'current_state', title: 'Current-state baseline (volumes, unit cost, quality, cycle time)', required: true, evidenceDependencies: ['transaction_volume_baseline', 'unit_cost_baseline', 'quality_error_baseline', 'cycle_time_aging_baseline'] },
    { key: 'sla_quality', title: 'SLA / quality / cycle-time schedule + error remedies + credits', required: true, evidenceDependencies: ['quality_error_baseline', 'cycle_time_aging_baseline'] },
    { key: 'unit_pricing', title: 'Transaction-unit & volume-band pricing schedule', required: true, evidenceDependencies: ['transaction_volume_baseline', 'unit_cost_baseline'] },
    { key: 'exceptions', title: 'Exception & non-standard work handling and pricing', required: true, evidenceDependencies: ['exception_handling_baseline'] },
    { key: 'automation', title: 'Automation / self-service / deflection roadmap & gainshare', required: true, evidenceDependencies: ['automation_deflection_baseline'] },
    { key: 'delivery_tiering', title: 'Delivery model & onshore/nearshore/offshore tiering + escalation', required: true, evidenceDependencies: ['process_scope_matrix'] },
    { key: 'controls_compliance', title: 'Controls / SOX / SoD / data-privacy requirements', required: true, evidenceDependencies: ['compliance_controls_inventory'] },
    { key: 'transition_retained', title: 'Transition, parallel-run & retained-organization model', required: true, evidenceDependencies: ['transition_constraints', 'retained_team_sme_model'] },
    { key: 'commercial_terms', title: 'Commercial terms appendix (bands, indexation, audit rights, benchmarking)', required: true, evidenceDependencies: ['contract_baseline'] },
    { key: 'response_instructions', title: 'Response instructions & evaluation criteria', required: true, evidenceDependencies: [] },
  ],
  pricingModel: {
    model: 'per-transaction unit price by process within volume bands + exception/rework schedule + automation gainshare',
    costComponents: ['unit price per process', 'volume-band step pricing', 'exception/non-standard handling', 'error/rework remedy (credits or re-do at cost)', 'transition (one-time)', 'automation/deflection gainshare', 'onshore/nearshore/offshore tier mix', 'COLA/indexation', 'retained-cost offset'],
    traps: ['Unit price not aligned to volume BANDS (no step-down when volumes fall)', 'Volume-band leakage — price never repriced on volume drop', 'Error/rework absorbed silently with no commercial remedy', 'Exceptions carved out of unit price and back-billed as T&M', 'Offshore/nearshore tiering without escalation or quality floor', 'Automation savings banked entirely by provider (no gainshare)', 'Retained client/SME effort omitted from TCO', 'Uncapped COLA on the unit rate'],
    shouldCost: true,
  },
  evaluationModel: {
    criteria: [
      { key: 'process_capability', label: 'Process capability & tower delivery credibility (HR/F&A/SCM)', weight: 0.25 },
      { key: 'price', label: 'Normalized cost-per-transaction / should-cost gap (incl. exceptions & retained effort)', weight: 0.25 },
      { key: 'quality_sla', label: 'Quality, accuracy & cycle-time SLA credibility + error remedies', weight: 0.20 },
      { key: 'automation', label: 'Automation / deflection roadmap & gainshare commitment', weight: 0.15 },
      { key: 'controls', label: 'Controls / SOX / SoD / data-privacy assurance', weight: 0.10 },
      { key: 'transition_risk', label: 'Transition, tiering escalation & delivery-continuity risk', weight: 0.05 },
    ],
    disqualifiers: ['No volume-band step-down in the unit price', 'No committed error/rework remedy or accuracy credits', 'Cannot evidence SOX-control operation / SoD across delivery geographies', 'Exceptions not priced (open-ended T&M)', 'No comparable-scale transaction-processing references for the towers in scope'],
  },
  riskModel: {
    dimensions: ['volume-band leakage risk', 'error/rework economics risk', 'exception-handling margin leakage', 'controls / SOX / SoD / data-privacy risk', 'offshore/nearshore quality & escalation risk', 'retained-cost & SME-dependency risk', 'transition / parallel-run risk (payroll & close continuity)', 'automation-benefit forfeiture risk'],
    contractProtections: ['volume-band step-down pricing clause', 'accuracy/error credits + rework-at-provider-cost remedy', 'exception-pricing schedule (no open T&M)', 'automation/deflection gainshare with credits', 'SOX-control attestation & right-to-audit', 'SoD & data-privacy (PII/payroll) obligations with breach remedies', 'tier-escalation SLA with quality floor', 'benchmarking clause on unit rates', 'termination assistance & exit-rate card', 'retained-cost reduction commitment'],
  },
  negotiationLevers: [
    { key: 'volume_band_pricing', label: 'Volume-band step-down pricing', rationale: 'Forces the unit price to reprice DOWN when transaction volumes fall through a band — closes the band-leakage trap where price steps up but never down.', timing: 'rfp' },
    { key: 'error_rework_remedy', label: 'Error / rework economics remedy', rationale: 'Makes accuracy the provider’s cost — credits or re-do at their expense — instead of rework being silently absorbed and re-billed to the buyer.', timing: 'bafo' },
    { key: 'automation_gainshare', label: 'Automation / deflection gainshare', rationale: 'Shares the self-service/RPA deflection savings the buyer would otherwise forfeit to the provider’s margin.', timing: 'bafo' },
    { key: 'exception_pricing', label: 'Exception & non-standard work pricing', rationale: 'Prices exceptions up front so off-cycle/dispute/match-failure work cannot leak into open-ended T&M.', timing: 'rfp' },
    { key: 'tier_escalation', label: 'Tiering escalation & quality floor', rationale: 'Ties offshore/nearshore tier savings to an escalation path and accuracy floor, removing quality risk from arbitrage.', timing: 'final_contracting' },
    { key: 'retained_cost_reduction', label: 'Retained-cost reduction commitment', rationale: 'Holds the provider to reducing retained client/SME effort over the term, proving process improvement beyond labor arbitrage.', timing: 'final_contracting' },
  ],
  deliverablePack: [
    { key: 'bpo_strategy_memo', label: 'BPO / Shared Services Sourcing Strategy Memo', stage: 'strategy', audience: 'COO · CFO · CHRO · Sponsor', sections: ['Objective', 'Process retain / outsource / automate decision by tower', 'Cost-per-transaction should-cost summary', 'Automation & deflection value case', 'Error/rework & exception economics', 'Controls & data-privacy posture', 'Retained-cost & transition posture'], qualityBar: { minSections: 6, requiresCitations: true, altitude: 'exec', rubric: ['Names this client’s processes/volumes by tower (not generic)', 'Every unit-cost and savings claim cited or marked missing', 'Value framed as measurable process improvement + automation, not labor arbitrage', 'Retained/SME effort included in the total'] }, formats: ['html', 'docx'], gateArtifact: true },
    { key: 'bpo_rfp', label: 'BPO / Shared Services RFP (process- & tower-structured)', stage: 'rfp', audience: 'BPO vendors', sections: ['Process scope by tower', 'Current-state baseline', 'SLA/quality/cycle-time schedule + error remedies', 'Transaction-unit & volume-band pricing', 'Exception handling & pricing', 'Automation/deflection & gainshare', 'Delivery tiering & escalation', 'Controls/SOX/SoD/data-privacy', 'Transition & retained-org'], qualityBar: { minSections: 8, requiresCitations: true, altitude: 'full', rubric: ['Process- and tower-structured (HR/F&A/SCM), not generic', 'Volumes/unit cost/quality cited from committed evidence', 'Pricing schedule = per-transaction within volume bands + exceptions', 'Error remedy and gainshare explicit'] }, formats: ['docx', 'pdf', 'xlsx'], gateArtifact: true },
    { key: 'bpo_negotiation_memo', label: 'BPO Pricing & Negotiation Memo', stage: 'bafo', audience: 'COO · CFO · Procurement', sections: ['Should-cost vs proposals (per-transaction, all-in)', 'Volume-band & exception exposure', 'Automation gainshare & error-remedy asks', 'Lever plan by vendor', 'Walk-away / insource fallback'], qualityBar: { minSections: 4, requiresCitations: true, altitude: 'exec', rubric: ['Vendor-specific asks', 'Cost-per-transaction should-cost cited', 'Band-leakage and exception exposure quantified', 'Walk-away stated'] }, formats: ['html', 'docx'] },
  ],
  gateCriteria: [
    { key: 'bpo_scope_evidenced', describe: 'Process scope + transaction volumes + unit cost + quality baseline are usable evidence before RFP.', fromStage: 'scope', toStage: 'rfp', severity: 'hard' },
    { key: 'bpo_controls_confirmed', describe: 'Controls / SOX / SoD / data-privacy obligations captured before soliciting responses.', fromStage: 'scope', toStage: 'rfp', severity: 'soft' },
    { key: 'bpo_pricing_normalized', describe: 'Proposals normalized to cost-per-transaction should-cost — including exceptions and retained effort — before BAFO.', fromStage: 'pricing', toStage: 'bafo', severity: 'hard' },
  ],
  agentGuidance: {
    systemFraming: 'This is a transaction-processing BPO / shared-services sourcing event spanning HR, Finance & Accounting, and Supply Chain towers. Reason over committed process scope, transaction volumes, unit cost, quality/error, cycle-time/aging, exception, automation/deflection, retained-SME, and controls evidence. Frame value as measurable process improvement and automation — not labor arbitrage. Never assert a savings number without committed unit-cost + should-cost evidence; never assert an error/quality gap without committed quality data; always fold exceptions and retained client/SME effort into the total; name missing evidence explicitly.',
    keyQuestions: ['What is the cost-per-transaction should-cost by process and tower?', 'Where is the incumbent above should-cost after normalizing for volume?', 'What automation/deflection pool exists and how is the saving shared?', 'How are errors/rework and exceptions priced commercially?', 'What controls/SOX/SoD/data-privacy obligations constrain the delivery model?', 'What retained client/SME effort remains in the total?'],
    requiresGroundedAnswer: true,
  },
  stageModel: [
    { stage: 'strategy', requiredEvidence: [{ family: 'unit_cost_baseline', severity: 'hard' }, { family: 'process_scope_matrix', severity: 'hard' }, { family: 'automation_deflection_baseline', severity: 'soft' }], analysisMethods: ['should_cost'], deliverables: ['bpo_strategy_memo'] },
    { stage: 'scope', requiredEvidence: [{ family: 'transaction_volume_baseline', severity: 'hard' }, { family: 'quality_error_baseline', severity: 'hard' }, { family: 'cycle_time_aging_baseline', severity: 'hard' }, { family: 'exception_handling_baseline', severity: 'hard' }, { family: 'compliance_controls_inventory', severity: 'hard' }, { family: 'retained_team_sme_model', severity: 'soft' }], analysisMethods: ['sla_gap', 'retained_org_sizing'], deliverables: [] },
    { stage: 'rfp', requiredEvidence: [{ family: 'process_scope_matrix', severity: 'hard' }, { family: 'quality_error_baseline', severity: 'hard' }, { family: 'automation_deflection_baseline', severity: 'hard' }, { family: 'transition_constraints', severity: 'soft' }], analysisMethods: [], deliverables: ['bpo_rfp'] },
    { stage: 'pricing', requiredEvidence: [{ family: 'unit_cost_baseline', severity: 'hard' }, { family: 'transaction_volume_baseline', severity: 'hard' }, { family: 'exception_handling_baseline', severity: 'hard' }, { family: 'contract_baseline', severity: 'soft' }], analysisMethods: ['tco_normalization', 'should_cost', 'market_benchmark'], deliverables: [] },
    { stage: 'bafo', requiredEvidence: [{ family: 'retained_team_sme_model', severity: 'soft' }], analysisMethods: ['market_benchmark'], deliverables: ['bpo_negotiation_memo'] },
  ],
};
export const MSSP_CYBER: SourceEventArchetype = {
  id: 'MSSP_CYBER',
  name: 'Cybersecurity / MSSP / SOC Outsourcing',
  description: 'Sourcing a managed security services provider (MSSP) for SOC monitoring, detection, and incident response — turning "monitoring" into measurable coverage, detection, response, and accountability.',
  version: '1.0.0', status: 'validated', eventType: 'managed_service',
  applicableSpendCategories: ['cybersecurity', 'managed_security_services', 'soc'],
  requiredEvidenceFamilies: [
    f({ key: 'security_tooling_inventory', label: 'Security tooling & license inventory (SIEM/SOAR/EDR)', kind: 'inventory', whyNeeded: 'Determines who owns/pays for SIEM/SOAR/EDR licenses; tooling ownership is the largest hidden cost and lock-in risk in MSSP deals.', sourceDocHint: 'Security tool inventory + license entitlements (CSV/XLSX)', acceptedFormats: ['csv', 'xlsx'], backing: { table: 'tower_cmdb_cis', keyColumn: 'tenant_key' }, feedsMethods: ['tco_normalization', 'should_cost'] }),
    f({ key: 'alert_incident_baseline', label: 'Alert / incident baseline (volume, EPS, MTTD/MTTR)', kind: 'metric_baseline', whyNeeded: 'Baselines detection/response performance and exposes alert-volume/EPS pricing that would punish visibility.', sourceDocHint: 'SIEM alert + incident export: EPS/GB-day, ticket volume, MTTD, MTTR, false-positive rate (CSV)', acceptedFormats: ['csv', 'xlsx'], backing: { table: 'tower_incidents', keyColumn: 'tenant_key' }, feedsMethods: ['sla_gap', 'should_cost'] }),
    f({ key: 'coverage_staffing_model', label: 'Coverage & staffing model (24x7, L1/L2/L3, geo/language)', kind: 'org', whyNeeded: 'Defines the 24x7 SOC shift, tier depth, geography, language, and named-skill coverage the provider must guarantee.', sourceDocHint: 'SOC staffing / shift-coverage matrix + escalation roster (XLSX)', acceptedFormats: ['xlsx', 'csv'], feedsMethods: ['should_cost'] }),
    f({ key: 'compliance_control_map', label: 'Compliance & security-control map', kind: 'process', whyNeeded: 'Maps monitored controls to regulatory/framework obligations (NIST CSF, ISO 27001, PCI-DSS, HIPAA, SOC 2) so gaps are visible, not assumed.', sourceDocHint: 'Control-to-framework mapping + audit obligations (XLSX/DOCX)', acceptedFormats: ['xlsx', 'docx', 'pdf'], feedsMethods: ['market_benchmark'] }),
    RUN_COST_BASELINE,
    CONTRACT_BASELINE,
    f({ key: 'incumbent_mssp_performance', label: 'Current MSSP / SOC performance', kind: 'metric_baseline', whyNeeded: 'Quantifies incumbent detection/response performance, missed-incident history, and escalation reality for leverage.', sourceDocHint: 'MSSP scorecards + incident post-mortems + SLA attainment (XLSX/PDF)', acceptedFormats: ['xlsx', 'pdf'], feedsMethods: ['sla_gap', 'market_benchmark'] }),
  ],
  optionalEvidenceFamilies: [
    f({ key: 'asset_log_source_inventory', label: 'Asset & log-source inventory', kind: 'inventory', whyNeeded: 'Establishes monitored-vs-blind estate and log-source coverage so "visibility" is measured, not asserted.', sourceDocHint: 'Log-source / data-connector inventory (CSV)', acceptedFormats: ['csv', 'xlsx'] }),
    f({ key: 'threat_profile', label: 'Threat profile & prior incidents', kind: 'qualitative', whyNeeded: 'Sizes threat-hunting and breach-support obligations against the client’s actual risk, not a generic template.', sourceDocHint: 'Threat model / prior-breach memo (DOCX/PDF)', acceptedFormats: ['docx', 'pdf'] }),
  ],
  requiredStakeholders: ['CISO', 'Head of Security Operations / SOC Lead', 'Incident Response Lead', 'IT Infrastructure', 'Procurement / Vendor Management', 'Compliance / Risk Officer', 'Data Protection / Privacy Officer'],
  sourcingStrategyQuestions: [
    'Are we buying monitoring, or are we buying detection AND response with named accountability?',
    'Who owns and pays for SIEM/SOAR/EDR licenses — us or the provider — and what happens to the data and tooling on exit?',
    'What MTTD/MTTR do we require by incident severity, and what remedy applies when the provider misses?',
    'What threat-hunting, automation, and breach-support obligations must be contractual, not best-effort?',
    'How do we price so that adding log sources / visibility does not increase our bill and the provider is not incentivized to suppress alerts?',
  ],
  vendorDiscussionGuide: {
    topics: ['24x7 SOC coverage & tier model (L1/L2/L3)', 'SIEM/SOAR/EDR ownership & licensing', 'Detection & response accountability (MTTD/MTTR by severity)', 'Escalation & incident-severity model', 'Threat hunting & detection engineering', 'Breach / major-incident support', 'False-positive & tuning ownership', 'Compliance reporting & transparency'],
    ask: ['Which SIEM/SOAR/EDR do you deliver on, who holds the licenses, and what do the licenses and our historical data cost us if we leave?', 'Commit MTTD and MTTR by incident severity, in writing, with meaningful remedies — what will you sign?', 'What threat-hunting cadence and detection-engineering (new use cases per quarter) will you commit to?', 'What breach / major-incident support is included vs. billed T&M, and what is your escalation path to L3 and IR?', 'Who owns false-positive tuning, and how do you prevent alert suppression from gaming your SLAs?'],
    doNotRevealYet: ['Our internal should-cost and per-endpoint / per-log-source budget', 'Our walk-away position and incumbent switch intent', 'Incumbent’s missed-incident history and current rates', 'Our EPS / data-volume growth forecast'],
    likelyPushback: ['Committing only to alert-acknowledgement SLAs, not detection/response outcomes', 'Pricing on EPS / alert volume so visibility increases cost', 'Treating threat hunting and breach support as premium add-ons', 'Requiring the client to buy tooling on the provider’s paper (lock-in)', 'Shifting false-positive triage burden back to the client'],
    challengeAssumptions: ['That "24x7 monitoring" implies response — it usually does not', 'That alert acknowledgement equals incident containment', 'That EPS/log-volume can only grow, so volume pricing is fair', 'That the provider’s SIEM is cheaper than client-owned tooling once exit is priced in'],
  },
  rfpDocumentStructure: [
    { key: 'exec_overview', title: 'Executive overview & security outcomes sought', required: true, evidenceDependencies: [] },
    { key: 'scope_coverage', title: 'Scope: monitored estate, log sources & coverage model', required: true, evidenceDependencies: ['asset_log_source_inventory', 'coverage_staffing_model'] },
    { key: 'soc_model', title: '24x7 SOC & tier model (L1/L2/L3, geo/language, named skills)', required: true, evidenceDependencies: ['coverage_staffing_model'] },
    { key: 'tooling_ownership', title: 'SIEM/SOAR/EDR ownership, licensing & data portability', required: true, evidenceDependencies: ['security_tooling_inventory'] },
    { key: 'detection_response', title: 'Detection & response SLAs (MTTD/MTTR by severity) + remedies', required: true, evidenceDependencies: ['alert_incident_baseline'] },
    { key: 'escalation_model', title: 'Escalation & incident-severity model', required: true, evidenceDependencies: ['alert_incident_baseline'] },
    { key: 'threat_hunting', title: 'Threat hunting, detection engineering & automation commitments', required: true, evidenceDependencies: ['threat_profile'] },
    { key: 'breach_support', title: 'Breach / major-incident support obligations', required: true, evidenceDependencies: ['threat_profile'] },
    { key: 'compliance_reporting', title: 'Compliance mapping, reporting & transparency', required: true, evidenceDependencies: ['compliance_control_map'] },
    { key: 'pricing_schedule', title: 'Pricing schedule (asset-based, not alert-volume)', required: true, evidenceDependencies: ['security_tooling_inventory', 'coverage_staffing_model'] },
    { key: 'commercial_terms', title: 'Commercial terms appendix (SLA credits, exit, data return, audit)', required: true, evidenceDependencies: ['contract_baseline'] },
    { key: 'response_instructions', title: 'Response instructions & evaluation criteria', required: true, evidenceDependencies: [] },
  ],
  pricingModel: {
    model: 'asset/coverage-based subscription (per endpoint/identity/log-source band) + fixed 24x7 SOC + tooling ownership decision + IR retainer',
    costComponents: ['SOC coverage by tier (L1/L2/L3, 24x7)', 'SIEM/SOAR/EDR licensing (who owns)', 'log-source / data ingestion (GB-day or bounded)', 'threat-hunting & detection engineering', 'incident-response retainer / breach support', 'onboarding & log-source integration (one-time)', 'compliance reporting'],
    traps: ['EPS / alert-volume pricing that punishes visibility and incentivizes alert suppression', 'SIEM/SOAR/EDR licensing on the provider’s paper creating lock-in and hostage data', 'Threat hunting and breach support priced as premium add-ons or billed T&M', 'Unbounded data-ingestion / GB-day charges as log sources grow', 'Response SLAs quoted as acknowledgement, not containment, with no real remedy', 'False-positive triage billed back to the client'],
    shouldCost: true,
  },
  evaluationModel: {
    criteria: [
      { key: 'detection_response', label: 'Detection & response accountability (MTTD/MTTR + remedies)', weight: 0.30 },
      { key: 'coverage_capability', label: 'Coverage & SOC capability (24x7, tier depth, named skills)', weight: 0.20 },
      { key: 'price', label: 'Normalized price / should-cost gap (incl. tooling & exit)', weight: 0.20 },
      { key: 'threat_hunting', label: 'Threat hunting, automation & breach support', weight: 0.15 },
      { key: 'compliance_transparency', label: 'Compliance mapping & reporting transparency', weight: 0.10 },
      { key: 'risk', label: 'Tooling lock-in & concentration risk', weight: 0.05 },
    ],
    disqualifiers: ['No committed MTTR remedy by incident severity (acknowledgement-only SLAs)', 'No breach / major-incident support obligation', 'SIEM/SOAR/EDR licenses only available on provider paper with no data-return / exit path', 'Cannot evidence comparable-scale 24x7 SOC delivery', 'Pricing solely on alert volume / EPS'],
  },
  riskModel: {
    dimensions: ['incident-accountability gap (monitoring without response)', 'tooling lock-in & data hostage risk', 'alert-suppression / SLA-gaming risk', 'coverage / staffing concentration risk', 'compliance-control blind spots', 'escalation-failure risk during a live breach'],
    contractProtections: ['MTTD/MTTR SLAs by severity with meaningful credits', 'defined escalation & incident-severity model', 'threat-hunting & detection-engineering commitments', 'breach-support obligation with response-time SLA', 'SIEM/SOAR/EDR data-return & tooling-portability on exit', 'right to audit detection efficacy & false-positive rates', 'no-alert-suppression / visibility clause'],
  },
  negotiationLevers: [
    { key: 'tooling_ownership', label: 'Tooling ownership / consolidation decision', rationale: 'Deciding SIEM/SOAR/EDR ownership pre-RFP removes the provider’s largest lock-in lever and repositions licensing as a client asset.', timing: 'pre_rfp' },
    { key: 'response_remedies', label: 'Meaningful MTTR remedies by severity', rationale: 'Converts a "monitoring" deal into an accountable "response" deal; the core protection against a breach with no owner.', timing: 'rfp' },
    { key: 'threat_hunting_automation', label: 'Threat-hunting & automation commitments', rationale: 'Locks proactive detection and SOAR automation into scope rather than as billed add-ons.', timing: 'bafo' },
    { key: 'breach_support', label: 'Breach / major-incident support obligation', rationale: 'Guarantees surge IR capacity when it matters most, capping T&M exposure during a crisis.', timing: 'bafo' },
    { key: 'transparency_exit', label: 'Reporting transparency + data return on exit', rationale: 'Protects visibility into detection efficacy and prevents data/tooling being held hostage at renewal.', timing: 'final_contracting' },
  ],
  deliverablePack: [
    { key: 'mssp_strategy_memo', label: 'MSSP / SOC Sourcing Strategy Memo', stage: 'strategy', audience: 'CISO · Sponsor', sections: ['Objective & security outcomes', 'Monitoring vs response accountability posture', 'Tooling ownership decision (SIEM/SOAR/EDR)', 'Detection/response targets (MTTD/MTTR)', 'Coverage & compliance requirements', 'Should-cost summary'], qualityBar: { minSections: 6, requiresCitations: true, altitude: 'exec', rubric: ['Names this client’s tooling, EPS, and incident baselines (not generic)', 'States response accountability, not just monitoring', 'Every cost/MTTR claim cited or marked missing'] }, formats: ['html', 'docx'], gateArtifact: true },
    { key: 'mssp_rfp', label: 'MSSP / SOC RFP (outcome-structured)', stage: 'rfp', audience: 'Vendors', sections: ['Scope & coverage', '24x7 SOC & tier model', 'Tooling ownership & data portability', 'Detection/response SLAs & remedies', 'Escalation model', 'Threat hunting & breach support', 'Compliance & reporting', 'Pricing schedule', 'Commercial terms'], qualityBar: { minSections: 8, requiresCitations: true, altitude: 'full', rubric: ['Demands MTTD/MTTR by severity with remedies', 'Pricing schedule is asset-based, not alert-volume', 'Coverage/volumes cited from evidence'] }, formats: ['docx', 'pdf', 'xlsx'], gateArtifact: true },
    { key: 'mssp_negotiation_memo', label: 'MSSP Pricing & Negotiation Memo', stage: 'bafo', audience: 'CISO · Procurement', sections: ['Should-cost vs proposals (incl. tooling & exit)', 'Response-accountability gap by vendor', 'Lever plan', 'BAFO asks by vendor', 'Walk-away'], qualityBar: { minSections: 5, requiresCitations: true, altitude: 'exec', rubric: ['Vendor-specific asks on MTTR remedies & tooling', 'Should-cost cited incl. exit/tooling', 'Walk-away stated'] }, formats: ['html', 'docx'] },
  ],
  gateCriteria: [
    { key: 'mssp_scope_evidenced', describe: 'Tooling inventory, coverage model, and alert/incident baseline are usable evidence before RFP.', fromStage: 'scope', toStage: 'rfp', severity: 'hard' },
    { key: 'mssp_response_accountable', describe: 'RFP demands detection/response SLAs (MTTD/MTTR by severity) with remedies, not acknowledgement-only monitoring.', fromStage: 'rfp', toStage: 'responses', severity: 'hard' },
    { key: 'mssp_pricing_normalized', describe: 'Proposals normalized to should-cost including tooling ownership and exit before BAFO.', fromStage: 'pricing', toStage: 'bafo', severity: 'hard' },
  ],
  agentGuidance: {
    systemFraming: 'This is a cybersecurity / MSSP / SOC-outsourcing sourcing event. Reason over committed security tooling/license inventory, alert/incident baseline (volume, EPS, MTTD/MTTR), coverage & staffing model, compliance-control map, run cost, and incumbent MSSP performance. The core failure mode to prevent is a "monitoring" deal with no incident accountability. Never assert a detection/response gap without committed MTTD/MTTR baseline; never assert a savings number without committed run-cost + should-cost including tooling ownership and exit; never treat alert-volume/EPS pricing as neutral — flag that it punishes visibility. Name missing evidence explicitly.',
    keyQuestions: ['Are we buying monitoring or accountable detection AND response?', 'Who owns SIEM/SOAR/EDR licenses and what does exit cost?', 'What MTTD/MTTR remedies by severity are defensible?', 'Where is the incumbent above should-cost or missing incidents?', 'Is pricing asset-based rather than alert-volume?'],
    requiresGroundedAnswer: true,
  },
  stageModel: [
    { stage: 'strategy', requiredEvidence: [{ family: 'run_cost_baseline', severity: 'hard' }, { family: 'security_tooling_inventory', severity: 'hard' }, { family: 'alert_incident_baseline', severity: 'soft' }], analysisMethods: ['should_cost'], deliverables: ['mssp_strategy_memo'] },
    { stage: 'scope', requiredEvidence: [{ family: 'security_tooling_inventory', severity: 'hard' }, { family: 'alert_incident_baseline', severity: 'hard' }, { family: 'coverage_staffing_model', severity: 'hard' }, { family: 'compliance_control_map', severity: 'hard' }], analysisMethods: ['sla_gap', 'tco_normalization'], deliverables: [] },
    { stage: 'rfp', requiredEvidence: [{ family: 'coverage_staffing_model', severity: 'hard' }, { family: 'alert_incident_baseline', severity: 'hard' }, { family: 'compliance_control_map', severity: 'soft' }], analysisMethods: [], deliverables: ['mssp_rfp'] },
    { stage: 'pricing', requiredEvidence: [{ family: 'run_cost_baseline', severity: 'hard' }, { family: 'security_tooling_inventory', severity: 'hard' }, { family: 'contract_baseline', severity: 'soft' }], analysisMethods: ['tco_normalization', 'should_cost'], deliverables: [] },
    { stage: 'bafo', requiredEvidence: [{ family: 'incumbent_mssp_performance', severity: 'soft' }], analysisMethods: ['market_benchmark', 'sla_gap'], deliverables: ['mssp_negotiation_memo'] },
  ],
};
export const STAFF_AUGMENTATION: SourceEventArchetype = {
  id: 'STAFF_AUGMENTATION',
  name: 'Staff Augmentation / Contractor Labor',
  description: 'Sourcing and re-competing contingent IT labor — turning contractor spend into rate-card, role, tenure, location, utilization, and compliance intelligence.',
  version: '1.0.0', status: 'validated', eventType: 'staffing',
  applicableSpendCategories: ['staff_augmentation', 'contingent_labor', 'it_contractors'],
  requiredEvidenceFamilies: [
    f({ key: 'contractor_roster', label: 'Current contractor roster', kind: 'org', whyNeeded: 'The unit of analysis — one row per contractor with role, level, bill rate, tenure, location, and supplier. Without it, every rate, tenure, and arbitrage claim is a guess.', sourceDocHint: 'VMS/MSP contractor roster export (CSV/XLSX)', acceptedFormats: ['csv', 'xlsx'], backing: { table: 'tower_staffing_roster', keyColumn: 'tenant_key' }, feedsMethods: ['rate_normalization', 'role_normalization', 'tenure_analysis', 'location_mix_analysis'] }),
    RUN_COST_BASELINE,
    f({ key: 'contingent_spend_baseline', label: 'Contingent labor spend baseline', kind: 'financial', whyNeeded: 'The independent cost basis for should-cost and arbitrage-leakage claims by role, level, and location.', sourceDocHint: 'Contingent spend by supplier/role (CSV/XLSX)', acceptedFormats: ['csv', 'xlsx'], backing: { table: 'tower_it_financials', keyColumn: 'tenant_key' }, feedsMethods: ['should_cost', 'market_benchmark', 'tco_normalization'] }),
    f({ key: 'rate_card', label: 'Current rate card', kind: 'commercial', whyNeeded: 'Establishes agreed bill rates by role/level/location — the surface where rate-card sprawl and markup opacity hide.', sourceDocHint: 'MSP/VMS rate card by role and level (XLSX/PDF)', acceptedFormats: ['xlsx', 'pdf'], feedsMethods: ['rate_normalization', 'market_benchmark'] }),
    f({ key: 'bill_pay_rate_split', label: 'Bill rate vs pay rate / markup', kind: 'commercial', whyNeeded: 'Exposes markup opacity — the spread between what suppliers bill and what workers are paid.', sourceDocHint: 'Rate breakdown / markup schedule (XLSX)', acceptedFormats: ['xlsx'], feedsMethods: ['market_benchmark', 'tco_normalization'] }),
    f({ key: 'role_taxonomy', label: 'Role / skill taxonomy', kind: 'org', whyNeeded: 'Normalizes titles to a common ladder so senior-title inflation and skill mismatch are detectable.', sourceDocHint: 'Role/level taxonomy (XLSX)', acceptedFormats: ['xlsx', 'csv'], feedsMethods: ['role_normalization'] }),
    f({ key: 'tenure_data', label: 'Contractor tenure data', kind: 'org', whyNeeded: 'Flags long-tenure contractors behaving as permanent workforce (co-employment / conversion exposure).', sourceDocHint: 'Start dates / assignment history (CSV/XLSX)', acceptedFormats: ['csv', 'xlsx'], feedsMethods: ['tenure_analysis'] }),
    f({ key: 'location_mix', label: 'Onshore / offshore / nearshore mix', kind: 'org', whyNeeded: 'Sizes labor-arbitrage opportunity and the cost of an onshore-heavy footprint.', sourceDocHint: 'Roster with delivery location (CSV/XLSX)', acceptedFormats: ['csv', 'xlsx'], feedsMethods: ['location_mix_analysis', 'should_cost'] }),
    f({ key: 'utilization_alignment', label: 'Utilization & project alignment', kind: 'metric_baseline', whyNeeded: 'Identifies idle, bench, and low-value contractor spend not tied to an active project.', sourceDocHint: 'Timesheet / project allocation export (CSV/XLSX)', acceptedFormats: ['csv', 'xlsx'], feedsMethods: ['utilization_analysis'] }),
    f({ key: 'classification_compliance', label: 'Worker classification & compliance status', kind: 'qualitative', whyNeeded: 'Baselines co-employment, misclassification, and access-risk exposure the buyer must remediate.', sourceDocHint: 'Classification / compliance register (XLSX/DOCX)', acceptedFormats: ['xlsx', 'docx'] }),
    CONTRACT_BASELINE,
  ],
  optionalEvidenceFamilies: [
    f({ key: 'supplier_scorecards', label: 'Supplier performance scorecards', kind: 'metric_baseline', whyNeeded: 'Quantifies incumbent-supplier leverage and fill-rate/quality gaps.', sourceDocHint: 'MSP supplier scorecards (XLSX)', acceptedFormats: ['xlsx'] }),
    f({ key: 'benchmark_rates', label: 'Market rate benchmarks', kind: 'commercial', whyNeeded: 'Anchors rate-card compression to independent market data by role/level/location.', sourceDocHint: 'Rate benchmark data (XLSX)', acceptedFormats: ['xlsx'], feedsMethods: ['market_benchmark'] }),
  ],
  requiredStakeholders: ['CIO', 'Head of IT Delivery / Resource Management', 'Procurement / Vendor Management', 'HR / Contingent Workforce lead', 'Legal (worker classification)', 'Finance (labor-cost owner)'],
  sourcingStrategyQuestions: [
    'What is our should-cost by role, level, and location, and where is the rate card above it?',
    'How much rate-card sprawl exists, and where is senior-title inflation padding the bill?',
    'Which long-tenure contractors carry co-employment risk and should convert or exit?',
    'What onshore/offshore/nearshore mix right-sizes cost against delivery risk?',
    'Where is idle, bench, or unaligned contractor spend we can eliminate?',
    'Is markup transparent, and where is bill-vs-pay spread indefensible?',
  ],
  vendorDiscussionGuide: {
    topics: ['Rate-card structure & benchmarking', 'Markup / bill-vs-pay transparency', 'Role & skill validation', 'Location-mix economics', 'Tenure & conversion terms', 'Fill rate, quality & continuity', 'Classification & co-employment protection'],
    ask: ['Show your rate card by role/level/location and how it benchmarks to market', 'What is your markup, and will you commit to bill-vs-pay transparency?', 'How do you validate that a “senior” contractor is priced to the actual skill delivered?', 'What conversion terms apply for long-tenure contractors, and what do they cost?', 'What fill-rate and named-continuity commitments will you sign to?'],
    doNotRevealYet: ['Our benchmarked should-cost by role/level', 'Our target rate-card compression percentage', 'The incumbent supplier’s current markup', 'Which long-tenure roles we intend to convert or insource'],
    likelyPushback: ['Resisting a consolidated, benchmarked rate card in favor of per-req rates', 'Opacity on markup / bill-vs-pay split', 'Defending senior titles without skill evidence', 'Resisting tenure caps and conversion terms'],
    challengeAssumptions: ['Assumed every senior title reflects senior skill', 'Assumed onshore rates without location-mix justification', 'Assumed long-tenure contractors carry no co-employment risk', 'Assumed all contractors are aligned to an active project'],
  },
  rfpDocumentStructure: [
    { key: 'exec_overview', title: 'Executive overview', required: true, evidenceDependencies: [] },
    { key: 'demand_profile', title: 'Contingent demand profile (roles, levels, volumes)', required: true, evidenceDependencies: ['contractor_roster', 'role_taxonomy'] },
    { key: 'rate_card_schedule', title: 'Consolidated rate-card schedule', required: true, evidenceDependencies: ['rate_card', 'benchmark_rates'] },
    { key: 'markup_transparency', title: 'Markup & bill-vs-pay transparency requirements', required: true, evidenceDependencies: ['bill_pay_rate_split'] },
    { key: 'location_model', title: 'Location / delivery-mix model', required: true, evidenceDependencies: ['location_mix'] },
    { key: 'tenure_conversion', title: 'Tenure limits & conversion terms', required: true, evidenceDependencies: ['tenure_data'] },
    { key: 'quality_fill', title: 'Fill rate, quality & continuity SLAs', required: true, evidenceDependencies: ['supplier_scorecards'] },
    { key: 'compliance', title: 'Worker classification & compliance requirements', required: true, evidenceDependencies: ['classification_compliance'] },
    { key: 'commercial_terms', title: 'Commercial terms appendix (rate governance, indexation, audit rights)', required: true, evidenceDependencies: ['contract_baseline'] },
    { key: 'response_instructions', title: 'Response instructions & evaluation criteria', required: true, evidenceDependencies: [] },
  ],
  pricingModel: {
    model: 'benchmarked rate-card by role/level/location + capped markup with fill/quality SLAs',
    costComponents: ['bill rate by role/level', 'markup over pay rate', 'location premium (onshore vs off/nearshore)', 'tenure/conversion fees', 'MSP program fee', 'rate indexation/COLA'],
    traps: ['Rate-card sprawl (per-req rates with no benchmark)', 'Senior-title inflation vs actual skill', 'Markup opacity (bill rate vs pay rate hidden)', 'Long-tenure contractors billed at premium with no conversion path', 'Idle/bench time billed as productive', 'Uncapped rate indexation'],
    shouldCost: true,
  },
  evaluationModel: {
    criteria: [
      { key: 'rate_competitiveness', label: 'Benchmarked rate competitiveness / should-cost gap', weight: 0.30 },
      { key: 'quality_fill', label: 'Fill rate, quality & continuity', weight: 0.25 },
      { key: 'transparency', label: 'Markup & rate-card transparency', weight: 0.15 },
      { key: 'compliance', label: 'Classification / co-employment protection', weight: 0.15 },
      { key: 'location_flexibility', label: 'Location-mix flexibility', weight: 0.15 },
    ],
    disqualifiers: ['Will not disclose markup / bill-vs-pay split', 'No committed fill-rate or continuity SLA', 'Cannot evidence rate benchmarking by role/level/location', 'No classification / co-employment safeguards'],
  },
  riskModel: {
    dimensions: ['co-employment / misclassification risk', 'rate-card sprawl risk', 'senior-title inflation risk', 'labor-arbitrage leakage', 'idle / low-utilization spend', 'access / security risk from contractor tenure', 'continuity / knowledge-loss risk'],
    contractProtections: ['benchmarked rate governance', 'markup cap & bill-vs-pay transparency', 'tenure limits + conversion terms', 'classification / co-employment indemnity', 'fill-rate & quality SLAs with credits', 'rate-benchmarking / audit rights', 'access-revocation on offboarding'],
  },
  negotiationLevers: [
    { key: 'incumbent_leverage', label: 'Multi-supplier / incumbent-tension', rationale: 'A credible re-compete across the contingent base compresses rates the incumbent has let drift.', timing: 'pre_rfp' },
    { key: 'rate_card_compression', label: 'Rate-card compression to benchmark', rationale: 'Consolidating sprawled per-req rates to a benchmarked card captures labor-arbitrage leakage directly.', timing: 'rfp' },
    { key: 'role_rationalization', label: 'Role rationalization / de-inflation', rationale: 'Re-levelling senior-title-inflated roles to actual skill removes premium the buyer overpays.', timing: 'rfp' },
    { key: 'markup_transparency', label: 'Markup cap & bill-vs-pay transparency', rationale: 'Forcing visibility into the spread caps hidden margin and enables ongoing benchmarking.', timing: 'bafo' },
    { key: 'location_optimization', label: 'Location-mix optimization', rationale: 'Shifting eligible roles off/nearshore captures arbitrage without touching delivery risk.', timing: 'bafo' },
    { key: 'tenure_conversion', label: 'Tenure limits + conversion terms', rationale: 'Caps co-employment exposure and converts embedded long-tenure contractors on defined terms.', timing: 'final_contracting' },
  ],
  deliverablePack: [
    { key: 'staffing_strategy_memo', label: 'Contingent Labor Sourcing Strategy Memo', stage: 'strategy', audience: 'CIO · Procurement · Sponsor', sections: ['Objective', 'Should-cost by role/level/location', 'Rate-card sprawl & inflation findings', 'Tenure / co-employment exposure', 'Location-mix & arbitrage opportunity', 'Compression target & posture'], qualityBar: { minSections: 6, requiresCitations: true, altitude: 'exec', rubric: ['Names this client’s roles/rates/tenures (not generic)', 'Every arbitrage-leakage $ cited or marked missing', 'Compression stated as a benchmarked target, not a guess'] }, formats: ['html', 'docx'], gateArtifact: true },
    { key: 'staffing_rfp', label: 'Contingent Labor RFP (rate-card structured)', stage: 'rfp', audience: 'Suppliers / MSPs', sections: ['Demand profile', 'Rate-card schedule', 'Markup transparency', 'Location model', 'Tenure & conversion', 'Fill/quality SLAs', 'Compliance', 'Commercial terms'], qualityBar: { minSections: 8, requiresCitations: true, altitude: 'full', rubric: ['Rate-card-structured by role/level/location', 'Volumes/rates cited from roster evidence', 'Markup transparency + tenure caps mandatory'] }, formats: ['docx', 'pdf', 'xlsx'], gateArtifact: true },
    { key: 'staffing_negotiation_memo', label: 'Rate & Negotiation Memo', stage: 'bafo', audience: 'CIO · Procurement', sections: ['Should-cost vs proposed rates', 'Compression lever plan', 'BAFO asks by supplier', 'Walk-away'], qualityBar: { minSections: 4, requiresCitations: true, altitude: 'exec', rubric: ['Supplier-specific rate asks', 'Should-cost cited by role/level', 'Walk-away stated'] }, formats: ['html', 'docx'] },
  ],
  gateCriteria: [
    { key: 'staffing_baseline_evidenced', describe: 'Contractor roster + spend + rate card are usable evidence before RFP.', fromStage: 'scope', toStage: 'rfp', severity: 'hard' },
    { key: 'staffing_rates_normalized', describe: 'Proposed rates normalized to benchmarked should-cost by role/level/location before BAFO.', fromStage: 'pricing', toStage: 'bafo', severity: 'hard' },
  ],
  agentGuidance: {
    systemFraming: 'This is a staff-augmentation / contingent-IT-labor sourcing event. Reason over committed contractor roster, spend baseline, rate card, bill-vs-pay split, role taxonomy, tenure, location mix, utilization, and classification evidence. Never assert a rate-arbitrage or savings number without committed spend + benchmark evidence; never assert co-employment or title-inflation exposure without committed tenure/roster data; name missing evidence explicitly.',
    keyQuestions: ['What is the should-cost by role/level/location?', 'Where is the rate card above benchmark and where is sprawl?', 'Which long-tenure contractors carry co-employment risk?', 'Where is idle or unaligned contractor spend?', 'What location-mix and conversion moves capture arbitrage?'],
    requiresGroundedAnswer: true,
  },
  stageModel: [
    { stage: 'strategy', requiredEvidence: [{ family: 'contingent_spend_baseline', severity: 'hard' }, { family: 'rate_card', severity: 'hard' }], analysisMethods: ['should_cost', 'market_benchmark'], deliverables: ['staffing_strategy_memo'] },
    { stage: 'scope', requiredEvidence: [{ family: 'contractor_roster', severity: 'hard' }, { family: 'role_taxonomy', severity: 'hard' }, { family: 'tenure_data', severity: 'hard' }, { family: 'location_mix', severity: 'hard' }, { family: 'utilization_alignment', severity: 'soft' }], analysisMethods: ['rate_normalization', 'role_normalization', 'tenure_analysis', 'location_mix_analysis', 'utilization_analysis'], deliverables: [] },
    { stage: 'rfp', requiredEvidence: [{ family: 'rate_card', severity: 'hard' }, { family: 'bill_pay_rate_split', severity: 'soft' }, { family: 'classification_compliance', severity: 'soft' }], analysisMethods: [], deliverables: ['staffing_rfp'] },
    { stage: 'pricing', requiredEvidence: [{ family: 'contingent_spend_baseline', severity: 'hard' }, { family: 'contract_baseline', severity: 'soft' }], analysisMethods: ['tco_normalization', 'should_cost', 'market_benchmark'], deliverables: [] },
    { stage: 'bafo', requiredEvidence: [], analysisMethods: ['market_benchmark'], deliverables: ['staffing_negotiation_memo'] },
  ],
};
export const DIGITAL_PRODUCT_ENGINEERING: SourceEventArchetype = {
  id: 'DIGITAL_PRODUCT_ENGINEERING',
  name: 'Digital Product Engineering Services',
  description: 'Sourcing outsourced product/software engineering pods to build and own digital products against velocity, quality, and outcome commitments — not staff augmentation.',
  version: '1.0.0', status: 'validated', eventType: 'consulting',
  applicableSpendCategories: ['product_engineering', 'software_development', 'digital_delivery'],
  requiredEvidenceFamilies: [
    f({ key: 'product_backlog_roadmap', label: 'Product backlog & roadmap', kind: 'process', whyNeeded: 'Defines the actual work the pod must deliver; without it "outcomes" and pod sizing are guesses.', sourceDocHint: 'Jira/Azure DevOps backlog export + roadmap (CSV/XLSX)', acceptedFormats: ['csv', 'xlsx'], backing: { table: 'product_backlog_items', keyColumn: 'tenant_key' }, feedsMethods: ['pod_sizing', 'outcome_scope'] }),
    f({ key: 'velocity_baseline', label: 'Delivery velocity baseline', kind: 'metric_baseline', whyNeeded: 'The independent basis for velocity SLAs; distinguishes a real pod from expensive staff aug.', sourceDocHint: 'Sprint velocity / throughput / cycle-time export (CSV)', acceptedFormats: ['csv', 'xlsx'], backing: { table: 'product_delivery_metrics', keyColumn: 'tenant_key' }, feedsMethods: ['velocity_sla', 'should_cost'] }),
    f({ key: 'quality_baseline', label: 'Engineering quality baseline (defect leakage, coverage)', kind: 'metric_baseline', whyNeeded: 'Sets the quality bar the pod must beat; prevents velocity bought with defect debt.', sourceDocHint: 'Defect-escape / test-coverage / change-failure export (CSV)', acceptedFormats: ['csv', 'xlsx'], feedsMethods: ['quality_gap', 'velocity_sla'] }),
    f({ key: 'current_team_cost', label: 'Current engineering team & cost', kind: 'financial', whyNeeded: 'Independent cost basis for should-cost and blended-rate normalization.', sourceDocHint: 'Engineering roster + cost by role/location (XLSX)', acceptedFormats: ['xlsx', 'csv'], backing: { table: 'engineering_staffing', keyColumn: 'tenant_key' }, feedsMethods: ['should_cost', 'tco_normalization'] }),
    f({ key: 'repo_ip_baseline', label: 'Repository & IP baseline', kind: 'inventory', whyNeeded: 'Establishes what code/IP exists, who owns it, and repo-access scope for no-reuse and handover terms.', sourceDocHint: 'Repo inventory + IP/ownership register (CSV/DOCX)', acceptedFormats: ['csv', 'docx', 'xlsx'], feedsMethods: ['ip_risk_model'] }),
    f({ key: 'tech_stack_architecture', label: 'Tech stack & architecture context', kind: 'document', whyNeeded: 'Sizes pod skill mix and ramp; drives named-team skill requirements.', sourceDocHint: 'Architecture overview + stack inventory (DOCX/PDF)', acceptedFormats: ['docx', 'pdf'], feedsMethods: ['pod_sizing'] }),
    f({ key: 'release_governance', label: 'Product / release / QA / security governance', kind: 'process', whyNeeded: 'Defines the cadences (release, QA, security, product) the pod must operate inside.', sourceDocHint: 'Release process + QA/security gate docs (DOCX)', acceptedFormats: ['docx', 'pdf'], feedsMethods: ['governance_fit'] }),
    CONTRACT_BASELINE,
  ],
  optionalEvidenceFamilies: [
    f({ key: 'incumbent_pod_performance', label: 'Incumbent pod performance', kind: 'metric_baseline', whyNeeded: 'Quantifies incumbent leverage and bait-and-switch history.', sourceDocHint: 'Vendor delivery scorecards (XLSX)', acceptedFormats: ['xlsx'] }),
    f({ key: 'nfr_slo_targets', label: 'Non-functional / SLO targets', kind: 'metric_baseline', whyNeeded: 'Binds "done" to performance, security, and reliability, not just feature count.', sourceDocHint: 'NFR / SLO schedule (XLSX/DOCX)', acceptedFormats: ['xlsx', 'docx'] }),
  ],
  requiredStakeholders: ['CTO / VP Engineering', 'Head of Product', 'Product / Engineering Managers', 'Procurement / Vendor Management', 'Security / IP counsel', 'Finance (engineering-cost owner)'],
  sourcingStrategyQuestions: [
    'Is this genuinely a pod that owns outcomes, or staff augmentation we are dressing up as agile?',
    'What velocity and quality do we require, and can we evidence today’s baseline to hold them to it?',
    'Which roles/seniority must be named and locked, and how do we prevent junior swap-in after award?',
    'Who owns the code and IP, and what repo access + no-reuse terms protect us?',
    'Is pricing outcome-based, pod-fixed, or T&M — and where is ramp/bench cost hiding?',
  ],
  vendorDiscussionGuide: {
    topics: ['Pod composition & named team', 'Velocity & delivery evidence', 'Quality engineering & test automation', 'IP ownership & repo access', 'Ramp & bench model', 'Release/product/QA/security governance'],
    ask: ['Name the actual team, with seniority and location — will you contractually lock it and let us run proof tasks?', 'What velocity and quality SLAs will you commit to, with credits, against our baseline?', 'How is code ownership assigned, and will you sign no-reuse and full-repo-handover terms?', 'Show your ramp plan and tell us exactly who pays for bench and re-ramp on churn.', 'Is this outcome-priced or T&M — and what changes if we hold you to outcomes?'],
    doNotRevealYet: ['Our internal should-cost / blended-rate target', 'Our walk-away and in-house build-cost position', 'The incumbent’s current blended rate'],
    likelyPushback: ['Pitching senior names but staffing juniors in delivery', 'Refusing velocity/quality SLAs as "not how agile works"', 'Framing staff aug as an "agile pod" to dodge accountability', 'Burying ramp/bench cost in the blended rate'],
    challengeAssumptions: ['That "agile" removes the need for delivery SLAs', 'That the pitched team is the delivered team', 'That velocity gains are real without a quality-leakage check', 'That IP ownership is automatic without explicit no-reuse terms'],
  },
  rfpDocumentStructure: [
    { key: 'exec_overview', title: 'Executive overview', required: true, evidenceDependencies: [] },
    { key: 'product_scope', title: 'Product scope, backlog & outcomes', required: true, evidenceDependencies: ['product_backlog_roadmap', 'tech_stack_architecture'] },
    { key: 'current_state', title: 'Current-state context (velocity, quality, cost)', required: true, evidenceDependencies: ['velocity_baseline', 'quality_baseline', 'current_team_cost'] },
    { key: 'pod_model', title: 'Pod composition & named-team requirements', required: true, evidenceDependencies: ['tech_stack_architecture'] },
    { key: 'delivery_slas', title: 'Velocity & quality SLA schedule + credits', required: true, evidenceDependencies: ['velocity_baseline', 'quality_baseline'] },
    { key: 'ip_repo', title: 'IP ownership, repo access & no-reuse terms', required: true, evidenceDependencies: ['repo_ip_baseline'] },
    { key: 'ramp_bench', title: 'Ramp, bench & continuity requirements', required: true, evidenceDependencies: ['current_team_cost'] },
    { key: 'governance', title: 'Product / release / QA / security governance model', required: true, evidenceDependencies: ['release_governance'] },
    { key: 'pricing_schedule', title: 'Pricing schedule (pod / blended-rate / outcome)', required: true, evidenceDependencies: ['current_team_cost'] },
    { key: 'commercial_terms', title: 'Commercial terms appendix (rate card, ramp caps, audit rights)', required: true, evidenceDependencies: ['contract_baseline'] },
    { key: 'response_instructions', title: 'Response instructions & evaluation criteria', required: true, evidenceDependencies: [] },
  ],
  pricingModel: {
    model: 'pod-fixed + blended-rate card with outcome-based milestones',
    costComponents: ['pod monthly rate by composition', 'blended rate by role/seniority/location', 'ramp/onboarding (one-time)', 'bench/continuity cost', 'outcome/milestone fees', 'COLA/indexation'],
    traps: ['"Agile pod" priced as open-ended staff aug with no accountability', 'Senior blended rate charged for junior-staffed delivery', 'Ramp and bench cost buried in the pod rate', 'No velocity/quality SLA, so price buys effort not outcomes', 'Uncapped COLA on a multi-year pod'],
    shouldCost: true,
  },
  evaluationModel: {
    criteria: [
      { key: 'delivery_capability', label: 'Delivery capability & velocity/quality credibility', weight: 0.30 },
      { key: 'price', label: 'Normalized price / should-cost gap', weight: 0.25 },
      { key: 'team_quality', label: 'Named-team seniority & proof-task performance', weight: 0.20 },
      { key: 'ip_governance', label: 'IP protection & governance fit', weight: 0.15 },
      { key: 'risk', label: 'Bait-and-switch / continuity / concentration risk', weight: 0.10 },
    ],
    disqualifiers: ['No committed velocity or quality SLA', 'Refuses named-team lock or proof tasks', 'No IP ownership / no-reuse / repo-handover terms', 'Cannot evidence comparable product-delivery outcomes'],
  },
  riskModel: {
    dimensions: ['bait-and-switch (senior-pitch/junior-delivery) risk', 'velocity/quality shortfall risk', 'IP leakage & repo-access risk', 'staff-aug drift (weak accountability) risk', 'ramp/bench cost overrun risk', 'key-person continuity risk'],
    contractProtections: ['named-team lock + proof-task gate', 'velocity & quality SLAs with credits', 'code-ownership + no-reuse + full-repo-handover clauses', 'ramp-cost cap + bench-cost ownership', 'outcome-milestone acceptance criteria', 'benchmarking clause', 'audit & repo-access controls'],
  },
  negotiationLevers: [
    { key: 'named_team_lock', label: 'Named-team lock + proof tasks', rationale: 'Kills senior-pitch/junior-delivery bait-and-switch by binding the pitched team and testing it before award.', timing: 'rfp' },
    { key: 'delivery_slas', label: 'Velocity & quality SLAs with credits', rationale: 'Converts an "agile pod" from effort-billing into accountable outcome delivery against the buyer’s baseline.', timing: 'bafo' },
    { key: 'blended_rate_compression', label: 'Blended-rate compression', rationale: 'Multi-bidder tension plus should-cost exposes and compresses inflated blended rates.', timing: 'bafo' },
    { key: 'ramp_cost_cap', label: 'Ramp-cost cap + bench ownership', rationale: 'Caps hidden onboarding/bench cost the vendor would otherwise recover through the pod rate.', timing: 'final_contracting' },
    { key: 'ip_protection', label: 'IP ownership + no-reuse + repo handover', rationale: 'Secures code/IP and clean exit; removes the vendor’s lock-in leverage.', timing: 'final_contracting' },
    { key: 'multi_bidder_tension', label: 'Multi-bidder / build-vs-buy tension', rationale: 'A credible in-house or alternate-pod option compresses pod pricing pre-RFP.', timing: 'pre_rfp' },
  ],
  deliverablePack: [
    { key: 'dpe_strategy_memo', label: 'Product Engineering Sourcing Strategy Memo', stage: 'strategy', audience: 'CTO · Head of Product · Sponsor', sections: ['Objective & outcomes', 'Pod-vs-staff-aug decision', 'Velocity & quality targets vs baseline', 'Should-cost & blended-rate posture', 'IP & governance requirements'], qualityBar: { minSections: 5, requiresCitations: true, altitude: 'exec', rubric: ['Names this client’s backlog/velocity/quality baseline (not generic)', 'Every cost/velocity claim cited or marked missing', 'States pod-vs-staff-aug decision explicitly with accountability terms'] }, formats: ['html', 'docx'], gateArtifact: true },
    { key: 'dpe_rfp', label: 'Product Engineering RFP (pod-structured)', stage: 'rfp', audience: 'Vendors', sections: ['Product scope & outcomes', 'Pod composition & named-team', 'Velocity/quality SLA schedule', 'IP / repo / no-reuse terms', 'Ramp & bench', 'Governance', 'Pricing schedule'], qualityBar: { minSections: 7, requiresCitations: true, altitude: 'full', rubric: ['Pod- and outcome-structured, not staff-aug', 'Velocity/quality baselines cited from evidence', 'Named-team lock + proof tasks explicit in the ask'] }, formats: ['docx', 'pdf', 'xlsx'], gateArtifact: true },
    { key: 'dpe_negotiation_memo', label: 'Product Engineering Pricing & Negotiation Memo', stage: 'bafo', audience: 'CTO · Procurement', sections: ['Should-cost vs proposals', 'Blended-rate normalization', 'Lever plan (named-team, SLAs, ramp cap, IP)', 'BAFO asks by vendor', 'Walk-away'], qualityBar: { minSections: 4, requiresCitations: true, altitude: 'exec', rubric: ['Vendor-specific asks', 'Should-cost & blended rates cited', 'Walk-away stated'] }, formats: ['html', 'docx'] },
  ],
  gateCriteria: [
    { key: 'dpe_scope_evidenced', describe: 'Backlog/roadmap + velocity + quality + team-cost are usable evidence before RFP.', fromStage: 'scope', toStage: 'rfp', severity: 'hard' },
    { key: 'dpe_named_team_proven', describe: 'Named-team lock accepted and proof tasks passed before pricing decisions.', fromStage: 'evaluation', toStage: 'pricing', severity: 'hard' },
    { key: 'dpe_pricing_normalized', describe: 'Proposals normalized to should-cost and blended rates before BAFO.', fromStage: 'pricing', toStage: 'bafo', severity: 'hard' },
  ],
  agentGuidance: {
    systemFraming: 'This is a digital product engineering services sourcing event — outsourced pods that build and own product, NOT staff augmentation. Reason over committed backlog/roadmap, velocity, quality, team-cost, repo/IP, and governance evidence. Never assert a savings or velocity-gap number without committed baseline + should-cost evidence; never accept an "agile pod" claim without velocity/quality SLAs, named-team lock, and IP terms; name missing evidence explicitly.',
    keyQuestions: ['Is this a real outcome-owning pod or expensive staff aug?', 'What velocity/quality gap can we evidence against baseline?', 'What blended-rate should-cost is defensible?', 'What named-team, IP, and ramp-cap protections must we lock?'],
    requiresGroundedAnswer: true,
  },
  stageModel: [
    { stage: 'strategy', requiredEvidence: [{ family: 'product_backlog_roadmap', severity: 'hard' }, { family: 'current_team_cost', severity: 'hard' }], analysisMethods: ['should_cost', 'pod_sizing'], deliverables: ['dpe_strategy_memo'] },
    { stage: 'scope', requiredEvidence: [{ family: 'velocity_baseline', severity: 'hard' }, { family: 'quality_baseline', severity: 'hard' }, { family: 'repo_ip_baseline', severity: 'hard' }, { family: 'tech_stack_architecture', severity: 'soft' }], analysisMethods: ['velocity_sla', 'quality_gap'], deliverables: [] },
    { stage: 'rfp', requiredEvidence: [{ family: 'product_backlog_roadmap', severity: 'hard' }, { family: 'release_governance', severity: 'soft' }, { family: 'repo_ip_baseline', severity: 'hard' }], analysisMethods: [], deliverables: ['dpe_rfp'] },
    { stage: 'evaluation', requiredEvidence: [{ family: 'velocity_baseline', severity: 'soft' }, { family: 'quality_baseline', severity: 'soft' }], analysisMethods: ['market_benchmark'], deliverables: [] },
    { stage: 'pricing', requiredEvidence: [{ family: 'current_team_cost', severity: 'hard' }, { family: 'contract_baseline', severity: 'soft' }], analysisMethods: ['tco_normalization', 'should_cost'], deliverables: [] },
    { stage: 'bafo', requiredEvidence: [], analysisMethods: ['market_benchmark'], deliverables: ['dpe_negotiation_memo'] },
  ],
};
export const CONTACT_CENTER_CX: SourceEventArchetype = {
  id: 'CONTACT_CENTER_CX',
  name: 'Contact Center / CX Outsourcing',
  description: 'Sourcing a customer-operations BPO partner to run contact-center / CX across channels — buying outcomes (CSAT/FCR/containment), not just seats and minutes.',
  version: '1.0.0', status: 'validated', eventType: 'managed_service',
  applicableSpendCategories: ['contact_center', 'customer_experience', 'cx_outsourcing'],
  requiredEvidenceFamilies: [
    f({ key: 'contact_volume_baseline', label: 'Contact volume baseline by channel', kind: 'metric_baseline', whyNeeded: 'Calls/chats/emails/cases by channel are the unit that drives seats, minutes, and per-contact price; without them staffing and pricing are guesses.', sourceDocHint: 'ACD/CCaaS volume export by channel + interval (CSV/XLSX)', acceptedFormats: ['csv', 'xlsx'], backing: { table: 'tower_incidents', keyColumn: 'tenant_key' }, feedsMethods: ['should_cost', 'staffing_model'] }),
    RUN_COST_BASELINE,
    f({ key: 'current_cx_pricing_model', label: 'Current CX cost & pricing model', kind: 'commercial', whyNeeded: 'Names the incumbent unit (per-seat / per-minute / per-contact) so the deal can be re-based to outcomes.', sourceDocHint: 'Incumbent invoices + rate card / pricing schedule (PDF/XLSX)', acceptedFormats: ['pdf', 'xlsx'], feedsMethods: ['tco_normalization', 'should_cost'] }),
    f({ key: 'quality_metrics_baseline', label: 'Quality metrics baseline (CSAT / FCR / QA / AHT / abandon)', kind: 'metric_baseline', whyNeeded: 'Sets the CX bar the partner must beat and grounds quality remedies; without it CSAT/FCR claims are unsupported.', sourceDocHint: 'CX quality report — CSAT, FCR, QA score, AHT, abandon, rework (XLSX)', acceptedFormats: ['xlsx', 'csv'], feedsMethods: ['sla_gap'] }),
    f({ key: 'automation_deflection_baseline', label: 'Automation & deflection baseline', kind: 'metric_baseline', whyNeeded: 'Current chatbot containment / IVR deflection / self-service rate; the basis for automation credits and outcome pricing.', sourceDocHint: 'Deflection & containment report by channel (XLSX/CSV)', acceptedFormats: ['xlsx', 'csv'], feedsMethods: ['should_cost', 'deflection_model'] }),
    f({ key: 'staffing_coverage_model', label: 'Staffing & coverage model (language / shift / location / seasonality)', kind: 'org', whyNeeded: 'Language mix, shift coverage, location, and seasonal peaks drive should-cost and occupancy assumptions.', sourceDocHint: 'Workforce/WFM roster + coverage matrix (XLSX)', acceptedFormats: ['xlsx', 'csv'], feedsMethods: ['should_cost', 'staffing_model'] }),
    f({ key: 'sla_kpi_baseline', label: 'SLA / KPI schedule tied to outcomes', kind: 'metric_baseline', whyNeeded: 'Current service-level and outcome targets the partner must commit to with remedies.', sourceDocHint: 'Current SLA/KPI schedule (PDF/XLSX)', acceptedFormats: ['pdf', 'xlsx'], feedsMethods: ['sla_gap'] }),
    CONTRACT_BASELINE,
    f({ key: 'transition_constraints', label: 'Transition & knowledge-transfer constraints', kind: 'qualitative', whyNeeded: 'Sizes ramp/nesting risk, agent knowledge transfer, and CSAT-hold during migration.', sourceDocHint: 'Transition constraints memo (DOCX)', acceptedFormats: ['docx', 'pdf'], feedsMethods: ['transition_risk_model'] }),
  ],
  optionalEvidenceFamilies: [
    f({ key: 'customer_journey_map', label: 'Customer journey & contact-driver taxonomy', kind: 'process', whyNeeded: 'Contact-reason mix exposes which volume is automatable vs must-serve.', sourceDocHint: 'Contact-driver / journey map (XLSX/DOCX)', acceptedFormats: ['xlsx', 'docx'] }),
    f({ key: 'incumbent_vendor_performance', label: 'Incumbent BPO performance', kind: 'metric_baseline', whyNeeded: 'Quantifies incumbent CSAT/FCR shortfall and switch leverage.', sourceDocHint: 'Vendor scorecards (XLSX)', acceptedFormats: ['xlsx'] }),
  ],
  requiredStakeholders: ['Head of Customer Experience / VP Customer Care', 'Contact Center Operations lead', 'WFM / Capacity Planning lead', 'Procurement / Vendor Management', 'CX Analytics / Quality lead', 'Finance (cost-to-serve owner)'],
  sourcingStrategyQuestions: [
    'Are we buying outcomes (CSAT/FCR/containment) or seats and minutes — and how do we re-base the deal to outcomes?',
    'What is our should-cost per contact by channel, and where is the incumbent above it?',
    'What automation/deflection glide-path do we require, and how do we stop per-seat pricing from punishing that success?',
    'What language / location / seasonality coverage do we need, and what shrinkage and occupancy are we willing to underwrite?',
    'What CSAT/FCR remedies and abandon-rate protections must the partner sign?',
  ],
  vendorDiscussionGuide: {
    topics: ['Outcome vs seat/minute pricing model', 'Quality & CSAT/FCR commitments and remedies', 'Automation / deflection & self-service commitments', 'Staffing, language, shrinkage & occupancy assumptions', 'Seasonality & peak coverage', 'Transition, ramp & nesting'],
    ask: ['Will you price on outcomes (per resolved contact / containment / CSAT-linked) rather than per-seat?', 'What CSAT, FCR, and abandon-rate targets will you commit to, with credits when you miss?', 'What deflection/containment will you commit to, and how does the price fall as automation removes volume?', 'Show your shrinkage and occupancy assumptions and how seasonal peaks are staffed.', 'How do you price transition and ramp, and what CSAT is protected during migration?'],
    doNotRevealYet: ['Our internal should-cost per contact', 'Our walk-away / retained cost-to-serve position', 'The incumbent’s current per-seat / per-minute rates', 'Our deflection target ceiling'],
    likelyPushback: ['Insisting on per-seat pricing that ignores deflection', 'Soft CSAT/FCR targets with no credits', 'Inflated occupancy assumptions to lower headline price', 'Excluding seasonal peak staffing from the base price', 'Treating automation savings as their upside, not the buyer’s'],
    challengeAssumptions: ['Assumed volume only grows and never deflects', 'Assumed occupancy above realistic sustained levels', 'Hidden shrinkage baked into per-seat rate', 'CSAT held flat through transition with no evidence'],
  },
  rfpDocumentStructure: [
    { key: 'exec_overview', title: 'Executive overview', required: true, evidenceDependencies: [] },
    { key: 'cx_scope', title: 'Scope of CX services & channels', required: true, evidenceDependencies: ['contact_volume_baseline', 'customer_journey_map'] },
    { key: 'current_state', title: 'Current-state context (volume, cost, quality)', required: true, evidenceDependencies: ['contact_volume_baseline', 'run_cost_baseline', 'quality_metrics_baseline'] },
    { key: 'quality_outcomes', title: 'Quality & outcome commitments (CSAT / FCR / abandon) + remedies', required: true, evidenceDependencies: ['quality_metrics_baseline', 'sla_kpi_baseline'] },
    { key: 'automation_deflection', title: 'Automation, deflection & self-service commitments', required: true, evidenceDependencies: ['automation_deflection_baseline'] },
    { key: 'pricing_schedule', title: 'Pricing schedule (outcome vs seat/minute/contact)', required: true, evidenceDependencies: ['contact_volume_baseline', 'current_cx_pricing_model'] },
    { key: 'staffing_coverage', title: 'Staffing, language, shrinkage & seasonality coverage', required: true, evidenceDependencies: ['staffing_coverage_model'] },
    { key: 'transition', title: 'Transition, ramp & knowledge-transfer requirements', required: true, evidenceDependencies: ['transition_constraints'] },
    { key: 'security', title: 'Security / privacy / PCI-DSS compliance requirements', required: true, evidenceDependencies: [] },
    { key: 'commercial_terms', title: 'Commercial terms appendix (rate card, indexation, audit rights)', required: true, evidenceDependencies: ['contract_baseline'] },
    { key: 'response_instructions', title: 'Response instructions & evaluation criteria', required: true, evidenceDependencies: [] },
  ],
  pricingModel: {
    model: 'outcome-based (per resolved contact / containment / CSAT-linked) with per-seat & per-minute floors and volume bands',
    costComponents: ['price per seat / per productive hour', 'price per minute / per contact', 'outcome / CSAT-linked component', 'language & shift premium', 'transition & ramp (one-time)', 'technology / CCaaS pass-through', 'indexation / COLA'],
    traps: ['Per-seat pricing that punishes deflection/automation success', 'Buying seats/minutes instead of resolved outcomes', 'Inflated occupancy assumptions lowering headline price', 'Hidden shrinkage and seasonal-peak labor', 'Weak CSAT/FCR remedies with no credits', 'Uncapped indexation on the seat rate'],
    shouldCost: true,
  },
  evaluationModel: {
    criteria: [
      { key: 'cx_quality', label: 'CX quality & outcome credibility (CSAT/FCR/abandon)', weight: 0.30 },
      { key: 'price', label: 'Normalized cost-per-contact / should-cost gap', weight: 0.25 },
      { key: 'automation', label: 'Automation / deflection commitment', weight: 0.15 },
      { key: 'staffing_coverage', label: 'Staffing, language & seasonality coverage', weight: 0.15 },
      { key: 'transition', label: 'Transition & ramp de-risking', weight: 0.10 },
      { key: 'risk', label: 'Delivery & concentration risk', weight: 0.05 },
    ],
    disqualifiers: ['No committed CSAT/FCR remedies or credits', 'Per-seat-only pricing with no outcome or deflection sharing', 'Cannot evidence comparable-scale CX delivery', 'No PCI-DSS / data-privacy compliance'],
  },
  riskModel: {
    dimensions: ['CSAT/FCR-shortfall risk', 'deflection / automation cannibalization risk', 'seasonality & peak-coverage risk', 'occupancy / shrinkage inflation risk', 'transition & ramp CSAT-drop risk', 'concentration risk'],
    contractProtections: ['CSAT/FCR/abandon remedies & credits', 'automation/deflection glide-path with shared savings', 'volume-band pricing that flexes down', 'shrinkage & occupancy transparency', 'seasonality coverage guarantee', 'termination assistance', 'PCI-DSS / data-privacy terms', 'benchmarking clause'],
  },
  negotiationLevers: [
    { key: 'incumbent_leverage', label: 'Incumbent CSAT/FCR shortfall + multi-bidder tension', rationale: 'Evidenced quality gap plus a credible switch threat compresses price before RFP.', timing: 'pre_rfp' },
    { key: 'volume_band', label: 'Volume-band pricing per contact', rationale: 'Forces price to flex down as volume falls and deflection removes contacts.', timing: 'rfp' },
    { key: 'outcome_shift', label: 'Shift from seats/minutes to outcomes', rationale: 'Re-bases the deal to resolved contacts / CSAT so the buyer stops paying for idle capacity.', timing: 'rfp' },
    { key: 'automation_credits', label: 'Automation / deflection credits with shared savings', rationale: 'Captures the deflection savings a per-seat model would otherwise let the vendor keep.', timing: 'bafo' },
    { key: 'quality_remedies', label: 'CSAT/FCR remedies + shrinkage/occupancy transparency', rationale: 'Puts real money at risk on quality and exposes inflated occupancy hiding margin.', timing: 'bafo' },
    { key: 'termination_assistance', label: 'Termination assistance + exit rates', rationale: 'Protects the next migration and caps lock-in on a customer-facing function.', timing: 'final_contracting' },
  ],
  deliverablePack: [
    { key: 'cx_strategy_memo', label: 'CX Outsourcing Sourcing Strategy Memo', stage: 'strategy', audience: 'Head of CX · Sponsor', sections: ['Objective', 'Outcome-vs-seats sourcing posture', 'Should-cost per contact summary', 'Automation / deflection targets', 'Quality (CSAT/FCR) bar & remedies', 'Transition posture'], qualityBar: { minSections: 6, requiresCitations: true, altitude: 'exec', rubric: ['Names this client’s channels/volumes and CSAT/FCR (not generic)', 'Every cost-per-contact claim cited or marked missing', 'Automation stated as a deflection glide-path, not a point', 'Pricing framed as outcomes, not seats/minutes'] }, formats: ['html', 'docx'], gateArtifact: true },
    { key: 'cx_rfp', label: 'CX Outsourcing RFP (outcome-structured)', stage: 'rfp', audience: 'BPO vendors', sections: ['CX scope & channels', 'Quality & outcome commitments', 'Automation & deflection', 'Pricing schedule', 'Staffing & seasonality coverage', 'Transition & ramp', 'Commercial terms'], qualityBar: { minSections: 7, requiresCitations: true, altitude: 'full', rubric: ['Outcome-structured, not seat/minute-structured', 'Volumes/cost/quality cited from evidence', 'Pricing schedule demands outcome + volume-band, not fixed seats'] }, formats: ['docx', 'pdf', 'xlsx'], gateArtifact: true },
    { key: 'cx_negotiation_memo', label: 'CX Pricing & Negotiation Memo', stage: 'bafo', audience: 'Head of CX · Procurement', sections: ['Should-cost per contact vs proposals', 'Lever plan (outcome shift, deflection credits, quality remedies)', 'BAFO asks by vendor', 'Walk-away'], qualityBar: { minSections: 4, requiresCitations: true, altitude: 'exec', rubric: ['Vendor-specific asks', 'Should-cost per contact cited', 'Walk-away / retained cost-to-serve stated'] }, formats: ['html', 'docx'] },
  ],
  gateCriteria: [
    { key: 'cx_scope_evidenced', describe: 'Contact volumes + run cost + quality baseline are usable evidence before RFP.', fromStage: 'scope', toStage: 'rfp', severity: 'hard' },
    { key: 'cx_pricing_normalized', describe: 'Proposals normalized to should-cost per contact (not headline seat rate) before BAFO.', fromStage: 'pricing', toStage: 'bafo', severity: 'hard' },
  ],
  agentGuidance: {
    systemFraming: 'This is a contact-center / CX outsourcing (customer-operations BPO) sourcing event. Reason over committed contact-volume-by-channel, run cost, current pricing model, quality metrics (CSAT/FCR/AHT/abandon), automation/deflection baseline, staffing/coverage, SLA, and contract evidence. The core job is to help the client buy CX OUTCOMES, not seats and minutes. Never assert a savings or cost-per-contact number without committed volume + run-cost evidence; never assert a CSAT/FCR gap without committed quality data; never assert deflection upside without committed automation baseline; name missing evidence explicitly.',
    keyQuestions: ['What is the should-cost per contact by channel?', 'Where is the incumbent above should-cost, and where is CSAT/FCR short?', 'What deflection glide-path is defensible, and does the price flex down with it?', 'What CSAT/FCR remedies and seasonality coverage must the partner sign?'],
    requiresGroundedAnswer: true,
  },
  stageModel: [
    { stage: 'strategy', requiredEvidence: [{ family: 'run_cost_baseline', severity: 'hard' }, { family: 'contact_volume_baseline', severity: 'hard' }], analysisMethods: ['should_cost'], deliverables: ['cx_strategy_memo'] },
    { stage: 'scope', requiredEvidence: [{ family: 'contact_volume_baseline', severity: 'hard' }, { family: 'quality_metrics_baseline', severity: 'hard' }, { family: 'automation_deflection_baseline', severity: 'hard' }, { family: 'staffing_coverage_model', severity: 'hard' }], analysisMethods: ['sla_gap', 'staffing_model'], deliverables: [] },
    { stage: 'rfp', requiredEvidence: [{ family: 'sla_kpi_baseline', severity: 'hard' }, { family: 'automation_deflection_baseline', severity: 'hard' }, { family: 'transition_constraints', severity: 'soft' }], analysisMethods: [], deliverables: ['cx_rfp'] },
    { stage: 'pricing', requiredEvidence: [{ family: 'run_cost_baseline', severity: 'hard' }, { family: 'current_cx_pricing_model', severity: 'hard' }, { family: 'contract_baseline', severity: 'soft' }], analysisMethods: ['tco_normalization', 'should_cost'], deliverables: [] },
    { stage: 'bafo', requiredEvidence: [], analysisMethods: ['market_benchmark'], deliverables: ['cx_negotiation_memo'] },
  ],
};

export const SOURCE_ARCHETYPE_REGISTRY: Record<string, SourceEventArchetype> = {
  [AMS_MANAGED_SERVICES.id]: AMS_MANAGED_SERVICES,
  [ERP_SI_IMPLEMENTATION.id]: ERP_SI_IMPLEMENTATION,
  [AI_DATA_PLATFORM.id]: AI_DATA_PLATFORM,
  [CONTRACT_RENEWAL.id]: CONTRACT_RENEWAL,
  [CLOUD_FINOPS.id]: CLOUD_FINOPS,
  [BPO_SHARED_SERVICES.id]: BPO_SHARED_SERVICES,
  [MSSP_CYBER.id]: MSSP_CYBER,
  [STAFF_AUGMENTATION.id]: STAFF_AUGMENTATION,
  [DIGITAL_PRODUCT_ENGINEERING.id]: DIGITAL_PRODUCT_ENGINEERING,
  [CONTACT_CENTER_CX.id]: CONTACT_CENTER_CX,
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
