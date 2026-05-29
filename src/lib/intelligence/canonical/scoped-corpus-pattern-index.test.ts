import { searchCorpus } from '@/lib/corpus/retrieval';
import { searchIndustryScopedCorpusPatternIndex } from './scoped-corpus-pattern-index';

jest.mock('server-only', () => ({}));
jest.mock('@/lib/corpus/retrieval', () => ({
  searchCorpus: jest.fn(),
}));

const mockSearchCorpus = jest.mocked(searchCorpus);

function corpusHit(args: { slug: string; title: string; verticalOverlays: string[] }) {
  return {
    id: args.slug,
    slug: args.slug,
    title: args.title,
    category: 'industry-pattern',
    status: 'published' as const,
    confidence: 0.84,
    version: 1,
    parentVersionId: null,
    primaryAuthorId: 'abarva-corpus',
    approvedById: null,
    publishedAt: '2026-05-29T00:00:00.000Z',
    retiredAt: null,
    searchDocId: null,
    depthScore: 8.2,
    verticalOverlays: args.verticalOverlays,
    regionOverlays: [],
    applicableHorizons: ['diagnose_discover'],
    markdownBody: `# ${args.title}\n\n${args.title} corpus evidence.`,
    claims: [],
    evidence: [{ title: `${args.title} source`, source_id: `${args.slug}:source` }],
    counterarguments: [],
    synthesis: {
      source_basis: 'inferred_from_patterns',
      primary_kpis: ['cycle_time'],
      baseline_needed: ['current_cycle_time'],
      measurement_method: 'Compare baseline to target state.',
      provenance: {
        source: 'migrated_from_canonical_industry_ai_patterns',
        legacy_id: args.slug.toUpperCase(),
      },
    },
    createdAt: '2026-05-29T00:00:00.000Z',
    updatedAt: '2026-05-29T00:00:00.000Z',
    score: 0.71,
    source: 'postgres' as const,
  };
}

describe('searchIndustryScopedCorpusPatternIndex', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchCorpus.mockResolvedValue([
      corpusHit({ slug: 'retail-pattern', title: 'Retail OMS', verticalOverlays: ['retail'] }),
    ]);
  });

  it.each([
    ['apex-retail', 'Apex Retail', 'retail', ['retail', 'cross_industry']],
    ['meridian-health', 'Meridian Health', 'healthcare_provider', ['healthcare_provider', 'cross_industry']],
    ['northstar-clinical', 'Northstar Clinical Technologies', 'healthcare_medtech', ['healthcare_medtech', 'cross_industry']],
    ['first-capital', 'First Capital', 'financial_services_banking', ['financial_services_banking', 'cross_industry']],
    ['skyharbor-air', 'SkyHarbor Air', 'airline', ['airline', 'global_network_airline', 'aviation', 'cross_industry']],
  ])('passes tenant-scoped industry overlays for %s', async (tenantKey, activeClient, industry, expectedScopes) => {
    const result = await searchIndustryScopedCorpusPatternIndex({
      tenant_key: tenantKey,
      industry: industry as never,
      query: 'industry question',
      limit: 3,
    }, {
      scope: { tenantKey, activeClient, facts: [industry] },
    });

    expect(mockSearchCorpus).toHaveBeenCalledWith('industry question', expect.objectContaining({
      clientId: tenantKey,
      verticalOverlays: expectedScopes,
      limit: 3,
    }));
    expect(result.status).toBe('ready');
    expect(result.patterns[0]).toEqual(expect.objectContaining({
      canonical_id: 'RETAIL-PATTERN',
      title: 'Retail OMS',
    }));
  });
});
