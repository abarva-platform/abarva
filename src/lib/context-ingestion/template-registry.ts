import type { ContextDimension, UploadedFileFormat } from './types';

export interface ContextTemplateDefinition {
  id: string;
  dimension: ContextDimension;
  label: string;
  acceptedFormats: UploadedFileFormat[];
  requiredFields: string[];
  optionalFields: string[];
  ownerRole: string;
  refreshCadence: string;
  unlocks: string[];
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
  requiredFields: requiredFields as string[],
  optionalFields: optionalFields as string[],
  ownerRole: ownerRole as string,
  refreshCadence: refreshCadence as string,
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
