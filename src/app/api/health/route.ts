import { azureRead } from '@/lib/data-plane/azureRead';
import { Pool } from 'pg';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * Public liveness endpoint. Returns boolean `ok` per backing service plus
 * a short status hint for failures. Raw error messages are masked unless
 * the request comes from a non-production environment, since they can
 * leak DSN, schema names, or other connection details. Per audit
 * 2026-05-13 Agent C HIGH on the original implementation.
 */
const REVEAL_ERRORS = process.env.NODE_ENV !== 'production';
let directPostgresPool: Pool | null | undefined;

function statusFromError(err: unknown): string {
  if (REVEAL_ERRORS) {
    return err instanceof Error ? err.message : 'unknown';
  }
  return 'error';
}

async function checkDirectPostgres(): Promise<boolean> {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) return false;
  if (directPostgresPool === undefined) {
    directPostgresPool = new Pool({
      connectionString,
      max: 1,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 5_000,
    });
  }
  if (!directPostgresPool) return false;
  await directPostgresPool.query('select 1');
  return true;
}

export async function GET() {
  const checks: Record<string, boolean | string> = {};

  try {
    await azureRead.query('SELECT 1 AS ok');
    checks.postgres = true;
  } catch (err) {
    checks.postgres = false;
    checks.postgres_error = statusFromError(err);
  }

  try {
    checks.direct_postgres = await checkDirectPostgres();
  } catch (err) {
    checks.direct_postgres = false;
    checks.direct_postgres_error = statusFromError(err);
  }

  checks.azure_graph = 'postgres';

  const postgresOk = checks.postgres === true || checks.direct_postgres === true;
  const allOk = postgresOk;

  return new Response(JSON.stringify({ ok: allOk, checks }, null, 2), {
    status: allOk ? 200 : 503,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}
