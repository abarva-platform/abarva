import {
  buildPilotIngestionAuditOnlyWritePlan,
  buildPilotIngestionIdempotencyKey,
  evaluatePilotIngestionCommitReadiness,
  getPilotIngestionLedgerTables,
  planPilotIngestionRollback,
  writeDurablePilotIngestionAuditOnlyLedger,
} from '@/lib/admin/pilot-ingestion-ledger';

type WriteCapture = {
  table: string;
  operation: 'upsert';
  payload: Record<string, unknown>;
  options: Record<string, unknown>;
};

function fakeLedgerDb(options: { failTable?: string } = {}) {
  const writes: WriteCapture[] = [];
  const counters = new Map<string, number>();
  const db = {
    from(table: string) {
      return {
        upsert(payload: Record<string, unknown>, upsertOptions: Record<string, unknown>) {
          writes.push({ table, operation: 'upsert', payload, options: upsertOptions });
          return {
            async select() {
              if (options.failTable === table) {
                return { data: null, error: { message: `${table} unavailable` } };
              }
              const next = (counters.get(table) ?? 0) + 1;
              counters.set(table, next);
              return { data: [{ id: `${table}-id-${next}` }], error: null };
            },
          };
        },
      };
    },
  };
  return { db, writes };
}

describe('pilot ingestion ledger contract', () => {
  it('covers T357-T360 with tenant-scoped ledger tables', () => {
    const tables = getPilotIngestionLedgerTables();

    expect(tables).toHaveLength(11);
    expect(new Set(tables.map((table) => table.row))).toEqual(
      new Set(['T357', 'T358', 'T359', 'T360']),
    );
    expect(tables.every((table) => table.tenantScopedBy === 'tenant_key_and_client_id')).toBe(true);
  });

  it('builds a stable idempotency key from tenant, file, template, and mapping version', () => {
    const first = buildPilotIngestionIdempotencyKey({
      tenantKey: 'Meridian-Health',
      sourceSystem: 'Workday HCM',
      fileSha256: ' ABC123 ',
      templateKey: 'org_roles_teams',
      templateVersion: 'v1.0.0',
      mappingProfileKey: 'workday-default',
      mappingProfileVersion: '2026.06',
      loadIntent: 'initial_load',
    });

    const second = buildPilotIngestionIdempotencyKey({
      tenantKey: 'meridian health',
      sourceSystem: 'workday-hcm',
      fileSha256: 'abc123',
      templateKey: 'org_roles_teams',
      templateVersion: 'v1.0.0',
      mappingProfileKey: 'workday-default',
      mappingProfileVersion: '2026.06',
      loadIntent: 'initial_load',
    });

    expect(first).toBe(second);
    expect(first).toBe(
      'pilot-load:meridian-health:workday-hcm:abc123:org_roles_teams:v1.0.0:workday-default:2026.06:initial_load',
    );
  });

  it('blocks commits until quarantine, clarification, approval, and idempotency gates are clean', () => {
    expect(
      evaluatePilotIngestionCommitReadiness({
        uploadStatus: 'awaiting_approval',
        openQuarantineCases: 1,
        openClarificationRequests: 2,
        approvalDecision: 'needs_clarification',
        idempotencyConflict: true,
      }),
    ).toEqual({
      ready: false,
      blockers: [
        'upload run must be approved before commit; current status is awaiting_approval',
        'all quarantine cases must be released, rejected, or hard-deleted before commit',
        'all schema clarification requests must be answered, waived, or closed before commit',
        'a final approved preview decision is required before commit',
        'idempotency key already committed for this tenant/template/mapping/file combination',
      ],
    });

    expect(
      evaluatePilotIngestionCommitReadiness({
        uploadStatus: 'approved',
        openQuarantineCases: 0,
        openClarificationRequests: 0,
        approvalDecision: 'approved',
        idempotencyConflict: false,
      }),
    ).toEqual({ ready: true, blockers: [] });
  });

  it('plans rollback as a reversible unload only while active commit items remain', () => {
    expect(
      planPilotIngestionRollback({
        commitStatus: 'committed',
        activeCommitItems: 12,
        alreadyUnloadedItems: 0,
      }),
    ).toEqual({
      reversible: true,
      nextStatus: 'requested',
      actions: [
        'lock the load commit against new writes',
        'restore prior_snapshot for updated rows',
        'delete inserted rows whose prior_snapshot is null',
        'mark commit items as unloaded with rollback evidence',
      ],
    });

    expect(
      planPilotIngestionRollback({
        commitStatus: 'rolled_back',
        activeCommitItems: 0,
        alreadyUnloadedItems: 12,
      }),
    ).toEqual({
      reversible: false,
      nextStatus: 'not_required',
      actions: ['commit already rolled back; no unload action required'],
    });
  });

  it('builds an audit-only upload/file manifest plan that blocks commit', () => {
    const plan = buildPilotIngestionAuditOnlyWritePlan({
      tenantKey: 'apexretail',
      segmentKey: 'kpi_dictionary',
      storage: {
        accountName: 'staapex',
        containerName: 'landing',
        blobPath: 'apex/kpi.csv',
        sizeBytes: 42,
        contentType: 'text/csv',
        sha256: 'abc123',
      },
      producedAt: '2026-06-02T11:00:00Z',
      sourceSystem: 'Workday',
      templateVersion: '2026.06',
      mappingProfileKey: 'default',
      mappingProfileVersion: '1',
      auditRowId: 'audit-1',
      outcome: { status: 'accepted', chunksWritten: 0 },
      protectionDecision: 'allow',
    });

    expect(plan.mode).toBe('audit_only');
    expect(plan.tenantKey).toBe('apexretail');
    expect(plan.uploadRun.status).toBe('awaiting_approval');
    expect(plan.fileManifest.blobPath).toBe('apex/kpi.csv');
    expect(plan.quarantineCase).toBeUndefined();
    expect(plan.commitBlocked).toBe(true);
    expect(plan.commitBlockers).toContain('audit-only ledger recording does not commit parsed facts');
    expect(plan.uploadRun.idempotencyKey).toBe(
      'pilot-load:apexretail:workday:abc123:kpi_dictionary:2026.06:default:1:pilot_rehearsal',
    );
  });

  it('adds an open quarantine case when the landing-zone guard quarantines a file', () => {
    const plan = buildPilotIngestionAuditOnlyWritePlan({
      tenantKey: 'meridian',
      segmentKey: 'evidence_ledger',
      storage: {
        accountName: 'stameridian',
        containerName: 'landing',
        blobPath: 'meridian/leak.csv',
        sizeBytes: 77,
        contentType: 'text/csv',
        sha256: 'def456',
      },
      producedAt: '2026-06-02T11:00:00Z',
      auditRowId: 'audit-2',
      outcome: { status: 'quarantined', reasonCodes: ['ssn', 'email'] },
      protectionDecision: 'quarantine',
    });

    expect(plan.uploadRun.status).toBe('quarantined');
    expect(plan.fileManifest.protectionDecision).toBe('quarantine');
    expect(plan.quarantineCase).toEqual({
      tenantKey: 'meridian',
      segmentKey: 'evidence_ledger',
      auditRowId: 'audit-2',
      reasonCodes: ['ssn', 'email'],
      status: 'open',
    });
  });

  it('writes accepted audit-only plans to durable upload and manifest ledger tables', async () => {
    const { db, writes } = fakeLedgerDb();
    const plan = buildPilotIngestionAuditOnlyWritePlan({
      tenantKey: 'apexretail',
      segmentKey: 'application_portfolio',
      storage: {
        accountName: 'staapex',
        containerName: 'landing',
        blobPath: 'apex/apps.csv',
        sizeBytes: 1024,
        contentType: 'text/csv',
        sha256: 'abc123',
      },
      producedAt: '2026-06-02T11:00:00Z',
      sourceSystem: 'Azure Blob',
      templateVersion: '2026.06',
      mappingProfileKey: 'default',
      mappingProfileVersion: '1',
      auditRowId: 'audit-accepted-1',
      outcome: { status: 'accepted', chunksWritten: 12 },
      protectionDecision: 'allow',
    });

    const result = await writeDurablePilotIngestionAuditOnlyLedger({
      clientId: '9b6c62cb-26d2-4d45-9107-eeb5f2f55252',
      initiatedByUserId: 'user-1',
      attestationVersion: 'pilot-loader-data-load-attestation-v1',
      originalFilename: 'apps.csv',
      plan,
      db: db as never,
    });

    expect(result).toEqual({
      status: 'written',
      uploadRunId: 'pilot_ingestion_upload_runs-id-1',
      fileManifestId: 'pilot_ingestion_file_manifests-id-1',
      quarantineCaseId: null,
      idempotencyKey: plan.uploadRun.idempotencyKey,
      commitBlocked: true,
      commitBlockers: plan.commitBlockers,
    });
    expect(writes.map((write) => write.table)).toEqual([
      'pilot_ingestion_upload_runs',
      'pilot_ingestion_file_manifests',
    ]);
    expect(writes[0]).toMatchObject({
      table: 'pilot_ingestion_upload_runs',
      options: { onConflict: 'tenant_key,run_key' },
      payload: {
        client_id: '9b6c62cb-26d2-4d45-9107-eeb5f2f55252',
        tenant_key: 'apexretail',
        run_key: 'audit-accepted-1',
        initiated_by_user_id: 'user-1',
        attestation_version: 'pilot-loader-data-load-attestation-v1',
        status: 'awaiting_approval',
      },
    });
    expect(writes[1]).toMatchObject({
      table: 'pilot_ingestion_file_manifests',
      options: { onConflict: 'tenant_key,upload_run_id,file_key' },
      payload: {
        tenant_key: 'apexretail',
        upload_run_id: 'pilot_ingestion_upload_runs-id-1',
        original_filename: 'apps.csv',
        blob_uri: 'azure://staapex/landing/apex/apps.csv',
        storage_state: 'landed',
        sensitive_data_status: 'allowed',
      },
    });
  });

  it('writes an open durable quarantine case for quarantined audit-only plans', async () => {
    const { db, writes } = fakeLedgerDb();
    const plan = buildPilotIngestionAuditOnlyWritePlan({
      tenantKey: 'meridian',
      segmentKey: 'evidence_ledger',
      storage: {
        accountName: 'stameridian',
        containerName: 'quarantine',
        blobPath: 'meridian/leak.csv',
        sizeBytes: 2048,
        contentType: 'text/csv',
        sha256: 'def456',
      },
      producedAt: '2026-06-02T11:00:00Z',
      auditRowId: 'audit-quarantine-1',
      outcome: { status: 'quarantined', reasonCodes: ['ssn', 'dob'] },
      protectionDecision: 'quarantine',
    });

    const result = await writeDurablePilotIngestionAuditOnlyLedger({
      clientId: '59ade265-7bda-46be-a5d4-8f346b3cac0a',
      initiatedByUserId: 'user-2',
      attestationVersion: 'pilot-loader-data-load-attestation-v1',
      originalFilename: 'leak.csv',
      plan,
      db: db as never,
    });

    expect(result.quarantineCaseId).toBe('pilot_ingestion_quarantine_cases-id-1');
    expect(writes.map((write) => write.table)).toEqual([
      'pilot_ingestion_upload_runs',
      'pilot_ingestion_file_manifests',
      'pilot_ingestion_quarantine_cases',
    ]);
    expect(writes[1].payload).toMatchObject({
      storage_state: 'quarantined',
      sensitive_data_status: 'quarantined',
    });
    expect(writes[2]).toMatchObject({
      table: 'pilot_ingestion_quarantine_cases',
      options: { onConflict: 'tenant_key,case_key' },
      payload: {
        tenant_key: 'meridian',
        upload_run_id: 'pilot_ingestion_upload_runs-id-1',
        file_manifest_id: 'pilot_ingestion_file_manifests-id-1',
        case_key: 'evidence_ledger:audit-quarantine-1',
        reason_codes: ['ssn', 'dob'],
        status: 'open',
      },
    });
  });

  it('fails loudly when a durable ledger table write fails', async () => {
    const { db } = fakeLedgerDb({ failTable: 'pilot_ingestion_file_manifests' });
    const plan = buildPilotIngestionAuditOnlyWritePlan({
      tenantKey: 'apexretail',
      segmentKey: 'application_portfolio',
      storage: {
        accountName: 'staapex',
        containerName: 'landing',
        blobPath: 'apex/apps.csv',
        sizeBytes: 1024,
        contentType: 'text/csv',
        sha256: 'abc123',
      },
      producedAt: '2026-06-02T11:00:00Z',
      auditRowId: 'audit-failure-1',
      outcome: { status: 'accepted', chunksWritten: 12 },
      protectionDecision: 'allow',
    });

    await expect(writeDurablePilotIngestionAuditOnlyLedger({
      clientId: '9b6c62cb-26d2-4d45-9107-eeb5f2f55252',
      initiatedByUserId: 'user-1',
      attestationVersion: 'pilot-loader-data-load-attestation-v1',
      originalFilename: 'apps.csv',
      plan,
      db: db as never,
    })).rejects.toThrow(
      'pilot_ledger_write_failed:pilot_ingestion_file_manifests:pilot_ingestion_file_manifests unavailable',
    );
  });
});
