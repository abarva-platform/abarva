/**
 * Tenant-key canonicalization regression watch.
 *
 * Connects to the live Postgres via DATABASE_URL and asserts that no
 * historical aliases (apexretail / meridian / arcturus) remain in any
 * mutable substrate column that was canonicalized in migration
 * `20260515120000_tenant_key_canonicalization.sql`.
 *
 * Historical `program_audit_log` rows are intentionally excluded: that table
 * is append-only, so canonicalization must preserve prior audit entries exactly
 * as written while future writes/read predicates normalize tenant keys.
 *
 * Usage:
 *   npx tsx scripts/verify-tenant-key-canonical.ts
 *
 * Exit codes:
 *   0  — every audited column is clean.
 *   1  — at least one alias remains. Stderr lists the offending tables.
 *   2  — connection error / missing DATABASE_URL.
 *
 * Designed for CI: cheap, reads-only, returns within seconds.
 */

import { Client } from 'pg';
import { config as loadEnv } from 'dotenv';
import path from 'node:path';

import { LEGACY_TENANT_ALIASES } from '../src/lib/tenant-keys';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
loadEnv();

type TableCheck = {
  schema: string;
  table: string;
  column: 'tenant_key' | 'client_key';
};

// Every column the canonicalization migration touched. Keep in lockstep
// with `supabase/migrations/20260515120000_tenant_key_canonicalization.sql`.
const TABLES: readonly TableCheck[] = [
  { schema: 'public', table: 'clients', column: 'tenant_key' },
  { schema: 'public', table: 'enterprise_context_chunks', column: 'tenant_key' },
  { schema: 'public', table: 'enterprise_context_chunk_queue', column: 'tenant_key' },
  { schema: 'public', table: 'enterprise_context_evidence', column: 'tenant_key' },
  { schema: 'public', table: 'enterprise_context_facts', column: 'tenant_key' },
  { schema: 'public', table: 'enterprise_context_quality_issues', column: 'tenant_key' },
  { schema: 'public', table: 'enterprise_context_records', column: 'tenant_key' },
  { schema: 'public', table: 'enterprise_context_relationships', column: 'tenant_key' },
  { schema: 'public', table: 'enterprise_context_snapshots', column: 'tenant_key' },
  { schema: 'public', table: 'enterprise_context_source_files', column: 'tenant_key' },
  { schema: 'public', table: 'enterprise_context_sources', column: 'tenant_key' },
  { schema: 'public', table: 'enterprise_context_stewardship_tasks', column: 'tenant_key' },
  { schema: 'public', table: 'enterprise_context_template_runs', column: 'tenant_key' },
  { schema: 'public', table: 'program_approval_requests', column: 'tenant_key' },
  { schema: 'public', table: 'program_attachments', column: 'tenant_key' },
  { schema: 'public', table: 'program_evidence_items', column: 'tenant_key' },
  { schema: 'public', table: 'source_artifacts', column: 'tenant_key' },
  { schema: 'public', table: 'source_event_artifact_states', column: 'tenant_key' },
  { schema: 'public', table: 'source_event_evidence_states', column: 'tenant_key' },
  { schema: 'public', table: 'source_event_gate_criterion_states', column: 'tenant_key' },
  { schema: 'public', table: 'source_event_participants', column: 'client_key' },
  { schema: 'public', table: 'source_events', column: 'client_key' },
  { schema: 'public', table: 'foundational_pattern_variants', column: 'tenant_key' },
];

type Finding = {
  table: string;
  column: string;
  alias: string;
  count: number;
};

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
    console.error(`verify-tenant-key-canonical: could not connect — ${err instanceof Error ? err.message : err}`);
    return 2;
  }

  const findings: Finding[] = [];

  // The `foundational_pattern_variants` table reuses 'apex' / 'first_capital'
  // / 'keystone' as a separate underscore-cased taxonomy that is NOT a
  // tenant alias. Only flag the literal 'meridian' value.
  for (const { schema, table, column } of TABLES) {
    const aliasesToCheck =
      table === 'foundational_pattern_variants' ? ['meridian'] : LEGACY_TENANT_ALIASES;

    let rows: { v: string | null; c: string }[] = [];
    try {
      const res = await client.query<{ v: string | null; c: string }>(
        `SELECT "${column}" AS v, COUNT(*)::text AS c
           FROM "${schema}"."${table}"
          WHERE "${column}" = ANY($1::text[])
          GROUP BY 1`,
        [aliasesToCheck],
      );
      rows = res.rows;
    } catch (err) {
      console.error(
        `verify-tenant-key-canonical: query failed for ${schema}.${table} — ${err instanceof Error ? err.message : err}`,
      );
      await client.end();
      return 2;
    }

    for (const row of rows) {
      const count = parseInt(row.c, 10);
      if (row.v && count > 0) {
        findings.push({ table: `${schema}.${table}`, column, alias: row.v, count });
      }
    }
  }

  await client.end();

  if (findings.length === 0) {
    console.log(`verify-tenant-key-canonical: clean (${TABLES.length} tables audited).`);
    return 0;
  }

  console.error(`verify-tenant-key-canonical: FOUND ${findings.length} non-canonical alias(es):`);
  for (const f of findings) {
    console.error(`  ${f.table}.${f.column}: alias=${f.alias} count=${f.count}`);
  }
  console.error('');
  console.error(
    'Re-run `npm run db:migrate` to re-apply the canonicalization migration, then re-run this check.',
  );
  return 1;
}

// Only execute when invoked as a script (not when imported by tests).
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

export { main, TABLES };
