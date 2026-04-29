// GET /api/reasoning/alerts
//
// Returns the deterministic portfolio-wide alerts feed produced by
// `buildPortfolioAlerts()`. Surfaces red-grade instances, high-severity
// contradictions, high-confidence failure modes, and high-impact cascades
// across every active program + source-event instance.
//
// Pure: same fixtures → same response. No LLM calls, no IO beyond
// fixture imports, no Date.now(), no randomness. Returned for
// programmatic consumers (dashboards, integrations, exports).

import { buildPortfolioAlerts } from '@/lib/reasoning/portfolio-alerts';

export const dynamic = 'force-dynamic';

export async function GET() {
  const alerts = buildPortfolioAlerts();
  return new Response(JSON.stringify({ alerts }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}
