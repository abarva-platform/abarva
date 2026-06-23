import type { ContextDimension, UploadedFileFormat } from "./types";
import { PHS_PHASE0_TEMPLATE_DEFINITIONS } from "./phs-phase0-templates";

export type TemplateParserMode =
  | "structured_rows"
  | "workbook_sheets"
  | "document_facts"
  | "slide_facts"
  | "json_records"
  | "batch_archive";

export interface TemplateFormatSupportProfile {
  format: Exclude<UploadedFileFormat, "unknown">;
  parserMode: TemplateParserMode;
  parserLabel: string;
  requiresMetadataForException: boolean;
}

export interface TemplateExceptionMetadataRequirement {
  key: string;
  label: string;
  purpose: string;
  requiredForFormats: Exclude<UploadedFileFormat, "unknown">[];
}

export interface ContextTemplateDefinition {
  id: string;
  dimension: ContextDimension;
  label: string;
  acceptedFormats: UploadedFileFormat[];
  exceptionFormats: Exclude<UploadedFileFormat, "unknown">[];
  formatProfiles: TemplateFormatSupportProfile[];
  requiredFields: string[];
  optionalFields: string[];
  ownerRole: string;
  refreshCadence: string;
  exceptionMetadataRequirements: TemplateExceptionMetadataRequirement[];
  unlocks: string[];
  enumValues?: Record<string, string[]>;
}

type ContextTemplateSeed = Omit<
  ContextTemplateDefinition,
  "exceptionFormats" | "formatProfiles" | "exceptionMetadataRequirements"
>;

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
  csv: {
    format: "csv",
    parserMode: "structured_rows",
    parserLabel:
      "Delimited table with header row and deterministic column mapping",
    requiresMetadataForException: false,
  },
  xlsx: {
    format: "xlsx",
    parserMode: "workbook_sheets",
    parserLabel: "Workbook sheets with sheet map, header row, units, and grain",
    requiresMetadataForException: false,
  },
  json: {
    format: "json",
    parserMode: "json_records",
    parserLabel: "JSON records with declared root path and field mapping",
    requiresMetadataForException: true,
  },
  jsonl: {
    format: "jsonl",
    parserMode: "json_records",
    parserLabel:
      "Line-delimited JSON records with declared record path and field mapping",
    requiresMetadataForException: true,
  },
  pdf: {
    format: "pdf",
    parserMode: "document_facts",
    parserLabel:
      "Document facts with page anchors, section scope, and metric dictionary",
    requiresMetadataForException: true,
  },
  docx: {
    format: "docx",
    parserMode: "document_facts",
    parserLabel:
      "Document facts with heading anchors, section scope, and metric dictionary",
    requiresMetadataForException: true,
  },
  pptx: {
    format: "pptx",
    parserMode: "slide_facts",
    parserLabel:
      "Slide facts with slide anchors, KPI callouts, and source notes",
    requiresMetadataForException: true,
  },
  markdown: {
    format: "markdown",
    parserMode: "document_facts",
    parserLabel:
      "Markdown facts with heading anchors and explicit source links",
    requiresMetadataForException: true,
  },
  yaml: {
    format: "yaml",
    parserMode: "json_records",
    parserLabel: "YAML records with declared root path and field mapping",
    requiresMetadataForException: true,
  },
  zip: {
    format: "zip",
    parserMode: "batch_archive",
    parserLabel:
      "Batch archive with manifest, per-file template mapping, and quarantine scan",
    requiresMetadataForException: true,
  },
};

const BASE_EXCEPTION_METADATA: TemplateExceptionMetadataRequirement[] = [
  {
    key: "source_system",
    label: "Source system",
    purpose: "Names the system, report, or team that produced the file.",
    requiredForFormats: SUPPORTED_CONTEXT_UPLOAD_FORMATS,
  },
  {
    key: "data_owner",
    label: "Data owner",
    purpose:
      "Identifies the human accountable for the load and later clarification.",
    requiredForFormats: SUPPORTED_CONTEXT_UPLOAD_FORMATS,
  },
  {
    key: "sensitivity_declaration",
    label: "Sensitivity declaration",
    purpose:
      "Confirms whether the file contains PHI, PII, payroll, contract, financial, or regulated data.",
    requiredForFormats: SUPPORTED_CONTEXT_UPLOAD_FORMATS,
  },
  {
    key: "field_mapping",
    label: "Field mapping",
    purpose:
      "Maps client columns, JSON paths, pages, headings, or slide callouts to AbarVa template fields.",
    requiredForFormats: SUPPORTED_CONTEXT_UPLOAD_FORMATS,
  },
  {
    key: "parse_instructions",
    label: "Parse instructions",
    purpose:
      "Explains exclusions, rollups, fiscal calendar, units, and any client-specific conventions.",
    requiredForFormats: SUPPORTED_CONTEXT_UPLOAD_FORMATS,
  },
];

const STRUCTURED_EXCEPTION_METADATA: TemplateExceptionMetadataRequirement[] = [
  {
    key: "record_grain",
    label: "Record grain",
    purpose:
      "Defines whether each row is an app, vendor, person, metric-period, site, incident, or initiative.",
    requiredForFormats: ["csv", "xlsx", "json", "jsonl"],
  },
  {
    key: "header_row",
    label: "Header row or record path",
    purpose:
      "Names the workbook sheet/header row or JSON path that contains the canonical records.",
    requiredForFormats: ["xlsx", "json", "jsonl"],
  },
];

const DOCUMENT_EXCEPTION_METADATA: TemplateExceptionMetadataRequirement[] = [
  {
    key: "document_purpose",
    label: "Document purpose",
    purpose:
      "Declares whether the document is annual results, KPI evidence, org structure, contract evidence, or strategy context.",
    requiredForFormats: ["pdf", "docx", "pptx", "markdown"],
  },
  {
    key: "authoritative_sections",
    label: "Authoritative sections",
    purpose:
      "Names the pages, headings, tables, or slides AbarVa should treat as authoritative.",
    requiredForFormats: ["pdf", "docx", "pptx", "markdown"],
  },
  {
    key: "metric_dictionary",
    label: "Metric dictionary",
    purpose:
      "Defines KPI names, formulas, currencies, units, time periods, and source-of-truth precedence.",
    requiredForFormats: ["pdf", "docx", "pptx", "markdown"],
  },
];

const ARCHIVE_EXCEPTION_METADATA: TemplateExceptionMetadataRequirement[] = [
  {
    key: "archive_manifest",
    label: "Archive manifest",
    purpose:
      "Lists every file in a batch, expected template, sensitivity class, and owner.",
    requiredForFormats: ["zip"],
  },
];

function buildExceptionMetadataRequirements(
  acceptedFormats: UploadedFileFormat[],
): TemplateExceptionMetadataRequirement[] {
  const accepted = new Set(acceptedFormats);
  const all = [
    ...BASE_EXCEPTION_METADATA,
    ...STRUCTURED_EXCEPTION_METADATA,
    ...DOCUMENT_EXCEPTION_METADATA,
    ...ARCHIVE_EXCEPTION_METADATA,
  ];
  return all.filter((requirement) =>
    requirement.requiredForFormats.some(
      (format) =>
        !accepted.has(format) ||
        FORMAT_SUPPORT_PROFILES[format].requiresMetadataForException,
    ),
  );
}

export function getFormatSupportProfile(
  format: UploadedFileFormat,
): TemplateFormatSupportProfile | null {
  if (format === "unknown") return null;
  return FORMAT_SUPPORT_PROFILES[format] ?? null;
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

const IT_SYSTEM_LANDSCAPE_ENUM_VALUES: Record<string, string[]> = {
  domain_segment: [
    "DATA_ANALYTICS",
    "ERP",
    "DIGITAL_CX",
    "OPERATIONS",
    "INFRASTRUCTURE",
    "SECURITY_IDENTITY",
    "HR_WORKFORCE",
    "COLLABORATION",
  ],
  business_function: [
    "FINANCE",
    "SUPPLY_CHAIN",
    "HUMAN_RESOURCES",
    "OPERATIONS",
    "COMMERCIAL_SALES",
    "IT",
    "COMPLIANCE_LEGAL",
    "CORPORATE",
    "INDUSTRY_OPS",
  ],
  criticality: ["TIER_1", "TIER_2", "TIER_3"],
};

const VENDOR_CONTRACTS_ENUM_VALUES: Record<string, string[]> = {
  vendor_category: [
    "SOFTWARE_SAAS",
    "PROFESSIONAL_SERVICES",
    "HARDWARE",
    "CLOUD_SERVICES",
    "MANAGED_SERVICES",
    "TELCO",
    "DATA_SERVICES",
  ],
  auto_renew: ["YES", "NO", "UNKNOWN"],
  business_function: [
    "FINANCE",
    "SUPPLY_CHAIN",
    "HUMAN_RESOURCES",
    "OPERATIONS",
    "COMMERCIAL_SALES",
    "IT",
    "COMPLIANCE_LEGAL",
    "CORPORATE",
    "INDUSTRY_OPS",
  ],
};

const INFRASTRUCTURE_DC_ENUM_VALUES: Record<string, string[]> = {
  environment: ["PRODUCTION", "DR", "DEV", "STAGING", "SANDBOX"],
  provider: ["AWS", "AZURE", "GCP", "ON_PREM", "COLOCATION", "PRIVATE_CLOUD"],
  tier: ["TIER_1", "TIER_2", "TIER_3"],
};

const NORTHSTAR_CANONICAL_TEMPLATES: ContextTemplateDefinition[] = [
  {
    id: "it-system-landscape-canonical",
    dimension: "it_landscape",
    label: "IT system landscape (canonical)",
    acceptedFormats: ["csv", "xlsx"],
    exceptionFormats: SUPPORTED_CONTEXT_UPLOAD_FORMATS.filter(
      (format) => !(["csv", "xlsx"] as UploadedFileFormat[]).includes(format),
    ),
    formatProfiles: SUPPORTED_CONTEXT_UPLOAD_FORMATS.map(
      (format) => FORMAT_SUPPORT_PROFILES[format],
    ),
    requiredFields: [
      "system_id",
      "system_name",
      "vendor_name",
      "domain_segment",
      "business_function",
      "it_owner_name",
      "criticality",
      "status",
      "hosting_model",
      "active_users",
      "contract_end_date",
      "annual_cost_usd",
    ],
    optionalFields: [
      "version_release",
      "cmdb_ci_id",
      "integration_dependencies",
      "data_classification",
      "ai_enabled",
      "decommission_target_date",
      "sla_tier",
    ],
    ownerRole: "VP Enterprise Architecture",
    refreshCadence: "monthly",
    exceptionMetadataRequirements: buildExceptionMetadataRequirements([
      "csv",
      "xlsx",
    ]),
    unlocks: [
      "Evidence chips cite uploaded source locators",
      "Sentinel can answer tenant-grounded questions",
      "Source and Tower can reason from approved context",
    ],
    enumValues: IT_SYSTEM_LANDSCAPE_ENUM_VALUES,
  },
  {
    id: "vendor-contracts-canonical",
    dimension: "vendor_contracts",
    label: "Vendor contracts (canonical)",
    acceptedFormats: ["csv", "xlsx"],
    exceptionFormats: SUPPORTED_CONTEXT_UPLOAD_FORMATS.filter(
      (format) => !(["csv", "xlsx"] as UploadedFileFormat[]).includes(format),
    ),
    formatProfiles: SUPPORTED_CONTEXT_UPLOAD_FORMATS.map(
      (format) => FORMAT_SUPPORT_PROFILES[format],
    ),
    requiredFields: [
      "vendor_id",
      "vendor_name",
      "vendor_category",
      "contract_type",
      "annual_value_usd",
      "contract_start_date",
      "contract_end_date",
      "auto_renew",
      "notice_period_days",
      "business_function",
      "it_owner_name",
      "systems_covered",
    ],
    optionalFields: [
      "benchmark_present",
      "benchmark_source",
      "single_source_risk",
      "exit_plan",
      "sla_reference",
      "last_renegotiation_date",
    ],
    ownerRole: "VP Procurement",
    refreshCadence: "monthly",
    exceptionMetadataRequirements: buildExceptionMetadataRequirements([
      "csv",
      "xlsx",
    ]),
    unlocks: [
      "Evidence chips cite uploaded source locators",
      "Sentinel can answer tenant-grounded questions",
      "Source and Tower can reason from approved context",
    ],
    enumValues: VENDOR_CONTRACTS_ENUM_VALUES,
  },
  {
    id: "infrastructure-dc",
    dimension: "infrastructure_dc",
    label: "Infrastructure and data centre",
    acceptedFormats: ["csv", "xlsx"],
    exceptionFormats: SUPPORTED_CONTEXT_UPLOAD_FORMATS.filter(
      (format) => !(["csv", "xlsx"] as UploadedFileFormat[]).includes(format),
    ),
    formatProfiles: SUPPORTED_CONTEXT_UPLOAD_FORMATS.map(
      (format) => FORMAT_SUPPORT_PROFILES[format],
    ),
    requiredFields: [
      "infra_id",
      "environment",
      "location",
      "provider",
      "tier",
      "monthly_cost_usd",
      "systems_hosted",
      "dr_rto_hours",
      "dr_rpo_hours",
    ],
    optionalFields: [
      "power_capacity_kw",
      "connectivity",
      "compliance_certifications",
    ],
    ownerRole: "VP Infrastructure & Cloud",
    refreshCadence: "quarterly",
    exceptionMetadataRequirements: buildExceptionMetadataRequirements([
      "csv",
      "xlsx",
    ]),
    unlocks: [
      "Evidence chips cite uploaded source locators",
      "Sentinel can answer tenant-grounded questions",
      "Source and Tower can reason from approved context",
    ],
    enumValues: INFRASTRUCTURE_DC_ENUM_VALUES,
  },
];

// Append canonical templates into the northstar array
NORTHSTAR_CONTEXT_TEMPLATES.push(...NORTHSTAR_CANONICAL_TEMPLATES);

const FIRST_CAPITAL_V2_UNLOCKS = [
  "Context records carry dimension-family metadata for Intelligence and Tower slicing",
  "Evidence chips can cite the uploaded monthly template source row",
  "Atlas can answer by business function, domain segment, owner, initiative, spend, risk, and productivity lens",
];

function materializeTemplateSeed(
  template: ContextTemplateSeed,
): ContextTemplateDefinition {
  return {
    ...template,
    exceptionFormats: SUPPORTED_CONTEXT_UPLOAD_FORMATS.filter(
      (format) => !template.acceptedFormats.includes(format),
    ),
    formatProfiles: SUPPORTED_CONTEXT_UPLOAD_FORMATS.map(
      (format) => FORMAT_SUPPORT_PROFILES[format],
    ),
    exceptionMetadataRequirements: buildExceptionMetadataRequirements(
      template.acceptedFormats,
    ),
  };
}

const FIRST_CAPITAL_V2_TEMPLATE_SEEDS: ContextTemplateSeed[] = [
  {
    id: "business-org-functions",
    dimension: "business_org_functions",
    label: "Business org functions",
    acceptedFormats: ["csv", "xlsx"],
    requiredFields: ["function_id", "function_name"],
    optionalFields: ["executive_owner_role", "head_count", "description"],
    ownerRole: "Chief Operating Officer",
    refreshCadence: "monthly",
    unlocks: FIRST_CAPITAL_V2_UNLOCKS,
  },
  {
    id: "it-org-ownership",
    dimension: "it_org_ownership",
    label: "IT org ownership",
    acceptedFormats: ["csv", "xlsx"],
    requiredFields: ["team_id", "team_name"],
    optionalFields: [
      "it_owner_role",
      "domain",
      "head_count_fte",
      "offshore_pct",
      "onshore_pct",
    ],
    ownerRole: "CIO",
    refreshCadence: "monthly",
    unlocks: FIRST_CAPITAL_V2_UNLOCKS,
  },
  {
    id: "personas-workforce",
    dimension: "personas_workforce",
    label: "Personas and workforce",
    acceptedFormats: ["csv", "xlsx"],
    requiredFields: ["persona_id", "persona_name", "business_function"],
    optionalFields: [
      "primary_capability",
      "it_owner_team",
      "head_count",
      "primary_tools",
      "ai_adoption_pct",
      "baseline_throughput",
      "current_throughput",
      "ai_status",
      "notes",
    ],
    ownerRole: "Chief Human Resources Officer",
    refreshCadence: "monthly",
    unlocks: FIRST_CAPITAL_V2_UNLOCKS,
  },
  {
    id: "capabilities-value-streams",
    dimension: "capabilities_value_streams",
    label: "Capabilities and value streams",
    acceptedFormats: ["csv", "xlsx"],
    requiredFields: ["capability_id", "capability_name"],
    optionalFields: [
      "business_function",
      "value_stream",
      "ai_maturity",
      "description",
    ],
    ownerRole: "Enterprise Architecture",
    refreshCadence: "quarterly",
    unlocks: FIRST_CAPITAL_V2_UNLOCKS,
  },
  {
    id: "applications-systems",
    dimension: "applications_systems",
    label: "Applications and systems",
    acceptedFormats: ["csv", "xlsx"],
    requiredFields: ["app_id", "name", "vendor"],
    optionalFields: [
      "category",
      "it_owner_team",
      "business_function",
      "deployment",
      "lifecycle_stage",
      "criticality",
      "run_cost_fy25_usd",
      "primary_dataclass",
      "integration_count",
      "ai_eligibility_score",
    ],
    ownerRole: "VP Enterprise Applications",
    refreshCadence: "monthly",
    unlocks: FIRST_CAPITAL_V2_UNLOCKS,
  },
  {
    id: "system-function-mapping",
    dimension: "system_function_mapping",
    label: "System to function mapping",
    acceptedFormats: ["csv", "xlsx"],
    requiredFields: ["mapping_id", "app_id", "capability_id"],
    optionalFields: ["support_type", "process_area", "user_count", "module"],
    ownerRole: "Enterprise Architecture",
    refreshCadence: "monthly",
    unlocks: FIRST_CAPITAL_V2_UNLOCKS,
  },
  {
    id: "infrastructure-cloud",
    dimension: "infrastructure_cloud",
    label: "Infrastructure and cloud",
    acceptedFormats: ["csv", "xlsx"],
    requiredFields: ["resource_id", "resource_type", "provider"],
    optionalFields: [
      "region",
      "criticality",
      "owner_team",
      "environment",
      "monthly_cost_usd",
      "notes",
    ],
    ownerRole: "VP Infrastructure",
    refreshCadence: "monthly",
    unlocks: FIRST_CAPITAL_V2_UNLOCKS,
  },
  {
    id: "platform-volumetrics",
    dimension: "platform_volumetrics",
    label: "Platform volumetrics",
    acceptedFormats: ["csv", "xlsx"],
    requiredFields: ["platform_id", "metric_name", "period"],
    optionalFields: ["value", "unit", "capacity", "capacity_pct", "notes"],
    ownerRole: "VP Infrastructure",
    refreshCadence: "monthly",
    unlocks: FIRST_CAPITAL_V2_UNLOCKS,
  },
  {
    id: "data-analytics-estate",
    dimension: "data_analytics_estate",
    label: "Data and analytics estate",
    acceptedFormats: ["csv", "xlsx"],
    requiredFields: ["data_product_id", "name", "source_system"],
    optionalFields: [
      "owner_team",
      "data_class",
      "refresh_sla",
      "quality_score",
      "lineage_documented",
      "notes",
    ],
    ownerRole: "Chief Data Officer",
    refreshCadence: "monthly",
    unlocks: FIRST_CAPITAL_V2_UNLOCKS,
  },
  {
    id: "integrations-interfaces",
    dimension: "integrations_interfaces",
    label: "Integrations and interfaces",
    acceptedFormats: ["csv", "jsonl", "xlsx"],
    requiredFields: ["edge_id", "source_app_id", "target_app_id"],
    optionalFields: [
      "integration_type",
      "direction",
      "monitored",
      "latency_sla",
      "daily_volume",
      "notes",
    ],
    ownerRole: "Integration Architecture Lead",
    refreshCadence: "monthly",
    unlocks: FIRST_CAPITAL_V2_UNLOCKS,
  },
  {
    id: "vendors-contracts-licenses",
    dimension: "vendors_contracts_licenses",
    label: "Vendors, contracts, and licenses",
    acceptedFormats: ["csv", "xlsx"],
    requiredFields: ["vendor_id", "vendor_name", "annual_value_usd"],
    optionalFields: [
      "primary_system_id",
      "contract_type",
      "renewal_date",
      "auto_renew",
      "notice_days",
      "contract_owner",
      "data_class",
      "ai_clauses",
      "exit_terms",
      "benchmark_present",
    ],
    ownerRole: "VP Procurement",
    refreshCadence: "monthly",
    unlocks: FIRST_CAPITAL_V2_UNLOCKS,
  },
  {
    id: "it-budget-financials",
    dimension: "it_budget_financials",
    label: "IT budget and financials",
    acceptedFormats: ["csv", "xlsx"],
    requiredFields: ["budget_line_id", "category", "annual_budget_usd"],
    optionalFields: [
      "owner_team",
      "spend_type",
      "capex_usd",
      "opex_usd",
      "labor_usd",
      "vendor_usd",
      "fiscal_year",
      "notes",
    ],
    ownerRole: "CFO FP&A",
    refreshCadence: "monthly",
    unlocks: FIRST_CAPITAL_V2_UNLOCKS,
  },
  {
    id: "initiatives-portfolio",
    dimension: "initiatives_portfolio",
    label: "Initiatives portfolio",
    acceptedFormats: ["csv", "xlsx"],
    requiredFields: ["initiative_id", "title", "status"],
    optionalFields: [
      "sponsor_role",
      "business_function",
      "committed_usd",
      "projected_value_usd",
      "posture",
      "stage",
      "linked_app_ids",
      "kpi_id",
      "notes",
    ],
    ownerRole: "AI Portfolio Office",
    refreshCadence: "monthly",
    unlocks: FIRST_CAPITAL_V2_UNLOCKS,
  },
  {
    id: "operations-service-management",
    dimension: "operations_service_management",
    label: "Operations and service management",
    acceptedFormats: ["csv", "xlsx"],
    requiredFields: ["record_id", "record_type", "system_id"],
    optionalFields: [
      "severity",
      "opened_at",
      "closed_at",
      "mttr_hours",
      "sla_breached",
      "customer_impact",
      "root_cause",
    ],
    ownerRole: "VP IT Operations",
    refreshCadence: "weekly",
    unlocks: FIRST_CAPITAL_V2_UNLOCKS,
  },
  {
    id: "kpis-outcome-evidence",
    dimension: "kpis_outcome_evidence",
    label: "KPI outcome evidence",
    acceptedFormats: ["csv", "xlsx"],
    requiredFields: ["kpi_id", "kpi_name", "initiative_id"],
    optionalFields: [
      "owner_role",
      "baseline_value",
      "current_value",
      "target_value",
      "unit",
      "measurement_date",
      "confidence",
      "notes",
    ],
    ownerRole: "Enterprise PMO",
    refreshCadence: "monthly",
    unlocks: FIRST_CAPITAL_V2_UNLOCKS,
  },
  {
    id: "security-risk-compliance",
    dimension: "security_risk_compliance",
    label: "Security, risk, and compliance",
    acceptedFormats: ["csv", "xlsx"],
    requiredFields: ["control_id", "control_area", "system_id"],
    optionalFields: [
      "status",
      "regulation",
      "owner_role",
      "last_audit_date",
      "finding_count",
      "notes",
    ],
    ownerRole: "CISO",
    refreshCadence: "monthly",
    unlocks: FIRST_CAPITAL_V2_UNLOCKS,
  },
  {
    id: "ai-automation-footprint",
    dimension: "ai_automation_footprint",
    label: "AI automation footprint",
    acceptedFormats: ["csv", "xlsx"],
    requiredFields: ["tool_id", "tool_name", "vendor"],
    optionalFields: [
      "owner_role",
      "workflow",
      "use_case",
      "active_users",
      "monthly_spend_usd",
      "approval_status",
      "approved_data_scope",
      "data_class",
      "regulated_workflow_flag",
      "notes",
    ],
    ownerRole: "AI Governance Lead",
    refreshCadence: "monthly",
    unlocks: FIRST_CAPITAL_V2_UNLOCKS,
  },
  {
    id: "initiative-milestones",
    dimension: "initiative_milestones",
    label: "Initiative milestones",
    acceptedFormats: ["csv", "xlsx"],
    requiredFields: ["initiative_id", "milestone_id", "milestone_name"],
    optionalFields: [
      "milestone_type",
      "target_date",
      "actual_date",
      "status",
      "gate_criteria",
      "gate_approver_role",
      "blocker",
      "evidence_artifact",
    ],
    ownerRole: "AI Portfolio Office",
    refreshCadence: "monthly",
    unlocks: FIRST_CAPITAL_V2_UNLOCKS,
  },
  {
    id: "benefit-realization",
    dimension: "benefit_realization",
    label: "Benefit realization",
    acceptedFormats: ["csv", "xlsx"],
    requiredFields: ["initiative_id", "benefit_category"],
    optionalFields: [
      "committed_roi_usd",
      "projected_roi_usd",
      "realized_ytd_usd",
      "realization_pct",
      "evidence_quality",
      "evidence_source",
      "last_evidence_date",
      "realizaton_status",
      "next_review_date",
      "notes",
    ],
    ownerRole: "CFO FP&A",
    refreshCadence: "monthly",
    unlocks: FIRST_CAPITAL_V2_UNLOCKS,
  },
  {
    id: "copilot-adoption-by-function",
    dimension: "copilot_adoption_by_function",
    label: "Copilot adoption by function",
    acceptedFormats: ["csv", "xlsx"],
    requiredFields: ["function_id", "function_name", "copilot_product"],
    optionalFields: [
      "seats_allocated",
      "seats_active",
      "adoption_pct",
      "primary_use_cases",
      "approved_data_scope",
      "dpl_policy_status",
      "verified_time_savings_hrs_per_fte_month",
      "estimated_benefit_usd_annual",
      "evidence_quality",
      "evidence_date",
      "blocker",
      "notes",
    ],
    ownerRole: "Digital Workplace Lead",
    refreshCadence: "monthly",
    unlocks: FIRST_CAPITAL_V2_UNLOCKS,
  },
  {
    id: "erp-platform-agents",
    dimension: "erp_platform_agents",
    label: "ERP platform agents",
    acceptedFormats: ["csv", "xlsx"],
    requiredFields: ["agent_id", "agent_name", "parent_system_id"],
    optionalFields: [
      "vendor",
      "capability_type",
      "business_function",
      "active_users",
      "ai_feature_status",
      "approved_data_scope",
      "regulated_workflow",
      "monthly_cost_incremental_usd",
      "verified_value",
      "model_risk_assessed",
      "sr117_required",
      "notes",
    ],
    ownerRole: "VP Enterprise Applications",
    refreshCadence: "monthly",
    unlocks: FIRST_CAPITAL_V2_UNLOCKS,
  },
  {
    id: "servicenow-automation-metrics",
    dimension: "servicenow_automation_metrics",
    label: "ServiceNow automation metrics",
    acceptedFormats: ["csv", "xlsx"],
    requiredFields: ["workflow_id", "workflow_name", "workflow_type"],
    optionalFields: [
      "business_function",
      "monthly_volume_tickets",
      "ai_deflection_rate_pct",
      "auto_resolve_rate_pct",
      "avg_mttr_before_hrs",
      "avg_mttr_after_hrs",
      "mttr_delta_hrs",
      "fte_equivalent_saved",
      "monthly_cost_avoided_usd",
      "ai_feature_status",
      "notes",
    ],
    ownerRole: "VP IT Service Management",
    refreshCadence: "monthly",
    unlocks: FIRST_CAPITAL_V2_UNLOCKS,
  },
  {
    id: "function-ai-productivity-scorecard",
    dimension: "function_ai_productivity_scorecard",
    label: "Function AI productivity scorecard",
    acceptedFormats: ["csv", "xlsx"],
    requiredFields: ["function_id", "function_name"],
    optionalFields: [
      "total_fte",
      "ai_active_fte",
      "ai_adoption_pct",
      "ai_eligible_fte_pct",
      "ai_tools_count",
      "ai_tools_approved",
      "ai_tools_conditional",
      "ai_tools_blocked_or_kill",
      "ai_spend_fy26_usd",
      "benefit_committed_usd",
      "benefit_realized_ytd_usd",
      "realization_pct",
      "top_value_driver",
      "biggest_blocker",
      "tower_rag_status",
    ],
    ownerRole: "AI Portfolio Office",
    refreshCadence: "monthly",
    unlocks: FIRST_CAPITAL_V2_UNLOCKS,
  },
  {
    id: "model-risk-inventory",
    dimension: "model_risk_inventory",
    label: "Model risk inventory",
    acceptedFormats: ["csv", "xlsx"],
    requiredFields: ["model_id", "model_name", "domain"],
    optionalFields: [
      "system_id",
      "business_function",
      "model_type",
      "deployment_env",
      "decisioning_impact",
      "sr117_tier",
      "validation_status",
      "last_validation_date",
      "next_validation_date",
      "open_findings",
      "mra_linked",
      "notes",
    ],
    ownerRole: "Model Risk Management",
    refreshCadence: "monthly",
    unlocks: FIRST_CAPITAL_V2_UNLOCKS,
  },
  {
    id: "ai-spend-by-initiative",
    dimension: "ai_spend_by_initiative",
    label: "AI spend by initiative",
    acceptedFormats: ["csv", "xlsx"],
    requiredFields: ["initiative_id", "title", "fy26_budget_usd"],
    optionalFields: [
      "posture",
      "ytd_actuals_usd",
      "ytd_burn_rate_pct",
      "fte_labor_usd",
      "vendor_tools_usd",
      "infra_usd",
      "external_si_usd",
      "projected_year_end_usd",
      "variance_usd",
      "variance_pct",
      "notes",
    ],
    ownerRole: "CFO FP&A",
    refreshCadence: "monthly",
    unlocks: FIRST_CAPITAL_V2_UNLOCKS,
  },
  {
    id: "ai-risk-register",
    dimension: "ai_risk_register",
    label: "AI risk register",
    acceptedFormats: ["csv", "xlsx"],
    requiredFields: ["risk_id", "risk_name", "risk_type"],
    optionalFields: [
      "linked_system_id",
      "linked_initiative_id",
      "likelihood",
      "impact",
      "risk_score",
      "current_control",
      "control_adequacy",
      "owner_role",
      "regulatory_implication",
      "status",
      "notes",
    ],
    ownerRole: "Chief Risk Officer",
    refreshCadence: "monthly",
    unlocks: FIRST_CAPITAL_V2_UNLOCKS,
  },
  {
    id: "gate-approval-history",
    dimension: "gate_approval_history",
    label: "Gate approval history",
    acceptedFormats: ["csv", "xlsx"],
    requiredFields: ["gate_id", "initiative_id", "gate_name"],
    optionalFields: [
      "gate_date",
      "approved_by_role",
      "approved_by_name",
      "decision",
      "conditions",
      "next_gate",
      "next_gate_target_date",
    ],
    ownerRole: "AI Governance Council Chair",
    refreshCadence: "monthly",
    unlocks: FIRST_CAPITAL_V2_UNLOCKS,
  },
  {
    id: "business-metrics",
    dimension: "kpis_outcome_evidence",
    label: "Business metrics",
    acceptedFormats: ["csv", "xlsx"],
    requiredFields: ["metric_id", "metric_name"],
    optionalFields: [
      "function",
      "owning_cxo",
      "definition",
      "unit",
      "current_value",
      "target_value",
      "value_stream_id",
      "primary_capability_id",
    ],
    ownerRole: "CFO / Strategy",
    refreshCadence: "monthly",
    unlocks: FIRST_CAPITAL_V2_UNLOCKS,
  },
  {
    id: "industry-benchmarks",
    dimension: "market_competitor_intel",
    label: "Industry benchmarks",
    acceptedFormats: ["csv", "xlsx"],
    requiredFields: ["benchmark_id", "metric_id", "peer_set"],
    optionalFields: [
      "industry_median",
      "top_quartile",
      "best_in_class",
      "your_value",
      "your_quartile",
      "gap_to_top_quartile",
      "source",
      "vintage",
    ],
    ownerRole: "Strategy / Benchmarking",
    refreshCadence: "quarterly",
    unlocks: FIRST_CAPITAL_V2_UNLOCKS,
  },
  {
    id: "competitor-plays",
    dimension: "market_competitor_intel",
    label: "Competitor plays",
    acceptedFormats: ["csv", "xlsx"],
    requiredFields: ["play_id", "play_name"],
    optionalFields: [
      "metric_id",
      "peer_or_archetype",
      "metric_moved",
      "delta",
      "enablers",
      "reference_pattern",
      "domain",
    ],
    ownerRole: "Strategy / Competitive Intelligence",
    refreshCadence: "quarterly",
    unlocks: FIRST_CAPITAL_V2_UNLOCKS,
  },
  {
    id: "benefits-realization",
    dimension: "benefit_realization",
    label: "Benefits realization",
    acceptedFormats: ["csv", "xlsx"],
    requiredFields: ["benefit_id", "initiative_id", "benefit_type"],
    optionalFields: [
      "linked_metric_id",
      "baseline",
      "target",
      "forecast",
      "realized_to_date",
      "unit",
      "measurement_method",
      "benefit_owner",
      "realization_status",
    ],
    ownerRole: "Value Management Office",
    refreshCadence: "monthly",
    unlocks: FIRST_CAPITAL_V2_UNLOCKS,
  },
  {
    id: "raid-log",
    dimension: "ai_risk_register",
    label: "RAID log",
    acceptedFormats: ["csv", "xlsx"],
    requiredFields: ["item_id", "initiative_id", "type"],
    optionalFields: [
      "description",
      "severity",
      "likelihood",
      "status",
      "owner",
      "due_date",
      "mitigation",
    ],
    ownerRole: "Transformation PMO",
    refreshCadence: "weekly",
    unlocks: FIRST_CAPITAL_V2_UNLOCKS,
  },
  {
    id: "ai-governance",
    dimension: "ai_governance_decisions",
    label: "AI governance",
    acceptedFormats: ["csv", "xlsx"],
    requiredFields: ["gov_id", "initiative_id", "model_risk_tier"],
    optionalFields: [
      "model_count",
      "hitl",
      "bias_monitoring",
      "drift_monitoring",
      "reg_regime",
      "responsible_ai_gate_status",
    ],
    ownerRole: "AI Governance Council",
    refreshCadence: "monthly",
    unlocks: FIRST_CAPITAL_V2_UNLOCKS,
  },
];

const FIRST_CAPITAL_V2_CONTEXT_TEMPLATES = FIRST_CAPITAL_V2_TEMPLATE_SEEDS.map(
  materializeTemplateSeed,
);

NORTHSTAR_CONTEXT_TEMPLATES.push(...FIRST_CAPITAL_V2_CONTEXT_TEMPLATES);

const PHS_OBJECT_DIMENSION_MAP = {
  evidence_item: "c_suite_strategy",
  uploaded_artifact: "c_suite_strategy",
  workload_record: "application_portfolio",
  rate_card_row: "financial_kpis",
  gate_criterion: "c_suite_strategy",
  approval_record: "c_suite_strategy",
} satisfies Record<string, ContextDimension>;

export const PHS_CONTEXT_TEMPLATES: ContextTemplateDefinition[] =
  PHS_PHASE0_TEMPLATE_DEFINITIONS.map((template) => ({
    id: template.id,
    dimension: PHS_OBJECT_DIMENSION_MAP[template.objectType],
    label: template.label,
    acceptedFormats: [...template.acceptedFormats],
    exceptionFormats: SUPPORTED_CONTEXT_UPLOAD_FORMATS.filter(
      (format) =>
        !(template.acceptedFormats as readonly UploadedFileFormat[]).includes(
          format,
        ),
    ),
    formatProfiles: SUPPORTED_CONTEXT_UPLOAD_FORMATS.map(
      (format) => FORMAT_SUPPORT_PROFILES[format],
    ),
    requiredFields: [...template.requiredFields],
    optionalFields: [...template.optionalFields],
    ownerRole: template.ownerRole,
    refreshCadence: "per demo setup cycle",
    exceptionMetadataRequirements: buildExceptionMetadataRequirements([
      ...template.acceptedFormats,
    ]),
    unlocks: [
      template.stageAdvanceUse,
      "PHS demo claims can cite governed Phase 0 evidence",
      "Stage advancement can distinguish parsed rows from approved evidence",
    ],
  }));

const MERIDIAN_HEALTHCARE_UNLOCKS = [
  "Evidence chips cite uploaded Meridian/PHS source locators",
  "Sentinel and Nexus can answer healthcare questions only after tenant-scoped chunks are embedded",
  "Source, Moves, and Tower stay pending until approval and embedding evidence exists",
];

const MERIDIAN_HEALTHCARE_TEMPLATE_SEEDS: ContextTemplateSeed[] = [
  {
    id: "enterprise-profile",
    dimension: "enterprise_profile",
    label: "Healthcare enterprise profile",
    acceptedFormats: ["yaml", "json"],
    requiredFields: ["metric", "value", "period", "source"],
    optionalFields: [],
    ownerRole: "Chief Strategy Officer",
    refreshCadence: "quarterly",
    unlocks: MERIDIAN_HEALTHCARE_UNLOCKS,
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
    unlocks: MERIDIAN_HEALTHCARE_UNLOCKS,
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
    unlocks: MERIDIAN_HEALTHCARE_UNLOCKS,
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
    unlocks: MERIDIAN_HEALTHCARE_UNLOCKS,
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
    unlocks: MERIDIAN_HEALTHCARE_UNLOCKS,
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
    unlocks: MERIDIAN_HEALTHCARE_UNLOCKS,
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
    unlocks: MERIDIAN_HEALTHCARE_UNLOCKS,
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
    unlocks: MERIDIAN_HEALTHCARE_UNLOCKS,
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
    unlocks: MERIDIAN_HEALTHCARE_UNLOCKS,
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
    unlocks: MERIDIAN_HEALTHCARE_UNLOCKS,
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
    unlocks: MERIDIAN_HEALTHCARE_UNLOCKS,
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
    unlocks: MERIDIAN_HEALTHCARE_UNLOCKS,
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
    unlocks: MERIDIAN_HEALTHCARE_UNLOCKS,
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
    unlocks: MERIDIAN_HEALTHCARE_UNLOCKS,
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
    unlocks: MERIDIAN_HEALTHCARE_UNLOCKS,
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
    unlocks: MERIDIAN_HEALTHCARE_UNLOCKS,
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
    unlocks: MERIDIAN_HEALTHCARE_UNLOCKS,
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
    unlocks: MERIDIAN_HEALTHCARE_UNLOCKS,
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
    unlocks: MERIDIAN_HEALTHCARE_UNLOCKS,
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
    unlocks: MERIDIAN_HEALTHCARE_UNLOCKS,
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
    unlocks: MERIDIAN_HEALTHCARE_UNLOCKS,
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
    unlocks: MERIDIAN_HEALTHCARE_UNLOCKS,
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
    unlocks: MERIDIAN_HEALTHCARE_UNLOCKS,
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
    unlocks: MERIDIAN_HEALTHCARE_UNLOCKS,
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
    unlocks: MERIDIAN_HEALTHCARE_UNLOCKS,
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
    unlocks: MERIDIAN_HEALTHCARE_UNLOCKS,
  },
];

export const MERIDIAN_HEALTHCARE_CONTEXT_TEMPLATES: ContextTemplateDefinition[] =
  MERIDIAN_HEALTHCARE_TEMPLATE_SEEDS.map((template) => ({
    ...template,
    exceptionFormats: SUPPORTED_CONTEXT_UPLOAD_FORMATS.filter(
      (format) => !template.acceptedFormats.includes(format),
    ),
    formatProfiles: SUPPORTED_CONTEXT_UPLOAD_FORMATS.map(
      (format) => FORMAT_SUPPORT_PROFILES[format],
    ),
    exceptionMetadataRequirements: buildExceptionMetadataRequirements(
      template.acceptedFormats,
    ),
  }));

export const CONTEXT_TEMPLATE_REGISTRY: ContextTemplateDefinition[] = [
  ...NORTHSTAR_CONTEXT_TEMPLATES,
  ...PHS_CONTEXT_TEMPLATES,
  ...MERIDIAN_HEALTHCARE_CONTEXT_TEMPLATES,
];

export function isMeridianHealthcareTenant(tenantKey?: string | null): boolean {
  const normalized = tenantKey?.trim().toLowerCase().replace(/_/g, "-");
  return (
    normalized === "meridian" ||
    normalized === "meridian-health" ||
    normalized === "phs" ||
    normalized === "phs-meridian"
  );
}

export function getTemplatesForTenant(
  tenantKey?: string | null,
): ContextTemplateDefinition[] {
  if (isMeridianHealthcareTenant(tenantKey)) {
    return [...MERIDIAN_HEALTHCARE_CONTEXT_TEMPLATES, ...PHS_CONTEXT_TEMPLATES];
  }
  return NORTHSTAR_CONTEXT_TEMPLATES;
}

export function getTemplateById(
  id: string,
  options: { tenantKey?: string | null } = {},
): ContextTemplateDefinition | null {
  return (
    getTemplatesForTenant(options.tenantKey).find(
      (template) => template.id === id,
    ) ??
    CONTEXT_TEMPLATE_REGISTRY.find((template) => template.id === id) ??
    null
  );
}

export function getTemplateForDimension(
  dimension: ContextDimension,
  options: { tenantKey?: string | null } = {},
): ContextTemplateDefinition | null {
  return (
    getTemplatesForTenant(options.tenantKey).find(
      (template) => template.dimension === dimension,
    ) ??
    CONTEXT_TEMPLATE_REGISTRY.find(
      (template) => template.dimension === dimension,
    ) ??
    null
  );
}

export function getTemplateFormatCoverage(): Record<
  Exclude<UploadedFileFormat, "unknown">,
  number
> {
  return Object.fromEntries(
    SUPPORTED_CONTEXT_UPLOAD_FORMATS.map((format) => [
      format,
      NORTHSTAR_CONTEXT_TEMPLATES.filter(
        (template) =>
          template.acceptedFormats.includes(format) ||
          template.exceptionFormats.includes(format),
      ).length,
    ]),
  ) as Record<Exclude<UploadedFileFormat, "unknown">, number>;
}
