import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  ROUTE_SMOKE_PRIORITY,
  getHighPrioritySmokeTargets,
  getRouteSmokeByOwnerSurface,
  listRouteSmokeTargets,
  summarizeRouteSmokeTargets,
  type RouteSmokeImplementationStatus,
  type RouteSmokeOwnerSurface,
  type RouteSmokePrimaryAgent,
  type RouteSmokePriority,
  type RouteSmokeTarget,
  type RouteSmokeTestStrategy,
} from '@/lib/qa/route-smoke-inventory';

const inventorySourcePath = resolve(
  __dirname,
  '../../../lib/qa/route-smoke-inventory.ts',
);

const VALID_PRIORITIES: ReadonlySet<RouteSmokePriority> = new Set<RouteSmokePriority>([
  'critical',
  'high',
  'medium',
  'low',
]);

const VALID_OWNER_SURFACES: ReadonlySet<RouteSmokeOwnerSurface> =
  new Set<RouteSmokeOwnerSurface>([
    'home',
    'admin',
    'programs',
    'tower',
    'intelligence',
    'source',
  ]);

const VALID_PRIMARY_AGENTS: ReadonlySet<RouteSmokePrimaryAgent> =
  new Set<RouteSmokePrimaryAgent>([
    'nexus',
    'sentinel',
    'atlas',
    'steward',
    'platform',
  ]);

const VALID_GUARDS: ReadonlySet<string> = new Set<string>([
  'public',
  'authenticated',
  'tenant_scoped',
  'platform_admin',
]);

const VALID_IMPLEMENTATION_STATUSES: ReadonlySet<RouteSmokeImplementationStatus> =
  new Set<RouteSmokeImplementationStatus>([
    'exists',
    'partial',
    'missing',
    'legacy',
  ]);

const VALID_TEST_STRATEGIES: ReadonlySet<RouteSmokeTestStrategy> =
  new Set<RouteSmokeTestStrategy>([
    'static_snapshot',
    'read_model_unit',
    'persona_walk',
    'fixture_fetch_when_implemented',
    'manual_only',
  ]);

const CANONICAL_ROUTE_ORDER: readonly string[] = [
  '/home',
  '/platform/admin',
  '/platform/admin/build-progress',
  '/platform/admin/production-readiness',
  '/tenant/[tenantSlug]/programs',
  '/tenant/[tenantSlug]/programs/[programSlug]',
  '/tenant/[tenantSlug]/tower',
  '/tenant/[tenantSlug]/intelligence',
  '/tenant/[tenantSlug]/intelligence/patterns/[patternKey]',
  '/source',
  '/source/events',
];

const CRITICAL_REQUIRED_ROUTES: readonly string[] = [
  '/home',
  '/platform/admin',
  '/platform/admin/production-readiness',
  '/tenant/[tenantSlug]/programs',
];

describe('QA5 route smoke inventory canonical shape', () => {
  it('exposes the canonical priority tuple in stable order', () => {
    expect([...ROUTE_SMOKE_PRIORITY]).toEqual(['critical', 'high', 'medium', 'low']);
  });

  it('returns exactly 11 targets in canonical order', () => {
    const targets = listRouteSmokeTargets();
    expect(targets).toHaveLength(11);
    expect(targets.map((target) => target.routePattern)).toEqual(CANONICAL_ROUTE_ORDER);
  });

  it('covers every required critical-priority route', () => {
    const targets = listRouteSmokeTargets();
    for (const requiredRoute of CRITICAL_REQUIRED_ROUTES) {
      const target = targets.find((item) => item.routePattern === requiredRoute);
      if (!target) {
        throw new Error(`Critical route ${requiredRoute} is missing from inventory.`);
      }
      expect(target.smokePriority).toBe('critical');
    }
  });

  it('production-readiness route is present in the inventory', () => {
    const targets = listRouteSmokeTargets();
    const target = targets.find(
      (item) => item.routePattern === '/platform/admin/production-readiness',
    );
    expect(target).toBeDefined();
    expect(target?.smokePriority).toBe('critical');
    expect(target?.expectedReadModel).toBe('src/lib/admin/production-readiness.ts');
  });

  it('every target has non-empty canonical fields', () => {
    const targets = listRouteSmokeTargets();
    for (const target of targets) {
      expect(target.routePattern.length).toBeGreaterThan(0);
      expect(target.expectedReadModel.length).toBeGreaterThan(0);
      expect(VALID_OWNER_SURFACES.has(target.ownerSurface)).toBe(true);
      expect(VALID_PRIMARY_AGENTS.has(target.primaryAgent)).toBe(true);
      expect(VALID_GUARDS.has(target.expectedGuard)).toBe(true);
      expect(VALID_PRIORITIES.has(target.smokePriority)).toBe(true);
      expect(VALID_IMPLEMENTATION_STATUSES.has(target.currentlyImplemented)).toBe(true);
      expect(VALID_TEST_STRATEGIES.has(target.testStrategy)).toBe(true);
      expect(target.createdFrom).toBe('deterministic_route_smoke_inventory');
      expect(Array.isArray(target.knownGaps)).toBe(true);
    }
  });

  it('every target has a valid currentlyImplemented enum', () => {
    const targets = listRouteSmokeTargets();
    for (const target of targets) {
      expect(VALID_IMPLEMENTATION_STATUSES.has(target.currentlyImplemented)).toBe(true);
    }
  });
});

describe('QA5 route smoke inventory helpers', () => {
  it('getHighPrioritySmokeTargets returns only critical and high priority targets', () => {
    const high = getHighPrioritySmokeTargets();
    expect(high.length).toBeGreaterThan(0);
    for (const target of high) {
      expect(['critical', 'high']).toContain(target.smokePriority);
    }
    const expectedRoutes = listRouteSmokeTargets()
      .filter((target) => target.smokePriority === 'critical' || target.smokePriority === 'high')
      .map((target) => target.routePattern);
    expect(high.map((target) => target.routePattern)).toEqual(expectedRoutes);
  });

  it('getRouteSmokeByOwnerSurface("source") returns exactly 2 targets', () => {
    const sourceTargets = getRouteSmokeByOwnerSurface(listRouteSmokeTargets(), 'source');
    expect(sourceTargets).toHaveLength(2);
    expect(sourceTargets.map((target) => target.routePattern)).toEqual(['/source', '/source/events']);
  });

  it('summarizeRouteSmokeTargets reconciles totals across all axes', () => {
    const summary = summarizeRouteSmokeTargets();
    const targets = listRouteSmokeTargets();
    expect(summary.totalTargets).toBe(targets.length);
    const priorityTotal = (Object.values(summary.byPriority) as number[]).reduce(
      (acc, value) => acc + value,
      0,
    );
    const ownerSurfaceTotal = (Object.values(summary.byOwnerSurface) as number[]).reduce(
      (acc, value) => acc + value,
      0,
    );
    const primaryAgentTotal = (Object.values(summary.byPrimaryAgent) as number[]).reduce(
      (acc, value) => acc + value,
      0,
    );
    const implementationTotal = (Object.values(summary.byImplementationStatus) as number[]).reduce(
      (acc, value) => acc + value,
      0,
    );
    expect(priorityTotal).toBe(summary.totalTargets);
    expect(ownerSurfaceTotal).toBe(summary.totalTargets);
    expect(primaryAgentTotal).toBe(summary.totalTargets);
    expect(implementationTotal).toBe(summary.totalTargets);
    expect(summary.highPriorityCount).toBe(summary.byPriority.critical + summary.byPriority.high);
    expect(summary.byOwnerSurface.source).toBe(2);
  });
});

describe('QA5 route smoke inventory determinism and module hygiene', () => {
  it('listRouteSmokeTargets is byte-equal across calls', () => {
    const first = listRouteSmokeTargets();
    const second = listRouteSmokeTargets();
    expect(JSON.stringify(first)).toEqual(JSON.stringify(second));
  });

  it('summarizeRouteSmokeTargets is byte-equal across calls', () => {
    const first = summarizeRouteSmokeTargets();
    const second = summarizeRouteSmokeTargets();
    expect(JSON.stringify(first)).toEqual(JSON.stringify(second));
  });

  it('inventory source has no browser automation imports or live HTTP calls', () => {
    const source = readFileSync(inventorySourcePath, 'utf-8');
    expect(/^\s*import[^\n]*['"][^'"]*playwright[^'"]*['"]/im.test(source)).toBe(false);
    expect(/^\s*import[^\n]*['"][^'"]*puppeteer[^'"]*['"]/im.test(source)).toBe(false);
    expect(/^\s*import[^\n]*['"][^'"]*cypress[^'"]*['"]/im.test(source)).toBe(false);
    expect(/(^|[^A-Za-z_])fetch\s*\(/.test(source)).toBe(false);
    expect(/playwright/i.test(source)).toBe(false);
    expect(/puppeteer/i.test(source)).toBe(false);
    expect(/cypress/i.test(source)).toBe(false);
  });

  it('inventory source has no banned non-deterministic APIs', () => {
    const source = readFileSync(inventorySourcePath, 'utf-8');
    expect(source.includes('Date.now')).toBe(false);
    expect(source.includes('Math.random')).toBe(false);
    expect(source.includes('new Date(')).toBe(false);
    expect(source.includes('useState')).toBe(false);
    expect(source.includes('useEffect')).toBe(false);
  });

  it('inventory source has no model-provider or auth imports', () => {
    const source = readFileSync(inventorySourcePath, 'utf-8');
    expect(source.includes('anthropic')).toBe(false);
    expect(source.includes('openai')).toBe(false);
    expect(/from ['"]@\/lib\/source/.test(source)).toBe(false);
    expect(/from ['"]@\/lib\/nexus/.test(source)).toBe(false);
    expect(/from ['"]@\/lib\/sentinel/.test(source)).toBe(false);
    expect(/from ['"]@\/lib\/atlas/.test(source)).toBe(false);
    expect(/from ['"]@\/lib\/agent/.test(source)).toBe(false);
    expect(/from ['"]@\/lib\/auth/.test(source)).toBe(false);
    expect(source.includes('supabase')).toBe(false);
  });

  it('inventory source has no banned placeholder language', () => {
    const source = readFileSync(inventorySourcePath, 'utf-8');
    expect(source.includes('Coming soon')).toBe(false);
    expect(source.includes('TBD')).toBe(false);
    expect(source.includes('Lorem ipsum')).toBe(false);
  });

  it('every target advertises createdFrom = deterministic_route_smoke_inventory', () => {
    const targets = listRouteSmokeTargets();
    for (const target of targets as readonly RouteSmokeTarget[]) {
      expect(target.createdFrom).toBe('deterministic_route_smoke_inventory');
    }
  });
});
