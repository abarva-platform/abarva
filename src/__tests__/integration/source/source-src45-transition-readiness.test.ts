// SRC45 · Transition Readiness placeholder surface.
//
// Verifies structural invariants added in SRC45:
//   1. SourceEventDetailPage has 'transition' tab key (9 tabs)
//   2. TABS array includes transition
//   3. TransitionReadinessTab has correct testids and honest disclaimer
//   4. transition-readiness-view lib is deterministic and contract-correct

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildTransitionReadinessView } from '@/lib/source/transition-readiness-view';

const PAGE_PATH = join(
  process.cwd(),
  'src/components/source/SourceEventDetailPage.tsx',
);
const LIB_PATH = join(
  process.cwd(),
  'src/lib/source/transition-readiness-view.ts',
);

const pageSrc = readFileSync(PAGE_PATH, 'utf8');
const libSrc = readFileSync(LIB_PATH, 'utf8');

// ─── SourceEventDetailPage · TabKey ──────────────────────────────────────────

describe("SRC45 · SourceEventDetailPage · TabKey includes 'transition'", () => {
  it("TabKey union includes 'transition'", () => {
    expect(pageSrc).toContain("'transition'");
  });

  it('TABS array has 9 entries (8 + transition)', () => {
    // Count TABS array entries by matching tab objects
    const tabMatches = pageSrc.match(/\{ key: '(?:summary|pricing|bafo|risk|readiness|missions|signals|program|transition)', label:/g);
    expect(tabMatches).not.toBeNull();
    expect(tabMatches!.length).toBe(9);
  });

  it("TABS array includes transition entry", () => {
    expect(pageSrc).toContain("{ key: 'transition', label: 'Transition' }");
  });
});

// ─── SourceEventDetailPage · TransitionReadinessTab ──────────────────────────

describe('SRC45 · SourceEventDetailPage · TransitionReadinessTab', () => {
  it("imports buildTransitionReadinessView from source lib", () => {
    expect(pageSrc).toContain("from '@/lib/source/transition-readiness-view'");
  });

  it("defines TransitionReadinessTab function", () => {
    expect(pageSrc).toContain('function TransitionReadinessTab()');
  });

  it("renders TransitionReadinessTab for transition tab", () => {
    expect(pageSrc).toContain("{activeTab === 'transition' && <TransitionReadinessTab />}");
  });

  it('has data-testid="source-transition-readiness-tab"', () => {
    expect(pageSrc).toContain('data-testid="source-transition-readiness-tab"');
  });

  it('has data-testid="transition-readiness-summary"', () => {
    expect(pageSrc).toContain('data-testid="transition-readiness-summary"');
  });

  it('has data-testid="transition-go-no-go"', () => {
    expect(pageSrc).toContain('data-testid="transition-go-no-go"');
  });

  it('has data-testid="transition-risks"', () => {
    expect(pageSrc).toContain('data-testid="transition-risks"');
  });

  it('has transition-vendor- testid prefix for vendor cards', () => {
    expect(pageSrc).toContain('transition-vendor-');
  });

  it('has transition-risk- testid prefix for risk items', () => {
    expect(pageSrc).toContain('transition-risk-');
  });

  it('has data-testid="transition-readiness-disclaimer"', () => {
    expect(pageSrc).toContain('data-testid="transition-readiness-disclaimer"');
  });

  it('has data-honest-disclaimer="source-transition-readiness"', () => {
    expect(pageSrc).toContain('data-honest-disclaimer="source-transition-readiness"');
  });

  it('honest disclaimer mentions Deterministic seed', () => {
    const idx = pageSrc.indexOf('data-honest-disclaimer="source-transition-readiness"');
    expect(idx).toBeGreaterThan(0);
    const snippet = pageSrc.slice(idx, idx + 400);
    expect(snippet).toContain('Deterministic seed');
  });
});

// ─── transition-readiness-view · source audit ────────────────────────────────

describe('SRC45 · transition-readiness-view · source audit', () => {
  it('buildTransitionReadinessView is exported', () => {
    expect(libSrc).toContain('export function buildTransitionReadinessView');
  });

  it('TransitionReadinessView interface is exported', () => {
    expect(libSrc).toContain('export interface TransitionReadinessView');
  });

  it('VendorTransitionReadiness interface is exported', () => {
    expect(libSrc).toContain('export interface VendorTransitionReadiness');
  });

  it('TransitionRiskItem interface is exported', () => {
    expect(libSrc).toContain('export interface TransitionRiskItem');
  });

  it('TransitionGoNoGoItem interface is exported', () => {
    expect(libSrc).toContain('export interface TransitionGoNoGoItem');
  });

  it('module contains no runtime impurity', () => {
    expect(libSrc).not.toMatch(/Date\.now/);
    expect(libSrc).not.toMatch(/Math\.random/);
    expect(libSrc).not.toMatch(/fetch\(/);
  });

  it('deterministicSeed: true literal present', () => {
    expect(libSrc).toContain('deterministicSeed: true');
  });
});

// ─── transition-readiness-view · runtime contract ────────────────────────────

describe('SRC45 · transition-readiness-view · runtime contract', () => {
  const view = buildTransitionReadinessView();

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

  it('vendors array has 3 entries', () => {
    expect(view.vendors).toHaveLength(3);
  });

  it('at least one vendor is blocked', () => {
    const blocked = view.vendors.filter((v) => v.transitionBlocked);
    expect(blocked.length).toBeGreaterThan(0);
  });

  it('each vendor has non-empty vendorId, vendorLabel, and checks', () => {
    view.vendors.forEach((v) => {
      expect(v.vendorId.trim().length).toBeGreaterThan(0);
      expect(v.vendorLabel.trim().length).toBeGreaterThan(0);
      expect(v.checks.length).toBeGreaterThan(0);
    });
  });

  it('each check has non-empty checkId and label', () => {
    view.vendors.forEach((v) => {
      v.checks.forEach((c) => {
        expect(c.checkId.trim().length).toBeGreaterThan(0);
        expect(c.label.trim().length).toBeGreaterThan(0);
      });
    });
  });

  it('risks array is non-empty', () => {
    expect(view.risks.length).toBeGreaterThan(0);
  });

  it('at least one high-severity risk', () => {
    const high = view.risks.filter((r) => r.severity === 'high');
    expect(high.length).toBeGreaterThan(0);
  });

  it('each risk has non-empty narrative and mitigationNote', () => {
    view.risks.forEach((r) => {
      expect(r.narrative.trim().length).toBeGreaterThan(0);
      expect(r.mitigationNote.trim().length).toBeGreaterThan(0);
    });
  });

  it('goNoGoCriteria array is non-empty', () => {
    expect(view.goNoGoCriteria.length).toBeGreaterThan(0);
  });

  it('no go/no-go criteria met in seed (transition not yet begun)', () => {
    const met = view.goNoGoCriteria.filter((c) => c.met);
    expect(met.length).toBe(0);
  });

  it('summary blockedVendorCount matches vendors', () => {
    const count = view.vendors.filter((v) => v.transitionBlocked).length;
    expect(view.summary.blockedVendorCount).toBe(count);
  });

  it('summary goNoGoTotalCount matches goNoGoCriteria', () => {
    expect(view.summary.goNoGoTotalCount).toBe(view.goNoGoCriteria.length);
  });

  it('summary transitionClearToBegin is false (criteria not met)', () => {
    expect(view.summary.transitionClearToBegin).toBe(false);
  });

  it('atlasGuidance is non-empty', () => {
    expect(view.atlasGuidance.length).toBeGreaterThan(0);
  });

  it('honestDisclaimer contains Deterministic seed', () => {
    expect(view.honestDisclaimer).toContain('Deterministic seed');
  });

  it('is deterministic across calls', () => {
    const a = buildTransitionReadinessView();
    const b = buildTransitionReadinessView();
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});
