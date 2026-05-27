// Unit tests for the data-plane write-adapter seam (write-seam foundation).
//
// Pins the contract that matters for the Azure parallel-run cutover:
//   - default adapter selection stays Supabase (production write unchanged);
//   - the Azure Postgres write adapter is selectable explicitly / by env;
//   - `appendAudit` produces a byte-faithful append-only row on both planes;
//   - a unique-violation surfaces as `idempotent_replay`, never a throw;
//   - an RLS denial surfaces as `rls_denied`, never a throw;
//   - the quarantine proof route's lifecycle write goes through the seam and
//     produces the same row shape as the pre-seam Supabase implementation.

import type { PostgresCompatClient as SupabaseClient } from '@/lib/supabase-server';
import {
  resolveDataPlane,
  selectWriteAdapter,
  writeOk,
  writeRejected,
} from '../index';
import { createSupabaseWriteAdapter } from '../supabaseWriteAdapter';
import { createAzurePostgresWriteAdapter } from '../azurePostgresWriteAdapter';
import type { TxSessionRunner } from '../../read-adapters/azureSession';
import type { DataPlaneWriteAdapter, AuditEntry, WriteUnit } from '../types';
import { createDataPlaneQuarantineAuditDataSource } from '@/lib/security/quarantine-audit-data-plane';

// --- selection --------------------------------------------------------------

describe('selectWriteAdapter', () => {
  const original = process.env.ABARVA_DATA_PLANE;
  afterEach(() => {
    if (original === undefined) delete process.env.ABARVA_DATA_PLANE;
    else process.env.ABARVA_DATA_PLANE = original;
  });

  it('returns the Supabase write adapter by default (no env set)', () => {
    delete process.env.ABARVA_DATA_PLANE;
    expect(selectWriteAdapter().name).toBe('supabase');
  });

  it('returns the Azure write adapter when ABARVA_DATA_PLANE=azure-postgres', () => {
    process.env.ABARVA_DATA_PLANE = 'azure-postgres';
    expect(selectWriteAdapter().name).toBe('azure-postgres');
  });

  it('falls back to Supabase for an unrecognized value', () => {
    process.env.ABARVA_DATA_PLANE = 'mysql';
    expect(selectWriteAdapter().name).toBe('supabase');
  });

  it('honors an explicit plane argument over the env var', () => {
    process.env.ABARVA_DATA_PLANE = 'azure-postgres';
    expect(selectWriteAdapter('supabase').name).toBe('supabase');
  });

  it('reuses resolveDataPlane from the read seam (no duplicate switch)', () => {
    expect(resolveDataPlane('azure-postgres')).toBe('azure-postgres');
    expect(resolveDataPlane(undefined)).toBe('supabase');
  });
});

// --- result constructors ----------------------------------------------------

describe('write result constructors', () => {
  it('writeOk marks success and carries optional data + reason', () => {
    expect(writeOk({ id: 'x' })).toEqual({ ok: true, data: { id: 'x' }, reason: undefined });
    expect(writeOk(undefined, 'idempotent_replay')).toEqual({
      ok: true,
      data: undefined,
      reason: 'idempotent_replay',
    });
  });

  it('writeRejected marks failure with a stable reason code', () => {
    expect(writeRejected('rls_denied', 'denied')).toEqual({
      ok: false,
      reason: 'rls_denied',
      detail: 'denied',
    });
  });
});

// --- Supabase write adapter (DEFAULT) --------------------------------------

/** A Supabase client mock whose `.insert().select().maybeSingle()` is scripted. */
function fakeSupabase(
  insertResult: { data?: unknown; error?: { message: string; code?: string } },
): { client: SupabaseClient; inserted: Record<string, unknown>[]; tables: string[] } {
  const inserted: Record<string, unknown>[] = [];
  const tables: string[] = [];
  const client = {
    from(table: string) {
      tables.push(table);
      return {
        insert(row: Record<string, unknown>) {
          inserted.push(row);
          return {
            select() {
              return {
                maybeSingle: () => Promise.resolve(insertResult),
              };
            },
          };
        },
      };
    },
  } as unknown as SupabaseClient;
  return { client, inserted, tables };
}

describe('supabaseWriteAdapter', () => {
  it('exposes the data-plane name as "supabase"', () => {
    expect(createSupabaseWriteAdapter().name).toBe('supabase');
  });

  it('commit() is unsupported on the Supabase plane — ok:false, reason "unsupported"', async () => {
    // Multi-statement commit() is the Azure-plane-only transactional
    // primitive. On Supabase it must NOT throw and must NOT silently route
    // through a phantom `data_plane_exec` RPC — it is an honest rejection.
    const adapter = createSupabaseWriteAdapter(() => {
      throw new Error('commit() must not touch the Supabase client');
    });
    let unitRan = false;
    const result = await adapter.commit<string>({
      idempotencyKey: 'k',
      tenantKey: 'apex-retail',
      actorUserId: 'user-1',
      async run() {
        unitRan = true;
        return 'done';
      },
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('unsupported');
    expect(result.detail).toMatch(/Azure-plane/);
    // The unit body is never invoked — there is no statement runner to give it.
    expect(unitRan).toBe(false);
  });

  it('appendAudit inserts an append-only row with parent_id and returns the id', async () => {
    const { client, inserted, tables } = fakeSupabase({ data: { id: 'new-row' } });
    const adapter = createSupabaseWriteAdapter(() => client);
    const entry: AuditEntry = {
      table: 'sensitive_upload_audit',
      tenantKey: 'apex-retail',
      actorUserId: 'user-1',
      parentId: 'parent-1',
      idempotencyKey: 'quarantine_release:parent-1',
      columns: { final_decision: 'released', released_by: 'user-1' },
    };
    const result = await adapter.appendAudit(entry);
    expect(result.ok).toBe(true);
    expect(result.data).toEqual({ id: 'new-row' });
    expect(tables).toEqual(['sensitive_upload_audit']);
    // The row is the verbatim columns PLUS parent_id — never an update.
    expect(inserted[0]).toEqual({
      final_decision: 'released',
      released_by: 'user-1',
      parent_id: 'parent-1',
    });
  });

  it('appendAudit surfaces a unique-violation as idempotent_replay (no throw)', async () => {
    const { client } = fakeSupabase({ error: { message: 'duplicate key value', code: '23505' } });
    const adapter = createSupabaseWriteAdapter(() => client);
    const result = await adapter.appendAudit({
      table: 'sensitive_upload_audit',
      tenantKey: 'apex-retail',
      actorUserId: 'user-1',
      parentId: 'parent-1',
      idempotencyKey: 'k',
      columns: {},
    });
    expect(result.ok).toBe(true);
    expect(result.reason).toBe('idempotent_replay');
  });

  it('appendAudit surfaces an RLS denial as rls_denied (no throw)', async () => {
    const { client } = fakeSupabase({ error: { message: 'permission denied', code: '42501' } });
    const adapter = createSupabaseWriteAdapter(() => client);
    const result = await adapter.appendAudit({
      table: 'sensitive_upload_audit',
      tenantKey: 'apex-retail',
      actorUserId: 'user-1',
      parentId: null,
      idempotencyKey: 'k',
      columns: {},
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('rls_denied');
  });
});

// --- Azure Postgres write adapter (opt-in) ---------------------------------

/** A transaction session mock that records SQL and is driven by `handler`. */
function fakeTxSession(
  handler: (sql: string, params: readonly unknown[]) => unknown[],
): { session: TxSessionRunner; statements: string[] } {
  const statements: string[] = [];
  const session: TxSessionRunner = async (fn) =>
    fn(async <R>(sql: string, params: unknown[]) => {
      statements.push(sql);
      return handler(sql, params) as R[];
    });
  return { session, statements };
}

describe('azurePostgresWriteAdapter', () => {
  it('exposes the data-plane name as "azure-postgres"', () => {
    expect(createAzurePostgresWriteAdapter().name).toBe('azure-postgres');
  });

  it('appendAudit issues an INSERT ... RETURNING id inside the transaction', async () => {
    const { session, statements } = fakeTxSession((sql) => {
      if (sql.startsWith('INSERT INTO')) return [{ id: 'azure-row' }];
      return [];
    });
    const adapter = createAzurePostgresWriteAdapter(session);
    const result = await adapter.appendAudit({
      table: 'sensitive_upload_audit',
      tenantKey: 'apex-retail',
      actorUserId: 'user-1',
      parentId: 'parent-1',
      idempotencyKey: 'k',
      columns: { final_decision: 'released' },
    });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual({ id: 'azure-row' });
    // RLS context is set before the insert; the insert is append-only.
    expect(statements.some((s) => s.includes('set_config'))).toBe(true);
    const insert = statements.find((s) => s.startsWith('INSERT INTO'));
    expect(insert).toContain('sensitive_upload_audit');
    expect(insert).toContain('parent_id');
    expect(insert).toContain('RETURNING id');
  });

  it('commit runs the unit body and returns its data on success', async () => {
    const { session } = fakeTxSession(() => [{ ok: 1 }]);
    const adapter = createAzurePostgresWriteAdapter(session);
    const unit: WriteUnit<string> = {
      idempotencyKey: 'k',
      tenantKey: 'apex-retail',
      actorUserId: 'user-1',
      async run(stmt) {
        await stmt('INSERT INTO foo VALUES ($1)', ['v']);
        return 'done';
      },
    };
    const result = await adapter.commit(unit);
    expect(result.ok).toBe(true);
    expect(result.data).toBe('done');
  });

  it('commit surfaces a unique-violation as idempotent_replay', async () => {
    const { session } = fakeTxSession((sql) => {
      if (sql.startsWith('INSERT')) {
        throw Object.assign(new Error('duplicate key value'), { code: '23505' });
      }
      return [];
    });
    const adapter = createAzurePostgresWriteAdapter(session);
    const result = await adapter.commit<void>({
      idempotencyKey: 'k',
      tenantKey: 'apex-retail',
      actorUserId: 'user-1',
      async run(stmt) {
        await stmt('INSERT INTO foo VALUES ($1)', ['v']);
      },
    });
    expect(result.ok).toBe(true);
    expect(result.reason).toBe('idempotent_replay');
  });

  it('commit surfaces a backend fault as backend_error (no throw)', async () => {
    const { session } = fakeTxSession((sql) => {
      if (sql.startsWith('INSERT')) throw new Error('connection reset');
      return [];
    });
    const adapter = createAzurePostgresWriteAdapter(session);
    const result = await adapter.commit<void>({
      idempotencyKey: 'k',
      tenantKey: 'apex-retail',
      actorUserId: 'user-1',
      async run(stmt) {
        await stmt('INSERT INTO foo VALUES ($1)', ['v']);
      },
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('backend_error');
  });
});

// --- proof route: quarantine lifecycle write through the seam --------------

// The proof-route data source looks up the parent row via getServerSupabase
// (a read — transitive per design doc §4). Mock it so the lookup resolves
// without a live backend; the write half is exercised via the injected adapter.
// `mock`-prefixed name satisfies jest's hoisted-factory scope rule.
const mockParentRow = {
  tenant_client_key: 'apex-retail',
  ingestion_tier: 'tier1_ui',
  filename: 'q4-forecast.xlsx',
  mime_type: 'application/vnd.ms-excel',
  size_bytes: 4096,
  sha256: 'abc123',
  purview_reached: true,
  purview_labels: ['confidential'],
  storage_path: 'quarantine/apex/q4.xlsx',
};

jest.mock('@/lib/supabase-server', () => ({
  getServerSupabase: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: mockParentRow, error: null }),
        }),
      }),
    }),
  }),
}));

describe('quarantine proof route — lifecycle write through the write seam', () => {
  /** A write adapter that records the audit entry it receives. */
  function recordingAdapter(): {
    adapter: DataPlaneWriteAdapter;
    entries: AuditEntry[];
  } {
    const entries: AuditEntry[] = [];
    const adapter: DataPlaneWriteAdapter = {
      name: 'supabase',
      async commit<T>() {
        return writeOk<T>(undefined);
      },
      async appendAudit(entry) {
        entries.push(entry);
        return writeOk({ id: 'lifecycle-row' });
      },
    };
    return { adapter, entries };
  }

  it('release writes an append-only released row with the parent denormalized', async () => {
    const { adapter, entries } = recordingAdapter();
    const ds = createDataPlaneQuarantineAuditDataSource(adapter);
    await ds.release({ id: 'parent-9', reviewerUserId: 'admin-1', note: 'false positive' });

    expect(entries).toHaveLength(1);
    const e = entries[0];
    expect(e.table).toBe('sensitive_upload_audit');
    expect(e.parentId).toBe('parent-9'); // append-only — points at the original
    expect(e.tenantKey).toBe('apex-retail');
    expect(e.actorUserId).toBe('admin-1');
    expect(e.idempotencyKey).toBe('quarantine_release:parent-9');
    // Row shape is byte-faithful to the pre-seam Supabase .insert() body.
    expect(e.columns).toMatchObject({
      tenant_client_key: 'apex-retail',
      ingestion_tier: 'tier1_ui',
      filename: 'q4-forecast.xlsx',
      pattern_decision: 'allow',
      final_decision: 'released',
      released_by: 'admin-1',
      release_note: 'false positive',
      reason_codes: [],
    });
  });

  it('hardDelete writes an append-only hard_deleted row, original preserved', async () => {
    const { adapter, entries } = recordingAdapter();
    const ds = createDataPlaneQuarantineAuditDataSource(adapter);
    await ds.hardDelete({ id: 'parent-9', reviewerUserId: 'admin-1' });

    expect(entries).toHaveLength(1);
    const e = entries[0];
    expect(e.parentId).toBe('parent-9');
    expect(e.idempotencyKey).toBe('quarantine_hard_delete:parent-9');
    expect(e.columns).toMatchObject({
      pattern_decision: 'quarantine',
      final_decision: 'hard_deleted',
      reason_codes: ['hard_deleted_by_reviewer'],
    });
  });

  it('throws when the write seam rejects the lifecycle insert', async () => {
    const failing: DataPlaneWriteAdapter = {
      name: 'supabase',
      async commit<T>() {
        return writeOk<T>(undefined);
      },
      async appendAudit() {
        return writeRejected<{ id: string }>('rls_denied', 'denied');
      },
    };
    const ds = createDataPlaneQuarantineAuditDataSource(failing);
    await expect(
      ds.release({ id: 'parent-9', reviewerUserId: 'admin-1' }),
    ).rejects.toThrow(/quarantine_release_insert_failed: rls_denied/);
  });
});
