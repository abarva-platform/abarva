/**
 * Active tenant-key canonicalization regression watch.
 *
 * This verifier discovers active tenant columns dynamically instead of relying
 * on a hand-maintained table list. That matters because Home/Tower/semantic2
 * tables are added frequently; a static list can pass while new tables keep
 * stale aliases such as `skyharbor`, `morganstreet`, or `lakeshore`.
 *
 * Append-only audit/history rows are intentionally excluded. Product runtime,
 * retrieval, read-model, semantic, source, moves, and Tower rows are not.
 */

import path from 'node:path';

import { config as loadEnv } from 'dotenv';
import { Client } from 'pg';

import { LEGACY_TENANT_ALIASES } from '../src/lib/tenant-keys';

loadEnv({ path: '/Users/anand/Projects/nexus/.env.local', quiet: true });
loadEnv({ path: '/Users/anand/Projects/nexus/.env', quiet: true });
loadEnv({ path: path.resolve(process.cwd(), '.env.local'), quiet: true });
loadEnv({ path: path.resolve(process.cwd(), '.env'), quiet: true });

type TenantColumn = {
  schema: string;
  table: string;
  column: string;
};

type Finding = TenantColumn & {
  alias: string;
  count: number;
};

const TENANT_COLUMN_NAMES = ['tenant_key', 'client_key', 'tenant_client_key'] as const;

const EXCLUDED_TABLE_PATTERNS = [
  /(^|_)audit(_|$)/i,
  /(^|_)history$/i,
  /(^|_)log$/i,
  /^schema_migrations$/i,
  /^program_audit_log$/i,
  /^admin_audit_log$/i,
];

const NON_TENANT_TABLE_COLUMNS = new Set([
  'public.foundational_pattern_variants.tenant_key',
]);

function isExcluded(table: string): boolean {
  return EXCLUDED_TABLE_PATTERNS.some((pattern) => pattern.test(table));
}

function normalizeAlias(value: string): string {
  return value.trim().toLowerCase().replace(/_/g, '-');
}

async function discoverTenantColumns(client: Client): Promise<TenantColumn[]> {
  const result = await client.query<TenantColumn>(
    `
      SELECT table_schema AS schema, table_name AS table, column_name AS column
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND column_name = ANY($1::text[])
        AND data_type IN ('text', 'character varying', 'character')
      ORDER BY table_schema, table_name, column_name
    `,
    [TENANT_COLUMN_NAMES],
  );

  return result.rows.filter((row) => {
    if (isExcluded(row.table)) return false;
    return !NON_TENANT_TABLE_COLUMNS.has(`${row.schema}.${row.table}.${row.column}`);
  });
}

async function main(): Promise<number> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('verify-tenant-key-canonical: DATABASE_URL not set');
    return 2;
  }

  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
  } catch (err) {
    console.error(`verify-tenant-key-canonical: could not connect - ${err instanceof Error ? err.message : err}`);
    return 2;
  }

  const aliasesToCheck = Array.from(new Set(LEGACY_TENANT_ALIASES.map(normalizeAlias)));
  const findings: Finding[] = [];
  const columns = await discoverTenantColumns(client);

  for (const { schema, table, column } of columns) {
    let rows: { v: string | null; c: string }[] = [];
    try {
      const res = await client.query<{ v: string | null; c: string }>(
        `SELECT "${column}" AS v, COUNT(*)::text AS c
           FROM "${schema}"."${table}"
          WHERE lower(replace("${column}"::text, '_', '-')) = ANY($1::text[])
          GROUP BY 1`,
        [aliasesToCheck],
      );
      rows = res.rows;
    } catch (err) {
      console.error(
        `verify-tenant-key-canonical: query failed for ${schema}.${table} - ${err instanceof Error ? err.message : err}`,
      );
      await client.end();
      return 2;
    }

    for (const row of rows) {
      const count = Number.parseInt(row.c, 10);
      if (row.v && count > 0) {
        findings.push({ schema, table, column, alias: row.v, count });
      }
    }
  }

  await client.end();

  if (findings.length === 0) {
    console.log(`verify-tenant-key-canonical: clean (${columns.length} active tenant columns audited).`);
    return 0;
  }

  console.error(`verify-tenant-key-canonical: FOUND ${findings.length} persisted alias group(s):`);
  for (const f of findings) {
    console.error(`  ${f.schema}.${f.table}.${f.column}: alias=${f.alias} count=${f.count}`);
  }
  console.error('');
  console.error('Run `npx tsx scripts/tenant-canonical-cleanup.ts --apply`, then rerun this verifier.');
  return 1;
}

const invokedAsScript = (() => {
  if (!process.argv[1]) return false;
  try {
    return path.resolve(process.argv[1]).includes('verify-tenant-key-canonical');
  } catch {
    return false;
  }
})();

if (invokedAsScript) {
  main().then((code) => process.exit(code)).catch((err) => {
    console.error('verify-tenant-key-canonical: unexpected error', err);
    process.exit(2);
  });
}

export { discoverTenantColumns, main };
