// Surface grounding — the shared seam any agent surface uses to inherit curated
// Domain Function Pack depth. Proves every catalogued (industry, function) cell
// grounds, the hero packs carry the own-it posture, and an unknown identity
// returns an honest unbound result (never fabricated depth).

import { listFunctionPackCoverage } from '../domain/function-pack-registry';
import {
  groundSurfaceContext,
  groundTenantPortfolio,
  type SurfaceGrounding,
} from '../grounding/surface-grounding';

const INDUSTRY_CODE: Record<string, string> = {
  'healthcare-provider': 'healthcare_idn',
  retail: 'retail',
  'financial-services': 'finserv',
  airline: 'global_network_airline',
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

describe('groundTenantPortfolio (cross-function / Atlas-Tower grounding)', () => {
  it('aggregates curated depth across a portfolio of functions', () => {
    const portfolio = groundTenantPortfolio({
      industryCode: 'healthcare_idn',
      functionKeys: [
        'population_health_value_based_care',
        'clinical_operations_documentation',
        'payer_claims_operations',
      ],
    });
    expect(portfolio.groundedFunctions.length).toBe(3);
    expect(portfolio.unboundFunctions.length).toBe(0);
    expect(portfolio.industryKey).toBe('healthcare-provider');
    // Union of metrics across 3 packs (>=10 each) must exceed any single pack.
    expect(portfolio.allMetrics.length).toBeGreaterThan(10);
    expect(portfolio.allRegulatoryFrames.length).toBeGreaterThan(0);
    // The own-it discipline is present somewhere in the portfolio.
    expect(
      portfolio.ownItPosture.hasRentedIntelligenceTheme ||
        portfolio.ownItPosture.hasOwnershipAnchor,
    ).toBe(true);
  });

  it('surfaces unbound functions honestly without dropping the grounded ones', () => {
    const portfolio = groundTenantPortfolio({
      industryCode: 'healthcare_idn',
      functionKeys: ['population_health_value_based_care', 'nonexistent_function'],
    });
    expect(portfolio.groundedFunctions.length).toBe(1);
    expect(portfolio.unboundFunctions.length).toBe(1);
    expect(portfolio.unboundFunctions[0].functionKey).toBe('nonexistent_function');
  });
});
