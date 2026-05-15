import fs from 'node:fs';
import path from 'node:path';

let fromMock: jest.Mock;

jest.mock('@/lib/supabase-server', () => ({
  getServerSupabase: () => ({ from: fromMock }),
}));

import { supabaseQuarantineAuditDataSource } from '../quarantine-audit-supabase';

class AwaitableQueryBuilder<T> {
  readonly select = jest.fn(() => this);
  readonly eq = jest.fn(() => this);
  readonly is = jest.fn(() => this);
  readonly order = jest.fn(() => this);
  readonly limit = jest.fn(() => this);
  readonly gte = jest.fn(() => this);

  constructor(private readonly response: T) {}

  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve(this.response).then(onfulfilled, onrejected);
  }
}

function parentLookupBuilder() {
  return {
    select: jest.fn(function select() { return this; }),
    eq: jest.fn(function eq() { return this; }),
    maybeSingle: jest.fn(async () => ({
      data: {
        tenant_client_key: 'apex-retail',
        ingestion_tier: 'tier2_blob',
        filename: 'sample.csv',
        mime_type: 'text/csv',
        size_bytes: 123,
        sha256: 'abc123',
        purview_reached: true,
        purview_labels: ['Microsoft.Purview.HealthData', 'AbarVa.Sensitive.PHI'],
        storage_path: 'quarantine/apex/sample.csv',
      },
      error: null,
    })),
  };
}

describe('supabaseQuarantineAuditDataSource', () => {
  beforeEach(() => {
    fromMock = jest.fn();
  });

  it('lists only parent audit rows for the requested tenant', async () => {
    const query = new AwaitableQueryBuilder({
      data: [
        {
          id: 'row-1',
          tenant_client_key: 'apex-retail',
          evaluated_at: '2026-05-15T12:00:00.000Z',
          ingestion_tier: 'tier2_blob',
          uploader_user_id: null,
          filename: 'upload.csv',
          mime_type: 'text/csv',
          size_bytes: 100,
          sha256: 'hash',
          pattern_decision: 'quarantine',
          purview_reached: true,
          purview_labels: ['HIPAA'],
          final_decision: 'quarantine',
          reason_codes: ['phi_detected'],
          released_at: null,
          released_by: null,
          storage_path: 'quarantine/apex/upload.csv',
          metadata: { source: 'test' },
        },
      ],
      error: null,
    });

    fromMock.mockReturnValue(query);

    const rows = await supabaseQuarantineAuditDataSource.list({
      tenantClientKey: 'apex-retail',
      decision: 'quarantine',
      ingestionTier: 'tier2_blob',
      sinceIso: '2026-05-01T00:00:00.000Z',
      limit: 50,
    });

    expect(fromMock).toHaveBeenCalledWith('sensitive_upload_audit');
    expect(query.eq).toHaveBeenCalledWith('tenant_client_key', 'apex-retail');
    expect(query.is).toHaveBeenCalledWith('parent_id', null);
    expect(query.eq).toHaveBeenCalledWith('final_decision', 'quarantine');
    expect(query.eq).toHaveBeenCalledWith('ingestion_tier', 'tier2_blob');
    expect(query.gte).toHaveBeenCalledWith('evaluated_at', '2026-05-01T00:00:00.000Z');
    expect(query.limit).toHaveBeenCalledWith(50);
    expect(rows[0]?.tenantClientKey).toBe('apex-retail');
    expect(rows[0]?.purviewLabels).toEqual(['HIPAA']);
  });

  it('release writes a lifecycle row without mutating the original audit row', async () => {
    const parent = parentLookupBuilder();
    const insert = { insert: jest.fn(async () => ({ error: null })) };
    fromMock.mockReturnValueOnce(parent).mockReturnValueOnce(insert);

    await supabaseQuarantineAuditDataSource.release({
      id: 'parent-row',
      reviewerUserId: 'reviewer-1',
      note: 'approved for synthetic-only demo use',
    });

    expect(parent.eq).toHaveBeenCalledWith('id', 'parent-row');
    expect(insert.insert).toHaveBeenCalledWith(expect.objectContaining({
      parent_id: 'parent-row',
      tenant_client_key: 'apex-retail',
      final_decision: 'released',
      purview_reached: true,
      purview_labels: ['Microsoft.Purview.HealthData', 'AbarVa.Sensitive.PHI'],
      released_by: 'reviewer-1',
      release_note: 'approved for synthetic-only demo use',
    }));
  });

  it('hardDelete writes a lifecycle row without mutating the original audit row', async () => {
    const parent = parentLookupBuilder();
    const insert = { insert: jest.fn(async () => ({ error: null })) };
    fromMock.mockReturnValueOnce(parent).mockReturnValueOnce(insert);

    await supabaseQuarantineAuditDataSource.hardDelete({
      id: 'parent-row',
      reviewerUserId: 'reviewer-2',
      note: 'delete test payload',
    });

    expect(parent.eq).toHaveBeenCalledWith('id', 'parent-row');
    expect(insert.insert).toHaveBeenCalledWith(expect.objectContaining({
      parent_id: 'parent-row',
      tenant_client_key: 'apex-retail',
      final_decision: 'hard_deleted',
      purview_reached: true,
      purview_labels: ['Microsoft.Purview.HealthData', 'AbarVa.Sensitive.PHI'],
      released_by: 'reviewer-2',
      release_note: 'delete test payload',
      reason_codes: ['hard_deleted_by_reviewer'],
    }));
  });

  it('migration keeps public roles read-only for sensitive_upload_audit', () => {
    const migration = fs.readFileSync(
      path.join(process.cwd(), 'supabase/migrations/20260515200000_sensitive_upload_audit.sql'),
      'utf8',
    );

    expect(migration).toContain('ALTER TABLE sensitive_upload_audit ENABLE ROW LEVEL SECURITY');
    expect(migration).toContain('GRANT SELECT ON sensitive_upload_audit TO authenticated');
    expect(migration).not.toMatch(/GRANT\s+(INSERT|UPDATE|DELETE)/i);
    expect(migration).toContain('Append-only audit log');
  });
});
