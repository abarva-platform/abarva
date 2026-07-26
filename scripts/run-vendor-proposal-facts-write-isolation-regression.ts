/**
 * Vendor-proposal-facts write-path security regression runner (PR C of the
 * RLS/tenant-isolation security workstream).
 *
 * Executes tests/security/vendor-proposal-facts-write-isolation-regression.sql
 * against the database referenced by DATABASE_URL, streams every RAISE
 * NOTICE to stdout, and exits non-zero if the SQL throws (i.e. if any
 * cross-tenant/cross-event/cross-vendor write was NOT rejected).
 *
 * Usage:
 *   npm run test:vendor-proposal-facts-write-regression
 *   DATABASE_URL=postgresql://... npm run test:vendor-proposal-facts-write-regression
 *
 * Exit codes:
 *   0 — every scenario passed.
 *   1 — at least one scenario failed (the SQL's summary block raised).
 *   2 — connection or runtime error.
 *
 * UNLIKE tests/security/rls-regression.sql (100% SELECT-only, safe to
 * COMMIT), this suite creates real fixture rows and attempts real writes —
 * the transaction is ALWAYS rolled back, whether the suite passes or fails,
 * so nothing it creates is ever persisted. Safe to point at a lab or
 * production database for the same reason rls-regression.sql is: it never
 * leaves a trace.
 */

import { Client } from 'pg';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
loadEnv();

const SQL_PATH = path.resolve(
  process.cwd(),
  'tests/security/vendor-proposal-facts-write-isolation-regression.sql',
);

function fail(code: number, msg: string): never {
  process.stderr.write(`${msg}\n`);
  process.exit(code);
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

  const client = new Client({
    connectionString: databaseUrl,
    application_name: 'vendor-proposal-facts-write-regression-l4',
  });

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

  let exitCode = 0;
  let failureMessage: string | null = null;

  try {
    process.stdout.write(
      `vpf-write-regression: running against ${maskUrl(databaseUrl)}\n`,
    );
    await client.query('BEGIN');
    await client.query(sql);
  } catch (err) {
    exitCode = 1;
    failureMessage = (err as Error).message ?? String(err);
  } finally {
    // ALWAYS roll back — this suite writes real fixture rows and must never
    // persist them, whether the scenarios passed or failed.
    try {
      await client.query('ROLLBACK');
    } catch {
      // ignore — connection may already be in a failed state
    }
    try {
      await client.end();
    } catch {
      // ignore
    }
  }

  const elapsed = Math.round((Date.now() - started) / 100) / 10;
  if (exitCode === 0) {
    process.stdout.write(`vpf-write-regression: GREEN in ${elapsed}s\n`);
    process.exit(0);
  }
  process.stderr.write(
    `\nvpf-write-regression: FAILED in ${elapsed}s — ${failureMessage}\n`,
  );
  process.exit(1);
}

main().catch((err) => {
  fail(2, `vpf-write-regression: unexpected error — ${(err as Error).message}`);
});
