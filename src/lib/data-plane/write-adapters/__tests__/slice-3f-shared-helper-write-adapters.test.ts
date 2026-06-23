// Unit tests for the Slice 3f shared-helper write adapters / ops.
//
// Slice 3f migrates the DB writes inside three shared `src/lib` helpers behind
// the write seam:
//   - programs `advancePhase`            -> ProgramsWriteAdapter.runAdvancePhase
//   - programs `requestFounderApproval`  -> ProgramsWriteAdapter.insertFounderApproval
//   - programs `draftModuleDeliverable`  -> ProgramsWriteAdapter.runDraftModuleDeliverable
//   - source  `registerSourceArtifactUpload` -> SourceArtifactsWriteAdapter
//   - intel   `attachThreadToEngagement`     -> ThreadWriteAdapter
//
// These pin: Supabase stays the default; Azure is selectable; the produced
// rows/SQL are byte-faithful to the pre-seam helpers; the Azure multi-row
// units run in ONE transaction; a DB error is surfaced as `ok:false` (the
// helper re-throws), never swallowed.

import type { PostgresCompatClient as SupabaseClient } from '@/lib/supabase-server';
import type { TxSessionRunner } from '../../read-adapters/azureSession';
import {
  createAzureProgramsWriteAdapter,
  createSupabaseProgramsWriteAdapter,
} from '../programsWriteAdapter';
import {
  createAzureSourceArtifactsWriteAdapter,
  createSupabaseSourceArtifactsWriteAdapter,
  selectSourceArtifactsWriteAdapter,
  type SourceArtifactInsertColumns,
} from '../sourceArtifactsWriteAdapter';
import {
  createAzureThreadWriteAdapter,
  createSupabaseThreadWriteAdapter,
  selectThreadWriteAdapter,
} from '../threadWriteAdapter';

// --- a Supabase mock supporting .insert/.update/.select/.single/.maybeSingle ---

interface QueryCall {
  table: string;
  op: 'insert' | 'update' | 'upsert';
  body: Record<string, unknown>;
  eqs: Array<{ col: string; val: unknown }>;
}

type RowFor = (table: string, op: string) => Record<string, unknown> | null;
type ErrFor = (table: string, op: string) => { message: string } | null;

function fakeSupabase(opts: { rowFor?: RowFor; errFor?: ErrFor } = {}): {
  client: SupabaseClient;
  calls: QueryCall[];
} {
  const rowFor = opts.rowFor ?? (() => ({ id: 'row-1' }));
  const errFor = opts.errFor ?? (() => null);
  const calls: QueryCall[] = [];

  function builder(
    table: string,
    op: 'insert' | 'update' | 'upsert',
    body: Record<string, unknown>,
  ) {
    const call: QueryCall = { table, op, body, eqs: [] };
    calls.push(call);
    const result = () => ({ data: rowFor(table, op), error: errFor(table, op) });
    const chain: Record<string, unknown> = {
      eq(col: string, val: unknown) {
        call.eqs.push({ col, val });
        return chain;
      },
      select() {
        return chain;
      },
      single() {
        return Promise.resolve(result());
      },
      maybeSingle() {
        return Promise.resolve(result());
      },
      then(onF: (v: { data: unknown; error: unknown }) => unknown) {
        // bare `await sb.from().update().eq()` (no .select())
        return Promise.resolve(result()).then(onF);
      },
    };
    return chain;
  }

  const client = {
    from(table: string) {
      return {
        insert: (body: Record<string, unknown>) => builder(table, 'insert', body),
        upsert: (body: Record<string, unknown>) => builder(table, 'upsert', body),
        update: (body: Record<string, unknown>) => builder(table, 'update', body),
        select() {
          // for the deliverables_v2 existing-row lookup
          const call: QueryCall = { table, op: 'update', body: {}, eqs: [] };
          const chain: Record<string, unknown> = {
            eq() {
              return chain;
            },
            maybeSingle() {
              return Promise.resolve({ data: rowFor(table, 'select'), error: errFor(table, 'select') });
            },
          };
          void call;
          return chain;
        },
      };
    },
  } as unknown as SupabaseClient;
  return { client, calls };
}

// --- an Azure tx-session mock ----------------------------------------------

function fakeTxSession(
  handler: (sql: string, params: readonly unknown[]) => unknown[] = () => [{ id: 'row-1' }],
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

// --- programs.runAdvancePhase ----------------------------------------------

const ADVANCE_INPUT = {
  programId: 'prog-1',
  clientId: 'client-1',
  userId: 'user-1',
  fromPhase: 1,
  toPhase: 2,
  snapshot: { foo: 'bar' },
  approvedByUserId: 'user-1',
  bypassGate: false,
};

describe('programs runAdvancePhase', () => {
  it('supabase: snapshot insert + engagement update + state-log insert, returns snapshotId', async () => {
    const { client, calls } = fakeSupabase({ rowFor: () => ({ id: 'snap-9' }) });
    const adapter = createSupabaseProgramsWriteAdapter(() => client);
    const res = await adapter.runAdvancePhase(ADVANCE_INPUT);
    expect(res.ok).toBe(true);
    expect(res.data?.snapshotId).toBe('snap-9');
    expect(calls.map((c) => `${c.table}:${c.op}`)).toEqual([
      'phase_snapshots:insert',
      'engagements:update',
      'module_state_log:insert',
    ]);
    const eng = calls.find((c) => c.table === 'engagements');
    expect(eng?.body).toMatchObject({ current_phase: 2 });
    expect(eng?.eqs).toEqual([
      { col: 'id', val: 'prog-1' },
      { col: 'client_id', val: 'client-1' },
    ]);
  });

  it('supabase: a snapshot insert error is surfaced as ok:false', async () => {
    const { client } = fakeSupabase({
      errFor: (t) => (t === 'phase_snapshots' ? { message: 'rls denied' } : null),
    });
    const adapter = createSupabaseProgramsWriteAdapter(() => client);
    const res = await adapter.runAdvancePhase(ADVANCE_INPUT);
    expect(res.ok).toBe(false);
    expect(res.error).toBe('rls denied');
  });

  it('azure: runs the three statements in ONE transaction', async () => {
    const tx = fakeTxSession();
    const adapter = createAzureProgramsWriteAdapter(tx.session);
    const res = await adapter.runAdvancePhase(ADVANCE_INPUT);
    expect(res.ok).toBe(true);
    expect(res.data?.snapshotId).toBe('row-1');
    expect(tx.state.transactions).toBe(1);
    expect(tx.statements).toHaveLength(3);
    expect(tx.statements[0]).toContain('INSERT INTO phase_snapshots');
    expect(tx.statements[1]).toContain('UPDATE engagements');
    expect(tx.statements[2]).toContain('INSERT INTO module_state_log');
  });

  it('azure: a transaction failure is surfaced as ok:false (no throw)', async () => {
    const { session } = fakeTxSession((sql) => {
      if (sql.includes('UPDATE engagements')) throw new Error('deadlock');
      return [{ id: 'row-1' }];
    });
    const adapter = createAzureProgramsWriteAdapter(session);
    const res = await adapter.runAdvancePhase(ADVANCE_INPUT);
    expect(res.ok).toBe(false);
    expect(res.error).toBe('deadlock');
  });
});

// --- programs.insertFounderApproval ----------------------------------------

const APPROVAL_INPUT = {
  programId: 'prog-1',
  requestedByUserId: 'user-1',
  requestType: 'phase_gate',
  headline: 'Approve P1 → P2',
  context: { from_phase: 1 },
  approverUserId: null,
  approverRole: 'sponsor',
  deadlineAtIso: '2026-06-01T00:00:00.000Z',
};

describe('programs insertFounderApproval', () => {
  it('supabase: inserts the verbatim founder_approval_requests row', async () => {
    const { client, calls } = fakeSupabase({ rowFor: () => ({ id: 'appr-7' }) });
    const adapter = createSupabaseProgramsWriteAdapter(() => client);
    const res = await adapter.insertFounderApproval(APPROVAL_INPUT);
    expect(res.ok).toBe(true);
    expect(res.data?.approvalId).toBe('appr-7');
    expect(calls[0].table).toBe('founder_approval_requests');
    expect(calls[0].body).toMatchObject({
      engagement_id: 'prog-1',
      request_type: 'phase_gate',
      status: 'pending',
      approver_role: 'sponsor',
    });
  });

  it('supabase: a DB error is surfaced as ok:false', async () => {
    const { client } = fakeSupabase({ errFor: () => ({ message: 'fk violation' }) });
    const adapter = createSupabaseProgramsWriteAdapter(() => client);
    const res = await adapter.insertFounderApproval(APPROVAL_INPUT);
    expect(res.ok).toBe(false);
    expect(res.error).toBe('fk violation');
  });

  it('azure: inserts inside a transaction and returns the approval id', async () => {
    const tx = fakeTxSession(() => [{ id: 'appr-az' }]);
    const adapter = createAzureProgramsWriteAdapter(tx.session);
    const res = await adapter.insertFounderApproval(APPROVAL_INPUT);
    expect(res.ok).toBe(true);
    expect(res.data?.approvalId).toBe('appr-az');
    expect(tx.statements[0]).toContain('INSERT INTO founder_approval_requests');
  });
});

// --- programs.runDraftModuleDeliverable ------------------------------------

const DRAFT_INPUT = {
  programId: 'prog-1',
  deliverableTypeKey: 'p2_package',
  title: 'P2 Package',
  draftContent: '# doc',
  structuredData: {},
  provenanceMap: null,
  contextHash: null,
};

describe('programs runDraftModuleDeliverable', () => {
  it('supabase: creates a new deliverable + version when none exists', async () => {
    const { client, calls } = fakeSupabase({
      rowFor: (t, op) => {
        if (t === 'deliverables_v2' && op === 'select') return null; // no existing
        if (t === 'deliverables_v2') return { id: 'deliv-1' };
        if (t === 'deliverable_versions') return { id: 'ver-1' };
        return { id: 'x' };
      },
    });
    const adapter = createSupabaseProgramsWriteAdapter(() => client);
    const res = await adapter.runDraftModuleDeliverable(DRAFT_INPUT);
    expect(res.ok).toBe(true);
    expect(res.data).toEqual({ deliverableId: 'deliv-1', versionId: 'ver-1' });
    expect(calls.find((c) => c.table === 'deliverable_types')?.body).toMatchObject({
      type_key: 'p2_package',
      output_format: 'markdown',
    });
    const inserted = calls.filter((c) => c.op === 'insert').map((c) => c.table);
    expect(inserted).toEqual(['deliverables_v2', 'deliverable_versions']);
  });

  it('supabase: a version insert error is surfaced as ok:false', async () => {
    const { client } = fakeSupabase({
      rowFor: (t, op) => (t === 'deliverables_v2' && op === 'select' ? null : { id: 'x' }),
      errFor: (t) => (t === 'deliverable_versions' ? { message: 'bad insert' } : null),
    });
    const adapter = createSupabaseProgramsWriteAdapter(() => client);
    const res = await adapter.runDraftModuleDeliverable(DRAFT_INPUT);
    expect(res.ok).toBe(false);
    expect(res.error).toBe('bad insert');
  });

  it('azure: runs the upsert + version insert in ONE transaction', async () => {
    const tx = fakeTxSession((sql) => {
      if (sql.includes('SELECT id, current_version')) return []; // no existing
      return [{ id: 'row-1' }];
    });
    const adapter = createAzureProgramsWriteAdapter(tx.session);
    const res = await adapter.runDraftModuleDeliverable(DRAFT_INPUT);
    expect(res.ok).toBe(true);
    expect(tx.state.transactions).toBe(1);
    expect(tx.statements[0]).toContain('INSERT INTO deliverable_types');
    expect(tx.statements.some((s) => s.includes('INSERT INTO deliverables_v2'))).toBe(true);
    expect(tx.statements.some((s) => s.includes('INSERT INTO deliverable_versions'))).toBe(true);
  });
});

// --- source-artifacts write adapter ----------------------------------------

const ARTIFACT_COLS: SourceArtifactInsertColumns = {
  tenant_key: 'apex-retail',
  source_event_id: 'evt-1',
  source_event_row_id: null,
  stage_key: 'intake',
  artifact_family: 'rfp',
  artifact_kind: 'rfp_document',
  source_origin: 'upload',
  source_format: 'pdf',
  original_name: 'rfp.pdf',
  blob_uri: 'blob://x',
  uploader_user_id: 'user-1',
  mime_type: 'application/pdf',
  size_bytes: 1024,
  sha256: 'abc',
  data_classification: 'Confidential',
  disclosure_classification: null,
  created_by: 'user-1',
  supersedes_artifact_version_id: null,
};

describe('source-artifacts write adapter', () => {
  it('selects Supabase by default and Azure by env', () => {
    const original = process.env.ABARVA_DATA_PLANE;
    delete process.env.ABARVA_DATA_PLANE;
    expect(selectSourceArtifactsWriteAdapter().name).toBe('supabase');
    process.env.ABARVA_DATA_PLANE = 'azure-postgres';
    expect(selectSourceArtifactsWriteAdapter().name).toBe('azure-postgres');
    if (original === undefined) delete process.env.ABARVA_DATA_PLANE;
    else process.env.ABARVA_DATA_PLANE = original;
  });

  it('supabase: inserts source_artifacts and returns the row', async () => {
    const { client, calls } = fakeSupabase({ rowFor: () => ({ id: 'art-1', tenant_key: 'apex-retail' }) });
    const adapter = createSupabaseSourceArtifactsWriteAdapter(() => client);
    const res = await adapter.insertArtifact(ARTIFACT_COLS, 'id, tenant_key');
    expect(res.ok).toBe(true);
    expect(res.data).toEqual({ id: 'art-1', tenant_key: 'apex-retail' });
    expect(calls[0].table).toBe('source_artifacts');
    expect(calls[0].body).toMatchObject({ source_event_id: 'evt-1', sha256: 'abc' });
    // no `id` column when artifactId omitted
    expect('id' in calls[0].body).toBe(false);
  });

  it('supabase: a DB error is surfaced as ok:false', async () => {
    const { client } = fakeSupabase({ errFor: () => ({ message: 'unique violation' }) });
    const adapter = createSupabaseSourceArtifactsWriteAdapter(() => client);
    const res = await adapter.insertArtifact(ARTIFACT_COLS, 'id');
    expect(res.ok).toBe(false);
    expect(res.error).toBe('unique violation');
  });

  it('azure: inserts inside a transaction and returns the row', async () => {
    const tx = fakeTxSession(() => [{ id: 'art-az' }]);
    const adapter = createAzureSourceArtifactsWriteAdapter(tx.session);
    const res = await adapter.insertArtifact(ARTIFACT_COLS, 'id');
    expect(res.ok).toBe(true);
    expect(res.data).toEqual({ id: 'art-az' });
    expect(tx.statements[0]).toContain('INSERT INTO source_artifacts');
    expect(tx.statements[0]).toContain('RETURNING id');
  });

  it('azure: a failure is surfaced as ok:false (no throw)', async () => {
    const { session } = fakeTxSession(() => {
      throw new Error('connection reset');
    });
    const adapter = createAzureSourceArtifactsWriteAdapter(session);
    const res = await adapter.insertArtifact(ARTIFACT_COLS, 'id');
    expect(res.ok).toBe(false);
    expect(res.error).toBe('connection reset');
  });
});

// --- thread write adapter --------------------------------------------------

const ATTACH_INPUT = {
  threadId: 'thr-1',
  engagementId: 'eng-1',
  clientId: 'client-1',
  userId: 'user-1',
};

describe('thread write adapter', () => {
  it('selects Supabase by default and Azure by env', () => {
    const original = process.env.ABARVA_DATA_PLANE;
    delete process.env.ABARVA_DATA_PLANE;
    expect(selectThreadWriteAdapter().name).toBe('supabase');
    process.env.ABARVA_DATA_PLANE = 'azure-postgres';
    expect(selectThreadWriteAdapter().name).toBe('azure-postgres');
    if (original === undefined) delete process.env.ABARVA_DATA_PLANE;
    else process.env.ABARVA_DATA_PLANE = original;
  });

  it('supabase: updates intelligence_threads scoped by id + client + user', async () => {
    const { client, calls } = fakeSupabase();
    const adapter = createSupabaseThreadWriteAdapter(() => client);
    const res = await adapter.attachThreadToEngagement(ATTACH_INPUT);
    expect(res.ok).toBe(true);
    expect(calls[0].table).toBe('intelligence_threads');
    expect(calls[0].body).toEqual({ attached_engagement_id: 'eng-1' });
    expect(calls[0].eqs).toEqual([
      { col: 'id', val: 'thr-1' },
      { col: 'client_id', val: 'client-1' },
      { col: 'user_id', val: 'user-1' },
    ]);
  });

  it('supabase: a DB error is surfaced as ok:false', async () => {
    const { client } = fakeSupabase({ errFor: () => ({ message: 'rls denied' }) });
    const adapter = createSupabaseThreadWriteAdapter(() => client);
    const res = await adapter.attachThreadToEngagement(ATTACH_INPUT);
    expect(res.ok).toBe(false);
    expect(res.error).toBe('rls denied');
  });

  it('azure: updates inside a transaction', async () => {
    const tx = fakeTxSession(() => []);
    const adapter = createAzureThreadWriteAdapter(tx.session);
    const res = await adapter.attachThreadToEngagement(ATTACH_INPUT);
    expect(res.ok).toBe(true);
    expect(tx.state.transactions).toBe(1);
    expect(tx.statements[0]).toContain('UPDATE intelligence_threads');
  });

  it('azure: a failure is surfaced as ok:false (no throw)', async () => {
    const { session } = fakeTxSession(() => {
      throw new Error('timeout');
    });
    const adapter = createAzureThreadWriteAdapter(session);
    const res = await adapter.attachThreadToEngagement(ATTACH_INPUT);
    expect(res.ok).toBe(false);
    expect(res.error).toBe('timeout');
  });
});
