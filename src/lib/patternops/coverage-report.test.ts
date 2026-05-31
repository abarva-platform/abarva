import { getPatternOpsCoverageReport } from './coverage-report';
import type { AzureReadClient } from '@/lib/data-plane/azureRead';

function fakeClient(responses: unknown[][]): AzureReadClient {
  const queue = [...responses];
  return {
    async query() {
      return (queue.shift() ?? []) as never[];
    },
    async select() {
      return [];
    },
    async maybeSingle() {
      return null;
    },
    async count() {
      return 0;
    },
    async withSession(fn) {
      return fn(async () => []);
    },
  };
}

describe('PatternOps coverage report', () => {
  it('summarizes genome, corpus, canonical, and tenant context counts', async () => {
    const report = await getPatternOpsCoverageReport(
      fakeClient([
        [
          {
            vertical: 'healthcare',
            enterprise_area: 'middle_office',
            pattern_count: '300',
            demo_relevant_count: '180',
            ai_pattern_count: '120',
            reviewed_count: '75',
            average_quality_score: '0.82',
          },
          {
            vertical: 'airline',
            enterprise_area: 'front_office',
            pattern_count: 240,
            demo_relevant_count: 90,
            ai_pattern_count: 70,
            reviewed_count: 20,
            average_quality_score: null,
          },
        ],
        [
          {
            source: 'corpus_patterns',
            category: 'retail',
            status: 'published',
            pattern_count: 12,
            average_confidence: '0.76',
          },
        ],
        [
          {
            source: 'canonical_industry_ai_patterns',
            category: 'healthcare',
            status: 'reviewed',
            pattern_count: '8',
            average_confidence: '0.91',
          },
        ],
        [
          {
            client_id: 'meridian-health',
            chunk_count: '2500',
            embedded_count: '2500',
            source_file_count: '42',
          },
        ],
      ]),
      new Date('2026-05-31T00:00:00Z'),
    );

    expect(report.generatedAt).toBe('2026-05-31T00:00:00.000Z');
    expect(report.genomeCoverage).toHaveLength(2);
    expect(report.corpusCoverage).toHaveLength(2);
    expect(report.tenantContext).toEqual([
      {
        clientId: 'meridian-health',
        chunkCount: 2500,
        embeddedCount: 2500,
        sourceFileCount: 42,
      },
    ]);
    expect(report.totals).toEqual({
      genomePatterns: 540,
      aiPatterns: 190,
      demoRelevantPatterns: 270,
      corpusPatterns: 20,
      tenantContextChunks: 2500,
      embeddedTenantContextChunks: 2500,
    });
  });

  it('returns an empty report when coverage tables are unavailable', async () => {
    const brokenClient: AzureReadClient = {
      async query() {
        throw new Error('relation does not exist');
      },
      async select() {
        return [];
      },
      async maybeSingle() {
        return null;
      },
      async count() {
        return 0;
      },
      async withSession(fn) {
        return fn(async () => []);
      },
    };

    const report = await getPatternOpsCoverageReport(brokenClient, new Date('2026-05-31T00:00:00Z'));

    expect(report.genomeCoverage).toEqual([]);
    expect(report.corpusCoverage).toEqual([]);
    expect(report.tenantContext).toEqual([]);
    expect(report.totals.genomePatterns).toBe(0);
  });
});
