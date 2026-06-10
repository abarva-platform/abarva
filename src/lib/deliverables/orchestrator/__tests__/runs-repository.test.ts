// Runs-repository proof: insert/update/read map to the deliverable_runs contract and
// row→record conversion is correct. The fluent DB client is faked (no data plane).

import { createDeliverableRun, completeDeliverableRun, getDeliverableRun } from '../runs-repository';

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

const dbRow = {
  id: 'run-1', client_id: 'c1', tenant_key: 'skyharbor-air', user_id: 'u1', module: 'source',
  archetype: 'AMS_IT_OUTSOURCING', deliverable_type: 'rfp_package', status: 'running',
  artifact_id: null, section_count: null, retrieved_evidence: null, blockers: [], warnings: [], error: null,
  created_at: 't0', updated_at: 't0',
};

describe('createDeliverableRun', () => {
  it('inserts a running row and maps it back', async () => {
    const { db, cap } = fakeDb(dbRow);
    const rec = await createDeliverableRun({ clientId: 'c1', tenantKey: 'skyharbor-air', userId: 'u1', module: 'source', archetype: 'AMS_IT_OUTSOURCING', deliverableType: 'rfp_package' }, db);
    expect(cap.table).toBe('deliverable_runs');
    expect(cap.op).toBe('insert');
    expect(cap.payload?.status).toBe('running');
    expect(cap.payload?.client_id).toBe('c1');
    expect(rec.id).toBe('run-1');
    expect(rec.status).toBe('running');
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
