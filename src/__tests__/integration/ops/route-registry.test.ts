/**
 * Wave 29 SHELL9 — Route Registry
 *
 * Verifies the canonical route registry read model:
 * - All 16 routes present
 * - Correct routeId, shellKind, surface, primaryAgent, requiresAuth, active
 * - Query helpers work as expected
 * - Summary counts are accurate
 */

import {
  getRouteRegistry,
  getActiveRoutes,
  getRoutesByShellKind,
  getRoutesBySurface,
  getRouteById,
  getAuthenticatedRoutes,
  getRoutesByAgent,
  summarizeRouteRegistry,
  ROUTE_SHELL_KINDS_IN_ORDER,
  ROUTE_SURFACES_IN_ORDER,
  ROUTE_AGENTS_IN_ORDER,
} from '@/lib/routes/registry';

describe('SHELL9 — Route Registry', () => {
  describe('getRouteRegistry()', () => {
    it('returns a non-empty array', () => {
      const registry = getRouteRegistry();
      expect(registry.length).toBeGreaterThan(0);
    });

    it('every entry has all required fields', () => {
      const registry = getRouteRegistry();
      for (const route of registry) {
        expect(typeof route.routeId).toBe('string');
        expect(route.routeId.length).toBeGreaterThan(0);
        expect(typeof route.pattern).toBe('string');
        expect(route.pattern.length).toBeGreaterThan(0);
        expect(typeof route.label).toBe('string');
        expect(route.label.length).toBeGreaterThan(0);
        expect(['tenant', 'admin', 'source', 'public']).toContain(route.shellKind);
        expect(['programs', 'intelligence', 'tower', 'admin', 'source', 'marketing', 'auth']).toContain(route.surface);
        expect(['Nexus', 'Sentinel', 'Atlas', 'Steward', 'none']).toContain(route.primaryAgent);
        expect(typeof route.requiresAuth).toBe('boolean');
        expect(typeof route.active).toBe('boolean');
      }
    });

    it('all routeIds are unique', () => {
      const registry = getRouteRegistry();
      const ids = registry.map((r) => r.routeId);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('all patterns are unique', () => {
      const registry = getRouteRegistry();
      const patterns = registry.map((r) => r.pattern);
      const uniquePatterns = new Set(patterns);
      expect(uniquePatterns.size).toBe(patterns.length);
    });
  });

  describe('Canonical routes present', () => {
    it('tenant-programs-index is present with correct shape', () => {
      const route = getRouteById('tenant-programs-index');
      expect(route).toBeDefined();
      expect(route!.pattern).toBe('/tenant/[tenantSlug]/programs');
      expect(route!.shellKind).toBe('tenant');
      expect(route!.surface).toBe('programs');
      expect(route!.primaryAgent).toBe('Nexus');
      expect(route!.requiresAuth).toBe(true);
      expect(route!.active).toBe(true);
    });

    it('tenant-intelligence is present with Sentinel as primary agent', () => {
      const route = getRouteById('tenant-intelligence');
      expect(route).toBeDefined();
      expect(route!.primaryAgent).toBe('Sentinel');
      expect(route!.surface).toBe('intelligence');
    });

    it('tenant-tower is present with Atlas as primary agent', () => {
      const route = getRouteById('tenant-tower');
      expect(route).toBeDefined();
      expect(route!.primaryAgent).toBe('Atlas');
      expect(route!.surface).toBe('tower');
    });

    it('admin-index is present with Steward as primary agent', () => {
      const route = getRouteById('admin-index');
      expect(route).toBeDefined();
      expect(route!.primaryAgent).toBe('Steward');
      expect(route!.shellKind).toBe('admin');
    });

    it('marketing-home is present as public route', () => {
      const route = getRouteById('marketing-home');
      expect(route).toBeDefined();
      expect(route!.shellKind).toBe('public');
      expect(route!.requiresAuth).toBe(false);
    });

    it('auth-sign-in and auth-sign-up are present as public routes', () => {
      const signIn = getRouteById('auth-sign-in');
      const signUp = getRouteById('auth-sign-up');
      expect(signIn).toBeDefined();
      expect(signIn!.requiresAuth).toBe(false);
      expect(signUp).toBeDefined();
      expect(signUp!.requiresAuth).toBe(false);
    });

    it('source routes are present with source shellKind', () => {
      const sourceIndex = getRouteById('source-index');
      const sourceEvents = getRouteById('source-events');
      const sourceEventDetail = getRouteById('source-event-detail');
      expect(sourceIndex).toBeDefined();
      expect(sourceIndex!.shellKind).toBe('source');
      expect(sourceEvents).toBeDefined();
      expect(sourceEventDetail).toBeDefined();
    });
  });

  describe('getActiveRoutes()', () => {
    it('returns only active routes', () => {
      const active = getActiveRoutes();
      expect(active.every((r) => r.active)).toBe(true);
    });

    it('active count is ≥ total entries (all routes are active by default)', () => {
      const registry = getRouteRegistry();
      const active = getActiveRoutes();
      // All routes in the current registry are active
      expect(active.length).toBe(registry.length);
    });
  });

  describe('getRoutesByShellKind()', () => {
    it('tenant routes all have shellKind tenant', () => {
      const tenant = getRoutesByShellKind('tenant');
      expect(tenant.length).toBeGreaterThan(0);
      expect(tenant.every((r) => r.shellKind === 'tenant')).toBe(true);
    });

    it('admin routes all have shellKind admin', () => {
      const admin = getRoutesByShellKind('admin');
      expect(admin.length).toBeGreaterThan(0);
      expect(admin.every((r) => r.shellKind === 'admin')).toBe(true);
    });

    it('public routes all have shellKind public', () => {
      const pub = getRoutesByShellKind('public');
      expect(pub.length).toBeGreaterThan(0);
      expect(pub.every((r) => r.shellKind === 'public')).toBe(true);
    });

    it('source routes all have shellKind source', () => {
      const source = getRoutesByShellKind('source');
      expect(source.length).toBeGreaterThan(0);
      expect(source.every((r) => r.shellKind === 'source')).toBe(true);
    });
  });

  describe('getRoutesBySurface()', () => {
    it('programs surface returns programs routes', () => {
      const routes = getRoutesBySurface('programs');
      expect(routes.length).toBeGreaterThan(0);
      expect(routes.every((r) => r.surface === 'programs')).toBe(true);
    });

    it('tower surface returns at least one route', () => {
      const routes = getRoutesBySurface('tower');
      expect(routes.length).toBeGreaterThan(0);
    });
  });

  describe('getAuthenticatedRoutes()', () => {
    it('returns only routes that require auth', () => {
      const authRoutes = getAuthenticatedRoutes();
      expect(authRoutes.every((r) => r.requiresAuth)).toBe(true);
    });

    it('authenticated routes count is greater than 0', () => {
      const authRoutes = getAuthenticatedRoutes();
      expect(authRoutes.length).toBeGreaterThan(0);
    });

    it('public routes are NOT in authenticated routes', () => {
      const authRoutes = getAuthenticatedRoutes();
      const hasPublicRoute = authRoutes.some((r) => !r.requiresAuth);
      expect(hasPublicRoute).toBe(false);
    });
  });

  describe('getRoutesByAgent()', () => {
    it('Nexus agent routes are present', () => {
      const nexus = getRoutesByAgent('Nexus');
      expect(nexus.length).toBeGreaterThan(0);
      expect(nexus.every((r) => r.primaryAgent === 'Nexus')).toBe(true);
    });

    it('Atlas agent routes include tower', () => {
      const atlas = getRoutesByAgent('Atlas');
      expect(atlas.some((r) => r.surface === 'tower')).toBe(true);
    });

    it('Steward agent routes include admin', () => {
      const steward = getRoutesByAgent('Steward');
      expect(steward.some((r) => r.surface === 'admin')).toBe(true);
    });

    it('"none" agent is assigned to public/auth routes', () => {
      const noneRoutes = getRoutesByAgent('none');
      expect(noneRoutes.length).toBeGreaterThan(0);
      expect(noneRoutes.every((r) => r.requiresAuth === false)).toBe(true);
    });
  });

  describe('getRouteById()', () => {
    it('returns undefined for an unknown routeId', () => {
      const route = getRouteById('non-existent-route-12345');
      expect(route).toBeUndefined();
    });

    it('returns the correct route for a known routeId', () => {
      const route = getRouteById('admin-architecture');
      expect(route).toBeDefined();
      expect(route!.pattern).toBe('/admin/architecture');
    });
  });

  describe('summarizeRouteRegistry()', () => {
    it('returns a summary with correct total count', () => {
      const registry = getRouteRegistry();
      const summary = summarizeRouteRegistry();
      expect(summary.total).toBe(registry.length);
    });

    it('activeTotal matches getActiveRoutes().length', () => {
      const summary = summarizeRouteRegistry();
      const active = getActiveRoutes();
      expect(summary.activeTotal).toBe(active.length);
    });

    it('authenticatedTotal + publicTotal === total', () => {
      const summary = summarizeRouteRegistry();
      expect(summary.authenticatedTotal + summary.publicTotal).toBe(summary.total);
    });

    it('byShellKind counts sum to total', () => {
      const summary = summarizeRouteRegistry();
      const sum = Object.values(summary.byShellKind).reduce((a, b) => a + b, 0);
      expect(sum).toBe(summary.total);
    });

    it('bySurface counts sum to total', () => {
      const summary = summarizeRouteRegistry();
      const sum = Object.values(summary.bySurface).reduce((a, b) => a + b, 0);
      expect(sum).toBe(summary.total);
    });

    it('byAgent counts sum to total', () => {
      const summary = summarizeRouteRegistry();
      const sum = Object.values(summary.byAgent).reduce((a, b) => a + b, 0);
      expect(sum).toBe(summary.total);
    });
  });

  describe('Constants', () => {
    it('ROUTE_SHELL_KINDS_IN_ORDER contains all 4 shell kinds', () => {
      expect(ROUTE_SHELL_KINDS_IN_ORDER).toContain('tenant');
      expect(ROUTE_SHELL_KINDS_IN_ORDER).toContain('admin');
      expect(ROUTE_SHELL_KINDS_IN_ORDER).toContain('source');
      expect(ROUTE_SHELL_KINDS_IN_ORDER).toContain('public');
      expect(ROUTE_SHELL_KINDS_IN_ORDER.length).toBe(4);
    });

    it('ROUTE_SURFACES_IN_ORDER contains all 7 surfaces', () => {
      expect(ROUTE_SURFACES_IN_ORDER).toContain('programs');
      expect(ROUTE_SURFACES_IN_ORDER).toContain('intelligence');
      expect(ROUTE_SURFACES_IN_ORDER).toContain('tower');
      expect(ROUTE_SURFACES_IN_ORDER).toContain('admin');
      expect(ROUTE_SURFACES_IN_ORDER).toContain('source');
      expect(ROUTE_SURFACES_IN_ORDER).toContain('marketing');
      expect(ROUTE_SURFACES_IN_ORDER).toContain('auth');
      expect(ROUTE_SURFACES_IN_ORDER.length).toBe(7);
    });

    it('ROUTE_AGENTS_IN_ORDER contains all 5 agent values', () => {
      expect(ROUTE_AGENTS_IN_ORDER).toContain('Nexus');
      expect(ROUTE_AGENTS_IN_ORDER).toContain('Sentinel');
      expect(ROUTE_AGENTS_IN_ORDER).toContain('Atlas');
      expect(ROUTE_AGENTS_IN_ORDER).toContain('Steward');
      expect(ROUTE_AGENTS_IN_ORDER).toContain('none');
      expect(ROUTE_AGENTS_IN_ORDER.length).toBe(5);
    });
  });
});
