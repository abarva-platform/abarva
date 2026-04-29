import { buildCorpusStatusReport } from '../../src/scripts/intelligence/corpus-status-report';
import { loadCorpus } from '../../src/lib/intelligence/loader';
import { corpus } from '../../src/lib/intelligence';

describe('corpus status report', () => {
  it('summarizes the shipped corpus and generated manifest without mutating either source', () => {
    const report = buildCorpusStatusReport({ generatedAt: '2026-04-29T00:00:00.000Z' });

    expect(report.counts).toEqual({
      patterns: corpus.patterns.length,
      signals: corpus.signals.length,
      solutions: corpus.solutions.length,
      contradictions: corpus.contradictions.length,
      total: corpus.patterns.length + corpus.signals.length + corpus.solutions.length + corpus.contradictions.length,
    });
    expect(report.sourcing.patternCount).toBe(corpus.patterns.filter((pattern) => pattern.domain === 'sourcing').length);
    expect(report.generatedManifest.actualPatternCount).toBeGreaterThan(0);
    expect(report.slugIdOverlap.slugMatches).toBeGreaterThan(0);
    expect(() => JSON.stringify(report)).not.toThrow();
  });

  it('reports stale generated-manifest copies and missing corpus source copies as warnings', () => {
    const loaded = loadCorpus({
      patterns: [
        {
          ...corpus.patterns[0],
          id: 'PAT-STATUS-REPORT-001',
          slug: 'status-report-pattern',
          domain: 'sourcing',
          sourceDocuments: ['docs/source-material/missing-status-report-source.md'],
        },
      ],
      signals: [],
      solutions: [],
      contradictions: [],
    });

    const report = buildCorpusStatusReport({
      corpus: loaded,
      generatedAt: '2026-04-29T00:00:00.000Z',
      manifest: {
        generatedAt: '2026-04-28T00:00:00.000Z',
        sourceDir: 'intelligence-pack',
        patternCount: 1,
        patterns: [
          {
            id: 'pattern_status_report_pattern',
            slug: 'status-report-pattern',
            sourceFile: 'status-report-pattern.md',
          },
        ],
      },
      statFile: (path) => {
        if (path.endsWith('status-report-pattern.md')) {
          return { exists: true, mtimeMs: Date.parse('2026-04-29T00:00:00.000Z') };
        }

        return { exists: false };
      },
    });

    expect(report.sourcing.patternCount).toBe(1);
    expect(report.slugIdOverlap.slugMatches).toBe(1);
    expect(report.slugIdOverlap.normalizedManifestIdToCorpusSlugMatches).toBe(1);
    expect(report.staleCopyWarnings.map((warning) => warning.code)).toEqual([
      'manifest-source-newer-than-generated-copy',
      'missing-corpus-source-document-copy',
    ]);
  });
});
