/**
 * I7 · INT-LNS-QUALITY — Intelligence knowledge quality lens view model tests.
 *
 * Verifies:
 *   - buildIntelligenceQualityLensView returns correct aggregated metrics
 *   - totalPatterns ≥ 60 (all seed domains combined)
 *   - ProvenanceRibbon present with primitive = 'Pattern'
 *   - Domain coverage rows cover all 6 seed domains
 *   - Contradiction status breakdown matches CONTRADICTION_SEEDS
 *   - At least 2 identified gaps (high priority)
 *   - View model is deterministic
 *   - Module hygiene (no fetch, Date.now, Math.random, new Date)
 *   - File existence checks (server component, client island, route)
 */

import * as fs from 'fs';
import * as path from 'path';

import { buildIntelligenceQualityLensView } from '@/lib/intelligence/intelligence-quality-lens-view';
import { CONTRADICTION_SEED_COUNT } from '@/lib/intelligence/seed-contradictions';

const ROOT = path.resolve(__dirname, '../../../../');

function fileExists(rel: string): boolean {
  return fs.existsSync(path.join(ROOT, rel));
}

function readFile(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

// ---------------------------------------------------------------------------
// Quality lens view — core metrics
// ---------------------------------------------------------------------------

describe('I7 · buildIntelligenceQualityLensView — core metrics', () => {
  const view = buildIntelligenceQualityLensView();

  it('returns a non-null view', () => {
    expect(view).not.toBeNull();
  });

  it('totalPatterns is at least 60', () => {
    expect(view.totalPatterns).toBeGreaterThanOrEqual(60);
  });

  it('totalSolutions is at least 5', () => {
    expect(view.totalSolutions).toBeGreaterThanOrEqual(5);
  });

  it('totalContradictions matches CONTRADICTION_SEED_COUNT', () => {
    expect(view.totalContradictions).toBe(CONTRADICTION_SEED_COUNT);
  });

  it('activeContradictions + resolvedContradictions equals totalContradictions', () => {
    expect(view.activeContradictions + view.resolvedContradictions).toBe(view.totalContradictions);
  });

  it('contradictionDensityPer100 is a numeric string', () => {
    const density = parseFloat(view.contradictionDensityPer100);
    expect(isNaN(density)).toBe(false);
    expect(density).toBeGreaterThanOrEqual(0);
  });

  it('healthSummary is non-empty', () => {
    expect(view.healthSummary.length).toBeGreaterThan(0);
  });

  it('agentQuote is non-empty', () => {
    expect(view.agentQuote.length).toBeGreaterThan(0);
  });

  it('agentContext is non-empty', () => {
    expect(view.agentContext.length).toBeGreaterThan(0);
  });

  it('intelligenceLandingHref is /intelligence', () => {
    expect(view.intelligenceLandingHref).toBe('/intelligence');
  });

  it('deterministicSeed is true', () => {
    expect(view.deterministicSeed).toBe(true);
  });

  it('honestDisclaimer mentions deterministic', () => {
    expect(view.honestDisclaimer.toLowerCase()).toContain('deterministic');
  });
});

// ---------------------------------------------------------------------------
// Domain coverage
// ---------------------------------------------------------------------------

describe('I7 · domain coverage', () => {
  const view = buildIntelligenceQualityLensView();

  it('has at least 6 domain coverage rows', () => {
    expect(view.domainCoverage.length).toBeGreaterThanOrEqual(6);
  });

  it('every row has id, domain, patternCount, coverage', () => {
    view.domainCoverage.forEach((row) => {
      expect(row.id.length).toBeGreaterThan(0);
      expect(row.domain.length).toBeGreaterThan(0);
      expect(row.patternCount).toBeGreaterThan(0);
      expect(['strong', 'moderate', 'thin']).toContain(row.coverage);
    });
  });

  it('at least one domain has strong coverage', () => {
    const strong = view.domainCoverage.filter((d) => d.coverage === 'strong');
    expect(strong.length).toBeGreaterThan(0);
  });

  it('AI Programs domain is present', () => {
    const domain = view.domainCoverage.find((d) => d.id === 'ai-programs');
    expect(domain).toBeDefined();
    expect((domain?.patternCount ?? 0)).toBeGreaterThan(0);
  });

  it('CDP domain has hasDetailFixtures = true', () => {
    const domain = view.domainCoverage.find((d) => d.id === 'cdp');
    expect(domain?.hasDetailFixtures).toBe(true);
  });

  it('domain coverage patternCounts sum to totalPatterns', () => {
    const sum = view.domainCoverage.reduce((s, d) => s + d.patternCount, 0);
    expect(sum).toBe(view.totalPatterns);
  });
});

// ---------------------------------------------------------------------------
// Contradiction status breakdown
// ---------------------------------------------------------------------------

describe('I7 · contradiction status', () => {
  const view = buildIntelligenceQualityLensView();

  it('contradictionStatus.total matches CONTRADICTION_SEED_COUNT', () => {
    expect(view.contradictionStatus.total).toBe(CONTRADICTION_SEED_COUNT);
  });

  it('status counts sum to total', () => {
    const { open, underReview, resolvedTowardA, resolvedTowardB, acceptedAsTension, total } =
      view.contradictionStatus;
    expect(open + underReview + resolvedTowardA + resolvedTowardB + acceptedAsTension).toBe(total);
  });

  it('has at least 1 open contradiction', () => {
    expect(view.contradictionStatus.open).toBeGreaterThanOrEqual(1);
  });

  it('has at least 1 under-review contradiction', () => {
    expect(view.contradictionStatus.underReview).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// Gap analysis
// ---------------------------------------------------------------------------

describe('I7 · gap analysis', () => {
  const view = buildIntelligenceQualityLensView();

  it('has at least 3 identified gaps', () => {
    expect(view.identifiedGaps.length).toBeGreaterThanOrEqual(3);
  });

  it('has at least 2 high-priority gaps', () => {
    const high = view.identifiedGaps.filter((g) => g.priority === 'high');
    expect(high.length).toBeGreaterThanOrEqual(2);
  });

  it('every gap has id, description, occurrences, priority', () => {
    view.identifiedGaps.forEach((gap) => {
      expect(gap.id.length).toBeGreaterThan(0);
      expect(gap.description.length).toBeGreaterThan(0);
      expect(gap.occurrences).toBeGreaterThan(0);
      expect(['high', 'medium', 'low']).toContain(gap.priority);
    });
  });
});

// ---------------------------------------------------------------------------
// ProvenanceRibbon
// ---------------------------------------------------------------------------

describe('I7 · ProvenanceRibbon', () => {
  const view = buildIntelligenceQualityLensView();

  it('provenanceRibbon is present', () => {
    expect(view.provenanceRibbon).toBeDefined();
  });

  it('provenanceRibbon.primitive is Pattern (quality lens aggregates patterns)', () => {
    expect(view.provenanceRibbon.primitive).toBe('Pattern');
  });

  it('provenanceRibbon.runtimeLabel confirms no live Sentinel', () => {
    expect(view.provenanceRibbon.runtimeLabel).toContain('no live Sentinel');
  });

  it('provenanceRibbon.sourceLabel is deterministic_seed', () => {
    expect(view.provenanceRibbon.sourceLabel).toBe('deterministic_seed');
  });

  it('provenanceRibbon.signalCount equals totalPatterns', () => {
    expect(view.provenanceRibbon.signalCount).toBe(view.totalPatterns);
  });
});

// ---------------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------------

describe('I7 · determinism', () => {
  it('buildIntelligenceQualityLensView is idempotent', () => {
    const v1 = buildIntelligenceQualityLensView();
    const v2 = buildIntelligenceQualityLensView();
    expect(JSON.stringify(v1)).toBe(JSON.stringify(v2));
  });
});

// ---------------------------------------------------------------------------
// Module hygiene
// ---------------------------------------------------------------------------

describe('I7 · module hygiene — intelligence-quality-lens-view.ts', () => {
  const source = readFile('src/lib/intelligence/intelligence-quality-lens-view.ts');

  it('does not call fetch(', () => {
    expect(source).not.toContain('fetch(');
  });

  it('does not call Date.now(', () => {
    expect(source).not.toContain('Date.now(');
  });

  it('does not call Math.random(', () => {
    expect(source).not.toContain('Math.random(');
  });

  it('does not use new Date(', () => {
    expect(source).not.toContain('new Date(');
  });

  it('exports deterministicSeed: true', () => {
    expect(source).toContain('deterministicSeed: true');
  });
});

// ---------------------------------------------------------------------------
// File existence checks
// ---------------------------------------------------------------------------

describe('I7 · file existence', () => {
  it('intelligence-quality-lens-view.ts exists', () => {
    expect(fileExists('src/lib/intelligence/intelligence-quality-lens-view.ts')).toBe(true);
  });

  it('IntelligenceQualityLensPage.tsx exists (server component)', () => {
    expect(fileExists('src/components/intelligence/IntelligenceQualityLensPage.tsx')).toBe(true);
  });

  it('IntelligenceQualityLensSentinel.tsx exists (client island)', () => {
    expect(fileExists('src/components/intelligence/IntelligenceQualityLensSentinel.tsx')).toBe(true);
  });

  it('quality/page.tsx route exists', () => {
    expect(fileExists('src/app/intelligence/quality/page.tsx')).toBe(true);
  });

  it('IntelligenceQualityLensPage.tsx is NOT use client', () => {
    const src = readFile('src/components/intelligence/IntelligenceQualityLensPage.tsx');
    expect(src.startsWith("'use client'")).toBe(false);
    expect(src.startsWith('"use client"')).toBe(false);
  });

  it('IntelligenceQualityLensSentinel.tsx IS use client', () => {
    const src = readFile('src/components/intelligence/IntelligenceQualityLensSentinel.tsx');
    expect(src).toContain("'use client'");
  });

  it('IntelligenceQualityLensPage.tsx imports IntelligenceProvenanceRibbon', () => {
    const src = readFile('src/components/intelligence/IntelligenceQualityLensPage.tsx');
    expect(src).toContain('IntelligenceProvenanceRibbon');
  });

  it('quality/page.tsx uses IntelligenceQualityLensPage and buildIntelligenceQualityLensView', () => {
    const src = readFile('src/app/intelligence/quality/page.tsx');
    expect(src).toContain('IntelligenceQualityLensPage');
    expect(src).toContain('buildIntelligenceQualityLensView');
  });
});
