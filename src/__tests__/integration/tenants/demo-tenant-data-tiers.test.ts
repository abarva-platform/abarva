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
  it('returns exactly 3 tenants', () => {
    const tiers = listDemoTenantDataTiers();
    expect(tiers).toHaveLength(3);
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

  it('arcturus richness is shell_only', () => {
    const tiers = listDemoTenantDataTiers();
    const arcturus = tiers.find((t) => t.tenantSlug === 'arcturus');
    expect(arcturus?.richness).toBe('shell_only');
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

  it('returns non-null for arcturus programs (shows unavailable)', () => {
    const state = getSurfaceAvailability('arcturus', 'programs');
    expect(state).not.toBeNull();
    expect(state?.availability).toBe('unavailable');
  });

  it('returns null for unknown tenant', () => {
    expect(getSurfaceAvailability('not-a-tenant', 'programs')).toBeNull();
  });
});

describe('getTenantRouteFallback', () => {
  const surfaces: DemoSurface[] = ['programs', 'source', 'intelligence', 'control_tower', 'admin'];

  // Suppress the structured `console.error` logging that the fallback emits
  // when it's called for an unknown tenant — the tests intentionally exercise
  // that path. We assert on the call separately below.
  let errorSpy: jest.SpyInstance;
  beforeEach(() => {
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    errorSpy.mockRestore();
  });

  it('returns the apex-retail routeHint for apex-retail seeded surfaces', () => {
    for (const surface of surfaces) {
      const result = getTenantRouteFallback('apex-retail', surface);
      // Apex is fully seeded — every surface has a routeHint.
      expect(typeof result).toBe('string');
      expect((result as string).startsWith('/')).toBe(true);
      // Tenant-scoped surfaces must mention apex (programs/source/intel/tower);
      // the platform admin route is /platform/admin and intentionally global.
      if (surface !== 'admin') {
        expect(result).toMatch(/apex/);
      }
    }
  });

  it('returns null for meridian surfaces that have no routeHint (not_seeded / unavailable)', () => {
    // Meridian is intentionally thin — programs / source / tower / admin have
    // no routeHint. The honest answer is null, NOT another tenant's URL.
    expect(getTenantRouteFallback('meridian', 'programs')).toBeNull();
    expect(getTenantRouteFallback('meridian', 'source')).toBeNull();
    expect(getTenantRouteFallback('meridian', 'control_tower')).toBeNull();
    expect(getTenantRouteFallback('meridian', 'admin')).toBeNull();
  });

  it('returns null for every arcturus surface (shell-only tenant)', () => {
    for (const surface of surfaces) {
      const result = getTenantRouteFallback('arcturus', surface);
      // Arcturus is shell-only with no routeHints at all.
      expect(result).toBeNull();
    }
  });

  // P0-2 (synthetic pilot rehearsal 2026-05-22): cross-tenant routing
  // fallback. An unknown tenant key MUST NOT receive another tenant's URL
  // as a default. Honest empty, never another tenant's content.
  it('P0-2: returns null for unknown tenant (does not route to apex-retail)', () => {
    const result = getTenantRouteFallback('unknown-tenant', 'programs');
    // Defense in depth: assert null AND that result is not a string containing
    // another tenant's URL. The class of bug we're guarding against is
    // returning ANY cross-tenant URL, so equality with null is the only
    // acceptable answer.
    expect(result).toBeNull();
    expect(typeof result).not.toBe('string');
  });

  it('P0-2: returns null for the synthetic pilot key "northwind" until it is seeded', () => {
    // Concrete regression guard for the rehearsal scenario logged in
    // docs/pilot/SYNTHETIC-PILOT-REHEARSAL-LOG.md.
    expect(getTenantRouteFallback('northwind', 'admin')).toBeNull();
    expect(getTenantRouteFallback('northwind', 'source')).toBeNull();
    expect(getTenantRouteFallback('northwind', 'intelligence')).toBeNull();
  });

  it('P0-2: logs a structured server-side event when called for an unknown tenant', () => {
    getTenantRouteFallback('unknown-tenant', 'programs');
    expect(errorSpy).toHaveBeenCalledWith(
      '[tenant-routing] getTenantRouteFallback called for unknown tenant',
      expect.stringContaining('"tenantSlug":"unknown-tenant"'),
    );
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
