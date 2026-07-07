import type {
  ContextDimension,
  ContextDimensionFamily,
  UploadedFileFormat,
} from "./types";

export interface TemplateFormatSupportProfile {
  format: Exclude<UploadedFileFormat, "unknown">;
  nativeSupport: boolean;
  requiresConversion: boolean;
}

export interface TemplateExceptionMetadataRequirement {
  label: string;
  field: string;
  required: boolean;
}

export interface ContextTemplateDefinition {
  id: string;
  dimension: ContextDimension;
  family?: ContextDimensionFamily;
  label: string;
  acceptedFormats: UploadedFileFormat[];
  exceptionFormats?: Exclude<UploadedFileFormat, "unknown">[];
  formatProfiles?: TemplateFormatSupportProfile[];
  requiredFields: string[];
  optionalFields: string[];
  ownerRole: string;
  refreshCadence: string;
  exceptionMetadataRequirements?: TemplateExceptionMetadataRequirement[];
  unlocks: string[];
  loadOrder?: number;
}

interface TemplateLookupOptions {
  tenantKey?: string | null;
}

const UNIVERSAL_UNLOCKS = [
  "Context graph gains traversable edges for this domain",
  "Sentinel can answer grounded questions from this dimension",
  "Insight rules can fire significance signals against this data",
  "Tower lenses that depend on this dimension become answerable",
];

export const UNIVERSAL_CONTEXT_TEMPLATES: ContextTemplateDefinition[] = [
  // ── Family 1 — Enterprise & Operating Model ──────────────────────────────
  {
    id: "enterprise-profile",
    dimension: "enterprise_profile",
    family: "enterprise_operating_model",
    label: "Enterprise profile",
    acceptedFormats: ["yaml", "json", "markdown"],
    requiredFields: [
      "tenant_key",
      "company_name",
      "revenue_usd",
      "employees",
      "fiscal_year_end",
    ],
    optionalFields: [
      "countries",
      "business_units",
      "it_budget_usd",
      "debt_usd",
      "industry_code",
    ],
    ownerRole: "Chief Strategy Officer",
    refreshCadence: "quarterly",
    loadOrder: 1,
    unlocks: UNIVERSAL_UNLOCKS,
  },
  {
    id: "business-org-functions",
    dimension: "business_org_functions",
    family: "enterprise_operating_model",
    label: "Business org & functions",
    acceptedFormats: ["csv", "xlsx", "json"],
    requiredFields: [
      "function_id",
      "function_name",
      "executive_owner_role",
      "head_count",
    ],
    optionalFields: [
      "cost_center",
      "p_and_l_owner",
      "revenue_attributed_usd",
      "ai_maturity",
    ],
    ownerRole: "COO / Chief of Staff",
    refreshCadence: "quarterly",
    loadOrder: 2,
    unlocks: UNIVERSAL_UNLOCKS,
  },
  {
    id: "it-org-ownership",
    dimension: "it_org_ownership",
    family: "enterprise_operating_model",
    label: "IT org & ownership",
    acceptedFormats: ["csv", "xlsx", "json"],
    requiredFields: [
      "team_id",
      "team_name",
      "it_owner_role",
      "domain",
      "head_count",
    ],
    optionalFields: [
      "budget_usd",
      "onshore_pct",
      "offshore_pct",
      "gcc_location",
      "vendor_dependency",
    ],
    ownerRole: "CIO",
    refreshCadence: "quarterly",
    loadOrder: 2,
    unlocks: UNIVERSAL_UNLOCKS,
  },
  {
    id: "capabilities-value-streams",
    dimension: "capabilities_value_streams",
    family: "enterprise_operating_model",
    label: "Capabilities & value streams",
    acceptedFormats: ["csv", "xlsx"],
    requiredFields: [
      "capability_id",
      "capability_name",
      "business_function",
      "maturity_level",
    ],
    optionalFields: [
      "value_stream",
      "owner_role",
      "key_system_ids",
      "ai_opportunity",
    ],
    ownerRole: "VP Enterprise Architecture",
    refreshCadence: "quarterly",
    loadOrder: 3,
    unlocks: UNIVERSAL_UNLOCKS,
  },
  // ── Family 2 — Technology Estate ─────────────────────────────────────────
  {
    id: "applications-systems",
    dimension: "applications_systems",
    family: "technology_estate",
    label: "Application & system inventory",
    acceptedFormats: ["csv", "xlsx"],
    requiredFields: [
      "app_id",
      "name",
      "vendor",
      "category",
      "criticality",
      "it_owner_team",
      "lifecycle_stage",
    ],
    optionalFields: [
      "run_cost_usd",
      "deployment",
      "primary_dataclass",
      "integration_count",
      "ai_eligibility_score",
      "notes",
    ],
    ownerRole: "VP Enterprise Architecture",
    refreshCadence: "monthly",
    loadOrder: 4,
    unlocks: UNIVERSAL_UNLOCKS,
  },
  {
    id: "system-function-mapping",
    dimension: "system_function_mapping",
    family: "technology_estate",
    label: "System-to-function mapping",
    acceptedFormats: ["csv", "xlsx", "json"],
    requiredFields: [
      "mapping_id",
      "app_id",
      "function_id",
      "support_type",
      "primary_flag",
    ],
    optionalFields: [
      "module",
      "user_count",
      "process_area",
      "criticality_override",
    ],
    ownerRole: "VP Enterprise Architecture",
    refreshCadence: "monthly",
    loadOrder: 4,
    unlocks: [
      "System-to-function graph edges become traversable",
      ...UNIVERSAL_UNLOCKS,
    ],
  },
  {
    id: "infrastructure-cloud",
    dimension: "infrastructure_cloud",
    family: "technology_estate",
    label: "Infrastructure & cloud estate",
    acceptedFormats: ["csv", "xlsx", "json"],
    requiredFields: [
      "resource_id",
      "resource_type",
      "provider",
      "region",
      "criticality",
      "owner_team",
    ],
    optionalFields: [
      "monthly_cost_usd",
      "environment",
      "retirement_date",
      "dr_tier",
      "compliance_scope",
    ],
    ownerRole: "SVP Infrastructure",
    refreshCadence: "monthly",
    loadOrder: 4,
    unlocks: UNIVERSAL_UNLOCKS,
  },
  {
    id: "platform-volumetrics",
    dimension: "platform_volumetrics",
    family: "technology_estate",
    label: "Platform volumetrics",
    acceptedFormats: ["csv", "xlsx", "json"],
    requiredFields: ["platform_id", "metric_name", "period", "value", "unit"],
    optionalFields: [
      "peak_value",
      "growth_rate_pct",
      "capacity_pct",
      "threshold_alert",
    ],
    ownerRole: "VP Technology Operations",
    refreshCadence: "monthly",
    loadOrder: 4,
    unlocks: UNIVERSAL_UNLOCKS,
  },
  // ── Family 3 — Data & Connectivity ───────────────────────────────────────
  {
    id: "data-analytics-estate",
    dimension: "data_analytics_estate",
    family: "data_connectivity",
    label: "Data & analytics estate",
    acceptedFormats: ["csv", "xlsx"],
    requiredFields: [
      "data_product_id",
      "name",
      "source_system",
      "owner_role",
      "data_class",
      "refresh_sla",
    ],
    optionalFields: [
      "phi_flag",
      "pii_flag",
      "quality_score",
      "consumers",
      "lineage_documented",
    ],
    ownerRole: "Chief Data Officer",
    refreshCadence: "monthly",
    loadOrder: 5,
    unlocks: UNIVERSAL_UNLOCKS,
  },
  {
    id: "integrations-interfaces",
    dimension: "integrations_interfaces",
    family: "data_connectivity",
    label: "Integrations & interfaces",
    acceptedFormats: ["csv", "xlsx", "json", "jsonl"],
    requiredFields: [
      "edge_id",
      "source_app_id",
      "target_app_id",
      "integration_type",
      "direction",
    ],
    optionalFields: [
      "latency_sla",
      "daily_volume",
      "failure_impact",
      "kill_blocker_flag",
      "middleware",
    ],
    ownerRole: "VP Enterprise Architecture",
    refreshCadence: "monthly",
    loadOrder: 5,
    unlocks: [
      "Integration topology graph edges become traversable",
      ...UNIVERSAL_UNLOCKS,
    ],
  },
  // ── Family 4 — Financial & Commercial ────────────────────────────────────
  {
    id: "vendors-contracts-licenses",
    dimension: "vendors_contracts_licenses",
    family: "financial_commercial",
    label: "Vendors, contracts & licenses",
    acceptedFormats: ["csv", "xlsx"],
    requiredFields: [
      "vendor_id",
      "vendor_name",
      "contract_id",
      "annual_value_usd",
      "renewal_date",
      "primary_system_id",
    ],
    optionalFields: [
      "auto_renew",
      "notice_days",
      "exit_terms",
      "ai_clauses",
      "data_rights",
      "benchmark_present",
    ],
    ownerRole: "VP Procurement",
    refreshCadence: "monthly",
    loadOrder: 6,
    unlocks: [
      "Vendor-to-system edges enable renewal risk traversal",
      ...UNIVERSAL_UNLOCKS,
    ],
  },
  {
    id: "it-budget-financials",
    dimension: "it_budget_financials",
    family: "financial_commercial",
    label: "IT budget & financials",
    acceptedFormats: ["csv", "xlsx"],
    requiredFields: [
      "budget_line_id",
      "category",
      "owner_team",
      "annual_budget_usd",
      "fiscal_year",
    ],
    optionalFields: [
      "capex_usd",
      "opex_usd",
      "labor_usd",
      "vendor_usd",
      "actuals_usd",
      "variance_pct",
    ],
    ownerRole: "CFO / CIO",
    refreshCadence: "quarterly",
    loadOrder: 6,
    unlocks: UNIVERSAL_UNLOCKS,
  },
  // ── Family 5 — Execution & Operations ────────────────────────────────────
  {
    id: "initiatives-portfolio",
    dimension: "initiatives_portfolio",
    family: "execution_operations",
    label: "Initiatives & portfolio",
    acceptedFormats: ["csv", "xlsx", "json"],
    requiredFields: [
      "initiative_id",
      "title",
      "status",
      "sponsor_role",
      "committed_usd",
      "posture",
    ],
    optionalFields: [
      "projected_value_usd",
      "linked_app_ids",
      "target_date",
      "phase",
      "vendor",
      "benefit_claim",
    ],
    ownerRole: "Transformation PMO / CIO",
    refreshCadence: "weekly",
    loadOrder: 7,
    unlocks: UNIVERSAL_UNLOCKS,
  },
  {
    id: "operations-service-management",
    dimension: "operations_service_management",
    family: "execution_operations",
    label: "Operations & service management",
    acceptedFormats: ["csv", "json", "jsonl"],
    requiredFields: [
      "record_id",
      "record_type",
      "system_id",
      "severity",
      "opened_at",
    ],
    optionalFields: [
      "closed_at",
      "root_cause",
      "mttr_hours",
      "sla_breached",
      "customer_impact",
    ],
    ownerRole: "VP IT Operations",
    refreshCadence: "weekly",
    loadOrder: 8,
    unlocks: UNIVERSAL_UNLOCKS,
  },
  {
    id: "kpis-outcome-evidence",
    dimension: "kpis_outcome_evidence",
    family: "execution_operations",
    label: "KPIs & outcome evidence",
    acceptedFormats: ["csv", "xlsx"],
    requiredFields: [
      "kpi_id",
      "kpi_name",
      "owner_role",
      "baseline_value",
      "current_value",
      "target_value",
      "unit",
    ],
    optionalFields: [
      "initiative_id",
      "measurement_date",
      "evidence_source",
      "confidence",
      "ai_attribution",
    ],
    ownerRole: "CFO / CIO",
    refreshCadence: "monthly",
    loadOrder: 8,
    unlocks: UNIVERSAL_UNLOCKS,
  },
  // ── Family 6 — Governance, AI & Evidence ─────────────────────────────────
  {
    id: "security-risk-compliance",
    dimension: "security_risk_compliance",
    family: "governance_ai_evidence",
    label: "Security, risk & compliance",
    acceptedFormats: ["csv", "xlsx"],
    requiredFields: [
      "control_id",
      "control_area",
      "system_id",
      "status",
      "owner_role",
    ],
    optionalFields: [
      "regulation",
      "last_audit_date",
      "finding_count",
      "remediation_date",
      "examiner_note",
    ],
    ownerRole: "CISO / Chief Compliance Officer",
    refreshCadence: "quarterly",
    loadOrder: 9,
    unlocks: UNIVERSAL_UNLOCKS,
  },
  {
    id: "ai-automation-footprint",
    dimension: "ai_automation_footprint",
    family: "governance_ai_evidence",
    label: "AI & automation footprint",
    acceptedFormats: ["csv", "xlsx"],
    requiredFields: [
      "tool_id",
      "tool_name",
      "vendor",
      "owner_role",
      "workflow",
      "risk_classification",
    ],
    optionalFields: [
      "model_name",
      "regulated_workflow_flag",
      "monthly_spend_usd",
      "active_users",
      "approval_status",
    ],
    ownerRole: "AI Governance Lead / CIO",
    refreshCadence: "monthly",
    loadOrder: 9,
    unlocks: UNIVERSAL_UNLOCKS,
  },
  // ── Dimension 19 — Personas & Workforce ──────────────────────────────────
  {
    id: "personas-workforce",
    dimension: "personas_workforce",
    family: "personas_workforce",
    label: "Personas & workforce",
    acceptedFormats: ["csv", "xlsx"],
    requiredFields: [
      "persona_id",
      "persona_name",
      "function_id",
      "head_count",
      "primary_tools",
    ],
    optionalFields: [
      "ai_adoption_pct",
      "time_on_ai_tasks_pct",
      "baseline_throughput",
      "current_throughput",
      "skill_level",
      "work_pattern",
    ],
    ownerRole: "CHRO / CIO",
    refreshCadence: "quarterly",
    loadOrder: 2,
    unlocks: [
      "AI ROI can be measured at persona granularity",
      "Tower Productivity lens becomes answerable",
      "Agent outcomes can be attributed to specific workforce populations",
      ...UNIVERSAL_UNLOCKS,
    ],
  },
];

export const SUPPORTED_CONTEXT_UPLOAD_FORMATS: Exclude<
  UploadedFileFormat,
  "unknown"
>[] = [
  "csv",
  "xlsx",
  "json",
  "jsonl",
  "pdf",
  "docx",
  "pptx",
  "markdown",
  "yaml",
  "zip",
];

const FORMAT_SUPPORT_PROFILES: Record<
  Exclude<UploadedFileFormat, "unknown">,
  TemplateFormatSupportProfile
> = {
  csv: { format: "csv", nativeSupport: true, requiresConversion: false },
  xlsx: { format: "xlsx", nativeSupport: true, requiresConversion: false },
  json: { format: "json", nativeSupport: true, requiresConversion: false },
  jsonl: { format: "jsonl", nativeSupport: true, requiresConversion: false },
  pdf: { format: "pdf", nativeSupport: false, requiresConversion: true },
  docx: { format: "docx", nativeSupport: false, requiresConversion: true },
  pptx: { format: "pptx", nativeSupport: false, requiresConversion: true },
  markdown: {
    format: "markdown",
    nativeSupport: true,
    requiresConversion: false,
  },
  yaml: { format: "yaml", nativeSupport: true, requiresConversion: false },
  zip: { format: "zip", nativeSupport: false, requiresConversion: true },
};

function buildExceptionMetadataRequirements(
  acceptedFormats: UploadedFileFormat[],
): TemplateExceptionMetadataRequirement[] {
  return SUPPORTED_CONTEXT_UPLOAD_FORMATS.filter(
    (f) => !(acceptedFormats as string[]).includes(f),
  ).map((f) => ({
    label: FORMAT_SUPPORT_PROFILES[f].requiresConversion
      ? `${f.toUpperCase()} — conversion required`
      : `${f.toUpperCase()} — accepted with field mapping`,
    field: "format",
    required: false,
  }));
}

export const NORTHSTAR_CONTEXT_TEMPLATES: ContextTemplateDefinition[] = [
  [
    "enterprise-profile",
    "enterprise_profile",
    "Enterprise profile",
    ["markdown", "json", "pdf"],
    ["revenue_usd", "employees", "countries", "business_units"],
    ["debt_usd", "it_budget_usd"],
    "Chief Strategy Officer",
    "quarterly",
  ],
  [
    "financial-kpi-workbook",
    "financial_kpis",
    "Financial KPI workbook",
    ["xlsx", "csv"],
    ["period", "metric", "value", "currency_or_unit", "segment"],
    ["margin_bridge_driver", "source_report"],
    "CFO",
    "quarterly",
  ],
  [
    "annual-quarterly-reports",
    "annual_quarterly_reports",
    "Annual and quarterly reports",
    ["pdf", "pptx", "docx"],
    ["period", "reported_revenue", "reported_margin"],
    ["guidance", "risk_factor"],
    "Investor Relations",
    "quarterly",
  ],
  [
    "market-signals",
    "market_competitor_intel",
    "Market and competitor intel",
    ["csv", "markdown", "pdf"],
    ["signal_id", "market", "competitor", "claim"],
    ["source_url", "confidence"],
    "Chief Commercial Officer",
    "monthly",
  ],
  [
    "strategy-memo",
    "c_suite_strategy",
    "C-suite strategy memo",
    ["docx", "pdf", "markdown"],
    ["priority", "owner_role", "time_horizon"],
    ["dissent", "board_question"],
    "CEO Chief of Staff",
    "quarterly",
  ],
  [
    "segment-pnl",
    "business_units_segment_pnl",
    "Business unit segment P&L",
    ["xlsx", "csv"],
    ["segment", "revenue_usd", "gross_margin_pct", "operating_margin_pct"],
    ["r_and_d_usd", "sg_and_a_usd"],
    "CFO FP&A",
    "quarterly",
  ],
  [
    "product-portfolio",
    "product_portfolio",
    "Product portfolio",
    ["csv", "xlsx"],
    [
      "product_family_id",
      "business_unit",
      "revenue_usd",
      "margin_pct",
      "lifecycle_state",
    ],
    ["regulatory_burden", "plant_dependency"],
    "Chief Product Officer",
    "monthly",
  ],
  [
    "site-and-plant-inventory",
    "manufacturing_sites",
    "Site and plant inventory",
    ["csv", "xlsx"],
    [
      "site_id",
      "country",
      "business_unit",
      "primary_system",
      "validated_system_flag",
    ],
    ["quality_cost_usd", "capacity_utilization_pct"],
    "COO",
    "quarterly",
  ],
  [
    "erp-landscape-workbook",
    "erp_landscape",
    "ERP landscape workbook",
    ["xlsx", "csv"],
    [
      "erp_object_id",
      "platform",
      "process_area",
      "owner_role",
      "business_unit",
    ],
    ["customization_count", "tsa_dependency"],
    "CIO ERP Transformation",
    "monthly",
  ],
  [
    "application-portfolio",
    "application_portfolio",
    "CMDB / application portfolio",
    ["csv", "xlsx"],
    ["app_id", "name", "criticality", "owner_role", "system_of_record"],
    ["ams_vendor", "time_classification"],
    "VP Enterprise Architecture",
    "monthly",
  ],
  [
    "integration-topology",
    "integration_topology",
    "Integration topology",
    ["json", "jsonl", "csv"],
    ["edge_id", "source_app_id", "target_app_id", "integration_type"],
    ["latency_sla", "kill_blocker_flag"],
    "VP Enterprise Architecture",
    "monthly",
  ],
  [
    "vendor-contracts",
    "vendor_contracts",
    "Vendor contracts",
    ["csv", "xlsx", "pdf"],
    ["vendor_id", "vendor_name", "annual_value_usd", "renewal_date"],
    ["exit_terms", "ai_clauses", "data_rights"],
    "VP Procurement",
    "monthly",
  ],
  [
    "initiative-portfolio",
    "transformation_initiatives",
    "Transformation initiatives",
    ["xlsx", "csv", "json"],
    ["initiative_id", "title", "status", "sponsor_role", "committed_usd"],
    ["projected_value_usd", "linked_app_ids"],
    "Transformation PMO",
    "weekly",
  ],
  [
    "org-roles",
    "org_roles_teams",
    "Org, roles, and teams",
    ["csv", "xlsx", "json"],
    ["person_id", "name", "level", "role", "manager_id"],
    ["cost_center", "location"],
    "CHRO",
    "monthly",
  ],
  [
    "dora-baseline",
    "delivery_dora_devex",
    "Delivery / DORA / DevEx",
    ["csv", "xlsx", "json"],
    ["team_id", "measured_at", "deploy_freq_per_week", "lead_time_hours"],
    ["mttr_hours", "change_failure_rate_pct"],
    "VP Engineering",
    "weekly",
  ],
  [
    "qms-events",
    "regulatory_qms_risk",
    "Regulatory / QMS / risk",
    ["csv", "xlsx", "pdf"],
    ["event_id", "event_type", "product_family_id", "severity", "opened_at"],
    ["capa_id", "audit_reference"],
    "Chief Quality Officer",
    "weekly",
  ],
  [
    "ai-tool-footprint",
    "ai_tooling_model_inventory",
    "AI tooling and model inventory",
    ["csv", "xlsx", "json"],
    ["tool_id", "tool_name", "owner_role", "workflow", "risk_classification"],
    ["model_name", "regulated_workflow_flag"],
    "AI Governance Lead",
    "monthly",
  ],
  [
    "incidents-change-history",
    "incidents_ops_telemetry",
    "Incidents and ops telemetry",
    ["csv", "json", "jsonl"],
    ["incident_id", "system_id", "severity", "opened_at"],
    ["closed_at", "root_cause"],
    "VP IT Operations",
    "weekly",
  ],
  [
    "infrastructure-estate",
    "infrastructure_estate",
    "Infrastructure estate",
    ["csv", "xlsx", "json"],
    ["asset_name", "asset_class", "make_model", "location"],
    ["virtualization", "cloud_account", "capacity", "owner"],
    "VP Infrastructure",
    "monthly",
  ],
  [
    "business-capability-map",
    "business_capability",
    "Business capability map",
    ["csv", "xlsx", "json", "markdown"],
    ["capability_name", "business_function"],
    ["value_stream", "owner"],
    "Enterprise Architect",
    "quarterly",
  ],
  [
    "sla-register",
    "service_levels",
    "Service level register",
    ["csv", "xlsx", "json"],
    ["sla_id", "service_name", "metric", "target", "measurement_window"],
    ["actual", "breach_count", "credit_at_risk_usd", "tower", "owner_role"],
    "VP IT Service Management",
    "monthly",
  ],
].map(
  ([
    id,
    dimension,
    label,
    acceptedFormats,
    requiredFields,
    optionalFields,
    ownerRole,
    refreshCadence,
  ]) => ({
    id: id as string,
    dimension: dimension as ContextDimension,
    label: label as string,
    acceptedFormats: acceptedFormats as UploadedFileFormat[],
    exceptionFormats: SUPPORTED_CONTEXT_UPLOAD_FORMATS.filter(
      (format) => !(acceptedFormats as UploadedFileFormat[]).includes(format),
    ),
    formatProfiles: SUPPORTED_CONTEXT_UPLOAD_FORMATS.map(
      (format) => FORMAT_SUPPORT_PROFILES[format],
    ),
    requiredFields: requiredFields as string[],
    optionalFields: optionalFields as string[],
    ownerRole: ownerRole as string,
    refreshCadence: refreshCadence as string,
    exceptionMetadataRequirements: buildExceptionMetadataRequirements(
      acceptedFormats as UploadedFileFormat[],
    ),
    unlocks: [
      "Evidence chips cite uploaded source locators",
      "Sentinel can answer tenant-grounded questions",
      "Source and Tower can reason from approved context",
    ],
  }),
);

const MERIDIAN_UNLOCKS = [
  "Evidence chips cite uploaded healthcare source locators",
  "Sentinel can answer Meridian/PHS questions only after tenant-scoped chunks are embedded",
  "Source and Tower stay pending until approval and embedding evidence exists",
];

export const MERIDIAN_CONTEXT_TEMPLATES: ContextTemplateDefinition[] = [
  {
    id: "enterprise-profile",
    dimension: "enterprise_profile",
    label: "Healthcare enterprise profile",
    acceptedFormats: ["yaml", "json"],
    requiredFields: ["metric", "value", "period", "source"],
    optionalFields: [],
    ownerRole: "Chief Strategy Officer",
    refreshCadence: "quarterly",
    unlocks: MERIDIAN_UNLOCKS,
  },
  {
    id: "application-portfolio",
    dimension: "application_portfolio",
    label: "Healthcare application portfolio",
    acceptedFormats: ["csv"],
    requiredFields: [
      "app_id",
      "name",
      "vendor",
      "category",
      "clinical_criticality",
      "run_cost_fy25_usd",
    ],
    optionalFields: [],
    ownerRole: "VP Enterprise Applications",
    refreshCadence: "monthly",
    unlocks: MERIDIAN_UNLOCKS,
  },
  {
    id: "epic-module-inventory",
    dimension: "ehr_platform",
    label: "Epic module inventory",
    acceptedFormats: ["csv"],
    requiredFields: [
      "module",
      "owning_service_line",
      "optimization_state",
      "workflow_risk",
    ],
    optionalFields: [],
    ownerRole: "VP Clinical Applications",
    refreshCadence: "monthly",
    unlocks: MERIDIAN_UNLOCKS,
  },
  {
    id: "hl7-fhir-integration-topology",
    dimension: "interoperability_topology",
    label: "HL7/FHIR integration topology",
    acceptedFormats: ["json"],
    requiredFields: ["edge_id", "source", "target", "standard", "data_class"],
    optionalFields: [],
    ownerRole: "Integration Architecture Lead",
    refreshCadence: "monthly",
    unlocks: MERIDIAN_UNLOCKS,
  },
  {
    id: "prior-auth-workqueue",
    dimension: "prior_authorization",
    label: "Prior authorization workqueue",
    acceptedFormats: ["csv"],
    requiredFields: [
      "payer",
      "service_line",
      "volume",
      "denial_rate_pct",
      "automation_readiness",
    ],
    optionalFields: [],
    ownerRole: "VP Revenue Cycle",
    refreshCadence: "weekly",
    unlocks: MERIDIAN_UNLOCKS,
  },
  {
    id: "rcm-denials",
    dimension: "revenue_cycle_denials",
    label: "Revenue cycle denials",
    acceptedFormats: ["csv"],
    requiredFields: [
      "denial_category",
      "payer",
      "monthly_cases",
      "recoverable_usd",
      "root_cause",
    ],
    optionalFields: [],
    ownerRole: "Revenue Integrity Director",
    refreshCadence: "weekly",
    unlocks: MERIDIAN_UNLOCKS,
  },
  {
    id: "ambient-documentation-pilot",
    dimension: "ambient_clinical_documentation",
    label: "Ambient documentation pilot",
    acceptedFormats: ["csv"],
    requiredFields: [
      "specialty",
      "vendor",
      "clinicians",
      "note_time_delta_min",
      "adoption_pct",
    ],
    optionalFields: [],
    ownerRole: "CMIO",
    refreshCadence: "weekly",
    unlocks: MERIDIAN_UNLOCKS,
  },
  {
    id: "clinical-ai-model-inventory",
    dimension: "clinical_ai_model_inventory",
    label: "Clinical AI model inventory",
    acceptedFormats: ["csv"],
    requiredFields: [
      "model_id",
      "use_case",
      "risk_class",
      "clinical_owner",
      "validation_status",
    ],
    optionalFields: [],
    ownerRole: "AI Governance Lead",
    refreshCadence: "monthly",
    unlocks: MERIDIAN_UNLOCKS,
  },
  {
    id: "hipaa-ai-controls",
    dimension: "hipaa_ai_controls",
    label: "HIPAA AI controls",
    acceptedFormats: ["csv"],
    requiredFields: [
      "control_id",
      "control_area",
      "system",
      "phi_touch",
      "status",
    ],
    optionalFields: [],
    ownerRole: "Chief Privacy Officer",
    refreshCadence: "quarterly",
    unlocks: MERIDIAN_UNLOCKS,
  },
  {
    id: "vendor-baa-contracts",
    dimension: "vendor_baa_contracts",
    label: "Vendor BAA contracts",
    acceptedFormats: ["csv"],
    requiredFields: [
      "vendor",
      "contract_id",
      "baa_status",
      "ai_clause_status",
      "renewal_date",
    ],
    optionalFields: [],
    ownerRole: "VP Procurement",
    refreshCadence: "monthly",
    unlocks: MERIDIAN_UNLOCKS,
  },
  {
    id: "service-line-pnl",
    dimension: "service_line_pnl",
    label: "Service line P&L",
    acceptedFormats: ["csv"],
    requiredFields: [
      "service_line",
      "net_revenue_usd",
      "direct_margin_pct",
      "avoidable_cost_usd",
    ],
    optionalFields: [],
    ownerRole: "CFO FP&A",
    refreshCadence: "monthly",
    unlocks: MERIDIAN_UNLOCKS,
  },
  {
    id: "workforce-scheduling",
    dimension: "workforce_scheduling",
    label: "Workforce scheduling",
    acceptedFormats: ["csv"],
    requiredFields: [
      "unit",
      "open_shifts",
      "premium_labor_usd",
      "forecast_accuracy_pct",
    ],
    optionalFields: [],
    ownerRole: "Chief Nursing Officer",
    refreshCadence: "weekly",
    unlocks: MERIDIAN_UNLOCKS,
  },
  {
    id: "patient-access-contact-center",
    dimension: "patient_access",
    label: "Patient access contact center",
    acceptedFormats: ["csv"],
    requiredFields: [
      "queue",
      "call_volume",
      "abandon_rate_pct",
      "digital_deflection_pct",
    ],
    optionalFields: [],
    ownerRole: "VP Patient Access",
    refreshCadence: "weekly",
    unlocks: MERIDIAN_UNLOCKS,
  },
  {
    id: "imaging-ai-worklist",
    dimension: "imaging_ai_triage",
    label: "Imaging AI worklist",
    acceptedFormats: ["csv"],
    requiredFields: [
      "modality",
      "algorithm",
      "study_volume",
      "turnaround_delta_min",
      "safety_review_state",
    ],
    optionalFields: [],
    ownerRole: "Radiology Chair",
    refreshCadence: "weekly",
    unlocks: MERIDIAN_UNLOCKS,
  },
  {
    id: "cms-interoperability",
    dimension: "cms_interoperability",
    label: "CMS interoperability",
    acceptedFormats: ["csv"],
    requiredFields: [
      "requirement",
      "system",
      "deadline",
      "readiness_state",
      "blocker",
    ],
    optionalFields: [],
    ownerRole: "Interoperability Program Director",
    refreshCadence: "monthly",
    unlocks: MERIDIAN_UNLOCKS,
  },
  {
    id: "dora-baseline",
    dimension: "delivery_dora_devex",
    label: "Healthcare delivery / DORA / DevEx",
    acceptedFormats: ["csv"],
    requiredFields: [
      "team",
      "deploy_frequency",
      "lead_time_hours",
      "change_failure_rate_pct",
    ],
    optionalFields: [],
    ownerRole: "VP Engineering",
    refreshCadence: "weekly",
    unlocks: MERIDIAN_UNLOCKS,
  },
  {
    id: "incident-change-history",
    dimension: "incidents_ops_telemetry",
    label: "Incident and change history",
    acceptedFormats: ["csv"],
    requiredFields: [
      "event_id",
      "system",
      "severity",
      "clinical_impact",
      "root_cause",
    ],
    optionalFields: [],
    ownerRole: "VP IT Operations",
    refreshCadence: "weekly",
    unlocks: MERIDIAN_UNLOCKS,
  },
  {
    id: "value-based-care-panel",
    dimension: "value_based_care",
    label: "Value-based care panel",
    acceptedFormats: ["csv"],
    requiredFields: [
      "contract",
      "covered_lives",
      "risk_pool_usd",
      "quality_gap",
      "ai_use_case",
    ],
    optionalFields: [],
    ownerRole: "Chief Population Health Officer",
    refreshCadence: "monthly",
    unlocks: MERIDIAN_UNLOCKS,
  },
  {
    id: "population-health-risk-panels",
    dimension: "population_health",
    label: "Population health risk panels",
    acceptedFormats: ["csv"],
    requiredFields: [
      "panel",
      "patients",
      "risk_signal",
      "intervention_owner",
      "outcome_metric",
    ],
    optionalFields: [],
    ownerRole: "VP Population Health Analytics",
    refreshCadence: "monthly",
    unlocks: MERIDIAN_UNLOCKS,
  },
  {
    id: "data-platform-lineage",
    dimension: "data_platform_lineage",
    label: "Data platform lineage",
    acceptedFormats: ["csv"],
    requiredFields: [
      "data_product",
      "source_system",
      "phi_class",
      "refresh_sla",
      "quality_score",
    ],
    optionalFields: [],
    ownerRole: "Chief Data Officer",
    refreshCadence: "monthly",
    unlocks: MERIDIAN_UNLOCKS,
  },
  {
    id: "patient-digital-front-door",
    dimension: "digital_front_door",
    label: "Patient digital front door",
    acceptedFormats: ["csv"],
    requiredFields: [
      "journey",
      "channel",
      "conversion_rate_pct",
      "dropoff_reason",
      "owner",
    ],
    optionalFields: [],
    ownerRole: "Chief Digital Officer",
    refreshCadence: "monthly",
    unlocks: MERIDIAN_UNLOCKS,
  },
  {
    id: "supply-chain-pharmacy",
    dimension: "supply_chain_pharmacy",
    label: "Supply chain and pharmacy",
    acceptedFormats: ["csv"],
    requiredFields: [
      "category",
      "annual_spend_usd",
      "shortage_risk",
      "ai_opportunity",
      "owner",
    ],
    optionalFields: [],
    ownerRole: "Chief Supply Chain Officer",
    refreshCadence: "monthly",
    unlocks: MERIDIAN_UNLOCKS,
  },
  {
    id: "governance-committee-decisions",
    dimension: "ai_governance_decisions",
    label: "AI governance committee decisions",
    acceptedFormats: ["csv"],
    requiredFields: [
      "decision_id",
      "use_case",
      "decision",
      "conditions",
      "review_date",
    ],
    optionalFields: [],
    ownerRole: "AI Governance Council Chair",
    refreshCadence: "monthly",
    unlocks: MERIDIAN_UNLOCKS,
  },
  {
    id: "security-downtime-readiness",
    dimension: "clinical_downtime_cyber",
    label: "Clinical downtime and cyber readiness",
    acceptedFormats: ["csv"],
    requiredFields: [
      "system",
      "downtime_tier",
      "rto_hours",
      "clinical_workaround",
      "last_drill_date",
    ],
    optionalFields: [],
    ownerRole: "CISO",
    refreshCadence: "quarterly",
    unlocks: MERIDIAN_UNLOCKS,
  },
  {
    id: "nursing-workload-acuity",
    dimension: "nursing_workload_acuity",
    label: "Nursing workload and acuity",
    acceptedFormats: ["csv"],
    requiredFields: [
      "unit",
      "patient_days",
      "acuity_index",
      "nurse_hours_per_patient_day",
      "burnout_signal",
    ],
    optionalFields: [],
    ownerRole: "Chief Nursing Officer",
    refreshCadence: "weekly",
    unlocks: MERIDIAN_UNLOCKS,
  },
  {
    id: "ai-tool-footprint",
    dimension: "ai_tooling_model_inventory",
    label: "Healthcare AI tool footprint",
    acceptedFormats: ["csv"],
    requiredFields: [
      "tool",
      "owner",
      "workflow",
      "phi_access",
      "monthly_spend_usd",
    ],
    optionalFields: [],
    ownerRole: "AI Governance Lead",
    refreshCadence: "monthly",
    unlocks: MERIDIAN_UNLOCKS,
  },
];

export const RUNTIME_CONTEXT_TEMPLATES: ContextTemplateDefinition[] = [
  ...UNIVERSAL_CONTEXT_TEMPLATES,
  ...NORTHSTAR_CONTEXT_TEMPLATES,
  ...MERIDIAN_CONTEXT_TEMPLATES,
];

export function getTemplateFormatCoverage(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const format of SUPPORTED_CONTEXT_UPLOAD_FORMATS) counts[format] = 0;
  for (const template of RUNTIME_CONTEXT_TEMPLATES) {
    for (const format of template.acceptedFormats) {
      if (format !== "unknown") counts[format] = (counts[format] ?? 0) + 1;
    }
  }
  return counts;
}

function isMeridianTenant(tenantKey?: string | null): boolean {
  const normalized = tenantKey?.trim().toLowerCase().replace(/_/g, "-");
  return (
    normalized === "meridian" ||
    normalized === "meridian-health" ||
    normalized === "phs" ||
    normalized === "phs-meridian"
  );
}

function isNorthstarTenant(tenantKey?: string | null): boolean {
  const normalized = tenantKey?.trim().toLowerCase().replace(/_/g, "-");
  return normalized === "northstar" || normalized === "northstar-clinical";
}

export function getTemplatesForTenant(
  tenantKey?: string | null,
): ContextTemplateDefinition[] {
  if (isMeridianTenant(tenantKey)) return MERIDIAN_CONTEXT_TEMPLATES;
  if (isNorthstarTenant(tenantKey)) return NORTHSTAR_CONTEXT_TEMPLATES;
  return UNIVERSAL_CONTEXT_TEMPLATES;
}

export function getTemplatesForTenantWithFallback(
  tenantKey?: string | null,
): ContextTemplateDefinition[] {
  const primary = getTemplatesForTenant(tenantKey);
  if (primary === UNIVERSAL_CONTEXT_TEMPLATES) return primary;
  return [...primary, ...UNIVERSAL_CONTEXT_TEMPLATES];
}

export function getTemplateById(
  id: string,
  options: TemplateLookupOptions = {},
): ContextTemplateDefinition | null {
  const tenantTemplates = getTemplatesForTenant(options.tenantKey);
  return (
    tenantTemplates.find((template) => template.id === id) ??
    NORTHSTAR_CONTEXT_TEMPLATES.find((template) => template.id === id) ??
    MERIDIAN_CONTEXT_TEMPLATES.find((template) => template.id === id) ??
    null
  );
}

export function getTemplateForDimension(
  dimension: ContextDimension,
  options: TemplateLookupOptions = {},
): ContextTemplateDefinition | null {
  const tenantTemplates = getTemplatesForTenant(options.tenantKey);
  return (
    tenantTemplates.find((template) => template.dimension === dimension) ??
    NORTHSTAR_CONTEXT_TEMPLATES.find(
      (template) => template.dimension === dimension,
    ) ??
    MERIDIAN_CONTEXT_TEMPLATES.find(
      (template) => template.dimension === dimension,
    ) ??
    null
  );
}
