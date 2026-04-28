/**
 * I5 · INT-IDX-SOLUTIONS + INT-DTL-SOLUTION + INT-DTL-CONTRADICTION
 * Intelligence Solutions + Contradictions view model tests.
 *
 * Verifies:
 *   - buildIntelligenceSolutionsIndexView returns correct index view
 *   - buildIntelligenceSolutionDetailView returns correct per-solution views
 *   - buildIntelligenceContradictionDetailView returns correct per-contradiction views
 *   - ProvenanceRibbon present on every surface (primitive = Solution / Contradiction)
 *   - All 5 known solution IDs resolve
 *   - All 10 known contradiction IDs resolve
 *   - View models are deterministic
 *   - Module hygiene (no fetch, Date.now, Math.random, new Date)
 *   - File existence checks (server components, client islands, routes)
 */

import * as fs from 'fs';
import * as path from 'path';

import {
  buildIntelligenceSolutionsIndexView,
  getKnownSolutionIds,
} from '@/lib/intelligence/intelligence-solutions-index-view';
import {
  buildIntelligenceSolutionDetailView,
  getKnownSolutionIds as getKnownSolutionIdsFromDetail,
} from '@/lib/intelligence/intelligence-solution-detail-view';
import {
  buildIntelligenceContradictionDetailView,
  getKnownContradictionIds,
} from '@/lib/intelligence/intelligence-contradiction-detail-view';

const ROOT = path.resolve(__dirname, '../../../../');

function fileExists(rel: string): boolean {
  return fs.existsSync(path.join(ROOT, rel));
}

function readFile(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

// ---------------------------------------------------------------------------
// Solutions index view
// ---------------------------------------------------------------------------

describe('I5 · IntelligenceSolutionsIndexView', () => {
  const view = buildIntelligenceSolutionsIndexView();

  it('returns a non-null view', () => {
    expect(view).not.toBeNull();
  });

  it('has at least 5 solutions', () => {
    expect(view.solutions.length).toBeGreaterThanOrEqual(5);
  });

  it('totalSolutions matches solutions array length', () => {
    expect(view.totalSolutions).toBe(view.solutions.length);
  });

  it('every solution has id, name, domain, description, href, maturity', () => {
    view.solutions.forEach((s) => {
      expect(s.id.length).toBeGreaterThan(0);
      expect(s.name.length).toBeGreaterThan(0);
      expect(s.domain.length).toBeGreaterThan(0);
      expect(s.description.length).toBeGreaterThan(0);
      expect(s.href).toContain('/intelligence/solutions/');
      expect(['proven', 'emerging', 'experimental']).toContain(s.maturity);
    });
  });

  it('provenanceRibbon is present', () => {
    expect(view.provenanceRibbon).toBeDefined();
  });

  it('provenanceRibbon.primitive is Solution', () => {
    expect(view.provenanceRibbon.primitive).toBe('Solution');
  });

  it('provenanceRibbon.runtimeLabel confirms no live Sentinel', () => {
    expect(view.provenanceRibbon.runtimeLabel).toContain('no live Sentinel');
  });

  it('provenanceRibbon.sourceLabel is deterministic_seed', () => {
    expect(view.provenanceRibbon.sourceLabel).toBe('deterministic_seed');
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
// getKnownSolutionIds
// ---------------------------------------------------------------------------

describe('I5 · getKnownSolutionIds', () => {
  it('returns at least 5 known solution IDs', () => {
    const ids = getKnownSolutionIds();
    expect(ids.length).toBeGreaterThanOrEqual(5);
  });

  it('includes cdp-activation', () => {
    expect(getKnownSolutionIds()).toContain('cdp-activation');
  });

  it('includes loyalty-intelligence', () => {
    expect(getKnownSolutionIds()).toContain('loyalty-intelligence');
  });

  it('getKnownSolutionIds from index and detail return same IDs', () => {
    const fromIndex = [...getKnownSolutionIds()].sort();
    const fromDetail = [...getKnownSolutionIdsFromDetail()].sort();
    expect(fromIndex).toEqual(fromDetail);
  });
});

// ---------------------------------------------------------------------------
// Solution detail — cdp-activation
// ---------------------------------------------------------------------------

describe('I5 · buildIntelligenceSolutionDetailView — cdp-activation', () => {
  const view = buildIntelligenceSolutionDetailView('cdp-activation');

  it('returns non-null view', () => {
    expect(view).not.toBeNull();
  });

  it('solutionId is cdp-activation', () => {
    expect(view?.solutionId).toBe('cdp-activation');
  });

  it('has a name', () => {
    expect(view?.name.length).toBeGreaterThan(0);
  });

  it('has at least 1 composition pattern', () => {
    expect((view?.compositionPatterns.length ?? 0)).toBeGreaterThanOrEqual(1);
  });

  it('composition patterns have patternId, href, role', () => {
    view?.compositionPatterns.forEach((p) => {
      expect(p.patternId.length).toBeGreaterThan(0);
      expect(p.href).toContain('/intelligence/');
      expect(['foundation', 'variation', 'signal-calibrator']).toContain(p.role);
    });
  });

  it('provenanceRibbon.primitive is Solution', () => {
    expect(view?.provenanceRibbon.primitive).toBe('Solution');
  });

  it('solutionsIndexHref is /intelligence/solutions', () => {
    expect(view?.solutionsIndexHref).toBe('/intelligence/solutions');
  });

  it('deterministicSeed is true', () => {
    expect(view?.deterministicSeed).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Solution detail — unknown slug returns null
// ---------------------------------------------------------------------------

describe('I5 · buildIntelligenceSolutionDetailView — unknown', () => {
  it('returns null for unknown solutionId', () => {
    expect(buildIntelligenceSolutionDetailView('not-a-real-solution')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(buildIntelligenceSolutionDetailView('')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getKnownContradictionIds
// ---------------------------------------------------------------------------

describe('I5 · getKnownContradictionIds', () => {
  it('returns at least 10 contradiction IDs', () => {
    const ids = getKnownContradictionIds();
    expect(ids.length).toBeGreaterThanOrEqual(10);
  });

  it('includes con-001', () => {
    expect(getKnownContradictionIds()).toContain('con-001');
  });

  it('all IDs are lowercase', () => {
    getKnownContradictionIds().forEach((id) => {
      expect(id).toBe(id.toLowerCase());
    });
  });
});

// ---------------------------------------------------------------------------
// Contradiction detail — CON-001 (flagship, resolved-toward-B)
// ---------------------------------------------------------------------------

describe('I5 · buildIntelligenceContradictionDetailView — CON-001', () => {
  const view = buildIntelligenceContradictionDetailView('con-001');

  it('returns non-null view', () => {
    expect(view).not.toBeNull();
  });

  it('contradictionId is con-001', () => {
    expect(view?.contradictionId).toBe('con-001');
  });

  it('title is non-empty', () => {
    expect((view?.title.length ?? 0)).toBeGreaterThan(0);
  });

  it('status is resolved-toward-B', () => {
    expect(view?.status).toBe('resolved-toward-B');
  });

  it('statusLabel is non-empty', () => {
    expect((view?.statusLabel.length ?? 0)).toBeGreaterThan(0);
  });

  it('partyA has claim, source, evidence, confidenceLabel', () => {
    expect((view?.partyA.claim.length ?? 0)).toBeGreaterThan(0);
    expect((view?.partyA.source.length ?? 0)).toBeGreaterThan(0);
    expect((view?.partyA.evidence.length ?? 0)).toBeGreaterThan(0);
    expect(view?.partyA.confidenceLabel).toMatch(/\d+%/);
  });

  it('partyB has claim, source, evidence, confidenceLabel', () => {
    expect((view?.partyB.claim.length ?? 0)).toBeGreaterThan(0);
    expect((view?.partyB.source.length ?? 0)).toBeGreaterThan(0);
    expect((view?.partyB.evidence.length ?? 0)).toBeGreaterThan(0);
    expect(view?.partyB.confidenceLabel).toMatch(/\d+%/);
  });

  it('whyBothCannotBeTrue is non-empty', () => {
    expect((view?.whyBothCannotBeTrue.length ?? 0)).toBeGreaterThan(0);
  });

  it('affectedPatternIds is non-empty', () => {
    expect((view?.affectedPatternIds.length ?? 0)).toBeGreaterThan(0);
  });

  // ── I5 acceptance criterion: ProvenanceRibbon present ────────────────────

  it('provenanceRibbon is present', () => {
    expect(view?.provenanceRibbon).toBeDefined();
  });

  it('provenanceRibbon.primitive is Contradiction', () => {
    expect(view?.provenanceRibbon.primitive).toBe('Contradiction');
  });

  it('provenanceRibbon.runtimeLabel confirms no live Sentinel', () => {
    expect(view?.provenanceRibbon.runtimeLabel).toContain('no live Sentinel');
  });

  it('provenanceRibbon.sourceLabel is deterministic_seed', () => {
    expect(view?.provenanceRibbon.sourceLabel).toBe('deterministic_seed');
  });

  it('intelligenceLandingHref is /intelligence', () => {
    expect(view?.intelligenceLandingHref).toBe('/intelligence');
  });

  it('deterministicSeed is true', () => {
    expect(view?.deterministicSeed).toBe(true);
  });

  it('honestDisclaimer mentions deterministic', () => {
    expect(view?.honestDisclaimer.toLowerCase()).toContain('deterministic');
  });
});

// ---------------------------------------------------------------------------
// Contradiction detail — CON-008 (accepted-as-tension)
// ---------------------------------------------------------------------------

describe('I5 · buildIntelligenceContradictionDetailView — CON-008', () => {
  const view = buildIntelligenceContradictionDetailView('con-008');

  it('status is accepted-as-tension', () => {
    expect(view?.status).toBe('accepted-as-tension');
  });

  it('provenanceRibbon.primitive is Contradiction', () => {
    expect(view?.provenanceRibbon.primitive).toBe('Contradiction');
  });
});

// ---------------------------------------------------------------------------
// Contradiction detail — unknown slug returns null
// ---------------------------------------------------------------------------

describe('I5 · buildIntelligenceContradictionDetailView — unknown', () => {
  it('returns null for unknown contradictionId', () => {
    expect(buildIntelligenceContradictionDetailView('con-999')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(buildIntelligenceContradictionDetailView('')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------------

describe('I5 · determinism', () => {
  it('buildIntelligenceSolutionsIndexView is idempotent', () => {
    const v1 = buildIntelligenceSolutionsIndexView();
    const v2 = buildIntelligenceSolutionsIndexView();
    expect(JSON.stringify(v1)).toBe(JSON.stringify(v2));
  });

  it('buildIntelligenceSolutionDetailView is idempotent for cdp-activation', () => {
    const v1 = buildIntelligenceSolutionDetailView('cdp-activation');
    const v2 = buildIntelligenceSolutionDetailView('cdp-activation');
    expect(JSON.stringify(v1)).toBe(JSON.stringify(v2));
  });

  it('buildIntelligenceContradictionDetailView is idempotent for con-001', () => {
    const v1 = buildIntelligenceContradictionDetailView('con-001');
    const v2 = buildIntelligenceContradictionDetailView('con-001');
    expect(JSON.stringify(v1)).toBe(JSON.stringify(v2));
  });
});

// ---------------------------------------------------------------------------
// Module hygiene
// ---------------------------------------------------------------------------

describe('I5 · module hygiene — intelligence-solutions-index-view.ts', () => {
  const source = readFile('src/lib/intelligence/intelligence-solutions-index-view.ts');

  it('does not call fetch(', () => {
    expect(source).not.toContain('fetch(');
  });

  it('does not call Date.now(', () => {
    expect(source).not.toContain('Date.now(');
  });

  it('does not call Math.random(', () => {
    expect(source).not.toContain('Math.random(');
  });

  it('exports deterministicSeed: true', () => {
    expect(source).toContain('deterministicSeed: true');
  });
});

describe('I5 · module hygiene — intelligence-contradiction-detail-view.ts', () => {
  const source = readFile('src/lib/intelligence/intelligence-contradiction-detail-view.ts');

  it('does not call fetch(', () => {
    expect(source).not.toContain('fetch(');
  });

  it('does not call Date.now(', () => {
    expect(source).not.toContain('Date.now(');
  });

  it('does not call Math.random(', () => {
    expect(source).not.toContain('Math.random(');
  });

  it('exports deterministicSeed: true', () => {
    expect(source).toContain('deterministicSeed: true');
  });
});

// ---------------------------------------------------------------------------
// File existence checks
// ---------------------------------------------------------------------------

describe('I5 · file existence', () => {
  it('intelligence-solutions-index-view.ts exists', () => {
    expect(fileExists('src/lib/intelligence/intelligence-solutions-index-view.ts')).toBe(true);
  });

  it('intelligence-solution-detail-view.ts exists', () => {
    expect(fileExists('src/lib/intelligence/intelligence-solution-detail-view.ts')).toBe(true);
  });

  it('intelligence-contradiction-detail-view.ts exists', () => {
    expect(fileExists('src/lib/intelligence/intelligence-contradiction-detail-view.ts')).toBe(true);
  });

  it('IntelligenceSolutionsIndexPage.tsx exists (server component)', () => {
    expect(fileExists('src/components/intelligence/IntelligenceSolutionsIndexPage.tsx')).toBe(true);
  });

  it('IntelligenceSolutionDetailPage.tsx exists (server component)', () => {
    expect(fileExists('src/components/intelligence/IntelligenceSolutionDetailPage.tsx')).toBe(true);
  });

  it('IntelligenceContradictionDetailPage.tsx exists (server component)', () => {
    expect(fileExists('src/components/intelligence/IntelligenceContradictionDetailPage.tsx')).toBe(true);
  });

  it('IntelligenceSolutionsSentinel.tsx exists (client island)', () => {
    expect(fileExists('src/components/intelligence/IntelligenceSolutionsSentinel.tsx')).toBe(true);
  });

  it('IntelligenceContradictionDetailSentinel.tsx exists (client island)', () => {
    expect(fileExists('src/components/intelligence/IntelligenceContradictionDetailSentinel.tsx')).toBe(true);
  });

  it('SolutionsIndexPage.tsx has been deleted (I5)', () => {
    expect(fileExists('src/components/intelligence/SolutionsIndexPage.tsx')).toBe(false);
  });

  it('solutions/[solutionId]/page.tsx route exists', () => {
    expect(fileExists('src/app/intelligence/solutions/[solutionId]/page.tsx')).toBe(true);
  });

  it('contradictions/[contradictionId]/page.tsx route exists', () => {
    expect(fileExists('src/app/intelligence/contradictions/[contradictionId]/page.tsx')).toBe(true);
  });

  it('IntelligenceSolutionsIndexPage.tsx is NOT use client', () => {
    const src = readFile('src/components/intelligence/IntelligenceSolutionsIndexPage.tsx');
    expect(src.startsWith("'use client'")).toBe(false);
    expect(src.startsWith('"use client"')).toBe(false);
  });

  it('IntelligenceContradictionDetailPage.tsx is NOT use client', () => {
    const src = readFile('src/components/intelligence/IntelligenceContradictionDetailPage.tsx');
    expect(src.startsWith("'use client'")).toBe(false);
    expect(src.startsWith('"use client"')).toBe(false);
  });

  it('IntelligenceSolutionsSentinel.tsx IS use client', () => {
    const src = readFile('src/components/intelligence/IntelligenceSolutionsSentinel.tsx');
    expect(src).toContain("'use client'");
  });

  it('IntelligenceContradictionDetailSentinel.tsx IS use client', () => {
    const src = readFile('src/components/intelligence/IntelligenceContradictionDetailSentinel.tsx');
    expect(src).toContain("'use client'");
  });

  it('IntelligenceSolutionsIndexPage.tsx imports IntelligenceProvenanceRibbon', () => {
    const src = readFile('src/components/intelligence/IntelligenceSolutionsIndexPage.tsx');
    expect(src).toContain('IntelligenceProvenanceRibbon');
  });

  it('IntelligenceContradictionDetailPage.tsx imports IntelligenceProvenanceRibbon', () => {
    const src = readFile('src/components/intelligence/IntelligenceContradictionDetailPage.tsx');
    expect(src).toContain('IntelligenceProvenanceRibbon');
  });

  it('solutions/page.tsx uses IntelligenceSolutionsIndexPage not old SolutionsIndexPage', () => {
    const src = readFile('src/app/intelligence/solutions/page.tsx');
    expect(src).toContain('IntelligenceSolutionsIndexPage');
    expect(src).not.toContain("from '@/components/intelligence/SolutionsIndexPage'");
    expect(src).not.toContain('{ SolutionsIndexPage }');
  });

  it('contradiction route uses IntelligenceContradictionDetailPage', () => {
    const src = readFile('src/app/intelligence/contradictions/[contradictionId]/page.tsx');
    expect(src).toContain('IntelligenceContradictionDetailPage');
  });
});
