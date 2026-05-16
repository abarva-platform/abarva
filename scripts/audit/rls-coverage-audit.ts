/**
 * RLS coverage audit (SELECT-only).
 *
 * Reuses the tenant-scoped-table discovery query from
 * tests/security/rls-regression.sql, but instead of probing for leaks it
 * reports the *coverage gap*: every public.* table that carries a tenant
 * identity column (tenant_key / client_key / client_id) yet has either
 *   - RLS not enabled (pg_class.relrowsecurity = false), or
 *   - RLS enabled but zero policies attached.
 *
 * Output: a JSON + table summary. 100% read-only. Safe against production.
 *
 * Run:  npx tsx scripts/audit/rls-coverage-audit.ts
 *   or  DATABASE_URL='postgres://…' npx tsx scripts/audit/rls-coverage-audit.ts
 *
 * .env.local is loaded from the repo root (and CWD) the same way
 * src/scripts/verify-azure-postgres-schema.ts does.
 */
import { Client } from 'pg';
import path from 'node:path';
import fs from 'node:fs';
import { config as loadEnv } from 'dotenv';

// Walk up from CWD to find the repo root that owns .env.local. Worktrees do
// not carry their own .env.local, so we resolve it from the primary checkout.
function findEnvLocal(start: string): string | null {
  let dir = start;
  for (let i = 0; i < 8; i += 1) {
    const candidate = path.join(dir, '.env.local');
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

const envLocal =
  findEnvLocal(process.cwd()) ??
  // Fall back to the canonical Nexus checkout if the worktree chain misses it.
  ['/Users/anand/Projects/nexus/.env.local'].find((p) => fs.existsSync(p)) ??
  null;

if (envLocal) loadEnv({ path: envLocal });
loadEnv();

function sslConfig(connectionString: string) {
  try {
    const url = new URL(connectionString);
    const sslMode = url.searchParams.get('sslmode')?.toLowerCase();
    if (sslMode === 'disable') return false;
    if (['localhost', '127.0.0.1', '::1'].includes(url.hostname)) return false;
  } catch {
    /* ignore — fall through to default SSL */
  }
  return { rejectUnauthorized: false } as const;
}

// Mirrors the exclusion list in tests/security/rls-regression.sql — tables
// that intentionally cross tenants and must NOT get a tenant-scoped policy.
const INTENTIONAL_EXCLUSIONS = new Set<string>([
  'clients',
  'schema_migrations',
  'foundational_pattern_variants',
]);

interface GapRow {
  table_name: string;
  tenant_col: string;
  rls_enabled: boolean;
  policy_count: number;
  approx_rows: number;
}

const DISCOVERY_SQL = `
  SELECT
    c.relname AS table_name,
    cols.column_name AS tenant_col,
    c.relrowsecurity AS rls_enabled,
    COALESCE((
      SELECT COUNT(*)::int FROM pg_policies p
       WHERE p.tablename = c.relname AND p.schemaname = 'public'
    ), 0) AS policy_count
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
  JOIN LATERAL (
    SELECT column_name
      FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = c.relname
       AND column_name IN ('tenant_key', 'client_key', 'client_id')
     ORDER BY array_position(
       ARRAY['tenant_key','client_key','client_id']::text[], column_name)
     LIMIT 1
  ) cols ON TRUE
  WHERE c.relkind = 'r'
  ORDER BY c.relname;
`;

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('x DATABASE_URL is required (looked in .env.local + env).');
    process.exit(1);
  }

  const client = new Client({
    connectionString: url,
    application_name: 'rls-coverage-audit',
    ssl: sslConfig(url),
  });
  await client.connect();

  try {
    const { rows } = await client.query<{
      table_name: string;
      tenant_col: string;
      rls_enabled: boolean;
      policy_count: number;
    }>(DISCOVERY_SQL);

    const gaps: GapRow[] = [];
    for (const r of rows) {
      if (INTENTIONAL_EXCLUSIONS.has(r.table_name)) continue;
      const hasGap = !r.rls_enabled || r.policy_count === 0;
      if (!hasGap) continue;

      // Best-effort row count (service_role connection bypasses RLS). Used
      // only to grade criticality: real tenant data vs empty/staging.
      let approxRows = -1;
      try {
        const cnt = await client.query<{ n: string }>(
          `SELECT COUNT(*)::text AS n FROM public.${quoteIdent(r.table_name)}`,
        );
        approxRows = Number(cnt.rows[0]?.n ?? '-1');
      } catch {
        approxRows = -1;
      }

      gaps.push({
        table_name: r.table_name,
        tenant_col: r.tenant_col,
        rls_enabled: r.rls_enabled,
        policy_count: r.policy_count,
        approx_rows: approxRows,
      });
    }

    const summary = {
      generated_at: new Date().toISOString(),
      tenant_scoped_tables_scanned: rows.length,
      excluded_intentional: rows.filter((r) =>
        INTENTIONAL_EXCLUSIONS.has(r.table_name),
      ).length,
      gap_count: gaps.length,
      high_criticality: gaps.filter((g) => g.approx_rows > 0).length,
      low_criticality: gaps.filter((g) => g.approx_rows <= 0).length,
      gaps,
    };

    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await client.end();
  }
}

// Conservative identifier quote — table names come from pg_class so they are
// already valid, but we double any embedded quote defensively.
function quoteIdent(ident: string): string {
  return `"${ident.replace(/"/g, '""')}"`;
}

main().catch((error) => {
  console.error('x RLS coverage audit failed.');
  console.error(error);
  process.exit(1);
});
