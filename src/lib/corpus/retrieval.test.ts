import { searchCorpus } from './retrieval';
import { queryCorpusSearch } from './azure-search';
import { embedPatternText } from './embedding';
import { withCorpusClient } from './db';

jest.mock('./azure-search', () => ({
  queryCorpusSearch: jest.fn(),
}));
jest.mock('./embedding', () => ({
  embedPatternText: jest.fn(),
}));
jest.mock('./db', () => ({
  withCorpusClient: jest.fn(),
  toJsonArray: (value: unknown) => Array.isArray(value) ? value : [],
  toJsonRecord: (value: unknown) => value && typeof value === 'object' && !Array.isArray(value) ? value : {},
  toStringArray: (value: unknown) => Array.isArray(value) ? value : [],
}));

const mockQueryCorpusSearch = jest.mocked(queryCorpusSearch);
const mockEmbedPatternText = jest.mocked(embedPatternText);
const mockWithCorpusClient = jest.mocked(withCorpusClient);

describe('searchCorpus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('keeps postgres corpus results when Azure Search is unavailable', async () => {
    mockEmbedPatternText.mockRejectedValue(new Error('embedding unavailable'));
    mockQueryCorpusSearch.mockRejectedValue(new Error('AZURE_SEARCH_ENDPOINT missing'));
    mockWithCorpusClient.mockImplementation(async (fn) =>
      fn({
        query: jest.fn().mockResolvedValue({
          rows: [{
            id: 'pattern_1',
            slug: 'retail-pattern',
            title: 'Retail pattern',
            category: 'industry-pattern',
            status: 'published',
            confidence: 0.84,
            version: 1,
            parent_version_id: null,
            primary_author_id: 'abarva-corpus',
            approved_by_id: null,
            published_at: '2026-05-29T00:00:00.000Z',
            retired_at: null,
            search_doc_id: null,
            depth_score: 8.2,
            vertical_overlays: ['retail'],
            region_overlays: [],
            applicable_horizons: [],
            markdown_body: 'Retail pattern body',
            claims_jsonb: [],
            evidence_jsonb: [],
            counterarguments_jsonb: [],
            synthesis_jsonb: {},
            created_at: '2026-05-29T00:00:00.000Z',
            updated_at: '2026-05-29T00:00:00.000Z',
            text_rank: 0.5,
          }],
        }),
      } as never),
    );

    const hits = await searchCorpus('retail', {
      clientId: 'apex-retail',
      verticalOverlays: ['retail', 'cross_industry'],
      limit: 5,
    });

    expect(hits).toHaveLength(1);
    expect(hits[0]).toEqual(expect.objectContaining({
      slug: 'retail-pattern',
      verticalOverlays: ['retail'],
      source: 'postgres',
    }));
  });

  it('hydrates Azure-only Lakeshore vector hits from Postgres before returning results', async () => {
    mockEmbedPatternText.mockResolvedValue({
      embedding: [0.1, 0.2, 0.3],
      model: 'text-embedding-3-small',
      auditId: 'audit-1',
    });
    mockQueryCorpusSearch.mockResolvedValue([{
      id: 'search-doc-95',
      slug: 'pat-lsh-d01-00095',
      version: 1,
      score: 0.73,
    }]);
    const query = jest.fn()
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [{
          id: 'pattern_95',
          slug: 'pat-lsh-d01-00095',
          title: 'Liquidity reserve sizing precedes every deployment target',
          category: 'D01:capital_allocation',
          status: 'published',
          confidence: 1,
          version: 1,
          parent_version_id: null,
          primary_author_id: 'lakeshore-corpus-loader',
          approved_by_id: 'lakeshore-corpus-loader',
          published_at: '2026-06-04T00:00:00.000Z',
          retired_at: null,
          search_doc_id: 'search-doc-95',
          depth_score: 9,
          vertical_overlays: ['lakeshore-capital', 'private-holdings'],
          region_overlays: ['chicago'],
          applicable_horizons: ['lakeshore-capital', 'decision-pattern'],
          markdown_body: 'Liquidity reserves come before deployment targets.',
          claims_jsonb: [],
          evidence_jsonb: [],
          counterarguments_jsonb: [],
          synthesis_jsonb: {},
          created_at: '2026-06-04T00:00:00.000Z',
          updated_at: '2026-06-04T00:00:00.000Z',
          text_rank: 0,
        }],
      });
    mockWithCorpusClient.mockImplementation(async (fn) => fn({ query } as never));

    const hits = await searchCorpus('semantic liquidity reserve question', {
      clientId: 'f2ef0b6a-9f20-4d3d-9dd9-8f8ec01f2a61',
      clientKey: 'lakeshore',
      verticalOverlays: ['lakeshore-capital', 'private-holdings'],
      limit: 5,
    });

    expect(mockQueryCorpusSearch).toHaveBeenCalledWith(expect.objectContaining({
      clientKey: 'lakeshore',
      filter: expect.stringContaining("vertical_overlays/any"),
    }));
    expect(query).toHaveBeenCalledTimes(2);
    expect(hits).toHaveLength(1);
    expect(hits[0]).toEqual(expect.objectContaining({
      slug: 'pat-lsh-d01-00095',
      source: 'fused',
      verticalOverlays: ['lakeshore-capital', 'private-holdings'],
    }));
  });
});
