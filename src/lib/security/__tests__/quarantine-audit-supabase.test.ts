// Item T-777. This suite mocked `@/lib/supabase-server`, which the subject
// never imports: `quarantine-audit-supabase.ts` reads through
// `getAzureWriteFluentClient` from `@/lib/data-plane/postgresCompat`. The mock
// never reached the module and three of four cases threw on a missing database
// URL before any assertion ran. The mock below is the client the module
// actually calls.
//
// The fourth case read the SQL migration and asserted its GRANT text. The
// grants of an append-only audit table are a property of the database, not of
// a file, and are asserted against live Postgres by
// `npm run assert:sensitive-upload-audit-immutability`
// (`src/scripts/assert-sensitive-upload-audit-immutability.ts`), which attempts
// UPDATE and DELETE under authenticated claims and requires both to be blocked.

let fromMock: jest.Mock;

jest.mock('@/lib/data-plane/postgresCompat', () => ({
  getAzureWriteFluentClient: () => ({ from: fromMock }),
}));

import { supabaseQuarantineAuditDataSource } from '../quarantine-audit-supabase';

/** Methods that would mutate an existing audit row. None may ever be called. */
const MUTATORS = ['update', 'delete', 'upsert'] as const;

/** Chainable and awaitable, so a mutation reaches the assertion instead of a TypeError. */
function inertChain(): Record<string, unknown> {
  const chain: Record<string, unknown> = {};
  for (const name of ['eq', 'is', 'in', 'match', 'select']) chain[name] = () => chain;
  chain.then = (resolve: (value: unknown) => unknown) => resolve({ data: null, error: null });
  return chain;
}

function withMutatorSpies<T extends object>(builder: T) {
  const spies = Object.fromEntries(MUTATORS.map((name) => [name, jest.fn(() => inertChain())]));
  return Object.assign(builder, spies) as T & Record<(typeof MUTATORS)[number], jest.Mock>;
}

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

const PARENT_ROW = {
  tenant_client_key: 'apex-retail',
  ingestion_tier: 'tier2_blob',
  filename: 'sample.csv',
  mime_type: 'text/csv',
  size_bytes: 123,
  sha256: 'abc123',
  purview_reached: true,
  purview_labels: ['Microsoft.Purview.HealthData', 'AbarVa.Sensitive.PHI'],
  storage_path: 'quarantine/apex/sample.csv',
};

function parentLookupBuilder(data: typeof PARENT_ROW | null = PARENT_ROW) {
  type LookupBuilder = {
    select: jest.Mock<LookupBuilder, []>;
    eq: jest.Mock<LookupBuilder, [string, string]>;
    maybeSingle: jest.Mock<Promise<{ data: typeof data; error: null }>, []>;
  };
  const builder: LookupBuilder = {
    select: jest.fn(() => builder),
    eq: jest.fn<LookupBuilder, [string, string]>(() => builder),
    maybeSingle: jest.fn(async () => ({ data, error: null })),
  };
  return withMutatorSpies(builder);
}

function insertBuilder() {
  return withMutatorSpies({ insert: jest.fn(async () => ({ error: null })) });
}

function listRow(overrides: Record<string, unknown> = {}) {
  return {
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
    ...overrides,
  };
}

describe('supabaseQuarantineAuditDataSource', () => {
  beforeEach(() => {
    fromMock = jest.fn();
  });

  it('lists only parent audit rows for the requested tenant', async () => {
    const query = new AwaitableQueryBuilder({ data: [listRow()], error: null });
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

  it('scopes an unfiltered listing to the tenant and to parent rows, with no optional filters', async () => {
    const query = new AwaitableQueryBuilder({ data: [], error: null });
    fromMock.mockReturnValue(query);

    await supabaseQuarantineAuditDataSource.list({ tenantClientKey: 'tenant-b' });

    // The tenant filter is the only `eq` an unfiltered listing may carry, so a
    // listing that dropped it — or scoped to another key — reads every tenant.
    expect(query.eq.mock.calls).toEqual([['tenant_client_key', 'tenant-b']]);
    expect(query.is.mock.calls).toEqual([['parent_id', null]]);
    expect(query.gte).not.toHaveBeenCalled();
    expect(query.limit).toHaveBeenCalledWith(200);
  });

  it('surfaces a read error instead of returning an empty listing', async () => {
    fromMock.mockReturnValue(
      new AwaitableQueryBuilder({ data: null, error: { message: 'permission denied' } }),
    );

    await expect(
      supabaseQuarantineAuditDataSource.list({ tenantClientKey: 'apex-retail' }),
    ).rejects.toThrow('quarantine_audit_list_failed: permission denied');
  });

  it.each([
    ['release', 'released', 'allow', [] as string[]],
    ['hardDelete', 'hard_deleted', 'quarantine', ['hard_deleted_by_reviewer']],
  ] as const)(
    '%s appends a lifecycle row and never mutates the original audit row',
    async (action, finalDecision, patternDecision, reasonCodes) => {
      const parent = parentLookupBuilder();
      const insert = insertBuilder();
      // Every table access after the lookup lands on `insert`, so a stray
      // write is recorded by its spy rather than crashing the case.
      fromMock.mockReturnValueOnce(parent).mockReturnValue(insert);

      await supabaseQuarantineAuditDataSource[action]({
        id: 'parent-row',
        reviewerUserId: 'reviewer-1',
        note: 'reviewed',
      });

      for (const builder of [parent, insert]) {
        for (const mutator of MUTATORS) {
          expect({ mutator, calls: builder[mutator].mock.calls.length }).toEqual({ mutator, calls: 0 });
        }
      }
      expect(fromMock.mock.calls).toEqual([['sensitive_upload_audit'], ['sensitive_upload_audit']]);
      expect(parent.eq).toHaveBeenCalledWith('id', 'parent-row');
      expect(insert.insert).toHaveBeenCalledTimes(1);
      expect(insert.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          parent_id: 'parent-row',
          tenant_client_key: 'apex-retail',
          pattern_decision: patternDecision,
          final_decision: finalDecision,
          purview_reached: true,
          purview_labels: ['Microsoft.Purview.HealthData', 'AbarVa.Sensitive.PHI'],
          released_by: 'reviewer-1',
          release_note: 'reviewed',
          reason_codes: reasonCodes,
        }),
      );
    },
  );

  it.each(['release', 'hardDelete'] as const)(
    '%s refuses an unknown row and writes nothing',
    async (action) => {
      const parent = parentLookupBuilder(null);
      const insert = insertBuilder();
      fromMock.mockReturnValueOnce(parent).mockReturnValueOnce(insert);

      await expect(
        supabaseQuarantineAuditDataSource[action]({ id: 'missing-row', reviewerUserId: 'reviewer-1' }),
      ).rejects.toThrow('quarantine_audit_row_not_found');
      expect(insert.insert).not.toHaveBeenCalled();
    },
  );
});
