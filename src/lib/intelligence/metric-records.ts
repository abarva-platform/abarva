export type MetricIndustry = 'specialty_retail' | 'healthcare_idn' | 'financial_services';
export type MetricDomain = 'front_office' | 'middle_office' | 'back_office';
export type MetricPriorityTier = 'tier_1' | 'tier_2' | 'tier_3';
export type MetricMaturityStatus = 'draft' | 'verified' | 'locked';
export type GapClass = 'quantitative_gap' | 'measurement_gap' | 'trajectory_gap';

export interface MetricRange {
  low: number;
  high: number;
  unit: string;
  label: string;
}

export interface MetricFoundationRequirements {
  data: string;
  identity: string;
  operations: string;
  governance: string;
}

export interface MetricVendorLandscapeEntry {
  vendorName: string;
  role: string;
  caution: string;
}

export interface MetricRecord {
  id: `PAT-MET-${string}`;
  name: string;
  aliases: readonly string[];
  industries: readonly MetricIndustry[];
  domain: MetricDomain;
  theme: string;
  priorityTier: MetricPriorityTier;
  definition: string;
  whyItMatters: string;
  cohort: string;
  northStarRange: MetricRange;
  leaderBenchmark: MetricRange;
  commonFloor: MetricRange;
  trajectorySignal: string;
  measurementDifficulty: 'low' | 'moderate' | 'high';
  foundationRequirements: MetricFoundationRequirements;
  vendorLandscape: readonly MetricVendorLandscapeEntry[];
  expectedGapClasses: readonly GapClass[];
  failureModeIds: readonly number[];
  patternRefs: readonly string[];
  refreshCadence: 'quarterly' | 'semi_annual' | 'annual';
  corpusVersion: string;
  maturityStatus: MetricMaturityStatus;
  authoredAt: string;
  sourceBasis: readonly string[];
}

const VERSION = 'v1.0.0';
const AUTHORED_AT = '2026-05-02';
const SOURCE_BASIS = [
  'AbarVa Canonical Vision V2, locked 2026-05-02',
  'AbarVa Metrics Corpus Authoring Brief, locked 2026-05-02',
  'Composite demo-tenant calibration for bounded gap-engine testing',
] as const;

function range(low: number, high: number, unit: string, label: string): MetricRange {
  return { low, high, unit, label };
}

function metric(input: Omit<MetricRecord, 'corpusVersion' | 'maturityStatus' | 'authoredAt' | 'sourceBasis'>): MetricRecord {
  return {
    ...input,
    corpusVersion: VERSION,
    maturityStatus: 'verified',
    authoredAt: AUTHORED_AT,
    sourceBasis: SOURCE_BASIS,
  };
}

export const METRIC_RECORDS: readonly MetricRecord[] = [
  metric({
    id: 'PAT-MET-001',
    name: 'Customer identity match rate',
    aliases: ['identity resolution match rate', 'customer match rate', 'profile match rate'],
    industries: ['specialty_retail'],
    domain: 'front_office',
    theme: 'customer_identity',
    priorityTier: 'tier_1',
    definition: 'Percent of active customer interactions resolved to a durable customer identity across store, ecommerce, service, and loyalty channels over a rolling 30-day window.',
    whyItMatters: 'Personalization, attribution, service continuity, and offer governance all degrade when the same customer is represented as multiple records.',
    cohort: 'Specialty retail, USD 1-5B revenue, multi-channel customer estate.',
    northStarRange: range(92, 97, '%', 'Resolved active interactions'),
    leaderBenchmark: range(85, 92, '%', 'Top-quartile omnichannel retailers'),
    commonFloor: range(45, 70, '%', 'Fragmented loyalty, ecommerce, and POS estates'),
    trajectorySignal: 'Leaders improve 3-6 points per year after CDP identity graph stabilization; laggards plateau when POS and ecommerce identity remain separate.',
    measurementDifficulty: 'moderate',
    foundationRequirements: {
      data: 'POS, ecommerce, loyalty, and service events joined at interaction grain.',
      identity: 'Canonical customer identity graph with survivorship rules.',
      operations: 'Weekly exception review for duplicate and anonymous profiles.',
      governance: 'Identity quality owner named across marketing, data, and store operations.',
    },
    vendorLandscape: [
      { vendorName: 'Salesforce Data Cloud', role: 'CDP identity graph and activation substrate', caution: 'Can hide weak source-system identity if match rules are not governed.' },
      { vendorName: 'Treasure Data', role: 'Enterprise CDP and event unification', caution: 'Requires disciplined source onboarding to avoid another data swamp.' },
    ],
    expectedGapClasses: ['quantitative_gap', 'measurement_gap'],
    failureModeIds: [3, 9],
    patternRefs: ['PAT-FM-003', 'PAT-FM-009'],
    refreshCadence: 'quarterly',
  }),
  metric({
    id: 'PAT-MET-002',
    name: 'First-party data addressability',
    aliases: ['addressable customer rate', 'consented profile coverage', 'known customer rate'],
    industries: ['specialty_retail'],
    domain: 'front_office',
    theme: 'customer_activation',
    priorityTier: 'tier_1',
    definition: 'Share of active customers with consented, usable first-party identifiers and at least one activation channel available in the last 90 days.',
    whyItMatters: 'AI-assisted marketing and service use cases become expensive guesses when the addressable customer base is too small or poorly permissioned.',
    cohort: 'Specialty retail, USD 1-5B revenue, loyalty plus ecommerce channels.',
    northStarRange: range(70, 85, '%', 'Active customers addressable'),
    leaderBenchmark: range(58, 70, '%', 'Top-quartile specialty retail'),
    commonFloor: range(20, 45, '%', 'Low loyalty penetration or fragmented consent stores'),
    trajectorySignal: 'Leaders expand addressability through loyalty, receipt capture, and preference centers; laggards lose coverage as paid-media identifiers degrade.',
    measurementDifficulty: 'moderate',
    foundationRequirements: {
      data: 'Consent, loyalty, ecommerce, email, SMS, app, and service identifiers in one profile store.',
      identity: 'Durable consent-to-profile binding by jurisdiction and channel.',
      operations: 'Activation suppression rules tested before campaign launch.',
      governance: 'Privacy and marketing jointly own consent decay and activation eligibility.',
    },
    vendorLandscape: [
      { vendorName: 'Klaviyo', role: 'Retail activation and owned-channel orchestration', caution: 'Strong activation does not fix upstream identity gaps.' },
      { vendorName: 'Braze', role: 'Cross-channel lifecycle orchestration', caution: 'Requires clean profile eligibility and preference logic.' },
    ],
    expectedGapClasses: ['quantitative_gap', 'trajectory_gap'],
    failureModeIds: [3, 6, 9],
    patternRefs: ['PAT-FM-003', 'PAT-FM-006', 'PAT-FM-009'],
    refreshCadence: 'quarterly',
  }),
  metric({
    id: 'PAT-MET-003',
    name: 'Forecast accuracy at SKU-week',
    aliases: ['SKU forecast accuracy', 'SKU-level demand forecast accuracy', 'WMAPE at SKU-week'],
    industries: ['specialty_retail'],
    domain: 'middle_office',
    theme: 'demand_forecasting',
    priorityTier: 'tier_1',
    definition: 'Forecast accuracy for unit demand at SKU-week grain, measured as one minus weighted mean absolute percentage error over a rolling 13-week window.',
    whyItMatters: 'It is the leading indicator for inventory turns, on-shelf availability, markdown exposure, and working capital tied up in poor allocation decisions.',
    cohort: 'Specialty retail, USD 1-5B revenue, 5,000-50,000 active SKUs.',
    northStarRange: range(88, 92, '%', 'One minus WMAPE'),
    leaderBenchmark: range(83, 88, '%', 'Top-quartile demand-sensing retailers'),
    commonFloor: range(62, 72, '%', 'Legacy category-week forecasting'),
    trajectorySignal: 'Leaders improve 1.5-3 points per year after weather, promotion, and event signals enter the forecast loop.',
    measurementDifficulty: 'moderate',
    foundationRequirements: {
      data: 'Clean sales history, returns netting, promotion calendar, inventory position, and demand-shaping events.',
      identity: 'Canonical SKU master with cross-channel SKU mapping.',
      operations: 'Weekly forecast review tied to replenishment and allocation decisions.',
      governance: 'S&OP accountable owner for forecast bias and error by category.',
    },
    vendorLandscape: [
      { vendorName: 'Blue Yonder Demand Planning', role: 'Enterprise demand planning and replenishment optimization', caution: 'Implementation value depends on clean SKU-store-day data.' },
      { vendorName: 'RELEX Solutions', role: 'Retail planning and store-level demand sensing', caution: 'Store granularity can expose master-data gaps quickly.' },
    ],
    expectedGapClasses: ['quantitative_gap', 'trajectory_gap'],
    failureModeIds: [3, 9],
    patternRefs: ['PAT-FM-003', 'PAT-FM-009'],
    refreshCadence: 'quarterly',
  }),
  metric({
    id: 'PAT-MET-004',
    name: 'On-shelf availability at SKU-store-day',
    aliases: ['OSA', 'store in-stock rate', 'shelf availability'],
    industries: ['specialty_retail'],
    domain: 'middle_office',
    theme: 'inventory_availability',
    priorityTier: 'tier_1',
    definition: 'Percent of expected selling SKU-store-days where product was available for sale on shelf or fulfillable from store inventory.',
    whyItMatters: 'Demand forecasting and replenishment AI cannot prove value if the retailer cannot measure whether the customer actually found the item available.',
    cohort: 'Specialty retail, USD 1-5B revenue, store plus ecommerce fulfillment.',
    northStarRange: range(95, 98, '%', 'Available SKU-store-days'),
    leaderBenchmark: range(91, 95, '%', 'Top-quartile store operators'),
    commonFloor: range(78, 88, '%', 'Manual counts or delayed inventory feeds'),
    trajectorySignal: 'Leaders improve after inventory feeds, planogram adherence, and exception workflows converge; laggards do not know where the shelf failure occurs.',
    measurementDifficulty: 'high',
    foundationRequirements: {
      data: 'SKU-store-day inventory, sales, planogram, receiving, and replenishment signals.',
      identity: 'Store, SKU, and fulfillment-node master data reconciled.',
      operations: 'Store exception workflow for phantom inventory and shelf replenishment.',
      governance: 'Merchandising and store operations share OSA accountability.',
    },
    vendorLandscape: [
      { vendorName: 'NCR Voyix', role: 'Store and POS operational signal capture', caution: 'POS alone cannot prove shelf availability.' },
      { vendorName: 'SAP S/4HANA Retail', role: 'Inventory and merchandising system of record', caution: 'Batch inventory feeds weaken near-real-time OSA measurement.' },
    ],
    expectedGapClasses: ['measurement_gap', 'quantitative_gap'],
    failureModeIds: [3, 5, 9],
    patternRefs: ['PAT-FM-003', 'PAT-FM-005', 'PAT-FM-009'],
    refreshCadence: 'quarterly',
  }),
  metric({
    id: 'PAT-MET-005',
    name: 'Finance close cycle days',
    aliases: ['monthly close days', 'close cycle time', 'days to close'],
    industries: ['specialty_retail'],
    domain: 'back_office',
    theme: 'finance_close_reporting',
    priorityTier: 'tier_1',
    definition: 'Number of business days from period end to complete management close with reconciliations, variance review, and reporting package issued.',
    whyItMatters: 'AI forecasting and margin actions lose operating value when finance cannot close and explain performance fast enough for corrective action.',
    cohort: 'Specialty retail, USD 1-5B revenue, multi-entity store footprint.',
    northStarRange: range(3, 5, 'business days', 'Management close'),
    leaderBenchmark: range(5, 7, 'business days', 'Top-quartile retailers'),
    commonFloor: range(10, 18, 'business days', 'Spreadsheet-heavy close process'),
    trajectorySignal: 'Leaders shrink close time through automated reconciliations and standard account mappings; laggards add review cycles as channel complexity rises.',
    measurementDifficulty: 'low',
    foundationRequirements: {
      data: 'ERP close tasks, reconciliation status, journal entries, and reporting timestamps.',
      identity: 'Chart-of-accounts and entity hierarchy mapped consistently.',
      operations: 'Close checklist with task ownership and exception reason codes.',
      governance: 'Controller owns close SLA and recurring-blocker burn-down.',
    },
    vendorLandscape: [
      { vendorName: 'BlackLine', role: 'Reconciliation and close automation', caution: 'Automation fails if account ownership and matching rules are weak.' },
      { vendorName: 'Oracle ERP Cloud', role: 'ERP and close orchestration substrate', caution: 'Reporting speed depends on data model and consolidation design.' },
    ],
    expectedGapClasses: ['quantitative_gap', 'trajectory_gap'],
    failureModeIds: [5, 9],
    patternRefs: ['PAT-FM-005', 'PAT-FM-009'],
    refreshCadence: 'quarterly',
  }),
  metric({
    id: 'PAT-MET-006',
    name: 'Enterprise data product adoption rate',
    aliases: ['analytics product adoption', 'BI product active usage', 'data product WAU'],
    industries: ['specialty_retail'],
    domain: 'back_office',
    theme: 'data_platform_adoption',
    priorityTier: 'tier_1',
    definition: 'Percent of named decision roles using certified data products at least weekly for operating decisions in the last 30 days.',
    whyItMatters: 'A modern data platform only becomes an AI foundation when operating leaders actually use governed data products instead of shadow spreadsheets.',
    cohort: 'Specialty retail, USD 1-5B revenue, enterprise analytics modernization.',
    northStarRange: range(75, 90, '%', 'Named decision roles weekly active'),
    leaderBenchmark: range(60, 75, '%', 'Top-quartile governed analytics programs'),
    commonFloor: range(15, 40, '%', 'Low-trust reporting estate'),
    trajectorySignal: 'Leaders improve through role-based product ownership and retirement of duplicate reports; laggards accumulate dashboards without behavior change.',
    measurementDifficulty: 'moderate',
    foundationRequirements: {
      data: 'Usage telemetry from BI, semantic layer, warehouse, and access logs.',
      identity: 'User-to-role mapping for decision roles and operating teams.',
      operations: 'Data product owners review adoption, freshness, and trust signals.',
      governance: 'Certified-product policy with retirement path for duplicate reports.',
    },
    vendorLandscape: [
      { vendorName: 'Tableau', role: 'BI and dashboard usage telemetry', caution: 'Dashboard views are not the same as decision adoption.' },
      { vendorName: 'Snowflake', role: 'Warehouse and governed data product substrate', caution: 'Compute usage must be tied to business adoption.' },
    ],
    expectedGapClasses: ['quantitative_gap', 'measurement_gap'],
    failureModeIds: [3, 5, 9],
    patternRefs: ['PAT-FM-003', 'PAT-FM-005', 'PAT-FM-009'],
    refreshCadence: 'quarterly',
  }),
  metric({
    id: 'PAT-MET-201',
    name: 'Prior authorization turnaround time',
    aliases: ['prior auth cycle time', 'PA turnaround', 'authorization elapsed time'],
    industries: ['healthcare_idn'],
    domain: 'front_office',
    theme: 'patient_access_prior_auth',
    priorityTier: 'tier_1',
    definition: 'Median elapsed time from complete authorization request submission to payer determination for scheduled services, measured weekly.',
    whyItMatters: 'Long authorization cycles delay care, create denials risk, consume staff capacity, and directly shape patient and clinician trust in access modernization.',
    cohort: 'Healthcare IDN, multi-hospital system with Epic as clinical system of record.',
    northStarRange: range(1, 2, 'business days', 'Median complete-request turnaround'),
    leaderBenchmark: range(2, 4, 'business days', 'Digitally mature access operations'),
    commonFloor: range(6, 14, 'business days', 'Manual payer portal workflow'),
    trajectorySignal: 'Leaders reduce cycle time as payer rules, clinical documentation, and request completeness are codified; laggards shift work from access to clinics.',
    measurementDifficulty: 'moderate',
    foundationRequirements: {
      data: 'Epic referral/order, auth workqueue, payer portal, and determination timestamps.',
      identity: 'Patient, encounter, order, payer, and service-line identifiers reconciled.',
      operations: 'Standard auth workqueue reason codes and escalation paths.',
      governance: 'Access, revenue cycle, and clinical operations share auth SLA ownership.',
    },
    vendorLandscape: [
      { vendorName: 'Epic', role: 'Clinical and access workflow system of record', caution: 'Native workqueues need payer-response integration to prove elapsed time.' },
      { vendorName: 'Waystar', role: 'Revenue cycle and authorization workflow support', caution: 'Automation depends on clean order and payer-rule data.' },
    ],
    expectedGapClasses: ['quantitative_gap', 'measurement_gap'],
    failureModeIds: [3, 5, 9],
    patternRefs: ['PAT-FM-003', 'PAT-FM-005', 'PAT-FM-009'],
    refreshCadence: 'quarterly',
  }),
  metric({
    id: 'PAT-MET-202',
    name: 'Patient access abandonment rate',
    aliases: ['scheduling abandonment', 'digital access drop-off', 'appointment conversion loss'],
    industries: ['healthcare_idn'],
    domain: 'front_office',
    theme: 'patient_access_scheduling',
    priorityTier: 'tier_1',
    definition: 'Percent of appointment-start attempts that do not result in a scheduled, confirmed, or routed appointment within the same access journey.',
    whyItMatters: 'Access AI, call deflection, and digital front door investments fail when the system cannot convert demand into scheduled care.',
    cohort: 'Healthcare IDN with centralized scheduling plus digital front door.',
    northStarRange: range(5, 12, '%', 'Abandoned access journeys'),
    leaderBenchmark: range(12, 20, '%', 'Mature digital scheduling operators'),
    commonFloor: range(30, 55, '%', 'Fragmented phone, portal, and referral routing'),
    trajectorySignal: 'Leaders improve as provider templates, referral rules, and patient identity converge; laggards add chatbots on top of broken scheduling logic.',
    measurementDifficulty: 'high',
    foundationRequirements: {
      data: 'Call, portal, referral, scheduling, provider-template, and CRM events joined by journey.',
      identity: 'Patient and prospect identity across portal, call center, and referral channels.',
      operations: 'Standard journey outcome codes for scheduled, routed, abandoned, and ineligible.',
      governance: 'Access operations owns abandoned-demand review and template remediation.',
    },
    vendorLandscape: [
      { vendorName: 'Epic MyChart', role: 'Patient portal and scheduling entry point', caution: 'Portal metrics miss phone and referral abandonment.' },
      { vendorName: 'Salesforce Health Cloud', role: 'CRM and patient engagement orchestration', caution: 'Requires clean handoff to Epic scheduling and referral workflows.' },
    ],
    expectedGapClasses: ['measurement_gap', 'quantitative_gap'],
    failureModeIds: [2, 5, 9],
    patternRefs: ['PAT-FM-002', 'PAT-FM-005', 'PAT-FM-009'],
    refreshCadence: 'quarterly',
  }),
  metric({
    id: 'PAT-MET-203',
    name: 'Coding accuracy rate',
    aliases: ['CDI coding accuracy', 'claim coding accuracy', 'diagnosis coding quality'],
    industries: ['healthcare_idn'],
    domain: 'middle_office',
    theme: 'coding_quality_cdi',
    priorityTier: 'tier_1',
    definition: 'Percent of audited encounters where final diagnosis and procedure coding matches documented clinical evidence and payer/regulatory coding rules.',
    whyItMatters: 'Coding quality affects reimbursement, compliance exposure, denial rates, quality reporting, and value-based care performance.',
    cohort: 'Healthcare IDN with inpatient, ambulatory, and professional billing operations.',
    northStarRange: range(95, 98, '%', 'Audit-concordant coding'),
    leaderBenchmark: range(91, 95, '%', 'Strong CDI and coding operations'),
    commonFloor: range(78, 88, '%', 'Backlog-driven or inconsistent CDI review'),
    trajectorySignal: 'Leaders improve as CDI queries, coder education, and documentation assistance are tied to service-line defect patterns.',
    measurementDifficulty: 'moderate',
    foundationRequirements: {
      data: 'Encounter, documentation, CDI query, code assignment, denial, and audit results.',
      identity: 'Provider, coder, encounter, service-line, and payer dimensions reconciled.',
      operations: 'Structured second-level review and coder feedback loop.',
      governance: 'HIM, CDI, compliance, and physician leadership own defect taxonomy.',
    },
    vendorLandscape: [
      { vendorName: '3M M*Modal', role: 'Clinical documentation and coding assistance', caution: 'Automation must be bounded by audit and compliance controls.' },
      { vendorName: 'Iodine Software', role: 'CDI prioritization and documentation integrity', caution: 'Impact depends on provider response behavior, not only worklist accuracy.' },
    ],
    expectedGapClasses: ['quantitative_gap', 'trajectory_gap'],
    failureModeIds: [6, 8, 9],
    patternRefs: ['PAT-FM-006', 'PAT-FM-008', 'PAT-FM-009'],
    refreshCadence: 'quarterly',
  }),
  metric({
    id: 'PAT-MET-204',
    name: 'Clinical decision support acceptance rate',
    aliases: ['CDS acceptance', 'alert acceptance rate', 'clinical alert action rate'],
    industries: ['healthcare_idn'],
    domain: 'middle_office',
    theme: 'clinical_decision_support',
    priorityTier: 'tier_1',
    definition: 'Percent of clinically relevant decision-support alerts that result in accepted action or documented justified override within the measurement window.',
    whyItMatters: 'AI and rules-based CDS create clinical value only when clinicians trust the signal and the workflow supports appropriate action.',
    cohort: 'Healthcare IDN using Epic-based clinician workflows.',
    northStarRange: range(35, 55, '%', 'Accepted or justified action'),
    leaderBenchmark: range(25, 35, '%', 'Well-tuned CDS programs'),
    commonFloor: range(3, 15, '%', 'Alert-fatigued environments'),
    trajectorySignal: 'Leaders improve by pruning low-value alerts and tuning specificity by role; laggards add alerts faster than they retire them.',
    measurementDifficulty: 'moderate',
    foundationRequirements: {
      data: 'Alert fire, clinician role, patient context, accepted action, override reason, and outcome follow-up.',
      identity: 'Clinician, encounter, alert, order, and care setting identifiers reconciled.',
      operations: 'CDS governance reviews alert burden and clinical value monthly.',
      governance: 'Clinical informatics and specialty leadership approve alert lifecycle changes.',
    },
    vendorLandscape: [
      { vendorName: 'Epic BestPractice Advisories', role: 'Core CDS alerting workflow', caution: 'High alert volume without lifecycle governance causes fatigue.' },
      { vendorName: 'Oracle Health', role: 'EHR and clinical workflow platform', caution: 'Acceptance metrics must distinguish action from passive dismissal.' },
    ],
    expectedGapClasses: ['quantitative_gap', 'trajectory_gap'],
    failureModeIds: [5, 6, 9],
    patternRefs: ['PAT-FM-005', 'PAT-FM-006', 'PAT-FM-009'],
    refreshCadence: 'quarterly',
  }),
  metric({
    id: 'PAT-MET-205',
    name: 'Initial claims denial rate',
    aliases: ['denial rate', 'first-pass denial rate', 'claim denial percentage'],
    industries: ['healthcare_idn'],
    domain: 'back_office',
    theme: 'revenue_cycle_denials',
    priorityTier: 'tier_1',
    definition: 'Percent of submitted claims denied on first pass, measured by claim count and optionally weighted by allowed amount.',
    whyItMatters: 'Denials convert clinical delivery into avoidable working-capital drag, rework cost, patient friction, and revenue leakage.',
    cohort: 'Healthcare IDN with hospital and professional billing.',
    northStarRange: range(3, 6, '%', 'First-pass claims denied'),
    leaderBenchmark: range(6, 9, '%', 'Strong RCM operators'),
    commonFloor: range(12, 22, '%', 'Fragmented eligibility, auth, coding, and billing workflows'),
    trajectorySignal: 'Leaders reduce preventable denials through root-cause worklists and payer-specific rules; laggards only expand follow-up teams.',
    measurementDifficulty: 'low',
    foundationRequirements: {
      data: 'Claim, remit, denial reason, auth, eligibility, coding, and appeal outcome data.',
      identity: 'Payer, plan, encounter, claim, service line, and denial reason normalized.',
      operations: 'Preventable denial taxonomy tied to upstream owner.',
      governance: 'RCM owns denial prevention backlog with clinical and access partners.',
    },
    vendorLandscape: [
      { vendorName: 'R1 RCM', role: 'Revenue cycle operations and denial management', caution: 'Outsourcing can obscure root-cause ownership if metrics stop at recovery.' },
      { vendorName: 'Waystar', role: 'Claims and denial workflow automation', caution: 'Reason-code quality determines prevention value.' },
    ],
    expectedGapClasses: ['quantitative_gap', 'trajectory_gap'],
    failureModeIds: [5, 9],
    patternRefs: ['PAT-FM-005', 'PAT-FM-009'],
    refreshCadence: 'quarterly',
  }),
  metric({
    id: 'PAT-MET-206',
    name: 'Interoperability coverage for priority data elements',
    aliases: ['FHIR coverage', 'priority clinical data availability', 'data exchange coverage'],
    industries: ['healthcare_idn'],
    domain: 'back_office',
    theme: 'clinical_data_foundation',
    priorityTier: 'tier_1',
    definition: 'Percent of priority clinical, administrative, and financial data elements available through governed interfaces at required freshness and completeness thresholds.',
    whyItMatters: 'Care delivery AI, value-based care, prior auth automation, and analytics modernization fail when critical data stays trapped in non-interoperable workflows.',
    cohort: 'Healthcare IDN with EHR, RCM, population health, and analytics platforms.',
    northStarRange: range(85, 95, '%', 'Priority data elements governed and available'),
    leaderBenchmark: range(70, 85, '%', 'Strong interoperability foundation'),
    commonFloor: range(30, 60, '%', 'Interface-by-project estate'),
    trajectorySignal: 'Leaders improve as product teams own data domains and FHIR/API coverage; laggards keep rebuilding point interfaces per initiative.',
    measurementDifficulty: 'high',
    foundationRequirements: {
      data: 'Data catalog, interface inventory, freshness, completeness, lineage, and access telemetry.',
      identity: 'Patient, provider, encounter, order, claim, and payer identifiers mastered.',
      operations: 'Data product intake and SLA management for priority use cases.',
      governance: 'Architecture, data governance, compliance, and clinical operations own data-product readiness.',
    },
    vendorLandscape: [
      { vendorName: 'Epic Interconnect and FHIR APIs', role: 'Clinical-system integration foundation', caution: 'API availability is not the same as governed data-product readiness.' },
      { vendorName: 'Redox', role: 'Healthcare integration and interoperability layer', caution: 'Integration broker does not replace domain ownership.' },
    ],
    expectedGapClasses: ['measurement_gap', 'quantitative_gap'],
    failureModeIds: [3, 5, 10],
    patternRefs: ['PAT-FM-003', 'PAT-FM-005', 'PAT-FM-010'],
    refreshCadence: 'quarterly',
  }),
  metric({
    id: 'PAT-MET-401',
    name: 'Digital application completion rate',
    aliases: ['digital funnel completion', 'application conversion rate', 'account opening completion'],
    industries: ['financial_services'],
    domain: 'front_office',
    theme: 'digital_acquisition',
    priorityTier: 'tier_1',
    definition: 'Percent of started digital applications that reach submitted, decisioned, or funded status within the product-specific window.',
    whyItMatters: 'Digital banking and lending AI has little commercial effect if customers abandon before eligibility, decisioning, or funding.',
    cohort: 'Regional financial services institution with digital banking and lending products.',
    northStarRange: range(55, 75, '%', 'Started applications completing'),
    leaderBenchmark: range(40, 55, '%', 'Top-quartile digital acquisition operators'),
    commonFloor: range(12, 30, '%', 'Manual handoffs and fragmented identity checks'),
    trajectorySignal: 'Leaders improve through prefill, identity verification, next-best-action routing, and product-specific funnel analytics.',
    measurementDifficulty: 'moderate',
    foundationRequirements: {
      data: 'Clickstream, CRM, KYC, application, decisioning, and funding events joined by journey.',
      identity: 'Customer, prospect, device, application, and product identifiers reconciled.',
      operations: 'Funnel defect review by product, channel, and abandonment reason.',
      governance: 'Product, risk, compliance, and digital operations jointly own completion and suitability.',
    },
    vendorLandscape: [
      { vendorName: 'nCino', role: 'Loan origination and workflow platform', caution: 'Completion gains require channel instrumentation outside LOS too.' },
      { vendorName: 'Salesforce Financial Services Cloud', role: 'Customer engagement and banker workflow', caution: 'Needs clean handoff to core and origination platforms.' },
    ],
    expectedGapClasses: ['quantitative_gap', 'measurement_gap'],
    failureModeIds: [2, 5, 9],
    patternRefs: ['PAT-FM-002', 'PAT-FM-005', 'PAT-FM-009'],
    refreshCadence: 'quarterly',
  }),
  metric({
    id: 'PAT-MET-402',
    name: 'Next-best-action acceptance rate',
    aliases: ['NBA acceptance', 'offer acceptance rate', 'recommendation action rate'],
    industries: ['financial_services'],
    domain: 'front_office',
    theme: 'customer_engagement',
    priorityTier: 'tier_1',
    definition: 'Percent of eligible next-best-action recommendations accepted by banker, advisor, agent, or customer within the action window.',
    whyItMatters: 'Personalization and advisor-assist investments fail when recommendations are ignored, poorly governed, or disconnected from compliant customer need.',
    cohort: 'Financial services institution with branch, digital, and contact center channels.',
    northStarRange: range(18, 35, '%', 'Eligible recommendations accepted'),
    leaderBenchmark: range(12, 18, '%', 'Mature governed NBA programs'),
    commonFloor: range(1, 6, '%', 'Low-trust recommendation pilots'),
    trajectorySignal: 'Leaders improve as eligibility, explainability, and channel workflow fit improve; laggards keep pushing generic offers.',
    measurementDifficulty: 'moderate',
    foundationRequirements: {
      data: 'Recommendation, eligibility, customer profile, channel interaction, disposition, and outcome data.',
      identity: 'Customer, household, banker, product, and channel identifiers reconciled.',
      operations: 'Disposition codes and feedback loops built into banker and digital workflows.',
      governance: 'Risk and compliance approve eligibility, suitability, and explainability guardrails.',
    },
    vendorLandscape: [
      { vendorName: 'Pega Customer Decision Hub', role: 'Real-time decisioning and NBA orchestration', caution: 'Model governance and action taxonomy drive realized value.' },
      { vendorName: 'Adobe Experience Platform', role: 'Customer profile and activation substrate', caution: 'Financial suitability rules must be externalized and auditable.' },
    ],
    expectedGapClasses: ['quantitative_gap', 'trajectory_gap'],
    failureModeIds: [6, 7, 9],
    patternRefs: ['PAT-FM-006', 'PAT-FM-007', 'PAT-FM-009'],
    refreshCadence: 'quarterly',
  }),
  metric({
    id: 'PAT-MET-403',
    name: 'Fraud false positive rate',
    aliases: ['fraud false positives', 'unnecessary fraud declines', 'good-customer fraud friction'],
    industries: ['financial_services'],
    domain: 'middle_office',
    theme: 'fraud_detection',
    priorityTier: 'tier_1',
    definition: 'Percent of fraud alerts, blocks, or step-up challenges later confirmed as legitimate customer activity.',
    whyItMatters: 'Fraud AI must reduce loss without creating customer friction, operational review burden, or revenue leakage from false declines.',
    cohort: 'Financial services institution with card, ACH, digital, and account-opening fraud controls.',
    northStarRange: range(15, 30, '%', 'False positive alerts or interventions'),
    leaderBenchmark: range(30, 45, '%', 'Strong fraud model operations'),
    commonFloor: range(60, 90, '%', 'Rules-heavy or stale model estate'),
    trajectorySignal: 'Leaders lower false positives as feature freshness, feedback loops, and risk segmentation improve; laggards tune only loss rate.',
    measurementDifficulty: 'high',
    foundationRequirements: {
      data: 'Alert, transaction, case, customer contact, chargeback, dispute, and confirmed fraud labels.',
      identity: 'Customer, account, device, merchant, transaction, and case identifiers reconciled.',
      operations: 'Analyst feedback and customer-confirmation outcomes captured consistently.',
      governance: 'Fraud, digital, operations, and model risk jointly review loss-friction tradeoffs.',
    },
    vendorLandscape: [
      { vendorName: 'FICO Falcon', role: 'Card fraud detection and scoring', caution: 'False positive value depends on feedback-loop quality.' },
      { vendorName: 'Feedzai', role: 'Financial crime and fraud decisioning', caution: 'Model explainability and operations adoption must be designed upfront.' },
    ],
    expectedGapClasses: ['quantitative_gap', 'trajectory_gap'],
    failureModeIds: [5, 6, 9],
    patternRefs: ['PAT-FM-005', 'PAT-FM-006', 'PAT-FM-009'],
    refreshCadence: 'quarterly',
  }),
  metric({
    id: 'PAT-MET-404',
    name: 'Credit decision cycle time',
    aliases: ['time to credit decision', 'loan decision turnaround', 'underwriting cycle time'],
    industries: ['financial_services'],
    domain: 'middle_office',
    theme: 'credit_decisioning',
    priorityTier: 'tier_1',
    definition: 'Median elapsed time from complete credit application receipt to approved, declined, or conditioned decision.',
    whyItMatters: 'Credit decisioning AI has value only when it improves speed, consistency, risk quality, and customer experience together.',
    cohort: 'Regional financial services institution with consumer and commercial lending.',
    northStarRange: range(5, 30, 'minutes', 'Simple digital products; product-specific'),
    leaderBenchmark: range(30, 240, 'minutes', 'Digitally mature lending operators'),
    commonFloor: range(1, 10, 'business days', 'Manual underwriting and fragmented documents'),
    trajectorySignal: 'Leaders reduce cycle time by codifying policy, pre-validating documents, and separating straight-through from judgmental decisions.',
    measurementDifficulty: 'moderate',
    foundationRequirements: {
      data: 'Application, document, policy, bureau, KYC, underwriting, decision, and funding timestamps.',
      identity: 'Borrower, household, business, application, product, and underwriter identifiers reconciled.',
      operations: 'Reason codes and exception paths standardized across product teams.',
      governance: 'Credit risk and compliance approve model scope, adverse-action logic, and overrides.',
    },
    vendorLandscape: [
      { vendorName: 'nCino', role: 'Commercial and small-business lending workflow', caution: 'Cycle-time metrics must separate complete versus incomplete applications.' },
      { vendorName: 'Zest AI', role: 'Credit model and decisioning support', caution: 'Fair-lending and model-risk controls must be live before scale.' },
    ],
    expectedGapClasses: ['quantitative_gap', 'measurement_gap'],
    failureModeIds: [2, 6, 9],
    patternRefs: ['PAT-FM-002', 'PAT-FM-006', 'PAT-FM-009'],
    refreshCadence: 'quarterly',
  }),
  metric({
    id: 'PAT-MET-405',
    name: 'Regulatory reporting accuracy',
    aliases: ['reg reporting quality', 'reporting defect rate', 'regulatory data accuracy'],
    industries: ['financial_services'],
    domain: 'back_office',
    theme: 'regulatory_reporting',
    priorityTier: 'tier_1',
    definition: 'Percent of regulatory reporting submissions without material defect, restatement, late adjustment, or control exception.',
    whyItMatters: 'AI-enabled finance, risk, and compliance work cannot be trusted if the institution cannot prove control over regulated data outputs.',
    cohort: 'Financial services institution subject to recurring regulatory and management reporting.',
    northStarRange: range(98, 100, '%', 'Submissions without material defect'),
    leaderBenchmark: range(95, 98, '%', 'Strong regulatory data controls'),
    commonFloor: range(80, 92, '%', 'Manual lineage and spreadsheet reconciliation'),
    trajectorySignal: 'Leaders improve as data lineage, reconciliations, and control evidence become machine-checkable; laggards add manual signoffs.',
    measurementDifficulty: 'moderate',
    foundationRequirements: {
      data: 'Report inventory, data lineage, reconciliations, control checks, exceptions, and submission history.',
      identity: 'Product, account, legal entity, control, and report identifiers reconciled.',
      operations: 'Issue taxonomy and defect root-cause workflow for reporting exceptions.',
      governance: 'Finance, risk, compliance, and data office own reporting controls jointly.',
    },
    vendorLandscape: [
      { vendorName: 'AxiomSL', role: 'Regulatory reporting and risk data aggregation', caution: 'Tooling does not fix upstream lineage and ownership gaps.' },
      { vendorName: 'Collibra', role: 'Data governance, lineage, and control catalog', caution: 'Catalog adoption must be tied to report-control evidence.' },
    ],
    expectedGapClasses: ['quantitative_gap', 'measurement_gap'],
    failureModeIds: [3, 6, 9],
    patternRefs: ['PAT-FM-003', 'PAT-FM-006', 'PAT-FM-009'],
    refreshCadence: 'quarterly',
  }),
  metric({
    id: 'PAT-MET-406',
    name: 'Model validation cycle time',
    aliases: ['model risk validation time', 'MRM cycle time', 'model approval turnaround'],
    industries: ['financial_services'],
    domain: 'back_office',
    theme: 'model_risk_management',
    priorityTier: 'tier_1',
    definition: 'Median elapsed time from complete model submission to validation decision, including remediation cycles and approval conditions.',
    whyItMatters: 'Agentic and predictive AI programs stall when model risk management cannot validate use cases at the pace of product and control needs.',
    cohort: 'Financial services institution with centralized model risk management.',
    northStarRange: range(10, 30, 'business days', 'Complete submission to decision by risk tier'),
    leaderBenchmark: range(30, 60, 'business days', 'Mature tiered validation programs'),
    commonFloor: range(90, 180, 'business days', 'Queue-based validation with weak submission quality'),
    trajectorySignal: 'Leaders reduce cycle time through tiering, reusable evidence packs, automated monitoring, and clear change-materiality rules.',
    measurementDifficulty: 'moderate',
    foundationRequirements: {
      data: 'Model inventory, risk tier, submission evidence, validation findings, remediation, approvals, and monitoring history.',
      identity: 'Model, owner, use case, data source, control, and system identifiers reconciled.',
      operations: 'Standard model evidence pack and intake completeness checks.',
      governance: 'Model risk, legal, compliance, technology, and business owners share approval-state visibility.',
    },
    vendorLandscape: [
      { vendorName: 'ModelOp', role: 'Model governance and lifecycle operations', caution: 'Workflow tooling requires a defined tiering and evidence standard.' },
      { vendorName: 'DataRobot', role: 'Model development and monitoring platform', caution: 'Development speed must be matched by validation evidence.' },
    ],
    expectedGapClasses: ['quantitative_gap', 'trajectory_gap'],
    failureModeIds: [6, 8, 10],
    patternRefs: ['PAT-FM-006', 'PAT-FM-008', 'PAT-FM-010'],
    refreshCadence: 'quarterly',
  }),
] as const;

export function getMetricRecordById(id: string): MetricRecord | null {
  return METRIC_RECORDS.find((record) => record.id === id) ?? null;
}

export function getMetricRecordsByIndustryDomain(
  industry: MetricIndustry,
  domain: MetricDomain,
): readonly MetricRecord[] {
  return METRIC_RECORDS.filter(
    (record) => record.industries.includes(industry) && record.domain === domain,
  );
}

export function getTier1MetricRecords(): readonly MetricRecord[] {
  return METRIC_RECORDS.filter((record) => record.priorityTier === 'tier_1');
}

export function summarizeMetricCoverage(records: readonly MetricRecord[] = METRIC_RECORDS): {
  total: number;
  byIndustry: Record<MetricIndustry, number>;
  byDomain: Record<MetricDomain, number>;
  verifiedOrLocked: number;
} {
  const byIndustry: Record<MetricIndustry, number> = {
    specialty_retail: 0,
    healthcare_idn: 0,
    financial_services: 0,
  };
  const byDomain: Record<MetricDomain, number> = {
    front_office: 0,
    middle_office: 0,
    back_office: 0,
  };

  for (const record of records) {
    for (const industry of record.industries) byIndustry[industry] += 1;
    byDomain[record.domain] += 1;
  }

  return {
    total: records.length,
    byIndustry,
    byDomain,
    verifiedOrLocked: records.filter((record) => record.maturityStatus !== 'draft').length,
  };
}

export function validateMetricRecords(records: readonly MetricRecord[] = METRIC_RECORDS): void {
  const ids = new Set<string>();

  for (const record of records) {
    if (ids.has(record.id)) throw new Error(`Duplicate metric record id: ${record.id}`);
    ids.add(record.id);

    if (!/^PAT-MET-\d{3}$/.test(record.id)) throw new Error(`Invalid metric id: ${record.id}`);
    const numericId = Number(record.id.replace('PAT-MET-', ''));
    for (const industry of record.industries) {
      if (industry === 'specialty_retail' && (numericId < 1 || numericId > 200)) {
        throw new Error(`${record.id} violates specialty retail id block`);
      }
      if (industry === 'healthcare_idn' && (numericId < 201 || numericId > 400)) {
        throw new Error(`${record.id} violates healthcare id block`);
      }
      if (industry === 'financial_services' && (numericId < 401 || numericId > 600)) {
        throw new Error(`${record.id} violates financial services id block`);
      }
    }

    if (record.aliases.length < 2) throw new Error(`${record.id} needs at least two aliases`);
    if (!record.definition || !record.whyItMatters || !record.cohort) {
      throw new Error(`${record.id} is missing definition, rationale, or cohort`);
    }
    if (record.sourceBasis.length < 2) throw new Error(`${record.id} needs source basis`);
    if (record.failureModeIds.length === 0) throw new Error(`${record.id} needs failure mode links`);
    if (record.patternRefs.length === 0) throw new Error(`${record.id} needs pattern refs`);
    if (record.northStarRange.low > record.northStarRange.high) {
      throw new Error(`${record.id} has invalid north-star range`);
    }
  }
}
