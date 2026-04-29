// GET /api/reasoning/digest/weekly
// Returns a 7-day reasoning-layer executive digest as JSON. Reads only
// the in-memory telemetry buffer + the canonical instance / pattern
// catalogues — no DB calls, no LLM calls, no mutation. Always 200.

import { buildWeeklyDigest } from '@/lib/reasoning/weekly-digest';
// Side-effect import: installs the in-memory-extended telemetry backend
// once per server boot so the buffer matches what other reasoning
// routes see.
import '@/lib/reasoning/telemetry-init';

export const dynamic = 'force-dynamic';

export async function GET() {
  const digest = buildWeeklyDigest();
  return new Response(JSON.stringify(digest), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      // Buffer turnover is faster than any cache window — always fresh.
      'Cache-Control': 'no-store',
    },
  });
}
