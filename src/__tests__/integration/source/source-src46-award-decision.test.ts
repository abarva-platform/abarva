// SRC46 · Award Decision Tracker — integration tests.
//
// Verifies structural invariants added in SRC46:
//   1. award-decision-view lib is deterministic and contract-correct
//   2. SourceEventDetailPage has 10 tabs including 'award'
//   3. AwardDecisionTab component has correct testids and honest disclaimer

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  buildAwardDecisionView,
} from '@/lib/source/award-decision-view';

const PAGE_PATH = join(
  process.cwd(),
  'src/components/source/SourceEventDetailPage.tsx',
);
const LIB_PATH = join(
  process.cwd(),
  'src/lib/source/award-decision-view.ts',
);

const pageSrc = readFileSync(PAGE_PATH, 'utf8');
const libSrc = readFileSync(LIB_PATH, 'utf8');

// ─── award-decision-view · source audit ──────────────────────────────────────

describe('SRC46 · award-decision-view · source audit', () => {
  it('buildAwardDecisionView is exported', () => {
    expect(libSrc).toContain('export function buildAwardDecisionView');
  });

  it('AwardDecisionView interface is exported', () => {
    expect(libSrc).toContain('export interface AwardDecisionView');
  });

  it('VendorAwardProfile interface is exported', () => {
    expect(libSrc).toContain('export interface VendorAwardProfile');
  });

  it('VendorScoreCard interface is exported', () => {
    expect(libSrc).toContain('export interface VendorScoreCard');
  });

  it('AwardDecisionStatus type is exported', () => {
    expect(libSrc).toContain('export type AwardDecisionStatus');
  });

  it('AwardDecisionSummary interface is exported', () => {
    expect(libSrc).toContain('export interface AwardDecisionSummary');
  });

  it('module contains no runtime impurity', () => {
    expect(libSrc).not.toMatch(/Date\.now/);
    expect(libSrc).not.toMatch(/Math\.random/);
    expect(libSrc).not.toMatch(/fetch\(/);
  });

  it('does NOT import from src/lib/intelligence', () => {
    expect(libSrc).not.toMatch(/@\/lib\/intelligence/);
  });

  it('does NOT import from src/lib/auth', () => {
    expect(libSrc).not.toMatch(/@\/lib\/auth/);
  });

  it('deterministicSeed: true literal present', () => {
    expect(libSrc).toContain('deterministicSeed: true');
  });
});

// ─── SourceEventDetailPage · award tab ───────────────────────────────────────

describe('SRC46 · SourceEventDetailPage · award tab', () => {
  it('TabKey union includes award', () => {
    expect(pageSrc).toContain("'award'");
  });

  it('TABS array includes award entry', () => {
    expect(pageSrc).toContain("{ key: 'award', label: 'Award' }");
  });

  it('has 10 tab entries in TABS', () => {
    const tabMatches = pageSrc.match(/\{ key: '(summary|pricing|bafo|risk|readiness|missions|signals|program|transition|award)', label:/g);
    expect(tabMatches).not.toBeNull();
    expect(tabMatches!.length).toBe(10);
  });

  it('imports buildAwardDecisionView from award-decision-view', () => {
    expect(pageSrc).toContain("from '@/lib/source/award-decision-view'");
  });

  it('renders AwardDecisionTab for award tab', () => {
    expect(pageSrc).toContain("{activeTab === 'award' && <AwardDecisionTab />}");
  });

  it('defines AwardDecisionTab function', () => {
    expect(pageSrc).toContain('function AwardDecisionTab()');
  });

  it('has data-testid="source-award-decision-tab"', () => {
    expect(pageSrc).toContain('data-testid="source-award-decision-tab"');
  });

  it('has data-testid="source-award-decision-summary"', () => {
    expect(pageSrc).toContain('data-testid="source-award-decision-summary"');
  });

  it('has source-award-vendor- testid prefix for vendor cards', () => {
    expect(pageSrc).toContain('source-award-vendor-');
  });

  it('has data-testid="source-award-decision-disclaimer"', () => {
    expect(pageSrc).toContain('data-testid="source-award-decision-disclaimer"');
  });

  it('has data-honest-disclaimer="source-award-decision"', () => {
    expect(pageSrc).toContain('data-honest-disclaimer="source-award-decision"');
  });

  it('honest disclaimer contains literal Deterministic seed', () => {
    const idx = pageSrc.indexOf('data-honest-disclaimer="source-award-decision"');
    expect(idx).toBeGreaterThan(0);
    const snippet = pageSrc.slice(idx, idx + 400);
    expect(snippet).toContain('Deterministic seed');
  });
});

// ─── award-decision-view · runtime contract ───────────────────────────────────

describe('SRC46 · buildAwardDecisionView · runtime contract', () => {
  const view = buildAwardDecisionView();

  it('returns a non-null view', () => {
    expect(view).not.toBeNull();
  });

  it('deterministicSeed is true', () => {
    expect(view.deterministicSeed).toBe(true);
  });

  it('eventId is SRC-AMS-2026', () => {
    expect(view.eventId).toBe('SRC-AMS-2026');
  });

  it('eventName is non-empty', () => {
    expect(view.eventName.trim().length).toBeGreaterThan(0);
  });

  it('decisionStage is non-empty', () => {
    expect(view.decisionStage.trim().length).toBeGreaterThan(0);
  });

  it('vendors array has exactly 3 entries', () => {
    expect(view.vendors).toHaveLength(3);
  });

  it('all three vendors have distinct ranks 1, 2, 3', () => {
    const ranks = view.vendors.map((v) => v.rank).sort();
    expect(ranks).toEqual([1, 2, 3]);
  });

  it('rank-1 vendor is recommended', () => {
    const top = view.vendors.find((v) => v.rank === 1);
    expect(top).toBeDefined();
    expect(top!.status).toBe('recommended');
  });

  it('at least one vendor is not_recommended', () => {
    const notRec = view.vendors.filter((v) => v.status === 'not_recommended');
    expect(notRec.length).toBeGreaterThan(0);
  });

  it('each vendor has non-empty required string fields', () => {
    for (const v of view.vendors) {
      expect(v.vendorId.trim().length).toBeGreaterThan(0);
      expect(v.vendorName.trim().length).toBeGreaterThan(0);
      expect(v.strengthSummary.trim().length).toBeGreaterThan(0);
      expect(v.weaknessSummary.trim().length).toBeGreaterThan(0);
      expect(v.decisionNote.trim().length).toBeGreaterThan(0);
    }
  });

  it('each vendor has valid score card fields (0–100)', () => {
    for (const v of view.vendors) {
      expect(v.scores.overall).toBeGreaterThanOrEqual(0);
      expect(v.scores.overall).toBeLessThanOrEqual(100);
      expect(v.scores.commercial).toBeGreaterThanOrEqual(0);
      expect(v.scores.technical).toBeGreaterThanOrEqual(0);
      expect(v.scores.transition).toBeGreaterThanOrEqual(0);
      expect(v.scores.risk).toBeGreaterThanOrEqual(0);
    }
  });

  it('rank-1 vendor has the highest overall score', () => {
    const sorted = [...view.vendors].sort((a, b) => b.scores.overall - a.scores.overall);
    expect(sorted[0].rank).toBe(1);
  });

  it('not_recommended vendor has at least one blocking issue', () => {
    const notRec = view.vendors.find((v) => v.status === 'not_recommended');
    expect(notRec).toBeDefined();
    expect(notRec!.blockingIssues.length).toBeGreaterThan(0);
  });

  it('recommended vendor is echoed in summary.recommendedVendorId', () => {
    const top = view.vendors.find((v) => v.rank === 1);
    expect(view.summary.recommendedVendorId).toBe(top!.vendorId);
    expect(view.summary.recommendedVendorName).toBe(top!.vendorName);
  });

  it('summary has at least one key decision factor', () => {
    expect(view.summary.keyDecisionFactors.length).toBeGreaterThan(0);
  });

  it('summary has at least one pre-award condition', () => {
    expect(view.summary.preAwardConditions.length).toBeGreaterThan(0);
  });

  it('atlasGuidance is non-empty', () => {
    expect(view.atlasGuidance.trim().length).toBeGreaterThan(0);
  });

  it('honestDisclaimer contains Deterministic seed', () => {
    expect(view.honestDisclaimer).toContain('Deterministic seed');
  });

  it('is deterministic across calls', () => {
    const a = buildAwardDecisionView();
    const b = buildAwardDecisionView();
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('all vendorIds are unique', () => {
    const ids = view.vendors.map((v) => v.vendorId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
