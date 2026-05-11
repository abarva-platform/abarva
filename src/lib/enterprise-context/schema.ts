export const ENTERPRISE_CONTEXT_CANONICAL_TENANT_KEYS = [
  'apexretail',
  'meridian',
  'arcturus',
] as const;

export type EnterpriseContextTenantKey =
  (typeof ENTERPRISE_CONTEXT_CANONICAL_TENANT_KEYS)[number];

export const ENTERPRISE_CONTEXT_TENANT_ALIASES: Record<
  EnterpriseContextTenantKey,
  readonly string[]
> = {
  apexretail: ['apex-retail', 'apex'],
  meridian: ['meridian-health', 'meridian-health-system'],
  arcturus: ['first-capital', 'first-capital-financial', 'firstcapital'],
};

export const ENTERPRISE_CONTEXT_TABLES = [
  'enterprise_context_sources',
  'enterprise_context_source_files',
  'enterprise_context_records',
  'enterprise_context_facts',
  'enterprise_context_relationships',
  'enterprise_context_evidence',
  'enterprise_context_quality_issues',
  'enterprise_context_stewardship_tasks',
  'enterprise_context_snapshots',
  'enterprise_context_template_runs',
  'enterprise_context_chunk_queue',
] as const;

export type EnterpriseContextTable = (typeof ENTERPRISE_CONTEXT_TABLES)[number];

export const ENTERPRISE_CONTEXT_COMMON_METADATA_COLUMNS = [
  'client_id',
  'tenant_key',
  'source_system',
  'source_record_id',
  'source_file',
  'source_sheet',
  'source_row_number',
  'owner',
  'last_synced_at',
  'last_validated_at',
  'confidence',
  'freshness_status',
  'evidence_pointer',
] as const;

export type EnterpriseContextCommonMetadataColumn =
  (typeof ENTERPRISE_CONTEXT_COMMON_METADATA_COLUMNS)[number];

export const ENTERPRISE_CONTEXT_FRESHNESS_STATUSES = [
  'fresh',
  'attention',
  'stale',
  'unknown',
] as const;

export type EnterpriseContextFreshnessStatus =
  (typeof ENTERPRISE_CONTEXT_FRESHNESS_STATUSES)[number];

export const ENTERPRISE_CONTEXT_LIFECYCLE_STATES = [
  'active',
  'superseded',
  'inactive',
] as const;

export type EnterpriseContextLifecycleState =
  (typeof ENTERPRISE_CONTEXT_LIFECYCLE_STATES)[number];

export const ENTERPRISE_CONTEXT_ISSUE_SEVERITIES = [
  'low',
  'medium',
  'high',
  'critical',
] as const;

export type EnterpriseContextIssueSeverity =
  (typeof ENTERPRISE_CONTEXT_ISSUE_SEVERITIES)[number];

export const ENTERPRISE_CONTEXT_WORK_STATUSES = [
  'open',
  'triaged',
  'resolved',
  'accepted_risk',
] as const;

export type EnterpriseContextWorkStatus =
  (typeof ENTERPRISE_CONTEXT_WORK_STATUSES)[number];

export const ENTERPRISE_CONTEXT_RECORD_TYPES = [
  'org_role',
  'decision_right',
  'facility',
  'business_unit',
  'cmdb_application',
  'cmdb_service',
  'configuration_item',
  'vendor',
  'contract',
  'renewal',
  'spend_baseline',
  'policy',
  'procedure',
  'incident',
  'problem',
  'change',
  'sla',
  'initiative',
  'data_domain',
  'data_asset',
  'risk',
  'compliance_finding',
] as const;

export type EnterpriseContextRecordType =
  (typeof ENTERPRISE_CONTEXT_RECORD_TYPES)[number];

export const ENTERPRISE_CONTEXT_SOURCE_SYSTEMS = [
  'day_one_template',
  'servicenow',
  'workday',
  'oracle_financials',
  'coupa',
  'epic',
  'azure',
  'aws',
  'gcp',
  'okta',
  'sharepoint',
  'manual_attestation',
] as const;

export type EnterpriseContextSourceSystem =
  (typeof ENTERPRISE_CONTEXT_SOURCE_SYSTEMS)[number];

export interface EnterpriseContextSource {
  clientId: string | null;
  tenantKey: EnterpriseContextTenantKey | string;
  sourceSystem: EnterpriseContextSourceSystem | string;
  sourceKey: string;
  sourceType: string;
  displayName: string;
  systemOfRecord: boolean;
  sourceOwner?: string | null;
  stewardOwner?: string | null;
  syncCadence: string;
  tenantAliases: string[];
  sourceStatus: 'active' | 'paused' | 'deprecated';
  lastSyncedAt?: string | null;
  lastValidatedAt?: string | null;
  confidence?: number | null;
  freshnessStatus: EnterpriseContextFreshnessStatus;
  evidencePointer?: string | null;
  metadata: Record<string, unknown>;
}

export interface EnterpriseContextSourceFile {
  clientId: string | null;
  tenantKey: EnterpriseContextTenantKey | string;
  sourceFileId: string;
  sourceSystem: EnterpriseContextSourceSystem | string;
  sourceFile: string;
  sourcePath?: string | null;
  workbookName?: string | null;
  sheetNames: string[];
  fileHash?: string | null;
  rowCount: number;
  importedBy?: string | null;
  lastSyncedAt?: string | null;
  lastValidatedAt?: string | null;
  confidence?: number | null;
  freshnessStatus: EnterpriseContextFreshnessStatus;
  evidencePointer?: string | null;
  metadata: Record<string, unknown>;
}

export interface EnterpriseContextRecord {
  clientId: string | null;
  tenantKey: EnterpriseContextTenantKey | string;
  canonicalRecordId: string;
  recordType: EnterpriseContextRecordType | string;
  recordSubtype?: string | null;
  title: string;
  sourceSystem: EnterpriseContextSourceSystem | string;
  sourceRecordId: string;
  sourceFile?: string | null;
  sourceSheet?: string | null;
  sourceRowNumber?: number | null;
  owner?: string | null;
  stewardOwner?: string | null;
  lastSyncedAt?: string | null;
  lastValidatedAt?: string | null;
  confidence?: number | null;
  freshnessStatus: EnterpriseContextFreshnessStatus;
  evidencePointer?: string | null;
  lifecycleState: EnterpriseContextLifecycleState;
  payloadHash?: string | null;
  payload: Record<string, unknown>;
}

export interface EnterpriseContextFact {
  clientId: string | null;
  tenantKey: EnterpriseContextTenantKey | string;
  recordId: string;
  factKey: string;
  factType: string;
  factValue: unknown;
  factText?: string | null;
  sourceSystem: EnterpriseContextSourceSystem | string;
  sourceRecordId: string;
  sourceFile?: string | null;
  sourceSheet?: string | null;
  sourceRowNumber?: number | null;
  owner?: string | null;
  lastSyncedAt?: string | null;
  lastValidatedAt?: string | null;
  confidence?: number | null;
  freshnessStatus: EnterpriseContextFreshnessStatus;
  evidencePointer?: string | null;
  lifecycleState: EnterpriseContextLifecycleState;
  valueHash: string;
}

export interface EnterpriseContextRelationship {
  clientId: string | null;
  tenantKey: EnterpriseContextTenantKey | string;
  relationshipKey: string;
  relationshipType: string;
  fromRecordId?: string | null;
  toRecordId?: string | null;
  fromExternalId?: string | null;
  toExternalId?: string | null;
  sourceSystem: EnterpriseContextSourceSystem | string;
  sourceRecordId: string;
  sourceFile?: string | null;
  sourceSheet?: string | null;
  sourceRowNumber?: number | null;
  owner?: string | null;
  lastSyncedAt?: string | null;
  lastValidatedAt?: string | null;
  confidence?: number | null;
  freshnessStatus: EnterpriseContextFreshnessStatus;
  evidencePointer?: string | null;
  lifecycleState: EnterpriseContextLifecycleState;
  properties: Record<string, unknown>;
}

export interface EnterpriseContextEvidence {
  clientId: string | null;
  tenantKey: EnterpriseContextTenantKey | string;
  evidenceKey: string;
  evidenceType: string;
  recordId?: string | null;
  factId?: string | null;
  citationLabel: string;
  citationLocator?: string | null;
  evidencePointer: string;
  sourceSystem: EnterpriseContextSourceSystem | string;
  sourceRecordId: string;
  sourceFile?: string | null;
  sourceSheet?: string | null;
  sourceRowNumber?: number | null;
  owner?: string | null;
  evidenceUsable: boolean;
  excerpt?: string | null;
  lastSyncedAt?: string | null;
  lastValidatedAt?: string | null;
  confidence?: number | null;
  freshnessStatus: EnterpriseContextFreshnessStatus;
  lifecycleState: EnterpriseContextLifecycleState;
  metadata: Record<string, unknown>;
}

export interface EnterpriseContextQualityIssue {
  clientId: string | null;
  tenantKey: EnterpriseContextTenantKey | string;
  issueKey: string;
  issueType: string;
  severity: EnterpriseContextIssueSeverity;
  status: EnterpriseContextWorkStatus;
  affectedRecordId?: string | null;
  affectedFactId?: string | null;
  affectedRelationshipId?: string | null;
  sourceSystem: EnterpriseContextSourceSystem | string;
  sourceRecordId?: string | null;
  sourceFile?: string | null;
  sourceSheet?: string | null;
  sourceRowNumber?: number | null;
  owner?: string | null;
  stewardOwner?: string | null;
  lastSyncedAt?: string | null;
  lastValidatedAt?: string | null;
  confidence?: number | null;
  freshnessStatus: EnterpriseContextFreshnessStatus;
  evidencePointer?: string | null;
  details: Record<string, unknown>;
}

export interface EnterpriseContextStewardshipTask {
  clientId: string | null;
  tenantKey: EnterpriseContextTenantKey | string;
  taskKey: string;
  issueId?: string | null;
  taskType: string;
  title: string;
  status: 'open' | 'in_progress' | 'blocked' | 'done' | 'accepted_risk';
  priority: EnterpriseContextIssueSeverity;
  assignedOwner?: string | null;
  sourceSystem: EnterpriseContextSourceSystem | string;
  sourceRecordId?: string | null;
  sourceFile?: string | null;
  sourceSheet?: string | null;
  sourceRowNumber?: number | null;
  owner?: string | null;
  dueDate?: string | null;
  lastSyncedAt?: string | null;
  lastValidatedAt?: string | null;
  confidence?: number | null;
  freshnessStatus: EnterpriseContextFreshnessStatus;
  evidencePointer?: string | null;
  details: Record<string, unknown>;
}

export interface EnterpriseContextSnapshot {
  clientId: string | null;
  tenantKey: EnterpriseContextTenantKey | string;
  snapshotKey: string;
  snapshotType: string;
  sourceSystem: EnterpriseContextSourceSystem | string;
  sourceRecordId?: string | null;
  sourceFile?: string | null;
  sourceSheet?: string | null;
  sourceRowNumber?: number | null;
  owner?: string | null;
  lastSyncedAt?: string | null;
  lastValidatedAt?: string | null;
  confidence?: number | null;
  freshnessStatus: EnterpriseContextFreshnessStatus;
  evidencePointer?: string | null;
  snapshotPayload: Record<string, unknown>;
  diffSummary: Record<string, unknown>;
}

export interface EnterpriseContextTemplateRun {
  clientId: string | null;
  tenantKey: EnterpriseContextTenantKey | string;
  runKey: string;
  runType: 'generate_template' | 'generate_synthetic' | 'dry_run' | 'apply' | 'verify' | 'refresh';
  status: 'started' | 'completed' | 'failed';
  sourceSystem: EnterpriseContextSourceSystem | string;
  sourceRecordId?: string | null;
  sourceFile?: string | null;
  sourceSheet?: string | null;
  sourceRowNumber?: number | null;
  owner?: string | null;
  lastSyncedAt?: string | null;
  lastValidatedAt?: string | null;
  confidence?: number | null;
  freshnessStatus: EnterpriseContextFreshnessStatus;
  evidencePointer?: string | null;
  sourceRoot?: string | null;
  workbookCount: number;
  recordsSeen: number;
  recordsLoaded: number;
  qualityIssuesCreated: number;
  summary: Record<string, unknown>;
  errorPayload: Record<string, unknown>;
}

export interface EnterpriseContextChunkQueueItem {
  clientId: string | null;
  tenantKey: EnterpriseContextTenantKey | string;
  queueKey: string;
  chunkId?: string | null;
  recordId?: string | null;
  factId?: string | null;
  evidenceId?: string | null;
  operation: 'upsert' | 'deactivate' | 'rechunk' | 'embed';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';
  sourceSystem: EnterpriseContextSourceSystem | string;
  sourceRecordId?: string | null;
  sourceFile?: string | null;
  sourceSheet?: string | null;
  sourceRowNumber?: number | null;
  owner?: string | null;
  lastSyncedAt?: string | null;
  lastValidatedAt?: string | null;
  confidence?: number | null;
  freshnessStatus: EnterpriseContextFreshnessStatus;
  evidencePointer?: string | null;
  payload: Record<string, unknown>;
  errorMessage?: string | null;
}

export function normalizeEnterpriseContextTenantKey(
  tenantKey: string | null | undefined,
): EnterpriseContextTenantKey | null {
  const normalized = tenantKey?.trim().toLowerCase();
  if (!normalized) return null;

  for (const canonical of ENTERPRISE_CONTEXT_CANONICAL_TENANT_KEYS) {
    if (normalized === canonical) return canonical;
    if (ENTERPRISE_CONTEXT_TENANT_ALIASES[canonical].includes(normalized)) {
      return canonical;
    }
  }

  return null;
}
