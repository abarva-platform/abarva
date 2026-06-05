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
