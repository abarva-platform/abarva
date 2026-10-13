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

jest.mock('@/lib/data-plane/postgresCompat',()=>({...jest.requireActual('@/lib/data-plane/postgresCompat'),getAzureReadFluentClient:()=>{throw new Error('separate_pooled_basis_read_forbidden');}}));

import type { PostgresCompatClient as SupabaseClient } from '@/lib/supabase-server';
import type { TxSessionRunner } from '../../read-adapters/azureSession';
import { approvedMoveEvidenceRevision } from '@/lib/programs/approved-move-evidence-revision';
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

  it('forces governed foundation tenants onto Azure when no plane is configured', () => {
    delete process.env.ABARVA_DATA_PLANE;
    expect(selectProgramsWriteAdapter(undefined, 'airline-demo-new').name).toBe(
      'azure-postgres',
    );
  });

  it('fails closed when a governed foundation tenant is explicitly routed to Supabase', () => {
    expect(() =>
      selectProgramsWriteAdapter('supabase', 'airline-demo-new'),
    ).toThrow(/cannot use supabase/);
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
describe('initial authored P1 admission transaction', () => {
  const receipt = {
    source: 'authored_docx_upload' as const, origin: 'abarva_uploaded' as const, tenantKey: 'meridian-health', storageTenantKey: 'meridian',
    moveId: '10000000-0000-4000-8000-000000000001', deliverableTypeKey: 'charter' as const, phase: 1 as const,
    requestId: '50000000-0000-4000-8000-000000000001', sha256: 'a'.repeat(64),
    artifactId: '20000000-0000-4000-8000-000000000001', artifactVersion: 1, uploadedBy: 'operator-1',
    authoringBasis: 'abarva_authored_unsigned' as const, delegatedReviewReference: null, originalFileName: 'charter.docx', parseMethod: 'docx-parser',
    evidenceSnapshotHash: null, phaseEvidenceSnapshotHash: null, evidenceSnapshotScope: 'phase' as const, observedAt: '2026-10-12T18:00:00Z',
  };
  const emptyBasis = approvedMoveEvidenceRevision({tenantKey:receipt.tenantKey,moveId:receipt.moveId,rows:[]});
  const approvedReceipt = { ...receipt, evidenceSnapshotHash: emptyBasis, phaseEvidenceSnapshotHash: emptyBasis };
  const input = { programId: receipt.moveId, clientId: 'tenant-id', title: 'Program Charter', content: 'Unsigned authored words', receipt };
  it('creates the document, immutable uploaded version and lifecycle in one transaction with no authority pointer', async () => {
    const calls: Array<[string, readonly unknown[]]> = [];
    const { session, state } = fakeTxSession((sql, params) => {
      calls.push([sql, params]);
      if (sql.startsWith('SELECT id FROM engagements')) return [{ id: receipt.moveId }];
      if (sql.startsWith('SELECT type_key')) return [{ type_key: 'charter' }];
      if (sql.startsWith('INSERT INTO deliverables_v2')) return [{ id: 'document-1' }];
      if (sql.startsWith('INSERT INTO deliverable_versions')) return [{ id: 'version-1' }];
      return [];
    });
    expect(await createAzureProgramsWriteAdapter(session).runInitialAuthoredDeliverable(input)).toMatchObject({ ok: true, data: { kind: 'created', version: 1, receipt } });
    expect(state.transactions).toBe(1);
    expect(calls[0][0]).toContain('pg_advisory_xact_lock');
    expect(calls.find(([sql]) => sql.startsWith('SELECT id FROM engagements'))?.[1]).toEqual([receipt.moveId, 'tenant-id']);
    expect(calls.find(([sql]) => sql.startsWith('INSERT INTO deliverables_v2'))?.[0]).toContain("'draft'");
    const version = calls.find(([sql]) => sql.startsWith('INSERT INTO deliverable_versions'))!;
    expect(version[0]).toContain("'abarva_uploaded'"); expect(JSON.parse(String(version[1][2]))).toEqual({ source: 'authored_docx_upload', authoredUpload: receipt });
    expect(calls.some(([sql]) => /UPDATE engagements|signed_off_by|signed_off_version|approval_granted/.test(sql))).toBe(false);
  });
  it.each([1, 2])('refuses %i existing rows without overwriting or creating a version', async count => {
    const { session, statements } = fakeTxSession(sql => sql.startsWith('SELECT id FROM engagements') ? [{ id: receipt.moveId }]
      : sql.startsWith('SELECT id, current_version') ? Array.from({ length: count }, () => ({ id: 'signed-document', current_version: 4 })) : []);
    expect(await createAzureProgramsWriteAdapter(session).runInitialAuthoredDeliverable(input)).toMatchObject({ ok: true, data: { kind: 'conflict' } });
    expect(statements.some(sql => sql.startsWith('INSERT') || sql.startsWith('UPDATE'))).toBe(false);
  });
  it('replays only the exact stored receipt and returns its immutable IDs', async () => {
    const { session, statements } = fakeTxSession(sql => sql.startsWith('SELECT id FROM engagements') ? [{ id: receipt.moveId }]
      : sql.startsWith('SELECT id, current_version') ? [{ id: 'document-1', current_version: 2 }]
      : sql.startsWith('SELECT id, version, structured_data') ? [{ id: 'version-1', version: 1, structured_data: { authoredUpload: receipt } }] : []);
    expect(await createAzureProgramsWriteAdapter(session).runInitialAuthoredDeliverable(input)).toMatchObject({ ok: true, data: { kind: 'replay', versionId: 'version-1', version: 1, currentVersion: 2 } });
    expect(statements.some(sql => sql.startsWith('INSERT') || sql.startsWith('UPDATE'))).toBe(false);
  });
  it('provisions only the declared missing catalog identity inside the same admission transaction', async () => {
    const calls: Array<[string, readonly unknown[]]> = [];
    const { session, state } = fakeTxSession((sql, params) => {
      calls.push([sql, params]);
      if (sql.startsWith('SELECT id FROM engagements')) return [{ id: receipt.moveId }];
      if (sql.startsWith('INSERT INTO deliverables_v2')) return [{ id: 'document-1' }];
      if (sql.startsWith('INSERT INTO deliverable_versions')) return [{ id: 'version-1' }];
      return [];
    });
    expect((await createAzureProgramsWriteAdapter(session).runInitialAuthoredDeliverable(input)).ok).toBe(true);
    const catalog = calls.find(([sql]) => sql.startsWith('INSERT INTO deliverable_types'))!;
    expect(catalog[0]).toContain('ON CONFLICT (type_key) DO NOTHING'); expect(catalog[1]).toEqual(['charter', 'Program Charter']);
    expect(catalog[1]).not.toContain(input.content); expect(state.transactions).toBe(1);
  });
  it('refuses missing tenancy and stops a version-write failure before reporting admission', async () => {
    const missing = fakeTxSession(); expect((await createAzureProgramsWriteAdapter(missing.session).runInitialAuthoredDeliverable(input)).ok).toBe(false);
    const failing = fakeTxSession(sql => {
      if (sql.startsWith('SELECT id FROM engagements')) return [{ id: receipt.moveId }];
      if (sql.startsWith('SELECT type_key')) return [{ type_key: 'charter' }];
      if (sql.startsWith('INSERT INTO deliverables_v2')) return [{ id: 'document-1' }];
      if (sql.startsWith('INSERT INTO deliverable_versions')) throw new Error('version write refused');
      return [];
    });
    expect((await createAzureProgramsWriteAdapter(failing.session).runInitialAuthoredDeliverable(input)).ok).toBe(false);
    expect(failing.statements.some(sql => sql.includes('deliverable_lifecycle_events'))).toBe(false);
  });
  it('approves only the current authored file/version, updating the file, pointer and lifecycle in one transaction', async () => {
    const calls: Array<[string, readonly unknown[]]> = [];
    const { session, state } = fakeTxSession((sql, params) => { calls.push([sql, params]); return sql.startsWith('SELECT d.id') ? [{ id: 'document-1' }] : []; });
    const result = await createAzureProgramsWriteAdapter(session).runAuthoredApproval({ ...input, receipt: approvedReceipt, deliverableId: 'document-1', versionId: 'version-1', version: 1, userId: 'reviewer-1', reviewerRole: 'other', approvalRationale: 'Workspace review' });
    expect(result).toEqual({ ok: true, data: { applied: true } }); expect(state.transactions).toBe(1);
    const guard = calls[0]; expect(guard[0]).toContain('d.signed_off_version IS NULL'); expect(guard[0]).toContain('v.content = $6');
    expect(guard[0]).toContain("v.origin = 'abarva_uploaded'"); expect(guard[0]).toContain("v.structured_data->'authoredUpload' = $7::jsonb");
    expect(guard[0]).toContain('a.tenant_key = $10'); expect(guard[0]).toContain('a.blob_sha256 = $12'); expect(guard[0]).toContain('FOR UPDATE OF e, d, v, a');
    expect(guard[1]).toEqual(['document-1', receipt.moveId, 'tenant-id', 1, 'version-1', input.content, JSON.stringify(approvedReceipt), 'charter', receipt.artifactId, 'meridian', 1, receipt.sha256, receipt.requestId]);
    expect(calls.some(([sql]) => sql.startsWith('INSERT INTO deliverable_versions'))).toBe(false);
    const event = calls.find(([sql]) => sql.startsWith('INSERT INTO deliverable_lifecycle_events'))!;
    expect(event[0]).toContain("'abarva_uploaded'"); expect(event[0]).toContain("CASE WHEN $4 = 'other'");
  });
  it('leaves approval state untouched when its locked exact-version guard no longer matches', async () => {
    const { session, statements } = fakeTxSession();
    expect(await createAzureProgramsWriteAdapter(session).runAuthoredApproval({ ...input, receipt: approvedReceipt, deliverableId: 'document-1', versionId: 'version-1', version: 1, userId: 'reviewer-1', reviewerRole: 'artifact_owner', approvalRationale: null })).toEqual({ ok: true, data: { applied: false } });
    expect(statements.some(sql => sql.startsWith('UPDATE') || sql.startsWith('INSERT'))).toBe(false);
  });
  function p2Receipt(): import("@/lib/programs/authored-deliverable-receipt").AuthoredUploadReceipt {
    return { ...receipt, source: "authored_pptx_upload", phase: 2, deliverableTypeKey: "discovery_report",
      fileRole: "primary", fileFormat: "pptx", textSha256: "d".repeat(64), originalFileName: "report.pptx", parseMethod: "pptx-parser",
      companion: { source: "authored_docx_upload", origin: receipt.origin, tenantKey: receipt.tenantKey, storageTenantKey: receipt.storageTenantKey,
        moveId: receipt.moveId, phase: 2, deliverableTypeKey: "discovery_report", requestId: receipt.requestId,
        fileRole: "diagnostic_word", fileFormat: "docx", sha256: "b".repeat(64), textSha256: "e".repeat(64),
        artifactId: "20000000-0000-4000-8000-000000000002", artifactVersion: 1, uploadedBy: receipt.uploadedBy,
        authoringBasis: receipt.authoringBasis, originalFileName: "diagnostic.docx", parseMethod: "docx-parser" } };
  }
  it("atomically locks current P2 and both original file receipts before inserting one uploaded version", async () => {
    const r = p2Receipt(); const calls: Array<[string, readonly unknown[]]> = [];
    const { session, state } = fakeTxSession((sql, args) => {
      calls.push([sql,args]);
      if (sql.startsWith("SELECT id FROM engagements")) return [{ id: r.moveId }];
      if (sql.startsWith("SELECT artifact_id")) return [{ artifact_id: args[0] }];
      if (sql.startsWith("SELECT type_key")) return [{ type_key: r.deliverableTypeKey }];
      if (sql.startsWith("INSERT INTO deliverables_v2")) return [{ id: "document-p2" }];
      if (sql.startsWith("INSERT INTO deliverable_versions")) return [{ id: "version-p2" }];
      return [];
    });
    const result = await createAzureProgramsWriteAdapter(session).runInitialAuthoredDeliverable({ ...input, receipt: r });
    expect(result).toMatchObject({ ok: true, data: { kind: "created", receipt: r } }); expect(state.transactions).toBe(1);
    expect(calls.find(([sql]) => sql.startsWith("SELECT id FROM engagements"))?.[0]).toContain("current_phase = 2 FOR UPDATE");
    const locks = calls.filter(([sql]) => sql.startsWith("SELECT artifact_id")); expect(locks).toHaveLength(2);
    expect(locks.map(([,args]) => args[0])).toEqual([r.artifactId,r.companion!.artifactId]);
    for (const [sql] of locks) { expect(sql).toContain("FOR UPDATE"); expect(sql).toContain("authoredTextSha256"); expect(sql).toContain("authoredUploadedBy"); }
    expect(locks[1][1]).toEqual([r.companion!.artifactId,r.moveId,r.storageTenantKey,2,"docx",1,r.companion!.sha256,r.requestId,r.deliverableTypeKey,"diagnostic_word",r.uploadedBy,r.companion!.textSha256]);
    expect(calls.filter(([sql]) => sql.startsWith("INSERT INTO deliverable_versions"))).toHaveLength(1);
    expect(calls.some(([sql]) => sql.startsWith("UPDATE engagements") || sql.includes("'approval_granted'"))).toBe(false);
  });
  it.each(["phase", "primary", "companion"])("leaves every document/version unchanged when P2 %s lock is unavailable", async failure => {
    const r = p2Receipt(); const { session, statements } = fakeTxSession((sql,args) => {
      if (sql.startsWith("SELECT id FROM engagements")) return failure === "phase" ? [] : [{ id: r.moveId }];
      if (sql.startsWith("SELECT artifact_id")) return (failure === "primary" && args[0] === r.artifactId || failure === "companion" && args[0] === r.companion!.artifactId) ? [] : [{ artifact_id: args[0] }];
      return [];
    });
    expect((await createAzureProgramsWriteAdapter(session).runInitialAuthoredDeliverable({ ...input, receipt: r })).ok).toBe(false);
    expect(statements.some(sql => sql.startsWith("INSERT") || sql.startsWith("UPDATE"))).toBe(false);
  });
  it("rejects a missing companion before taking an admission lock", async () => {
    const r = { ...p2Receipt(), companion: undefined }; const { session, statements } = fakeTxSession();
    expect((await createAzureProgramsWriteAdapter(session).runInitialAuthoredDeliverable({ ...input, receipt: r })).ok).toBe(false); expect(statements).toHaveLength(0);
  });
  it("binds P2 approval to current phase and all originals without creating a version", async () => {
    const r = { ...p2Receipt(), evidenceSnapshotHash: emptyBasis, phaseEvidenceSnapshotHash: emptyBasis }; const calls: Array<[string, readonly unknown[]]> = [];
    const { session } = fakeTxSession((sql,args) => { calls.push([sql,args]); return sql.startsWith("SELECT d.id") ? [{ id: "document-p2" }] : sql.startsWith("SELECT artifact_id") ? [{ artifact_id: args[0] }] : []; });
    expect(await createAzureProgramsWriteAdapter(session).runAuthoredApproval({ ...input, receipt: r, deliverableId: "document-p2", versionId: "version-p2", version: 1, userId: "reviewer-1", reviewerRole: "other", approvalRationale: "Workspace package review" })).toEqual({ ok: true, data: { applied: true } });
    expect(calls[0][0]).toContain("e.current_phase = 2 FOR UPDATE OF e, d, v, a");
    expect(calls[0][0]).toContain("v.structured_data->>'source' = $14"); expect(calls[0][1][13]).toBe("authored_pptx_upload");
    expect(calls.filter(([sql]) => sql.startsWith("SELECT artifact_id"))).toHaveLength(2);
    const files = calls.filter(([sql]) => sql.startsWith("UPDATE move_artifacts")); expect(files.map(([,args]) => args[0])).toEqual([r.artifactId,r.companion!.artifactId]);
    expect(calls.some(([sql]) => sql.startsWith("INSERT INTO deliverable_versions"))).toBe(false);
  });
  it("does not update either approval pointer when the companion changed", async () => {
    const r = { ...p2Receipt(), evidenceSnapshotHash: emptyBasis, phaseEvidenceSnapshotHash: emptyBasis }; const { session, statements } = fakeTxSession((sql,args) => sql.startsWith("SELECT d.id") ? [{ id: "document-p2" }] : sql.startsWith("SELECT artifact_id") && args[0] === r.artifactId ? [{ artifact_id: args[0] }] : []);
    expect((await createAzureProgramsWriteAdapter(session).runAuthoredApproval({ ...input, receipt: r, deliverableId: "document-p2", versionId: "version-p2", version: 1, userId: "reviewer-1", reviewerRole: "other", approvalRationale: null })).ok).toBe(false);
    expect(statements.some(sql => sql.startsWith("UPDATE") || sql.includes("'approval_granted'"))).toBe(false);
  });

  it.each([1,2] as const)("rejects P%s evidence drift after preflight inside the locked approval transaction", async phase => {
    const r=phase===1?approvedReceipt:{...p2Receipt(),evidenceSnapshotHash:emptyBasis,phaseEvidenceSnapshotHash:emptyBasis};
    const changedReview={evidence_id:"60000000-0000-4000-8000-000000000001",decision:"approved",source_ref:{},reviewed_at:"2026-10-12T18:01:00Z",updated_at:"2026-10-12T18:01:00Z",created_at:"2026-10-12T17:00:00Z"};
    const changedEvidence={id:changedReview.evidence_id,phase,title:"New governed review",evidence_type:"uploaded_artifact",summary:"New approved basis",extracted_structured:{},created_at:"2026-10-12T17:00:00Z"};
    const calls:Array<[string,readonly unknown[]]>=[];
    const {session}=fakeTxSession((sql,args)=>{calls.push([sql,args]);return sql.startsWith("SELECT d.id")?[{id:"document-1"}]:sql.includes("FROM program_evidence_reviews")?[changedReview]:sql.includes("FROM program_evidence_items")?[changedEvidence]:[];});
    const res=await createAzureProgramsWriteAdapter(session).runAuthoredApproval({...input,receipt:r,deliverableId:"document-1",versionId:"version-1",version:1,userId:"reviewer",reviewerRole:"other",approvalRationale:null});
    expect(res).toEqual({ok:true,data:{applied:false}});
    expect(calls[0][0]).toContain("FOR UPDATE OF e, d, v, a");
    expect(calls.some(([sql])=>sql.startsWith("UPDATE")||sql.startsWith("INSERT"))).toBe(false);
    const reads=calls.filter(([sql])=>sql.includes("FROM program_evidence_reviews")||sql.includes("FROM program_evidence_items"));
    expect(reads).toHaveLength(3);for(const [sql,args]of reads){expect(sql).toContain("tenant_key = ANY($1::text[])");expect(sql).toContain("program_id = $2");expect(args[1]).toBe(r.moveId);}
  });

  it("refuses an unavailable transactional evidence read before any approval writes",async()=>{
    const {session,statements}=fakeTxSession(sql=>{if(sql.startsWith("SELECT d.id"))return[{id:"document-1"}];throw new Error("basis unavailable");});
    expect((await createAzureProgramsWriteAdapter(session).runAuthoredApproval({...input,receipt:approvedReceipt,deliverableId:"document-1",versionId:"version-1",version:1,userId:"reviewer",reviewerRole:"other",approvalRationale:null})).ok).toBe(false);
    expect(statements.some(sql=>sql.startsWith("UPDATE")||sql.startsWith("INSERT"))).toBe(false);
  });

  it.each([[1,"authored"],[1,"generated"],[2,"authored"],[2,"generated"]] as const)("serializes P%s actual parent creators when %s observes absence first",async(phase,first)=>{
    const r=phase===1?receipt:p2Receipt();const ownInput={...input,receipt:r};
    type Parent={id:string;current_version:number;origin:string};const parents:Parent[]=[];
    let releaseRead!:()=>void;let signalRead!:()=>void;const firstRead=new Promise<void>(r=>signalRead=r);const allowInsert=new Promise<void>(r=>releaseRead=r);
    let lockOwner=false;const waiters:Array<()=>void>=[];let heldKey:string|undefined;const keys:string[]=[];
    const acquire=async(key:string)=>{keys.push(key);if(lockOwner)await new Promise<void>(r=>waiters.push(r));else lockOwner=true;heldKey=key;};
    const release=()=>{const next=waiters.shift();if(next)next();else{lockOwner=false;heldKey=undefined;}};
    let reads=0;let transactions=0;let firstCommitted!:()=>void;const firstCommit=new Promise<void>(resolve=>firstCommitted=resolve);const statements:string[]=[];
    const session:TxSessionRunner=async fn=>{const tx=++transactions;let owns=false;try{return await fn(async<R>(sql:string,args:unknown[])=>{
      statements.push(sql);
      if(sql.includes("pg_advisory_xact_lock")){await acquire(String(args[0]));owns=true;return[]as R[];}
      if(sql.startsWith("SELECT id FROM engagements"))return[{id:receipt.moveId}]as R[];
      if(sql.startsWith("SELECT id, current_version")){const observed=parents.map(x=>({...x}));if(++reads===1){signalRead();await allowInsert;}return observed as R[];}
      if(sql.startsWith("SELECT artifact_id"))return[{artifact_id:args[0]}]as R[];
      if(sql.startsWith("SELECT type_key"))return[{type_key:r.deliverableTypeKey}]as R[];
      if(sql.startsWith("SELECT id FROM deliverable_versions"))return parents.filter(x=>x.origin==="abarva_uploaded").map(x=>({id:x.id}))as R[];
      if(sql.startsWith("SELECT id, version, structured_data"))return[]as R[];
      if(sql.startsWith("INSERT INTO deliverables_v2")){if(tx===2&&!owns)await firstCommit;const id="document-"+(parents.length+1);parents.push({id,current_version:1,origin:sql.includes("'nexus'")?"nexus_generated":"abarva_uploaded"});return[{id}]as R[];}
      if(sql.startsWith("INSERT INTO deliverable_versions"))return[{id:"version-1"}]as R[];
      return[]as R[];
    });}finally{if(owns)release();if(tx===1)firstCommitted();}};
    const adapter=createAzureProgramsWriteAdapter(session);
    const generated=()=>adapter.runDraftModuleDeliverable({programId:receipt.moveId,deliverableTypeKey:r.deliverableTypeKey,title:"Synthetic phase document",draftContent:"Synthetic generated draft",structuredData:{},contextHash:"hash",provenanceMap:null});
    const authored=()=>adapter.runInitialAuthoredDeliverable(ownInput);
    const winner=first==="authored"?authored():generated();await firstRead;
    const loser=first==="authored"?generated():authored();
    await Promise.resolve();expect(heldKey).toBe(`${receipt.moveId}:${r.deliverableTypeKey}`);releaseRead();
    const [a,b]=await Promise.all([winner,loser]);expect(a.ok).toBe(true);expect(parents).toHaveLength(1);expect(keys).toEqual([`${receipt.moveId}:${r.deliverableTypeKey}`,`${receipt.moveId}:${r.deliverableTypeKey}`]);
    if(first==="authored"){expect(b).toMatchObject({ok:false,error:"authored_deliverable_not_regenerable"});expect(parents[0].origin).toBe("abarva_uploaded");}
    else expect(b).toMatchObject({ok:true,data:{kind:"conflict"}});
    expect(statements.filter(sql=>sql.startsWith("INSERT INTO deliverable_versions"))).toHaveLength(1);
  });

  it.each([{id:"signed",current_version:2,status:"signed_off",signed_off_version:2},{id:"authored",current_version:1,status:"draft"}])("preserves a protected generated-writer slot %s",async row=>{
    const {session,statements}=fakeTxSession(sql=>sql.startsWith("SELECT id, current_version")?[row]:sql.startsWith("SELECT id FROM deliverable_versions")?[{id:"authored-version"}]:[]);
    const result=await createAzureProgramsWriteAdapter(session).runDraftModuleDeliverable({programId:receipt.moveId,deliverableTypeKey:receipt.deliverableTypeKey,title:"Synthetic phase document",draftContent:"Synthetic draft",structuredData:{},provenanceMap:null,contextHash:null});
    expect(result.ok).toBe(false);expect(statements.some(sql=>sql.startsWith("UPDATE deliverables_v2")||sql.startsWith("INSERT INTO deliverable_versions"))).toBe(false);
  });

});
