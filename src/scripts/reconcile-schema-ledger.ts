import { Client } from 'pg';
import fs from 'node:fs';
import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { postgresClientOptions } from './postgres-client-options';
import { resolveMigrationDatabaseUrl } from './run-migrations';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
loadEnv();

/**
 * Does the database contain what the ledger says was applied?
 *
 * READ-ONLY. This script issues no DDL and no writes.
 *
 * WHY THIS EXISTS. `schema_migrations` is the record of what ran, and a
 * migration apply failed on 2026-10-10 because `source_event_pricing_submissions`
 * was absent from the live database — while the ledger recorded its creating
 * migration as applied on 2026-05-15. The ledger over-claimed.
 *
 * It can over-claim for a whole class of rows: `run-migrations.ts` supports
 * `--mark-all-applied`, which records a migration as applied WITHOUT running
 * it, and such rows carry `sha256: null`. 267 of the 415 ledger rows carry a
 * null hash, 151 of them stamped the same day. For those rows the ledger is a
 * claim, not evidence.
 *
 * So "apply the pending migrations and see what breaks" is the wrong move: each
 * attempt is a failed transaction against the live database, discovered one
 * object at a time, and the failing run produces no post-failure readback. This
 * turns that unknown into a list, before anything mutates.
 *
 * WHAT IT CHECKS, and what it does not. For every migration the ledger claims,
 * it reads that file's top-level `CREATE TABLE` names and asks the catalog
 * whether each relation exists. It deliberately does NOT try to verify columns,
 * constraints, policies or functions: a table that exists with the wrong shape
 * is a different and harder question, and a check that silently covers less
 * than it appears to is worse than one with a stated boundary. A clean result
 * here means "every table the ledger implies is present", not "the schema
 * matches the migrations".
 */

/** Tables a migration file creates, read from its own DDL. */
export function createdTables(sql: string): string[] {
  const stripped = stripSqlComments(sql);
  const names = new Set<string>();
  const re =
    /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)?)/gi;
  for (const match of stripped.matchAll(re)) names.add(match[1]);
  return [...names];
}

/**
 * Blank SQL comments, preserving length.
 *
 * Without this, a commented-out `CREATE TABLE` in a migration's header counts
 * as a table the file creates, and the reconciliation reports a missing table
 * that was never meant to exist. A guard over SQL that does not strip comments
 * is reading prose as DDL.
 */
export function stripSqlComments(sql: string): string {
  let out = '';
  let index = 0;
  let inSingle = false;
  let inDollar = false;
  while (index < sql.length) {
    const two = sql.slice(index, index + 2);
    if (!inSingle && two === '$$') {
      inDollar = !inDollar;
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

const MIGRATIONS_DIR = path.resolve(process.cwd(), 'supabase/migrations');

async function main() {
  const url = resolveMigrationDatabaseUrl();
  if (!url) {
    console.error('x No migration database URL in environment');
    process.exit(1);
  }

  const client = new Client(postgresClientOptions(url, 'reconcile-schema-ledger'));
  await client.connect();
  try {
    const ledger = await client.query<{ name: string; sha256: string | null }>(
      'SELECT name, sha256 FROM schema_migrations ORDER BY name',
    );

    const present = new Set<string>();
    const relations = await client.query<{ schemaname: string; tablename: string }>(
      `SELECT schemaname, tablename FROM pg_tables
        WHERE schemaname NOT IN ('pg_catalog','information_schema')`,
    );
    for (const row of relations.rows) {
      present.add(`${row.schemaname}.${row.tablename}`);
      if (row.schemaname === 'public') present.add(row.tablename);
    }

    const missing: {
      migration: string;
      hashed: boolean;
      tables: string[];
    }[] = [];
    let checkedMigrations = 0;
    let checkedTables = 0;

    for (const entry of ledger.rows) {
      const file = path.join(MIGRATIONS_DIR, entry.name);
      let sql: string;
      try {
        sql = fs.readFileSync(file, 'utf8');
      } catch {
        // The file is gone from the tree. Not drift in the sense this script
        // reports; `run-migrations.ts` already tolerates it deliberately.
        continue;
      }
      checkedMigrations += 1;
      const tables = createdTables(sql);
      checkedTables += tables.length;
      const absent = tables.filter((t) => !present.has(t));
      if (absent.length > 0) {
        missing.push({
          migration: entry.name,
          hashed: entry.sha256 !== null,
          tables: absent,
        });
      }
    }

    const nullHashed = ledger.rows.filter((r) => r.sha256 === null).length;
    const payload = {
      ledgerRows: ledger.rows.length,
      ledgerRowsWithoutHash: nullHashed,
      migrationsChecked: checkedMigrations,
      tablesChecked: checkedTables,
      tablesPresent: present.size,
      migrationsWithMissingTables: missing.length,
      missing,
    };

    console.log('');
    console.log(`ledger rows                  ${payload.ledgerRows}`);
    console.log(`  without a recorded hash    ${payload.ledgerRowsWithoutHash}  (the ledger is a claim, not evidence, for these)`);
    console.log(`migrations checked           ${payload.migrationsChecked}`);
    console.log(`tables the ledger implies    ${payload.tablesChecked}`);
    console.log(`migrations missing a table   ${payload.migrationsWithMissingTables}`);
    for (const row of missing) {
      console.log(`  ${row.migration}  hashed=${row.hashed}  missing: ${row.tables.join(', ')}`);
    }
    console.log('');
    console.log('__SCHEMA_LEDGER_RECONCILE_BEGIN__');
    console.log(JSON.stringify(payload));
    console.log('__SCHEMA_LEDGER_RECONCILE_END__');

    // Read-only: reporting a gap is the job. Exit non-zero so a workflow step
    // cannot record a reconciliation that found holes as a clean run.
    process.exitCode = missing.length > 0 ? 1 : 0;
  } finally {
    await client.end();
  }
}

if (process.argv[1] && process.argv[1].includes('reconcile-schema-ledger')) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
