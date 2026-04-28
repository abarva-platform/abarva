// SRC44 · BAFO scenario compare.
//
// Verifies structural invariants added in SRC44:
//   1. SourceEventDetailPage imports buildBafoScenarioCompareView
//   2. BafoScenarioCompare component is present with correct testids
//   3. Per-vendor and per-scenario testids are present
//   4. Honest disclaimer is present with correct testid and data attribute
//   5. bafo-scenario-compare-view lib is deterministic and contract-correct

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildBafoScenarioCompareView } from '@/lib/source/bafo-scenario-compare-view';

const PAGE_PATH = join(
  process.cwd(),
  'src/components/source/SourceEventDetailPage.tsx',
);
const LIB_PATH = join(
  process.cwd(),
  'src/lib/source/bafo-scenario-compare-view.ts',
);

const src = readFileSync(PAGE_PATH, 'utf8');
const libSrc = readFileSync(LIB_PATH, 'utf8');

// ─── SourceEventDetailPage · imports ─────────────────────────────────────────

describe('SRC44 · SourceEventDetailPage · imports', () => {
  it('imports buildBafoScenarioCompareView', () => {
    expect(src).toContain("from '@/lib/source/bafo-scenario-compare-view'");
  });

  it('calls buildBafoScenarioCompareView()', () => {
    expect(src).toContain('buildBafoScenarioCompareView()');
  });
});

// ─── SourceEventDetailPage · BafoScenarioCompare component ───────────────────

describe('SRC44 · SourceEventDetailPage · BafoScenarioCompare', () => {
  it('defines BafoScenarioCompare function', () => {
    expect(src).toContain('function BafoScenarioCompare()');
  });

  it('renders BafoScenarioCompare in BafoStrategyTab', () => {
    expect(src).toContain('<BafoScenarioCompare />');
  });

  it('has data-testid="bafo-scenario-compare"', () => {
    expect(src).toContain('data-testid="bafo-scenario-compare"');
  });

  it('has bafo-vendor-scenario testid template pattern', () => {
    expect(src).toContain('bafo-vendor-scenario-');
  });

  it('has bafo-scenario testid template pattern', () => {
    expect(src).toContain('bafo-scenario-');
  });

  it('scenario type conservative appears in lib source', () => {
    expect(libSrc).toContain("'conservative'");
  });

  it('scenario type base appears in lib source', () => {
    expect(libSrc).toContain("'base'");
  });

  it('scenario type stretch appears in lib source', () => {
    expect(libSrc).toContain("'stretch'");
  });

  it('vendor-a appears in lib source', () => {
    expect(libSrc).toContain("'vendor-a'");
  });

  it('vendor-b appears in lib source', () => {
    expect(libSrc).toContain("'vendor-b'");
  });

  it('vendor-c appears in lib source', () => {
    expect(libSrc).toContain("'vendor-c'");
  });

  it('has data-testid="bafo-scenario-compare-action"', () => {
    expect(src).toContain('data-testid="bafo-scenario-compare-action"');
  });

  it('compare action button is always disabled', () => {
    const idx = src.indexOf('bafo-scenario-compare-action');
    const snippet = src.slice(idx - 50, idx + 200);
    expect(snippet).toContain('disabled={true}');
  });

  it('has data-testid="bafo-scenario-compare-disclaimer"', () => {
    expect(src).toContain('data-testid="bafo-scenario-compare-disclaimer"');
  });

  it('has data-honest-disclaimer="source-bafo-scenario-compare"', () => {
    expect(src).toContain('data-honest-disclaimer="source-bafo-scenario-compare"');
  });

  it('honest disclaimer mentions Deterministic seed', () => {
    const idx = src.indexOf('data-honest-disclaimer="source-bafo-scenario-compare"');
    expect(idx).toBeGreaterThan(0);
    const snippet = src.slice(idx, idx + 400);
    expect(snippet).toContain('Deterministic seed');
  });
});

// ─── bafo-scenario-compare-view · source audit ───────────────────────────────

describe('SRC44 · bafo-scenario-compare-view · source audit', () => {
  it('buildBafoScenarioCompareView is exported', () => {
    expect(libSrc).toContain('export function buildBafoScenarioCompareView');
  });

  it('BafoScenarioCompareView interface is exported', () => {
    expect(libSrc).toContain('export interface BafoScenarioCompareView');
  });

  it('BafoVendorScenarioSet interface is exported', () => {
    expect(libSrc).toContain('export interface BafoVendorScenarioSet');
  });

  it('BafoVendorScenario interface is exported', () => {
    expect(libSrc).toContain('export interface BafoVendorScenario');
  });

  it('BafoScenarioLever interface is exported', () => {
    expect(libSrc).toContain('export interface BafoScenarioLever');
  });

  it('module contains no runtime impurity', () => {
    expect(libSrc).not.toMatch(/Date\.now/);
    expect(libSrc).not.toMatch(/Math\.random/);
    expect(libSrc).not.toMatch(/fetch\(/);
  });

  it('deterministicSeed: true literal present', () => {
    expect(libSrc).toContain('deterministicSeed: true');
  });

  it('compareActionDisabledReason mentions deferred', () => {
    expect(libSrc).toContain('deferred');
  });
});

// ─── bafo-scenario-compare-view · runtime contract ───────────────────────────

describe('SRC44 · bafo-scenario-compare-view · runtime contract', () => {
  const view = buildBafoScenarioCompareView();

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

  it('returns exactly 3 vendor sets', () => {
    expect(view.vendorSets).toHaveLength(3);
  });

  it('vendor ids are vendor-a, vendor-b, vendor-c', () => {
    expect(view.vendorSets.map((v) => v.vendorId)).toEqual(['vendor-a', 'vendor-b', 'vendor-c']);
  });

  it('each vendor set has exactly 3 scenarios', () => {
    view.vendorSets.forEach((vs) => {
      expect(vs.scenarios).toHaveLength(3);
    });
  });

  it('scenario types are conservative, base, stretch in order', () => {
    view.vendorSets.forEach((vs) => {
      expect(vs.scenarios.map((s) => s.scenarioType)).toEqual(['conservative', 'base', 'stretch']);
    });
  });

  it('each scenario has a non-empty description', () => {
    view.vendorSets.forEach((vs) => {
      vs.scenarios.forEach((s) => {
        expect(s.description.trim().length).toBeGreaterThan(0);
      });
    });
  });

  it('each scenario has a non-empty nextAction', () => {
    view.vendorSets.forEach((vs) => {
      vs.scenarios.forEach((s) => {
        expect(s.nextAction.trim().length).toBeGreaterThan(0);
      });
    });
  });

  it('each scenario has at least one lever', () => {
    view.vendorSets.forEach((vs) => {
      vs.scenarios.forEach((s) => {
        expect(s.levers.length).toBeGreaterThan(0);
      });
    });
  });

  it('Vendor B has hasActiveBlocker = true', () => {
    const vb = view.vendorSets.find((v) => v.vendorId === 'vendor-b');
    expect(vb).toBeDefined();
    expect(vb!.hasActiveBlocker).toBe(true);
  });

  it('Vendor C has hasActiveBlocker = true', () => {
    const vc = view.vendorSets.find((v) => v.vendorId === 'vendor-c');
    expect(vc).toBeDefined();
    expect(vc!.hasActiveBlocker).toBe(true);
  });

  it('Vendor A has no active blocker', () => {
    const va = view.vendorSets.find((v) => v.vendorId === 'vendor-a');
    expect(va).toBeDefined();
    expect(va!.hasActiveBlocker).toBe(false);
  });

  it('Vendor A base scenario has quantified saving > 0', () => {
    const va = view.vendorSets.find((v) => v.vendorId === 'vendor-a');
    const base = va!.scenarios.find((s) => s.scenarioType === 'base');
    expect(base!.totalEstimatedSavingUsd).toBeGreaterThan(0);
  });

  it('honestDisclaimer contains Deterministic seed', () => {
    expect(view.honestDisclaimer).toContain('Deterministic seed');
  });

  it('compareActionLabel is non-empty', () => {
    expect(view.compareActionLabel.trim().length).toBeGreaterThan(0);
  });

  it('compareActionDisabledReason mentions deferred', () => {
    expect(view.compareActionDisabledReason.toLowerCase()).toContain('deferred');
  });

  it('is deterministic across calls', () => {
    const a = buildBafoScenarioCompareView();
    const b = buildBafoScenarioCompareView();
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});
