import { getServerSupabase } from '@/lib/supabase-server';
import { getGraphDriver } from '@/lib/graph/driver';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET() {
  const checks: Record<string, boolean | string> = {};

  try {
    const { error } = await getServerSupabase().from('engagements').select('id').limit(1);
    checks.postgres = !error;
    if (error) checks.postgres_error = error.message;
  } catch (err) {
    checks.postgres = false;
    checks.postgres_error = err instanceof Error ? err.message : 'unknown';
  }

  try {
    const session = getGraphDriver().session();
    await session.run('RETURN 1 AS ok');
    await session.close();
    checks.neo4j = true;
  } catch (err) {
    checks.neo4j = false;
    checks.neo4j_error = err instanceof Error ? err.message : 'unknown';
  }

  const allOk = checks.postgres === true && checks.neo4j === true;

  return new Response(JSON.stringify({ ok: allOk, checks }, null, 2), {
    status: allOk ? 200 : 503,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}
