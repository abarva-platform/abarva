export type ContextDimension =
  | "enterprise_profile"
  | "financial_kpis"
  | "annual_quarterly_reports"
  | "market_competitor_intel"
  | "c_suite_strategy"
  | "business_units_segment_pnl"
  | "product_portfolio"
  | "manufacturing_sites"
  | "erp_landscape"
  | "application_portfolio"
  | "ehr_platform"
  | "integration_topology"
  | "interoperability_topology"
  | "prior_authorization"
  | "revenue_cycle_denials"
  | "ambient_clinical_documentation"
  | "clinical_ai_model_inventory"
  | "hipaa_ai_controls"
  | "vendor_baa_contracts"
  | "service_line_pnl"
  | "workforce_scheduling"
  | "patient_access"
  | "imaging_ai_triage"
  | "cms_interoperability"
  | "vendor_contracts"
  | "transformation_initiatives"
  | "org_roles_teams"
  | "delivery_dora_devex"
  | "regulatory_qms_risk"
  | "value_based_care"
  | "population_health"
  | "data_platform_lineage"
  | "digital_front_door"
  | "supply_chain_pharmacy"
  | "ai_governance_decisions"
  | "clinical_downtime_cyber"
  | "nursing_workload_acuity"
  | "ai_tooling_model_inventory"
  | "incidents_ops_telemetry"
  | "infrastructure_estate"
  | "business_capability"
  | "service_levels"
  | "it_landscape"
  | "infrastructure_dc"
  | "business_org_functions"
  | "it_org_ownership"
  | "personas_workforce"
  | "capabilities_value_streams"
  | "applications_systems"
  | "system_function_mapping"
  | "infrastructure_cloud"
  | "platform_volumetrics"
  | "data_analytics_estate"
  | "integrations_interfaces"
  | "vendors_contracts_licenses"
  | "it_budget_financials"
  | "initiatives_portfolio"
  | "operations_service_management"
  | "kpis_outcome_evidence"
  | "security_risk_compliance"
  | "ai_automation_footprint"
  | "initiative_milestones"
  | "benefit_realization"
  | "copilot_adoption_by_function"
  | "erp_platform_agents"
  | "servicenow_automation_metrics"
  | "function_ai_productivity_scorecard"
  | "model_risk_inventory"
  | "ai_spend_by_initiative"
  | "ai_risk_register"
  | "gate_approval_history";

export type ContextDimensionFamily =
  | "enterprise_operating_model"
  | "technology_estate"
  | "data_connectivity"
  | "financial_commercial"
  | "execution_operations"
  | "governance_ai_evidence"
  | "personas_workforce";

export const DIMENSION_FAMILY_MAP: Record<
  ContextDimension,
  ContextDimensionFamily
> = {
  enterprise_profile: "enterprise_operating_model",
  financial_kpis: "financial_commercial",
  annual_quarterly_reports: "enterprise_operating_model",
  market_competitor_intel: "enterprise_operating_model",
  c_suite_strategy: "enterprise_operating_model",
  business_units_segment_pnl: "financial_commercial",
  product_portfolio: "enterprise_operating_model",
  manufacturing_sites: "technology_estate",
  erp_landscape: "technology_estate",
  application_portfolio: "technology_estate",
  ehr_platform: "technology_estate",
  integration_topology: "data_connectivity",
  interoperability_topology: "data_connectivity",
  prior_authorization: "execution_operations",
  revenue_cycle_denials: "financial_commercial",
  ambient_clinical_documentation: "execution_operations",
  clinical_ai_model_inventory: "governance_ai_evidence",
  hipaa_ai_controls: "governance_ai_evidence",
  vendor_baa_contracts: "financial_commercial",
  service_line_pnl: "financial_commercial",
  workforce_scheduling: "personas_workforce",
  patient_access: "execution_operations",
  imaging_ai_triage: "execution_operations",
  cms_interoperability: "data_connectivity",
  vendor_contracts: "financial_commercial",
  transformation_initiatives: "execution_operations",
  org_roles_teams: "enterprise_operating_model",
  delivery_dora_devex: "execution_operations",
  regulatory_qms_risk: "governance_ai_evidence",
  value_based_care: "execution_operations",
  population_health: "execution_operations",
  data_platform_lineage: "data_connectivity",
  digital_front_door: "execution_operations",
  supply_chain_pharmacy: "financial_commercial",
  ai_governance_decisions: "governance_ai_evidence",
  clinical_downtime_cyber: "governance_ai_evidence",
  nursing_workload_acuity: "personas_workforce",
  ai_tooling_model_inventory: "governance_ai_evidence",
  incidents_ops_telemetry: "execution_operations",
  infrastructure_estate: "technology_estate",
  business_capability: "enterprise_operating_model",
  service_levels: "execution_operations",
  it_landscape: "technology_estate",
  infrastructure_dc: "technology_estate",
  business_org_functions: "enterprise_operating_model",
  it_org_ownership: "enterprise_operating_model",
  personas_workforce: "personas_workforce",
  capabilities_value_streams: "enterprise_operating_model",
  applications_systems: "technology_estate",
  system_function_mapping: "technology_estate",
  infrastructure_cloud: "technology_estate",
  platform_volumetrics: "technology_estate",
  data_analytics_estate: "data_connectivity",
  integrations_interfaces: "data_connectivity",
  vendors_contracts_licenses: "financial_commercial",
  it_budget_financials: "financial_commercial",
  initiatives_portfolio: "execution_operations",
  operations_service_management: "execution_operations",
  kpis_outcome_evidence: "execution_operations",
  security_risk_compliance: "governance_ai_evidence",
  ai_automation_footprint: "governance_ai_evidence",
  initiative_milestones: "execution_operations",
  benefit_realization: "execution_operations",
  copilot_adoption_by_function: "personas_workforce",
  erp_platform_agents: "technology_estate",
  servicenow_automation_metrics: "execution_operations",
  function_ai_productivity_scorecard: "execution_operations",
  model_risk_inventory: "governance_ai_evidence",
  ai_spend_by_initiative: "financial_commercial",
  ai_risk_register: "governance_ai_evidence",
  gate_approval_history: "governance_ai_evidence",
};

export type UploadedFileFormat =
  | "csv"
  | "xlsx"
  | "json"
  | "jsonl"
  | "pdf"
  | "docx"
  | "pptx"
  | "markdown"
  | "yaml"
  | "zip"
  | "unknown";

export type ExtractionMethod = "deterministic" | "llm" | "hybrid";

export interface ContextSourceLocator {
  fileName: string;
  sheet?: string;
  row?: number;
  column?: string;
  page?: number;
  paragraph?: number;
  slide?: number;
  jsonPath?: string;
}

export interface ContextValidationFinding {
  severity: "error" | "warning" | "info";
  code: string;
  message: string;
  row?: number;
  field?: string;
  expected?: string;
  actual?: string;
}

export interface ExtractedContextFact {
  id: string;
  tenantKey: "northstar";
  dimension: ContextDimension;
  entityType: string;
  entityKey: string;
  field: string;
  value: unknown;
  valueText: string;
  sourceFileId: string;
  sourceLocator: ContextSourceLocator;
  confidence: number;
  extractionMethod: ExtractionMethod;
  requiresApproval: boolean;
  approvalRole: string;
  validationFindings: ContextValidationFinding[];
}

export interface UploadedFileInput {
  fileName: string;
  mimeType?: string | null;
  text?: string;
  bytes?: Uint8Array;
}

export interface FileClassification {
  templateType: string;
  dimension: ContextDimension;
  format: UploadedFileFormat;
  likelySourceSystem: string;
  confidence: number;
  extractionStrategy:
    | "structured_rows"
    | "workbook_sheets"
    | "document_facts"
    | "slide_facts"
    | "batch_archive";
  requiredApprovalRole: string;
  llmExtractionNeeded: boolean;
}

export interface IngestionUploadRun {
  uploadId: string;
  tenantKey: "northstar";
  file: UploadedFileInput;
  classification: FileClassification;
  facts: ExtractedContextFact[];
  validationFindings: ContextValidationFinding[];
  approvedFactIds: string[];
  rejectedFactIds: string[];
  committedFactIds: string[];
}

export interface ContextEvidenceRow {
  evidenceId: string;
  factId: string;
  claim: string;
  sourceText: string;
  sourceLocator: ContextSourceLocator;
  confidence: number;
  freshness: string;
  ownerRole: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// Classification types (added with migration 20260616180000)
// ──────────────────────────────────────────────────────────────────────────────

export type DomainSegment =
  | "DATA_ANALYTICS"
  | "ERP"
  | "DIGITAL_CX"
  | "OPERATIONS"
  | "INFRASTRUCTURE"
  | "SECURITY_IDENTITY"
  | "HR_WORKFORCE"
  | "COLLABORATION";

export type BusinessFunction =
  | "FINANCE"
  | "SUPPLY_CHAIN"
  | "HUMAN_RESOURCES"
  | "OPERATIONS"
  | "COMMERCIAL_SALES"
  | "IT"
  | "COMPLIANCE_LEGAL"
  | "CORPORATE"
  | "INDUSTRY_OPS";

export type Criticality = "TIER_1" | "TIER_2" | "TIER_3";

export type ClassificationSource =
  | "AUTO_INFERRED"
  | "NEEDS_CLASSIFICATION"
  | "OPERATOR_CONFIRMED"
  | "CMDB_FEED";

// ──────────────────────────────────────────────────────────────────────────────
// Insight engine types (context_insights + significance_rules tables)
// ──────────────────────────────────────────────────────────────────────────────

export type InsightLifecycleState =
  | "active"
  | "review_required"
  | "blocked_by_gap"
  | "superseded";

export type InsightMateriality = "high" | "medium" | "low";

export interface ContextInsight {
  id: string;
  clientId: string;
  tenantKey: string;
  headline: string;
  soWhat: string;
  domain: string;
  materiality: InsightMateriality;
  derivedFromRecordIds: string[];
  derivedFromFactIds: string[];
  ruleId: string;
  evidence: string | null;
  confidence: "high" | "medium" | "low" | "none";
  freshnessStatus: string;
  lifecycleState: InsightLifecycleState;
  action: string | null;
  entityName: string | null;
  entityType: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SignificanceRule {
  id: string;
  ruleKey: string;
  name: string;
  description: string;
  requiredDimensionNumbers: number[];
  requiredFactKeys: string[];
  requiredRecordTypes: string[];
  defaultMateriality: InsightMateriality;
  defaultConfidence: string;
  enabled: boolean;
}
