// ── Universal 6-Family Dimension Taxonomy (19 dimensions) ────────────────────
// Every enterprise can load these regardless of vertical.
// Family 1 — Enterprise & Operating Model
export type ContextDimensionF1 =
  | 'enterprise_profile'
  | 'business_org_functions'
  | 'it_org_ownership'
  | 'capabilities_value_streams';

// Family 2 — Technology Estate
export type ContextDimensionF2 =
  | 'applications_systems'
  | 'system_function_mapping'
  | 'infrastructure_cloud'
  | 'platform_volumetrics';

// Family 3 — Data & Connectivity
export type ContextDimensionF3 =
  | 'data_analytics_estate'
  | 'integrations_interfaces';

// Family 4 — Financial & Commercial
export type ContextDimensionF4 =
  | 'vendors_contracts_licenses'
  | 'it_budget_financials';

// Family 5 — Execution & Operations
export type ContextDimensionF5 =
  | 'initiatives_portfolio'
  | 'operations_service_management'
  | 'kpis_outcome_evidence';

// Family 6 — Governance, AI & Evidence
export type ContextDimensionF6 =
  | 'security_risk_compliance'
  | 'ai_automation_footprint';

// Dimension 19 — Personas & Workforce (cross-cutting; enables AI ROI measurement)
export type ContextDimensionPersonas = 'personas_workforce';

export type ContextDimensionUniversal =
  | ContextDimensionF1
  | ContextDimensionF2
  | ContextDimensionF3
  | ContextDimensionF4
  | ContextDimensionF5
  | ContextDimensionF6
  | ContextDimensionPersonas;

// ── Vertical-specific overlays (legacy + healthcare + medtech) ────────────────
// These extend the universal model for specific industries.
export type ContextDimensionHealthcare =
  | 'ehr_platform'
  | 'interoperability_topology'
  | 'prior_authorization'
  | 'revenue_cycle_denials'
  | 'ambient_clinical_documentation'
  | 'clinical_ai_model_inventory'
  | 'hipaa_ai_controls'
  | 'vendor_baa_contracts'
  | 'service_line_pnl'
  | 'workforce_scheduling'
  | 'patient_access'
  | 'imaging_ai_triage'
  | 'cms_interoperability'
  | 'value_based_care'
  | 'population_health'
  | 'data_platform_lineage'
  | 'digital_front_door'
  | 'supply_chain_pharmacy'
  | 'ai_governance_decisions'
  | 'clinical_downtime_cyber'
  | 'nursing_workload_acuity';

export type ContextDimensionLegacy =
  | 'financial_kpis'
  | 'annual_quarterly_reports'
  | 'market_competitor_intel'
  | 'c_suite_strategy'
  | 'business_units_segment_pnl'
  | 'product_portfolio'
  | 'manufacturing_sites'
  | 'erp_landscape'
  | 'application_portfolio'
  | 'integration_topology'
  | 'vendor_contracts'
  | 'transformation_initiatives'
  | 'org_roles_teams'
  | 'delivery_dora_devex'
  | 'regulatory_qms_risk'
  | 'service_levels'
  | 'business_capability'
  | 'infrastructure_estate'
  | 'ai_tooling_model_inventory'
  | 'incidents_ops_telemetry';

export type ContextDimension =
  | ContextDimensionUniversal
  | ContextDimensionHealthcare
  | ContextDimensionLegacy;

export type UploadedFileFormat =
  | 'csv'
  | 'xlsx'
  | 'json'
  | 'jsonl'
  | 'pdf'
  | 'docx'
  | 'pptx'
  | 'markdown'
  | 'yaml'
  | 'zip'
  | 'unknown';

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

export type ContextDimensionFamily =
  | 'enterprise_operating_model'
  | 'technology_estate'
  | 'data_connectivity'
  | 'financial_commercial'
  | 'execution_operations'
  | 'governance_ai_evidence'
  | 'personas_workforce';

export type DomainSegment =
  | 'DATA_ANALYTICS'
  | 'ERP'
  | 'DIGITAL_CX'
  | 'OPERATIONS'
  | 'INFRASTRUCTURE'
  | 'SECURITY_IDENTITY'
  | 'HR_WORKFORCE'
  | 'COLLABORATION';

export const DIMENSION_FAMILY_MAP: Record<ContextDimensionUniversal, ContextDimensionFamily> = {
  enterprise_profile: 'enterprise_operating_model',
  business_org_functions: 'enterprise_operating_model',
  it_org_ownership: 'enterprise_operating_model',
  capabilities_value_streams: 'enterprise_operating_model',
  applications_systems: 'technology_estate',
  system_function_mapping: 'technology_estate',
  infrastructure_cloud: 'technology_estate',
  platform_volumetrics: 'technology_estate',
  data_analytics_estate: 'data_connectivity',
  integrations_interfaces: 'data_connectivity',
  vendors_contracts_licenses: 'financial_commercial',
  it_budget_financials: 'financial_commercial',
  initiatives_portfolio: 'execution_operations',
  operations_service_management: 'execution_operations',
  kpis_outcome_evidence: 'execution_operations',
  security_risk_compliance: 'governance_ai_evidence',
  ai_automation_footprint: 'governance_ai_evidence',
  personas_workforce: 'personas_workforce',
};

export interface ExtractedContextFact {
  id: string;
  tenantKey: string;
  dimension: ContextDimension;
  dimensionFamily?: ContextDimensionFamily;
  domainSegment?: DomainSegment;
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
