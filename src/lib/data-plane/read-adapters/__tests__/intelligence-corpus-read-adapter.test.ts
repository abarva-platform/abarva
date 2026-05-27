// Unit tests for the Intelligence corpus read adapter (Slice 5).
//
//   - default plane stays Supabase; Azure selectable explicitly / by env;
//   - the Supabase adapter resolves the Apex Retail `clients` row by name
//     and reads the five retail-corpus projections;
//   - a Supabase error on any corpus read throws (pre-seam parity);
//   - the Azure adapter runs the equivalent SQL and maps rows verbatim.

import type { PostgresCompatClient as SupabaseClient } from '@/lib/supabase-server';
import type { SessionRunner } from '../azureSession';
import {
  createAzureIntelligenceCorpusReadAdapter,
  createSupabaseIntelligenceCorpusReadAdapter,
  selectIntelligenceCorpusReadAdapter,
} from '../intelligenceCorpusReadAdapter';

function fakeSession(
  handler: (sql: string, params: unknown[]) => unknown[],
): SessionRunner {
  return async (fn) =>
    fn(async <R>(sql: string, params: unknown[]) => handler(sql, params) as R[]);
}

/**
 * A Supabase mock keyed by table. Each builder chain is terminal-agnostic:
 * every chained method returns the builder, and the builder is thenable so
 * an `await` resolves to the table's configured `{ data, error }`.
 */
function fakeSupabase(
  results: Record<string, { data: unknown; error: unknown }>,
): SupabaseClient {
  const make = (table: string) => {
    const result = results[table] ?? { data: [], error: null };
    const builder: Record<string, unknown> = {};
    const chain = () => builder;
    for (const m of ['select', 'eq', 'gte', 'lte', 'like', 'is', 'in', 'order', 'limit']) {
      builder[m] = chain;
    }
    builder.maybeSingle = () => Promise.resolve(result);
    builder.then = (resolve: (v: unknown) => unknown) => resolve(result);
    return builder;
  };
  return { from: (table: string) => make(table) } as unknown as SupabaseClient;
}

describe('selectIntelligenceCorpusReadAdapter', () => {
  const original = process.env.ABARVA_DATA_PLANE;
  afterEach(() => {
    if (original === undefined) delete process.env.ABARVA_DATA_PLANE;
    else process.env.ABARVA_DATA_PLANE = original;
  });

  it('returns the Supabase adapter by default', () => {
    delete process.env.ABARVA_DATA_PLANE;
    expect(selectIntelligenceCorpusReadAdapter().name).toBe('supabase');
  });

  it('returns the Azure adapter when ABARVA_DATA_PLANE=azure-postgres', () => {
    process.env.ABARVA_DATA_PLANE = 'azure-postgres';
    expect(selectIntelligenceCorpusReadAdapter().name).toBe('azure-postgres');
  });

  it('honors an explicit plane argument over the env var', () => {
    process.env.ABARVA_DATA_PLANE = 'azure-postgres';
    expect(selectIntelligenceCorpusReadAdapter('supabase').name).toBe('supabase');
  });
});

describe('supabaseIntelligenceCorpusReadAdapter', () => {
  it('resolves the Apex Retail client row by name', async () => {
    const client = fakeSupabase({
      clients: { data: { id: 'c-1', name: 'Apex Retail', industry_code: 'RETAIL' }, error: null },
    });
    const adapter = createSupabaseIntelligenceCorpusReadAdapter(() => client);
    const row = await adapter.getApexRetailClient();
    expect(row).toEqual({ id: 'c-1', name: 'Apex Retail', industry_code: 'RETAIL' });
  });

  it('returns null when no Apex Retail client exists', async () => {
    const client = fakeSupabase({ clients: { data: null, error: null } });
    const adapter = createSupabaseIntelligenceCorpusReadAdapter(() => client);
    expect(await adapter.getApexRetailClient()).toBeNull();
  });

  it('throws when the client lookup errors', async () => {
    const client = fakeSupabase({ clients: { data: null, error: { message: 'boom' } } });
    const adapter = createSupabaseIntelligenceCorpusReadAdapter(() => client);
    await expect(adapter.getApexRetailClient()).rejects.toMatchObject({ message: 'boom' });
  });

  it('reads the five corpus projections into a bundle', async () => {
    const client = fakeSupabase({
      genome_patterns: { data: [{ code: 'F200' }], error: null },
      knowledge_sources: { data: [{ source_key: 's-1' }], error: null },
      use_cases: { data: [{ name: 'uc-1' }], error: null },
      contradictions: { data: [{ severity: 'high' }], error: null },
      intelligence_graph_edges: { data: [{ edge_type: 'sourced_from' }], error: null },
    });
    const adapter = createSupabaseIntelligenceCorpusReadAdapter(() => client);
    const bundle = await adapter.getCorpusBundle('c-1');

    expect(bundle.patterns).toHaveLength(1);
    expect(bundle.sources).toHaveLength(1);
    expect(bundle.useCases).toHaveLength(1);
    expect(bundle.contradictions).toHaveLength(1);
    expect(bundle.edges).toHaveLength(1);
  });

  it('throws when a corpus read errors', async () => {
    const client = fakeSupabase({
      genome_patterns: { data: null, error: { message: 'pattern boom' } },
    });
    const adapter = createSupabaseIntelligenceCorpusReadAdapter(() => client);
    await expect(adapter.getCorpusBundle('c-1')).rejects.toMatchObject({
      message: 'pattern boom',
    });
  });
});

describe('azureIntelligenceCorpusReadAdapter', () => {
  it('resolves the Apex Retail client via `name = ANY`', async () => {
    const seen: { sql: string; params: unknown[] }[] = [];
    const session = fakeSession((sql, params) => {
      seen.push({ sql, params });
      return [{ id: 'c-1', name: 'Apex Retail Group', industry_code: 'RETAIL' }];
    });
    const adapter = createAzureIntelligenceCorpusReadAdapter(session);
    const row = await adapter.getApexRetailClient();

    expect(row).toEqual({ id: 'c-1', name: 'Apex Retail Group', industry_code: 'RETAIL' });
    expect(seen[0].sql).toContain('FROM clients');
    expect(seen[0].sql).toContain('name = ANY($1::text[])');
    expect(seen[0].params).toEqual([['Apex Retail', 'Apex Retail Group']]);
  });

  it('runs the five corpus SELECTs scoped by client_id where applicable', async () => {
    const seen: string[] = [];
    const session = fakeSession((sql) => {
      seen.push(sql);
      return [];
    });
    const adapter = createAzureIntelligenceCorpusReadAdapter(session);
    await adapter.getCorpusBundle('c-1');

    const joined = seen.join('\n');
    expect(joined).toContain('FROM genome_patterns');
    expect(joined).toContain('FROM knowledge_sources');
    expect(joined).toContain('FROM use_cases');
    expect(joined).toContain('FROM contradictions');
    expect(joined).toContain('FROM intelligence_graph_edges');
    expect(joined).toContain("external_id LIKE 'apex_retail_%'");
    expect(joined).toContain('resolved_at IS NULL');
  });
});
