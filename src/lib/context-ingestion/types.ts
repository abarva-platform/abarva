export type ContextDimension =
  | 'enterprise_profile'
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
  | 'ai_tooling_model_inventory'
  | 'incidents_ops_telemetry';

export type UploadedFileFormat =
  | 'csv'
  | 'xlsx'
  | 'json'
  | 'jsonl'
  | 'pdf'
  | 'docx'
  | 'pptx'
  | 'markdown'
  | 'zip'
  | 'unknown';

export type ExtractionMethod = 'deterministic' | 'llm' | 'hybrid';

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
  severity: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  row?: number;
  field?: string;
  expected?: string;
  actual?: string;
}

export interface ExtractedContextFact {
  id: string;
  tenantKey: 'northstar';
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
  extractionStrategy: 'structured_rows' | 'workbook_sheets' | 'document_facts' | 'slide_facts' | 'batch_archive';
  requiredApprovalRole: string;
  llmExtractionNeeded: boolean;
}

export interface IngestionUploadRun {
  uploadId: string;
  tenantKey: 'northstar';
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
