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
});
