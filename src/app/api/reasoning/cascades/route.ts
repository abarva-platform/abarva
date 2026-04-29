// GET /api/reasoning/cascades
//
// Returns the most-recent cascade telemetry events from the in-memory ring
// buffer. Each event records that a cross-instance CascadeImpact flowed
// into a synthesis context build (Source / Programs / Tower). Useful for
// answering "is this edge actively affecting synthesis output?" without
// having to re-derive the impact graph from raw fixtures.
//
// Read-only. No mutation. The buffer is reset on cold-start, so values
// reflect the current process — exactly the same lifetime story as the
// sibling synthesis-telemetry buffer.

import { getRecentCascadeEvents } from '@/lib/reasoning/cascade-telemetry';

export const dynamic = 'force-dynamic';

export async function GET() {
  const events = getRecentCascadeEvents(200);

  return new Response(JSON.stringify({ events }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      // Buffer turnover is faster than any cache window — always fresh.
      'Cache-Control': 'no-store',
    },
  });
}
