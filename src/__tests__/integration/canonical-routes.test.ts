import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  buildSeedDeliverableRenderModel,
  findDeliverableByRoute,
  getSeedPlan,
  type SeedRouteContext,
} from '@/lib/deliverables/seed-route-resolver';
import { DeliverableTierRenderer } from '@/components/deliverables/DeliverableTierRenderer';
import {
  SeedGlobalPattern,
  SeedOperationsPortfolio,
  SeedPhaseOverview,
  SeedProgramOverview,
  SeedProgramsIndex,
  SeedTenantDashboard,
  SeedTenantPattern,
  SeedTenantTower,
  SeedTenantTowerSubsurface,
} from '@/components/deliverables/SeedRouteShell';
import { crawlCanonicalRouteSurface } from '@/lib/integrity/link-crawler';
import { buildCanonicalRouteRecords, type CanonicalRouteRecord } from '@/lib/integrity/route-catalog';
import type { SpecPhaseNumber } from '@/lib/programs/enhancement-spec';

describe('canonical route integrity', () => {
  const routes = buildCanonicalRouteRecords().filter((route) => route.surface !== 'global_tower_surface');

  it('returns 200 for every canonical URL pattern covered by the seed spec', () => {
    const report = crawlCanonicalRouteSurface(new Date('2026-04-23T00:00:00.000Z'));

    expect(report.summary.brokenRouteCount).toBe(0);
    expect(report.summary.brokenInternalLinkCount).toBe(0);
    expect(report.summary.redirectChainViolationCount).toBe(0);
    expect(report.routes.every((route) => route.status === 200)).toBe(true);
  });

  it('renders shell structure without unresolved tokens or leaked undefined/null strings', () => {
    expect(routes.length).toBeGreaterThan(600);

    for (const route of routes) {
      const html = renderRoute(route);
      expect(html).toContain('<main');
      expect(html).toMatch(/aria-label="(?:Route|Deliverable) breadcrumbs"/);
      expect(html).toContain('del-title');
      expect(html).toContain('del-footer');
      expect(html).not.toContain('{{');
      expect(html).not.toContain('}}');
      expect(html).not.toMatch(/(^|[>\s])undefined([<\s]|$)/i);
      expect(html).not.toMatch(/(^|[>\s])null([<\s]|$)/i);
    }
  });
});

function renderRoute(route: CanonicalRouteRecord): string {
  const plan = getSeedPlan();
  const tenant = route.tenantSlug ? plan.tenants.find((entry) => entry.routeSlug === route.tenantSlug) : null;

  switch (route.surface) {
    case 'operations_portfolio':
      return renderToStaticMarkup(createElement(SeedOperationsPortfolio));
    case 'tenant_dashboard':
      return renderToStaticMarkup(createElement(SeedTenantDashboard, { tenant: tenant! }));
    case 'tenant_programs':
      return renderToStaticMarkup(createElement(SeedProgramsIndex, { tenant: tenant! }));
    case 'tenant_program': {
      const program = tenant!.programs.find((entry) => entry.programSlug === route.programSlug)!;
      return renderToStaticMarkup(createElement(SeedProgramOverview, { tenant: tenant!, program }));
    }
    case 'tenant_program_phase': {
      const program = tenant!.programs.find((entry) => entry.programSlug === route.programSlug)!;
      return renderToStaticMarkup(createElement(SeedPhaseOverview, {
        tenant: tenant!,
        program,
        phase: phaseFromRoute(route),
      }));
    }
    case 'tenant_deliverable': {
      const context = deliverableContextForRoute(route)!;
      const model = buildSeedDeliverableRenderModel({
        tenant: context.tenant,
        program: context.program,
        deliverable: context.deliverable!,
      });
      return renderToStaticMarkup(createElement(DeliverableTierRenderer, { model }));
    }
    case 'tenant_tower':
      return renderToStaticMarkup(createElement(SeedTenantTower, { tenant: tenant! }));
    case 'tenant_tower_subsurface':
      return renderToStaticMarkup(createElement(SeedTenantTowerSubsurface, { tenant: tenant!, surface: route.towerSurface! }));
    case 'tenant_pattern':
      return renderToStaticMarkup(createElement(SeedTenantPattern, { tenant: tenant!, patternSlug: route.patternSlug! }));
    case 'global_pattern':
      return renderToStaticMarkup(createElement(SeedGlobalPattern, { patternSlug: route.patternSlug! }));
    default:
      throw new Error(`No canonical renderer for ${route.path}`);
  }
}

function deliverableContextForRoute(route: CanonicalRouteRecord): SeedRouteContext | null {
  const match = route.path.match(/^\/tenant\/([^/]+)\/programs\/([^/]+)\/deliverables\/([^/]+)$/);
  if (!match) return null;
  return findDeliverableByRoute(match[1], match[2], match[3]);
}

function phaseFromRoute(route: CanonicalRouteRecord): SpecPhaseNumber {
  const match = route.path.match(/\/phase\/([1-5])$/);
  if (!match) throw new Error(`No phase segment found for ${route.path}`);
  return Number(match[1]) as SpecPhaseNumber;
}
