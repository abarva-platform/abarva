/**
 * I2 · INT-DTL-PATTERN — Intelligence pattern detail view model tests.
 *
 * Verifies:
 *   - buildIntelligencePatternDetailView returns correct views for all 4 fixtures
 *   - T3-H03 renders with ProvenanceRibbon and ≥2 evidence rows (I2 acceptance criterion)
 *   - View model is deterministic (same input → identical output)
 *   - ProvenanceRibbon view is present on every pattern
 *   - No live calls, no Math.random, no Date.now (module hygiene)
 *   - Server component and client island files exist
 */

import * as fs from 'fs';
import * as path from 'path';

import {
  buildIntelligencePatternDetailView,
  getKnownPatternIds,
} from '@/lib/intelligence/intelligence-pattern-detail-view';

const ROOT = path.resolve(__dirname, '../../../../');

function fileExists(rel: string): boolean {
  return fs.existsSync(path.join(ROOT, rel));
}

function readFile(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

// ---------------------------------------------------------------------------
// View model — known pattern IDs
// ---------------------------------------------------------------------------

describe('I2 · getKnownPatternIds', () => {
  it('returns all 4 fixture pattern IDs', () => {
    const ids = getKnownPatternIds();
    expect(ids).toContain('t3-h01');
    expect(ids).toContain('t3-h03');
    expect(ids).toContain('t1-f02');
    expect(ids).toContain('t2-c03');
    expect(ids.length).toBeGreaterThanOrEqual(4);
  });
});

// ---------------------------------------------------------------------------
// View model — null for unknown pattern
// ---------------------------------------------------------------------------

describe('I2 · buildIntelligencePatternDetailView — unknown pattern', () => {
  it('returns null for an unknown patternId', () => {
    expect(buildIntelligencePatternDetailView('not-a-real-pattern')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(buildIntelligencePatternDetailView('')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// T3-H03 — I2 acceptance criterion
// ---------------------------------------------------------------------------

describe('I2 · T3-H03 Unified Loyalty Intelligence', () => {
  const view = buildIntelligencePatternDetailView('t3-h03');

  it('view is not null', () => {
    expect(view).not.toBeNull();
  });

  it('patternKey is T3-H03', () => {
    expect(view?.patternKey).toBe('T3-H03');
  });

  it('patternName is correct', () => {
    expect(view?.patternName).toBe('Unified Loyalty Intelligence');
  });

  it('status is in-review', () => {
    expect(view?.status).toBe('in-review');
  });

  it('tier is T3', () => {
    expect(view?.tier).toBe('T3');
  });

  // ── I2 acceptance criterion: ≥2 evidence rows ─────────────────────────────

  it('has ≥2 evidence rows (T3-H03 has 4 sections)', () => {
    expect(view?.evidenceRows.length).toBeGreaterThanOrEqual(2);
  });

  it('evidence rows have non-empty heading and body', () => {
    view?.evidenceRows.forEach((row) => {
      expect(row.heading.length).toBeGreaterThan(0);
      expect(row.body.length).toBeGreaterThan(0);
    });
  });

  // ── I2 acceptance criterion: ProvenanceRibbon present ────────────────────

  it('provenanceRibbon is present', () => {
    expect(view?.provenanceRibbon).toBeDefined();
  });

  it('provenanceRibbon.primitive is Pattern', () => {
    expect(view?.provenanceRibbon.primitive).toBe('Pattern');
  });

  it('provenanceRibbon.runtimeLabel confirms no live Sentinel', () => {
    expect(view?.provenanceRibbon.runtimeLabel).toContain('no live Sentinel');
  });

  it('provenanceRibbon.sourceLabel is deterministic_seed', () => {
    expect(view?.provenanceRibbon.sourceLabel).toBe('deterministic_seed');
  });

  // ── Honesty ───────────────────────────────────────────────────────────────

  it('deterministicSeed is true', () => {
    expect(view?.deterministicSeed).toBe(true);
  });

  it('honestDisclaimer mentions deterministic', () => {
    expect(view?.honestDisclaimer.toLowerCase()).toContain('deterministic');
  });

  it('intelligenceLandingHref is /intelligence', () => {
    expect(view?.intelligenceLandingHref).toBe('/intelligence');
  });
});

// ---------------------------------------------------------------------------
// T3-H01 — validated pattern
// ---------------------------------------------------------------------------

describe('I2 · T3-H01 Ambient AI in Retail', () => {
  const view = buildIntelligencePatternDetailView('t3-h01');

  it('status is validated', () => {
    expect(view?.status).toBe('validated');
  });

  it('has ≥2 evidence rows', () => {
    expect((view?.evidenceRows.length ?? 0)).toBeGreaterThanOrEqual(2);
  });

  it('provenanceRibbon signalCount equals verdictEvidenceSources', () => {
    // signalCount comes from verdict.evidenceSources
    expect(view?.provenanceRibbon.signalCount).toBe(view?.verdict.evidenceSources);
  });

  it('usingPrograms is an array (T3-H01 fixture has 0 programs)', () => {
    // T3-H01 fixture ships with usingPrograms: [] — zero entries is valid.
    expect(Array.isArray(view?.usingPrograms)).toBe(true);
  });

  it('provenanceRibbon programCount matches usingPrograms count', () => {
    expect(view?.provenanceRibbon.programCount).toBe(view?.usingPrograms.length);
  });
});

// ---------------------------------------------------------------------------
// T1-F02 — candidate pattern
// ---------------------------------------------------------------------------

describe('I2 · T1-F02 AI Governance Baseline', () => {
  const view = buildIntelligencePatternDetailView('t1-f02');

  it('status is candidate', () => {
    expect(view?.status).toBe('candidate');
  });

  it('tier is T1', () => {
    expect(view?.tier).toBe('T1');
  });

  it('has ≥2 evidence rows', () => {
    expect((view?.evidenceRows.length ?? 0)).toBeGreaterThanOrEqual(2);
  });

  it('provenanceRibbon is present', () => {
    expect(view?.provenanceRibbon).toBeDefined();
    expect(view?.provenanceRibbon.primitive).toBe('Pattern');
  });
});

// ---------------------------------------------------------------------------
// T2-C03 — deprecated pattern
// ---------------------------------------------------------------------------

describe('I2 · T2-C03 Rules-Based Recommendation Engine', () => {
  const view = buildIntelligencePatternDetailView('t2-c03');

  it('status is deprecated', () => {
    expect(view?.status).toBe('deprecated');
  });

  it('has ≥1 evidence row', () => {
    expect((view?.evidenceRows.length ?? 0)).toBeGreaterThanOrEqual(1);
  });

  it('provenanceRibbon is present', () => {
    expect(view?.provenanceRibbon).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------------

describe('I2 · determinism', () => {
  it('buildIntelligencePatternDetailView is idempotent for t3-h03', () => {
    const v1 = buildIntelligencePatternDetailView('t3-h03');
    const v2 = buildIntelligencePatternDetailView('t3-h03');
    expect(JSON.stringify(v1)).toBe(JSON.stringify(v2));
  });

  it('buildIntelligencePatternDetailView is idempotent for t3-h01', () => {
    const v1 = buildIntelligencePatternDetailView('t3-h01');
    const v2 = buildIntelligencePatternDetailView('t3-h01');
    expect(JSON.stringify(v1)).toBe(JSON.stringify(v2));
  });
});

// ---------------------------------------------------------------------------
// Module hygiene
// ---------------------------------------------------------------------------

describe('I2 · module hygiene — intelligence-pattern-detail-view.ts', () => {
  const source = readFile('src/lib/intelligence/intelligence-pattern-detail-view.ts');

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

describe('I2 · file existence', () => {
  it('intelligence-pattern-detail-view.ts exists', () => {
    expect(fileExists('src/lib/intelligence/intelligence-pattern-detail-view.ts')).toBe(true);
  });

  it('IntelligencePatternDetailPage.tsx exists (server component)', () => {
    expect(fileExists('src/components/intelligence/IntelligencePatternDetailPage.tsx')).toBe(true);
  });

  it('IntelligencePatternDetailSentinel.tsx exists (client island)', () => {
    expect(fileExists('src/components/intelligence/IntelligencePatternDetailSentinel.tsx')).toBe(true);
  });

  it('PatternDetailPage.tsx has been deleted (I2)', () => {
    expect(fileExists('src/components/intelligence/PatternDetailPage.tsx')).toBe(false);
  });

  it('IntelligencePatternDetailPage.tsx is NOT use client', () => {
    const src = readFile('src/components/intelligence/IntelligencePatternDetailPage.tsx');
    expect(src.startsWith("'use client'")).toBe(false);
    expect(src.startsWith('"use client"')).toBe(false);
  });

  it('IntelligencePatternDetailSentinel.tsx IS use client', () => {
    const src = readFile('src/components/intelligence/IntelligencePatternDetailSentinel.tsx');
    expect(src).toContain("'use client'");
  });

  it('IntelligencePatternDetailPage.tsx imports IntelligenceProvenanceRibbon', () => {
    const src = readFile('src/components/intelligence/IntelligencePatternDetailPage.tsx');
    expect(src).toContain('IntelligenceProvenanceRibbon');
  });

  it('[patternId] route uses IntelligencePatternDetailPage not the old PatternDetailPage', () => {
    const src = readFile('src/app/intelligence/[patternId]/page.tsx');
    expect(src).toContain('IntelligencePatternDetailPage');
    // Old import path must not appear (note: 'IntelligencePatternDetailPage' contains
    // 'PatternDetailPage' as substring — we check for the old standalone import).
    expect(src).not.toContain("from '@/components/intelligence/PatternDetailPage'");
    expect(src).not.toContain('{ PatternDetailPage }');
  });
});
