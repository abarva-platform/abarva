// Unit tests for the programs-domain write adapter (write seam — Slice 3a).
//
// Pins the contract for the Azure parallel-run cutover:
//   - default plane stays Supabase (production write unchanged);
//   - the Azure Postgres adapter is selectable explicitly / by env;
//   - participant + module seeds produce byte-faithful rows on both planes;
//   - the Azure module seed runs in ONE transaction (atomic scaffold);
//   - a write error is surfaced as a falsy/zero result, never a throw —
//     the routes keep their pre-seam best-effort posture;
//   - the engagement phase update issues the same column set on both planes.

import type { PostgresCompatClient as SupabaseClient } from '@/lib/supabase-server';
import type { TxSessionRunner } from '../../read-adapters/azureSession';
import {
  createAzureProgramsWriteAdapter,
  createSupabaseProgramsWriteAdapter,
  selectProgramsWriteAdapter,
  type ProgramModuleSeed,
} from '../programsWriteAdapter';

// --- Supabase mock ----------------------------------------------------------

interface InsertCall {
  table: string;
  row: Record<string, unknown>;
}
interface UpdateCall {
  table: string;
  patch: Record<string, unknown>;
  eqColumn: string;
  eqValue: unknown;
}

/**
 * A Supabase client mock recording `.insert()` and `.update().eq()` calls.
 * `errorFor` lets a test script a per-table failure.
 */
function fakeSupabase(
  errorFor: (table: string) => { message: string } | null = () => null,
): {
  client: SupabaseClient;
  inserts: InsertCall[];
  updates: UpdateCall[];
} {
  const inserts: InsertCall[] = [];
  const updates: UpdateCall[] = [];
  const client = {
    from(table: string) {
      return {
        insert(row: Record<string, unknown>) {
          inserts.push({ table, row });
          return Promise.resolve({ error: errorFor(table) });
        },
        update(patch: Record<string, unknown>) {
          return {
            eq(eqColumn: string, eqValue: unknown) {
              updates.push({ table, patch, eqColumn, eqValue });
              return Promise.resolve({ error: errorFor(table) });
            },
          };
        },
      };
    },
  } as unknown as SupabaseClient;
  return { client, inserts, updates };
}

// --- Azure transaction-session mock ----------------------------------------

/** A tx-session mock recording SQL; one `fn` call == one transaction. */
function fakeTxSession(
  handler: (sql: string, params: readonly unknown[]) => unknown[] = () => [],
): { session: TxSessionRunner; statements: string[]; state: { transactions: number } } {
  const statements: string[] = [];
  const state = { transactions: 0 };
  const session: TxSessionRunner = async (fn) => {
    state.transactions += 1;
    return fn(async <R>(sql: string, params: unknown[]) => {
      statements.push(sql);
      return handler(sql, params) as R[];
    });
  };
  return { session, statements, state };
}

// --- selection --------------------------------------------------------------

describe('selectProgramsWriteAdapter', () => {
  const original = process.env.ABARVA_DATA_PLANE;
  afterEach(() => {
    if (original === undefined) delete process.env.ABARVA_DATA_PLANE;
    else process.env.ABARVA_DATA_PLANE = original;
  });

  it('returns the Supabase adapter by default (no env set)', () => {
    delete process.env.ABARVA_DATA_PLANE;
    expect(selectProgramsWriteAdapter().name).toBe('supabase');
  });

  it('returns the Azure adapter when ABARVA_DATA_PLANE=azure-postgres', () => {
    process.env.ABARVA_DATA_PLANE = 'azure-postgres';
    expect(selectProgramsWriteAdapter().name).toBe('azure-postgres');
  });

  it('falls back to Supabase for an unrecognized value', () => {
    process.env.ABARVA_DATA_PLANE = 'mysql';
    expect(selectProgramsWriteAdapter().name).toBe('supabase');
  });

  it('honors an explicit plane argument over the env var', () => {
    process.env.ABARVA_DATA_PLANE = 'azure-postgres';
    expect(selectProgramsWriteAdapter('supabase').name).toBe('supabase');
  });
});

// --- Supabase adapter (DEFAULT) --------------------------------------------

describe('supabase programs write adapter', () => {
  it('seedParticipant inserts the verbatim participant row and returns true', async () => {
    const { client, inserts } = fakeSupabase();
    const adapter = createSupabaseProgramsWriteAdapter(() => client);
    const ok = await adapter.seedParticipant({
      engagementId: 'eng-1',
      userId: 'person-9',
      userName: 'person-9',
      role: 'sponsor',
      approvalAuthority: 'sponsor',
    });
    expect(ok).toBe(true);
    expect(inserts).toHaveLength(1);
    expect(inserts[0]).toEqual({
      table: 'engagement_participants',
      row: {
        engagement_id: 'eng-1',
        user_id: 'person-9',
        user_name: 'person-9',
        role: 'sponsor',
        approval_authority: 'sponsor',
      },
    });
  });

  it('seedParticipant returns false (no throw) on a write error', async () => {
    const { client } = fakeSupabase((t) =>
      t === 'engagement_participants' ? { message: 'fk violation' } : null,
    );
    const adapter = createSupabaseProgramsWriteAdapter(() => client);
    await expect(
      adapter.seedParticipant({
        engagementId: 'eng-1',
        userId: 'p',
        userName: 'p',
        role: 'lead',
        approvalAuthority: 'approver',
      }),
    ).resolves.toBe(false);
  });

  it('seedModules inserts each module row with status not_started', async () => {
    const { client, inserts } = fakeSupabase();
    const adapter = createSupabaseProgramsWriteAdapter(() => client);
    const modules: ProgramModuleSeed[] = [
      { engagementId: 'eng-1', moduleKey: 'phase_1_work', moduleName: 'Phase 1', phaseNumber: 1, moduleOrder: 0 },
      { engagementId: 'eng-1', moduleKey: 'phase_2_work', moduleName: 'Phase 2', phaseNumber: 2, moduleOrder: 1 },
    ];
    const written = await adapter.seedModules(modules);
    expect(written).toBe(2);
    expect(inserts.map((i) => i.table)).toEqual(['program_modules', 'program_modules']);
    expect(inserts[0].row).toEqual({
      engagement_id: 'eng-1',
      module_key: 'phase_1_work',
      module_name: 'Phase 1',
      phase_number: 1,
      module_order: 0,
      status: 'not_started',
    });
  });

  it('seedModules with an empty list writes nothing and returns 0', async () => {
    const { client, inserts } = fakeSupabase();
    const adapter = createSupabaseProgramsWriteAdapter(() => client);
    expect(await adapter.seedModules([])).toBe(0);
    expect(inserts).toHaveLength(0);
  });

  it('seedModules counts only the rows that succeeded', async () => {
    let call = 0;
    const { client } = fakeSupabase((t) => {
      if (t !== 'program_modules') return null;
      call += 1;
      return call === 2 ? { message: 'unique violation' } : null;
    });
    const adapter = createSupabaseProgramsWriteAdapter(() => client);
    const written = await adapter.seedModules([
      { engagementId: 'e', moduleKey: 'a', moduleName: 'A', phaseNumber: 1, moduleOrder: 0 },
      { engagementId: 'e', moduleKey: 'b', moduleName: 'B', phaseNumber: 2, moduleOrder: 1 },
    ]);
    expect(written).toBe(1);
  });

  it('advanceEngagementPhase updates current_phase + gates_passed keyed by id', async () => {
    const { client, updates } = fakeSupabase();
    const adapter = createSupabaseProgramsWriteAdapter(() => client);
    const ok = await adapter.advanceEngagementPhase({
      engagementId: 'eng-1',
      toPhase: 3,
      gatesPassed: [1, 2, 3],
      tenantKey: 'apex-retail',
    });
    expect(ok).toBe(true);
    expect(updates).toHaveLength(1);
    expect(updates[0].table).toBe('engagements');
    expect(updates[0].eqColumn).toBe('id');
    expect(updates[0].eqValue).toBe('eng-1');
    expect(updates[0].patch).toMatchObject({ current_phase: 3, gates_passed: [1, 2, 3] });
    expect(typeof updates[0].patch.updated_at).toBe('string');
  });

  it('advanceEngagementPhase returns false (no throw) on a write error', async () => {
    const { client } = fakeSupabase((t) => (t === 'engagements' ? { message: 'rls denied' } : null));
    const adapter = createSupabaseProgramsWriteAdapter(() => client);
    await expect(
      adapter.advanceEngagementPhase({
        engagementId: 'eng-1',
        toPhase: 2,
        gatesPassed: [2],
        tenantKey: 'apexretail',
      }),
    ).resolves.toBe(false);
  });
});

// --- Azure Postgres adapter (opt-in) ---------------------------------------

describe('azure programs write adapter', () => {
  it('seedParticipant issues an INSERT inside a transaction', async () => {
    const { session, statements, state } = fakeTxSession();
    const adapter = createAzureProgramsWriteAdapter(session);
    const ok = await adapter.seedParticipant({
      engagementId: 'eng-1',
      userId: 'p',
      userName: 'p',
      role: 'sponsor',
      approvalAuthority: 'sponsor',
    });
    expect(ok).toBe(true);
    expect(state.transactions).toBe(1);
    expect(statements[0]).toContain('INSERT INTO engagement_participants');
  });

  it('seedModules runs the whole scaffold in ONE transaction', async () => {
    const tx = fakeTxSession();
    const adapter = createAzureProgramsWriteAdapter(tx.session);
    const written = await adapter.seedModules([
      { engagementId: 'e', moduleKey: 'a', moduleName: 'A', phaseNumber: 1, moduleOrder: 0 },
      { engagementId: 'e', moduleKey: 'b', moduleName: 'B', phaseNumber: 2, moduleOrder: 1 },
      { engagementId: 'e', moduleKey: 'c', moduleName: 'C', phaseNumber: 3, moduleOrder: 2 },
    ]);
    expect(written).toBe(3);
    // One transaction, three INSERTs — atomic scaffold.
    expect(tx.state.transactions).toBe(1);
    expect(tx.statements).toHaveLength(3);
    expect(tx.statements.every((s) => s.includes('INSERT INTO program_modules'))).toBe(true);
  });

  it('seedModules returns 0 (no throw) when the transaction fails', async () => {
    const { session } = fakeTxSession((sql) => {
      if (sql.includes('INSERT')) throw new Error('connection reset');
      return [];
    });
    const adapter = createAzureProgramsWriteAdapter(session);
    await expect(
      adapter.seedModules([
        { engagementId: 'e', moduleKey: 'a', moduleName: 'A', phaseNumber: 1, moduleOrder: 0 },
      ]),
    ).resolves.toBe(0);
  });

  it('advanceEngagementPhase issues an UPDATE inside a transaction', async () => {
    const { session, statements } = fakeTxSession();
    const adapter = createAzureProgramsWriteAdapter(session);
    const ok = await adapter.advanceEngagementPhase({
      engagementId: 'eng-1',
      toPhase: 4,
      gatesPassed: [1, 2, 3, 4],
      tenantKey: 'apex-retail',
    });
    expect(ok).toBe(true);
    const update = statements.find((s) => s.startsWith('UPDATE'));
    expect(update).toContain('UPDATE engagements');
    expect(update).toContain('current_phase');
    expect(update).toContain('gates_passed');
  });

  it('advanceEngagementPhase returns false (no throw) when the update fails', async () => {
    const { session } = fakeTxSession((sql) => {
      if (sql.startsWith('UPDATE')) throw new Error('deadlock detected');
      return [];
    });
    const adapter = createAzureProgramsWriteAdapter(session);
    await expect(
      adapter.advanceEngagementPhase({
        engagementId: 'eng-1',
        toPhase: 2,
        gatesPassed: [2],
        tenantKey: 'apex-retail',
      }),
    ).resolves.toBe(false);
  });
});
