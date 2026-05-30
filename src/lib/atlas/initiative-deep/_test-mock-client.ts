// Tiny PostgresCompatClient fake used by the deep-retrieval tests.
//
// Encodes per-tenant fixtures as a flat list of typed rows. Filters
// recorded via `.eq(col, val)` are accumulated and applied at the terminal
// resolver. This is enough to verify the P0 tenant-scoping invariant — every
// join MUST filter by `client_id` before it ever sees a row.

import type { PostgresCompatClient } from '@/lib/data-plane/postgresCompat';

type Row = Record<string, unknown>;

interface MockState {
  filters: Array<{ col: string; val: unknown }>;
  notFilters: Array<{ col: string; val: unknown }>;
  inFilters: Array<{ col: string; vals: unknown[] }>;
  orFilters: Array<Array<{ col: string; val: unknown }>>;
  limit: number | null;
  order: { col: string; ascending: boolean } | null;
}

function get(row: Row, dottedKey: string): unknown {
  if (!dottedKey.includes('->>')) return row[dottedKey];
  // Support `metadata->>foo` style PostgREST JSON path.
  const [base, key] = dottedKey.split('->>');
  const obj = row[base];
  if (obj && typeof obj === 'object') return (obj as Row)[key];
  return undefined;
}

function applyFilters(rows: Row[], state: MockState): Row[] {
  let out = rows.slice();
  for (const f of state.filters) {
    out = out.filter((r) => get(r, f.col) === f.val);
  }
  for (const f of state.notFilters) {
    out = out.filter((r) => get(r, f.col) !== f.val);
  }
  for (const f of state.inFilters) {
    out = out.filter((r) => f.vals.includes(get(r, f.col) as never));
  }
  for (const orGroup of state.orFilters) {
    out = out.filter((r) => orGroup.some((cond) => get(r, cond.col) === cond.val));
  }
  if (state.order) {
    const { col, ascending } = state.order;
    out.sort((a, b) => {
      const av = get(a, col);
      const bv = get(b, col);
      if (av === bv) return 0;
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      // Use lexicographic compare to be deterministic.
      const cmp = String(av) < String(bv) ? -1 : 1;
      return ascending ? cmp : -cmp;
    });
  }
  if (state.limit !== null) out = out.slice(0, state.limit);
  return out;
}

/**
 * Build a fake PostgresCompatClient seeded with rows by table name.
 *
 * Every `.from(table)` returns a chainable builder; the terminal `.maybeSingle()`,
 * `.single()`, or implicit `await` (via `.then()`) resolves to
 * `{ data, error: null }`. Filter chains are honored — `eq('client_id', X)`
 * means only rows with that client_id are returned. This is exactly the
 * behavior we need to verify the tenant-scoping invariant.
 */
export function mockClient(fixtures: Record<string, Row[]>): PostgresCompatClient {
  function buildFor(table: string) {
    const state: MockState = {
      filters: [],
      notFilters: [],
      inFilters: [],
      orFilters: [],
      limit: null,
      order: null,
    };
    const resolve = (single: boolean) => {
      const rows = applyFilters(fixtures[table] ?? [], state);
      if (single) return { data: rows[0] ?? null, error: null };
      return { data: rows, error: null };
    };

    const builder: Record<string, unknown> = {};
    builder.select = () => builder;
    builder.eq = (col: string, val: unknown) => {
      state.filters.push({ col, val });
      return builder;
    };
    builder.neq = (col: string, val: unknown) => {
      state.notFilters.push({ col, val });
      return builder;
    };
    builder.in = (col: string, vals: unknown[]) => {
      state.inFilters.push({ col, vals });
      return builder;
    };
    builder.or = (expr: string) => {
      // Parse a PostgREST-style OR expression like
      // `initiative_id.eq.AR-01,display_id.eq.AR-01`. We only need to
      // support `<col>.eq.<val>` clauses joined by commas — that's the
      // shape `loadInitiativeRow` emits.
      const clauses: Array<{ col: string; val: unknown }> = [];
      for (const raw of String(expr).split(',')) {
        const parts = raw.trim().split('.');
        if (parts.length < 3 || parts[1] !== 'eq') continue;
        clauses.push({ col: parts[0], val: parts.slice(2).join('.') });
      }
      if (clauses.length > 0) state.orFilters.push(clauses);
      return builder;
    };
    builder.is = () => builder;
    builder.order = (col: string, opts?: { ascending?: boolean }) => {
      state.order = { col, ascending: opts?.ascending !== false };
      return builder;
    };
    builder.limit = (n: number) => {
      state.limit = n;
      return builder;
    };
    builder.maybeSingle = () => Promise.resolve(resolve(true));
    builder.single = () => Promise.resolve(resolve(true));
    builder.then = (onFulfilled: (v: unknown) => unknown) =>
      Promise.resolve(resolve(false)).then(onFulfilled);
    return builder;
  }

  return {
    from(table: string) {
      return buildFor(table);
    },
  } as unknown as PostgresCompatClient;
}
