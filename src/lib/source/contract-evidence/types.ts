export type SourceContractEvidenceArchetypeKey =
  | "ams_contract_optimization"
  | "bpo_contract_optimization"
  | "saas_renewal_optimization";

export type SourceContractEvidenceFamily =
  | "contract_baseline"
  | "invoice_summary"
  | "invoice_exception"
  | "sla_performance"
  | "ticket_volume"
  | "staffing_model"
  | "change_order"
  | "renewal_terms"
  | "evidence_reference";

export type SourceContractEvidenceSourceType =
  | "client_uploaded"
  | "system_export"
  | "vendor_provided"
  | "synthetic_demo";

export interface SourceContractEvidenceColumn {
  key: string;
  label: string;
  valueType: "text" | "number" | "currency" | "date" | "boolean" | "percent";
  required: boolean;
  description: string;
  example: string;
}

export interface SourceContractEvidenceTemplate {
  family: SourceContractEvidenceFamily;
  sheetName: string;
  fileName: string;
  required: boolean;
  purpose: string;
  sourceGuidance: string;
  notFor: string;
  columns: SourceContractEvidenceColumn[];
}

export interface SourceContractEvidenceTemplatePack {
  archetypeKey: SourceContractEvidenceArchetypeKey;
  label: string;
  purpose: string;
  operatingRule: string;
  templates: SourceContractEvidenceTemplate[];
}

export type SourceContractEvidenceRowInput = {
  family: SourceContractEvidenceFamily;
  sourceSheet?: string;
  sourceRowNumber?: number;
  payload: Record<string, unknown>;
};

export interface SourceContractEvidencePackInput {
  tenantKey: string;
  sourceEventId: string;
  sourceArtifactId?: string | null;
  archetypeKey: SourceContractEvidenceArchetypeKey;
  evidencePackName: string;
  uploadBatchId: string;
  sourceType: SourceContractEvidenceSourceType;
  rows: SourceContractEvidenceRowInput[];
  metadata?: Record<string, unknown>;
}

export interface SourceContractEvidenceManifestRow {
  tenant_key: string;
  source_event_id: string;
  source_artifact_id: string | null;
  archetype_key: SourceContractEvidenceArchetypeKey;
  evidence_pack_name: string;
  upload_batch_id: string;
  source_type: SourceContractEvidenceSourceType;
  validation_status: "accepted" | "partial" | "needs_review" | "rejected";
  row_count: number;
  required_family_count: number;
  covered_required_family_count: number;
  missing_required_families: SourceContractEvidenceFamily[];
  warnings: string[];
  metadata: Record<string, unknown>;
}

export interface SourceContractEvidenceStructuredRow {
  tenant_key: string;
  source_event_id: string;
  source_artifact_id: string | null;
  archetype_key: SourceContractEvidenceArchetypeKey;
  evidence_family: SourceContractEvidenceFamily;
  source_sheet: string;
  source_row_number: number | null;
  row_hash: string;
  row_payload: Record<string, unknown>;
  normalized_subject: string | null;
  period_start: string | null;
  period_end: string | null;
  amount_usd: number | null;
  confidence: number;
  validation_status: "accepted" | "partial" | "needs_review" | "rejected";
}

export interface SourceContractEvidenceMetricRow {
  tenant_key: string;
  source_event_id: string;
  archetype_key: SourceContractEvidenceArchetypeKey;
  metric_key: string;
  metric_label: string;
  metric_value: number;
  unit: string;
  evidence_family: SourceContractEvidenceFamily;
  basis: Record<string, unknown>;
  confidence: number;
  validation_status: "accepted" | "partial" | "needs_review";
}

export interface SourceContractEvidencePersistencePayload {
  manifest: SourceContractEvidenceManifestRow;
  rows: SourceContractEvidenceStructuredRow[];
  metrics: SourceContractEvidenceMetricRow[];
}
