import { buildRouteShellDesignVerificationReport } from '@/lib/qa/route-shell-design-verification';

describe('QA26 route-shell-design-verification', () => {
  it('covers all target routes', () => {
    const report = buildRouteShellDesignVerificationReport();
    expect(report.targetRoutes).toHaveLength(9);
    const patterns = report.targetRoutes.map((route) => route.routePattern);
    expect(patterns).toEqual(
      expect.arrayContaining([
        '/platform/admin',
        '/platform/admin/architecture',
        '/platform/admin/production-readiness',
        '/platform/admin/build-progress',
        '/source',
        '/source/events',
        '/source/events/[eventId]',
        '/tenant/[tenantSlug]/programs',
        '/tenant/[tenantSlug]/programs/[programSlug]',
      ]),
    );
  });

  it('includes shell compliance status and surfaces legacy findings', () => {
    const report = buildRouteShellDesignVerificationReport();
    report.targetRoutes.forEach((route) => {
      expect(route.shellComplianceStatus).toMatch(
        /^(compliant|partial|legacy|noncompliant|missing)$/,
      );
      expect(route.requiredCanonicalShellMarkers.length).toBeGreaterThan(0);
    });
  });

  it('noncompliant routes are deferred explicitly', () => {
    const report = buildRouteShellDesignVerificationReport();
    const unresolved = report.targetRoutes.filter(
      (route) =>
        route.shellComplianceStatus !== 'compliant' && !route.deferredReason,
    );
    expect(unresolved).toHaveLength(0);
  });

  it('source commercial route mount and key admin route presence are checked', () => {
    const report = buildRouteShellDesignVerificationReport();
    const eventRoute = report.targetRoutes.find(
      (route) => route.routePattern === '/source/events/[eventId]',
    );
    const architectureRoute = report.targetRoutes.find(
      (route) => route.routePattern === '/platform/admin/architecture',
    );
    const productionRoute = report.targetRoutes.find(
      (route) => route.routePattern === '/platform/admin/production-readiness',
    );

    expect(eventRoute).toBeDefined();
    expect(eventRoute?.routeExists).toBe(true);
    expect(typeof eventRoute?.mountedCommercialSurface).toBe('boolean');
    expect(architectureRoute?.routeExists).toBe(true);
    expect(productionRoute?.routeExists).toBe(true);
  });

  it('report remains deterministic', () => {
    const first = buildRouteShellDesignVerificationReport();
    const second = buildRouteShellDesignVerificationReport();
    expect(second).toEqual(first);
  });
});

