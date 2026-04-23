import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { getSeedPlan } from '@/lib/deliverables/seed-route-resolver';
import {
  SeedGlobalPattern,
  SeedTenantPattern,
} from '@/components/deliverables/SeedRouteShell';
import {
  buildCanonicalRouteRecords,
  type CanonicalRouteRecord,
} from '@/lib/integrity/route-catalog';

const PIPELINE_COPY =
  'This pattern receives observations from completed Phase 5 programs. When Morrison reaches Phase 5 outcome attestation, observations will be anonymized, composite-tagged, and contributed back to this pattern.';
const ZERO_STATE_COPY = '0 observations contributed to date. Pipeline schema ready.';

describe('pattern observation pipeline', () => {
  const routes = buildCanonicalRouteRecords().filter((route) => route.surface === 'global_pattern' || route.surface === 'tenant_pattern');

  it('renders the observations pipeline section on every canonical pattern route', () => {
    expect(routes.length).toBeGreaterThan(0);

    for (const route of routes) {
      const html = renderRoute(route);
      expect(html).toContain('Observations pipeline');
      expect(html).toContain(PIPELINE_COPY);
      expect(html).toContain(ZERO_STATE_COPY);
    }
  });
});

function renderRoute(route: CanonicalRouteRecord): string {
  const plan = getSeedPlan();
  const tenant = route.tenantSlug ? plan.tenants.find((entry) => entry.routeSlug === route.tenantSlug) : null;

  switch (route.surface) {
    case 'tenant_pattern':
      return renderToStaticMarkup(createElement(SeedTenantPattern, { tenant: tenant!, patternSlug: route.patternSlug! }));
    case 'global_pattern':
      return renderToStaticMarkup(createElement(SeedGlobalPattern, { patternSlug: route.patternSlug! }));
    default:
      throw new Error(`Unsupported route ${route.path}`);
  }
}
