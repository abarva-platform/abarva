import {
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
});
