import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import EvidenceDetailPage from '@/app/tenant/[tenantSlug]/programs/[programSlug]/evidence/[evidenceId]/page';
import {
  buildSeedDeliverableRenderModel,
  findDeliverableByRoute,
  getSeedPlan,
  type SeedRouteContext,
} from '@/lib/deliverables/seed-route-resolver';
import { DeliverableTierRenderer } from '@/components/deliverables/DeliverableTierRenderer';
import {
  SeedGlobalPattern,
  SeedPhaseOverview,
  SeedProgramOverview,
  SeedProgramsIndex,
  SeedTenantDashboard,
  SeedTenantPattern,
  SeedTenantTower,
  SeedTenantTowerSubsurface,
} from '@/components/deliverables/SeedRouteShell';
import {
  buildCanonicalRouteRecords,
  type CanonicalRouteRecord,
} from '@/lib/integrity/route-catalog';
import {
  COMPOSITE_DISCLAIMER,
  PATTERN_OBSERVATION_AUTHORSHIP_DISCLAIMER,
  RICH_DELIVERABLE_DEMO_DISCLAIMER,
} from '@/lib/integrity/disclaimers';
import type { SpecPhaseNumber } from '@/lib/programs/enhancement-spec';

describe('composite disclaimer presence', () => {
  const routes = buildCanonicalRouteRecords();

  it('keeps the composite disclaimer on every tenant-scoped route', async () => {
    const tenantScopedRoutes = routes.filter((route) => route.tenantSlug);
    expect(tenantScopedRoutes.length).toBeGreaterThan(0);

    for (const route of tenantScopedRoutes) {
      await expect(renderRoute(route)).resolves.toContain(COMPOSITE_DISCLAIMER);
    }
  });

  it('keeps the demo-rendering disclaimer on every Rich deliverable route', async () => {
    const richDeliverableRoutes = routes.filter((route) => {
      if (route.surface !== 'tenant_deliverable') return false;
      const context = deliverableContextForRoute(route);
      return context?.deliverable?.renderTier === 'rich';
    });

    expect(richDeliverableRoutes.length).toBeGreaterThan(0);
    for (const route of richDeliverableRoutes) {
      await expect(renderRoute(route)).resolves.toContain(RICH_DELIVERABLE_DEMO_DISCLAIMER);
    }
  });

  it('keeps the observation-authorship disclaimer on every pattern page', async () => {
    const patternRoutes = routes.filter((route) => route.surface === 'global_pattern' || route.surface === 'tenant_pattern');
    expect(patternRoutes.length).toBeGreaterThan(0);

    for (const route of patternRoutes) {
      await expect(renderRoute(route).then(normalizeRenderedText)).resolves.toContain(PATTERN_OBSERVATION_AUTHORSHIP_DISCLAIMER);
    }
  });
});

async function renderRoute(route: CanonicalRouteRecord): Promise<string> {
  const plan = getSeedPlan();
  const tenant = route.tenantSlug ? plan.tenants.find((entry) => entry.routeSlug === route.tenantSlug) : null;

  switch (route.surface) {
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
    case 'tenant_evidence': {
      const match = route.path.match(/^\/tenant\/([^/]+)\/programs\/([^/]+)\/evidence\/([^/]+)$/);
      if (!match) return '';
      const page = await EvidenceDetailPage({
        params: Promise.resolve({
          tenantSlug: match[1],
          programSlug: match[2],
          evidenceId: match[3],
        }),
      });
      return renderToStaticMarkup(page);
    }
    case 'global_pattern':
      return renderToStaticMarkup(createElement(SeedGlobalPattern, { patternSlug: route.patternSlug! }));
    default:
      return '';
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

function normalizeRenderedText(markup: string): string {
  return markup.replaceAll('&#x27;', '\'');
}
