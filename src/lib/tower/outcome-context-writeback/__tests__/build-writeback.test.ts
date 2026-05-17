// Tower → Outcome → Context write-back · Wave 3, Slice 3.7 · tests.

import type { OutcomeLedgerRow } from '@/lib/tower/outcome-ledger';
import {
  buildOutcomeContextWriteback,
  buildOutcomeContextWritebackBatch,
  isResolvedForWriteback,
  OUTCOME_CONTEXT_WRITEBACK_SCHEMA_VERSION,
  OUTCOME_LEARNING_CONTEXT_TABLE,
  OUTCOME_LEARNING_RECORD_TYPE,
  writeOutcomeLearningBatchToContext,
  writeOutcomeLearningToContext,
  type ContextWritebackStore,
  type OutcomeLearningContextRow,
} from '../index';

/** A baseline resolved ledger row; override per test. */
function row(overrides: Partial<OutcomeLedgerRow> = {}): OutcomeLedgerRow {
  return {
    id: 'entry-1',
    supersedesEntryId: null,
    isCurrent: true,
    tenantClientKey: 'apexretail',
    clientId: 'client-uuid-1',
    subjectKind: 'move',
    subjectRef: 'MOVE-42',
    subjectLabel: 'Contact Center AI rollout',
    valueRung: 'measured_in_production',
    valueCategory: 'cost_avoidance',
    measurementUnit: 'usd_seed',
    projectedAmount: 100,
    realizedAmount: 120,
    baselineAmount: 0,
    counterfactualConfidence: 'medium',
    governanceReviewStatus: 'approved',
    measurementOwnerRole: 'cfo',
    evidencePointer: 'EVID3-1',
    evidenceClaimIds: ['EVID3-1'],
    note: 'internal note',
    recordedBy: 'user-99',
    recordedAt: '2026-05-10T00:00:00.000Z',
    ...overrides,
  };
}

/** An in-memory store that records every upsert call. */
function fakeStore(opts: { fail?: boolean } = {}): ContextWritebackStore & {
  calls: Array<{ table: string; row: OutcomeLearningContextRow; onConflict: string }>;
} {
  const calls: Array<{
    table: string;
    row: OutcomeLearningContextRow;
    onConflict: string;
  }> = [];
  return {
    calls,
    async upsertOutcomeLearning(table, r, onConflict) {
      calls.push({ table, row: r, onConflict });
      return opts.fail ? { ok: false, error: 'backend boom' } : { ok: true };
    },
  };
}

describe('isResolvedForWriteback', () => {
  it('is true only for verified/realized/declined rungs', () => {
    for (const r of ['measured_in_pilot', 'measured_in_production', 'declined'] as const) {
      expect(isResolvedForWriteback(row({ valueRung: r }))).toBe(true);
    }
    for (const r of [
      'projected_only',
      'baseline_pending',
      'baseline_set',
      'in_pilot_measurement',
    ] as const) {
      expect(isResolvedForWriteback(row({ valueRung: r }))).toBe(false);
    }
  });
});

describe('buildOutcomeContextWriteback', () => {
  it('does not write back an unresolved outcome — loop stays open', () => {
    const plan = buildOutcomeContextWriteback(row({ valueRung: 'in_pilot_measurement' }));
    expect(plan).toEqual({ written: false, reason: 'not_resolved' });
  });

  it('projects a verified outcome into a tenant-scoped Context record', () => {
    const plan = buildOutcomeContextWriteback(row());
    expect(plan.written).toBe(true);
    if (!plan.written) throw new Error('expected written');
    const r = plan.row;
    expect(r.record_type).toBe(OUTCOME_LEARNING_RECORD_TYPE);
    expect(r.tenant_key).toBe('apexretail');
    expect(r.client_id).toBe('client-uuid-1');
    expect(r.source_system).toBe('tower_outcome_ledger');
    expect(r.source_record_id).toBe('entry-1');
    expect(r.lifecycle_state).toBe('active');
  });

  it('keeps the subject label and realized figures (tenant-facing, unlike 3.6)', () => {
    const plan = buildOutcomeContextWriteback(row());
    if (!plan.written) throw new Error('expected written');
    expect(plan.row.payload.subjectLabel).toBe('Contact Center AI rollout');
    expect(plan.row.payload.projectedAmount).toBe(100);
    expect(plan.row.payload.realizedAmount).toBe(120);
    expect(plan.row.title).toContain('Contact Center AI rollout');
  });

  it('derives a deterministic canonical_record_id for idempotent upsert', () => {
    const a = buildOutcomeContextWriteback(row());
    const b = buildOutcomeContextWriteback(row());
    if (!a.written || !b.written) throw new Error('expected written');
    expect(a.row.canonical_record_id).toBe('outcome-learning-entry-1');
    expect(a.row.canonical_record_id).toBe(b.row.canonical_record_id);
  });

  it('classifies an overdelivered outcome as "exceeded"', () => {
    const plan = buildOutcomeContextWriteback(row({ projectedAmount: 100, realizedAmount: 200 }));
    if (!plan.written) throw new Error('expected written');
    expect(plan.row.record_subtype).toBe('exceeded');
    expect(plan.row.payload.verdict).toBe('exceeded');
    expect(plan.row.payload.varianceAbs).toBe(100);
    expect(plan.row.payload.realizationRatio).toBe(2);
    expect(plan.row.payload.learningSummary).toContain('exceeded');
  });

  it('classifies an underdelivered outcome as "shortfall"', () => {
    const plan = buildOutcomeContextWriteback(row({ projectedAmount: 100, realizedAmount: 40 }));
    if (!plan.written) throw new Error('expected written');
    expect(plan.row.record_subtype).toBe('shortfall');
    expect(plan.row.payload.verdict).toBe('shortfall');
    expect(plan.row.payload.learningSummary).toContain('fell short');
  });

  it('classifies an on-target outcome as "met"', () => {
    const plan = buildOutcomeContextWriteback(row({ projectedAmount: 100, realizedAmount: 100 }));
    if (!plan.written) throw new Error('expected written');
    expect(plan.row.record_subtype).toBe('met');
  });

  it('handles a declined outcome with a null realized figure', () => {
    const plan = buildOutcomeContextWriteback(
      row({ valueRung: 'declined', realizedAmount: null }),
    );
    if (!plan.written) throw new Error('expected written');
    expect(plan.row.record_subtype).toBe('declined');
    expect(plan.row.payload.realizedAmount).toBeNull();
    expect(plan.row.payload.realizationRatio).toBeNull();
    expect(plan.row.payload.varianceAbs).toBeNull();
    expect(plan.row.payload.learningSummary).toContain('declined');
  });

  it('does not divide by a zero projection', () => {
    const plan = buildOutcomeContextWriteback(row({ projectedAmount: 0, realizedAmount: 50 }));
    if (!plan.written) throw new Error('expected written');
    expect(plan.row.payload.realizationRatio).toBeNull();
    expect(plan.row.payload.varianceAbs).toBeNull();
    expect(plan.row.record_subtype).toBe('met');
  });

  it('stamps the write-back schema version on the payload', () => {
    const plan = buildOutcomeContextWriteback(row());
    if (!plan.written) throw new Error('expected written');
    expect(plan.row.payload.writebackSchemaVersion).toBe(
      OUTCOME_CONTEXT_WRITEBACK_SCHEMA_VERSION,
    );
  });

  it('does not mutate the input ledger row', () => {
    const input = row();
    const snapshot = JSON.stringify(input);
    buildOutcomeContextWriteback(input);
    expect(JSON.stringify(input)).toBe(snapshot);
  });
});

describe('buildOutcomeContextWritebackBatch', () => {
  it('keeps resolved rows and drops unresolved ones, preserving order', () => {
    const rows = [
      row({ id: 'a', valueRung: 'measured_in_pilot' }),
      row({ id: 'b', valueRung: 'projected_only' }),
      row({ id: 'c', valueRung: 'declined', realizedAmount: null }),
    ];
    const out = buildOutcomeContextWritebackBatch(rows);
    expect(out.map((r) => r.source_record_id)).toEqual(['a', 'c']);
  });
});

describe('writeOutcomeLearningToContext', () => {
  it('skips an unresolved row without touching the store', async () => {
    const store = fakeStore();
    const result = await writeOutcomeLearningToContext(
      row({ valueRung: 'baseline_set' }),
      store,
    );
    expect(result).toEqual({ status: 'skipped', reason: 'not_resolved' });
    expect(store.calls).toHaveLength(0);
  });

  it('upserts a resolved outcome into the Context layer — loop closes', async () => {
    const store = fakeStore();
    const result = await writeOutcomeLearningToContext(row(), store);
    expect(result).toEqual({
      status: 'written',
      canonicalRecordId: 'outcome-learning-entry-1',
    });
    expect(store.calls).toHaveLength(1);
    expect(store.calls[0].table).toBe(OUTCOME_LEARNING_CONTEXT_TABLE);
    expect(store.calls[0].onConflict).toBe('tenant_key,canonical_record_id');
    expect(store.calls[0].row.record_type).toBe(OUTCOME_LEARNING_RECORD_TYPE);
  });

  it('canonicalizes the tenant key on the way in', async () => {
    const store = fakeStore();
    await writeOutcomeLearningToContext(row({ tenantClientKey: 'apexretail' }), store);
    expect(store.calls[0].row.tenant_key).toBe('apex-retail');
  });

  it('reports a backend failure rather than throwing', async () => {
    const store = fakeStore({ fail: true });
    const result = await writeOutcomeLearningToContext(row(), store);
    expect(result.status).toBe('failed');
    if (result.status !== 'failed') throw new Error('expected failed');
    expect(result.detail).toContain('boom');
  });
});

describe('writeOutcomeLearningBatchToContext', () => {
  it('attempts each row independently and preserves order', async () => {
    const store = fakeStore();
    const results = await writeOutcomeLearningBatchToContext(
      [
        row({ id: 'x', valueRung: 'measured_in_production' }),
        row({ id: 'y', valueRung: 'in_pilot_measurement' }),
      ],
      store,
    );
    expect(results.map((r) => r.status)).toEqual(['written', 'skipped']);
    expect(store.calls).toHaveLength(1);
  });
});
