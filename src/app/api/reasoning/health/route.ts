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

import { runAllHealthChecks } from '@/lib/reasoning/health-checks';

export const dynamic = 'force-dynamic';

export async function GET() {
  const report = runAllHealthChecks();
  return new Response(JSON.stringify(report), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}
