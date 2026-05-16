// Unit tests for the VIP-profile read adapter (Slice 2 follow-up).
//
//   - default plane stays Supabase; Azure selectable explicitly / by env;
//   - the three diagnostic lookups (person_id / exact / fuzzy) map through;
//   - the fuzzy lookup is skipped when the name has < 2 tokens;
//   - a query failure degrades to nulls, never an unhandled throw —
//     matching the pre-seam route, which discarded Supabase errors.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { SessionRunner } from '../azureSession';
import {
  createAzureVipProfileReadAdapter,
  createSupabaseVipProfileReadAdapter,
  selectVipProfileReadAdapter,
  type VipProfileDiagnosticRow,
} from '../vipProfileReadAdapter';

function fakeSession(
  handler: (sql: string, params: unknown[]) => unknown[],
): SessionRunner {
  return async (fn) =>
    fn(async <R>(sql: string, params: unknown[]) => handler(sql, params) as R[]);
}

/**
 * A Supabase mock. Each `.from('vip_profiles')` chain ends in
 * `.maybeSingle()`; results are served in call order from `results`.
 */
function fakeSupabase(results: { data: unknown; error: unknown }[]): {
  client: SupabaseClient;
  calls: { method: string; args: unknown[] }[];
} {
  const calls: { method: string; args: unknown[] }[] = [];
  let callIndex = 0;
  function makeBuilder(): Record<string, unknown> {
    const builder: Record<string, unknown> = {};
    for (const m of ['select', 'eq', 'ilike']) {
      builder[m] = (...args: unknown[]) => {
        calls.push({ method: m, args });
        return builder;
      };
    }
    builder.maybeSingle = () =>
      Promise.resolve(results[callIndex++] ?? { data: null, error: null });
    return builder;
  }
  return {
    client: { from: () => makeBuilder() } as unknown as SupabaseClient,
    calls,
  };
}

const ROW: VipProfileDiagnosticRow = {
  id: 'vip-1',
  person_id: 'p-1',
  display_name: 'Prat Vemana',
  demo_tier: 'vip',
  current_title: 'CDIO',
  current_company: 'Meridian Health',
};

describe('selectVipProfileReadAdapter', () => {
  const original = process.env.ABARVA_DATA_PLANE;
  afterEach(() => {
    if (original === undefined) delete process.env.ABARVA_DATA_PLANE;
    else process.env.ABARVA_DATA_PLANE = original;
  });

  it('returns the Supabase adapter by default', () => {
    delete process.env.ABARVA_DATA_PLANE;
    expect(selectVipProfileReadAdapter().name).toBe('supabase');
  });

  it('returns the Azure adapter when ABARVA_DATA_PLANE=azure-postgres', () => {
    process.env.ABARVA_DATA_PLANE = 'azure-postgres';
    expect(selectVipProfileReadAdapter().name).toBe('azure-postgres');
  });

  it('honors an explicit plane argument over the env var', () => {
    process.env.ABARVA_DATA_PLANE = 'azure-postgres';
    expect(selectVipProfileReadAdapter('supabase').name).toBe('supabase');
  });
});

describe('supabaseVipProfileReadAdapter', () => {
  it('maps all three diagnostic lookups from query rows', async () => {
    const { client, calls } = fakeSupabase([
      { data: ROW, error: null },
      { data: { ...ROW, id: 'vip-2' }, error: null },
      { data: { ...ROW, id: 'vip-3' }, error: null },
    ]);
    const adapter = createSupabaseVipProfileReadAdapter(() => client);
    const lookup = await adapter.getVipProfileLookup('p-1', 'Prat Vemana');
    expect(lookup.by_person_id?.id).toBe('vip-1');
    expect(lookup.by_display_name_exact?.id).toBe('vip-2');
    expect(lookup.by_display_name_fuzzy?.id).toBe('vip-3');
    // person_id predicate + exact ilike + fuzzy ilike with wildcard.
    expect(calls.some((c) => c.method === 'eq' && c.args[0] === 'person_id')).toBe(true);
    expect(calls.some((c) => c.method === 'ilike' && c.args[1] === 'Prat Vemana')).toBe(true);
    expect(calls.some((c) => c.method === 'ilike' && c.args[1] === 'Prat%Vemana')).toBe(true);
  });

  it('skips the fuzzy lookup when the name has fewer than two tokens', async () => {
    const { client, calls } = fakeSupabase([
      { data: null, error: null },
      { data: null, error: null },
    ]);
    const adapter = createSupabaseVipProfileReadAdapter(() => client);
    const lookup = await adapter.getVipProfileLookup('p-1', 'Cher');
    expect(lookup.by_display_name_fuzzy).toBeNull();
    // Only the exact ilike ran — no wildcard fuzzy ilike.
    expect(calls.some((c) => c.method === 'ilike' && String(c.args[1]).includes('%'))).toBe(false);
  });

  it('yields nulls for lookups that returned no row', async () => {
    const { client } = fakeSupabase([
      { data: null, error: null },
      { data: null, error: null },
      { data: null, error: null },
    ]);
    const adapter = createSupabaseVipProfileReadAdapter(() => client);
    const lookup = await adapter.getVipProfileLookup('p-x', 'Ghost Person');
    expect(lookup).toEqual({
      by_person_id: null,
      by_display_name_exact: null,
      by_display_name_fuzzy: null,
    });
  });
});

describe('azureVipProfileReadAdapter', () => {
  it('runs person_id, exact and fuzzy lookups against vip_profiles', async () => {
    const seen: { sql: string; params: unknown[] }[] = [];
    const session = fakeSession((sql, params) => {
      seen.push({ sql, params });
      if (sql.includes('person_id = $1')) return [ROW];
      if (String(params[0]) === 'Prat Vemana') return [{ ...ROW, id: 'vip-2' }];
      if (String(params[0]) === 'Prat%Vemana') return [{ ...ROW, id: 'vip-3' }];
      return [];
    });
    const adapter = createAzureVipProfileReadAdapter(session);
    const lookup = await adapter.getVipProfileLookup('p-1', 'Prat Vemana');
    expect(lookup.by_person_id?.id).toBe('vip-1');
    expect(lookup.by_display_name_exact?.id).toBe('vip-2');
    expect(lookup.by_display_name_fuzzy?.id).toBe('vip-3');
    expect(seen.every((q) => q.sql.includes('FROM vip_profiles'))).toBe(true);
    expect(seen.every((q) => q.sql.includes('LIMIT 1'))).toBe(true);
  });

  it('skips the fuzzy query when the name has fewer than two tokens', async () => {
    const seen: unknown[][] = [];
    const adapter = createAzureVipProfileReadAdapter(
      fakeSession((_sql, params) => {
        seen.push(params);
        return [];
      }),
    );
    const lookup = await adapter.getVipProfileLookup('p-1', 'Cher');
    expect(lookup.by_display_name_fuzzy).toBeNull();
    // Two queries only: person_id + exact. No fuzzy wildcard param.
    expect(seen).toHaveLength(2);
    expect(seen.some((p) => String(p[0]).includes('%'))).toBe(false);
  });

  it('degrades to nulls (never throws) when the session fails', async () => {
    const session: SessionRunner = async () => {
      throw new Error('connection refused');
    };
    const adapter = createAzureVipProfileReadAdapter(session);
    const lookup = await adapter.getVipProfileLookup('p-1', 'Prat Vemana');
    expect(lookup).toEqual({
      by_person_id: null,
      by_display_name_exact: null,
      by_display_name_fuzzy: null,
    });
  });
});
