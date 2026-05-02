export type MetricIndustry =
  | "specialty_retail"
  | "healthcare_idn"
  | "financial_services";
export type MetricDomain = "front_office" | "middle_office" | "back_office";
export type MetricPriorityTier = "tier_1" | "tier_2" | "tier_3";
export type MetricMaturityStatus = "draft" | "verified" | "locked";
export type GapClass =
  | "quantitative_gap"
  | "measurement_gap"
  | "trajectory_gap";

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
  measurementDifficulty: "low" | "moderate" | "high";
  foundationRequirements: MetricFoundationRequirements;
  vendorLandscape: readonly MetricVendorLandscapeEntry[];
  expectedGapClasses: readonly GapClass[];
  failureModeIds: readonly number[];
  patternRefs: readonly string[];
  refreshCadence: "quarterly" | "semi_annual" | "annual";
  corpusVersion: string;
  maturityStatus: MetricMaturityStatus;
  authoredAt: string;
  sourceBasis: readonly string[];
}

const VERSION = "v1.0.0";
const AUTHORED_AT = "2026-05-02";
const SOURCE_BASIS = [
  "AbarVa Canonical Vision V2, locked 2026-05-02",
  "AbarVa Metrics Corpus Authoring Brief, locked 2026-05-02",
  "Composite demo-tenant calibration for bounded gap-engine testing",
] as const;

function range(
  low: number,
  high: number,
  unit: string,
  label: string,
): MetricRange {
  return { low, high, unit, label };
}

function metric(
  input: Omit<
    MetricRecord,
    "corpusVersion" | "maturityStatus" | "authoredAt" | "sourceBasis"
  >,
): MetricRecord {
  return {
    ...input,
    corpusVersion: VERSION,
    maturityStatus: "verified",
    authoredAt: AUTHORED_AT,
    sourceBasis: SOURCE_BASIS,
  };
}

const FOUNDATION_METRIC_RECORDS: readonly MetricRecord[] = [
  metric({
    id: "PAT-MET-001",
    name: "Customer identity match rate",
    aliases: [
      "identity resolution match rate",
      "customer match rate",
      "profile match rate",
    ],
    industries: ["specialty_retail"],
    domain: "front_office",
    theme: "customer_identity",
    priorityTier: "tier_1",
    definition:
      "Percent of active customer interactions resolved to a durable customer identity across store, ecommerce, service, and loyalty channels over a rolling 30-day window.",
    whyItMatters:
      "Personalization, attribution, service continuity, and offer governance all degrade when the same customer is represented as multiple records.",
    cohort:
      "Specialty retail, USD 1-5B revenue, multi-channel customer estate.",
    northStarRange: range(92, 97, "%", "Resolved active interactions"),
    leaderBenchmark: range(85, 92, "%", "Top-quartile omnichannel retailers"),
    commonFloor: range(
      45,
      70,
      "%",
      "Fragmented loyalty, ecommerce, and POS estates",
    ),
    trajectorySignal:
      "Leaders improve 3-6 points per year after CDP identity graph stabilization; laggards plateau when POS and ecommerce identity remain separate.",
    measurementDifficulty: "moderate",
    foundationRequirements: {
      data: "POS, ecommerce, loyalty, and service events joined at interaction grain.",
      identity: "Canonical customer identity graph with survivorship rules.",
      operations:
        "Weekly exception review for duplicate and anonymous profiles.",
      governance:
        "Identity quality owner named across marketing, data, and store operations.",
    },
    vendorLandscape: [
      {
        vendorName: "Salesforce Data Cloud",
        role: "CDP identity graph and activation substrate",
        caution:
          "Can hide weak source-system identity if match rules are not governed.",
      },
      {
        vendorName: "Treasure Data",
        role: "Enterprise CDP and event unification",
        caution:
          "Requires disciplined source onboarding to avoid another data swamp.",
      },
    ],
    expectedGapClasses: ["quantitative_gap", "measurement_gap"],
    failureModeIds: [3, 9],
    patternRefs: ["PAT-FM-003", "PAT-FM-009"],
    refreshCadence: "quarterly",
  }),
  metric({
    id: "PAT-MET-002",
    name: "First-party data addressability",
    aliases: [
      "addressable customer rate",
      "consented profile coverage",
      "known customer rate",
    ],
    industries: ["specialty_retail"],
    domain: "front_office",
    theme: "customer_activation",
    priorityTier: "tier_1",
    definition:
      "Share of active customers with consented, usable first-party identifiers and at least one activation channel available in the last 90 days.",
    whyItMatters:
      "AI-assisted marketing and service use cases become expensive guesses when the addressable customer base is too small or poorly permissioned.",
    cohort:
      "Specialty retail, USD 1-5B revenue, loyalty plus ecommerce channels.",
    northStarRange: range(70, 85, "%", "Active customers addressable"),
    leaderBenchmark: range(58, 70, "%", "Top-quartile specialty retail"),
    commonFloor: range(
      20,
      45,
      "%",
      "Low loyalty penetration or fragmented consent stores",
    ),
    trajectorySignal:
      "Leaders expand addressability through loyalty, receipt capture, and preference centers; laggards lose coverage as paid-media identifiers degrade.",
    measurementDifficulty: "moderate",
    foundationRequirements: {
      data: "Consent, loyalty, ecommerce, email, SMS, app, and service identifiers in one profile store.",
      identity:
        "Durable consent-to-profile binding by jurisdiction and channel.",
      operations: "Activation suppression rules tested before campaign launch.",
      governance:
        "Privacy and marketing jointly own consent decay and activation eligibility.",
    },
    vendorLandscape: [
      {
        vendorName: "Klaviyo",
        role: "Retail activation and owned-channel orchestration",
        caution: "Strong activation does not fix upstream identity gaps.",
      },
      {
        vendorName: "Braze",
        role: "Cross-channel lifecycle orchestration",
        caution: "Requires clean profile eligibility and preference logic.",
      },
    ],
    expectedGapClasses: ["quantitative_gap", "trajectory_gap"],
    failureModeIds: [3, 6, 9],
    patternRefs: ["PAT-FM-003", "PAT-FM-006", "PAT-FM-009"],
    refreshCadence: "quarterly",
  }),
  metric({
    id: "PAT-MET-003",
    name: "Forecast accuracy at SKU-week",
    aliases: [
      "SKU forecast accuracy",
      "SKU-level demand forecast accuracy",
      "WMAPE at SKU-week",
    ],
    industries: ["specialty_retail"],
    domain: "middle_office",
    theme: "demand_forecasting",
    priorityTier: "tier_1",
    definition:
      "Forecast accuracy for unit demand at SKU-week grain, measured as one minus weighted mean absolute percentage error over a rolling 13-week window.",
    whyItMatters:
      "It is the leading indicator for inventory turns, on-shelf availability, markdown exposure, and working capital tied up in poor allocation decisions.",
    cohort: "Specialty retail, USD 1-5B revenue, 5,000-50,000 active SKUs.",
    northStarRange: range(88, 92, "%", "One minus WMAPE"),
    leaderBenchmark: range(
      83,
      88,
      "%",
      "Top-quartile demand-sensing retailers",
    ),
    commonFloor: range(62, 72, "%", "Legacy category-week forecasting"),
    trajectorySignal:
      "Leaders improve 1.5-3 points per year after weather, promotion, and event signals enter the forecast loop.",
    measurementDifficulty: "moderate",
    foundationRequirements: {
      data: "Clean sales history, returns netting, promotion calendar, inventory position, and demand-shaping events.",
      identity: "Canonical SKU master with cross-channel SKU mapping.",
      operations:
        "Weekly forecast review tied to replenishment and allocation decisions.",
      governance:
        "S&OP accountable owner for forecast bias and error by category.",
    },
    vendorLandscape: [
      {
        vendorName: "Blue Yonder Demand Planning",
        role: "Enterprise demand planning and replenishment optimization",
        caution: "Implementation value depends on clean SKU-store-day data.",
      },
      {
        vendorName: "RELEX Solutions",
        role: "Retail planning and store-level demand sensing",
        caution: "Store granularity can expose master-data gaps quickly.",
      },
    ],
    expectedGapClasses: ["quantitative_gap", "trajectory_gap"],
    failureModeIds: [3, 9],
    patternRefs: ["PAT-FM-003", "PAT-FM-009"],
    refreshCadence: "quarterly",
  }),
  metric({
    id: "PAT-MET-004",
    name: "On-shelf availability at SKU-store-day",
    aliases: ["OSA", "store in-stock rate", "shelf availability"],
    industries: ["specialty_retail"],
    domain: "middle_office",
    theme: "inventory_availability",
    priorityTier: "tier_1",
    definition:
      "Percent of expected selling SKU-store-days where product was available for sale on shelf or fulfillable from store inventory.",
    whyItMatters:
      "Demand forecasting and replenishment AI cannot prove value if the retailer cannot measure whether the customer actually found the item available.",
    cohort:
      "Specialty retail, USD 1-5B revenue, store plus ecommerce fulfillment.",
    northStarRange: range(95, 98, "%", "Available SKU-store-days"),
    leaderBenchmark: range(91, 95, "%", "Top-quartile store operators"),
    commonFloor: range(78, 88, "%", "Manual counts or delayed inventory feeds"),
    trajectorySignal:
      "Leaders improve after inventory feeds, planogram adherence, and exception workflows converge; laggards do not know where the shelf failure occurs.",
    measurementDifficulty: "high",
    foundationRequirements: {
      data: "SKU-store-day inventory, sales, planogram, receiving, and replenishment signals.",
      identity: "Store, SKU, and fulfillment-node master data reconciled.",
      operations:
        "Store exception workflow for phantom inventory and shelf replenishment.",
      governance:
        "Merchandising and store operations share OSA accountability.",
    },
    vendorLandscape: [
      {
        vendorName: "NCR Voyix",
        role: "Store and POS operational signal capture",
        caution: "POS alone cannot prove shelf availability.",
      },
      {
        vendorName: "SAP S/4HANA Retail",
        role: "Inventory and merchandising system of record",
        caution: "Batch inventory feeds weaken near-real-time OSA measurement.",
      },
    ],
    expectedGapClasses: ["measurement_gap", "quantitative_gap"],
    failureModeIds: [3, 5, 9],
    patternRefs: ["PAT-FM-003", "PAT-FM-005", "PAT-FM-009"],
    refreshCadence: "quarterly",
  }),
  metric({
    id: "PAT-MET-005",
    name: "Finance close cycle days",
    aliases: ["monthly close days", "close cycle time", "days to close"],
    industries: ["specialty_retail"],
    domain: "back_office",
    theme: "finance_close_reporting",
    priorityTier: "tier_1",
    definition:
      "Number of business days from period end to complete management close with reconciliations, variance review, and reporting package issued.",
    whyItMatters:
      "AI forecasting and margin actions lose operating value when finance cannot close and explain performance fast enough for corrective action.",
    cohort: "Specialty retail, USD 1-5B revenue, multi-entity store footprint.",
    northStarRange: range(3, 5, "business days", "Management close"),
    leaderBenchmark: range(5, 7, "business days", "Top-quartile retailers"),
    commonFloor: range(
      10,
      18,
      "business days",
      "Spreadsheet-heavy close process",
    ),
    trajectorySignal:
      "Leaders shrink close time through automated reconciliations and standard account mappings; laggards add review cycles as channel complexity rises.",
    measurementDifficulty: "low",
    foundationRequirements: {
      data: "ERP close tasks, reconciliation status, journal entries, and reporting timestamps.",
      identity: "Chart-of-accounts and entity hierarchy mapped consistently.",
      operations:
        "Close checklist with task ownership and exception reason codes.",
      governance: "Controller owns close SLA and recurring-blocker burn-down.",
    },
    vendorLandscape: [
      {
        vendorName: "BlackLine",
        role: "Reconciliation and close automation",
        caution:
          "Automation fails if account ownership and matching rules are weak.",
      },
      {
        vendorName: "Oracle ERP Cloud",
        role: "ERP and close orchestration substrate",
        caution:
          "Reporting speed depends on data model and consolidation design.",
      },
    ],
    expectedGapClasses: ["quantitative_gap", "trajectory_gap"],
    failureModeIds: [5, 9],
    patternRefs: ["PAT-FM-005", "PAT-FM-009"],
    refreshCadence: "quarterly",
  }),
  metric({
    id: "PAT-MET-006",
    name: "Enterprise data product adoption rate",
    aliases: [
      "analytics product adoption",
      "BI product active usage",
      "data product WAU",
    ],
    industries: ["specialty_retail"],
    domain: "back_office",
    theme: "data_platform_adoption",
    priorityTier: "tier_1",
    definition:
      "Percent of named decision roles using certified data products at least weekly for operating decisions in the last 30 days.",
    whyItMatters:
      "A modern data platform only becomes an AI foundation when operating leaders actually use governed data products instead of shadow spreadsheets.",
    cohort:
      "Specialty retail, USD 1-5B revenue, enterprise analytics modernization.",
    northStarRange: range(75, 90, "%", "Named decision roles weekly active"),
    leaderBenchmark: range(
      60,
      75,
      "%",
      "Top-quartile governed analytics programs",
    ),
    commonFloor: range(15, 40, "%", "Low-trust reporting estate"),
    trajectorySignal:
      "Leaders improve through role-based product ownership and retirement of duplicate reports; laggards accumulate dashboards without behavior change.",
    measurementDifficulty: "moderate",
    foundationRequirements: {
      data: "Usage telemetry from BI, semantic layer, warehouse, and access logs.",
      identity: "User-to-role mapping for decision roles and operating teams.",
      operations:
        "Data product owners review adoption, freshness, and trust signals.",
      governance:
        "Certified-product policy with retirement path for duplicate reports.",
    },
    vendorLandscape: [
      {
        vendorName: "Tableau",
        role: "BI and dashboard usage telemetry",
        caution: "Dashboard views are not the same as decision adoption.",
      },
      {
        vendorName: "Snowflake",
        role: "Warehouse and governed data product substrate",
        caution: "Compute usage must be tied to business adoption.",
      },
    ],
    expectedGapClasses: ["quantitative_gap", "measurement_gap"],
    failureModeIds: [3, 5, 9],
    patternRefs: ["PAT-FM-003", "PAT-FM-005", "PAT-FM-009"],
    refreshCadence: "quarterly",
  }),
  metric({
    id: "PAT-MET-201",
    name: "Prior authorization turnaround time",
    aliases: [
      "prior auth cycle time",
      "PA turnaround",
      "authorization elapsed time",
    ],
    industries: ["healthcare_idn"],
    domain: "front_office",
    theme: "patient_access_prior_auth",
    priorityTier: "tier_1",
    definition:
      "Median elapsed time from complete authorization request submission to payer determination for scheduled services, measured weekly.",
    whyItMatters:
      "Long authorization cycles delay care, create denials risk, consume staff capacity, and directly shape patient and clinician trust in access modernization.",
    cohort:
      "Healthcare IDN, multi-hospital system with Epic as clinical system of record.",
    northStarRange: range(
      1,
      2,
      "business days",
      "Median complete-request turnaround",
    ),
    leaderBenchmark: range(
      2,
      4,
      "business days",
      "Digitally mature access operations",
    ),
    commonFloor: range(6, 14, "business days", "Manual payer portal workflow"),
    trajectorySignal:
      "Leaders reduce cycle time as payer rules, clinical documentation, and request completeness are codified; laggards shift work from access to clinics.",
    measurementDifficulty: "moderate",
    foundationRequirements: {
      data: "Epic referral/order, auth workqueue, payer portal, and determination timestamps.",
      identity:
        "Patient, encounter, order, payer, and service-line identifiers reconciled.",
      operations: "Standard auth workqueue reason codes and escalation paths.",
      governance:
        "Access, revenue cycle, and clinical operations share auth SLA ownership.",
    },
    vendorLandscape: [
      {
        vendorName: "Epic",
        role: "Clinical and access workflow system of record",
        caution:
          "Native workqueues need payer-response integration to prove elapsed time.",
      },
      {
        vendorName: "Waystar",
        role: "Revenue cycle and authorization workflow support",
        caution: "Automation depends on clean order and payer-rule data.",
      },
    ],
    expectedGapClasses: ["quantitative_gap", "measurement_gap"],
    failureModeIds: [3, 5, 9],
    patternRefs: ["PAT-FM-003", "PAT-FM-005", "PAT-FM-009"],
    refreshCadence: "quarterly",
  }),
  metric({
    id: "PAT-MET-202",
    name: "Patient access abandonment rate",
    aliases: [
      "scheduling abandonment",
      "digital access drop-off",
      "appointment conversion loss",
    ],
    industries: ["healthcare_idn"],
    domain: "front_office",
    theme: "patient_access_scheduling",
    priorityTier: "tier_1",
    definition:
      "Percent of appointment-start attempts that do not result in a scheduled, confirmed, or routed appointment within the same access journey.",
    whyItMatters:
      "Access AI, call deflection, and digital front door investments fail when the system cannot convert demand into scheduled care.",
    cohort:
      "Healthcare IDN with centralized scheduling plus digital front door.",
    northStarRange: range(5, 12, "%", "Abandoned access journeys"),
    leaderBenchmark: range(12, 20, "%", "Mature digital scheduling operators"),
    commonFloor: range(
      30,
      55,
      "%",
      "Fragmented phone, portal, and referral routing",
    ),
    trajectorySignal:
      "Leaders improve as provider templates, referral rules, and patient identity converge; laggards add chatbots on top of broken scheduling logic.",
    measurementDifficulty: "high",
    foundationRequirements: {
      data: "Call, portal, referral, scheduling, provider-template, and CRM events joined by journey.",
      identity:
        "Patient and prospect identity across portal, call center, and referral channels.",
      operations:
        "Standard journey outcome codes for scheduled, routed, abandoned, and ineligible.",
      governance:
        "Access operations owns abandoned-demand review and template remediation.",
    },
    vendorLandscape: [
      {
        vendorName: "Epic MyChart",
        role: "Patient portal and scheduling entry point",
        caution: "Portal metrics miss phone and referral abandonment.",
      },
      {
        vendorName: "Salesforce Health Cloud",
        role: "CRM and patient engagement orchestration",
        caution:
          "Requires clean handoff to Epic scheduling and referral workflows.",
      },
    ],
    expectedGapClasses: ["measurement_gap", "quantitative_gap"],
    failureModeIds: [2, 5, 9],
    patternRefs: ["PAT-FM-002", "PAT-FM-005", "PAT-FM-009"],
    refreshCadence: "quarterly",
  }),
  metric({
    id: "PAT-MET-203",
    name: "Coding accuracy rate",
    aliases: [
      "CDI coding accuracy",
      "claim coding accuracy",
      "diagnosis coding quality",
    ],
    industries: ["healthcare_idn"],
    domain: "middle_office",
    theme: "coding_quality_cdi",
    priorityTier: "tier_1",
    definition:
      "Percent of audited encounters where final diagnosis and procedure coding matches documented clinical evidence and payer/regulatory coding rules.",
    whyItMatters:
      "Coding quality affects reimbursement, compliance exposure, denial rates, quality reporting, and value-based care performance.",
    cohort:
      "Healthcare IDN with inpatient, ambulatory, and professional billing operations.",
    northStarRange: range(95, 98, "%", "Audit-concordant coding"),
    leaderBenchmark: range(91, 95, "%", "Strong CDI and coding operations"),
    commonFloor: range(
      78,
      88,
      "%",
      "Backlog-driven or inconsistent CDI review",
    ),
    trajectorySignal:
      "Leaders improve as CDI queries, coder education, and documentation assistance are tied to service-line defect patterns.",
    measurementDifficulty: "moderate",
    foundationRequirements: {
      data: "Encounter, documentation, CDI query, code assignment, denial, and audit results.",
      identity:
        "Provider, coder, encounter, service-line, and payer dimensions reconciled.",
      operations: "Structured second-level review and coder feedback loop.",
      governance:
        "HIM, CDI, compliance, and physician leadership own defect taxonomy.",
    },
    vendorLandscape: [
      {
        vendorName: "3M M*Modal",
        role: "Clinical documentation and coding assistance",
        caution: "Automation must be bounded by audit and compliance controls.",
      },
      {
        vendorName: "Iodine Software",
        role: "CDI prioritization and documentation integrity",
        caution:
          "Impact depends on provider response behavior, not only worklist accuracy.",
      },
    ],
    expectedGapClasses: ["quantitative_gap", "trajectory_gap"],
    failureModeIds: [6, 8, 9],
    patternRefs: ["PAT-FM-006", "PAT-FM-008", "PAT-FM-009"],
    refreshCadence: "quarterly",
  }),
  metric({
    id: "PAT-MET-204",
    name: "Clinical decision support acceptance rate",
    aliases: [
      "CDS acceptance",
      "alert acceptance rate",
      "clinical alert action rate",
    ],
    industries: ["healthcare_idn"],
    domain: "middle_office",
    theme: "clinical_decision_support",
    priorityTier: "tier_1",
    definition:
      "Percent of clinically relevant decision-support alerts that result in accepted action or documented justified override within the measurement window.",
    whyItMatters:
      "AI and rules-based CDS create clinical value only when clinicians trust the signal and the workflow supports appropriate action.",
    cohort: "Healthcare IDN using Epic-based clinician workflows.",
    northStarRange: range(35, 55, "%", "Accepted or justified action"),
    leaderBenchmark: range(25, 35, "%", "Well-tuned CDS programs"),
    commonFloor: range(3, 15, "%", "Alert-fatigued environments"),
    trajectorySignal:
      "Leaders improve by pruning low-value alerts and tuning specificity by role; laggards add alerts faster than they retire them.",
    measurementDifficulty: "moderate",
    foundationRequirements: {
      data: "Alert fire, clinician role, patient context, accepted action, override reason, and outcome follow-up.",
      identity:
        "Clinician, encounter, alert, order, and care setting identifiers reconciled.",
      operations:
        "CDS governance reviews alert burden and clinical value monthly.",
      governance:
        "Clinical informatics and specialty leadership approve alert lifecycle changes.",
    },
    vendorLandscape: [
      {
        vendorName: "Epic BestPractice Advisories",
        role: "Core CDS alerting workflow",
        caution:
          "High alert volume without lifecycle governance causes fatigue.",
      },
      {
        vendorName: "Oracle Health",
        role: "EHR and clinical workflow platform",
        caution:
          "Acceptance metrics must distinguish action from passive dismissal.",
      },
    ],
    expectedGapClasses: ["quantitative_gap", "trajectory_gap"],
    failureModeIds: [5, 6, 9],
    patternRefs: ["PAT-FM-005", "PAT-FM-006", "PAT-FM-009"],
    refreshCadence: "quarterly",
  }),
  metric({
    id: "PAT-MET-205",
    name: "Initial claims denial rate",
    aliases: [
      "denial rate",
      "first-pass denial rate",
      "claim denial percentage",
    ],
    industries: ["healthcare_idn"],
    domain: "back_office",
    theme: "revenue_cycle_denials",
    priorityTier: "tier_1",
    definition:
      "Percent of submitted claims denied on first pass, measured by claim count and optionally weighted by allowed amount.",
    whyItMatters:
      "Denials convert clinical delivery into avoidable working-capital drag, rework cost, patient friction, and revenue leakage.",
    cohort: "Healthcare IDN with hospital and professional billing.",
    northStarRange: range(3, 6, "%", "First-pass claims denied"),
    leaderBenchmark: range(6, 9, "%", "Strong RCM operators"),
    commonFloor: range(
      12,
      22,
      "%",
      "Fragmented eligibility, auth, coding, and billing workflows",
    ),
    trajectorySignal:
      "Leaders reduce preventable denials through root-cause worklists and payer-specific rules; laggards only expand follow-up teams.",
    measurementDifficulty: "low",
    foundationRequirements: {
      data: "Claim, remit, denial reason, auth, eligibility, coding, and appeal outcome data.",
      identity:
        "Payer, plan, encounter, claim, service line, and denial reason normalized.",
      operations: "Preventable denial taxonomy tied to upstream owner.",
      governance:
        "RCM owns denial prevention backlog with clinical and access partners.",
    },
    vendorLandscape: [
      {
        vendorName: "R1 RCM",
        role: "Revenue cycle operations and denial management",
        caution:
          "Outsourcing can obscure root-cause ownership if metrics stop at recovery.",
      },
      {
        vendorName: "Waystar",
        role: "Claims and denial workflow automation",
        caution: "Reason-code quality determines prevention value.",
      },
    ],
    expectedGapClasses: ["quantitative_gap", "trajectory_gap"],
    failureModeIds: [5, 9],
    patternRefs: ["PAT-FM-005", "PAT-FM-009"],
    refreshCadence: "quarterly",
  }),
  metric({
    id: "PAT-MET-206",
    name: "Interoperability coverage for priority data elements",
    aliases: [
      "FHIR coverage",
      "priority clinical data availability",
      "data exchange coverage",
    ],
    industries: ["healthcare_idn"],
    domain: "back_office",
    theme: "clinical_data_foundation",
    priorityTier: "tier_1",
    definition:
      "Percent of priority clinical, administrative, and financial data elements available through governed interfaces at required freshness and completeness thresholds.",
    whyItMatters:
      "Care delivery AI, value-based care, prior auth automation, and analytics modernization fail when critical data stays trapped in non-interoperable workflows.",
    cohort:
      "Healthcare IDN with EHR, RCM, population health, and analytics platforms.",
    northStarRange: range(
      85,
      95,
      "%",
      "Priority data elements governed and available",
    ),
    leaderBenchmark: range(70, 85, "%", "Strong interoperability foundation"),
    commonFloor: range(30, 60, "%", "Interface-by-project estate"),
    trajectorySignal:
      "Leaders improve as product teams own data domains and FHIR/API coverage; laggards keep rebuilding point interfaces per initiative.",
    measurementDifficulty: "high",
    foundationRequirements: {
      data: "Data catalog, interface inventory, freshness, completeness, lineage, and access telemetry.",
      identity:
        "Patient, provider, encounter, order, claim, and payer identifiers mastered.",
      operations:
        "Data product intake and SLA management for priority use cases.",
      governance:
        "Architecture, data governance, compliance, and clinical operations own data-product readiness.",
    },
    vendorLandscape: [
      {
        vendorName: "Epic Interconnect and FHIR APIs",
        role: "Clinical-system integration foundation",
        caution:
          "API availability is not the same as governed data-product readiness.",
      },
      {
        vendorName: "Redox",
        role: "Healthcare integration and interoperability layer",
        caution: "Integration broker does not replace domain ownership.",
      },
    ],
    expectedGapClasses: ["measurement_gap", "quantitative_gap"],
    failureModeIds: [3, 5, 10],
    patternRefs: ["PAT-FM-003", "PAT-FM-005", "PAT-FM-010"],
    refreshCadence: "quarterly",
  }),
  metric({
    id: "PAT-MET-401",
    name: "Digital application completion rate",
    aliases: [
      "digital funnel completion",
      "application conversion rate",
      "account opening completion",
    ],
    industries: ["financial_services"],
    domain: "front_office",
    theme: "digital_acquisition",
    priorityTier: "tier_1",
    definition:
      "Percent of started digital applications that reach submitted, decisioned, or funded status within the product-specific window.",
    whyItMatters:
      "Digital banking and lending AI has little commercial effect if customers abandon before eligibility, decisioning, or funding.",
    cohort:
      "Regional financial services institution with digital banking and lending products.",
    northStarRange: range(55, 75, "%", "Started applications completing"),
    leaderBenchmark: range(
      40,
      55,
      "%",
      "Top-quartile digital acquisition operators",
    ),
    commonFloor: range(
      12,
      30,
      "%",
      "Manual handoffs and fragmented identity checks",
    ),
    trajectorySignal:
      "Leaders improve through prefill, identity verification, next-best-action routing, and product-specific funnel analytics.",
    measurementDifficulty: "moderate",
    foundationRequirements: {
      data: "Clickstream, CRM, KYC, application, decisioning, and funding events joined by journey.",
      identity:
        "Customer, prospect, device, application, and product identifiers reconciled.",
      operations:
        "Funnel defect review by product, channel, and abandonment reason.",
      governance:
        "Product, risk, compliance, and digital operations jointly own completion and suitability.",
    },
    vendorLandscape: [
      {
        vendorName: "nCino",
        role: "Loan origination and workflow platform",
        caution:
          "Completion gains require channel instrumentation outside LOS too.",
      },
      {
        vendorName: "Salesforce Financial Services Cloud",
        role: "Customer engagement and banker workflow",
        caution: "Needs clean handoff to core and origination platforms.",
      },
    ],
    expectedGapClasses: ["quantitative_gap", "measurement_gap"],
    failureModeIds: [2, 5, 9],
    patternRefs: ["PAT-FM-002", "PAT-FM-005", "PAT-FM-009"],
    refreshCadence: "quarterly",
  }),
  metric({
    id: "PAT-MET-402",
    name: "Next-best-action acceptance rate",
    aliases: [
      "NBA acceptance",
      "offer acceptance rate",
      "recommendation action rate",
    ],
    industries: ["financial_services"],
    domain: "front_office",
    theme: "customer_engagement",
    priorityTier: "tier_1",
    definition:
      "Percent of eligible next-best-action recommendations accepted by banker, advisor, agent, or customer within the action window.",
    whyItMatters:
      "Personalization and advisor-assist investments fail when recommendations are ignored, poorly governed, or disconnected from compliant customer need.",
    cohort:
      "Financial services institution with branch, digital, and contact center channels.",
    northStarRange: range(18, 35, "%", "Eligible recommendations accepted"),
    leaderBenchmark: range(12, 18, "%", "Mature governed NBA programs"),
    commonFloor: range(1, 6, "%", "Low-trust recommendation pilots"),
    trajectorySignal:
      "Leaders improve as eligibility, explainability, and channel workflow fit improve; laggards keep pushing generic offers.",
    measurementDifficulty: "moderate",
    foundationRequirements: {
      data: "Recommendation, eligibility, customer profile, channel interaction, disposition, and outcome data.",
      identity:
        "Customer, household, banker, product, and channel identifiers reconciled.",
      operations:
        "Disposition codes and feedback loops built into banker and digital workflows.",
      governance:
        "Risk and compliance approve eligibility, suitability, and explainability guardrails.",
    },
    vendorLandscape: [
      {
        vendorName: "Pega Customer Decision Hub",
        role: "Real-time decisioning and NBA orchestration",
        caution: "Model governance and action taxonomy drive realized value.",
      },
      {
        vendorName: "Adobe Experience Platform",
        role: "Customer profile and activation substrate",
        caution:
          "Financial suitability rules must be externalized and auditable.",
      },
    ],
    expectedGapClasses: ["quantitative_gap", "trajectory_gap"],
    failureModeIds: [6, 7, 9],
    patternRefs: ["PAT-FM-006", "PAT-FM-007", "PAT-FM-009"],
    refreshCadence: "quarterly",
  }),
  metric({
    id: "PAT-MET-403",
    name: "Fraud false positive rate",
    aliases: [
      "fraud false positives",
      "unnecessary fraud declines",
      "good-customer fraud friction",
    ],
    industries: ["financial_services"],
    domain: "middle_office",
    theme: "fraud_detection",
    priorityTier: "tier_1",
    definition:
      "Percent of fraud alerts, blocks, or step-up challenges later confirmed as legitimate customer activity.",
    whyItMatters:
      "Fraud AI must reduce loss without creating customer friction, operational review burden, or revenue leakage from false declines.",
    cohort:
      "Financial services institution with card, ACH, digital, and account-opening fraud controls.",
    northStarRange: range(
      15,
      30,
      "%",
      "False positive alerts or interventions",
    ),
    leaderBenchmark: range(30, 45, "%", "Strong fraud model operations"),
    commonFloor: range(60, 90, "%", "Rules-heavy or stale model estate"),
    trajectorySignal:
      "Leaders lower false positives as feature freshness, feedback loops, and risk segmentation improve; laggards tune only loss rate.",
    measurementDifficulty: "high",
    foundationRequirements: {
      data: "Alert, transaction, case, customer contact, chargeback, dispute, and confirmed fraud labels.",
      identity:
        "Customer, account, device, merchant, transaction, and case identifiers reconciled.",
      operations:
        "Analyst feedback and customer-confirmation outcomes captured consistently.",
      governance:
        "Fraud, digital, operations, and model risk jointly review loss-friction tradeoffs.",
    },
    vendorLandscape: [
      {
        vendorName: "FICO Falcon",
        role: "Card fraud detection and scoring",
        caution: "False positive value depends on feedback-loop quality.",
      },
      {
        vendorName: "Feedzai",
        role: "Financial crime and fraud decisioning",
        caution:
          "Model explainability and operations adoption must be designed upfront.",
      },
    ],
    expectedGapClasses: ["quantitative_gap", "trajectory_gap"],
    failureModeIds: [5, 6, 9],
    patternRefs: ["PAT-FM-005", "PAT-FM-006", "PAT-FM-009"],
    refreshCadence: "quarterly",
  }),
  metric({
    id: "PAT-MET-404",
    name: "Credit decision cycle time",
    aliases: [
      "time to credit decision",
      "loan decision turnaround",
      "underwriting cycle time",
    ],
    industries: ["financial_services"],
    domain: "middle_office",
    theme: "credit_decisioning",
    priorityTier: "tier_1",
    definition:
      "Median elapsed time from complete credit application receipt to approved, declined, or conditioned decision.",
    whyItMatters:
      "Credit decisioning AI has value only when it improves speed, consistency, risk quality, and customer experience together.",
    cohort:
      "Regional financial services institution with consumer and commercial lending.",
    northStarRange: range(
      5,
      30,
      "minutes",
      "Simple digital products; product-specific",
    ),
    leaderBenchmark: range(
      30,
      240,
      "minutes",
      "Digitally mature lending operators",
    ),
    commonFloor: range(
      1,
      10,
      "business days",
      "Manual underwriting and fragmented documents",
    ),
    trajectorySignal:
      "Leaders reduce cycle time by codifying policy, pre-validating documents, and separating straight-through from judgmental decisions.",
    measurementDifficulty: "moderate",
    foundationRequirements: {
      data: "Application, document, policy, bureau, KYC, underwriting, decision, and funding timestamps.",
      identity:
        "Borrower, household, business, application, product, and underwriter identifiers reconciled.",
      operations:
        "Reason codes and exception paths standardized across product teams.",
      governance:
        "Credit risk and compliance approve model scope, adverse-action logic, and overrides.",
    },
    vendorLandscape: [
      {
        vendorName: "nCino",
        role: "Commercial and small-business lending workflow",
        caution:
          "Cycle-time metrics must separate complete versus incomplete applications.",
      },
      {
        vendorName: "Zest AI",
        role: "Credit model and decisioning support",
        caution:
          "Fair-lending and model-risk controls must be live before scale.",
      },
    ],
    expectedGapClasses: ["quantitative_gap", "measurement_gap"],
    failureModeIds: [2, 6, 9],
    patternRefs: ["PAT-FM-002", "PAT-FM-006", "PAT-FM-009"],
    refreshCadence: "quarterly",
  }),
  metric({
    id: "PAT-MET-405",
    name: "Regulatory reporting accuracy",
    aliases: [
      "reg reporting quality",
      "reporting defect rate",
      "regulatory data accuracy",
    ],
    industries: ["financial_services"],
    domain: "back_office",
    theme: "regulatory_reporting",
    priorityTier: "tier_1",
    definition:
      "Percent of regulatory reporting submissions without material defect, restatement, late adjustment, or control exception.",
    whyItMatters:
      "AI-enabled finance, risk, and compliance work cannot be trusted if the institution cannot prove control over regulated data outputs.",
    cohort:
      "Financial services institution subject to recurring regulatory and management reporting.",
    northStarRange: range(98, 100, "%", "Submissions without material defect"),
    leaderBenchmark: range(95, 98, "%", "Strong regulatory data controls"),
    commonFloor: range(
      80,
      92,
      "%",
      "Manual lineage and spreadsheet reconciliation",
    ),
    trajectorySignal:
      "Leaders improve as data lineage, reconciliations, and control evidence become machine-checkable; laggards add manual signoffs.",
    measurementDifficulty: "moderate",
    foundationRequirements: {
      data: "Report inventory, data lineage, reconciliations, control checks, exceptions, and submission history.",
      identity:
        "Product, account, legal entity, control, and report identifiers reconciled.",
      operations:
        "Issue taxonomy and defect root-cause workflow for reporting exceptions.",
      governance:
        "Finance, risk, compliance, and data office own reporting controls jointly.",
    },
    vendorLandscape: [
      {
        vendorName: "AxiomSL",
        role: "Regulatory reporting and risk data aggregation",
        caution: "Tooling does not fix upstream lineage and ownership gaps.",
      },
      {
        vendorName: "Collibra",
        role: "Data governance, lineage, and control catalog",
        caution: "Catalog adoption must be tied to report-control evidence.",
      },
    ],
    expectedGapClasses: ["quantitative_gap", "measurement_gap"],
    failureModeIds: [3, 6, 9],
    patternRefs: ["PAT-FM-003", "PAT-FM-006", "PAT-FM-009"],
    refreshCadence: "quarterly",
  }),
  metric({
    id: "PAT-MET-406",
    name: "Model validation cycle time",
    aliases: [
      "model risk validation time",
      "MRM cycle time",
      "model approval turnaround",
    ],
    industries: ["financial_services"],
    domain: "back_office",
    theme: "model_risk_management",
    priorityTier: "tier_1",
    definition:
      "Median elapsed time from complete model submission to validation decision, including remediation cycles and approval conditions.",
    whyItMatters:
      "Agentic and predictive AI programs stall when model risk management cannot validate use cases at the pace of product and control needs.",
    cohort:
      "Financial services institution with centralized model risk management.",
    northStarRange: range(
      10,
      30,
      "business days",
      "Complete submission to decision by risk tier",
    ),
    leaderBenchmark: range(
      30,
      60,
      "business days",
      "Mature tiered validation programs",
    ),
    commonFloor: range(
      90,
      180,
      "business days",
      "Queue-based validation with weak submission quality",
    ),
    trajectorySignal:
      "Leaders reduce cycle time through tiering, reusable evidence packs, automated monitoring, and clear change-materiality rules.",
    measurementDifficulty: "moderate",
    foundationRequirements: {
      data: "Model inventory, risk tier, submission evidence, validation findings, remediation, approvals, and monitoring history.",
      identity:
        "Model, owner, use case, data source, control, and system identifiers reconciled.",
      operations:
        "Standard model evidence pack and intake completeness checks.",
      governance:
        "Model risk, legal, compliance, technology, and business owners share approval-state visibility.",
    },
    vendorLandscape: [
      {
        vendorName: "ModelOp",
        role: "Model governance and lifecycle operations",
        caution:
          "Workflow tooling requires a defined tiering and evidence standard.",
      },
      {
        vendorName: "DataRobot",
        role: "Model development and monitoring platform",
        caution: "Development speed must be matched by validation evidence.",
      },
    ],
    expectedGapClasses: ["quantitative_gap", "trajectory_gap"],
    failureModeIds: [6, 8, 10],
    patternRefs: ["PAT-FM-006", "PAT-FM-008", "PAT-FM-010"],
    refreshCadence: "quarterly",
  }),
] as const;

interface MetricCatalogSpec {
  id: number;
  industry: MetricIndustry;
  domain: MetricDomain;
  name: string;
  theme: string;
}

const ADDITIONAL_TIER1_METRIC_SPECS: readonly MetricCatalogSpec[] = [
  {
    id: 7,
    industry: "specialty_retail",
    domain: "front_office",
    name: "Store traffic conversion rate",
    theme: "store_traffic_conversion_rate",
  },
  {
    id: 8,
    industry: "specialty_retail",
    domain: "front_office",
    name: "Digital conversion rate",
    theme: "digital_conversion_rate",
  },
  {
    id: 9,
    industry: "specialty_retail",
    domain: "front_office",
    name: "Cart abandonment rate",
    theme: "cart_abandonment_rate",
  },
  {
    id: 10,
    industry: "specialty_retail",
    domain: "front_office",
    name: "Loyalty active member rate",
    theme: "loyalty_active_member_rate",
  },
  {
    id: 11,
    industry: "specialty_retail",
    domain: "front_office",
    name: "Customer lifetime value accuracy",
    theme: "customer_lifetime_value_accuracy",
  },
  {
    id: 12,
    industry: "specialty_retail",
    domain: "front_office",
    name: "Personalized offer redemption rate",
    theme: "personalized_offer_redemption_rate",
  },
  {
    id: 13,
    industry: "specialty_retail",
    domain: "front_office",
    name: "Email revenue per recipient",
    theme: "email_revenue_per_recipient",
  },
  {
    id: 14,
    industry: "specialty_retail",
    domain: "front_office",
    name: "Mobile app active customer rate",
    theme: "mobile_app_active_customer_rate",
  },
  {
    id: 15,
    industry: "specialty_retail",
    domain: "front_office",
    name: "Customer acquisition cost payback",
    theme: "customer_acquisition_cost_payback",
  },
  {
    id: 16,
    industry: "specialty_retail",
    domain: "front_office",
    name: "Net promoter score by journey",
    theme: "net_promoter_score_by_journey",
  },
  {
    id: 17,
    industry: "specialty_retail",
    domain: "front_office",
    name: "Service deflection rate",
    theme: "service_deflection_rate",
  },
  {
    id: 18,
    industry: "specialty_retail",
    domain: "front_office",
    name: "First contact resolution rate",
    theme: "first_contact_resolution_rate",
  },
  {
    id: 19,
    industry: "specialty_retail",
    domain: "front_office",
    name: "Return rate by channel",
    theme: "return_rate_by_channel",
  },
  {
    id: 20,
    industry: "specialty_retail",
    domain: "front_office",
    name: "Product review sentiment score",
    theme: "product_review_sentiment_score",
  },
  {
    id: 21,
    industry: "specialty_retail",
    domain: "front_office",
    name: "Customer data consent capture rate",
    theme: "customer_data_consent_capture_rate",
  },
  {
    id: 22,
    industry: "specialty_retail",
    domain: "front_office",
    name: "Cross-channel attribution coverage",
    theme: "cross_channel_attribution_coverage",
  },
  {
    id: 23,
    industry: "specialty_retail",
    domain: "front_office",
    name: "Associate assisted-sale conversion",
    theme: "associate_assisted_sale_conversion",
  },
  {
    id: 24,
    industry: "specialty_retail",
    domain: "front_office",
    name: "Store appointment show rate",
    theme: "store_appointment_show_rate",
  },
  {
    id: 25,
    industry: "specialty_retail",
    domain: "front_office",
    name: "Clienteling outreach response rate",
    theme: "clienteling_outreach_response_rate",
  },
  {
    id: 26,
    industry: "specialty_retail",
    domain: "front_office",
    name: "Loyalty enrollment conversion",
    theme: "loyalty_enrollment_conversion",
  },
  {
    id: 27,
    industry: "specialty_retail",
    domain: "front_office",
    name: "Customer 360 completeness",
    theme: "customer_360_completeness",
  },
  {
    id: 28,
    industry: "specialty_retail",
    domain: "front_office",
    name: "Segment activation precision",
    theme: "segment_activation_precision",
  },
  {
    id: 29,
    industry: "specialty_retail",
    domain: "front_office",
    name: "Promotion audience overlap rate",
    theme: "promotion_audience_overlap_rate",
  },
  {
    id: 30,
    industry: "specialty_retail",
    domain: "front_office",
    name: "Owned-channel opt-out rate",
    theme: "owned_channel_opt_out_rate",
  },
  {
    id: 31,
    industry: "specialty_retail",
    domain: "front_office",
    name: "Customer record freshness",
    theme: "customer_record_freshness",
  },
  {
    id: 32,
    industry: "specialty_retail",
    domain: "front_office",
    name: "Cross-channel identity conflict rate",
    theme: "cross_channel_identity_conflict_rate",
  },
  {
    id: 33,
    industry: "specialty_retail",
    domain: "front_office",
    name: "Recommendation click-through rate",
    theme: "recommendation_click_through_rate",
  },
  {
    id: 34,
    industry: "specialty_retail",
    domain: "middle_office",
    name: "Inventory turnover",
    theme: "inventory_turnover",
  },
  {
    id: 35,
    industry: "specialty_retail",
    domain: "middle_office",
    name: "Days inventory on hand",
    theme: "days_inventory_on_hand",
  },
  {
    id: 36,
    industry: "specialty_retail",
    domain: "middle_office",
    name: "Markdown depth rate",
    theme: "markdown_depth_rate",
  },
  {
    id: 37,
    industry: "specialty_retail",
    domain: "middle_office",
    name: "Forecast bias at SKU-week",
    theme: "forecast_bias_at_sku_week",
  },
  {
    id: 38,
    industry: "specialty_retail",
    domain: "middle_office",
    name: "Replenishment exception rate",
    theme: "replenishment_exception_rate",
  },
  {
    id: 39,
    industry: "specialty_retail",
    domain: "middle_office",
    name: "Supplier on-time in-full",
    theme: "supplier_on_time_in_full",
  },
  {
    id: 40,
    industry: "specialty_retail",
    domain: "middle_office",
    name: "Allocation accuracy",
    theme: "allocation_accuracy",
  },
  {
    id: 41,
    industry: "specialty_retail",
    domain: "middle_office",
    name: "Stock-out recovery time",
    theme: "stock_out_recovery_time",
  },
  {
    id: 42,
    industry: "specialty_retail",
    domain: "middle_office",
    name: "Assortment productivity",
    theme: "assortment_productivity",
  },
  {
    id: 43,
    industry: "specialty_retail",
    domain: "middle_office",
    name: "Promotion lift accuracy",
    theme: "promotion_lift_accuracy",
  },
  {
    id: 44,
    industry: "specialty_retail",
    domain: "middle_office",
    name: "Price elasticity model coverage",
    theme: "price_elasticity_model_coverage",
  },
  {
    id: 45,
    industry: "specialty_retail",
    domain: "middle_office",
    name: "Demand sensing signal freshness",
    theme: "demand_sensing_signal_freshness",
  },
  {
    id: 46,
    industry: "specialty_retail",
    domain: "middle_office",
    name: "Store labor schedule adherence",
    theme: "store_labor_schedule_adherence",
  },
  {
    id: 47,
    industry: "specialty_retail",
    domain: "middle_office",
    name: "Labor cost as percent of store sales",
    theme: "labor_cost_as_percent_of_store_sales",
  },
  {
    id: 48,
    industry: "specialty_retail",
    domain: "middle_office",
    name: "Task completion SLA",
    theme: "task_completion_sla",
  },
  {
    id: 49,
    industry: "specialty_retail",
    domain: "middle_office",
    name: "Shrink rate",
    theme: "shrink_rate",
  },
  {
    id: 50,
    industry: "specialty_retail",
    domain: "middle_office",
    name: "Return-to-stock cycle time",
    theme: "return_to_stock_cycle_time",
  },
  {
    id: 51,
    industry: "specialty_retail",
    domain: "middle_office",
    name: "Vendor fill rate",
    theme: "vendor_fill_rate",
  },
  {
    id: 52,
    industry: "specialty_retail",
    domain: "middle_office",
    name: "Purchase order cycle time",
    theme: "purchase_order_cycle_time",
  },
  {
    id: 53,
    industry: "specialty_retail",
    domain: "middle_office",
    name: "Distribution center pick accuracy",
    theme: "distribution_center_pick_accuracy",
  },
  {
    id: 54,
    industry: "specialty_retail",
    domain: "middle_office",
    name: "DC automation utilization",
    theme: "dc_automation_utilization",
  },
  {
    id: 55,
    industry: "specialty_retail",
    domain: "middle_office",
    name: "Store inventory accuracy",
    theme: "store_inventory_accuracy",
  },
  {
    id: 56,
    industry: "specialty_retail",
    domain: "middle_office",
    name: "Transfer order success rate",
    theme: "transfer_order_success_rate",
  },
  {
    id: 57,
    industry: "specialty_retail",
    domain: "middle_office",
    name: "Omnichannel order promise accuracy",
    theme: "omnichannel_order_promise_accuracy",
  },
  {
    id: 58,
    industry: "specialty_retail",
    domain: "middle_office",
    name: "Buy-online-pickup readiness",
    theme: "buy_online_pickup_readiness",
  },
  {
    id: 59,
    industry: "specialty_retail",
    domain: "middle_office",
    name: "Replenishment lead-time variance",
    theme: "replenishment_lead_time_variance",
  },
  {
    id: 60,
    industry: "specialty_retail",
    domain: "middle_office",
    name: "Planogram compliance rate",
    theme: "planogram_compliance_rate",
  },
  {
    id: 61,
    industry: "specialty_retail",
    domain: "back_office",
    name: "Gross margin variance explainability",
    theme: "gross_margin_variance_explainability",
  },
  {
    id: 62,
    industry: "specialty_retail",
    domain: "back_office",
    name: "SG&A as percent of revenue",
    theme: "sganda_as_percent_of_revenue",
  },
  {
    id: 63,
    industry: "specialty_retail",
    domain: "back_office",
    name: "IT spend as percent of revenue",
    theme: "it_spend_as_percent_of_revenue",
  },
  {
    id: 64,
    industry: "specialty_retail",
    domain: "back_office",
    name: "Cloud cost variance",
    theme: "cloud_cost_variance",
  },
  {
    id: 65,
    industry: "specialty_retail",
    domain: "back_office",
    name: "Certified report usage rate",
    theme: "certified_report_usage_rate",
  },
  {
    id: 66,
    industry: "specialty_retail",
    domain: "back_office",
    name: "Report duplication rate",
    theme: "report_duplication_rate",
  },
  {
    id: 67,
    industry: "specialty_retail",
    domain: "back_office",
    name: "Analytics request cycle time",
    theme: "analytics_request_cycle_time",
  },
  {
    id: 68,
    industry: "specialty_retail",
    domain: "back_office",
    name: "ERP master data defect rate",
    theme: "erp_master_data_defect_rate",
  },
  {
    id: 69,
    industry: "specialty_retail",
    domain: "back_office",
    name: "Invoice exception rate",
    theme: "invoice_exception_rate",
  },
  {
    id: 70,
    industry: "specialty_retail",
    domain: "back_office",
    name: "Procure-to-pay cycle time",
    theme: "procure_to_pay_cycle_time",
  },
  {
    id: 71,
    industry: "specialty_retail",
    domain: "back_office",
    name: "Contract leakage rate",
    theme: "contract_leakage_rate",
  },
  {
    id: 72,
    industry: "specialty_retail",
    domain: "back_office",
    name: "Vendor renewal lead time",
    theme: "vendor_renewal_lead_time",
  },
  {
    id: 73,
    industry: "specialty_retail",
    domain: "back_office",
    name: "Security patch SLA attainment",
    theme: "security_patch_sla_attainment",
  },
  {
    id: 74,
    industry: "specialty_retail",
    domain: "back_office",
    name: "Identity access recertification completion",
    theme: "identity_access_recertification_completion",
  },
  {
    id: 75,
    industry: "specialty_retail",
    domain: "back_office",
    name: "Employee turnover in critical roles",
    theme: "employee_turnover_in_critical_roles",
  },
  {
    id: 76,
    industry: "specialty_retail",
    domain: "back_office",
    name: "Training completion for new workflows",
    theme: "training_completion_for_new_workflows",
  },
  {
    id: 77,
    industry: "specialty_retail",
    domain: "back_office",
    name: "Finance forecast accuracy",
    theme: "finance_forecast_accuracy",
  },
  {
    id: 78,
    industry: "specialty_retail",
    domain: "back_office",
    name: "Budget variance closeout rate",
    theme: "budget_variance_closeout_rate",
  },
  {
    id: 79,
    industry: "specialty_retail",
    domain: "back_office",
    name: "Audit finding remediation days",
    theme: "audit_finding_remediation_days",
  },
  {
    id: 80,
    industry: "specialty_retail",
    domain: "back_office",
    name: "Data quality incident rate",
    theme: "data_quality_incident_rate",
  },
  {
    id: 81,
    industry: "specialty_retail",
    domain: "back_office",
    name: "Semantic layer coverage",
    theme: "semantic_layer_coverage",
  },
  {
    id: 82,
    industry: "specialty_retail",
    domain: "back_office",
    name: "AI model production count",
    theme: "ai_model_production_count",
  },
  {
    id: 83,
    industry: "specialty_retail",
    domain: "back_office",
    name: "MLOps deployment frequency",
    theme: "mlops_deployment_frequency",
  },
  {
    id: 84,
    industry: "specialty_retail",
    domain: "back_office",
    name: "Business continuity test pass rate",
    theme: "business_continuity_test_pass_rate",
  },
  {
    id: 85,
    industry: "specialty_retail",
    domain: "back_office",
    name: "Integration failure rate",
    theme: "integration_failure_rate",
  },
  {
    id: 86,
    industry: "specialty_retail",
    domain: "back_office",
    name: "Data product retirement rate",
    theme: "data_product_retirement_rate",
  },
  {
    id: 207,
    industry: "healthcare_idn",
    domain: "front_office",
    name: "Digital self-scheduling conversion rate",
    theme: "digital_self_scheduling_conversion_rate",
  },
  {
    id: 208,
    industry: "healthcare_idn",
    domain: "front_office",
    name: "Third-next-available appointment days",
    theme: "third_next_available_appointment_days",
  },
  {
    id: 209,
    industry: "healthcare_idn",
    domain: "front_office",
    name: "Referral-to-scheduled cycle time",
    theme: "referral_to_scheduled_cycle_time",
  },
  {
    id: 210,
    industry: "healthcare_idn",
    domain: "front_office",
    name: "Referral leakage rate",
    theme: "referral_leakage_rate",
  },
  {
    id: 211,
    industry: "healthcare_idn",
    domain: "front_office",
    name: "Call center abandonment rate",
    theme: "call_center_abandonment_rate",
  },
  {
    id: 212,
    industry: "healthcare_idn",
    domain: "front_office",
    name: "MyChart active patient rate",
    theme: "mychart_active_patient_rate",
  },
  {
    id: 213,
    industry: "healthcare_idn",
    domain: "front_office",
    name: "Portal message response time",
    theme: "portal_message_response_time",
  },
  {
    id: 214,
    industry: "healthcare_idn",
    domain: "front_office",
    name: "Patient identity duplicate rate",
    theme: "patient_identity_duplicate_rate",
  },
  {
    id: 215,
    industry: "healthcare_idn",
    domain: "front_office",
    name: "Pre-registration completion rate",
    theme: "pre_registration_completion_rate",
  },
  {
    id: 216,
    industry: "healthcare_idn",
    domain: "front_office",
    name: "Price estimate completion rate",
    theme: "price_estimate_completion_rate",
  },
  {
    id: 217,
    industry: "healthcare_idn",
    domain: "front_office",
    name: "Eligibility verification first-pass rate",
    theme: "eligibility_verification_first_pass_rate",
  },
  {
    id: 218,
    industry: "healthcare_idn",
    domain: "front_office",
    name: "Patient financial clearance cycle time",
    theme: "patient_financial_clearance_cycle_time",
  },
  {
    id: 219,
    industry: "healthcare_idn",
    domain: "front_office",
    name: "Prior auth request completeness rate",
    theme: "prior_auth_request_completeness_rate",
  },
  {
    id: 220,
    industry: "healthcare_idn",
    domain: "front_office",
    name: "Payer response automation rate",
    theme: "payer_response_automation_rate",
  },
  {
    id: 221,
    industry: "healthcare_idn",
    domain: "front_office",
    name: "Referral workqueue aging days",
    theme: "referral_workqueue_aging_days",
  },
  {
    id: 222,
    industry: "healthcare_idn",
    domain: "front_office",
    name: "Appointment no-show rate",
    theme: "appointment_no_show_rate",
  },
  {
    id: 223,
    industry: "healthcare_idn",
    domain: "front_office",
    name: "Access template utilization rate",
    theme: "access_template_utilization_rate",
  },
  {
    id: 224,
    industry: "healthcare_idn",
    domain: "front_office",
    name: "Provider template release compliance",
    theme: "provider_template_release_compliance",
  },
  {
    id: 225,
    industry: "healthcare_idn",
    domain: "front_office",
    name: "Care gap outreach completion rate",
    theme: "care_gap_outreach_completion_rate",
  },
  {
    id: 226,
    industry: "healthcare_idn",
    domain: "front_office",
    name: "Annual wellness visit completion rate",
    theme: "annual_wellness_visit_completion_rate",
  },
  {
    id: 227,
    industry: "healthcare_idn",
    domain: "front_office",
    name: "Patient-reported outcome capture rate",
    theme: "patient_reported_outcome_capture_rate",
  },
  {
    id: 228,
    industry: "healthcare_idn",
    domain: "front_office",
    name: "Remote monitoring enrollment rate",
    theme: "remote_monitoring_enrollment_rate",
  },
  {
    id: 229,
    industry: "healthcare_idn",
    domain: "front_office",
    name: "Discharge follow-up completion rate",
    theme: "discharge_follow_up_completion_rate",
  },
  {
    id: 230,
    industry: "healthcare_idn",
    domain: "front_office",
    name: "Digital front door conversion rate",
    theme: "digital_front_door_conversion_rate",
  },
  {
    id: 231,
    industry: "healthcare_idn",
    domain: "front_office",
    name: "Service-line demand capture rate",
    theme: "service_line_demand_capture_rate",
  },
  {
    id: 232,
    industry: "healthcare_idn",
    domain: "front_office",
    name: "Patient consent completeness rate",
    theme: "patient_consent_completeness_rate",
  },
  {
    id: 233,
    industry: "healthcare_idn",
    domain: "middle_office",
    name: "Epic order set adoption rate",
    theme: "epic_order_set_adoption_rate",
  },
  {
    id: 234,
    industry: "healthcare_idn",
    domain: "middle_office",
    name: "CDS override justification completeness",
    theme: "cds_override_justification_completeness",
  },
  {
    id: 235,
    industry: "healthcare_idn",
    domain: "middle_office",
    name: "Medication reconciliation completion rate",
    theme: "medication_reconciliation_completion_rate",
  },
  {
    id: 236,
    industry: "healthcare_idn",
    domain: "middle_office",
    name: "Sepsis bundle compliance rate",
    theme: "sepsis_bundle_compliance_rate",
  },
  {
    id: 237,
    industry: "healthcare_idn",
    domain: "middle_office",
    name: "Sepsis mortality rate",
    theme: "sepsis_mortality_rate",
  },
  {
    id: 238,
    industry: "healthcare_idn",
    domain: "middle_office",
    name: "All-cause readmission rate",
    theme: "all_cause_readmission_rate",
  },
  {
    id: 239,
    industry: "healthcare_idn",
    domain: "middle_office",
    name: "Length of stay index",
    theme: "length_of_stay_index",
  },
  {
    id: 240,
    industry: "healthcare_idn",
    domain: "middle_office",
    name: "Case mix index documentation capture",
    theme: "case_mix_index_documentation_capture",
  },
  {
    id: 241,
    industry: "healthcare_idn",
    domain: "middle_office",
    name: "CDI query response time",
    theme: "cdi_query_response_time",
  },
  {
    id: 242,
    industry: "healthcare_idn",
    domain: "middle_office",
    name: "CDI query agreement rate",
    theme: "cdi_query_agreement_rate",
  },
  {
    id: 243,
    industry: "healthcare_idn",
    domain: "middle_office",
    name: "Coding backlog days",
    theme: "coding_backlog_days",
  },
  {
    id: 244,
    industry: "healthcare_idn",
    domain: "middle_office",
    name: "DNFB days",
    theme: "dnfb_days",
  },
  {
    id: 245,
    industry: "healthcare_idn",
    domain: "middle_office",
    name: "Clean claim rate",
    theme: "clean_claim_rate",
  },
  {
    id: 246,
    industry: "healthcare_idn",
    domain: "middle_office",
    name: "Denial preventability rate",
    theme: "denial_preventability_rate",
  },
  {
    id: 247,
    industry: "healthcare_idn",
    domain: "middle_office",
    name: "Appeal success rate",
    theme: "appeal_success_rate",
  },
  {
    id: 248,
    industry: "healthcare_idn",
    domain: "middle_office",
    name: "Clinical documentation integrity score",
    theme: "clinical_documentation_integrity_score",
  },
  {
    id: 249,
    industry: "healthcare_idn",
    domain: "middle_office",
    name: "Care management touchpoint completion",
    theme: "care_management_touchpoint_completion",
  },
  {
    id: 250,
    industry: "healthcare_idn",
    domain: "middle_office",
    name: "Value-based care gap closure rate",
    theme: "value_based_care_gap_closure_rate",
  },
  {
    id: 251,
    industry: "healthcare_idn",
    domain: "middle_office",
    name: "HEDIS measure capture completeness",
    theme: "hedis_measure_capture_completeness",
  },
  {
    id: 252,
    industry: "healthcare_idn",
    domain: "middle_office",
    name: "Risk adjustment coding completeness",
    theme: "risk_adjustment_coding_completeness",
  },
  {
    id: 253,
    industry: "healthcare_idn",
    domain: "middle_office",
    name: "Population health attribution accuracy",
    theme: "population_health_attribution_accuracy",
  },
  {
    id: 254,
    industry: "healthcare_idn",
    domain: "middle_office",
    name: "Quality measure submission defect rate",
    theme: "quality_measure_submission_defect_rate",
  },
  {
    id: 255,
    industry: "healthcare_idn",
    domain: "middle_office",
    name: "Utilization management review timeliness",
    theme: "utilization_management_review_timeliness",
  },
  {
    id: 256,
    industry: "healthcare_idn",
    domain: "middle_office",
    name: "Clinical pathway adherence rate",
    theme: "clinical_pathway_adherence_rate",
  },
  {
    id: 257,
    industry: "healthcare_idn",
    domain: "middle_office",
    name: "Operating room block utilization",
    theme: "operating_room_block_utilization",
  },
  {
    id: 258,
    industry: "healthcare_idn",
    domain: "middle_office",
    name: "Emergency department left-without-being-seen rate",
    theme: "emergency_department_left_without_being_seen_rate",
  },
  {
    id: 259,
    industry: "healthcare_idn",
    domain: "middle_office",
    name: "Hospital-acquired infection rate",
    theme: "hospital_acquired_infection_rate",
  },
  {
    id: 260,
    industry: "healthcare_idn",
    domain: "back_office",
    name: "Epic interface exception rate",
    theme: "epic_interface_exception_rate",
  },
  {
    id: 261,
    industry: "healthcare_idn",
    domain: "back_office",
    name: "FHIR priority data element coverage",
    theme: "fhir_priority_data_element_coverage",
  },
  {
    id: 262,
    industry: "healthcare_idn",
    domain: "back_office",
    name: "Master patient index duplicate rate",
    theme: "master_patient_index_duplicate_rate",
  },
  {
    id: 263,
    industry: "healthcare_idn",
    domain: "back_office",
    name: "Provider master data completeness",
    theme: "provider_master_data_completeness",
  },
  {
    id: 264,
    industry: "healthcare_idn",
    domain: "back_office",
    name: "Data lineage coverage for clinical marts",
    theme: "data_lineage_coverage_for_clinical_marts",
  },
  {
    id: 265,
    industry: "healthcare_idn",
    domain: "back_office",
    name: "Clinical analytics certified report usage",
    theme: "clinical_analytics_certified_report_usage",
  },
  {
    id: 266,
    industry: "healthcare_idn",
    domain: "back_office",
    name: "Report duplication rate in quality analytics",
    theme: "report_duplication_rate_in_quality_analytics",
  },
  {
    id: 267,
    industry: "healthcare_idn",
    domain: "back_office",
    name: "RCM analytics request cycle time",
    theme: "rcm_analytics_request_cycle_time",
  },
  {
    id: 268,
    industry: "healthcare_idn",
    domain: "back_office",
    name: "EHR downtime minutes",
    theme: "ehr_downtime_minutes",
  },
  {
    id: 269,
    industry: "healthcare_idn",
    domain: "back_office",
    name: "Interface backlog aging days",
    theme: "interface_backlog_aging_days",
  },
  {
    id: 270,
    industry: "healthcare_idn",
    domain: "back_office",
    name: "Security access recertification completion",
    theme: "security_access_recertification_completion",
  },
  {
    id: 271,
    industry: "healthcare_idn",
    domain: "back_office",
    name: "HIPAA audit finding remediation days",
    theme: "hipaa_audit_finding_remediation_days",
  },
  {
    id: 272,
    industry: "healthcare_idn",
    domain: "back_office",
    name: "Cloud data platform cost variance",
    theme: "cloud_data_platform_cost_variance",
  },
  {
    id: 273,
    industry: "healthcare_idn",
    domain: "back_office",
    name: "Data quality incident rate for priority domains",
    theme: "data_quality_incident_rate_for_priority_domains",
  },
  {
    id: 274,
    industry: "healthcare_idn",
    domain: "back_office",
    name: "Model monitoring coverage for clinical AI",
    theme: "model_monitoring_coverage_for_clinical_ai",
  },
  {
    id: 275,
    industry: "healthcare_idn",
    domain: "back_office",
    name: "AI governance review cycle time",
    theme: "ai_governance_review_cycle_time",
  },
  {
    id: 276,
    industry: "healthcare_idn",
    domain: "back_office",
    name: "Change advisory cycle time for clinical workflows",
    theme: "change_advisory_cycle_time_for_clinical_workflows",
  },
  {
    id: 277,
    industry: "healthcare_idn",
    domain: "back_office",
    name: "Training completion for Epic workflow changes",
    theme: "training_completion_for_epic_workflow_changes",
  },
  {
    id: 278,
    industry: "healthcare_idn",
    domain: "back_office",
    name: "Physician documentation burden minutes",
    theme: "physician_documentation_burden_minutes",
  },
  {
    id: 279,
    industry: "healthcare_idn",
    domain: "back_office",
    name: "Nurse documentation burden minutes",
    theme: "nurse_documentation_burden_minutes",
  },
  {
    id: 280,
    industry: "healthcare_idn",
    domain: "back_office",
    name: "Workforce vacancy rate in critical clinical roles",
    theme: "workforce_vacancy_rate_in_critical_clinical_roles",
  },
  {
    id: 281,
    industry: "healthcare_idn",
    domain: "back_office",
    name: "Contracted labor dependency rate",
    theme: "contracted_labor_dependency_rate",
  },
  {
    id: 282,
    industry: "healthcare_idn",
    domain: "back_office",
    name: "Supply preference card accuracy",
    theme: "supply_preference_card_accuracy",
  },
  {
    id: 283,
    industry: "healthcare_idn",
    domain: "back_office",
    name: "Medical supply stock-out rate",
    theme: "medical_supply_stock_out_rate",
  },
  {
    id: 284,
    industry: "healthcare_idn",
    domain: "back_office",
    name: "Payer contract term codification rate",
    theme: "payer_contract_term_codification_rate",
  },
  {
    id: 285,
    industry: "healthcare_idn",
    domain: "back_office",
    name: "Value-based contract performance visibility",
    theme: "value_based_contract_performance_visibility",
  },
  {
    id: 286,
    industry: "healthcare_idn",
    domain: "back_office",
    name: "Board quality metric refresh latency",
    theme: "board_quality_metric_refresh_latency",
  },
  {
    id: 407,
    industry: "financial_services",
    domain: "front_office",
    name: "Account opening abandonment rate",
    theme: "account_opening_abandonment_rate",
  },
  {
    id: 408,
    industry: "financial_services",
    domain: "front_office",
    name: "KYC straight-through completion rate",
    theme: "kyc_straight_through_completion_rate",
  },
  {
    id: 409,
    industry: "financial_services",
    domain: "front_office",
    name: "Digital onboarding cycle time",
    theme: "digital_onboarding_cycle_time",
  },
  {
    id: 410,
    industry: "financial_services",
    domain: "front_office",
    name: "Mobile active customer rate",
    theme: "mobile_active_customer_rate",
  },
  {
    id: 411,
    industry: "financial_services",
    domain: "front_office",
    name: "Personalized offer acceptance rate",
    theme: "personalized_offer_acceptance_rate",
  },
  {
    id: 412,
    industry: "financial_services",
    domain: "front_office",
    name: "Customer contact containment rate",
    theme: "customer_contact_containment_rate",
  },
  {
    id: 413,
    industry: "financial_services",
    domain: "front_office",
    name: "First contact resolution rate",
    theme: "first_contact_resolution_rate",
  },
  {
    id: 414,
    industry: "financial_services",
    domain: "front_office",
    name: "Complaint resolution cycle time",
    theme: "complaint_resolution_cycle_time",
  },
  {
    id: 415,
    industry: "financial_services",
    domain: "front_office",
    name: "Net promoter score by journey",
    theme: "net_promoter_score_by_journey",
  },
  {
    id: 416,
    industry: "financial_services",
    domain: "front_office",
    name: "Customer consent completeness rate",
    theme: "customer_consent_completeness_rate",
  },
  {
    id: 417,
    industry: "financial_services",
    domain: "front_office",
    name: "Relationship deepening rate",
    theme: "relationship_deepening_rate",
  },
  {
    id: 418,
    industry: "financial_services",
    domain: "front_office",
    name: "Digital servicing deflection rate",
    theme: "digital_servicing_deflection_rate",
  },
  {
    id: 419,
    industry: "financial_services",
    domain: "front_office",
    name: "Branch appointment conversion rate",
    theme: "branch_appointment_conversion_rate",
  },
  {
    id: 420,
    industry: "financial_services",
    domain: "front_office",
    name: "Call authentication friction rate",
    theme: "call_authentication_friction_rate",
  },
  {
    id: 421,
    industry: "financial_services",
    domain: "front_office",
    name: "Card dispute digital submission rate",
    theme: "card_dispute_digital_submission_rate",
  },
  {
    id: 422,
    industry: "financial_services",
    domain: "front_office",
    name: "Payment exception customer impact rate",
    theme: "payment_exception_customer_impact_rate",
  },
  {
    id: 423,
    industry: "financial_services",
    domain: "front_office",
    name: "Commercial treasury onboarding cycle time",
    theme: "commercial_treasury_onboarding_cycle_time",
  },
  {
    id: 424,
    industry: "financial_services",
    domain: "front_office",
    name: "Small business loan application completion rate",
    theme: "small_business_loan_application_completion_rate",
  },
  {
    id: 425,
    industry: "financial_services",
    domain: "front_office",
    name: "Mortgage application document completeness",
    theme: "mortgage_application_document_completeness",
  },
  {
    id: 426,
    industry: "financial_services",
    domain: "front_office",
    name: "Wealth advice adoption rate",
    theme: "wealth_advice_adoption_rate",
  },
  {
    id: 427,
    industry: "financial_services",
    domain: "front_office",
    name: "Customer data freshness rate",
    theme: "customer_data_freshness_rate",
  },
  {
    id: 428,
    industry: "financial_services",
    domain: "front_office",
    name: "Household identity match rate",
    theme: "household_identity_match_rate",
  },
  {
    id: 429,
    industry: "financial_services",
    domain: "front_office",
    name: "Marketing suppression accuracy",
    theme: "marketing_suppression_accuracy",
  },
  {
    id: 430,
    industry: "financial_services",
    domain: "front_office",
    name: "Cross-sell eligibility precision",
    theme: "cross_sell_eligibility_precision",
  },
  {
    id: 431,
    industry: "financial_services",
    domain: "front_office",
    name: "Digital session task completion rate",
    theme: "digital_session_task_completion_rate",
  },
  {
    id: 432,
    industry: "financial_services",
    domain: "front_office",
    name: "Customer vulnerability flag accuracy",
    theme: "customer_vulnerability_flag_accuracy",
  },
  {
    id: 433,
    industry: "financial_services",
    domain: "middle_office",
    name: "Fraud model recall rate",
    theme: "fraud_model_recall_rate",
  },
  {
    id: 434,
    industry: "financial_services",
    domain: "middle_office",
    name: "Fraud investigation cycle time",
    theme: "fraud_investigation_cycle_time",
  },
  {
    id: 435,
    industry: "financial_services",
    domain: "middle_office",
    name: "False decline rate",
    theme: "false_decline_rate",
  },
  {
    id: 436,
    industry: "financial_services",
    domain: "middle_office",
    name: "AML alert false positive rate",
    theme: "aml_alert_false_positive_rate",
  },
  {
    id: 437,
    industry: "financial_services",
    domain: "middle_office",
    name: "AML case aging days",
    theme: "aml_case_aging_days",
  },
  {
    id: 438,
    industry: "financial_services",
    domain: "middle_office",
    name: "KYC refresh overdue rate",
    theme: "kyc_refresh_overdue_rate",
  },
  {
    id: 439,
    industry: "financial_services",
    domain: "middle_office",
    name: "Sanctions screening hit resolution time",
    theme: "sanctions_screening_hit_resolution_time",
  },
  {
    id: 440,
    industry: "financial_services",
    domain: "middle_office",
    name: "Credit exception rate",
    theme: "credit_exception_rate",
  },
  {
    id: 441,
    industry: "financial_services",
    domain: "middle_office",
    name: "Loan document defect rate",
    theme: "loan_document_defect_rate",
  },
  {
    id: 442,
    industry: "financial_services",
    domain: "middle_office",
    name: "Loan funding cycle time",
    theme: "loan_funding_cycle_time",
  },
  {
    id: 443,
    industry: "financial_services",
    domain: "middle_office",
    name: "Commercial credit memo rework rate",
    theme: "commercial_credit_memo_rework_rate",
  },
  {
    id: 444,
    industry: "financial_services",
    domain: "middle_office",
    name: "Collateral valuation cycle time",
    theme: "collateral_valuation_cycle_time",
  },
  {
    id: 445,
    industry: "financial_services",
    domain: "middle_office",
    name: "Portfolio early-warning coverage",
    theme: "portfolio_early_warning_coverage",
  },
  {
    id: 446,
    industry: "financial_services",
    domain: "middle_office",
    name: "Collections promise-to-pay kept rate",
    theme: "collections_promise_to_pay_kept_rate",
  },
  {
    id: 447,
    industry: "financial_services",
    domain: "middle_office",
    name: "Payment straight-through processing rate",
    theme: "payment_straight_through_processing_rate",
  },
  {
    id: 448,
    industry: "financial_services",
    domain: "middle_office",
    name: "ACH return rate",
    theme: "ach_return_rate",
  },
  {
    id: 449,
    industry: "financial_services",
    domain: "middle_office",
    name: "Wire repair rate",
    theme: "wire_repair_rate",
  },
  {
    id: 450,
    industry: "financial_services",
    domain: "middle_office",
    name: "Dispute chargeback win rate",
    theme: "dispute_chargeback_win_rate",
  },
  {
    id: 451,
    industry: "financial_services",
    domain: "middle_office",
    name: "Treasury implementation defect rate",
    theme: "treasury_implementation_defect_rate",
  },
  {
    id: 452,
    industry: "financial_services",
    domain: "middle_office",
    name: "Regulatory change impact assessment cycle time",
    theme: "regulatory_change_impact_assessment_cycle_time",
  },
  {
    id: 453,
    industry: "financial_services",
    domain: "middle_office",
    name: "Control testing defect rate",
    theme: "control_testing_defect_rate",
  },
  {
    id: 454,
    industry: "financial_services",
    domain: "middle_office",
    name: "Issue remediation aging days",
    theme: "issue_remediation_aging_days",
  },
  {
    id: 455,
    industry: "financial_services",
    domain: "middle_office",
    name: "Operational loss event rate",
    theme: "operational_loss_event_rate",
  },
  {
    id: 456,
    industry: "financial_services",
    domain: "middle_office",
    name: "Third-party risk review cycle time",
    theme: "third_party_risk_review_cycle_time",
  },
  {
    id: 457,
    industry: "financial_services",
    domain: "middle_office",
    name: "Data quality exception rate in risk models",
    theme: "data_quality_exception_rate_in_risk_models",
  },
  {
    id: 458,
    industry: "financial_services",
    domain: "middle_office",
    name: "Data lineage coverage for risk reports",
    theme: "data_lineage_coverage_for_risk_reports",
  },
  {
    id: 459,
    industry: "financial_services",
    domain: "back_office",
    name: "Regulatory reporting cycle days",
    theme: "regulatory_reporting_cycle_days",
  },
  {
    id: 460,
    industry: "financial_services",
    domain: "back_office",
    name: "Regulatory report adjustment rate",
    theme: "regulatory_report_adjustment_rate",
  },
  {
    id: 461,
    industry: "financial_services",
    domain: "back_office",
    name: "Financial close cycle days",
    theme: "financial_close_cycle_days",
  },
  {
    id: 462,
    industry: "financial_services",
    domain: "back_office",
    name: "Liquidity forecast accuracy",
    theme: "liquidity_forecast_accuracy",
  },
  {
    id: 463,
    industry: "financial_services",
    domain: "back_office",
    name: "Capital forecast variance",
    theme: "capital_forecast_variance",
  },
  {
    id: 464,
    industry: "financial_services",
    domain: "back_office",
    name: "Stress testing scenario cycle time",
    theme: "stress_testing_scenario_cycle_time",
  },
  {
    id: 465,
    industry: "financial_services",
    domain: "back_office",
    name: "Model inventory completeness",
    theme: "model_inventory_completeness",
  },
  {
    id: 466,
    industry: "financial_services",
    domain: "back_office",
    name: "Model monitoring exception aging",
    theme: "model_monitoring_exception_aging",
  },
  {
    id: 467,
    industry: "financial_services",
    domain: "back_office",
    name: "AI use case risk-tiering completeness",
    theme: "ai_use_case_risk_tiering_completeness",
  },
  {
    id: 468,
    industry: "financial_services",
    domain: "back_office",
    name: "Audit finding remediation cycle time",
    theme: "audit_finding_remediation_cycle_time",
  },
  {
    id: 469,
    industry: "financial_services",
    domain: "back_office",
    name: "Policy attestation completion rate",
    theme: "policy_attestation_completion_rate",
  },
  {
    id: 470,
    industry: "financial_services",
    domain: "back_office",
    name: "Access recertification completion rate",
    theme: "access_recertification_completion_rate",
  },
  {
    id: 471,
    industry: "financial_services",
    domain: "back_office",
    name: "Cloud cost variance for analytics workloads",
    theme: "cloud_cost_variance_for_analytics_workloads",
  },
  {
    id: 472,
    industry: "financial_services",
    domain: "back_office",
    name: "Data product adoption rate in risk and finance",
    theme: "data_product_adoption_rate_in_risk_and_finance",
  },
  {
    id: 473,
    industry: "financial_services",
    domain: "back_office",
    name: "Certified report usage rate",
    theme: "certified_report_usage_rate",
  },
  {
    id: 474,
    industry: "financial_services",
    domain: "back_office",
    name: "Report duplication rate",
    theme: "report_duplication_rate",
  },
  {
    id: 475,
    industry: "financial_services",
    domain: "back_office",
    name: "Enterprise data catalog coverage",
    theme: "enterprise_data_catalog_coverage",
  },
  {
    id: 476,
    industry: "financial_services",
    domain: "back_office",
    name: "Semantic layer coverage for finance metrics",
    theme: "semantic_layer_coverage_for_finance_metrics",
  },
  {
    id: 477,
    industry: "financial_services",
    domain: "back_office",
    name: "Payments platform incident rate",
    theme: "payments_platform_incident_rate",
  },
  {
    id: 478,
    industry: "financial_services",
    domain: "back_office",
    name: "Core banking integration failure rate",
    theme: "core_banking_integration_failure_rate",
  },
  {
    id: 479,
    industry: "financial_services",
    domain: "back_office",
    name: "Batch processing SLA attainment",
    theme: "batch_processing_sla_attainment",
  },
  {
    id: 480,
    industry: "financial_services",
    domain: "back_office",
    name: "Data retention policy coverage",
    theme: "data_retention_policy_coverage",
  },
  {
    id: 481,
    industry: "financial_services",
    domain: "back_office",
    name: "Privacy request fulfillment cycle time",
    theme: "privacy_request_fulfillment_cycle_time",
  },
  {
    id: 482,
    industry: "financial_services",
    domain: "back_office",
    name: "Vendor concentration exposure visibility",
    theme: "vendor_concentration_exposure_visibility",
  },
  {
    id: 483,
    industry: "financial_services",
    domain: "back_office",
    name: "Contract renewal lead time",
    theme: "contract_renewal_lead_time",
  },
  {
    id: 484,
    industry: "financial_services",
    domain: "back_office",
    name: "Procurement savings realization rate",
    theme: "procurement_savings_realization_rate",
  },
  {
    id: 485,
    industry: "financial_services",
    domain: "back_office",
    name: "Business continuity test pass rate",
    theme: "business_continuity_test_pass_rate",
  },
  {
    id: 486,
    industry: "financial_services",
    domain: "back_office",
    name: "Cyber control evidence freshness",
    theme: "cyber_control_evidence_freshness",
  },
] as const;

function normalizeAliasStem(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/s+/g, " ")
    .trim();
}

function industryLabel(industry: MetricIndustry): string {
  if (industry === "specialty_retail") return "Specialty retail";
  if (industry === "healthcare_idn") return "Healthcare IDN";
  return "Financial services";
}

function domainLabel(domain: MetricDomain): string {
  if (domain === "front_office")
    return "front-office growth, access, experience, and adoption workflows";
  if (domain === "middle_office")
    return "middle-office operating, risk, clinical, supply, and fulfillment workflows";
  return "back-office finance, data, control, technology, and governance workflows";
}

function domainOutcome(domain: MetricDomain): string {
  if (domain === "front_office")
    return "customer, patient, advisor, or stakeholder experience into measurable demand and adoption";
  if (domain === "middle_office")
    return "operating execution, throughput, quality, risk, and exception handling";
  return "enterprise control, financial discipline, data trust, compliance, and technology resilience";
}

function isLowerBetter(name: string): boolean {
  return /abandonment|cycle|days|time|rate as percent|shrink|stock-out|defect|exception|variance|aging|downtime|burden|vacancy|dependency|failure|incident|loss|overdue|false positive|false decline|finding|remediation|leakage|rework|repair|return rate|cost|opt-out|duplicate/.test(
    name.toLowerCase(),
  );
}

function rangeUnit(name: string): string {
  const lower = name.toLowerCase();
  if (
    /days|cycle|lead|aging|turnaround|response time|minutes|downtime|burden/.test(
      lower,
    )
  )
    return lower.includes("minutes") ? "minutes" : "days";
  if (/aov|value|revenue|cost|savings/.test(lower)) return "indexed score";
  if (/count/.test(lower)) return "count";
  return "%";
}

function defaultRanges(name: string): {
  northStarRange: MetricRange;
  leaderBenchmark: MetricRange;
  commonFloor: MetricRange;
} {
  const unit = rangeUnit(name);
  const lowerBetter = isLowerBetter(name);
  if (unit === "days") {
    return lowerBetter
      ? {
          northStarRange: range(1, 3, unit, "North-star operating cycle"),
          leaderBenchmark: range(3, 7, unit, "Top-quartile peer cycle"),
          commonFloor: range(10, 30, unit, "Fragmented or manual cycle"),
        }
      : {
          northStarRange: range(85, 95, "%", "North-star attainment"),
          leaderBenchmark: range(70, 85, "%", "Top-quartile attainment"),
          commonFloor: range(30, 60, "%", "Common fragmented baseline"),
        };
  }
  if (unit === "minutes") {
    return {
      northStarRange: range(5, 15, unit, "North-star workflow burden"),
      leaderBenchmark: range(15, 30, unit, "Top-quartile workflow burden"),
      commonFloor: range(35, 90, unit, "Fragmented or manual workflow burden"),
    };
  }
  if (unit === "indexed score") {
    return lowerBetter
      ? {
          northStarRange: range(0, 5, "% variance", "North-star variance"),
          leaderBenchmark: range(5, 10, "% variance", "Top-quartile variance"),
          commonFloor: range(
            15,
            35,
            "% variance",
            "Unexplained or unmanaged variance",
          ),
        }
      : {
          northStarRange: range(
            80,
            95,
            "index",
            "North-star indexed performance",
          ),
          leaderBenchmark: range(
            65,
            80,
            "index",
            "Top-quartile indexed performance",
          ),
          commonFloor: range(25, 55, "index", "Common fragmented baseline"),
        };
  }
  return lowerBetter
    ? {
        northStarRange: range(0, 5, unit, "North-star defect or drag rate"),
        leaderBenchmark: range(5, 12, unit, "Top-quartile defect or drag rate"),
        commonFloor: range(15, 35, unit, "Common fragmented baseline"),
      }
    : {
        northStarRange: range(85, 95, unit, "North-star measured attainment"),
        leaderBenchmark: range(
          70,
          85,
          unit,
          "Top-quartile measured attainment",
        ),
        commonFloor: range(30, 60, unit, "Common fragmented baseline"),
      };
}

function measurementDifficultyFor(
  spec: MetricCatalogSpec,
): MetricRecord["measurementDifficulty"] {
  const lower = spec.name.toLowerCase();
  if (
    /identity|lineage|semantic|interoperability|fhir|model|attribution|journey|freshness|coverage|explainability|consent/.test(
      lower,
    )
  )
    return "high";
  if (
    spec.domain === "back_office" ||
    /accuracy|variance|forecast|risk|quality|documentation|cds|fraud|aml|kyc/.test(
      lower,
    )
  )
    return "moderate";
  return "low";
}

function failureModesFor(spec: MetricCatalogSpec): readonly number[] {
  const modes = new Set<number>([3, 9]);
  if (spec.domain === "front_office") modes.add(2);
  if (spec.domain === "middle_office") modes.add(5);
  if (spec.domain === "back_office") modes.add(6);
  if (
    /governance|risk|compliance|audit|hipaa|privacy|model|regulatory|security|access/.test(
      spec.name.toLowerCase(),
    )
  )
    modes.add(6);
  if (
    /adoption|training|workflow|clinician|physician|nurse|associate/.test(
      spec.name.toLowerCase(),
    )
  )
    modes.add(4);
  if (/pilot|model|ai|mlops/.test(spec.name.toLowerCase())) modes.add(8);
  return Array.from(modes).slice(0, 4);
}

function expectedGapClassesFor(spec: MetricCatalogSpec): readonly GapClass[] {
  if (measurementDifficultyFor(spec) === "high")
    return ["measurement_gap", "quantitative_gap", "trajectory_gap"];
  if (isLowerBetter(spec.name)) return ["quantitative_gap", "trajectory_gap"];
  return ["quantitative_gap", "measurement_gap"];
}

function vendorsFor(
  spec: MetricCatalogSpec,
): readonly MetricVendorLandscapeEntry[] {
  if (spec.industry === "healthcare_idn") {
    if (spec.domain === "front_office") {
      return [
        {
          vendorName: "Epic",
          role: "EHR, access, referral, and MyChart workflow substrate",
          caution:
            "Epic configuration and local build semantics must be validated before benchmark comparisons.",
        },
        {
          vendorName: "Salesforce Health Cloud",
          role: "Patient engagement, CRM, outreach, and access orchestration",
          caution:
            "CRM signals need clean handoff to Epic and revenue-cycle workflows.",
        },
      ];
    }
    if (spec.domain === "middle_office") {
      return [
        {
          vendorName: "Epic",
          role: "Clinical, CDI, quality, and revenue-cycle workflow system of record",
          caution:
            "Workflow metrics must separate documentation quality from downstream reimbursement effects.",
        },
        {
          vendorName: "Iodine Software",
          role: "CDI prioritization and documentation integrity support",
          caution:
            "Value depends on provider response behavior and audited defect closure.",
        },
      ];
    }
    return [
      {
        vendorName: "Epic Interconnect and FHIR APIs",
        role: "Clinical interoperability and governed data-access substrate",
        caution:
          "API availability is not the same as production-ready data product coverage.",
      },
      {
        vendorName: "Snowflake Healthcare and Life Sciences Data Cloud",
        role: "Healthcare analytics and governed data product platform",
        caution:
          "Consumption must be tied to quality, lineage, and clinical owner accountability.",
      },
    ];
  }
  if (spec.industry === "specialty_retail") {
    if (spec.domain === "front_office") {
      return [
        {
          vendorName: "Salesforce Commerce Cloud",
          role: "Commerce, journey, and customer interaction substrate",
          caution:
            "Commerce telemetry must be joined to inventory, loyalty, and margin signals.",
        },
        {
          vendorName: "Klaviyo",
          role: "Owned-channel activation, lifecycle messaging, and customer engagement",
          caution:
            "Activation lift can mask weak consent, identity, or offer governance.",
        },
      ];
    }
    if (spec.domain === "middle_office") {
      return [
        {
          vendorName: "Blue Yonder",
          role: "Demand planning, replenishment, and allocation optimization",
          caution:
            "Planning algorithms expose SKU, store, and promotion master-data defects.",
        },
        {
          vendorName: "RELEX Solutions",
          role: "Retail planning, forecast, and supply-chain execution support",
          caution:
            "Operational adoption matters as much as forecast precision.",
        },
      ];
    }
    return [
      {
        vendorName: "SAP S/4HANA Retail",
        role: "ERP, finance, inventory, and master-data system of record",
        caution:
          "Transformation value depends on governed process and master-data discipline.",
      },
      {
        vendorName: "Snowflake",
        role: "Retail analytics, semantic layer, and governed data product substrate",
        caution: "Warehouse usage alone is not evidence of decision adoption.",
      },
    ];
  }
  if (spec.domain === "front_office") {
    return [
      {
        vendorName: "Temenos",
        role: "Digital banking and customer journey modernization substrate",
        caution:
          "Journey metrics need product, risk, and servicing-state context.",
      },
      {
        vendorName: "Salesforce Financial Services Cloud",
        role: "Relationship, servicing, and offer orchestration platform",
        caution:
          "CRM adoption must be tied to household identity and control evidence.",
      },
    ];
  }
  if (spec.domain === "middle_office") {
    return [
      {
        vendorName: "FICO",
        role: "Decisioning, fraud, credit, and risk scoring platform",
        caution:
          "Model lift must be governed against false positives, fairness, and operational queues.",
      },
      {
        vendorName: "NICE Actimize",
        role: "AML, fraud, surveillance, and case-management platform",
        caution:
          "Alert quality and investigator capacity determine realized value.",
      },
    ];
  }
  return [
    {
      vendorName: "ServiceNow",
      role: "Control, issue, workflow, and evidence orchestration",
      caution:
        "Workflow tooling cannot compensate for unclear control ownership.",
    },
    {
      vendorName: "Databricks",
      role: "Lakehouse, AI, model, and risk analytics platform",
      caution:
        "Model and data product governance must be built into production paths.",
    },
  ];
}

function foundationFor(spec: MetricCatalogSpec): MetricFoundationRequirements {
  const label = industryLabel(spec.industry).toLowerCase();
  const metricName = spec.name.toLowerCase();
  return {
    data:
      label +
      " source-system events, workflow timestamps, master data, and outcome records at the grain required to measure " +
      metricName +
      ".",
    identity:
      "Canonical identifiers for customers, patients, accounts, products, providers, employees, vendors, systems, and operating units relevant to the metric.",
    operations:
      "Named operating owner, review cadence, exception taxonomy, and corrective-action workflow connected to the metric movement.",
    governance:
      "Metric definition, numerator, denominator, source lineage, privacy/control constraints, and benchmark cohort approved before agent recommendations use the metric as evidence.",
  };
}

function buildAdditionalMetricRecord(spec: MetricCatalogSpec): MetricRecord {
  const id = ("PAT-MET-" +
    String(spec.id).padStart(3, "0")) as MetricRecord["id"];
  const aliasStem = normalizeAliasStem(spec.name);
  const ranges = defaultRanges(spec.name);
  const modes = failureModesFor(spec);
  return metric({
    id,
    name: spec.name,
    aliases: [aliasStem, aliasStem + " metric", aliasStem + " benchmark"],
    industries: [spec.industry],
    domain: spec.domain,
    theme: spec.theme,
    priorityTier: "tier_1",
    definition:
      spec.name +
      " measures how reliably " +
      industryLabel(spec.industry).toLowerCase() +
      " " +
      domainLabel(spec.domain) +
      " convert operational signal into a traceable performance outcome.",
    whyItMatters:
      "This metric turns " +
      domainOutcome(spec.domain) +
      " into an evidence-backed gap signal that Nexus, Sentinel, Atlas, and Steward can connect to program design, sourcing choices, controls, and value realization.",
    cohort:
      industryLabel(spec.industry) +
      " enterprise transformation programs using private tenant metrics and AbarVa benchmark context.",
    northStarRange: ranges.northStarRange,
    leaderBenchmark: ranges.leaderBenchmark,
    commonFloor: ranges.commonFloor,
    trajectorySignal:
      "Leaders improve when ownership, source-system lineage, and operating rituals are designed with the program; laggards only report the metric after implementation and cannot explain variance.",
    measurementDifficulty: measurementDifficultyFor(spec),
    foundationRequirements: foundationFor(spec),
    vendorLandscape: vendorsFor(spec),
    expectedGapClasses: expectedGapClassesFor(spec),
    failureModeIds: modes,
    patternRefs: modes.map((mode) => "PAT-FM-" + String(mode).padStart(3, "0")),
    refreshCadence: "quarterly",
  });
}

const ADDITIONAL_TIER1_METRIC_RECORDS = ADDITIONAL_TIER1_METRIC_SPECS.map(
  buildAdditionalMetricRecord,
);

export const METRIC_RECORDS: readonly MetricRecord[] = [
  ...FOUNDATION_METRIC_RECORDS,
  ...ADDITIONAL_TIER1_METRIC_RECORDS,
] as const;

export function getMetricRecordById(id: string): MetricRecord | null {
  return METRIC_RECORDS.find((record) => record.id === id) ?? null;
}

export function getMetricRecordsByIndustryDomain(
  industry: MetricIndustry,
  domain: MetricDomain,
): readonly MetricRecord[] {
  return METRIC_RECORDS.filter(
    (record) =>
      record.industries.includes(industry) && record.domain === domain,
  );
}

export function getTier1MetricRecords(): readonly MetricRecord[] {
  return METRIC_RECORDS.filter((record) => record.priorityTier === "tier_1");
}

export function summarizeMetricCoverage(
  records: readonly MetricRecord[] = METRIC_RECORDS,
): {
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
    verifiedOrLocked: records.filter(
      (record) => record.maturityStatus !== "draft",
    ).length,
  };
}

export function validateMetricRecords(
  records: readonly MetricRecord[] = METRIC_RECORDS,
): void {
  const ids = new Set<string>();
  const namesByIndustry = new Set<string>();

  for (const record of records) {
    if (ids.has(record.id))
      throw new Error(`Duplicate metric record id: ${record.id}`);
    ids.add(record.id);

    const normalizedName = record.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
    for (const industry of record.industries) {
      const normalizedNameKey = `${industry}:${normalizedName}`;
      if (namesByIndustry.has(normalizedNameKey))
        throw new Error(
          `Duplicate metric record name for ${industry}: ${record.name}`,
        );
      namesByIndustry.add(normalizedNameKey);
    }

    if (!/^PAT-MET-\d{3}$/.test(record.id))
      throw new Error(`Invalid metric id: ${record.id}`);
    const numericId = Number(record.id.replace("PAT-MET-", ""));
    for (const industry of record.industries) {
      if (
        industry === "specialty_retail" &&
        (numericId < 1 || numericId > 200)
      ) {
        throw new Error(`${record.id} violates specialty retail id block`);
      }
      if (
        industry === "healthcare_idn" &&
        (numericId < 201 || numericId > 400)
      ) {
        throw new Error(`${record.id} violates healthcare id block`);
      }
      if (
        industry === "financial_services" &&
        (numericId < 401 || numericId > 600)
      ) {
        throw new Error(`${record.id} violates financial services id block`);
      }
    }

    if (record.aliases.length < 2)
      throw new Error(`${record.id} needs at least two aliases`);
    if (!record.definition || !record.whyItMatters || !record.cohort) {
      throw new Error(
        `${record.id} is missing definition, rationale, or cohort`,
      );
    }
    if (record.sourceBasis.length < 2)
      throw new Error(`${record.id} needs source basis`);
    if (record.failureModeIds.length === 0)
      throw new Error(`${record.id} needs failure mode links`);
    if (record.patternRefs.length === 0)
      throw new Error(`${record.id} needs pattern refs`);
    if (record.northStarRange.low > record.northStarRange.high) {
      throw new Error(`${record.id} has invalid north-star range`);
    }
  }
}
