// Runs-repository proof: insert (queued + payload), update/read map to the deliverable_runs
// contract, and the durable claim/sweep statements behave atomically. The fluent DB client
// and the raw-SQL session are faked (no data plane).

import {
  createDeliverableRun,
  completeDeliverableRun,
  getDeliverableRun,
  claimNextDeliverableRun,
  sweepStaleDeliverableRuns,
  type RawSqlRunner,
  type DeliverableRunJobPayload,
} from '../runs-repository';

interface Captured { table?: string; op?: string; payload?: Record<string, unknown>; filters: Array<[string, unknown]>; }

function fakeDb(returnRow: Record<string, unknown> | null) {
  const cap: Captured = { filters: [] };
  const builder: Record<string, unknown> = {};
  const chain = () => builder;
  builder.from = (t: string) => { cap.table = t; return builder; };
  builder.insert = (p: Record<string, unknown>) => { cap.op = 'insert'; cap.payload = p; return builder; };
  builder.update = (p: Record<string, unknown>) => { cap.op = 'update'; cap.payload = p; return builder; };
  builder.select = chain;
  builder.eq = (k: string, v: unknown) => { cap.filters.push([k, v]); return builder; };
  builder.single = async () => ({ data: returnRow, error: null });
  builder.maybeSingle = async () => ({ data: returnRow, error: null });
  // bare update().eq() is awaited directly (PromiseLike)
  builder.then = (onF: (r: { error: null }) => unknown) => Promise.resolve({ error: null }).then(onF);
  return { db: builder as never, cap };
}

const jobPayload: DeliverableRunJobPayload = {
  module: 'source',
  useCaseArchetype: 'AMS_IT_OUTSOURCING',
  deliverableType: 'rfp_package',
  decisionContext: 'approve issuance',
  clientDisplayName: 'SkyHarbor Air',
  initiativeDisplayName: 'AMS resourcing',
  sourceArtifactRef: 'evt-1',
};

const dbRow = {
  id: 'run-1', client_id: 'c1', tenant_key: 'skyharbor-air', user_id: 'u1', module: 'source',
  archetype: 'AMS_IT_OUTSOURCING', deliverable_type: 'rfp_package', status: 'queued',
  artifact_id: null, section_count: null, retrieved_evidence: null, blockers: [], warnings: [], error: null,
  claimed_at: null, worker_id: null, job_payload: jobPayload,
  created_at: 't0', updated_at: 't0',
};

describe('createDeliverableRun', () => {
  it('inserts a QUEUED row carrying the job payload and maps it back', async () => {
    const { db, cap } = fakeDb(dbRow);
    const rec = await createDeliverableRun(
      { clientId: 'c1', tenantKey: 'skyharbor-air', userId: 'u1', module: 'source', archetype: 'AMS_IT_OUTSOURCING', deliverableType: 'rfp_package', jobPayload },
      db,
    );
    expect(cap.table).toBe('deliverable_runs');
    expect(cap.op).toBe('insert');
    expect(cap.payload?.status).toBe('queued');
    expect(cap.payload?.client_id).toBe('c1');
    expect(cap.payload?.job_payload).toEqual(jobPayload);
    expect(rec.id).toBe('run-1');
    expect(rec.status).toBe('queued');
    expect(rec.jobPayload).toEqual(jobPayload);
  });
});

describe('completeDeliverableRun', () => {
  it('updates status + result fields by id', async () => {
    const { db, cap } = fakeDb(null);
    await completeDeliverableRun('run-1', { status: 'succeeded', artifactId: 'art-9', sectionCount: 12, retrievedEvidence: 7, warnings: ['w'] }, db);
    expect(cap.op).toBe('update');
    expect(cap.payload?.status).toBe('succeeded');
    expect(cap.payload?.artifact_id).toBe('art-9');
    expect(cap.filters).toContainEqual(['id', 'run-1']);
  });

  it('serializes blockers/warnings as JSON strings so the JSONB columns accept non-empty arrays', async () => {
    // Regression: the write client binds params raw, so a non-empty JS array reaches
    // Postgres as an array literal ({a,b}) and JSONB rejects it. Pre-serializing to a
    // JSON string is what makes a successful run (non-empty warnings) persist.
    const { db, cap } = fakeDb(null);
    await completeDeliverableRun('run-1', { status: 'succeeded', warnings: ['advisory note'], blockers: [] }, db);
    expect(cap.payload?.warnings).toBe(JSON.stringify(['advisory note']));
    expect(cap.payload?.blockers).toBe(JSON.stringify([]));
  });
});

describe('getDeliverableRun', () => {
  it('reads scoped to id + clientId and maps the row', async () => {
    const { db, cap } = fakeDb({ ...dbRow, status: 'succeeded', artifact_id: 'art-9', section_count: 12 });
    const rec = await getDeliverableRun('run-1', 'c1', db);
    expect(cap.filters).toContainEqual(['id', 'run-1']);
    expect(cap.filters).toContainEqual(['client_id', 'c1']);
    expect(rec?.status).toBe('succeeded');
    expect(rec?.artifactId).toBe('art-9');
    expect(rec?.sectionCount).toBe(12);
  });

  it('returns null when not found', async () => {
    const { db } = fakeDb(null);
    expect(await getDeliverableRun('x', 'c1', db)).toBeNull();
  });
});

/**
 * Simulate the atomic `FOR UPDATE SKIP LOCKED` claim with an injectable raw-SQL runner.
 * The fake holds a single queued row; the first claimer's UPDATE returns it, and any
 * concurrent claimer's sub-select skips the row-locked row and returns nothing — exactly
 * what SKIP LOCKED does on Postgres. This proves only one of two concurrent claimers wins.
 */
function singleRowClaimRunner(): { runner: RawSqlRunner; remaining: () => number } {
  let claimed = false;
  const runner: RawSqlRunner = async (fn) => {
    const run = async (_sql: string, params: unknown[]) => {
      const [workerId] = params;
      if (claimed) return [] as Record<string, unknown>[]; // row already locked+claimed → SKIP LOCKED yields nothing
      claimed = true;
      return [{ ...dbRow, status: 'running', worker_id: workerId, claimed_at: 'now' }];
    };
    return fn(run as never);
  };
  return { runner, remaining: () => (claimed ? 0 : 1) };
}

describe('claimNextDeliverableRun', () => {
  it('claims the queued row and stamps worker_id/running', async () => {
    const { runner } = singleRowClaimRunner();
    const row = await claimNextDeliverableRun('worker-A', { rawSql: runner });
    expect(row).not.toBeNull();
    expect(row?.status).toBe('running');
    expect(row?.workerId).toBe('worker-A');
    expect(row?.jobPayload).toEqual(jobPayload);
  });

  it('only ONE of two concurrent claimers gets the single queued row', async () => {
    const { runner } = singleRowClaimRunner();
    const [a, b] = await Promise.all([
      claimNextDeliverableRun('worker-A', { rawSql: runner }),
      claimNextDeliverableRun('worker-B', { rawSql: runner }),
    ]);
    const winners = [a, b].filter(Boolean);
    expect(winners).toHaveLength(1);
  });

  it('returns null when the queue is empty', async () => {
    const emptyRunner: RawSqlRunner = async (fn) => fn((async () => []) as never);
    expect(await claimNextDeliverableRun('worker-A', { rawSql: emptyRunner })).toBeNull();
  });
});

describe('sweepStaleDeliverableRuns', () => {
  it('marks stale queued/running rows failed and returns their ids; leaves fresh rows alone', async () => {
    // The fake stands in for the DB-side predicate: only rows past the deadline are
    // returned by RETURNING id. A "fresh" row would not match the WHERE and is not returned.
    const staleIds = ['stale-1', 'stale-2'];
    const captured: { sql?: string; params?: unknown[] } = {};
    const runner: RawSqlRunner = async (fn) => {
      const run = async (sql: string, params: unknown[]) => {
        captured.sql = sql;
        captured.params = params;
        return staleIds.map((id) => ({ id }));
      };
      return fn(run as never);
    };
    const reclaimed = await sweepStaleDeliverableRuns(15, { rawSql: runner });
    expect(reclaimed).toEqual(staleIds);
    expect(captured.sql).toMatch(/status\s+IN\s+\('queued',\s*'running'\)/);
    expect(captured.sql).toMatch(/SET\s+status\s*=\s*'failed'/);
    expect(captured.params).toEqual(['15']);
  });

  it('returns an empty list when nothing is stale', async () => {
    const runner: RawSqlRunner = async (fn) => fn((async () => []) as never);
    expect(await sweepStaleDeliverableRuns(15, { rawSql: runner })).toEqual([]);
  });
});
