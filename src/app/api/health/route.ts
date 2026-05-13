import { getServerSupabase } from '@/lib/supabase-server';
import { getGraphDriver } from '@/lib/graph/driver';

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

function statusFromError(err: unknown): string {
  if (REVEAL_ERRORS) {
    return err instanceof Error ? err.message : 'unknown';
  }
  return 'error';
}

export async function GET() {
  const checks: Record<string, boolean | string> = {};

  try {
    const { error } = await getServerSupabase().from('engagements').select('id').limit(1);
    checks.postgres = !error;
    if (error) checks.postgres_error = REVEAL_ERRORS ? error.message : 'error';
  } catch (err) {
    checks.postgres = false;
    checks.postgres_error = statusFromError(err);
  }

  try {
    const session = getGraphDriver().session();
    await session.run('RETURN 1 AS ok');
    await session.close();
    checks.neo4j = true;
  } catch (err) {
    checks.neo4j = false;
    checks.neo4j_error = statusFromError(err);
  }

  const allOk = checks.postgres === true && checks.neo4j === true;

  return new Response(JSON.stringify({ ok: allOk, checks }, null, 2), {
    status: allOk ? 200 : 503,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}
