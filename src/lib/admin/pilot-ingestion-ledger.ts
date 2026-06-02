import { getAzureWriteFluentClient, type PostgresCompatClient } from '@/lib/data-plane/postgresCompat';

export type PilotIngestionBacklogRowId = 'T357' | 'T358' | 'T359' | 'T360';

export type PilotIngestionTableKey =
  | 'pilot_ingestion_template_versions'
  | 'pilot_ingestion_mapping_profiles'
  | 'pilot_ingestion_upload_runs'
  | 'pilot_ingestion_file_manifests'
  | 'pilot_ingestion_quarantine_cases'
  | 'pilot_ingestion_clarification_requests'
  | 'pilot_ingestion_approval_decisions'
  | 'pilot_ingestion_load_commits'
  | 'pilot_ingestion_load_commit_items'
  | 'pilot_ingestion_rollback_requests'
  | 'pilot_ingestion_audit_exports';

export type PilotIngestionLoadStatus =
  | 'uploaded'
  | 'scanning'
  | 'quarantined'
  | 'parsing'
  | 'validation_failed'
  | 'awaiting_clarification'
  | 'awaiting_approval'
  | 'approved'
  | 'rejected'
  | 'committing'
  | 'committed'
  | 'commit_failed'
  | 'rollback_requested'
  | 'rolling_back'
  | 'rolled_back';

export type PilotIngestionLoadIntent =
  | 'pilot_rehearsal'
  | 'initial_load'
  | 'incremental_refresh'
  | 'correction'
  | 'rollback_replay';

export type PilotIngestionRollbackStatus =
  | 'requested'
  | 'approved'
  | 'running'
  | 'completed'
  | 'failed'
  | 'rejected';

export interface PilotIngestionLedgerTable {
  table: PilotIngestionTableKey;
  purpose: string;
  row: PilotIngestionBacklogRowId;
  tenantScopedBy: 'tenant_key_and_client_id';
}

export interface PilotIngestionIdempotencyInput {
  tenantKey: string;
  sourceSystem: string;
  fileSha256: string;
  templateKey: string;
  templateVersion: string;
  mappingProfileKey: string;
  mappingProfileVersion: string;
  loadIntent: PilotIngestionLoadIntent;
}

export interface PilotIngestionCommitReadinessInput {
  uploadStatus: PilotIngestionLoadStatus;
  openQuarantineCases: number;
  openClarificationRequests: number;
  approvalDecision: 'approved' | 'rejected' | 'needs_clarification' | null;
  idempotencyConflict: boolean;
}

export interface PilotIngestionCommitReadiness {
  ready: boolean;
  blockers: string[];
}

export interface PilotIngestionRollbackPlanInput {
  commitStatus: 'committed' | 'rollback_requested' | 'rolling_back' | 'rolled_back' | 'commit_failed';
  activeCommitItems: number;
  alreadyUnloadedItems: number;
}

export interface PilotIngestionRollbackPlan {
  reversible: boolean;
  nextStatus: PilotIngestionRollbackStatus | 'not_required';
  actions: readonly string[];
}

export interface PilotIngestionAuditOnlyWriteInput {
  tenantKey: string;
  segmentKey: string;
  storage: {
    accountName: string;
    containerName: string;
    blobPath: string;
    sizeBytes: number;
    contentType: string;
    sha256: string;
  };
  producedAt: string;
  sourceSystem?: string;
  templateVersion?: string;
  mappingProfileKey?: string;
  mappingProfileVersion?: string;
  auditRowId: string;
  outcome:
    | { status: 'accepted'; chunksWritten: number }
    | { status: 'quarantined'; reasonCodes: readonly string[] };
  protectionDecision: 'allow' | 'quarantine';
}

export interface PilotIngestionAuditOnlyWritePlan {
  mode: 'audit_only';
  tenantKey: string;
  uploadRun: {
    tenantKey: string;
    loadIntent: PilotIngestionLoadIntent;
    status: PilotIngestionLoadStatus;
    sourceSystem: string;
    segmentKey: string;
    auditRowId: string;
    producedAt: string;
    idempotencyKey: string;
  };
  fileManifest: {
    tenantKey: string;
    segmentKey: string;
    accountName: string;
    containerName: string;
    blobPath: string;
    sizeBytes: number;
    contentType: string;
    sha256: string;
    protectionDecision: 'allow' | 'quarantine';
  };
  quarantineCase?: {
    tenantKey: string;
    segmentKey: string;
    auditRowId: string;
    reasonCodes: readonly string[];
    status: 'open';
  };
  commitBlocked: true;
  commitBlockers: readonly string[];
}

export interface DurablePilotIngestionLedgerWriteInput {
  clientId: string;
  initiatedByUserId: string;
  attestationVersion: string;
  originalFilename: string;
  plan: PilotIngestionAuditOnlyWritePlan;
  db?: PostgresCompatClient;
}

export interface DurablePilotIngestionLedgerWriteResult {
  status: 'written';
  uploadRunId: string;
  fileManifestId: string;
  quarantineCaseId: string | null;
  idempotencyKey: string;
  commitBlocked: true;
  commitBlockers: readonly string[];
}

export const PILOT_INGESTION_BACKLOG_ROWS: readonly PilotIngestionBacklogRowId[] = [
  'T357',
  'T358',
  'T359',
  'T360',
];

export const PILOT_INGESTION_LEDGER_TABLES: readonly PilotIngestionLedgerTable[] = [
  {
    table: 'pilot_ingestion_template_versions',
    purpose: 'Pins every load to the enterprise-context template manifest and validation rule version used at parse time.',
    row: 'T359',
    tenantScopedBy: 'tenant_key_and_client_id',
  },
  {
    table: 'pilot_ingestion_mapping_profiles',
    purpose: 'Pins every source-system field mapping to a versioned, hashable mapping profile.',
    row: 'T359',
    tenantScopedBy: 'tenant_key_and_client_id',
  },
  {
    table: 'pilot_ingestion_upload_runs',
    purpose: 'Durable upload-run state machine from consent through scan, parse, approval, commit, and rollback.',
    row: 'T357',
    tenantScopedBy: 'tenant_key_and_client_id',
  },
  {
    table: 'pilot_ingestion_file_manifests',
    purpose: 'File-level manifest for raw, parsed, preview, evidence, quarantine, and audit-export artifacts.',
    row: 'T357',
    tenantScopedBy: 'tenant_key_and_client_id',
  },
  {
    table: 'pilot_ingestion_quarantine_cases',
    purpose: 'Open/closed quarantine record tied to the upload run and manifest that triggered review.',
    row: 'T357',
    tenantScopedBy: 'tenant_key_and_client_id',
  },
  {
    table: 'pilot_ingestion_clarification_requests',
    purpose: 'Reviewer questions and anomaly resolutions required before preview approval.',
    row: 'T357',
    tenantScopedBy: 'tenant_key_and_client_id',
  },
  {
    table: 'pilot_ingestion_approval_decisions',
    purpose: 'Approver decision with preview hash and policy version, before operational data stores are touched.',
    row: 'T357',
    tenantScopedBy: 'tenant_key_and_client_id',
  },
  {
    table: 'pilot_ingestion_load_commits',
    purpose: 'Committed load-batch ledger with idempotency guard and aggregate row counts.',
    row: 'T358',
    tenantScopedBy: 'tenant_key_and_client_id',
  },
  {
    table: 'pilot_ingestion_load_commit_items',
    purpose: 'Per-record write evidence with prior and written snapshots so unload can reverse the batch.',
    row: 'T360',
    tenantScopedBy: 'tenant_key_and_client_id',
  },
  {
    table: 'pilot_ingestion_rollback_requests',
    purpose: 'Human-approved rollback/unload request lifecycle for a committed load batch.',
    row: 'T360',
    tenantScopedBy: 'tenant_key_and_client_id',
  },
  {
    table: 'pilot_ingestion_audit_exports',
    purpose: 'Export manifest for upload-run or load-commit audit packets.',
    row: 'T357',
    tenantScopedBy: 'tenant_key_and_client_id',
  },
];

function normalizePart(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9._:-]+/g, '-');
}

export function buildPilotIngestionIdempotencyKey(input: PilotIngestionIdempotencyInput): string {
  return [
    'pilot-load',
    normalizePart(input.tenantKey),
    normalizePart(input.sourceSystem),
    normalizePart(input.fileSha256),
    normalizePart(input.templateKey),
    normalizePart(input.templateVersion),
    normalizePart(input.mappingProfileKey),
    normalizePart(input.mappingProfileVersion),
    input.loadIntent,
  ].join(':');
}

export function evaluatePilotIngestionCommitReadiness(
  input: PilotIngestionCommitReadinessInput,
): PilotIngestionCommitReadiness {
  const blockers: string[] = [];

  if (input.uploadStatus !== 'approved') {
    blockers.push(`upload run must be approved before commit; current status is ${input.uploadStatus}`);
  }

  if (input.openQuarantineCases > 0) {
    blockers.push('all quarantine cases must be released, rejected, or hard-deleted before commit');
  }

  if (input.openClarificationRequests > 0) {
    blockers.push('all schema clarification requests must be answered, waived, or closed before commit');
  }

  if (input.approvalDecision !== 'approved') {
    blockers.push('a final approved preview decision is required before commit');
  }

  if (input.idempotencyConflict) {
    blockers.push('idempotency key already committed for this tenant/template/mapping/file combination');
  }

  return {
    ready: blockers.length === 0,
    blockers,
  };
}

export function planPilotIngestionRollback(
  input: PilotIngestionRollbackPlanInput,
): PilotIngestionRollbackPlan {
  if (input.commitStatus === 'rolled_back') {
    return {
      reversible: false,
      nextStatus: 'not_required',
      actions: ['commit already rolled back; no unload action required'],
    };
  }

  if (input.commitStatus === 'commit_failed') {
    return {
      reversible: false,
      nextStatus: 'rejected',
      actions: ['failed commits need reconciliation before rollback can be approved'],
    };
  }

  if (input.activeCommitItems === 0) {
    return {
      reversible: false,
      nextStatus: 'completed',
      actions: ['no active commit items remain to unload'],
    };
  }

  return {
    reversible: true,
    nextStatus: input.commitStatus === 'rollback_requested' ? 'approved' : 'requested',
    actions: [
      'lock the load commit against new writes',
      'restore prior_snapshot for updated rows',
      'delete inserted rows whose prior_snapshot is null',
      'mark commit items as unloaded with rollback evidence',
    ],
  };
}

export function buildPilotIngestionAuditOnlyWritePlan(
  input: PilotIngestionAuditOnlyWriteInput,
): PilotIngestionAuditOnlyWritePlan {
  const sourceSystem = input.sourceSystem?.trim() || 'azure_landing_zone';
  const templateVersion = input.templateVersion?.trim() || 'unversioned';
  const mappingProfileKey = input.mappingProfileKey?.trim() || 'unmapped';
  const mappingProfileVersion = input.mappingProfileVersion?.trim() || 'unversioned';
  const loadIntent: PilotIngestionLoadIntent = 'pilot_rehearsal';
  const status: PilotIngestionLoadStatus =
    input.outcome.status === 'quarantined' ? 'quarantined' : 'awaiting_approval';
  const idempotencyKey = buildPilotIngestionIdempotencyKey({
    tenantKey: input.tenantKey,
    sourceSystem,
    fileSha256: input.storage.sha256,
    templateKey: input.segmentKey,
    templateVersion,
    mappingProfileKey,
    mappingProfileVersion,
    loadIntent,
  });

  const plan: PilotIngestionAuditOnlyWritePlan = {
    mode: 'audit_only',
    tenantKey: input.tenantKey,
    uploadRun: {
      tenantKey: input.tenantKey,
      loadIntent,
      status,
      sourceSystem,
      segmentKey: input.segmentKey,
      auditRowId: input.auditRowId,
      producedAt: input.producedAt,
      idempotencyKey,
    },
    fileManifest: {
      tenantKey: input.tenantKey,
      segmentKey: input.segmentKey,
      accountName: input.storage.accountName,
      containerName: input.storage.containerName,
      blobPath: input.storage.blobPath,
      sizeBytes: input.storage.sizeBytes,
      contentType: input.storage.contentType,
      sha256: input.storage.sha256,
      protectionDecision: input.protectionDecision,
    },
    commitBlocked: true,
    commitBlockers: [
      'audit-only ledger recording does not commit parsed facts',
      'human preview approval and commit adapter are required before data-plane writes',
    ],
  };

  if (input.outcome.status === 'quarantined') {
    plan.quarantineCase = {
      tenantKey: input.tenantKey,
      segmentKey: input.segmentKey,
      auditRowId: input.auditRowId,
      reasonCodes: input.outcome.reasonCodes,
      status: 'open',
    };
  }

  return plan;
}

export function getPilotIngestionLedgerTables(): readonly PilotIngestionLedgerTable[] {
  return PILOT_INGESTION_LEDGER_TABLES;
}

function requireNonEmpty(value: string, label: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw new Error(`${label}_required`);
  return trimmed;
}

function firstRowId(data: unknown, table: PilotIngestionTableKey): string {
  const row = Array.isArray(data) ? data[0] : data;
  const id = (row as { id?: unknown } | null)?.id;
  if (typeof id !== 'string' || id.trim() === '') {
    throw new Error(`pilot_ledger_write_missing_id:${table}`);
  }
  return id;
}

function writeError(table: PilotIngestionTableKey, error: { message?: string } | null | undefined): Error {
  return new Error(`pilot_ledger_write_failed:${table}:${error?.message ?? 'unknown error'}`);
}

export async function writeDurablePilotIngestionAuditOnlyLedger(
  input: DurablePilotIngestionLedgerWriteInput,
): Promise<DurablePilotIngestionLedgerWriteResult> {
  const clientId = requireNonEmpty(input.clientId, 'client_id');
  const initiatedByUserId = requireNonEmpty(input.initiatedByUserId, 'initiated_by_user_id');
  const attestationVersion = requireNonEmpty(input.attestationVersion, 'attestation_version');
  const originalFilename = requireNonEmpty(input.originalFilename, 'original_filename');
  const db = input.db ?? getAzureWriteFluentClient();
  const { plan } = input;
  const now = plan.uploadRun.producedAt;
  const runKey = plan.uploadRun.auditRowId;

  const uploadRunRow = {
    client_id: clientId,
    tenant_key: plan.tenantKey,
    run_key: runKey,
    idempotency_key: plan.uploadRun.idempotencyKey,
    initiated_by_user_id: initiatedByUserId,
    attestation_version: attestationVersion,
    source_system: plan.uploadRun.sourceSystem,
    load_intent: plan.uploadRun.loadIntent,
    status: plan.uploadRun.status,
    row_counts: {
      audit_row_id: plan.uploadRun.auditRowId,
      segment_key: plan.uploadRun.segmentKey,
    },
    validation_summary: {
      mode: plan.mode,
      commit_blocked: plan.commitBlocked,
      commit_blockers: plan.commitBlockers,
      produced_at: now,
    },
    error_report: [],
  };

  const uploadRunWrite = await db
    .from('pilot_ingestion_upload_runs')
    .upsert(uploadRunRow, { onConflict: 'tenant_key,run_key' })
    .select('id');
  if (uploadRunWrite.error) throw writeError('pilot_ingestion_upload_runs', uploadRunWrite.error);
  const uploadRunId = firstRowId(uploadRunWrite.data, 'pilot_ingestion_upload_runs');

  const fileKey = `${plan.fileManifest.segmentKey}:${plan.fileManifest.sha256}`;
  const fileManifestWrite = await db
    .from('pilot_ingestion_file_manifests')
    .upsert({
      client_id: clientId,
      tenant_key: plan.tenantKey,
      upload_run_id: uploadRunId,
      file_key: fileKey,
      original_filename: originalFilename,
      blob_uri: `azure://${plan.fileManifest.accountName}/${plan.fileManifest.containerName}/${plan.fileManifest.blobPath}`,
      sha256: plan.fileManifest.sha256,
      parse_cache_key: `${plan.tenantKey}:${plan.fileManifest.sha256}`,
      byte_size: plan.fileManifest.sizeBytes,
      mime_type: plan.fileManifest.contentType,
      manifest_role: 'raw',
      storage_state: plan.fileManifest.protectionDecision === 'quarantine' ? 'quarantined' : 'landed',
      malware_status: 'pending',
      sensitive_data_status: plan.fileManifest.protectionDecision === 'quarantine' ? 'quarantined' : 'allowed',
      metadata: {
        segment_key: plan.fileManifest.segmentKey,
        account_name: plan.fileManifest.accountName,
        container_name: plan.fileManifest.containerName,
        blob_path: plan.fileManifest.blobPath,
        protection_decision: plan.fileManifest.protectionDecision,
      },
    }, { onConflict: 'tenant_key,upload_run_id,file_key' })
    .select('id');
  if (fileManifestWrite.error) throw writeError('pilot_ingestion_file_manifests', fileManifestWrite.error);
  const fileManifestId = firstRowId(fileManifestWrite.data, 'pilot_ingestion_file_manifests');

  let quarantineCaseId: string | null = null;
  if (plan.quarantineCase) {
    const caseKey = `${plan.quarantineCase.segmentKey}:${plan.quarantineCase.auditRowId}`;
    const quarantineWrite = await db
      .from('pilot_ingestion_quarantine_cases')
      .upsert({
        client_id: clientId,
        tenant_key: plan.tenantKey,
        upload_run_id: uploadRunId,
        file_manifest_id: fileManifestId,
        case_key: caseKey,
        reason_codes: [...plan.quarantineCase.reasonCodes],
        status: plan.quarantineCase.status,
      }, { onConflict: 'tenant_key,case_key' })
      .select('id');
    if (quarantineWrite.error) throw writeError('pilot_ingestion_quarantine_cases', quarantineWrite.error);
    quarantineCaseId = firstRowId(quarantineWrite.data, 'pilot_ingestion_quarantine_cases');
  }

  return {
    status: 'written',
    uploadRunId,
    fileManifestId,
    quarantineCaseId,
    idempotencyKey: plan.uploadRun.idempotencyKey,
    commitBlocked: true,
    commitBlockers: plan.commitBlockers,
  };
}
