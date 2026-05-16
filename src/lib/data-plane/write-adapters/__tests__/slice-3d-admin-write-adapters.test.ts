// Slice 3d — admin write-route adapters.
//
// Pins the contract for the two per-domain write adapters that back the
// Slice 3d routes:
//   - `engageTurnWriteAdapter` — the `turns` insert behind
//     POST /api/engage/[engagementId]/turn;
//   - `adminWriteAdapter` — the `persons` / `person_client_memberships` /
//     `engagement_participants` upserts behind POST /api/admin/users/provision.
//
// What matters for the Azure parallel-run cutover:
//   - default plane selection stays Supabase (production write unchanged);
//   - the Azure adapter is selectable explicitly / by env;
//   - the row body each adapter writes is byte-faithful to the pre-seam
//     `.insert()` / `.upsert()` calls in `@/lib/db/turn` and the route;
//   - the Azure path issues real transactional SQL (INSERT / ON CONFLICT).

import type { SupabaseClient } from '@supabase/supabase-js';
import type { TxSessionRunner } from '../../read-adapters/azureSession';
import {
  createSupabaseEngageTurnWriteAdapter,
  createAzureEngageTurnWriteAdapter,
  selectEngageTurnWriteAdapter,
} from '../engageTurnWriteAdapter';
import {
  createSupabaseAdminWriteAdapter,
  createAzureAdminWriteAdapter,
  selectAdminWriteAdapter,
} from '../adminWriteAdapter';

// --- test doubles -----------------------------------------------------------

/** A Supabase client mock scripting `.insert/.upsert/.update` per table. */
function fakeSupabase(opts: {
  insertResult?: { data?: unknown; error?: { message: string } | null };
}): {
  client: SupabaseClient;
  inserted: { table: string; row: Record<string, unknown> }[];
  upserted: { table: string; row: Record<string, unknown>; onConflict?: string }[];
  updated: { table: string; row: Record<string, unknown>; id: string }[];
} {
  const inserted: { table: string; row: Record<string, unknown> }[] = [];
  const upserted: {
    table: string;
    row: Record<string, unknown>;
    onConflict?: string;
  }[] = [];
  const updated: { table: string; row: Record<string, unknown>; id: string }[] = [];
  const result = opts.insertResult ?? { data: { id: 'row-1' }, error: null };
  const errOnly = { error: result.error ?? null };
  /** A thenable that also exposes `.select().single()` — mimics the builder. */
  function builder(): PromiseLike<typeof errOnly> & {
    select: () => { single: () => Promise<typeof result> };
  } {
    return {
      select: () => ({ single: () => Promise.resolve(result) }),
      then: (resolve) => Promise.resolve(errOnly).then(resolve),
    };
  }
  const client = {
    from(table: string) {
      return {
        insert(row: Record<string, unknown>) {
          inserted.push({ table, row });
          return builder();
        },
        upsert(row: Record<string, unknown>, o?: { onConflict?: string }) {
          upserted.push({ table, row, onConflict: o?.onConflict });
          return builder();
        },
        update(row: Record<string, unknown>) {
          return {
            eq: (_col: string, id: string) => {
              updated.push({ table, row, id });
              return Promise.resolve(errOnly);
            },
          };
        },
      };
    },
  } as unknown as SupabaseClient;
  return { client, inserted, upserted, updated };
}

/** A transaction-session mock recording every SQL statement it runs. */
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

// --- engagement-turn write adapter -----------------------------------------

describe('engageTurnWriteAdapter — selection', () => {
  const original = process.env.ABARVA_DATA_PLANE;
  afterEach(() => {
    if (original === undefined) delete process.env.ABARVA_DATA_PLANE;
    else process.env.ABARVA_DATA_PLANE = original;
  });

  it('selects the Supabase adapter by default (no env set)', () => {
    delete process.env.ABARVA_DATA_PLANE;
    expect(selectEngageTurnWriteAdapter().name).toBe('supabase');
  });

  it('selects the Azure adapter when ABARVA_DATA_PLANE=azure-postgres', () => {
    process.env.ABARVA_DATA_PLANE = 'azure-postgres';
    expect(selectEngageTurnWriteAdapter().name).toBe('azure-postgres');
  });

  it('honors an explicit plane argument over the env var', () => {
    process.env.ABARVA_DATA_PLANE = 'azure-postgres';
    expect(selectEngageTurnWriteAdapter('supabase').name).toBe('supabase');
  });
});

describe('engageTurnWriteAdapter — Supabase (default)', () => {
  it('inserts a byte-faithful turns row and returns the persisted row', async () => {
    const { client, inserted } = fakeSupabase({
      insertResult: {
        data: { id: 't-1', engagement_id: 'e-1', sender: 'user' },
        error: null,
      },
    });
    const adapter = createSupabaseEngageTurnWriteAdapter(() => client);
    const row = await adapter.appendTurn({
      engagementId: 'e-1',
      phase: 2,
      sender: 'user',
      text: 'hello',
    });
    expect(inserted).toHaveLength(1);
    expect(inserted[0].table).toBe('turns');
    // Identical snake_case columns/values to the pre-seam `appendTurn`.
    expect(inserted[0].row).toEqual({
      engagement_id: 'e-1',
      phase: 2,
      sender: 'user',
      text: 'hello',
      mode_label: null,
      retrieved_refs: {},
    });
    expect(row).toEqual({ id: 't-1', engagement_id: 'e-1', sender: 'user' });
  });

  it('defaults retrieved_refs to {} and mode_label to null', async () => {
    const { client, inserted } = fakeSupabase({
      insertResult: { data: { id: 't-2' }, error: null },
    });
    const adapter = createSupabaseEngageTurnWriteAdapter(() => client);
    await adapter.appendTurn({
      engagementId: 'e-1',
      phase: 1,
      sender: 'agent',
      text: 'reply',
      retrievedRefs: { sponsor_id: 'p-9' },
    });
    expect(inserted[0].row.retrieved_refs).toEqual({ sponsor_id: 'p-9' });
    expect(inserted[0].row.mode_label).toBeNull();
  });

  it('throws when Supabase returns an error (route surfaces it)', async () => {
    const { client } = fakeSupabase({
      insertResult: { data: null, error: { message: 'insert failed' } },
    });
    const adapter = createSupabaseEngageTurnWriteAdapter(() => client);
    await expect(
      adapter.appendTurn({ engagementId: 'e-1', phase: 1, sender: 'user', text: 'x' }),
    ).rejects.toMatchObject({ message: 'insert failed' });
  });
});

describe('engageTurnWriteAdapter — Azure Postgres (opt-in)', () => {
  it('issues an INSERT ... RETURNING * inside the transaction', async () => {
    const { session, statements } = fakeTxSession((sql) =>
      sql.startsWith('INSERT INTO turns') ? [{ id: 'az-t-1', engagement_id: 'e-1' }] : [],
    );
    const adapter = createAzureEngageTurnWriteAdapter(session);
    const row = await adapter.appendTurn({
      engagementId: 'e-1',
      phase: 3,
      sender: 'agent',
      text: 'azure reply',
    });
    expect(row).toEqual({ id: 'az-t-1', engagement_id: 'e-1' });
    const insert = statements.find((s) => s.startsWith('INSERT INTO turns'));
    expect(insert).toContain('engagement_id');
    expect(insert).toContain('retrieved_refs');
    expect(insert).toContain('RETURNING *');
  });

  it('throws when the insert returns no row', async () => {
    const { session } = fakeTxSession(() => []);
    const adapter = createAzureEngageTurnWriteAdapter(session);
    await expect(
      adapter.appendTurn({ engagementId: 'e-1', phase: 1, sender: 'user', text: 'x' }),
    ).rejects.toThrow(/engage_turn_insert_returned_no_row/);
  });
});

// --- admin write adapter ----------------------------------------------------

describe('adminWriteAdapter — selection', () => {
  const original = process.env.ABARVA_DATA_PLANE;
  afterEach(() => {
    if (original === undefined) delete process.env.ABARVA_DATA_PLANE;
    else process.env.ABARVA_DATA_PLANE = original;
  });

  it('selects the Supabase adapter by default', () => {
    delete process.env.ABARVA_DATA_PLANE;
    expect(selectAdminWriteAdapter().name).toBe('supabase');
  });

  it('selects the Azure adapter when ABARVA_DATA_PLANE=azure-postgres', () => {
    process.env.ABARVA_DATA_PLANE = 'azure-postgres';
    expect(selectAdminWriteAdapter().name).toBe('azure-postgres');
  });
});

describe('adminWriteAdapter — Supabase (default)', () => {
  it('upsertPerson upserts persons onConflict email and returns the id', async () => {
    const { client, upserted } = fakeSupabase({
      insertResult: { data: { id: 'person-7' }, error: null },
    });
    const adapter = createSupabaseAdminWriteAdapter(() => client);
    const result = await adapter.upsertPerson({
      graphNodeId: 'person:apexretail:a@b.com',
      email: 'a@b.com',
      name: 'A B',
      role: 'program_member',
      organization: 'apexretail',
    });
    expect(result).toEqual({ ok: true, data: { id: 'person-7' } });
    expect(upserted[0].table).toBe('persons');
    expect(upserted[0].onConflict).toBe('email');
    expect(upserted[0].row).toEqual({
      graph_node_id: 'person:apexretail:a@b.com',
      email: 'a@b.com',
      name: 'A B',
      role: 'program_member',
      organization: 'apexretail',
    });
  });

  it('upsertPerson returns ok:false with detail when the upsert errors', async () => {
    const { client } = fakeSupabase({
      insertResult: { data: null, error: { message: 'unique conflict' } },
    });
    const adapter = createSupabaseAdminWriteAdapter(() => client);
    const result = await adapter.upsertPerson({
      graphNodeId: 'g',
      email: 'a@b.com',
      name: 'A',
      role: 'program_member',
      organization: 'apexretail',
    });
    expect(result).toEqual({ ok: false, detail: 'unique conflict' });
  });

  it('upsertMembership upserts onConflict person_id,client_id', async () => {
    const { client, upserted } = fakeSupabase({
      insertResult: { data: {}, error: null },
    });
    const adapter = createSupabaseAdminWriteAdapter(() => client);
    const result = await adapter.upsertMembership({
      personId: 'person-7',
      clientId: 'apexretail',
      accessLevel: 'client_admin',
      financialVisibility: true,
      canAdminUsers: true,
      canCreatePrograms: true,
      canApproveGates: true,
    });
    expect(result.ok).toBe(true);
    expect(upserted[0].table).toBe('person_client_memberships');
    expect(upserted[0].onConflict).toBe('person_id,client_id');
    expect(upserted[0].row).toMatchObject({
      person_id: 'person-7',
      client_id: 'apexretail',
      role: 'client_viewer',
      access_level: 'client_admin',
      can_admin_users: true,
    });
  });

  it('upsertParticipant inserts when there is no existing row', async () => {
    const { client, inserted } = fakeSupabase({ insertResult: { data: {}, error: null } });
    const adapter = createSupabaseAdminWriteAdapter(() => client);
    const result = await adapter.upsertParticipant({
      existingId: null,
      payload: { engagement_id: 'e-1', user_id: 'person-7' },
    });
    expect(result.ok).toBe(true);
    expect(inserted[0].table).toBe('engagement_participants');
  });

  it('upsertParticipant updates by id when an existing row is supplied', async () => {
    const { client, updated } = fakeSupabase({ insertResult: { data: {}, error: null } });
    const adapter = createSupabaseAdminWriteAdapter(() => client);
    const result = await adapter.upsertParticipant({
      existingId: 'ep-9',
      payload: { role: 'observer' },
    });
    expect(result.ok).toBe(true);
    expect(updated[0]).toMatchObject({ table: 'engagement_participants', id: 'ep-9' });
  });
});

describe('adminWriteAdapter — Azure Postgres (opt-in)', () => {
  it('upsertPerson issues INSERT ... ON CONFLICT (email) DO UPDATE ... RETURNING id', async () => {
    const { session, statements } = fakeTxSession((sql) =>
      sql.includes('INSERT INTO persons') ? [{ id: 'az-person-1' }] : [],
    );
    const adapter = createAzureAdminWriteAdapter(session);
    const result = await adapter.upsertPerson({
      graphNodeId: 'g',
      email: 'a@b.com',
      name: 'A',
      role: 'program_member',
      organization: 'apexretail',
    });
    expect(result).toEqual({ ok: true, data: { id: 'az-person-1' } });
    const sql = statements.find((s) => s.includes('INSERT INTO persons'));
    expect(sql).toContain('ON CONFLICT (email) DO UPDATE');
    expect(sql).toContain('RETURNING id');
  });

  it('upsertMembership issues ON CONFLICT (person_id, client_id) DO UPDATE', async () => {
    const { session, statements } = fakeTxSession(() => []);
    const adapter = createAzureAdminWriteAdapter(session);
    const result = await adapter.upsertMembership({
      personId: 'person-7',
      clientId: 'apexretail',
      accessLevel: 'client_admin',
      financialVisibility: false,
      canAdminUsers: true,
      canCreatePrograms: true,
      canApproveGates: false,
    });
    expect(result.ok).toBe(true);
    expect(
      statements.some((s) => s.includes('ON CONFLICT (person_id, client_id) DO UPDATE')),
    ).toBe(true);
  });

  it('upsertParticipant runs an UPDATE ... WHERE id when an existing row is supplied', async () => {
    const { session, statements } = fakeTxSession(() => []);
    const adapter = createAzureAdminWriteAdapter(session);
    const result = await adapter.upsertParticipant({
      existingId: 'ep-9',
      payload: { role: 'observer' },
    });
    expect(result.ok).toBe(true);
    expect(statements.some((s) => s.startsWith('UPDATE engagement_participants'))).toBe(true);
  });

  it('upsertParticipant runs an INSERT when there is no existing row', async () => {
    const { session, statements } = fakeTxSession(() => []);
    const adapter = createAzureAdminWriteAdapter(session);
    const result = await adapter.upsertParticipant({
      existingId: null,
      payload: { engagement_id: 'e-1', user_id: 'person-7' },
    });
    expect(result.ok).toBe(true);
    expect(
      statements.some((s) => s.startsWith('INSERT INTO engagement_participants')),
    ).toBe(true);
  });

  it('returns ok:false with detail when the transaction throws', async () => {
    const { session } = fakeTxSession((sql) => {
      if (sql.includes('INSERT INTO persons')) throw new Error('connection reset');
      return [];
    });
    const adapter = createAzureAdminWriteAdapter(session);
    const result = await adapter.upsertPerson({
      graphNodeId: 'g',
      email: 'a@b.com',
      name: 'A',
      role: 'program_member',
      organization: 'apexretail',
    });
    expect(result).toEqual({ ok: false, detail: 'connection reset' });
  });
});
