// GET /api/reasoning/health
//
// Reasoning-layer self-test endpoint. Runs a deterministic set of sanity
// checks against the canonical demo fixtures (AMS source instance + APX-CDP
// program instance) and reports per-check status alongside summary counts
// for the live in-memory layer state (telemetry buffer, contradiction
// resolutions, ingested evidence).
//
// Always returns HTTP 200 — failures surface in the response body. This is a
// health check, not a critical path, and a non-200 here would force callers
// to treat the endpoint itself as a failure mode rather than a diagnostic.

// SECURITY (audit 2026-05-22, P0-1): requires an authenticated session.
import { runAllHealthChecks } from '@/lib/reasoning/health-checks';
import { guardReasoning } from '@/app/api/reasoning/_auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const guard = await guardReasoning();
  if (guard.response) return guard.response;

  const report = runAllHealthChecks();
  return new Response(JSON.stringify(report), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}
