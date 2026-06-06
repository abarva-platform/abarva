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
  | "org_decision_rights"
  | "kpi_library"
  | "databricks_lakehouse_target"
  | "plan_provider_analytics"
  | "use_case_evidence"
  | "epic_optimization_backlog"
  | "erp_data_estate"
  | "ams_vendor_contracts"
  | "care_management_staffing"
  | "clinical_data_contracts";

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
