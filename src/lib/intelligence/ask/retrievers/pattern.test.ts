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

describe('retrievePattern', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('falls back to corpus_patterns when genome_patterns has no matches', async () => {
    mockAzureRead.query.mockResolvedValue([]);
    mockSearchCorpus.mockResolvedValue([{
        id: 'pattern-1',
        slug: 'aip-healthcare-prior-auth-agentic-workflow',
        title: 'Prior Authorization Agentic Workflow',
        category: 'utilization_management',
        status: 'published',
        confidence: 0.84,
        version: 1,
        parentVersionId: null,
        primaryAuthorId: 'abarva-corpus',
        approvedById: null,
        publishedAt: '2026-05-29T00:00:00.000Z',
        retiredAt: null,
        searchDocId: null,
        depthScore: 8.2,
        verticalOverlays: ['healthcare', 'cross_industry'],
        regionOverlays: [],
        applicableHorizons: ['diagnose_discover', 'design'],
        markdownBody: 'Coordinate payer prior authorization intake, evidence checks, and escalation.',
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
        source: 'postgres',
    }]);

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
      verticalOverlays: ['healthcare', 'cross_industry'],
      minConfidence: 0,
      minDepthScore: 0,
      limit: 5,
    });
    expect(result.sources).toEqual([expect.objectContaining({
      type: 'PATTERN',
      id: 'aip-healthcare-prior-auth-agentic-workflow',
      name: 'Prior Authorization Agentic Workflow',
      confidence: 0.74,
      detail: expect.stringContaining('industry_scope=healthcare, cross_industry'),
    })]);
    expect(result.averageConfidence).toBe(0.74);
  });
});
