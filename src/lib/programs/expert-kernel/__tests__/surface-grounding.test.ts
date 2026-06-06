// Surface grounding — the shared seam any agent surface uses to inherit curated
// Domain Function Pack depth. Proves every catalogued (industry, function) cell
// grounds, the hero packs carry the own-it posture, and an unknown identity
// returns an honest unbound result (never fabricated depth).

import { listFunctionPackCoverage } from '../domain/function-pack-registry';
import {
  groundSurfaceContext,
  type SurfaceGrounding,
} from '../grounding/surface-grounding';

const INDUSTRY_CODE: Record<string, string> = {
  'healthcare-provider': 'healthcare_idn',
  retail: 'retail',
  'financial-services': 'finserv',
};

describe('groundSurfaceContext (shared surface grounding seam)', () => {
  it('grounds every catalogued (industry, function) cell with real depth', () => {
    const cells = listFunctionPackCoverage();
    expect(cells.length).toBeGreaterThanOrEqual(24);
    for (const cell of cells) {
      const g = groundSurfaceContext({
        industryCode: INDUSTRY_CODE[cell.industryKey],
        functionPackKey: String(cell.functionKey),
      });
      expect(g.bound).toBe(true);
      const sg = g as SurfaceGrounding;
      expect(sg.functionLabel).toBe(cell.functionLabel);
      expect(sg.operatingMetrics.length).toBeGreaterThanOrEqual(10);
      expect(sg.vocabulary.length).toBeGreaterThan(0);
      expect(sg.painThemes.length).toBeGreaterThanOrEqual(6);
    }
  });

  it('returns an honest unbound result for an unknown identity', () => {
    const g = groundSurfaceContext({
      industryCode: 'nonexistent_industry',
      functionPackKey: 'nonexistent_function',
    });
    expect(g.bound).toBe(false);
    if (!g.bound) {
      expect(g.fallbackNote).toMatch(/fall back|curated-depth gap|not.*fabricat/i);
    }
  });

  it('surfaces the own-it posture for the enriched healthcare hero packs', () => {
    for (const fn of [
      'population_health_value_based_care',
      'clinical_operations_documentation',
      'payer_claims_operations',
    ]) {
      const g = groundSurfaceContext({
        industryCode: 'healthcare_idn',
        functionPackKey: fn,
      });
      expect(g.bound).toBe(true);
      const sg = g as SurfaceGrounding;
      expect(
        sg.ownItPosture.hasRentedIntelligenceTheme ||
          sg.ownItPosture.hasOwnershipAnchor,
      ).toBe(true);
    }
  });
});
