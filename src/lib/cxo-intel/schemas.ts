export type CxoIntelBundleKey = "cio" | "cfo" | "coo" | "chro" | "gc";
export type CxoIntelWaveState = "active" | "future";

export interface CxoIntelFileSchema {
  fileName: string;
  tableName: string;
  label: string;
  purpose: string;
  expectedRows: string;
  requiredColumns: string[];
  optionalColumns: string[];
  moveUnlocks: string[];
}

export interface CxoIntelBundleSchema {
  key: CxoIntelBundleKey;
  title: string;
  ownerRole: string;
  stewardRole: string;
  waveState: CxoIntelWaveState;
  headline: string;
  files: CxoIntelFileSchema[];
}

const CIO_FILES: CxoIntelFileSchema[] = [
  {
    fileName: "app_inventory.csv",
    tableName: "cxo_intel_app_inventory",
    label: "Application inventory",
    purpose: "One row per business application in production at the HoldCo or any PortCo.",
    expectedRows: "50-500",
    requiredColumns: [
      "app_name",
      "vendor_name",
      "category",
      "criticality",
      "scope",
      "owner_name",
      "owner_email",
      "annual_cost_usd",
      "cost_currency",
      "renewal_date",
    ],
    optionalColumns: ["portco_ids", "deployment_model", "data_classification", "notes"],
    moveUnlocks: ["Move 1", "Move 2", "Move 3"],
  },
  {
    fileName: "cloud_footprint.csv",
    tableName: "cxo_intel_cloud_footprint",
    label: "Cloud footprint",
    purpose: "One row per cloud provider or on-prem environment with annual run cost and posture.",
    expectedRows: "1-10",
    requiredColumns: [
      "provider",
      "environment_name",
      "scope",
      "share_pct",
      "annual_run_cost_usd",
      "primary_workloads",
    ],
    optionalColumns: ["landing_zone_maturity", "notes"],
    moveUnlocks: ["Move 1", "Move 3"],
  },
  {
    fileName: "vendor_contracts.csv",
    tableName: "cxo_intel_vendor_contracts",
    label: "Vendor contracts",
    purpose: "One row per vendor contract over the HoldCo reporting threshold.",
    expectedRows: "15-80",
    requiredColumns: [
      "vendor_name",
      "contract_name",
      "category",
      "annual_value_usd",
      "currency",
      "contract_start",
      "contract_end",
      "renewal_notice_days",
      "auto_renew",
    ],
    optionalColumns: ["exit_clause_present", "scope", "linked_app_names", "notes"],
    moveUnlocks: ["Move 2", "Source L-S02/L-S03"],
  },
  {
    fileName: "ai_roadmap.csv",
    tableName: "cxo_intel_ai_roadmap",
    label: "AI roadmap",
    purpose: "One row per AI use case, from idea through production.",
    expectedRows: "5-40",
    requiredColumns: [
      "use_case_id",
      "use_case_name",
      "stage",
      "business_function",
      "model_family",
      "data_dependency",
      "owner_name",
      "governance_state",
    ],
    optionalColumns: ["target_production_date", "realized_impact_summary", "reusability_rating"],
    moveUnlocks: ["Move 1", "Move 3"],
  },
  {
    fileName: "it_spend_allocation.csv",
    tableName: "cxo_intel_it_spend_allocation",
    label: "IT spend allocation",
    purpose: "Run/grow/transform allocation of annual IT spend.",
    expectedRows: "3",
    requiredColumns: ["category", "share_pct", "annual_usd", "notes"],
    optionalColumns: ["benchmark_band", "variance_to_benchmark_pp"],
    moveUnlocks: ["Move 1", "Move 2"],
  },
  {
    fileName: "risk_register.csv",
    tableName: "cxo_intel_risk_register",
    label: "Risk register",
    purpose: "One row per active IT, cyber, data-quality, or modernization-debt risk.",
    expectedRows: "10-60",
    requiredColumns: [
      "risk_id",
      "risk_title",
      "category",
      "inherent_likelihood",
      "inherent_impact",
      "mitigation_state",
      "owner_name",
      "last_reviewed_date",
    ],
    optionalColumns: ["cyber_relevant", "notes", "target_remediation_date"],
    moveUnlocks: ["Move 4"],
  },
  {
    fileName: "it_org.csv",
    tableName: "cxo_intel_it_org",
    label: "IT organization",
    purpose: "IT function rows for ownership, capacity, and capability-marketplace routing.",
    expectedRows: "5-25",
    requiredColumns: [
      "function_name",
      "leader_name",
      "leader_email",
      "fte_count",
      "contractor_count",
      "primary_location",
    ],
    optionalColumns: ["capability_tags", "notes"],
    moveUnlocks: ["Move 3", "Tower Federated"],
  },
];

const CFO_FILES: CxoIntelFileSchema[] = [
  {
    fileName: "finance_system_inventory.csv",
    tableName: "cxo_intel_finance_systems",
    label: "Finance systems",
    purpose: "ERP, treasury, AP/AR, EPM, close, and reporting systems.",
    expectedRows: "5-30",
    requiredColumns: [
      "system_name",
      "vendor_name",
      "function",
      "deployment_state",
      "owner_name",
      "annual_cost_usd",
    ],
    optionalColumns: ["renewal_date", "integration_notes", "notes"],
    moveUnlocks: ["Move 0", "Move 1"],
  },
  {
    fileName: "banking_relationships.csv",
    tableName: "cxo_intel_banking_relationships",
    label: "Banking relationships",
    purpose: "Per-bank account, service, connectivity, fee, and facility rows.",
    expectedRows: "3-25",
    requiredColumns: [
      "bank_name",
      "relationship_role",
      "entity_scope",
      "account_count",
      "connectivity_method",
      "h2h_ready",
      "annual_fees_usd",
      "contract_renewal_date",
      "services",
    ],
    optionalColumns: [
      "credit_facility_present",
      "credit_facility_size_usd",
      "relationship_age_years",
      "notes",
    ],
    moveUnlocks: ["Move 0 G1", "Source L-S01"],
  },
  {
    fileName: "audit_advisory_engagements.csv",
    tableName: "cxo_intel_audit_advisory",
    label: "Audit and advisory",
    purpose: "External audit, tax advisory, transaction services, consulting, and internal audit rows.",
    expectedRows: "3-20",
    requiredColumns: [
      "firm_name",
      "engagement_type",
      "scope",
      "annual_fees_usd",
      "engagement_start",
      "renewal_date",
    ],
    optionalColumns: ["portco_ids", "lead_partner_name", "rotation_required_year", "scope_summary", "notes"],
    moveUnlocks: ["Move 2", "Move 4", "Source L-S04"],
  },
  {
    fileName: "insurance_program.csv",
    tableName: "cxo_intel_insurance_program",
    label: "Insurance program",
    purpose: "One row per insurance line across broker, carrier, limit, retention, premium, and renewal.",
    expectedRows: "6-20",
    requiredColumns: [
      "line",
      "broker_name",
      "carrier_name",
      "limit_usd",
      "retention_usd",
      "premium_usd",
      "policy_period_start",
      "policy_period_end",
    ],
    optionalColumns: ["prior_year_premium_usd", "scope_summary", "notes"],
    moveUnlocks: ["Move 4", "Source L-S05"],
  },
  {
    fileName: "close_cycle_metrics.csv",
    tableName: "cxo_intel_close_cycle",
    label: "Close cycle metrics",
    purpose: "Monthly close-cycle and intercompany posting metrics.",
    expectedRows: "12",
    requiredColumns: [
      "period_yyyymm",
      "days_to_close",
      "gl_cash_variance_pct",
      "ic_posting_days",
      "late_adjustments_count",
    ],
    optionalColumns: ["close_owner", "notes"],
    moveUnlocks: ["Move 0 G2", "Move 0 G6"],
  },
  {
    fileName: "it_spend_ratios.csv",
    tableName: "cxo_intel_it_spend_ratios",
    label: "IT spend ratios",
    purpose: "Single-row fiscal-year IT spend as percent of revenue and per FTE.",
    expectedRows: "1",
    requiredColumns: [
      "fiscal_year",
      "total_it_spend_usd",
      "consolidated_revenue_usd",
      "it_pct_revenue",
      "employees_fte",
      "it_spend_per_fte_usd",
    ],
    optionalColumns: ["benchmark_source", "notes"],
    moveUnlocks: ["Move 2", "Tower Federated"],
  },
  {
    fileName: "tax_engagements.csv",
    tableName: "cxo_intel_tax_engagements",
    label: "Tax engagements",
    purpose: "Federal, state, international, advisory, transfer-pricing, and indirect-tax engagements.",
    expectedRows: "2-10",
    requiredColumns: [
      "firm_name",
      "engagement_type",
      "scope_summary",
      "annual_fees_usd",
      "engagement_start",
      "renewal_date",
    ],
    optionalColumns: ["overlap_with_audit_firm", "lead_partner_name", "notes"],
    moveUnlocks: ["Move 2", "Move 4"],
  },
];

export const CXO_INTEL_BUNDLES: ReadonlyArray<CxoIntelBundleSchema> = [
  {
    key: "cio",
    title: "CIO bundle",
    ownerRole: "HoldCo CIO",
    stewardRole: "IT PMO lead",
    waveState: "active",
    headline: "Applications, cloud, vendors, AI roadmap, IT spend, IT risk, and org shape.",
    files: CIO_FILES,
  },
  {
    key: "cfo",
    title: "CFO bundle",
    ownerRole: "HoldCo CFO",
    stewardRole: "Controller + treasury ops",
    waveState: "active",
    headline: "Finance systems, banks, audit/advisory, insurance, close metrics, IT ratios, and tax.",
    files: CFO_FILES,
  },
  {
    key: "coo",
    title: "COO bundle",
    ownerRole: "HoldCo COO",
    stewardRole: "Ops PMO",
    waveState: "future",
    headline: "Operations stack, workforce, outsourcing, KPIs, and operational vendors.",
    files: [],
  },
  {
    key: "chro",
    title: "CHRO bundle",
    ownerRole: "HoldCo CHRO",
    stewardRole: "People ops lead",
    waveState: "future",
    headline: "HCM stack, benefits, learning, talent acquisition, and workforce demographics.",
    files: [],
  },
  {
    key: "gc",
    title: "GC / CCO bundle",
    ownerRole: "HoldCo GC",
    stewardRole: "Legal ops",
    waveState: "future",
    headline: "Contracts, regulatory inventory, litigation, entity registry, and insurance detail.",
    files: [],
  },
];

export function getCxoIntelBundle(key: CxoIntelBundleKey): CxoIntelBundleSchema {
  const bundle = CXO_INTEL_BUNDLES.find((candidate) => candidate.key === key);
  if (!bundle) throw new Error(`unknown_cxo_intel_bundle:${key}`);
  return bundle;
}

export function getCxoIntelFile(bundleKey: CxoIntelBundleKey, fileName: string): CxoIntelFileSchema | null {
  return getCxoIntelBundle(bundleKey).files.find((file) => file.fileName === fileName) ?? null;
}

export const CXO_INTEL_ACTIVE_TABLES = [
  ...CIO_FILES.map((file) => file.tableName),
  ...CFO_FILES.map((file) => file.tableName),
] as const;
