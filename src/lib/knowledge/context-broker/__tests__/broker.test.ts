/**
 * ContextBroker · CB-1 + CB-3 unit tests.
 *
 * Exercises the per-mode composition discipline against a hand-rolled
 * `TenantDataAdapter` mock. No real DB / Pinecone / OpenAI — vector
 * retrieval is exercised via an injected OpenAIEmbeddingsLike stub
 * and an adapter whose `chunksByVector` is overridden.
 */

import {
  DefaultContextBroker,
  MissingTenantKeyError,
  WARNING_CORPUS_PENDING,
  WARNING_VECTOR_PENDING,
  extractKeywords,
  vectorRetrievalInfoTag,
  type ContextBroker,
} from '..';
import type { OpenAIEmbeddingsLike } from '../embedding-client';
import type { TenantDataAdapter } from '@/lib/knowledge/tenant-data';
import type {
  ContextChunk,
  GraphNeighborhood,
  TenantRecord,
} from '@/lib/knowledge/tenant-data/types';

jest.mock('server-only', () => ({}));

const EMBED_DIM = 1536;

function makeFakeOpenAI(): OpenAIEmbeddingsLike {
  return {
    embeddings: {
      create: jest.fn(async ({ input }: { model: string; input: string[] }) => ({
        data: input.map((_, idx) => ({
          embedding: new Array<number>(EMBED_DIM).fill((idx + 1) / 1000),
          index: idx,
        })),
        usage: { prompt_tokens: input.length * 50, total_tokens: input.length * 50 },
      })),
    },
  };
}

const TENANT = 'apex-retail';

function makeRecord(recordId: string, title = recordId): TenantRecord {
  return {
    tenantKey: TENANT,
    segmentId: 'program_inventory',
    recordId,
    recordKind: 'program_record',
    title,
    payload: {},
    sourceBasis: `synthetic://${recordId}`,
    classification: 'internal',
    confidence: 0.9,
  };
}

function makeChunk(chunkId: string, recordId: string): ContextChunk {
  return {
    tenantKey: TENANT,
    chunkId,
    recordId,
    text: `chunk text for ${recordId}`,
    embeddingStatus: 'pending',
    sourceBasis: `synthetic://${recordId}`,
    classification: 'internal',
  };
}

function makeNeighborhood(rootId: string): GraphNeighborhood {
  return {
    rootId,
    nodes: [
      {
        tenantKey: TENANT,
        nodeId: rootId,
        kind: 'program',
        title: rootId,
        payload: {},
      },
    ],
    edges: [
      {
        tenantKey: TENANT,
        edgeId: `${rootId}::SPONSORED_BY::person:apex:jennifer-park`,
        fromNodeId: rootId,
        toNodeId: 'person:apex:jennifer-park',
        kind: 'SPONSORED_BY',
      },
    ],
    depth: 1,
  };
}

interface AdapterOverrides {
  chunksByKeyword?: TenantDataAdapter['chunksByKeyword'];
  getRecord?: TenantDataAdapter['getRecord'];
  chunksByVector?: TenantDataAdapter['chunksByVector'];
  getGraphNeighborhood?: TenantDataAdapter['getGraphNeighborhood'];
}

function buildAdapter(overrides: AdapterOverrides = {}): TenantDataAdapter {
  return {
    listSegments: jest.fn().mockResolvedValue([]),
    listRecords: jest.fn().mockResolvedValue([]),
    getRecord: overrides.getRecord ?? jest.fn().mockResolvedValue(null),
    listGraphNodes: jest.fn().mockResolvedValue([]),
    listGraphEdgesForNode: jest.fn().mockResolvedValue([]),
    getGraphNeighborhood:
      overrides.getGraphNeighborhood
      ?? jest.fn().mockResolvedValue({ rootId: 'x', nodes: [], edges: [], depth: 0 }),
    pathBetween: jest.fn().mockResolvedValue(null),
    listContextChunks: jest.fn().mockResolvedValue([]),
    chunksByRecord: jest.fn().mockResolvedValue([]),
    chunksByKeyword: overrides.chunksByKeyword ?? jest.fn().mockResolvedValue([]),
    chunksByVector:
      overrides.chunksByVector
      ?? jest.fn().mockRejectedValue(new Error('Vector retrieval not yet enabled.')),
    getEvidence: jest.fn().mockResolvedValue(null),
    hasPersistedData: jest.fn().mockResolvedValue(true),
  };
}

function makeBroker(
  overrides: AdapterOverrides = {},
  openai: OpenAIEmbeddingsLike = makeFakeOpenAI(),
): { broker: ContextBroker; adapter: TenantDataAdapter } {
  const adapter = buildAdapter(overrides);
  const broker = new DefaultContextBroker(adapter, openai);
  return { broker, adapter };
}

describe('extractKeywords', () => {
  it('lowercases, drops stopwords + short tokens, dedupes, caps at 10', () => {
    const out = extractKeywords(
      'Who is the sponsor of the Apex CDP program and which systems does it depend on?',
    );
    expect(out).toEqual(
      expect.arrayContaining(['sponsor', 'apex', 'cdp', 'program', 'systems', 'depend']),
    );
    expect(out.length).toBeLessThanOrEqual(10);
    expect(out).not.toContain('the');
    expect(out).not.toContain('is');
  });

  it('strips trailing punctuation', () => {
    expect(extractKeywords('budget?')).toEqual(['budget']);
  });

  it('returns [] for empty / whitespace-only input', () => {
    expect(extractKeywords('')).toEqual([]);
    expect(extractKeywords('   ')).toEqual([]);
  });
});

describe('DefaultContextBroker.assemble — generic mode', () => {
  it('returns empty bundle with no facts/graph/chunks/patterns', async () => {
    const { broker } = makeBroker();
    const bundle = await broker.assemble({ query: 'anything', mode: 'generic' });

    expect(bundle.mode).toBe('generic');
    expect(bundle.tenantKey).toBeNull();
    expect(bundle.facts).toEqual([]);
    expect(bundle.graphPaths).toEqual([]);
    expect(bundle.semanticChunks).toEqual([]);
    expect(bundle.corpusPatterns).toEqual([]);
    expect(bundle.provenance).toEqual([]);
    expect(bundle.warnings).toEqual([]);
  });

  it('does not call the adapter at all', async () => {
    const { broker, adapter } = makeBroker();
    await broker.assemble({ query: 'q', mode: 'generic' });
    expect(adapter.chunksByKeyword).not.toHaveBeenCalled();
    expect(adapter.chunksByVector).not.toHaveBeenCalled();
    expect(adapter.getRecord).not.toHaveBeenCalled();
  });
});

describe('DefaultContextBroker.assemble — corpus mode', () => {
  it('returns empty bundle with the CB-6 warning', async () => {
    const { broker } = makeBroker();
    const bundle = await broker.assemble({ query: 'pattern question', mode: 'corpus' });

    expect(bundle.mode).toBe('corpus');
    expect(bundle.tenantKey).toBeNull();
    expect(bundle.facts).toEqual([]);
    expect(bundle.graphPaths).toEqual([]);
    expect(bundle.semanticChunks).toEqual([]);
    expect(bundle.corpusPatterns).toEqual([]);
    expect(bundle.provenance).toEqual([]);
    expect(bundle.warnings).toEqual([WARNING_CORPUS_PENDING]);
  });
});

describe('DefaultContextBroker.assemble — tenant mode', () => {
  it('throws MissingTenantKeyError when tenantKey is absent', async () => {
    const { broker } = makeBroker();
    await expect(
      broker.assemble({ query: 'who sponsors apex cdp', mode: 'tenant' }),
    ).rejects.toBeInstanceOf(MissingTenantKeyError);
  });

  it('hydrates facts from chunksByKeyword + getRecord (keyword-fallback path)', async () => {
    const seedChunks: ContextChunk[] = [
      makeChunk('chunk:apex:cdp:001', 'program:apex-cdp-2026'),
      makeChunk('chunk:apex:cdp:002', 'program:apex-cdp-2026'), // dupe record_id
      makeChunk('chunk:apex:contact:001', 'program:apex-contact-center-ai-2026'),
    ];
    const records: Record<string, TenantRecord> = {
      'program:apex-cdp-2026': makeRecord('program:apex-cdp-2026', 'Apex CDP 2026'),
      'program:apex-contact-center-ai-2026': makeRecord('program:apex-contact-center-ai-2026'),
    };

    // Default adapter has chunksByVector rejecting — keyword fallback fires.
    const { broker } = makeBroker({
      chunksByKeyword: jest.fn().mockResolvedValue(seedChunks),
      getRecord: jest.fn().mockImplementation((_t: string, id: string) => Promise.resolve(records[id] ?? null)),
      getGraphNeighborhood: jest.fn().mockImplementation((_t: string, rootId: string) =>
        Promise.resolve(makeNeighborhood(rootId))),
    });

    const bundle = await broker.assemble({
      query: 'who sponsors the apex cdp program',
      mode: 'tenant',
      tenantKey: TENANT,
    });

    expect(bundle.mode).toBe('tenant');
    expect(bundle.tenantKey).toBe(TENANT);
    expect(bundle.facts.length).toBe(2);
    expect(bundle.facts.map((f) => f.recordId)).toEqual([
      'program:apex-cdp-2026',
      'program:apex-contact-center-ai-2026',
    ]);
    // Both record ids start with `program:`, so both should yield neighborhoods.
    expect(bundle.graphPaths.length).toBe(2);
    expect(bundle.warnings).toContain(WARNING_VECTOR_PENDING);
    expect(bundle.warnings).not.toContain(WARNING_CORPUS_PENDING);
  });

  it('uses Pinecone vector retrieval when chunksByVector succeeds', async () => {
    const seedChunks: ContextChunk[] = [
      makeChunk('chunk:apex:cdp:001', 'program:apex-cdp-2026'),
    ];
    const vectorChunks: ContextChunk[] = [
      { ...makeChunk('chunk:apex:cdp:vec:001', 'program:apex-cdp-2026'), vectorScore: 0.91 },
      { ...makeChunk('chunk:apex:cdp:vec:002', 'program:apex-cdp-2026'), vectorScore: 0.84 },
    ];
    const { broker, adapter } = makeBroker({
      chunksByKeyword: jest.fn().mockResolvedValue(seedChunks),
      getRecord: jest.fn().mockResolvedValue(makeRecord('program:apex-cdp-2026')),
      chunksByVector: jest.fn().mockResolvedValue(vectorChunks),
    });

    const bundle = await broker.assemble({
      query: 'apex cdp sponsor',
      mode: 'tenant',
      tenantKey: TENANT,
      maxChunks: 5,
    });

    expect(adapter.chunksByVector).toHaveBeenCalled();
    expect(bundle.semanticChunks).toHaveLength(2);
    expect(bundle.semanticChunks[0]).toMatchObject({
      score: 0.91,
      chunk: expect.objectContaining({ chunkId: 'chunk:apex:cdp:vec:001' }),
    });
    expect(bundle.semanticChunks[1].score).toBe(0.84);
    expect(bundle.warnings).not.toContain(WARNING_VECTOR_PENDING);
    expect(bundle.warnings).toContain(vectorRetrievalInfoTag(5));
  });

  it('falls back to keyword retrieval and tags WARNING_VECTOR_PENDING when embedTexts throws', async () => {
    const fallbackChunks: ContextChunk[] = [
      makeChunk('chunk:apex:keywords:001', 'program:apex-cdp-2026'),
    ];
    const failingOpenAI: OpenAIEmbeddingsLike = {
      embeddings: {
        create: jest.fn(async () => {
          throw new Error('OpenAI down');
        }),
      },
    };
    const adapter = buildAdapter({
      chunksByKeyword: jest.fn().mockResolvedValue(fallbackChunks),
      getRecord: jest.fn().mockResolvedValue(makeRecord('program:apex-cdp-2026')),
      // chunksByVector would succeed if reached — but embedTexts fails first.
      chunksByVector: jest.fn().mockResolvedValue([]),
    });
    const broker = new DefaultContextBroker(adapter, failingOpenAI);

    const bundle = await broker.assemble({
      query: 'apex cdp',
      mode: 'tenant',
      tenantKey: TENANT,
    });

    expect(bundle.warnings).toContain(WARNING_VECTOR_PENDING);
    expect(bundle.semanticChunks.length).toBeGreaterThan(0);
    expect(bundle.semanticChunks[0].score).toBe(0); // keyword fallback marker
  });

  it('catches chunksByVector throws and falls back to keyword retrieval', async () => {
    const fallbackChunks: ContextChunk[] = [
      makeChunk('chunk:apex:keywords:001', 'program:apex-cdp-2026'),
    ];
    const { broker, adapter } = makeBroker({
      chunksByKeyword: jest.fn().mockResolvedValue(fallbackChunks),
      getRecord: jest.fn().mockResolvedValue(makeRecord('program:apex-cdp-2026')),
    });

    const bundle = await broker.assemble({
      query: 'apex cdp',
      mode: 'tenant',
      tenantKey: TENANT,
    });

    expect(adapter.chunksByVector).toHaveBeenCalled();
    expect(bundle.warnings).toContain(WARNING_VECTOR_PENDING);
    expect(bundle.semanticChunks.length).toBeGreaterThan(0);
    expect(bundle.semanticChunks[0].score).toBe(0); // keyword fallback marker
  });

  it('emits one provenance entry per fact + graphPath + chunk', async () => {
    const seedChunks: ContextChunk[] = [
      makeChunk('chunk:apex:cdp:001', 'program:apex-cdp-2026'),
    ];
    const { broker } = makeBroker({
      chunksByKeyword: jest.fn().mockResolvedValue(seedChunks),
      getRecord: jest.fn().mockResolvedValue(makeRecord('program:apex-cdp-2026')),
      getGraphNeighborhood: jest.fn().mockImplementation((_t: string, rootId: string) =>
        Promise.resolve(makeNeighborhood(rootId))),
    });

    const bundle = await broker.assemble({
      query: 'apex cdp sponsor',
      mode: 'tenant',
      tenantKey: TENANT,
    });

    const expected =
      bundle.facts.length + bundle.graphPaths.length + bundle.semanticChunks.length;
    expect(bundle.provenance.length).toBe(expected);
    for (const p of bundle.provenance) {
      expect(typeof p.sourceId).toBe('string');
      expect(p.sourceId.length).toBeGreaterThan(0);
    }
  });

  it('skips graph traversal for records whose id has no graph prefix', async () => {
    const seedChunks: ContextChunk[] = [
      makeChunk('chunk:apex:kpi:001', 'kpi_dictionary:apex:001'),
    ];
    const nonGraphRecord: TenantRecord = {
      ...makeRecord('kpi_dictionary:apex:001'),
      segmentId: 'kpi_dictionary',
    };
    const getGraphNeighborhood = jest.fn();
    const { broker } = makeBroker({
      chunksByKeyword: jest.fn().mockResolvedValue(seedChunks),
      getRecord: jest.fn().mockResolvedValue(nonGraphRecord),
      getGraphNeighborhood,
    });

    const bundle = await broker.assemble({
      query: 'kpi target',
      mode: 'tenant',
      tenantKey: TENANT,
    });

    expect(bundle.facts.length).toBe(1);
    expect(bundle.graphPaths).toEqual([]);
    expect(getGraphNeighborhood).not.toHaveBeenCalled();
  });
});

describe('DefaultContextBroker.assemble — full mode', () => {
  it('throws MissingTenantKeyError when tenantKey is absent', async () => {
    const { broker } = makeBroker();
    await expect(
      broker.assemble({ query: 'q', mode: 'full' }),
    ).rejects.toBeInstanceOf(MissingTenantKeyError);
  });

  it('behaves like tenant mode + tags the corpus-pending warning', async () => {
    const seedChunks: ContextChunk[] = [
      makeChunk('chunk:apex:cdp:001', 'program:apex-cdp-2026'),
    ];
    const { broker } = makeBroker({
      chunksByKeyword: jest.fn().mockResolvedValue(seedChunks),
      getRecord: jest.fn().mockResolvedValue(makeRecord('program:apex-cdp-2026')),
      getGraphNeighborhood: jest.fn().mockImplementation((_t: string, rootId: string) =>
        Promise.resolve(makeNeighborhood(rootId))),
    });

    const bundle = await broker.assemble({
      query: 'apex cdp sponsor',
      mode: 'full',
      tenantKey: TENANT,
    });

    expect(bundle.mode).toBe('full');
    expect(bundle.facts.length).toBeGreaterThan(0);
    expect(bundle.graphPaths.length).toBeGreaterThan(0);
    expect(bundle.warnings).toContain(WARNING_VECTOR_PENDING);
    expect(bundle.warnings).toContain(WARNING_CORPUS_PENDING);
  });
});

describe('DefaultContextBroker.assemble — clamps + metadata', () => {
  it('clamps maxFacts at 50 (request 100 → over-fetch is bounded)', async () => {
    const chunksByKeyword = jest.fn().mockResolvedValue([]);
    const { broker } = makeBroker({ chunksByKeyword });

    await broker.assemble({
      query: 'budget',
      mode: 'tenant',
      tenantKey: TENANT,
      maxFacts: 100,
    });

    // The broker over-fetches by 2x but the cap on maxFacts is 50,
    // so chunksByKeyword should be called with 100 (= 50 * 2), never 200.
    expect(chunksByKeyword).toHaveBeenCalledWith(TENANT, expect.any(Array), 100);
  });

  it('clamps maxChunks at 20', async () => {
    const chunksByKeyword = jest.fn().mockResolvedValue([]);
    const { broker, adapter } = makeBroker({ chunksByKeyword });

    await broker.assemble({
      query: 'budget',
      mode: 'tenant',
      tenantKey: TENANT,
      maxChunks: 100,
    });

    // chunksByKeyword is called twice in tenant mode: once for fact
    // hydration and once for the keyword fallback. Find the fallback
    // call (the only one whose limit equals maxChunks).
    const lastCall = (adapter.chunksByKeyword as jest.Mock).mock.calls.at(-1);
    expect(lastCall?.[2]).toBe(20);
  });

  it('floors maxFacts at 1 when 0 is requested', async () => {
    const chunksByKeyword = jest.fn().mockResolvedValue([]);
    const { broker } = makeBroker({ chunksByKeyword });

    await broker.assemble({
      query: 'budget',
      mode: 'tenant',
      tenantKey: TENANT,
      maxFacts: 0,
    });

    expect(chunksByKeyword).toHaveBeenCalledWith(TENANT, expect.any(Array), 2);
  });

  it('assembledAt is a valid ISO timestamp', async () => {
    const { broker } = makeBroker();
    const bundle = await broker.assemble({ query: 'q', mode: 'generic' });
    expect(typeof bundle.assembledAt).toBe('string');
    expect(Number.isNaN(Date.parse(bundle.assembledAt))).toBe(false);
    // Round-trip stable.
    expect(new Date(bundle.assembledAt).toISOString()).toBe(bundle.assembledAt);
  });

  it('preserves the verbatim query in the bundle', async () => {
    const { broker } = makeBroker();
    const query = 'Who SPONSORS the apex.cdp program??';
    const bundle = await broker.assemble({ query, mode: 'generic' });
    expect(bundle.query).toBe(query);
  });
});
