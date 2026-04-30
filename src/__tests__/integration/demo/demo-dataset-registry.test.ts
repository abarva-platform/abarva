// DEMODATA1 — Demo Dataset Registry integration tests
// No jsdom, no React. Pure TypeScript assertions.

import {
  listDemoDatasets,
  getDemoDatasetForTenant,
  getSurfaceDataAvailability,
  getDemoRouteRecommendation,
  summarizeDemoDataCoverage,
} from '@/lib/demo/demo-dataset-registry';

describe('demo-dataset-registry', () => {
  // ---------------------------------------------------------------------------
  // listDemoDatasets
  // ---------------------------------------------------------------------------
  describe('listDemoDatasets', () => {
    it('returns 2 tenants', () => {
      expect(listDemoDatasets()).toHaveLength(2);
    });
  });

  // ---------------------------------------------------------------------------
  // getDemoDatasetForTenant
  // ---------------------------------------------------------------------------
  describe('getDemoDatasetForTenant', () => {
    it('apex-retail is non-null with tier rich', () => {
      const d = getDemoDatasetForTenant('apex-retail');
      expect(d).not.toBeNull();
      expect(d!.overallTier).toBe('rich');
    });

    it('meridian is non-null with tier thin', () => {
      const d = getDemoDatasetForTenant('meridian');
      expect(d).not.toBeNull();
      expect(d!.overallTier).toBe('thin');
    });

    it('unknown tenant returns null', () => {
      expect(getDemoDatasetForTenant('unknown')).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // sourceProgramLinkage
  // ---------------------------------------------------------------------------
  describe('sourceProgramLinkage', () => {
    it('apex-retail sourceProgramLinkage is true', () => {
      const d = getDemoDatasetForTenant('apex-retail');
      expect(d!.sourceProgramLinkage).toBe(true);
    });

    it('meridian sourceProgramLinkage is false', () => {
      const d = getDemoDatasetForTenant('meridian');
      expect(d!.sourceProgramLinkage).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // getSurfaceDataAvailability
  // ---------------------------------------------------------------------------
  describe('getSurfaceDataAvailability', () => {
    it('apex-retail programs tier is rich', () => {
      const s = getSurfaceDataAvailability('apex-retail', 'programs');
      expect(s).not.toBeNull();
      expect(s!.tier).toBe('rich');
    });

    it('apex-retail source tier is partial', () => {
      const s = getSurfaceDataAvailability('apex-retail', 'source');
      expect(s).not.toBeNull();
      expect(s!.tier).toBe('partial');
    });

    it('meridian programs tier is not_seeded', () => {
      const s = getSurfaceDataAvailability('meridian', 'programs');
      expect(s).not.toBeNull();
      expect(s!.tier).toBe('not_seeded');
    });

  });

  // ---------------------------------------------------------------------------
  // getDemoRouteRecommendation
  // ---------------------------------------------------------------------------
  describe('getDemoRouteRecommendation', () => {
    it('apex-retail programs contains /tenant/apex-retail/programs', () => {
      const route = getDemoRouteRecommendation('apex-retail', 'programs');
      expect(route).toContain('/tenant/apex-retail/programs');
    });

    it('unknown tenant programs falls back to safe route', () => {
      const route = getDemoRouteRecommendation('unknown', 'programs');
      expect(route).toContain('/tenant/apex-retail/programs');
    });
  });

  // ---------------------------------------------------------------------------
  // summarizeDemoDataCoverage
  // ---------------------------------------------------------------------------
  describe('summarizeDemoDataCoverage', () => {
    it('richTenants is 1', () => {
      expect(summarizeDemoDataCoverage().richTenants).toBe(1);
    });

    it('thinTenants is 1', () => {
      expect(summarizeDemoDataCoverage().thinTenants).toBe(1);
    });

    it('shellOnlyTenants is 0', () => {
      expect(summarizeDemoDataCoverage().shellOnlyTenants).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // deterministicSeed invariant
  // ---------------------------------------------------------------------------
  describe('deterministicSeed invariant', () => {
    it('every surface dataset has deterministicSeed: true', () => {
      for (const tenant of listDemoDatasets()) {
        for (const surface of tenant.surfaces) {
          expect(surface.deterministicSeed).toBe(true);
        }
      }
    });
  });
});
