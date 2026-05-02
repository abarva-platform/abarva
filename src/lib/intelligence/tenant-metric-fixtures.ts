import {
  getMetricRecordById,
  type MetricIndustry,
  type MetricRecord,
} from "./metric-records";

export type TenantMetricSource =
  | "demo_fixture"
  | "setup_upload"
  | "private_data_plane";
export type TenantMetricMeasurementStatus =
  | "measured"
  | "measurement_gap"
  | "stale";
export type MetricDirection = "higher_is_better" | "lower_is_better";
export type TenantMetricGapClass =
  | "at_or_near_target"
  | "watch"
  | "material_gap"
  | "measurement_gap";

export interface TenantMetricObservation {
  id: string;
  tenantKey: string;
  clientId: string;
  metricId: MetricRecord["id"];
  metricName: string;
  industry: MetricIndustry;
  currentValue: number | null;
  unit: string;
  asOf: string;
  source: TenantMetricSource;
  sourceDetail: string;
  measurementStatus: TenantMetricMeasurementStatus;
  direction: MetricDirection;
  confidence: number;
  ownerRole: string;
  notes: string;
  programIds?: readonly string[];
  sourceEventIds?: readonly string[];
}

export interface TenantMetricGapView {
  observation: TenantMetricObservation;
  metricRecord: MetricRecord;
  gapClass: TenantMetricGapClass;
  gapSeverity: number;
  gapNarrative: string;
}

export interface TenantMetricReadinessSummary {
  tenantKey: string;
  total: number;
  measured: number;
  measurementGaps: number;
  stale: number;
  averageConfidence: number;
  industries: readonly MetricIndustry[];
  programIds: readonly string[];
}

const DEMO_AS_OF = "2026-04-30";

const TENANT_METRIC_OBSERVATIONS: readonly TenantMetricObservation[] = [
  {
    id: "tm-apex-001",
    tenantKey: "apex-retail",
    clientId: "apex-retail-group",
    metricId: "PAT-MET-001",
    metricName: "Customer identity match rate",
    industry: "specialty_retail",
    currentValue: 78,
    unit: "%",
    asOf: DEMO_AS_OF,
    source: "demo_fixture",
    sourceDetail:
      "Apex CDP profile quality extract; duplicate profile rate converted into resolved-interaction proxy.",
    measurementStatus: "measured",
    direction: "higher_is_better",
    confidence: 0.74,
    ownerRole: "Director, Enterprise Data Products",
    notes:
      "Useful for customer 360 and personalization readiness, but needs POS/ecommerce survivorship validation.",
    programIds: ["apex-customer-inventory-ai-modernization"],
  },
  {
    id: "tm-apex-002",
    tenantKey: "apex-retail",
    clientId: "apex-retail-group",
    metricId: "PAT-MET-002",
    metricName: "First-party data addressability",
    industry: "specialty_retail",
    currentValue: 52,
    unit: "%",
    asOf: DEMO_AS_OF,
    source: "demo_fixture",
    sourceDetail:
      "Loyalty active-member and owned-channel eligibility snapshot.",
    measurementStatus: "measured",
    direction: "higher_is_better",
    confidence: 0.72,
    ownerRole: "VP Loyalty and CRM",
    notes:
      "Addressability is below leader range, which constrains agentic campaign and service use cases.",
    programIds: ["apex-customer-inventory-ai-modernization"],
  },
  {
    id: "tm-apex-003",
    tenantKey: "apex-retail",
    clientId: "apex-retail-group",
    metricId: "PAT-MET-003",
    metricName: "Forecast accuracy at SKU-week",
    industry: "specialty_retail",
    currentValue: 61,
    unit: "%",
    asOf: DEMO_AS_OF,
    source: "demo_fixture",
    sourceDetail: "Apex retail benchmark pack demand forecast accuracy.",
    measurementStatus: "measured",
    direction: "higher_is_better",
    confidence: 0.84,
    ownerRole: "SVP Supply Chain",
    notes:
      "Major gap versus north-star; this is a primary value anchor for planning, markdown, and replenishment AI.",
    programIds: ["apex-customer-inventory-ai-modernization"],
  },
  {
    id: "tm-apex-004",
    tenantKey: "apex-retail",
    clientId: "apex-retail-group",
    metricId: "PAT-MET-004",
    metricName: "On-shelf availability at SKU-store-day",
    industry: "specialty_retail",
    currentValue: 86,
    unit: "%",
    asOf: DEMO_AS_OF,
    source: "demo_fixture",
    sourceDetail:
      "Stock-out rate and store inventory visibility demo benchmarks converted to availability proxy.",
    measurementStatus: "measured",
    direction: "higher_is_better",
    confidence: 0.66,
    ownerRole: "VP Store Operations",
    notes:
      "Proxy should be replaced by SKU-store-day shelf signal once setup uploads planogram and inventory observations.",
    programIds: ["apex-customer-inventory-ai-modernization"],
  },
  {
    id: "tm-apex-005",
    tenantKey: "apex-retail",
    clientId: "apex-retail-group",
    metricId: "PAT-MET-005",
    metricName: "Finance close cycle days",
    industry: "specialty_retail",
    currentValue: 12,
    unit: "business days",
    asOf: DEMO_AS_OF,
    source: "demo_fixture",
    sourceDetail: "Finance transformation workshop current-state estimate.",
    measurementStatus: "measured",
    direction: "lower_is_better",
    confidence: 0.68,
    ownerRole: "Corporate Controller",
    notes:
      "Close cycle limits how quickly margin and inventory actions can be governed after launch.",
    programIds: ["apex-customer-inventory-ai-modernization"],
  },
  {
    id: "tm-apex-006",
    tenantKey: "apex-retail",
    clientId: "apex-retail-group",
    metricId: "PAT-MET-006",
    metricName: "Enterprise data product adoption rate",
    industry: "specialty_retail",
    currentValue: 31,
    unit: "%",
    asOf: DEMO_AS_OF,
    source: "demo_fixture",
    sourceDetail:
      "Certified report usage and analytics access telemetry demo extract.",
    measurementStatus: "measured",
    direction: "higher_is_better",
    confidence: 0.71,
    ownerRole: "Director, Enterprise Data Products",
    notes:
      "Low adoption suggests agents must push governed decision products, not only dashboards.",
    programIds: ["apex-customer-inventory-ai-modernization"],
  },
  {
    id: "tm-apex-007",
    tenantKey: "apex-retail",
    clientId: "apex-retail-group",
    metricId: "PAT-MET-009",
    metricName: "Cart abandonment rate",
    industry: "specialty_retail",
    currentValue: 74,
    unit: "%",
    asOf: DEMO_AS_OF,
    source: "demo_fixture",
    sourceDetail: "Commerce funnel benchmark pack.",
    measurementStatus: "measured",
    direction: "lower_is_better",
    confidence: 0.79,
    ownerRole: "Director, Digital Product Delivery",
    notes:
      "Evidence for checkout, inventory promise, payments, and offer personalization workstreams.",
    programIds: ["apex-customer-inventory-ai-modernization"],
  },
  {
    id: "tm-apex-008",
    tenantKey: "apex-retail",
    clientId: "apex-retail-group",
    metricId: "PAT-MET-034",
    metricName: "Inventory turnover",
    industry: "specialty_retail",
    currentValue: 4.1,
    unit: "turns",
    asOf: DEMO_AS_OF,
    source: "demo_fixture",
    sourceDetail: "Apex merchandise planning benchmark pack.",
    measurementStatus: "measured",
    direction: "higher_is_better",
    confidence: 0.82,
    ownerRole: "SVP Merchandising",
    notes:
      "Connects forecast accuracy to working capital and markdown value realization.",
    programIds: ["apex-customer-inventory-ai-modernization"],
  },
  {
    id: "tm-apex-009",
    tenantKey: "apex-retail",
    clientId: "apex-retail-group",
    metricId: "PAT-MET-049",
    metricName: "Shrink rate",
    industry: "specialty_retail",
    currentValue: 2.9,
    unit: "%",
    asOf: DEMO_AS_OF,
    source: "demo_fixture",
    sourceDetail: "Store operations shrink benchmark pack.",
    measurementStatus: "measured",
    direction: "lower_is_better",
    confidence: 0.76,
    ownerRole: "VP Store Operations",
    notes:
      "Separates AI inventory fixes from loss-prevention and self-checkout control gaps.",
    programIds: ["apex-customer-inventory-ai-modernization"],
  },
  {
    id: "tm-apex-010",
    tenantKey: "apex-retail",
    clientId: "apex-retail-group",
    metricId: "PAT-MET-063",
    metricName: "IT spend as percent of revenue",
    industry: "specialty_retail",
    currentValue: 2.1,
    unit: "%",
    asOf: DEMO_AS_OF,
    source: "demo_fixture",
    sourceDetail: "Technology benchmark pack.",
    measurementStatus: "measured",
    direction: "lower_is_better",
    confidence: 0.65,
    ownerRole: "CIO",
    notes:
      "Needs interpretation with digital revenue mix; too low may indicate underinvestment rather than efficiency.",
    programIds: ["apex-customer-inventory-ai-modernization"],
  },
  {
    id: "tm-apex-011",
    tenantKey: "apex-retail",
    clientId: "apex-retail-group",
    metricId: "PAT-MET-081",
    metricName: "AI model production count",
    industry: "specialty_retail",
    currentValue: 3,
    unit: "count",
    asOf: DEMO_AS_OF,
    source: "demo_fixture",
    sourceDetail: "Technology operating review.",
    measurementStatus: "measured",
    direction: "higher_is_better",
    confidence: 0.7,
    ownerRole: "VP Data and Analytics",
    notes:
      "Current model count is less important than whether each model maps to inventory, loyalty, or margin KPIs.",
    programIds: ["apex-customer-inventory-ai-modernization"],
  },
  {
    id: "tm-apex-012",
    tenantKey: "apex-retail",
    clientId: "apex-retail-group",
    metricId: "PAT-MET-045",
    metricName: "Demand sensing signal freshness",
    industry: "specialty_retail",
    currentValue: null,
    unit: "hours",
    asOf: DEMO_AS_OF,
    source: "demo_fixture",
    sourceDetail: "Missing from current Apex benchmark pack.",
    measurementStatus: "measurement_gap",
    direction: "lower_is_better",
    confidence: 0.3,
    ownerRole: "SVP Supply Chain",
    notes:
      "Setup should request POS, inventory, promotion, weather/event, and returns freshness extracts.",
    programIds: ["apex-customer-inventory-ai-modernization"],
  },
  {
    id: "tm-meridian-001",
    tenantKey: "meridian-health",
    clientId: "meridian-health-system",
    metricId: "PAT-MET-201",
    metricName: "Prior authorization turnaround time",
    industry: "healthcare_idn",
    currentValue: 8,
    unit: "business days",
    asOf: DEMO_AS_OF,
    source: "demo_fixture",
    sourceDetail:
      "Meridian access workshop current-state estimate from auth workqueue review.",
    measurementStatus: "measured",
    direction: "lower_is_better",
    confidence: 0.73,
    ownerRole: "Director, Revenue Cycle Innovation",
    notes:
      "Strong candidate for agentic workflow triage because delay links patient access, payer rules, documentation, and denials.",
    programIds: ["meridian-healthcare-data-analytics-modernization"],
  },
  {
    id: "tm-meridian-002",
    tenantKey: "meridian-health",
    clientId: "meridian-health-system",
    metricId: "PAT-MET-202",
    metricName: "Patient access abandonment rate",
    industry: "healthcare_idn",
    currentValue: 38,
    unit: "%",
    asOf: DEMO_AS_OF,
    source: "demo_fixture",
    sourceDetail: "Digital front-door and call-center funnel demo extract.",
    measurementStatus: "measured",
    direction: "lower_is_better",
    confidence: 0.69,
    ownerRole: "VP Patient Access",
    notes:
      "Use to steer strategy away from chatbot-first answers and toward template/referral/routing fixes.",
    programIds: ["meridian-healthcare-data-analytics-modernization"],
  },
  {
    id: "tm-meridian-003",
    tenantKey: "meridian-health",
    clientId: "meridian-health-system",
    metricId: "PAT-MET-203",
    metricName: "Coding accuracy rate",
    industry: "healthcare_idn",
    currentValue: 87,
    unit: "%",
    asOf: DEMO_AS_OF,
    source: "demo_fixture",
    sourceDetail: "CDI/coding audit sample baseline.",
    measurementStatus: "measured",
    direction: "higher_is_better",
    confidence: 0.75,
    ownerRole: "Director, HIM and CDI",
    notes:
      "Links clinical documentation AI to denial prevention, compliance, reimbursement, and value-based reporting.",
    programIds: ["meridian-healthcare-data-analytics-modernization"],
  },
  {
    id: "tm-meridian-004",
    tenantKey: "meridian-health",
    clientId: "meridian-health-system",
    metricId: "PAT-MET-204",
    metricName: "Clinical decision support acceptance rate",
    industry: "healthcare_idn",
    currentValue: 11,
    unit: "%",
    asOf: DEMO_AS_OF,
    source: "demo_fixture",
    sourceDetail: "Epic BPA action and override sample.",
    measurementStatus: "measured",
    direction: "higher_is_better",
    confidence: 0.7,
    ownerRole: "Chief Medical Informatics Officer",
    notes:
      "Warns agents that clinical AI adoption requires alert lifecycle governance and clinician trust.",
    programIds: ["meridian-healthcare-data-analytics-modernization"],
  },
  {
    id: "tm-meridian-005",
    tenantKey: "meridian-health",
    clientId: "meridian-health-system",
    metricId: "PAT-MET-205",
    metricName: "Initial claims denial rate",
    industry: "healthcare_idn",
    currentValue: 17,
    unit: "%",
    asOf: DEMO_AS_OF,
    source: "demo_fixture",
    sourceDetail: "RCM denial benchmark pack.",
    measurementStatus: "measured",
    direction: "lower_is_better",
    confidence: 0.8,
    ownerRole: "VP Revenue Cycle",
    notes:
      "A core value-realization KPI for prior auth, coding, eligibility, and payer contract modernization.",
    programIds: ["meridian-healthcare-data-analytics-modernization"],
  },
  {
    id: "tm-meridian-006",
    tenantKey: "meridian-health",
    clientId: "meridian-health-system",
    metricId: "PAT-MET-206",
    metricName: "Interoperability coverage for priority data elements",
    industry: "healthcare_idn",
    currentValue: 54,
    unit: "%",
    asOf: DEMO_AS_OF,
    source: "demo_fixture",
    sourceDetail:
      "Priority data element coverage estimate across Epic, RCM, quality, and analytics marts.",
    measurementStatus: "measured",
    direction: "higher_is_better",
    confidence: 0.62,
    ownerRole: "VP Data and Analytics",
    notes:
      "Frames the Epic modernization as a data-product and interoperability problem, not only an EHR reporting project.",
    programIds: ["meridian-healthcare-data-analytics-modernization"],
  },
  {
    id: "tm-meridian-007",
    tenantKey: "meridian-health",
    clientId: "meridian-health-system",
    metricId: "PAT-MET-208",
    metricName: "Third-next-available appointment days",
    industry: "healthcare_idn",
    currentValue: 42,
    unit: "days",
    asOf: DEMO_AS_OF,
    source: "demo_fixture",
    sourceDetail: "Ambulatory access benchmark sample.",
    measurementStatus: "measured",
    direction: "lower_is_better",
    confidence: 0.72,
    ownerRole: "COO Ambulatory Operations",
    notes:
      "Directly connects AI strategy to access capacity and care delivery impact.",
    programIds: ["meridian-healthcare-data-analytics-modernization"],
  },
  {
    id: "tm-meridian-008",
    tenantKey: "meridian-health",
    clientId: "meridian-health-system",
    metricId: "PAT-MET-212",
    metricName: "MyChart active patient rate",
    industry: "healthcare_idn",
    currentValue: 41,
    unit: "%",
    asOf: DEMO_AS_OF,
    source: "demo_fixture",
    sourceDetail: "Patient portal benchmark pack.",
    measurementStatus: "measured",
    direction: "higher_is_better",
    confidence: 0.77,
    ownerRole: "Director, Digital Patient Experience",
    notes:
      "Patient engagement coverage limits digital front door and care gap automation reach.",
    programIds: ["meridian-healthcare-data-analytics-modernization"],
  },
  {
    id: "tm-meridian-009",
    tenantKey: "meridian-health",
    clientId: "meridian-health-system",
    metricId: "PAT-MET-236",
    metricName: "Sepsis bundle compliance rate",
    industry: "healthcare_idn",
    currentValue: 67,
    unit: "%",
    asOf: DEMO_AS_OF,
    source: "demo_fixture",
    sourceDetail: "Quality and clinical operations benchmark pack.",
    measurementStatus: "measured",
    direction: "higher_is_better",
    confidence: 0.74,
    ownerRole: "Chief Quality Officer",
    notes:
      "Clinical AI must show it can improve workflow compliance without adding alert fatigue.",
    programIds: ["meridian-healthcare-data-analytics-modernization"],
  },
  {
    id: "tm-meridian-010",
    tenantKey: "meridian-health",
    clientId: "meridian-health-system",
    metricId: "PAT-MET-238",
    metricName: "All-cause readmission rate",
    industry: "healthcare_idn",
    currentValue: 14.8,
    unit: "%",
    asOf: DEMO_AS_OF,
    source: "demo_fixture",
    sourceDetail: "Quality benchmark pack.",
    measurementStatus: "measured",
    direction: "lower_is_better",
    confidence: 0.77,
    ownerRole: "VP Care Management",
    notes:
      "Connects analytics modernization to care transitions, population health, and avoidable utilization value.",
    programIds: ["meridian-healthcare-data-analytics-modernization"],
  },
  {
    id: "tm-meridian-011",
    tenantKey: "meridian-health",
    clientId: "meridian-health-system",
    metricId: "PAT-MET-267",
    metricName: "Clinical analytics certified report usage",
    industry: "healthcare_idn",
    currentValue: 29,
    unit: "%",
    asOf: DEMO_AS_OF,
    source: "demo_fixture",
    sourceDetail: "Analytics platform usage telemetry sample.",
    measurementStatus: "measured",
    direction: "higher_is_better",
    confidence: 0.63,
    ownerRole: "VP Data and Analytics",
    notes:
      "Indicates whether clinicians and operators trust governed data products.",
    programIds: ["meridian-healthcare-data-analytics-modernization"],
  },
  {
    id: "tm-meridian-012",
    tenantKey: "meridian-health",
    clientId: "meridian-health-system",
    metricId: "PAT-MET-274",
    metricName: "Model monitoring coverage for clinical AI",
    industry: "healthcare_idn",
    currentValue: null,
    unit: "%",
    asOf: DEMO_AS_OF,
    source: "demo_fixture",
    sourceDetail: "Not measured in current-state pack.",
    measurementStatus: "measurement_gap",
    direction: "higher_is_better",
    confidence: 0.25,
    ownerRole: "Chief Medical Informatics Officer",
    notes:
      "Setup should request AI inventory, production models, monitoring controls, and clinical governance evidence.",
    programIds: ["meridian-healthcare-data-analytics-modernization"],
  },
  {
    id: "tm-firstcapital-001",
    tenantKey: "first-capital",
    clientId: "first-capital",
    metricId: "PAT-MET-401",
    metricName: "Digital application completion rate",
    industry: "financial_services",
    currentValue: 36,
    unit: "%",
    asOf: DEMO_AS_OF,
    source: "demo_fixture",
    sourceDetail: "Account opening abandonment converted to completion proxy.",
    measurementStatus: "measured",
    direction: "higher_is_better",
    confidence: 0.74,
    ownerRole: "Director, Digital Product Management",
    notes:
      "Frames digital banking strategy around actual funnel completion rather than traffic or feature delivery.",
    programIds: ["firstcapital-digital-banking-risk-modernization"],
  },
  {
    id: "tm-firstcapital-002",
    tenantKey: "first-capital",
    clientId: "first-capital",
    metricId: "PAT-MET-402",
    metricName: "Next-best-action acceptance rate",
    industry: "financial_services",
    currentValue: 8,
    unit: "%",
    asOf: DEMO_AS_OF,
    source: "demo_fixture",
    sourceDetail: "CRM offer acceptance sample.",
    measurementStatus: "measured",
    direction: "higher_is_better",
    confidence: 0.66,
    ownerRole: "Chief Product Officer, Digital Banking",
    notes:
      "Weak NBA acceptance warns agents not to overpromise personalization before eligibility and trust improve.",
    programIds: ["firstcapital-digital-banking-risk-modernization"],
  },
  {
    id: "tm-firstcapital-003",
    tenantKey: "first-capital",
    clientId: "first-capital",
    metricId: "PAT-MET-403",
    metricName: "Fraud false positive rate",
    industry: "financial_services",
    currentValue: 92,
    unit: "%",
    asOf: DEMO_AS_OF,
    source: "demo_fixture",
    sourceDetail: "Fraud operations case review benchmark pack.",
    measurementStatus: "measured",
    direction: "lower_is_better",
    confidence: 0.78,
    ownerRole: "Chief Risk Officer",
    notes:
      "High false positives create customer friction, operations cost, and model-risk/control pressure.",
    programIds: ["firstcapital-digital-banking-risk-modernization"],
  },
  {
    id: "tm-firstcapital-004",
    tenantKey: "first-capital",
    clientId: "first-capital",
    metricId: "PAT-MET-404",
    metricName: "Credit decision cycle time",
    industry: "financial_services",
    currentValue: 18,
    unit: "business days",
    asOf: DEMO_AS_OF,
    source: "demo_fixture",
    sourceDetail: "Commercial credit decision benchmark pack.",
    measurementStatus: "measured",
    direction: "lower_is_better",
    confidence: 0.81,
    ownerRole: "Head of Commercial Banking",
    notes:
      "Direct value lever for lending modernization and document/intake automation.",
    programIds: ["firstcapital-digital-banking-risk-modernization"],
  },
  {
    id: "tm-firstcapital-005",
    tenantKey: "first-capital",
    clientId: "first-capital",
    metricId: "PAT-MET-405",
    metricName: "Regulatory reporting accuracy",
    industry: "financial_services",
    currentValue: 96,
    unit: "%",
    asOf: DEMO_AS_OF,
    source: "demo_fixture",
    sourceDetail: "Regulatory reporting control attestation sample.",
    measurementStatus: "measured",
    direction: "higher_is_better",
    confidence: 0.69,
    ownerRole: "Chief Risk Officer",
    notes:
      "Accuracy must be paired with lineage and adjustment rate before agents call the reporting plane reliable.",
    programIds: ["firstcapital-digital-banking-risk-modernization"],
  },
  {
    id: "tm-firstcapital-006",
    tenantKey: "first-capital",
    clientId: "first-capital",
    metricId: "PAT-MET-406",
    metricName: "Model validation cycle time",
    industry: "financial_services",
    currentValue: 120,
    unit: "business days",
    asOf: DEMO_AS_OF,
    source: "demo_fixture",
    sourceDetail: "Model risk intake and validation queue sample.",
    measurementStatus: "measured",
    direction: "lower_is_better",
    confidence: 0.76,
    ownerRole: "Head of Model Risk Management",
    notes:
      "Critical constraint for agentic AI use cases because production models cannot outpace validation capacity.",
    programIds: ["firstcapital-digital-banking-risk-modernization"],
  },
  {
    id: "tm-firstcapital-007",
    tenantKey: "first-capital",
    clientId: "first-capital",
    metricId: "PAT-MET-407",
    metricName: "Account opening abandonment rate",
    industry: "financial_services",
    currentValue: 64,
    unit: "%",
    asOf: DEMO_AS_OF,
    source: "demo_fixture",
    sourceDetail: "Digital account opening funnel sample.",
    measurementStatus: "measured",
    direction: "lower_is_better",
    confidence: 0.79,
    ownerRole: "Director, Digital Product Management",
    notes:
      "Provides concrete front-office value case for KYC, UX, data prefill, and fraud/risk orchestration.",
    programIds: ["firstcapital-digital-banking-risk-modernization"],
  },
  {
    id: "tm-firstcapital-008",
    tenantKey: "first-capital",
    clientId: "first-capital",
    metricId: "PAT-MET-408",
    metricName: "KYC straight-through completion rate",
    industry: "financial_services",
    currentValue: 52,
    unit: "%",
    asOf: DEMO_AS_OF,
    source: "demo_fixture",
    sourceDetail: "KYC onboarding benchmark sample.",
    measurementStatus: "measured",
    direction: "higher_is_better",
    confidence: 0.72,
    ownerRole: "Director, Compliance Operations",
    notes: "Connects customer growth to controls and onboarding operations.",
    programIds: ["firstcapital-digital-banking-risk-modernization"],
  },
  {
    id: "tm-firstcapital-009",
    tenantKey: "first-capital",
    clientId: "first-capital",
    metricId: "PAT-MET-436",
    metricName: "AML alert false positive rate",
    industry: "financial_services",
    currentValue: 91,
    unit: "%",
    asOf: DEMO_AS_OF,
    source: "demo_fixture",
    sourceDetail: "AML case management sample.",
    measurementStatus: "measured",
    direction: "lower_is_better",
    confidence: 0.73,
    ownerRole: "BSA/AML Officer",
    notes:
      "Shows why sourcing decisions must evaluate model governance, investigator workflow, and regulatory defensibility.",
    programIds: ["firstcapital-digital-banking-risk-modernization"],
  },
  {
    id: "tm-firstcapital-010",
    tenantKey: "first-capital",
    clientId: "first-capital",
    metricId: "PAT-MET-459",
    metricName: "Regulatory reporting cycle days",
    industry: "financial_services",
    currentValue: 12,
    unit: "business days",
    asOf: DEMO_AS_OF,
    source: "demo_fixture",
    sourceDetail: "Regulatory reporting close calendar sample.",
    measurementStatus: "measured",
    direction: "lower_is_better",
    confidence: 0.7,
    ownerRole: "Director, Regulatory Reporting",
    notes:
      "Transforms reporting modernization into cycle-time, adjustment, and lineage outcomes.",
    programIds: ["firstcapital-digital-banking-risk-modernization"],
  },
  {
    id: "tm-firstcapital-011",
    tenantKey: "first-capital",
    clientId: "first-capital",
    metricId: "PAT-MET-473",
    metricName: "Data product adoption rate in risk and finance",
    industry: "financial_services",
    currentValue: 34,
    unit: "%",
    asOf: DEMO_AS_OF,
    source: "demo_fixture",
    sourceDetail: "Risk and finance analytics usage telemetry sample.",
    measurementStatus: "measured",
    direction: "higher_is_better",
    confidence: 0.62,
    ownerRole: "Chief Data Officer",
    notes:
      "Low governed data adoption limits agent trust in risk, finance, and control recommendations.",
    programIds: ["firstcapital-digital-banking-risk-modernization"],
  },
  {
    id: "tm-firstcapital-012",
    tenantKey: "first-capital",
    clientId: "first-capital",
    metricId: "PAT-MET-466",
    metricName: "Model monitoring exception aging",
    industry: "financial_services",
    currentValue: null,
    unit: "days",
    asOf: DEMO_AS_OF,
    source: "demo_fixture",
    sourceDetail: "Not measured in current-state pack.",
    measurementStatus: "measurement_gap",
    direction: "lower_is_better",
    confidence: 0.24,
    ownerRole: "Head of Model Risk Management",
    notes:
      "Setup should request model inventory, validation status, monitoring exceptions, and remediation evidence.",
    programIds: ["firstcapital-digital-banking-risk-modernization"],
  },
] as const;

export function getAllTenantMetricObservations(): readonly TenantMetricObservation[] {
  return TENANT_METRIC_OBSERVATIONS;
}

export function getTenantMetricObservations(
  tenantKey: string,
): readonly TenantMetricObservation[] {
  const normalized = normalizeTenantMetricTenantKey(tenantKey);
  return TENANT_METRIC_OBSERVATIONS.filter(
    (observation) => observation.tenantKey === normalized,
  );
}

export function normalizeTenantMetricTenantKey(value: string): string {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  if (
    ["apex", "apexretail", "apex-retail-group", "apex-retail"].includes(
      normalized,
    )
  )
    return "apex-retail";
  if (
    ["meridian", "meridian-health-system", "meridian-health"].includes(
      normalized,
    )
  )
    return "meridian-health";
  if (
    ["firstcapital", "first-capital-bank", "first-capital"].includes(normalized)
  )
    return "first-capital";
  return normalized;
}

export function summarizeTenantMetricReadiness(
  tenantKey: string,
): TenantMetricReadinessSummary {
  const observations = getTenantMetricObservations(tenantKey);
  const programIds = new Set<string>();
  const industries = new Set<MetricIndustry>();
  let confidence = 0;

  for (const observation of observations) {
    confidence += observation.confidence;
    industries.add(observation.industry);
    for (const programId of observation.programIds ?? [])
      programIds.add(programId);
  }

  return {
    tenantKey: normalizeTenantMetricTenantKey(tenantKey),
    total: observations.length,
    measured: observations.filter(
      (observation) => observation.measurementStatus === "measured",
    ).length,
    measurementGaps: observations.filter(
      (observation) => observation.measurementStatus === "measurement_gap",
    ).length,
    stale: observations.filter(
      (observation) => observation.measurementStatus === "stale",
    ).length,
    averageConfidence:
      observations.length === 0
        ? 0
        : Number((confidence / observations.length).toFixed(2)),
    industries: Array.from(industries),
    programIds: Array.from(programIds).sort(),
  };
}

export function buildTenantMetricGapView(
  tenantKey: string,
): readonly TenantMetricGapView[] {
  return getTenantMetricObservations(tenantKey).map((observation) => {
    const metricRecord = getMetricRecordById(observation.metricId);
    if (!metricRecord) {
      throw new Error(
        `Tenant metric observation ${observation.id} references unknown metric ${observation.metricId}`,
      );
    }

    const gap = classifyGap(observation, metricRecord);
    return {
      observation,
      metricRecord,
      gapClass: gap.gapClass,
      gapSeverity: gap.gapSeverity,
      gapNarrative: gap.gapNarrative,
    };
  });
}

function classifyGap(
  observation: TenantMetricObservation,
  metricRecord: MetricRecord,
): Pick<TenantMetricGapView, "gapClass" | "gapSeverity" | "gapNarrative"> {
  if (
    observation.measurementStatus === "measurement_gap" ||
    observation.currentValue === null
  ) {
    return {
      gapClass: "measurement_gap",
      gapSeverity: 4,
      gapNarrative: `${observation.metricName} is not measured well enough for agents to use as quantitative evidence yet.`,
    };
  }

  const value = observation.currentValue;
  const target = metricRecord.northStarRange;
  const leader = metricRecord.leaderBenchmark;
  const floor = metricRecord.commonFloor;
  const lowerBetter = observation.direction === "lower_is_better";

  if (lowerBetter) {
    if (value <= target.high)
      return gapText("at_or_near_target", 1, observation, metricRecord);
    if (value <= leader.high)
      return gapText("watch", 2, observation, metricRecord);
    if (value >= floor.low)
      return gapText("material_gap", 5, observation, metricRecord);
    return gapText("material_gap", 3, observation, metricRecord);
  }

  if (value >= target.low)
    return gapText("at_or_near_target", 1, observation, metricRecord);
  if (value >= leader.low)
    return gapText("watch", 2, observation, metricRecord);
  if (value <= floor.high)
    return gapText("material_gap", 5, observation, metricRecord);
  return gapText("material_gap", 3, observation, metricRecord);
}

function gapText(
  gapClass: TenantMetricGapClass,
  gapSeverity: number,
  observation: TenantMetricObservation,
  metricRecord: MetricRecord,
): Pick<TenantMetricGapView, "gapClass" | "gapSeverity" | "gapNarrative"> {
  return {
    gapClass,
    gapSeverity,
    gapNarrative: `${observation.metricName} is ${observation.currentValue}${observation.unit}; north-star range is ${metricRecord.northStarRange.low}-${metricRecord.northStarRange.high}${metricRecord.northStarRange.unit}.`,
  };
}
