import { queryCorpusSearch } from './azure-search';

const originalEnv = process.env;

describe('queryCorpusSearch', () => {
  beforeEach(() => {
    process.env = {
      ...originalEnv,
      AZURE_SEARCH_SERVICE_NAME: 'srchlakeshorepilotlsh001',
      AZURE_SEARCH_QUERY_KEY: 'query-key',
      LAKESHORE_CORPUS_SEARCH_INDEX: 'lakeshore-patterns-v1',
    };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ value: [] }),
    }) as jest.Mock;
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it('queries the Lakeshore native vector index only for Lakeshore client keys', async () => {
    await queryCorpusSearch({
      query: 'liquidity reserves',
      clientId: 'f2ef0b6a-9f20-4d3d-9dd9-8f8ec01f2a61',
      clientKey: 'lakeshore',
      vector: [0.1, 0.2, 0.3],
      filter: 'confidence ge 0',
      top: 5,
    });

    const calls = (global.fetch as jest.Mock).mock.calls;
    expect(calls.map(([url]) => String(url))).toEqual([
      expect.stringContaining('/indexes/corpus-global/docs/search'),
      expect.stringContaining('/indexes/lakeshore-patterns-v1/docs/search'),
    ]);
    const lakeshoreBody = JSON.parse(calls[1][1].body);
    expect(lakeshoreBody.filter).toContain("tenant_scope eq 'lakeshore'");
    expect(lakeshoreBody.semanticConfiguration).toBe('lakeshore-pattern-semantic');
    expect(lakeshoreBody.vectorQueries[0]).toEqual(expect.objectContaining({
      fields: 'embedding',
      k: 5,
    }));
  });
});
