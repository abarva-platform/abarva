// SRC43 · Pricing completeness drilldown.
//
// Verifies structural invariants added in SRC43:
//   1. SourceEventDetailPage imports buildPricingCompletenessView
//   2. PricingCompletenessDrilldown component is present with correct testids
//   3. Per-vendor and cross-vendor gap testids are present in the source
//   4. Honest disclaimer is present with correct testid and data attribute
//   5. pricing-completeness-view lib is deterministic and contract-correct

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildPricingCompletenessView } from '@/lib/source/pricing-completeness-view';

const PAGE_PATH = join(
  process.cwd(),
  'src/components/source/SourceEventDetailPage.tsx',
);
const LIB_PATH = join(
  process.cwd(),
  'src/lib/source/pricing-completeness-view.ts',
);

const src = readFileSync(PAGE_PATH, 'utf8');
const libSrc = readFileSync(LIB_PATH, 'utf8');

// ─── SourceEventDetailPage · imports ─────────────────────────────────────────

describe('SRC43 · SourceEventDetailPage · imports', () => {
  it('imports buildPricingCompletenessView', () => {
    expect(src).toContain("from '@/lib/source/pricing-completeness-view'");
  });

  it('calls buildPricingCompletenessView()', () => {
    expect(src).toContain('buildPricingCompletenessView()');
  });
});

// ─── SourceEventDetailPage · PricingCompletenessDrilldown component ──────────

describe('SRC43 · SourceEventDetailPage · PricingCompletenessDrilldown', () => {
  it('defines PricingCompletenessDrilldown function', () => {
    expect(src).toContain('function PricingCompletenessDrilldown()');
  });

  it('renders PricingCompletenessDrilldown in PricingNormalizationTab', () => {
    expect(src).toContain('<PricingCompletenessDrilldown />');
  });

  it('has data-testid="pricing-completeness-drilldown"', () => {
    expect(src).toContain('data-testid="pricing-completeness-drilldown"');
  });

  it('has data-testid="pricing-completeness-summary"', () => {
    expect(src).toContain('data-testid="pricing-completeness-summary"');
  });

  it('has pricing-vendor-completeness testid pattern', () => {
    expect(src).toContain('pricing-vendor-completeness-');
  });

  it('has data-testid="pricing-clarification-send"', () => {
    expect(src).toContain('data-testid="pricing-clarification-send"');
  });

  it('clarification button is always disabled', () => {
    // The button must have disabled={true}
    const idx = src.indexOf('pricing-clarification-send');
    const snippet = src.slice(idx - 50, idx + 200);
    expect(snippet).toContain('disabled={true}');
  });

  it('has data-testid="pricing-completeness-disclaimer"', () => {
    expect(src).toContain('data-testid="pricing-completeness-disclaimer"');
  });

  it('has data-honest-disclaimer="source-pricing-completeness"', () => {
    expect(src).toContain('data-honest-disclaimer="source-pricing-completeness"');
  });

  it('honest disclaimer mentions Deterministic seed', () => {
    const idx = src.indexOf('data-honest-disclaimer="source-pricing-completeness"');
    expect(idx).toBeGreaterThan(0);
    const snippet = src.slice(idx, idx + 400);
    expect(snippet).toContain('Deterministic seed');
  });
});

// ─── pricing-completeness-view · source audit ────────────────────────────────

describe('SRC43 · pricing-completeness-view · source audit', () => {
  it('buildPricingCompletenessView is exported', () => {
    expect(libSrc).toContain('export function buildPricingCompletenessView');
  });

  it('PricingCompletenessView interface is exported', () => {
    expect(libSrc).toContain('export interface PricingCompletenessView');
  });

  it('PricingVendorCompleteness interface is exported', () => {
    expect(libSrc).toContain('export interface PricingVendorCompleteness');
  });

  it('PricingCompletenessGap interface is exported', () => {
    expect(libSrc).toContain('export interface PricingCompletenessGap');
  });

  it('PricingCompletenessSummary interface is exported', () => {
    expect(libSrc).toContain('export interface PricingCompletenessSummary');
  });

  it('module contains no runtime impurity', () => {
    expect(libSrc).not.toMatch(/Date\.now/);
    expect(libSrc).not.toMatch(/Math\.random/);
    expect(libSrc).not.toMatch(/fetch\(/);
  });

  it('deterministicSeed: true literal present', () => {
    expect(libSrc).toContain('deterministicSeed: true');
  });

  it('clarificationDisabledReason mentions deferred', () => {
    expect(libSrc).toContain('deferred');
  });
});

// ─── pricing-completeness-view · runtime contract ────────────────────────────

describe('SRC43 · pricing-completeness-view · runtime contract', () => {
  const view = buildPricingCompletenessView();

  it('returns a non-null view', () => {
    expect(view).not.toBeNull();
  });

  it('deterministicSeed is true', () => {
    expect(view.deterministicSeed).toBe(true);
  });

  it('headline is non-empty', () => {
    expect(view.headline.length).toBeGreaterThan(0);
  });

  it('contextLine is non-empty', () => {
    expect(view.contextLine.length).toBeGreaterThan(0);
  });

  it('returns exactly 3 vendors', () => {
    expect(view.vendors).toHaveLength(3);
  });

  it('vendor ids are vendor-a, vendor-b, vendor-c', () => {
    expect(view.vendors.map((v) => v.vendorId)).toEqual(['vendor-a', 'vendor-b', 'vendor-c']);
  });

  it('each vendor has a non-empty name', () => {
    view.vendors.forEach((v) => {
      expect(v.vendorName.trim().length).toBeGreaterThan(0);
    });
  });

  it('each vendor has a comparabilityStatus', () => {
    const valid = ['comparable', 'partially_comparable', 'not_comparable', 'blocked'];
    view.vendors.forEach((v) => {
      expect(valid).toContain(v.comparabilityStatus);
    });
  });

  it('each vendor has a non-empty comparabilityReason', () => {
    view.vendors.forEach((v) => {
      expect(v.comparabilityReason.trim().length).toBeGreaterThan(0);
    });
  });

  it('each vendor has annualRunCostUsd > 0', () => {
    view.vendors.forEach((v) => {
      expect(v.annualRunCostUsd).toBeGreaterThan(0);
    });
  });

  it('each vendor has at least one gap', () => {
    view.vendors.forEach((v) => {
      expect(v.gaps.length).toBeGreaterThan(0);
    });
  });

  it('each gap has a non-empty label, detail, and nextAction', () => {
    view.vendors.forEach((v) => {
      v.gaps.forEach((g) => {
        expect(g.label.trim().length).toBeGreaterThan(0);
        expect(g.detail.trim().length).toBeGreaterThan(0);
        expect(g.nextAction.trim().length).toBeGreaterThan(0);
      });
    });
  });

  it('Vendor B has a blocker gap', () => {
    const vendorB = view.vendors.find((v) => v.vendorId === 'vendor-b');
    expect(vendorB).toBeDefined();
    expect(vendorB!.blockerCount).toBeGreaterThan(0);
    const blocker = vendorB!.gaps.find((g) => g.severity === 'blocker');
    expect(blocker).toBeDefined();
  });

  it('Vendor C has a blocker gap', () => {
    const vendorC = view.vendors.find((v) => v.vendorId === 'vendor-c');
    expect(vendorC).toBeDefined();
    expect(vendorC!.blockerCount).toBeGreaterThan(0);
  });

  it('summary has crossVendorGaps', () => {
    expect(view.summary.crossVendorGaps.length).toBeGreaterThan(0);
  });

  it('summary.overallComparability is a valid value', () => {
    const valid = ['ready', 'conditionally_ready', 'blocked'];
    expect(valid).toContain(view.summary.overallComparability);
  });

  it('honestDisclaimer contains Deterministic seed', () => {
    expect(view.honestDisclaimer).toContain('Deterministic seed');
  });

  it('clarificationLabel is non-empty', () => {
    expect(view.clarificationLabel.trim().length).toBeGreaterThan(0);
  });

  it('clarificationDisabledReason mentions deferred', () => {
    expect(view.clarificationDisabledReason.toLowerCase()).toContain('deferred');
  });

  it('is deterministic across calls', () => {
    const a = buildPricingCompletenessView();
    const b = buildPricingCompletenessView();
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});
