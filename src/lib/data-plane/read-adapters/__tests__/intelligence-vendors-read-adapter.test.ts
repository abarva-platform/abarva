// Unit tests for the Intelligence vendors read adapter (Slice 4).
//
//   - default plane stays Supabase; Azure selectable explicitly / by env;
//   - the Supabase adapter runs the `ai_initiative_vendors` join filtered
//     by `ai_initiatives.client_id` and renames the embed to `initiative`;
//   - a Supabase error throws with the pre-seam `getVendorsForClient:` prefix;
//   - the Azure adapter runs the equivalent INNER JOIN and maps the flat
//     `i_*` projection back into the shared `initiative` shape.

import type { PostgresCompatClient as SupabaseClient } from '@/lib/supabase-server';
import type { SessionRunner } from '../azureSession';
import {
  createAzureIntelligenceVendorsReadAdapter,
  createSupabaseIntelligenceVendorsReadAdapter,
  selectIntelligenceVendorsReadAdapter,
} from '../intelligenceVendorsReadAdapter';

function fakeSession(
  handler: (sql: string, params: unknown[]) => unknown[],
): SessionRunner {
  return async (fn) =>
    fn(async <R>(sql: string, params: unknown[]) => handler(sql, params) as R[]);
}

/**
 * A Supabase mock. The `.from('ai_initiative_vendors')` chain ends in
 * `.eq(...)`, which resolves to the configured `{ data, error }`.
 */
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
    return Promise.resolve(result);
  };
  return {
    client: { from: () => builder } as unknown as SupabaseClient,
    calls,
  };
}

const SUPABASE_ROW = {
  vendor_id: 'v-1',
  initiative_id: 'init-1',
  vendor_name: 'Microsoft 365 Copilot',
  contract_value_usd: 120000,
  renewal_date: '2026-12-01',
  financial_health: 'strong',
  notes: 'enterprise tier',
  ai_initiatives: {
    initiative_id: 'init-1',
    display_id: 'AI-001',
    name: 'Contact Center AI',
    status_flag: 'on_track',
    stage: 'pilot',
    client_id: 'client-apex',
  },
};

describe('selectIntelligenceVendorsReadAdapter', () => {
  const original = process.env.ABARVA_DATA_PLANE;
  afterEach(() => {
    if (original === undefined) delete process.env.ABARVA_DATA_PLANE;
    else process.env.ABARVA_DATA_PLANE = original;
  });

  it('returns the Supabase adapter by default', () => {
    delete process.env.ABARVA_DATA_PLANE;
    expect(selectIntelligenceVendorsReadAdapter().name).toBe('supabase');
  });

  it('returns the Azure adapter when ABARVA_DATA_PLANE=azure-postgres', () => {
    process.env.ABARVA_DATA_PLANE = 'azure-postgres';
    expect(selectIntelligenceVendorsReadAdapter().name).toBe('azure-postgres');
  });

  it('honors an explicit plane argument over the env var', () => {
    process.env.ABARVA_DATA_PLANE = 'azure-postgres';
    expect(selectIntelligenceVendorsReadAdapter('supabase').name).toBe('supabase');
  });
});

describe('supabaseIntelligenceVendorsReadAdapter', () => {
  it('reads the vendor join filtered by ai_initiatives.client_id', async () => {
    const { client, calls } = fakeSupabase({ data: [SUPABASE_ROW], error: null });
    const adapter = createSupabaseIntelligenceVendorsReadAdapter(() => client);
    const rows = await adapter.getVendorRowsForClient('client-apex');

    expect(rows).toHaveLength(1);
    // The PostgREST embed key is renamed to the neutral `initiative` field.
    expect(rows[0].initiative?.initiative_id).toBe('init-1');
    expect(rows[0].vendor_name).toBe('Microsoft 365 Copilot');
    expect(rows[0].contract_value_usd).toBe(120000);
    expect(
      calls.some(
        (c) => c.method === 'eq' && c.args[0] === 'ai_initiatives.client_id'
          && c.args[1] === 'client-apex',
      ),
    ).toBe(true);
  });

  it('returns an empty array when the query yields no rows', async () => {
    const { client } = fakeSupabase({ data: null, error: null });
    const adapter = createSupabaseIntelligenceVendorsReadAdapter(() => client);
    expect(await adapter.getVendorRowsForClient('client-empty')).toEqual([]);
  });

  it('throws with the pre-seam getVendorsForClient prefix on a query error', async () => {
    const { client } = fakeSupabase({ data: null, error: { message: 'boom' } });
    const adapter = createSupabaseIntelligenceVendorsReadAdapter(() => client);
    await expect(adapter.getVendorRowsForClient('client-apex')).rejects.toThrow(
      'getVendorsForClient: boom',
    );
  });
});

describe('azureIntelligenceVendorsReadAdapter', () => {
  it('runs an INNER JOIN filtered by client_id and maps the i_* projection', async () => {
    const seen: { sql: string; params: unknown[] }[] = [];
    const session = fakeSession((sql, params) => {
      seen.push({ sql, params });
      return [
        {
          vendor_id: 'v-1',
          initiative_id: 'init-1',
          vendor_name: 'Microsoft 365 Copilot',
          contract_value_usd: 120000,
          renewal_date: '2026-12-01',
          financial_health: 'strong',
          notes: 'enterprise tier',
          i_initiative_id: 'init-1',
          i_display_id: 'AI-001',
          i_name: 'Contact Center AI',
          i_status_flag: 'on_track',
          i_stage: 'pilot',
          i_client_id: 'client-apex',
        },
      ];
    });
    const adapter = createAzureIntelligenceVendorsReadAdapter(session);
    const rows = await adapter.getVendorRowsForClient('client-apex');

    expect(rows).toHaveLength(1);
    expect(rows[0].initiative).toEqual({
      initiative_id: 'init-1',
      display_id: 'AI-001',
      name: 'Contact Center AI',
      status_flag: 'on_track',
      stage: 'pilot',
      client_id: 'client-apex',
    });
    expect(seen[0].sql).toContain('INNER JOIN ai_initiatives');
    expect(seen[0].sql).toContain('WHERE i.client_id = $1');
    expect(seen[0].params).toEqual(['client-apex']);
  });

  it('returns an empty array when the join yields no rows', async () => {
    const adapter = createAzureIntelligenceVendorsReadAdapter(fakeSession(() => []));
    expect(await adapter.getVendorRowsForClient('client-empty')).toEqual([]);
  });
});
