import { queryCorpusSearch, uploadCorpusSearchDocument } from './azure-search';
import type { CorpusPatternRecord } from './types';

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

  it('uploads Lakeshore-authored corpus documents to the native Lakeshore index', async () => {
    process.env = {
      ...process.env,
      AZURE_SEARCH_ADMIN_KEY: 'admin-key',
    };
    const pattern = {
      id: 'pattern-1',
      slug: 'lakeshore-kyriba-bank-connectivity-gate',
      title: 'Kyriba bank connectivity must clear before rollout confidence',
      category: 'treasury',
      status: 'published',
      confidence: 0.92,
      version: 3,
      parentVersionId: null,
      primaryAuthorId: 'user_1',
      approvedById: 'user_2',
      publishedAt: '2026-06-06T00:00:00.000Z',
      retiredAt: null,
      searchDocId: null,
      depthScore: 9,
      verticalOverlays: ['finance', 'treasury'],
      regionOverlays: ['chicago'],
      applicableHorizons: ['first-90-days'],
      markdownBody: 'Bank connectivity is a readiness gate, not a late implementation task.',
      claims: [],
      evidence: [],
      counterarguments: [],
      synthesis: {},
      createdAt: '2026-06-06T00:00:00.000Z',
      updatedAt: '2026-06-06T00:00:00.000Z',
    } satisfies CorpusPatternRecord;

    await uploadCorpusSearchDocument({
      pattern,
      embedding: [0.1, 0.2, 0.3],
      clientId: 'f2ef0b6a-9f20-4d3d-9dd9-8f8ec01f2a61',
      clientKey: 'lakeshore',
    });

    const [[url, options]] = (global.fetch as jest.Mock).mock.calls;
    expect(String(url)).toContain('/indexes/lakeshore-patterns-v1/docs/index');
    const body = JSON.parse(options.body);
    expect(body.value[0]).toEqual(expect.objectContaining({
      slug: 'lakeshore-kyriba-bank-connectivity-gate',
      client_id: 'f2ef0b6a-9f20-4d3d-9dd9-8f8ec01f2a61',
      tenant_scope: 'lakeshore',
    }));
  });

  it('uploads non-Lakeshore client corpus documents to the generic private client index', async () => {
    process.env = {
      ...process.env,
      AZURE_SEARCH_ADMIN_KEY: 'admin-key',
    };
    const pattern = {
      id: 'pattern-2',
      slug: 'meridian-care-gap-command-center',
      title: 'Care gap command center requires attribution proof',
      category: 'healthcare',
      status: 'published',
      confidence: 0.9,
      version: 1,
      parentVersionId: null,
      primaryAuthorId: 'user_1',
      approvedById: 'user_2',
      publishedAt: '2026-06-06T00:00:00.000Z',
      retiredAt: null,
      searchDocId: null,
      depthScore: 9,
      verticalOverlays: ['healthcare'],
      regionOverlays: [],
      applicableHorizons: ['first-90-days'],
      markdownBody: 'Attribution quality must be proven before value claims are accepted.',
      claims: [],
      evidence: [],
      counterarguments: [],
      synthesis: {},
      createdAt: '2026-06-06T00:00:00.000Z',
      updatedAt: '2026-06-06T00:00:00.000Z',
    } satisfies CorpusPatternRecord;

    await uploadCorpusSearchDocument({
      pattern,
      embedding: [0.1, 0.2, 0.3],
      clientId: 'meridian-client-id',
      clientKey: 'meridian',
    });

    const [[url, options]] = (global.fetch as jest.Mock).mock.calls;
    expect(String(url)).toContain('/indexes/corpus-client-meridian-client-id/docs/index');
    const body = JSON.parse(options.body);
    expect(body.value[0]).toEqual(expect.objectContaining({
      slug: 'meridian-care-gap-command-center',
      client_id: 'meridian-client-id',
    }));
    expect(body.value[0]).not.toHaveProperty('tenant_scope');
  });
});
