// Behavior tests for deterministic fact identity + supersede planning (WS-B).

import {
  computeFactKey,
  computeLoadBatchId,
  computeStableChunkId,
  computeValueHash,
  planFactSupersession,
  type ExistingFact,
  type IncomingFact,
} from '@/lib/context-ingestion/fact-identity';

describe('identity functions', () => {
  it('fact key is value-independent and stable', () => {
    const a = computeFactKey({ tenantKey: 't', recordKey: 'rec1', attribute: 'Annual Revenue' });
    const b = computeFactKey({ tenantKey: 't', recordKey: 'rec1', attribute: 'annual_revenue' });
    expect(a).toBe('rec1:annual-revenue');
    expect(a).toBe(b);
  });

  it('value hash is stable regardless of object key order', () => {
    expect(computeValueHash({ a: 1, b: 2 })).toBe(computeValueHash({ b: 2, a: 1 }));
    expect(computeValueHash('52.1B')).not.toBe(computeValueHash('48.0B'));
  });

  it('chunk id is upload-independent (no uploadId / filename)', () => {
    const id1 = computeStableChunkId({ tenantKey: 'sky', sourceSegmentId: 'org_structure', sourceRecordId: 'cio', chunkIndex: 0 });
    const id2 = computeStableChunkId({ tenantKey: 'sky', sourceSegmentId: 'org_structure', sourceRecordId: 'cio', chunkIndex: 0 });
    expect(id1).toBe(id2);
    expect(id1).toBe('ctx:sky:org-structure:cio:c0');
  });

  it('load batch id is deterministic from content', () => {
    const args = { tenantKey: 't', sourceFileId: 'f1', contentHash: 'abc' };
    expect(computeLoadBatchId(args)).toBe(computeLoadBatchId(args));
    expect(computeLoadBatchId({ ...args, contentHash: 'xyz' })).not.toBe(computeLoadBatchId(args));
  });
});

const existing: ExistingFact[] = [
  { factKey: 'rec1:revenue', valueHash: computeValueHash('52.1B'), factId: 'F-rev' },
  { factKey: 'rec1:cio', valueHash: computeValueHash('Amala Rao'), factId: 'F-cio' },
];

describe('planFactSupersession', () => {
  it('idempotent: re-uploading identical facts is all no-op', () => {
    const incoming: IncomingFact[] = [
      { factKey: 'rec1:revenue', valueHash: computeValueHash('52.1B') },
      { factKey: 'rec1:cio', valueHash: computeValueHash('Amala Rao') },
    ];
    const plan = planFactSupersession({ existing, incoming, mode: 'partial_update' });
    expect(plan.noop.sort()).toEqual(['rec1:cio', 'rec1:revenue']);
    expect(plan.insert).toHaveLength(0);
    expect(plan.supersede).toHaveLength(0);
  });

  it('changed value: supersede old + insert new (no duplicate active row)', () => {
    const incoming: IncomingFact[] = [
      { factKey: 'rec1:revenue', valueHash: computeValueHash('54.8B') }, // changed
      { factKey: 'rec1:cio', valueHash: computeValueHash('Amala Rao') }, // same
    ];
    const plan = planFactSupersession({ existing, incoming, mode: 'partial_update' });
    expect(plan.insert).toEqual(['rec1:revenue']);
    expect(plan.supersede).toEqual([{ factId: 'F-rev', replacedByFactKey: 'rec1:revenue' }]);
    expect(plan.noop).toEqual(['rec1:cio']);
    // exactly one of insert/noop per incoming key; no key both inserted and noop
    expect([...plan.insert, ...plan.noop].sort()).toEqual(['rec1:cio', 'rec1:revenue']);
  });

  it('new fact key: insert only', () => {
    const incoming: IncomingFact[] = [{ factKey: 'rec1:headcount', valueHash: computeValueHash('95000') }];
    const plan = planFactSupersession({ existing, incoming, mode: 'partial_update' });
    expect(plan.insert).toEqual(['rec1:headcount']);
    expect(plan.supersede).toHaveLength(0);
  });

  it('partial_update does NOT retire facts absent from the file', () => {
    const incoming: IncomingFact[] = [{ factKey: 'rec1:revenue', valueHash: computeValueHash('52.1B') }];
    const plan = planFactSupersession({ existing, incoming, mode: 'partial_update' });
    expect(plan.deprecate).toHaveLength(0);
    expect(plan.supersede).toHaveLength(0);
  });

  it('replace_dimension retires current facts the file no longer asserts', () => {
    const incoming: IncomingFact[] = [{ factKey: 'rec1:revenue', valueHash: computeValueHash('52.1B') }];
    const plan = planFactSupersession({ existing, incoming, mode: 'replace_dimension' });
    expect(plan.deprecate).toEqual(['rec1:cio']);
    expect(plan.supersede).toEqual([{ factId: 'F-cio', replacedByFactKey: null }]);
    expect(plan.noop).toEqual(['rec1:revenue']);
  });

  it('deprecate_fact retires the named facts', () => {
    const incoming: IncomingFact[] = [{ factKey: 'rec1:cio', valueHash: computeValueHash('Amala Rao') }];
    const plan = planFactSupersession({ existing, incoming, mode: 'deprecate_fact' });
    expect(plan.deprecate).toEqual(['rec1:cio']);
    expect(plan.supersede).toEqual([{ factId: 'F-cio', replacedByFactKey: null }]);
    expect(plan.insert).toHaveLength(0);
  });
});
