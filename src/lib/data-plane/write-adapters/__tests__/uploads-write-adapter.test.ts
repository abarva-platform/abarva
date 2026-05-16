// Unit tests for the Slice 3c uploads write adapter.
//
// Pins the contract that matters for the Azure parallel-run cutover:
//   - default plane selection stays Supabase (production write unchanged);
//   - the Azure plane is selectable explicitly / by env;
//   - the Supabase implementation produces a row byte-faithful to the
//     pre-seam `uploaded_files` `.insert()` / `.update()`;
//   - the Azure implementation issues parameterized INSERT/UPDATE SQL.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { TxSessionRunner } from '../../read-adapters/azureSession';
import {
  createAzureUploadsWriteAdapter,
  createSupabaseUploadsWriteAdapter,
  selectUploadsWriteAdapter,
} from '../uploadsWriteAdapter';

// --- selection --------------------------------------------------------------

describe('selectUploadsWriteAdapter', () => {
  const original = process.env.ABARVA_DATA_PLANE;
  afterEach(() => {
    if (original === undefined) delete process.env.ABARVA_DATA_PLANE;
    else process.env.ABARVA_DATA_PLANE = original;
  });

  it('returns the Supabase adapter by default (no env set)', () => {
    delete process.env.ABARVA_DATA_PLANE;
    expect(selectUploadsWriteAdapter().plane).toBe('supabase');
  });

  it('returns the Azure adapter when ABARVA_DATA_PLANE=azure-postgres', () => {
    process.env.ABARVA_DATA_PLANE = 'azure-postgres';
    expect(selectUploadsWriteAdapter().plane).toBe('azure-postgres');
  });

  it('honors an explicit plane argument over the env var', () => {
    process.env.ABARVA_DATA_PLANE = 'azure-postgres';
    expect(selectUploadsWriteAdapter('supabase').plane).toBe('supabase');
  });
});

// --- Supabase adapter (DEFAULT) --------------------------------------------

/** A Supabase client mock scripting `.insert().select().single()` + `.update().eq()`. */
function fakeSupabase(insertResult: {
  data?: unknown;
  error?: { message: string } | null;
}): {
  client: SupabaseClient;
  inserted: Record<string, unknown>[];
  updated: { patch: Record<string, unknown>; id: unknown }[];
} {
  const inserted: Record<string, unknown>[] = [];
  const updated: { patch: Record<string, unknown>; id: unknown }[] = [];
  const client = {
    from() {
      return {
        insert(row: Record<string, unknown>) {
          inserted.push(row);
          return {
            select: () => ({
              single: () => Promise.resolve(insertResult),
            }),
          };
        },
        update(patch: Record<string, unknown>) {
          return {
            eq: (_col: string, id: unknown) => {
              updated.push({ patch, id });
              return Promise.resolve({ error: null });
            },
          };
        },
      };
    },
  } as unknown as SupabaseClient;
  return { client, inserted, updated };
}

describe('supabase uploads write adapter', () => {
  it('insertUploadedFile inserts a verbatim row and returns the id', async () => {
    const { client, inserted } = fakeSupabase({ data: { id: 'file-1' }, error: null });
    const adapter = createSupabaseUploadsWriteAdapter(() => client);
    const result = await adapter.insertUploadedFile({
      client_id: 'apexretail',
      uploaded_by_person_id: 'person-1',
      file_name: 'q4.csv',
      file_size_bytes: 2048,
      storage_path: 'apexretail/2026/05/q4.csv',
      mime_type: 'text/csv',
      ingestion_status: 'classifying',
    });
    expect(result).toEqual({ id: 'file-1' });
    expect(inserted[0]).toMatchObject({
      client_id: 'apexretail',
      file_name: 'q4.csv',
      ingestion_status: 'classifying',
    });
  });

  it('insertUploadedFile throws when Supabase returns an error', async () => {
    const { client } = fakeSupabase({ error: { message: 'insert failed' } });
    const adapter = createSupabaseUploadsWriteAdapter(() => client);
    await expect(
      adapter.insertUploadedFile({
        client_id: 'apexretail',
        uploaded_by_person_id: 'p',
        file_name: 'f',
        file_size_bytes: 1,
        storage_path: 's',
        mime_type: null,
      }),
    ).rejects.toMatchObject({ message: 'insert failed' });
  });

  it('updateUploadedFile patches the row scoped by id', async () => {
    const { client, updated } = fakeSupabase({ data: { id: 'file-1' }, error: null });
    const adapter = createSupabaseUploadsWriteAdapter(() => client);
    await adapter.updateUploadedFile('file-1', {
      ingestion_status: 'parsed',
      rows_ingested: 10,
    });
    expect(updated[0]).toEqual({
      patch: { ingestion_status: 'parsed', rows_ingested: 10 },
      id: 'file-1',
    });
  });
});

// --- Azure adapter (opt-in) ------------------------------------------------

/** A transaction session mock that records SQL + params. */
function fakeTxSession(
  handler: (sql: string, params: readonly unknown[]) => unknown[],
): { session: TxSessionRunner; statements: { sql: string; params: unknown[] }[] } {
  const statements: { sql: string; params: unknown[] }[] = [];
  const session: TxSessionRunner = async (fn) =>
    fn(async <R>(sql: string, params: unknown[]) => {
      statements.push({ sql, params });
      return handler(sql, params) as R[];
    });
  return { session, statements };
}

describe('azure uploads write adapter', () => {
  it('insertUploadedFile issues an INSERT ... RETURNING id', async () => {
    const { session, statements } = fakeTxSession((sql) =>
      sql.startsWith('INSERT') ? [{ id: 'azure-file' }] : [],
    );
    const adapter = createAzureUploadsWriteAdapter(session);
    const result = await adapter.insertUploadedFile({
      client_id: 'apexretail',
      uploaded_by_person_id: 'p',
      file_name: 'f.csv',
      file_size_bytes: 1,
      storage_path: 's',
      mime_type: 'text/csv',
    });
    expect(result).toEqual({ id: 'azure-file' });
    expect(statements[0].sql).toContain('INSERT INTO uploaded_files');
    expect(statements[0].sql).toContain('RETURNING id');
    expect(statements[0].params).toContain('apexretail');
  });

  it('updateUploadedFile issues a parameterized UPDATE ... WHERE id', async () => {
    const { session, statements } = fakeTxSession(() => []);
    const adapter = createAzureUploadsWriteAdapter(session);
    await adapter.updateUploadedFile('file-9', { ingestion_status: 'failed' });
    expect(statements[0].sql).toContain('UPDATE uploaded_files SET');
    expect(statements[0].sql).toContain('WHERE id = $2');
    expect(statements[0].params).toEqual(['failed', 'file-9']);
  });
});
