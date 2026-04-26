// LIVE2 - Demo Tenant Route Verification Tests
//
// Deterministic, file-pure Jest suite for the demo tenant route manifest.
// No network calls, no file I/O beyond the import, no timers.

import {
  buildDemoTenantRouteManifest,
  type TenantRouteValidationStatus,
  type TenantRouteRecord,
  type DemoTenantRouteManifest,
} from '../../../lib/qa/demo-tenant-route-verification';

const VALID_STATUSES: TenantRouteValidationStatus[] = [
  'verified',
  'needs_review',
  'deferred',
  'not_run',
];

describe('buildDemoTenantRouteManifest()', () => {
  let manifest: DemoTenantRouteManifest;

  beforeAll(() => {
    manifest = buildDemoTenantRouteManifest();
  });

  // -------------------------------------------------------------------------
  // Shape & schema
  // -------------------------------------------------------------------------

  it('returns a valid manifest object', () => {
    expect(manifest).toBeDefined();
    expect(typeof manifest).toBe('object');
  });

  it('has schemaVersion 1', () => {
    expect(manifest.schemaVersion).toBe(1);
  });

  it('has generatedAt of "2026-04-26"', () => {
    expect(manifest.generatedAt).toBe('2026-04-26');
  });

  it('tenants array includes "apex-retail"', () => {
    expect(manifest.tenants).toContain('apex-retail');
  });

  it('tenants array includes "meridian"', () => {
    expect(manifest.tenants).toContain('meridian');
  });

  // -------------------------------------------------------------------------
  // Derived counts
  // -------------------------------------------------------------------------

  it('totalRoutes equals routes.length', () => {
    expect(manifest.totalRoutes).toBe(manifest.routes.length);
  });

  it('verifiedRoutes equals count of routes with validationStatus "verified"', () => {
    const count = manifest.routes.filter((r) => r.validationStatus === 'verified').length;
    expect(manifest.verifiedRoutes).toBe(count);
  });

  it('deferredRoutes equals count of routes with validationStatus "deferred"', () => {
    const count = manifest.routes.filter((r) => r.validationStatus === 'deferred').length;
    expect(manifest.deferredRoutes).toBe(count);
  });

  // -------------------------------------------------------------------------
  // Per-route field validation
  // -------------------------------------------------------------------------

  it('every route has a non-empty tenantSlug', () => {
    manifest.routes.forEach((r: TenantRouteRecord) => {
      expect(r.tenantSlug).toBeTruthy();
    });
  });

  it('every route has a non-empty route string', () => {
    manifest.routes.forEach((r: TenantRouteRecord) => {
      expect(r.route).toBeTruthy();
    });
  });

  it('every route has a non-empty expectedComponent', () => {
    manifest.routes.forEach((r: TenantRouteRecord) => {
      expect(r.expectedComponent).toBeTruthy();
    });
  });

  it('every route has a non-empty expectedReadModel', () => {
    manifest.routes.forEach((r: TenantRouteRecord) => {
      expect(r.expectedReadModel).toBeTruthy();
    });
  });

  it('every route has a valid TenantRouteValidationStatus', () => {
    manifest.routes.forEach((r: TenantRouteRecord) => {
      expect(VALID_STATUSES).toContain(r.validationStatus);
    });
  });

  it('every route has a non-empty fallbackRoute', () => {
    manifest.routes.forEach((r: TenantRouteRecord) => {
      expect(r.fallbackRoute).toBeTruthy();
    });
  });

  it('every route has a non-empty knownCaveat', () => {
    manifest.routes.forEach((r: TenantRouteRecord) => {
      expect(r.knownCaveat).toBeTruthy();
    });
  });

  it('all route strings start with "/"', () => {
    manifest.routes.forEach((r: TenantRouteRecord) => {
      expect(r.route.startsWith('/')).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Tenant coverage
  // -------------------------------------------------------------------------

  it('apex-retail has at least 5 routes', () => {
    const apexRoutes = manifest.routes.filter((r) => r.tenantSlug === 'apex-retail');
    expect(apexRoutes.length).toBeGreaterThanOrEqual(5);
  });

  it('meridian has at least 2 routes', () => {
    const meridianRoutes = manifest.routes.filter((r) => r.tenantSlug === 'meridian');
    expect(meridianRoutes.length).toBeGreaterThanOrEqual(2);
  });

  // -------------------------------------------------------------------------
  // Uniqueness
  // -------------------------------------------------------------------------

  it('has no duplicate (tenantSlug + route) pairs', () => {
    const seen = new Set<string>();
    const duplicates: string[] = [];
    manifest.routes.forEach((r: TenantRouteRecord) => {
      const key = `${r.tenantSlug}::${r.route}`;
      if (seen.has(key)) {
        duplicates.push(key);
      }
      seen.add(key);
    });
    expect(duplicates).toHaveLength(0);
  });

  // -------------------------------------------------------------------------
  // Determinism — calling builder twice yields same result
  // -------------------------------------------------------------------------

  it('is deterministic across two calls', () => {
    const second = buildDemoTenantRouteManifest();
    expect(second.totalRoutes).toBe(manifest.totalRoutes);
    expect(second.verifiedRoutes).toBe(manifest.verifiedRoutes);
    expect(second.deferredRoutes).toBe(manifest.deferredRoutes);
    expect(second.generatedAt).toBe(manifest.generatedAt);
    expect(second.routes.length).toBe(manifest.routes.length);
  });
});
