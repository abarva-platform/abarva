export type TowerReadinessState = "ready" | "partial" | "pending";

export interface TowerDatasetReadiness {
  dataset: string;
  dimension: string;
  state: TowerReadinessState;
  readyForAuthoritativeAnswer: boolean;
  expectedBehavior: string;
  missingFields: string[];
  notes: string;
}

const PRECISE_PENDING_BEHAVIOR =
  "Return a precise gap or pending-data response. Do not fabricate from raw substrate or infer missing math.";

export const TOWER_DATASET_READINESS: TowerDatasetReadiness[] = [
  {
    dataset: "organization_leadership",
    dimension: "organization_leadership",
    state: "ready",
    readyForAuthoritativeAnswer: true,
    expectedBehavior:
      "Answer from the ready L3 organization and leadership dossier with citations.",
    missingFields: [],
    notes:
      "Ready dossier has source-backed organization, ownership, and leadership relationships.",
  },
  pending(
    "portfolio_companies",
    "portfolio_company_budget",
    ["portfolio_company_budget_contract_signed_off"],
    "Portfolio-company rows exist, but demo realism remains gated on signed-off company budget and revenue values.",
  ),
  pending(
    "it_programs",
    "program_budget_value",
    ["program_value_measurement_rows"],
    "Top IT program rows exist, but value proof coverage is not ready enough for authoritative ROI answers.",
  ),
  pending(
    "initiatives",
    "initiative_budget_value",
    ["initiative_value_measurement_rows"],
    "Initiative rows exist, but not every initiative has measured value and business outcome proof.",
  ),
  pending(
    "budget_lines",
    "budget_split",
    ["run_change_line_items", "capex_opex_line_items"],
    "Budget summary can be shown only as loaded envelope; run/change and CapEx/OpEx splits are not authoritative.",
  ),
  pending(
    "vendors_contracts",
    "vendor_contracts",
    ["contract_to_program_edges", "renewal_date_source_rows"],
    "Vendor exposure exists, but contract-to-program lineage and renewal details are not fully ready.",
  ),
  pending(
    "ai_investments",
    "ai_value",
    ["measured_ai_value_rows", "ai_category_classification"],
    "AI spend rows exist, but measured AI ROI and category classification are not ready for definitive answers.",
  ),
  pending(
    "value_realization",
    "value_realization",
    ["realized_value_rows", "benefit_owner_evidence"],
    "Value proof is the known gap; answer must distinguish committed spend from realized value.",
  ),
  pending(
    "risks_controls",
    "risk_control",
    ["control_owner_evidence", "risk_mitigation_status"],
    "Risk/control signals exist, but control ownership and mitigation status are not complete enough for final claims.",
  ),
  pending(
    "operational_metrics",
    "operational_metrics",
    ["metric_period_grain", "metric_source_system_lineage"],
    "Operational metrics need period grain and source-system lineage before they can be used as Tower truth.",
  ),
  pending(
    "service_management",
    "itsm",
    ["service_now_incident_extract", "service_now_change_extract"],
    "ITSM questions must name the missing ServiceNow/Jira extracts instead of inventing service metrics.",
  ),
  pending(
    "cmdb_systems",
    "cmdb",
    ["cmdb_ci_relationship_edges", "system_owner_evidence"],
    "CMDB/system answers need CI relationship edges and owner evidence before graph answers are authoritative.",
  ),
  pending(
    "source_lineage",
    "source_lineage",
    ["source_to_fact_lineage_coverage"],
    "Source lineage can report gaps, but should not imply every metric is source-verified.",
  ),
  pending(
    "gaps",
    "gap_register",
    ["gap_owner", "gap_resolution_status"],
    "Gap rows can be shown, but ownership and closure status are not complete enough for governance claims.",
  ),
  pending(
    "board_read",
    "board_readiness",
    ["board_approved_metric_set", "metric_exception_notes"],
    "Board-read summaries need approved metric definitions and exception notes.",
  ),
  pending(
    "shared_services",
    "shared_services_budget",
    ["shared_services_allocation_basis", "chargeback_method"],
    "Shared-services spend must not be allocated without basis or chargeback metadata.",
  ),
  pending(
    "vendor_by_program",
    "vendor_program_lineage",
    ["contract_to_program_edges"],
    "Cross-dimension vendor/program questions need explicit contract-to-program edges.",
  ),
  pending(
    "vendor_by_risk",
    "vendor_risk_lineage",
    ["vendor_to_risk_edges"],
    "Cross-dimension vendor/risk questions need explicit vendor-to-risk edges.",
  ),
  pending(
    "company_by_program",
    "company_program_lineage",
    ["portfolio_company_to_program_edges"],
    "Cross-dimension company/program questions need explicit company-to-program edges.",
  ),
  pending(
    "company_by_value",
    "company_value_lineage",
    ["portfolio_company_value_measurement_rows"],
    "Portfolio-company value questions need measured value rows.",
  ),
  pending(
    "ai_by_vendor",
    "ai_vendor_lineage",
    ["ai_vendor_contract_edges", "ai_category_classification"],
    "AI/vendor questions need vendor-contract lineage and category classification.",
  ),
  pending(
    "ai_by_value",
    "ai_value_lineage",
    ["measured_ai_value_rows"],
    "AI/value questions need measured AI value rows.",
  ),
  pending(
    "ai_by_adoption",
    "ai_adoption_lineage",
    ["adoption_metric_rows"],
    "AI/adoption questions need adoption metric rows.",
  ),
  pending(
    "renewals_by_program",
    "renewal_program_lineage",
    ["renewal_to_program_edges"],
    "Renewal/program questions need renewal-to-program edges.",
  ),
  pending(
    "budget_by_function",
    "function_budget",
    ["function_budget_line_items"],
    "Budget/function questions need function-level budget line items.",
  ),
  pending(
    "budget_by_company",
    "company_budget",
    ["company_budget_line_items"],
    "Budget/company questions need company-level budget line items.",
  ),
  pending(
    "run_change_by_program",
    "program_run_change",
    ["program_run_change_line_items"],
    "Program run/change questions need program-level line items.",
  ),
  pending(
    "capex_opex_by_program",
    "program_capex_opex",
    ["program_capex_opex_line_items"],
    "Program CapEx/OpEx questions need program-level line items.",
  ),
  pending(
    "owner_by_risk",
    "owner_risk_lineage",
    ["risk_owner_edges"],
    "Owner/risk questions need risk-owner edges.",
  ),
  pending(
    "owner_by_value_gap",
    "owner_value_gap_lineage",
    ["value_gap_owner_edges"],
    "Owner/value-gap questions need value-gap owner edges.",
  ),
  pending(
    "service_by_system",
    "service_system_lineage",
    ["service_to_system_edges"],
    "Service/system questions need service-to-system edges.",
  ),
  pending(
    "incident_by_vendor",
    "incident_vendor_lineage",
    ["incident_to_system_edges", "system_to_vendor_edges"],
    "Incident/vendor questions need incident-system and system-vendor edges.",
  ),
  pending(
    "source_by_metric",
    "source_metric_lineage",
    ["metric_to_source_edges"],
    "Source/metric questions need metric-to-source edges.",
  ),
  pending(
    "gap_by_dashboard",
    "dashboard_gap_lineage",
    ["dashboard_metric_to_gap_edges"],
    "Dashboard/gap questions need metric-to-gap edges.",
  ),
  pending(
    "benchmark_by_ai_spend",
    "ai_benchmark_readiness",
    ["tenant_ai_spend_benchmark_basis"],
    "AI benchmark questions need tenant benchmark basis before comparison claims.",
  ),
  pending(
    "board_by_risk_value",
    "board_risk_value",
    ["board_metric_value_rows", "risk_value_edges"],
    "Board/risk/value questions need board-approved value rows and risk-value edges.",
  ),
];

const READINESS_BY_DATASET = new Map(
  TOWER_DATASET_READINESS.map((entry) => [entry.dataset, entry]),
);

export function getTowerDatasetReadiness(
  dataset: string,
): TowerDatasetReadiness {
  return (
    READINESS_BY_DATASET.get(dataset) ??
    pending(
      dataset,
      "undeclared",
      ["readiness_not_declared"],
      "Dataset readiness is not declared; scorer treats it as pending by default.",
    )
  );
}

export function isTowerDatasetReady(dataset: string): boolean {
  return getTowerDatasetReadiness(dataset).readyForAuthoritativeAnswer;
}

function pending(
  dataset: string,
  dimension: string,
  missingFields: string[],
  notes: string,
): TowerDatasetReadiness {
  return {
    dataset,
    dimension,
    state: "pending",
    readyForAuthoritativeAnswer: false,
    expectedBehavior: PRECISE_PENDING_BEHAVIOR,
    missingFields,
    notes,
  };
}
