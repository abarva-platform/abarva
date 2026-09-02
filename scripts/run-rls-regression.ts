/**
 * L4 RLS regression runner.
 *
 * Executes tests/security/rls-regression.sql against the database referenced
 * by DATABASE_URL, streams every RAISE NOTICE to stdout, and exits non-zero
 * if the SQL throws (i.e. if any tenant-scoped table leaks rows across the
 * RLS boundary).
 *
 * Usage:
 *   npm run test:rls-regression
 *   DATABASE_URL=postgresql://... npm run test:rls-regression
 *
 * Exit codes:
 *   0 - every tenant x table probe was 'pass' or 'empty'.
 *   1 - at least one probe was 'leak' or 'error:*' (the SQL block raised).
 *   2 - connection/runtime error, or a suite precondition was not met.
 *
 * Reads-only. Wraps the SQL in a transaction; the SQL itself only creates
 * TEMP tables and runs SELECTs. Safe against any environment including prod.
 */

import { Client } from 'pg';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { CANONICAL_TENANT_KEYS } from '../src/config/tenants/CANONICAL_TENANTS';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
loadEnv();

const SQL_PATH = path.resolve(process.cwd(), 'tests/security/rls-regression.sql');
const EXPECTED_TENANTS = [...CANONICAL_TENANT_KEYS];

function fail(code: number, msg: string): never {
  process.stderr.write(`${msg}\n`);
  process.exit(code);
}

function isNotCheckedPrecondition(message: string): boolean {
  return (
    /Canonical tenant\(s\) .* missing from clients table/.test(message) ||
    /RLS regression expected tenants were not supplied/.test(message)
  );
}

/** Redact the password from a Postgres URL for logging. */
function maskUrl(url: string): string {
  try {
    const u = new URL(url);
    if (u.password) u.password = '***';
    return u.toString();
  } catch {
    return '<unparseable DATABASE_URL>';
  }
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    fail(2, 'DATABASE_URL is required. Set in .env.local or environment.');
  }

  let sql: string;
  try {
    sql = readFileSync(SQL_PATH, 'utf8');
  } catch (err) {
    fail(2, `Cannot read ${SQL_PATH}: ${(err as Error).message}`);
  }

  // Strip any psql meta-commands; the pg driver doesn't understand them.
  sql = sql.replace(/^\s*\\[a-zA-Z_]+[^\n]*\n/gm, '');

  const client = new Client({
    connectionString: databaseUrl,
    application_name: 'rls-regression-l4',
  });

  // Stream NOTICEs back to stdout in real time. The SQL emits per-finding
  // notices plus a final summary table.
  client.on('notice', (notice: { message?: string } | string) => {
    const text =
      typeof notice === 'string' ? notice : notice.message ?? String(notice);
    process.stdout.write(`${text}\n`);
  });

  const started = Date.now();
  try {
    await client.connect();
  } catch (err) {
    fail(2, `Failed to connect: ${(err as Error).message}`);
  }

  try {
    process.stdout.write(`rls-regression: running against ${maskUrl(databaseUrl)}\n`);
    await client.query('BEGIN');
    await client.query(`
      CREATE TEMP TABLE rls_regression_expected_tenants (
        tenant_key TEXT PRIMARY KEY
      ) ON COMMIT DROP
    `);
    await client.query(
      `
        INSERT INTO rls_regression_expected_tenants (tenant_key)
        SELECT unnest($1::text[])
      `,
      [EXPECTED_TENANTS],
    );
    await client.query(sql);
    await client.query('COMMIT');
    const elapsed = Math.round((Date.now() - started) / 100) / 10;
    process.stdout.write(`rls-regression: GREEN in ${elapsed}s\n`);
    process.exit(0);
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // ignore — connection may already be in failed state
    }
    const message = (err as Error).message ?? String(err);
    if (isNotCheckedPrecondition(message)) {
      process.stderr.write(`\nrls-regression: NOT CHECKED - ${message}\n`);
      process.exit(2);
    }
    process.stderr.write(`\nrls-regression: FAILED — ${message}\n`);
    process.exit(1);
  } finally {
    try {
      await client.end();
    } catch {
      // ignore
    }
  }
}

main().catch((err) => {
  fail(2, `rls-regression: unexpected error — ${(err as Error).message}`);
});
