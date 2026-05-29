import { retrievePattern } from './pattern';
import { azureRead } from '@/lib/data-plane/azureRead';
import { searchCorpus } from '@/lib/corpus/retrieval';

jest.mock('server-only', () => ({}));
jest.mock('@/lib/data-plane/azureRead', () => ({
  azureRead: {
    query: jest.fn(),
  },
}));
jest.mock('@/lib/corpus/retrieval', () => ({
  searchCorpus: jest.fn(),
}));

const mockAzureRead = jest.mocked(azureRead);
const mockSearchCorpus = jest.mocked(searchCorpus);

function corpusHit(args: {
  slug: string;
  title: string;
  verticalOverlays: string[];
}) {
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
    applicableHorizons: ['diagnose_discover', 'design'],
    markdownBody: `${args.title} industry corpus pattern.`,
    claims: [],
    evidence: [],
    counterarguments: [],
    synthesis: {
      source_basis: 'inferred_from_patterns',
      provenance: { source: 'migrated_from_canonical_industry_ai_patterns' },
    },
    createdAt: '2026-05-29T00:00:00.000Z',
    updatedAt: '2026-05-29T00:00:00.000Z',
    score: 0.74,
    source: 'postgres' as const,
  };
}

describe('retrievePattern', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('falls back to corpus_patterns when genome_patterns has no matches', async () => {
    mockAzureRead.query.mockResolvedValue([]);
    mockSearchCorpus.mockResolvedValue([
      corpusHit({
        slug: 'aip-healthcare-prior-auth-agentic-workflow',
        title: 'Prior Authorization Agentic Workflow',
        verticalOverlays: ['healthcare_provider', 'cross_industry'],
      }),
    ]);

    const result = await retrievePattern(['prior auth agentic workflow'], {
      tenantInventoryKey: 'meridian-health',
      surfaceContext: { activeClient: 'Meridian Health' },
    });

    expect(mockAzureRead.query).toHaveBeenCalledWith(
      expect.stringContaining('FROM genome_patterns'),
      ['prior auth agentic workflow'],
      { missingTable: 'empty' },
    );
    expect(mockSearchCorpus).toHaveBeenCalledWith('prior auth agentic workflow', {
      clientId: 'meridian-health',
      verticalOverlays: ['healthcare_provider', 'cross_industry'],
      minConfidence: 0,
      minDepthScore: 0,
      limit: 5,
    });
    expect(result.sources).toEqual([expect.objectContaining({
      type: 'PATTERN',
      id: 'aip-healthcare-prior-auth-agentic-workflow',
      name: 'Prior Authorization Agentic Workflow',
      confidence: 0.74,
      detail: expect.stringContaining('industry_scope=healthcare_provider, cross_industry'),
    })]);
    expect(result.averageConfidence).toBe(0.74);
  });

  it('enforces I9 industry isolation across five query classes for every seeded tenant', async () => {
    const allIndustryHits = [
      corpusHit({ slug: 'retail-pattern', title: 'Retail OMS Pattern', verticalOverlays: ['retail'] }),
      corpusHit({ slug: 'healthcare-provider-pattern', title: 'Healthcare Prior Auth Pattern', verticalOverlays: ['healthcare_provider'] }),
      corpusHit({ slug: 'healthcare-medtech-pattern', title: 'Healthcare Medtech QMS Pattern', verticalOverlays: ['healthcare_medtech'] }),
      corpusHit({ slug: 'financial-pattern', title: 'Financial Services Model Risk Pattern', verticalOverlays: ['financial_services_banking'] }),
      corpusHit({ slug: 'airline-pattern', title: 'Airline Modernization Pattern', verticalOverlays: ['airline'] }),
      corpusHit({ slug: 'cross-pattern', title: 'Cross Industry Governance Pattern', verticalOverlays: ['cross_industry'] }),
    ];
    const tenants = [
      {
        tenantInventoryKey: 'apex-retail',
        activeClient: 'Apex Retail',
        allowed: new Set(['retail-pattern', 'cross-pattern']),
        expectedScopes: ['retail', 'cross_industry'],
      },
      {
        tenantInventoryKey: 'meridian-health',
        activeClient: 'Meridian Health',
        allowed: new Set(['healthcare-provider-pattern', 'cross-pattern']),
        expectedScopes: ['healthcare_provider', 'cross_industry'],
      },
      {
        tenantInventoryKey: 'northstar-clinical',
        activeClient: 'Northstar Clinical Technologies',
        allowed: new Set(['healthcare-medtech-pattern', 'cross-pattern']),
        expectedScopes: ['healthcare_medtech', 'cross_industry'],
      },
      {
        tenantInventoryKey: 'first-capital',
        activeClient: 'First Capital',
        allowed: new Set(['financial-pattern', 'cross-pattern']),
        expectedScopes: ['financial_services_banking', 'cross_industry'],
      },
      {
        tenantInventoryKey: 'skyharbor-air',
        activeClient: 'SkyHarbor Air',
        allowed: new Set(['airline-pattern', 'cross-pattern']),
        expectedScopes: ['airline', 'global_network_airline', 'aviation', 'cross_industry'],
      },
    ];
    const queries = [
      'modern omnichannel OMS vendor landscape',
      'prior authorization agentic workflow',
      'model risk validation controls',
      'grid reliability AI operations',
      'airline mainframe modernization sequencing',
    ];

    mockAzureRead.query.mockResolvedValue([]);
    mockSearchCorpus.mockResolvedValue(allIndustryHits);

    for (const tenant of tenants) {
      for (const query of queries) {
        const result = await retrievePattern([query], {
          query,
          tenantInventoryKey: tenant.tenantInventoryKey,
          surfaceContext: { activeClient: tenant.activeClient },
        });

        expect(mockSearchCorpus).toHaveBeenLastCalledWith(query, expect.objectContaining({
          clientId: tenant.tenantInventoryKey,
          verticalOverlays: tenant.expectedScopes,
        }));
        expect(result.sources.length).toBeGreaterThan(0);
        expect(result.sources.map((source) => source.id)).toEqual(
          expect.arrayContaining(['cross-pattern']),
        );
        for (const source of result.sources) {
          expect(tenant.allowed.has(String(source.id))).toBe(true);
        }
      }
    }
  });
});
