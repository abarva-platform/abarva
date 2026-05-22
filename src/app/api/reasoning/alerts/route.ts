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

// SECURITY (audit 2026-05-22, P0-1): requires an authenticated session.
import { buildPortfolioAlerts } from '@/lib/reasoning/portfolio-alerts';
import { guardReasoning } from '@/app/api/reasoning/_auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const guard = await guardReasoning();
  if (guard.response) return guard.response;

  const alerts = buildPortfolioAlerts();
  return new Response(JSON.stringify({ alerts }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}
