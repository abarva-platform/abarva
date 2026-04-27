/**
 * WIRE2B — Wireframe Compliance TypeScript QA Module Tests
 *
 * Pure TypeScript Jest tests. No jsdom. No React rendering.
 * No fs.readFileSync of source files in tests.
 * All assertions are deterministic — same result every run.
 *
 * W32QA update: expectations updated to reflect Wave 32 score improvements.
 * Before: avgScore 69.5, safeFixesApplied 6, 21 remaining deviations
 * After:  avgScore 74.4, safeFixesApplied 13, remaining deviations reduced
 *
 * wave-admin-redesign update (ADMIN7): admin tree pages rebuilt on
 * AdminCanonShellV2; scores raised — Admin 72→92, Production Readiness 80→92,
 * Architecture 58→90; safeFixesApplied 13 → 15 (only honest deltas applied).
 */

import {
  getPageComplianceResults,
  getPageComplianceResult,
  getWireframeComplianceSummary,
  getDeviationsByDimension,
  getHighSeverityDeviations,
  getPagesRequiringWave32,
  getRecommendedNextSlices,
  ComplianceDimension,
  ComplianceStatus,
  ComplianceSeverity,
  ComplianceDeviation,
} from '../../../lib/qa/wireframe-compliance-audit';

const ALL_DIMENSIONS: ComplianceDimension[] = [
  'route_ownership',
  'five_question_test',
  'zone_composition',
  'agent_centric',
  'workflow_canon',
  'data_contract',
  'interaction_map',
  'design_canon',
];

const VALID_STATUSES: ComplianceStatus[] = ['pass', 'partial', 'fail'];
const VALID_SEVERITIES: ComplianceSeverity[] = ['high', 'medium', 'low'];

// ---------------------------------------------------------------------------
// getPageComplianceResults
// ---------------------------------------------------------------------------

describe('wireframe-compliance-audit', () => {
  describe('getPageComplianceResults', () => {
    it('returns results for all 8 target pages', () => {
      const results = getPageComplianceResults();
      expect(results).toHaveLength(8);
    });

    it('every result has a score between 0 and 100', () => {
      const results = getPageComplianceResults();
      results.forEach((r) => {
        expect(r.overallScore).toBeGreaterThanOrEqual(0);
        expect(r.overallScore).toBeLessThanOrEqual(100);
      });
    });

    it('every result has a status of pass, partial, or fail', () => {
      const results = getPageComplianceResults();
      results.forEach((r) => {
        expect(VALID_STATUSES).toContain(r.status);
      });
    });

    it('every result has deterministicSeed: true', () => {
      const results = getPageComplianceResults();
      results.forEach((r) => {
        expect(r.deterministicSeed).toBe(true);
      });
    });

    it('every result has a non-empty route', () => {
      const results = getPageComplianceResults();
      results.forEach((r) => {
        expect(typeof r.route).toBe('string');
        expect(r.route.length).toBeGreaterThan(0);
        expect(r.route.startsWith('/')).toBe(true);
      });
    });

    it('every result has a non-empty routeFile', () => {
      const results = getPageComplianceResults();
      results.forEach((r) => {
        expect(typeof r.routeFile).toBe('string');
        expect(r.routeFile.length).toBeGreaterThan(0);
        expect(r.routeFile.endsWith('page.tsx')).toBe(true);
      });
    });

    it('every result has a non-empty page label', () => {
      const results = getPageComplianceResults();
      results.forEach((r) => {
        expect(typeof r.page).toBe('string');
        expect(r.page.length).toBeGreaterThan(0);
      });
    });

    it('every result has all 8 dimension scores', () => {
      const results = getPageComplianceResults();
      results.forEach((r) => {
        ALL_DIMENSIONS.forEach((dim) => {
          expect(r.dimensionScores).toHaveProperty(dim);
          expect(typeof r.dimensionScores[dim]).toBe('number');
          expect(r.dimensionScores[dim]).toBeGreaterThanOrEqual(0);
          expect(r.dimensionScores[dim]).toBeLessThanOrEqual(100);
        });
      });
    });

    it('no result claims production_ready', () => {
      const results = getPageComplianceResults();
      results.forEach((r) => {
        // production_ready is not a field on PageComplianceResult
        expect((r as unknown as Record<string, unknown>)['production_ready']).toBeUndefined();
      });
    });

    it('no result has a score of 100 (no page is perfect)', () => {
      const results = getPageComplianceResults();
      results.forEach((r) => {
        expect(r.overallScore).toBeLessThan(100);
      });
    });

    it('every result has a deviations array', () => {
      const results = getPageComplianceResults();
      results.forEach((r) => {
        expect(Array.isArray(r.deviations)).toBe(true);
      });
    });

    it('every deviation has a valid dimension', () => {
      const results = getPageComplianceResults();
      results.forEach((r) => {
        r.deviations.forEach((d) => {
          expect(ALL_DIMENSIONS).toContain(d.dimension);
        });
      });
    });

    it('every deviation has a valid severity', () => {
      const results = getPageComplianceResults();
      results.forEach((r) => {
        r.deviations.forEach((d) => {
          expect(VALID_SEVERITIES).toContain(d.severity);
        });
      });
    });

    it('every deviation has a non-empty description', () => {
      const results = getPageComplianceResults();
      results.forEach((r) => {
        r.deviations.forEach((d) => {
          expect(typeof d.description).toBe('string');
          expect(d.description.length).toBeGreaterThan(0);
        });
      });
    });

    it('every deviation has a boolean safeFixApplied field', () => {
      const results = getPageComplianceResults();
      results.forEach((r) => {
        r.deviations.forEach((d) => {
          expect(typeof d.safeFixApplied).toBe('boolean');
        });
      });
    });

    it('every result has a valid auditedAt date string', () => {
      const results = getPageComplianceResults();
      results.forEach((r) => {
        expect(typeof r.auditedAt).toBe('string');
        expect(r.auditedAt.length).toBeGreaterThan(0);
        // ISO date or date-like string
        expect(r.auditedAt).toMatch(/^\d{4}-\d{2}-\d{2}/);
      });
    });

    it('the 8 expected routes are all present', () => {
      const results = getPageComplianceResults();
      const routes = results.map((r) => r.route);
      // ADMIN8 — admin tree consolidated under /admin/* (legacy /platform/admin/* now redirects).
      expect(routes).toContain('/admin');
      expect(routes).toContain('/admin/production-readiness');
      expect(routes).toContain('/admin/architecture');
      expect(routes).toContain('/tenant/[tenantSlug]/programs');
      expect(routes).toContain('/tenant/[tenantSlug]/programs/[programSlug]');
      expect(routes).toContain('/source/events/[eventId]');
      expect(routes).toContain('/tenant/[tenantSlug]/intelligence');
      expect(routes).toContain('/tenant/[tenantSlug]/tower');
    });

    it('returns a new array each call (no shared mutable reference)', () => {
      const a = getPageComplianceResults();
      const b = getPageComplianceResults();
      expect(a).not.toBe(b);
    });

    it('Architecture page is at 90 after ADMIN4 (was 58 in WIRE2)', () => {
      const results = getPageComplianceResults();
      const arch = results.find((r) => r.route === '/admin/architecture');
      expect(arch).toBeDefined();
      expect(arch!.overallScore).toBe(90);
    });

    it('Intelligence page held at 84 after Wave 32', () => {
      const results = getPageComplianceResults();
      const intel = results.find((r) => r.route === '/tenant/[tenantSlug]/intelligence');
      expect(intel).toBeDefined();
      expect(intel!.overallScore).toBe(84);
    });

    it('Wave 32 score improvements: Programs Index 68 → 76', () => {
      const result = getPageComplianceResult('/tenant/[tenantSlug]/programs');
      expect(result!.overallScore).toBe(76);
    });

    it('Wave 32 score improvements: Control Tower 75 → 82', () => {
      const result = getPageComplianceResult('/tenant/[tenantSlug]/tower');
      expect(result!.overallScore).toBe(82);
    });

    it('wave-admin-redesign: Production Readiness 80 → 92', () => {
      const result = getPageComplianceResult('/admin/production-readiness');
      expect(result!.overallScore).toBe(92);
    });

    it('wave-admin-redesign: Admin 72 → 92', () => {
      const result = getPageComplianceResult('/admin');
      expect(result!.overallScore).toBe(92);
    });

    it('wave-admin-redesign: Architecture 58 → 90', () => {
      const result = getPageComplianceResult('/admin/architecture');
      expect(result!.overallScore).toBe(90);
    });
  });

  // -------------------------------------------------------------------------
  // getPageComplianceResult
  // -------------------------------------------------------------------------

  describe('getPageComplianceResult', () => {
    it('returns the correct result for a known route', () => {
      const result = getPageComplianceResult('/admin');
      expect(result).not.toBeNull();
      expect(result!.page).toBe('Admin');
      expect(result!.overallScore).toBe(92);
    });

    it('returns null for an unknown route', () => {
      const result = getPageComplianceResult('/nonexistent/route');
      expect(result).toBeNull();
    });

    it('returns null for the legacy /platform/admin path (ADMIN8 consolidated to /admin)', () => {
      const result = getPageComplianceResult('/platform/admin');
      expect(result).toBeNull();
    });

    it('returns a copy (not a shared reference)', () => {
      const a = getPageComplianceResult('/admin');
      const b = getPageComplianceResult('/admin');
      expect(a).not.toBe(b);
    });
  });

  // -------------------------------------------------------------------------
  // getWireframeComplianceSummary
  // -------------------------------------------------------------------------

  describe('getWireframeComplianceSummary', () => {
    it('totalPages is 8', () => {
      const summary = getWireframeComplianceSummary();
      expect(summary.totalPages).toBe(8);
    });

    it('passing + partial + failing equals totalPages', () => {
      const summary = getWireframeComplianceSummary();
      expect(summary.passing + summary.partial + summary.failing).toBe(summary.totalPages);
    });

    it('avgScore is between 0 and 100', () => {
      const summary = getWireframeComplianceSummary();
      expect(summary.avgScore).toBeGreaterThanOrEqual(0);
      expect(summary.avgScore).toBeLessThanOrEqual(100);
    });

    it('highSeverityDeviations is >= 0', () => {
      const summary = getWireframeComplianceSummary();
      expect(summary.highSeverityDeviations).toBeGreaterThanOrEqual(0);
    });

    it('safeFixesApplied equals 15 after wave-admin-redesign fixes (was 13 after W32)', () => {
      const summary = getWireframeComplianceSummary();
      expect(summary.safeFixesApplied).toBe(15);
    });

    it('createdFrom is wire2b_wireframe_compliance_ts', () => {
      const summary = getWireframeComplianceSummary();
      expect(summary.createdFrom).toBe('wire2b_wireframe_compliance_ts');
    });

    it('three admin pages are in the passing bucket after wave-admin-redesign', () => {
      const summary = getWireframeComplianceSummary();
      expect(summary.passing).toBe(3);
    });

    it('no page is in the failing bucket after wave-admin-redesign (Architecture was 58 → 90)', () => {
      const summary = getWireframeComplianceSummary();
      expect(summary.failing).toBe(0);
    });

    it('five remaining pages are in the partial bucket (scores 60–89)', () => {
      const summary = getWireframeComplianceSummary();
      expect(summary.partial).toBe(5);
    });

    it('remainingDeviations is a non-negative integer', () => {
      const summary = getWireframeComplianceSummary();
      expect(summary.remainingDeviations).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(summary.remainingDeviations)).toBe(true);
    });

    it('highSeverityDeviations + mediumSeverityDeviations + lowSeverityDeviations equals total deviations', () => {
      const summary = getWireframeComplianceSummary();
      const total =
        summary.highSeverityDeviations +
        summary.mediumSeverityDeviations +
        summary.lowSeverityDeviations;
      const allDeviations = getPageComplianceResults().flatMap((r) => r.deviations);
      expect(total).toBe(allDeviations.length);
    });

    it('safeFixesApplied + remainingDeviations equals total deviations', () => {
      const summary = getWireframeComplianceSummary();
      const allDeviations = getPageComplianceResults().flatMap((r) => r.deviations);
      expect(summary.safeFixesApplied + summary.remainingDeviations).toBe(allDeviations.length);
    });
  });

  // -------------------------------------------------------------------------
  // getDeviationsByDimension
  // -------------------------------------------------------------------------

  describe('getDeviationsByDimension', () => {
    it('returns array for each valid dimension', () => {
      ALL_DIMENSIONS.forEach((dim) => {
        const deviations = getDeviationsByDimension(dim);
        expect(Array.isArray(deviations)).toBe(true);
      });
    });

    it('returns empty array for nonexistent dimension cast', () => {
      const deviations = getDeviationsByDimension('nonexistent' as ComplianceDimension);
      expect(deviations).toEqual([]);
    });

    it('all returned deviations match the requested dimension', () => {
      ALL_DIMENSIONS.forEach((dim) => {
        const deviations = getDeviationsByDimension(dim);
        deviations.forEach((d) => {
          expect(d.dimension).toBe(dim);
        });
      });
    });

    it('design_canon dimension has at least one deviation', () => {
      const deviations = getDeviationsByDimension('design_canon');
      expect(deviations.length).toBeGreaterThan(0);
    });

    it('agent_centric dimension has at least one deviation', () => {
      const deviations = getDeviationsByDimension('agent_centric');
      expect(deviations.length).toBeGreaterThan(0);
    });
  });

  // -------------------------------------------------------------------------
  // getHighSeverityDeviations
  // -------------------------------------------------------------------------

  describe('getHighSeverityDeviations', () => {
    it('returns only high severity deviations', () => {
      const deviations = getHighSeverityDeviations();
      expect(deviations.length).toBeGreaterThan(0);
    });

    it('every returned deviation has severity high', () => {
      const deviations = getHighSeverityDeviations();
      deviations.forEach((d: ComplianceDeviation) => {
        expect(d.severity).toBe('high');
      });
    });

    it('count matches highSeverityDeviations in summary', () => {
      const deviations = getHighSeverityDeviations();
      const summary = getWireframeComplianceSummary();
      expect(deviations.length).toBe(summary.highSeverityDeviations);
    });

    it('all high-severity deviations had safe fixes applied (WIRE2 addressed all HIGH items)', () => {
      const deviations = getHighSeverityDeviations();
      deviations.forEach((d) => {
        expect(d.safeFixApplied).toBe(true);
      });
    });
  });

  // -------------------------------------------------------------------------
  // getPagesRequiringWave32
  // -------------------------------------------------------------------------

  describe('getPagesRequiringWave32', () => {
    it('returns only pages with score below 90', () => {
      const pages = getPagesRequiringWave32();
      pages.forEach((r) => {
        expect(r.overallScore).toBeLessThan(90);
      });
    });

    it('all returned pages have at least one remaining deviation', () => {
      const pages = getPagesRequiringWave32();
      pages.forEach((r) => {
        const remaining = r.deviations.filter((d) => !d.safeFixApplied);
        expect(remaining.length).toBeGreaterThan(0);
      });
    });

    it('returns 5 pages after wave-admin-redesign (3 admin pages now >= 90)', () => {
      const pages = getPagesRequiringWave32();
      expect(pages).toHaveLength(5);
    });

    it('returns a new array each call', () => {
      const a = getPagesRequiringWave32();
      const b = getPagesRequiringWave32();
      expect(a).not.toBe(b);
    });
  });

  // -------------------------------------------------------------------------
  // getRecommendedNextSlices
  // -------------------------------------------------------------------------

  describe('getRecommendedNextSlices', () => {
    it('returns a non-empty array', () => {
      const slices = getRecommendedNextSlices();
      expect(Array.isArray(slices)).toBe(true);
      expect(slices.length).toBeGreaterThan(0);
    });

    it('every entry is a non-empty string', () => {
      const slices = getRecommendedNextSlices();
      slices.forEach((s) => {
        expect(typeof s).toBe('string');
        expect(s.length).toBeGreaterThan(0);
      });
    });

    it('no duplicates', () => {
      const slices = getRecommendedNextSlices();
      const unique = new Set(slices);
      expect(unique.size).toBe(slices.length);
    });

    it('Wave 32 is in the recommended slices', () => {
      const slices = getRecommendedNextSlices();
      expect(slices).toContain('Wave 32');
    });

    it('Wave 33 is in the recommended slices', () => {
      const slices = getRecommendedNextSlices();
      expect(slices).toContain('Wave 33');
    });
  });
});
