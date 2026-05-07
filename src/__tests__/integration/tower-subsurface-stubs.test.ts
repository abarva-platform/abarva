import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { getSeedPlan } from '@/lib/deliverables/seed-route-resolver';
import { SeedTenantTowerSubsurface } from '@/components/deliverables/SeedRouteShell';
import {
  TOWER_SUBSURFACE_DEFINITIONS,
  tenantTowerPath,
  tenantTowerSubsurfacePath,
} from '@/lib/integrity/route-catalog';
import { COMPOSITE_DISCLAIMER } from '@/lib/integrity/disclaimers';

describe('Tower sub-surface stub routes', () => {
  it('renders the five scheduled Tower sub-surfaces for every tenant', () => {
    const plan = getSeedPlan();
    const renderedRoutes: string[] = [];

    for (const tenant of plan.tenants) {
      for (const surface of TOWER_SUBSURFACE_DEFINITIONS) {
        const route = tenantTowerSubsurfacePath(tenant, surface.slug);
        const html = renderToStaticMarkup(createElement(SeedTenantTowerSubsurface, { tenant, surface: surface.slug }));

        renderedRoutes.push(route);
        expect(html).toContain(surface.label);
        expect(html).toContain('This surface ships in the next build cycle');
        expect(html).toContain(tenantTowerPath(tenant));
        expect(html).toContain(COMPOSITE_DISCLAIMER);
      }
    }

    // 5 sub-surfaces × number of active tenants in the seed plan
    expect(renderedRoutes.length).toBeGreaterThanOrEqual(15);
    expect(renderedRoutes).toContain('/tenant/meridian-health/tower/shadow-ai');
    expect(renderedRoutes).toContain('/tenant/apex-retail/tower/vendors');
  });
});
