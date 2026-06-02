import type { ContextDimension, UploadedFileFormat } from './types';

export type TemplateParserMode =
  | 'structured_rows'
  | 'workbook_sheets'
  | 'document_facts'
  | 'slide_facts'
  | 'json_records'
  | 'batch_archive';

export interface TemplateFormatSupportProfile {
  format: Exclude<UploadedFileFormat, 'unknown'>;
  parserMode: TemplateParserMode;
  parserLabel: string;
  requiresMetadataForException: boolean;
}

export interface TemplateExceptionMetadataRequirement {
  key: string;
  label: string;
  purpose: string;
  requiredForFormats: Exclude<UploadedFileFormat, 'unknown'>[];
}

export interface ContextTemplateDefinition {
  id: string;
  dimension: ContextDimension;
  label: string;
  acceptedFormats: UploadedFileFormat[];
  exceptionFormats: Exclude<UploadedFileFormat, 'unknown'>[];
  formatProfiles: TemplateFormatSupportProfile[];
  requiredFields: string[];
  optionalFields: string[];
  ownerRole: string;
  refreshCadence: string;
  exceptionMetadataRequirements: TemplateExceptionMetadataRequirement[];
  unlocks: string[];
}

export const SUPPORTED_CONTEXT_UPLOAD_FORMATS: Exclude<UploadedFileFormat, 'unknown'>[] = [
  'csv',
  'xlsx',
  'json',
  'jsonl',
  'pdf',
  'docx',
  'pptx',
  'markdown',
  'zip',
];

const FORMAT_SUPPORT_PROFILES: Record<
  Exclude<UploadedFileFormat, 'unknown'>,
  TemplateFormatSupportProfile
> = {
  csv: {
    format: 'csv',
    parserMode: 'structured_rows',
    parserLabel: 'Delimited table with header row and deterministic column mapping',
    requiresMetadataForException: false,
  },
  xlsx: {
    format: 'xlsx',
    parserMode: 'workbook_sheets',
    parserLabel: 'Workbook sheets with sheet map, header row, units, and grain',
    requiresMetadataForException: false,
  },
  json: {
    format: 'json',
    parserMode: 'json_records',
    parserLabel: 'JSON records with declared root path and field mapping',
    requiresMetadataForException: true,
  },
  jsonl: {
    format: 'jsonl',
    parserMode: 'json_records',
    parserLabel: 'Line-delimited JSON records with declared record path and field mapping',
    requiresMetadataForException: true,
  },
  pdf: {
    format: 'pdf',
    parserMode: 'document_facts',
    parserLabel: 'Document facts with page anchors, section scope, and metric dictionary',
    requiresMetadataForException: true,
  },
  docx: {
    format: 'docx',
    parserMode: 'document_facts',
    parserLabel: 'Document facts with heading anchors, section scope, and metric dictionary',
    requiresMetadataForException: true,
  },
  pptx: {
    format: 'pptx',
    parserMode: 'slide_facts',
    parserLabel: 'Slide facts with slide anchors, KPI callouts, and source notes',
    requiresMetadataForException: true,
  },
  markdown: {
    format: 'markdown',
    parserMode: 'document_facts',
    parserLabel: 'Markdown facts with heading anchors and explicit source links',
    requiresMetadataForException: true,
  },
  zip: {
    format: 'zip',
    parserMode: 'batch_archive',
    parserLabel: 'Batch archive with manifest, per-file template mapping, and quarantine scan',
    requiresMetadataForException: true,
  },
};

const BASE_EXCEPTION_METADATA: TemplateExceptionMetadataRequirement[] = [
  {
    key: 'source_system',
    label: 'Source system',
    purpose: 'Names the system, report, or team that produced the file.',
    requiredForFormats: SUPPORTED_CONTEXT_UPLOAD_FORMATS,
  },
  {
    key: 'data_owner',
    label: 'Data owner',
    purpose: 'Identifies the human accountable for the load and later clarification.',
    requiredForFormats: SUPPORTED_CONTEXT_UPLOAD_FORMATS,
  },
  {
    key: 'sensitivity_declaration',
    label: 'Sensitivity declaration',
    purpose: 'Confirms whether the file contains PHI, PII, payroll, contract, financial, or regulated data.',
    requiredForFormats: SUPPORTED_CONTEXT_UPLOAD_FORMATS,
  },
  {
    key: 'field_mapping',
    label: 'Field mapping',
    purpose: 'Maps client columns, JSON paths, pages, headings, or slide callouts to AbarVa template fields.',
    requiredForFormats: SUPPORTED_CONTEXT_UPLOAD_FORMATS,
  },
  {
    key: 'parse_instructions',
    label: 'Parse instructions',
    purpose: 'Explains exclusions, rollups, fiscal calendar, units, and any client-specific conventions.',
    requiredForFormats: SUPPORTED_CONTEXT_UPLOAD_FORMATS,
  },
];

const STRUCTURED_EXCEPTION_METADATA: TemplateExceptionMetadataRequirement[] = [
  {
    key: 'record_grain',
    label: 'Record grain',
    purpose: 'Defines whether each row is an app, vendor, person, metric-period, site, incident, or initiative.',
    requiredForFormats: ['csv', 'xlsx', 'json', 'jsonl'],
  },
  {
    key: 'header_row',
    label: 'Header row or record path',
    purpose: 'Names the workbook sheet/header row or JSON path that contains the canonical records.',
    requiredForFormats: ['xlsx', 'json', 'jsonl'],
  },
];

const DOCUMENT_EXCEPTION_METADATA: TemplateExceptionMetadataRequirement[] = [
  {
    key: 'document_purpose',
    label: 'Document purpose',
    purpose: 'Declares whether the document is annual results, KPI evidence, org structure, contract evidence, or strategy context.',
    requiredForFormats: ['pdf', 'docx', 'pptx', 'markdown'],
  },
  {
    key: 'authoritative_sections',
    label: 'Authoritative sections',
    purpose: 'Names the pages, headings, tables, or slides AbarVa should treat as authoritative.',
    requiredForFormats: ['pdf', 'docx', 'pptx', 'markdown'],
  },
  {
    key: 'metric_dictionary',
    label: 'Metric dictionary',
    purpose: 'Defines KPI names, formulas, currencies, units, time periods, and source-of-truth precedence.',
    requiredForFormats: ['pdf', 'docx', 'pptx', 'markdown'],
  },
];

const ARCHIVE_EXCEPTION_METADATA: TemplateExceptionMetadataRequirement[] = [
  {
    key: 'archive_manifest',
    label: 'Archive manifest',
    purpose: 'Lists every file in a batch, expected template, sensitivity class, and owner.',
    requiredForFormats: ['zip'],
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
      (format) => !accepted.has(format) || FORMAT_SUPPORT_PROFILES[format].requiresMetadataForException,
    ),
  );
}

export function getFormatSupportProfile(
  format: UploadedFileFormat,
): TemplateFormatSupportProfile | null {
  if (format === 'unknown') return null;
  return FORMAT_SUPPORT_PROFILES[format] ?? null;
}

export const NORTHSTAR_CONTEXT_TEMPLATES: ContextTemplateDefinition[] = [
  ['enterprise-profile', 'enterprise_profile', 'Enterprise profile', ['markdown', 'json', 'pdf'], ['revenue_usd', 'employees', 'countries', 'business_units'], ['debt_usd', 'it_budget_usd'], 'Chief Strategy Officer', 'quarterly'],
  ['financial-kpi-workbook', 'financial_kpis', 'Financial KPI workbook', ['xlsx', 'csv'], ['period', 'metric', 'value', 'currency_or_unit', 'segment'], ['margin_bridge_driver', 'source_report'], 'CFO', 'quarterly'],
  ['annual-quarterly-reports', 'annual_quarterly_reports', 'Annual and quarterly reports', ['pdf', 'pptx', 'docx'], ['period', 'reported_revenue', 'reported_margin'], ['guidance', 'risk_factor'], 'Investor Relations', 'quarterly'],
  ['market-signals', 'market_competitor_intel', 'Market and competitor intel', ['csv', 'markdown', 'pdf'], ['signal_id', 'market', 'competitor', 'claim'], ['source_url', 'confidence'], 'Chief Commercial Officer', 'monthly'],
  ['strategy-memo', 'c_suite_strategy', 'C-suite strategy memo', ['docx', 'pdf', 'markdown'], ['priority', 'owner_role', 'time_horizon'], ['dissent', 'board_question'], 'CEO Chief of Staff', 'quarterly'],
  ['segment-pnl', 'business_units_segment_pnl', 'Business unit segment P&L', ['xlsx', 'csv'], ['segment', 'revenue_usd', 'gross_margin_pct', 'operating_margin_pct'], ['r_and_d_usd', 'sg_and_a_usd'], 'CFO FP&A', 'quarterly'],
  ['product-portfolio', 'product_portfolio', 'Product portfolio', ['csv', 'xlsx'], ['product_family_id', 'business_unit', 'revenue_usd', 'margin_pct', 'lifecycle_state'], ['regulatory_burden', 'plant_dependency'], 'Chief Product Officer', 'monthly'],
  ['site-and-plant-inventory', 'manufacturing_sites', 'Site and plant inventory', ['csv', 'xlsx'], ['site_id', 'country', 'business_unit', 'primary_system', 'validated_system_flag'], ['quality_cost_usd', 'capacity_utilization_pct'], 'COO', 'quarterly'],
  ['erp-landscape-workbook', 'erp_landscape', 'ERP landscape workbook', ['xlsx', 'csv'], ['erp_object_id', 'platform', 'process_area', 'owner_role', 'business_unit'], ['customization_count', 'tsa_dependency'], 'CIO ERP Transformation', 'monthly'],
  ['application-portfolio', 'application_portfolio', 'CMDB / application portfolio', ['csv', 'xlsx'], ['app_id', 'name', 'criticality', 'owner_role', 'system_of_record'], ['ams_vendor', 'time_classification'], 'VP Enterprise Architecture', 'monthly'],
  ['integration-topology', 'integration_topology', 'Integration topology', ['json', 'jsonl', 'csv'], ['edge_id', 'source_app_id', 'target_app_id', 'integration_type'], ['latency_sla', 'kill_blocker_flag'], 'VP Enterprise Architecture', 'monthly'],
  ['vendor-contracts', 'vendor_contracts', 'Vendor contracts', ['csv', 'xlsx', 'pdf'], ['vendor_id', 'vendor_name', 'annual_value_usd', 'renewal_date'], ['exit_terms', 'ai_clauses', 'data_rights'], 'VP Procurement', 'monthly'],
  ['initiative-portfolio', 'transformation_initiatives', 'Transformation initiatives', ['xlsx', 'csv', 'json'], ['initiative_id', 'title', 'status', 'sponsor_role', 'committed_usd'], ['projected_value_usd', 'linked_app_ids'], 'Transformation PMO', 'weekly'],
  ['org-roles', 'org_roles_teams', 'Org, roles, and teams', ['csv', 'xlsx', 'json'], ['person_id', 'name', 'level', 'role', 'manager_id'], ['cost_center', 'location'], 'CHRO', 'monthly'],
  ['dora-baseline', 'delivery_dora_devex', 'Delivery / DORA / DevEx', ['csv', 'xlsx', 'json'], ['team_id', 'measured_at', 'deploy_freq_per_week', 'lead_time_hours'], ['mttr_hours', 'change_failure_rate_pct'], 'VP Engineering', 'weekly'],
  ['qms-events', 'regulatory_qms_risk', 'Regulatory / QMS / risk', ['csv', 'xlsx', 'pdf'], ['event_id', 'event_type', 'product_family_id', 'severity', 'opened_at'], ['capa_id', 'audit_reference'], 'Chief Quality Officer', 'weekly'],
  ['ai-tool-footprint', 'ai_tooling_model_inventory', 'AI tooling and model inventory', ['csv', 'xlsx', 'json'], ['tool_id', 'tool_name', 'owner_role', 'workflow', 'risk_classification'], ['model_name', 'regulated_workflow_flag'], 'AI Governance Lead', 'monthly'],
  ['incidents-change-history', 'incidents_ops_telemetry', 'Incidents and ops telemetry', ['csv', 'json', 'jsonl'], ['incident_id', 'system_id', 'severity', 'opened_at'], ['closed_at', 'root_cause'], 'VP IT Operations', 'weekly'],
].map(([id, dimension, label, acceptedFormats, requiredFields, optionalFields, ownerRole, refreshCadence]) => ({
  id: id as string,
  dimension: dimension as ContextDimension,
  label: label as string,
  acceptedFormats: acceptedFormats as UploadedFileFormat[],
  exceptionFormats: SUPPORTED_CONTEXT_UPLOAD_FORMATS.filter(
    (format) => !(acceptedFormats as UploadedFileFormat[]).includes(format),
  ),
  formatProfiles: SUPPORTED_CONTEXT_UPLOAD_FORMATS.map((format) => FORMAT_SUPPORT_PROFILES[format]),
  requiredFields: requiredFields as string[],
  optionalFields: optionalFields as string[],
  ownerRole: ownerRole as string,
  refreshCadence: refreshCadence as string,
  exceptionMetadataRequirements: buildExceptionMetadataRequirements(acceptedFormats as UploadedFileFormat[]),
  unlocks: [
    'Evidence chips cite uploaded source locators',
    'Sentinel can answer tenant-grounded questions',
    'Source and Tower can reason from approved context',
  ],
}));

export function getTemplateById(id: string): ContextTemplateDefinition | null {
  return NORTHSTAR_CONTEXT_TEMPLATES.find((template) => template.id === id) ?? null;
}

export function getTemplateForDimension(
  dimension: ContextDimension,
): ContextTemplateDefinition | null {
  return NORTHSTAR_CONTEXT_TEMPLATES.find((template) => template.dimension === dimension) ?? null;
}

export function getTemplateFormatCoverage(): Record<Exclude<UploadedFileFormat, 'unknown'>, number> {
  return Object.fromEntries(
    SUPPORTED_CONTEXT_UPLOAD_FORMATS.map((format) => [
      format,
      NORTHSTAR_CONTEXT_TEMPLATES.filter(
        (template) => template.acceptedFormats.includes(format) || template.exceptionFormats.includes(format),
      ).length,
    ]),
  ) as Record<Exclude<UploadedFileFormat, 'unknown'>, number>;
}
