import {
  buildPilotIngestionAuditOnlyWritePlan,
  buildPilotIngestionIdempotencyKey,
  evaluatePilotIngestionCommitReadiness,
  getPilotIngestionLedgerTables,
  planPilotIngestionRollback,
} from '@/lib/admin/pilot-ingestion-ledger';

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
});
