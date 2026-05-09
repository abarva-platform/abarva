import { loadCorpus } from '../../src/lib/intelligence';
import { CXO_THEME_PATTERNS } from '../../src/lib/intelligence/seed-patterns-cxo-themes';

const THEMES = [
  'ai-led-operations',
  'back-office-ai-automation',
  'contact-to-experience-transformation',
  'ambient-ai',
  'value-based-contracting',
  'it-reorg-under-ai-pressure',
] as const;

describe('CXO theme pattern expansion', () => {
  it('adds four pattern entries for each CXO theme', () => {
    for (const theme of THEMES) {
      const patterns = CXO_THEME_PATTERNS.filter((pattern) =>
        pattern.body.includes(`the ${theme} theme`),
      );

      expect(patterns).toHaveLength(4);
    }
  });

  it('keeps every CXO pattern grounded in evidence anchors, failure modes, and worldview linkage', () => {
    expect(CXO_THEME_PATTERNS).toHaveLength(24);

    for (const pattern of CXO_THEME_PATTERNS) {
      expect(pattern.id).toMatch(/^PAT-CXO-/);
      expect(pattern.thesis.length).toBeGreaterThan(80);
      expect(pattern.body).toContain('## Evidence anchors');
      expect(pattern.body).toContain('## Failure modes');
      expect(pattern.body).toContain('## Worldview linkage');
      expect(pattern.body.match(/^- /gm)?.length).toBeGreaterThanOrEqual(6);
      expect(pattern.relatedPatternIds.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('loads CXO theme entries into the default corpus index', () => {
    const corpus = loadCorpus({ loadedAt: '2026-05-09T00:00:00.000Z' });

    for (const pattern of CXO_THEME_PATTERNS) {
      expect(corpus.patternsById.get(pattern.id)).toBe(pattern);
    }
  });
});
