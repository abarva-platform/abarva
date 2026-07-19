// Unit tests for the Source canvas-substrate read adapter (Slice 8).
//
//   - default plane stays Supabase; Azure selectable explicitly / by env;
//   - the Supabase adapter reads each substrate table scoped to
//     `source_event_id` with the pre-seam ordering;
//   - a Supabase error throws with the pre-seam `[helper]:` prefix;
//   - the Azure adapter runs the equivalent SQL with the same ORDER BY.

import type { PostgresCompatClient as SupabaseClient } from '@/lib/supabase-server';
import type { SessionRunner } from '../azureSession';
import {
  createAzureSourceCanvasSubstrateReadAdapter,
  createSupabaseSourceCanvasSubstrateReadAdapter,
  selectSourceCanvasSubstrateReadAdapter,
} from '../sourceCanvasSubstrateReadAdapter';

function fakeSession(
  handler: (sql: string, params: unknown[]) => unknown[],
): SessionRunner {
  return async (fn) =>
    fn(async <R>(sql: string, params: unknown[]) => handler(sql, params) as R[]);
}

/** A Supabase mock; the `.from(...).select().eq().order()` chain resolves. */
function fakeSupabase(result: { data: unknown; error: unknown }): {
  client: SupabaseClient;
  calls: { method: string; args: unknown[] }[];
} {
  const calls: { method: string; args: unknown[] }[] = [];
  const builder: Record<string, unknown> = {};
  builder.select = (...args: unknown[]) => {
    calls.push({ method: 'select', args });
    return builder;
  };
  builder.eq = (...args: unknown[]) => {
    calls.push({ method: 'eq', args });
    return builder;
  };
  builder.order = (...args: unknown[]) => {
    calls.push({ method: 'order', args });
    return Promise.resolve(result);
  };
  return { client: { from: () => builder } as unknown as SupabaseClient, calls };
}

describe('selectSourceCanvasSubstrateReadAdapter', () => {
  const original = process.env.ABARVA_DATA_PLANE;
  afterEach(() => {
    if (original === undefined) delete process.env.ABARVA_DATA_PLANE;
    else process.env.ABARVA_DATA_PLANE = original;
  });

  it('returns the Supabase adapter by default', () => {
    delete process.env.ABARVA_DATA_PLANE;
    expect(selectSourceCanvasSubstrateReadAdapter().name).toBe('supabase');
  });

  it('returns the Azure adapter when ABARVA_DATA_PLANE=azure-postgres', () => {
    process.env.ABARVA_DATA_PLANE = 'azure-postgres';
    expect(selectSourceCanvasSubstrateReadAdapter().name).toBe('azure-postgres');
  });

  it('honors an explicit plane argument over the env var', () => {
    process.env.ABARVA_DATA_PLANE = 'azure-postgres';
    expect(selectSourceCanvasSubstrateReadAdapter('supabase').name).toBe('supabase');
  });
});

describe('supabaseSourceCanvasSubstrateReadAdapter', () => {
  it('reads artifact states scoped to source_event_id ordered by artifact_code', async () => {
    const { client, calls } = fakeSupabase({ data: [{ id: 'a-1' }], error: null });
    const adapter = createSupabaseSourceCanvasSubstrateReadAdapter(() => client);
    const rows = await adapter.listArtifactStateRows('evt-1');

    expect(rows).toEqual([{ id: 'a-1' }]);
    expect(
      calls.some((c) => c.method === 'eq' && c.args[0] === 'source_event_id'
        && c.args[1] === 'evt-1'),
    ).toBe(true);
    expect(calls.some((c) => c.method === 'order' && c.args[0] === 'artifact_code')).toBe(true);
  });

  it('reads gate criterion + evidence states with their orderings', async () => {
    const gate = createSupabaseSourceCanvasSubstrateReadAdapter(
      () => fakeSupabase({ data: [], error: null }).client,
    );
    expect(await gate.listGateCriterionStateRows('evt-1')).toEqual([]);

    const ev = createSupabaseSourceCanvasSubstrateReadAdapter(
      () => fakeSupabase({ data: null, error: null }).client,
    );
    expect(await ev.listEvidenceStateRows('evt-1')).toEqual([]);
  });

  it('reads non-stale event facts newest first', async () => {
    const { client, calls } = fakeSupabase({ data: [{ id: 'fact-1' }], error: null });
    const adapter = createSupabaseSourceCanvasSubstrateReadAdapter(() => client);
    const rows = await adapter.listEventFactRows('evt-1');

    expect(rows).toEqual([{ id: 'fact-1' }]);
    expect(
      calls.some((c) => c.method === 'eq' && c.args[0] === 'source_event_id'
        && c.args[1] === 'evt-1'),
    ).toBe(true);
    expect(
      calls.some((c) => c.method === 'eq' && c.args[0] === 'is_stale'
        && c.args[1] === false),
    ).toBe(true);
    expect(calls.some((c) => c.method === 'order' && c.args[0] === 'captured_at')).toBe(true);
  });

  it('throws with the pre-seam helper prefix on a query error', async () => {
    const adapter = createSupabaseSourceCanvasSubstrateReadAdapter(
      () => fakeSupabase({ data: null, error: { message: 'boom' } }).client,
    );
    await expect(adapter.listArtifactStateRows('evt-1')).rejects.toThrow(
      'listArtifactStatesForEvent: boom',
    );
    await expect(adapter.listGateCriterionStateRows('evt-1')).rejects.toThrow(
      'listGateCriterionStatesForEvent: boom',
    );
    await expect(adapter.listEvidenceStateRows('evt-1')).rejects.toThrow(
      'listEvidenceStatesForEvent: boom',
    );
    await expect(adapter.listEventFactRows('evt-1')).rejects.toThrow(
      'listEventFactsForEvent: boom',
    );
  });
});

describe('azureSourceCanvasSubstrateReadAdapter', () => {
  it('runs source_event_id-scoped SQL with the pre-seam ORDER BY', async () => {
    const seen: { sql: string; params: unknown[] }[] = [];
    const adapter = createAzureSourceCanvasSubstrateReadAdapter(
      fakeSession((sql, params) => {
        seen.push({ sql, params });
        return [{ id: 'a-1' }];
      }),
    );

    await adapter.listArtifactStateRows('evt-1');
    await adapter.listGateCriterionStateRows('evt-1');
    await adapter.listEvidenceStateRows('evt-1');
    await adapter.listEventFactRows('evt-1');

    expect(seen[0].sql).toContain('FROM source_event_artifact_states');
    expect(seen[0].sql).toContain('ORDER BY artifact_code ASC');
    expect(seen[1].sql).toContain('FROM source_event_gate_criterion_states');
    expect(seen[1].sql).toContain('ORDER BY criterion_id ASC');
    expect(seen[2].sql).toContain('FROM source_event_evidence_states');
    expect(seen[2].sql).toContain('ORDER BY requirement_id ASC');
    expect(seen[3].sql).toContain('FROM source_event_facts');
    expect(seen[3].sql).toContain('is_stale = false');
    expect(seen[3].sql).toContain('ORDER BY captured_at DESC');
    expect(seen.every((s) => s.params[0] === 'evt-1')).toBe(true);
  });

  it('returns an empty array when the query yields no rows', async () => {
    const adapter = createAzureSourceCanvasSubstrateReadAdapter(fakeSession(() => []));
    expect(await adapter.listEvidenceStateRows('evt-empty')).toEqual([]);
  });
});
