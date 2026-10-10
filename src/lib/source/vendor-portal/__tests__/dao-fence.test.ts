export {};

import { readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * The vendor portal's data fence, enforced against the module rather than
 * described in a comment above it.
 *
 * `dao.ts` opens with a security note: a vendor has no tenant session, so
 * nothing in the module may lean on ambient scoping, and every read and write
 * is bounded explicitly. That note is correct and the module currently honours
 * it. Nothing enforced it.
 *
 * RLS cannot. A competing vendor has no database identity, so their requests
 * are served over the write connection as `service_role`, which the portal's
 * RLS migration grants in full - by necessity, since the application is the
 * only thing that can tell two vendors apart. Row-level security on these
 * tables fences an authenticated reader in tenant A out of tenant B; it does
 * nothing about vendor-to-vendor. **This file is that fence.**
 *
 * The rule: every statement in `dao.ts` that addresses a portal table must
 * carry at least one of the three bounds below. A fourth kind of bound is not
 * a thing to add quietly - it is a decision, and this test is where it gets
 * written down.
 */

const DAO = path.join(process.cwd(), 'src/lib/source/vendor-portal/dao.ts');

/** The four tables the portal migration creates. */
const PORTAL_TABLES = [
  'source_event_vendors',
  'source_event_vendor_sessions',
  'source_event_vendor_events',
  'source_event_vendor_submissions',
] as const;

/**
 * The bounds a portal statement may rely on.
 *
 * - `vendor_id` / `.eq('id', ...)`: the vendor is known, and it came from a
 *   verified session rather than from the request.
 * - `session_token_hash`: the caller holds the token itself, which is the
 *   bearer secret; the row it addresses is the one it proves it owns.
 * - `source_event_id` WITH `username`: sign-in, the one path where no vendor
 *   is yet known. Scoped to one solicitation and gated by a password check.
 */
const BOUNDS = [
  /\bvendor_id\s*=\s*\$\d/,
  /\bvendor_id\b\s*:/,
  /\.eq\(\s*'id'\s*,/,
  /\bv\.id\s*=\s*s\.vendor_id\b/,
  /\bsession_token_hash\b/,
  /\bsource_event_id\s*=\s*\$\d[\s\S]{0,80}?\busername\s*=\s*\$\d/,
];

/**
 * Statement-shaped slices of the module: each SQL template literal, and each
 * fluent chain from `.from(` to the end of its statement.
 *
 * Slicing matters. A whole-file match would be satisfied by any bound anywhere
 * in the module, so a brand-new unscoped query would pass on a neighbour's
 * predicate - the failure this test exists to prevent.
 */
function statementSlices(source: string): { slice: string; at: number }[] {
  const out: { slice: string; at: number }[] = [];

  for (const match of source.matchAll(/`([^`]*(?:SELECT|UPDATE|INSERT|DELETE)[^`]*)`/gi)) {
    out.push({ slice: match[1], at: match.index ?? 0 });
  }

  for (const match of source.matchAll(/\.from\(\s*'([a-z_]+)'\s*\)/g)) {
    const start = match.index ?? 0;
    const rest = source.slice(start, start + 600);
    // A fluent statement ends at the first semicolon that closes the await.
    const end = rest.indexOf(';');
    out.push({ slice: rest.slice(0, end === -1 ? rest.length : end), at: start });
  }

  return out;
}

function addressesPortalTable(slice: string): boolean {
  return PORTAL_TABLES.some((table) => slice.includes(table));
}

function lineOf(source: string, index: number): number {
  return source.slice(0, index).split('\n').length;
}

describe('vendor portal data fence', () => {
  const source = readFileSync(DAO, 'utf8');

  it('finds the statements it claims to check', () => {
    /*
     * The instrument first. A slicer that matched nothing would make every
     * assertion below vacuously true, which is the failure mode of a
     * source-reading guard and is invisible in a green run.
     */
    const slices = statementSlices(source).filter((s) => addressesPortalTable(s.slice));

    expect(slices.length).toBeGreaterThanOrEqual(7);
    for (const table of PORTAL_TABLES) {
      expect(slices.some((s) => s.slice.includes(table))).toBe(true);
    }
  });

  it('bounds every statement that addresses a portal table', () => {
    const unbounded: string[] = [];

    for (const { slice, at } of statementSlices(source)) {
      if (!addressesPortalTable(slice)) continue;
      if (BOUNDS.some((bound) => bound.test(slice))) continue;
      unbounded.push(
        `dao.ts:${lineOf(source, at)} — ${slice.replace(/\s+/g, ' ').trim().slice(0, 120)}`,
      );
    }

    expect(unbounded).toEqual([]);
  });

  it('resolves a vendor identity only from a session token joined to one event', () => {
    /*
     * The session resolver is the only path by which a request becomes a vendor
     * identity, so its own bound is asserted directly rather than through the
     * sweep: the session row must be joined to a vendor on the SAME event, or a
     * token minted for one solicitation would resolve on another.
     */
    const resolver = source.slice(
      source.indexOf('export async function resolveVendorBySession'),
      source.indexOf('export async function createSession'),
    );

    expect(resolver).not.toBe('');
    expect(resolver).toMatch(/\bs\.session_token_hash\s*=\s*\$1/);
    expect(resolver).toMatch(/\bv\.source_event_id\s*=\s*\$2/);
    expect(resolver).toMatch(/\bJOIN source_event_vendors v ON v\.id = s\.vendor_id\b/);
  });

  it('takes the vendor id from the session row, never from the request', () => {
    const resolver = source.slice(
      source.indexOf('export async function resolveVendorBySession'),
      source.indexOf('export async function createSession'),
    );

    // The function's two parameters are the event id and the raw token. Neither
    // is a vendor id, and no vendor id may be accepted alongside them.
    expect(resolver).toMatch(/resolveVendorBySession\(\s*sourceEventId: string,\s*sessionToken: string,?\s*\)/);
    expect(resolver).not.toMatch(/vendorId\s*:\s*string/);
  });
});

/**
 * Blank SQL comments, preserving length so a reported offset still points at
 * real SQL.
 *
 * This exists because a mutation found the hole. The first version of the
 * assertions below matched the raw file, so commenting out an
 * `ENABLE ROW LEVEL SECURITY` statement left the asserted substring present
 * inside the comment and the guard passed a migration with RLS switched off.
 * A guard over SQL that does not strip comments asserts nothing about SQL.
 */
function stripSqlComments(sql: string): string {
  let out = '';
  let index = 0;
  let inSingle = false;
  let inDollar = false;

  while (index < sql.length) {
    const two = sql.slice(index, index + 2);

    if (!inSingle && !inDollar && two === '$$') {
      inDollar = true;
      out += two;
      index += 2;
      continue;
    }
    if (inDollar && two === '$$') {
      inDollar = false;
      out += two;
      index += 2;
      continue;
    }
    if (!inDollar && sql[index] === "'") {
      inSingle = !inSingle;
      out += sql[index];
      index += 1;
      continue;
    }
    if (!inSingle && !inDollar && two === '--') {
      // Blank to end of line, keeping the newline and the character count.
      const end = sql.indexOf('\n', index);
      const stop = end === -1 ? sql.length : end;
      out += ' '.repeat(stop - index);
      index = stop;
      continue;
    }
    if (!inSingle && !inDollar && two === '/*') {
      const end = sql.indexOf('*/', index + 2);
      const stop = end === -1 ? sql.length : end + 2;
      for (let i = index; i < stop; i += 1) out += sql[i] === '\n' ? '\n' : ' ';
      index = stop;
      continue;
    }

    out += sql[index];
    index += 1;
  }

  return out;
}

describe('stripSqlComments', () => {
  it('blanks a line comment and keeps the statement beside it', () => {
    const stripped = stripSqlComments("-- gone\nALTER TABLE t ENABLE ROW LEVEL SECURITY;");

    expect(stripped).not.toContain('gone');
    expect(stripped).toContain('ALTER TABLE t ENABLE ROW LEVEL SECURITY;');
  });

  it('blanks a commented-out statement, which is the bug it was written for', () => {
    expect(
      stripSqlComments('-- ALTER TABLE t ENABLE ROW LEVEL SECURITY;'),
    ).not.toContain('ALTER TABLE t ENABLE ROW LEVEL SECURITY;');
  });

  it('leaves a double dash inside a string literal alone', () => {
    const stripped = stripSqlComments("SELECT '--not a comment' AS a, 1 AS b;");

    expect(stripped).toContain("'--not a comment'");
    expect(stripped).toContain('1 AS b;');
  });

  it('blanks a block comment', () => {
    const stripped = stripSqlComments('/* gone */ SELECT 1;');

    expect(stripped).not.toContain('gone');
    expect(stripped).toContain('SELECT 1;');
  });

  it('preserves length so a reported offset still lands on real SQL', () => {
    const raw = '-- a comment\nSELECT 1;';

    expect(stripSqlComments(raw)).toHaveLength(raw.length);
  });
});

describe('vendor portal row-level security', () => {
  const RLS = path.join(
    process.cwd(),
    'supabase/migrations/20261008120000_source_vendor_rfp_portal_rls.sql',
  );
  const sql = stripSqlComments(readFileSync(RLS, 'utf8'));

  it('enables row-level security on every portal table', () => {
    for (const table of PORTAL_TABLES) {
      expect(sql).toContain(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`);
    }
  });

  it('gives the application role full access on every portal table, because the vendor has no database identity', () => {
    for (const table of PORTAL_TABLES) {
      expect(sql).toMatch(
        new RegExp(`CREATE POLICY "service_role_full_${table}"[\\s\\S]*?FOR ALL TO service_role`),
      );
    }
  });

  it('scopes every tenant read policy by the tenant key and its event', () => {
    const policies = [...sql.matchAll(/CREATE POLICY "tenant_read_([a-z_]+)"([\s\S]*?);/g)];

    // Credentials and session tokens get no tenant policy at all; activity and
    // submissions get one. Assert the count so a policy appearing on a secret
    // table later fails here.
    expect(policies.map((m) => m[1])).toEqual([
      'source_event_vendor_events',
      'source_event_vendor_submissions',
    ]);

    for (const [, table, body] of policies) {
      expect(body).toContain('FOR SELECT TO authenticated');
      expect(body).toMatch(/can_read_tenant_by_key\(\s*tenant_key\s*\)/);
    }

    /*
     * Both policies must also tie the row to its event's own key, so a row
     * whose denormalised `tenant_key` disagrees with its event is readable by
     * neither tenant. They do it differently and the difference is forced:
     *
     * - submissions carries `source_event_id`, so the check is inline.
     * - activity reaches its event only through `source_event_vendors`, and a
     *   policy's USING clause runs with the CALLER's privileges. `authenticated`
     *   must never hold SELECT on that table - every row is a credential - so
     *   an inline subquery is unsatisfiable and raises permission denied for
     *   every reader. It goes through a SECURITY DEFINER function instead.
     *
     * Asserted per policy rather than as one alternation, so dropping the check
     * from either cannot be covered by the other.
     */
    const [[, , activity], [, , submissions]] = policies;

    expect(activity).toMatch(
      /vendor_portal_activity_in_tenant\(\s*source_event_vendor_events\.vendor_id,\s*source_event_vendor_events\.tenant_key\s*\)/,
    );
    expect(submissions).toMatch(
      /se\.client_key\s*=\s*source_event_vendor_submissions\.tenant_key/,
    );

    expect(policies.length).toBe(2);
  });

  it('pins the search_path on the definer-rights check and keeps it off PUBLIC', () => {
    /*
     * A SECURITY DEFINER function without a pinned search_path is hijackable:
     * a caller who can create a schema earlier in the path substitutes their
     * own `source_event_vendors`. And a definer function granted to PUBLIC is
     * callable by any role, including one the policy never contemplated.
     */
    expect(sql).toMatch(
      /CREATE OR REPLACE FUNCTION vendor_portal_activity_in_tenant\(/,
    );
    expect(sql).toMatch(
      /LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp;/,
    );
    expect(sql).toMatch(
      /REVOKE ALL ON FUNCTION vendor_portal_activity_in_tenant\(UUID, TEXT\) FROM PUBLIC;/,
    );
  });

  it('returns a boolean from the definer check, so it discloses no row', () => {
    const fn = sql.slice(
      sql.indexOf('CREATE OR REPLACE FUNCTION vendor_portal_activity_in_tenant'),
      sql.indexOf('REVOKE ALL ON FUNCTION vendor_portal_activity_in_tenant'),
    );

    expect(fn).toMatch(/RETURNS BOOLEAN/);
    expect(fn).toMatch(/SELECT EXISTS \(/);
    // No column of the credential table may be projected out of it.
    expect(fn).not.toMatch(/\bpassword_hash\b|\bpassword_salt\b|\busername\b/);
  });

  it("grants no authenticated read on the tables whose rows are secrets", () => {
    expect(sql).not.toMatch(/GRANT SELECT ON source_event_vendors TO authenticated/);
    expect(sql).not.toMatch(
      /GRANT SELECT ON source_event_vendor_sessions TO authenticated/,
    );
    expect(sql).toContain('GRANT SELECT ON source_event_vendor_events TO authenticated;');
    expect(sql).toContain(
      'GRANT SELECT ON source_event_vendor_submissions TO authenticated;',
    );
  });
});
