// GET /api/reasoning/telemetry
// Returns the most-recent synthesis telemetry events plus an aggregated
// summary view for programmatic consumers (admin dashboard fetch, e2e tests,
// future Postgres exporter, etc.). No mutation; reads only the in-memory
// ring buffer exposed by the telemetry module.

import { getRecentSynthesisEvents } from '@/lib/reasoning/synthesis-telemetry';
import { summarizeTelemetry } from '@/lib/reasoning/synthesis-telemetry-stats';

export const dynamic = 'force-dynamic';

export async function GET() {
  const events = getRecentSynthesisEvents(200);
  const summary = summarizeTelemetry(events);

  return new Response(JSON.stringify({ events, summary }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      // Always serve fresh — buffer turnover is faster than any cache window.
      'Cache-Control': 'no-store',
    },
  });
}
