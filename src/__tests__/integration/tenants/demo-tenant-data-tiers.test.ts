// SHELL3 — Demo Tenant Data Tiers integration tests
// No jsdom, no React. Pure TypeScript / Node test.

import {
  listDemoTenantDataTiers,
  getDemoTenantDataTier,
  getSurfaceAvailability,
  getTenantRouteFallback,
  type DemoSurface,
} from '@/lib/tenants/demo-tenant-data-tiers';

describe('listDemoTenantDataTiers', () => {
  it('returns exactly 2 tenants', () => {
    const tiers = listDemoTenantDataTiers();
    expect(tiers).toHaveLength(2);
  });

  it('apex-retail richness is rich', () => {
    const tiers = listDemoTenantDataTiers();
    const apex = tiers.find((t) => t.tenantSlug === 'apex-retail');
    expect(apex?.richness).toBe('rich');
  });

  it('meridian richness is thin', () => {
    const tiers = listDemoTenantDataTiers();
    const meridian = tiers.find((t) => t.tenantSlug === 'meridian');
    expect(meridian?.richness).toBe('thin');
  });

});

describe('getDemoTenantDataTier', () => {
  it('returns non-null for apex-retail', () => {
    expect(getDemoTenantDataTier('apex-retail')).not.toBeNull();
  });

  it('returns null for unknown-tenant', () => {
    expect(getDemoTenantDataTier('unknown-tenant')).toBeNull();
  });

  it('apex-retail programs surface availability is full', () => {
    const tier = getDemoTenantDataTier('apex-retail');
    const programs = tier?.surfaces.find((s) => s.surface === 'programs');
    expect(programs?.availability).toBe('full');
  });

  it('apex-retail sourceProgramLinkage is true', () => {
    const tier = getDemoTenantDataTier('apex-retail');
    expect(tier?.sourceProgramLinkage).toBe(true);
  });

  it('meridian programs availability is not_seeded', () => {
    const tier = getDemoTenantDataTier('meridian');
    const programs = tier?.surfaces.find((s) => s.surface === 'programs');
    expect(programs?.availability).toBe('not_seeded');
  });

  it('meridian sourceProgramLinkage is false', () => {
    const tier = getDemoTenantDataTier('meridian');
    expect(tier?.sourceProgramLinkage).toBe(false);
  });
});

describe('getSurfaceAvailability', () => {
  it('returns non-null for apex-retail source surface', () => {
    expect(getSurfaceAvailability('apex-retail', 'source')).not.toBeNull();
  });

  it('returns null for unknown tenant', () => {
    expect(getSurfaceAvailability('not-a-tenant', 'programs')).toBeNull();
  });
});

describe('getTenantRouteFallback', () => {
  const surfaces: DemoSurface[] = ['programs', 'source', 'intelligence', 'control_tower', 'admin'];

  it('returns a string for all apex-retail surfaces', () => {
    for (const surface of surfaces) {
      const result = getTenantRouteFallback('apex-retail', surface);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    }
  });

  it('returns a string for all meridian surfaces', () => {
    for (const surface of surfaces) {
      const result = getTenantRouteFallback('meridian', surface);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    }
  });

  it('returns safe fallback for unknown tenant', () => {
    const result = getTenantRouteFallback('unknown-tenant', 'programs');
    expect(result).toBe('/tenant/apex-retail/programs');
  });

  it('returns routeHint when available (apex-retail programs)', () => {
    const result = getTenantRouteFallback('apex-retail', 'programs');
    expect(result).toBe('/tenant/apex-retail/programs');
  });
});

describe('caveat completeness', () => {
  it('no caveat string is empty', () => {
    const tiers = listDemoTenantDataTiers();
    for (const tier of tiers) {
      for (const surface of tier.surfaces) {
        expect(surface.caveat.trim().length).toBeGreaterThan(0);
      }
    }
  });
});
