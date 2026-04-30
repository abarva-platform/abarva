/**
 * CB-3 · Pinecone client unit tests.
 *
 * No real Pinecone — `createPineconeClientForTests` accepts a
 * hand-rolled `PineconeIndexLike` so we can assert batching,
 * filtering, and metadata round-tripping deterministically.
 */

jest.mock('server-only', () => ({}));

import type { RecordMetadata } from '@pinecone-database/pinecone';
import {
  __resetPineconeClientForTests,
  createPineconeClientForTests,
  getPineconeClient,
  PINECONE_DEFAULT_INDEX_NAME,
  PINECONE_UPSERT_BATCH_SIZE,
  type PineconeIndexLike,
  type PineconeUpsertItem,
} from '../pinecone-client';

const EMBED_DIM = 1536;

function makeFakeIndex(): {
  index: PineconeIndexLike;
  upsertCalls: Array<unknown[]>;
  queryCalls: Array<{ vector: number[]; topK: number; filter?: object }>;
  deleteCalls: Array<{ ids?: string[]; filter?: object }>;
  matches: Array<{ id: string; score?: number; metadata?: RecordMetadata }>;
} {
  const upsertCalls: Array<unknown[]> = [];
  const queryCalls: Array<{ vector: number[]; topK: number; filter?: object }> = [];
  const deleteCalls: Array<{ ids?: string[]; filter?: object }> = [];
  const matches: Array<{ id: string; score?: number; metadata?: RecordMetadata }> = [];

  const index: PineconeIndexLike = {
    async upsert(records) {
      upsertCalls.push(records);
    },
    async query(options) {
      queryCalls.push({
        vector: options.vector,
        topK: options.topK,
        filter: options.filter,
      });
      return { matches };
    },
    async deleteMany(options) {
      deleteCalls.push(options);
    },
  };

  return { index, upsertCalls, queryCalls, deleteCalls, matches };
}

function makeUpsertItem(id: string, tenantKey = 'apex-retail'): PineconeUpsertItem {
  return {
    id,
    vector: new Array<number>(EMBED_DIM).fill(0.001),
    metadata: {
      tenant_key: tenantKey,
      record_kind: 'kpi_definition',
      source_segment: 'kpi_dictionary',
      record_id: 'kpi_dictionary:apex:nps',
      confidence: 0.85,
      data_classification: 'internal',
      chunk_index: 0,
      source_doc: 'kpi_dictionary.csv',
    },
  };
}

beforeEach(() => {
  __resetPineconeClientForTests();
});

describe('getPineconeClient()', () => {
  const realKey = process.env.PINECONE_API_KEY;
  const realIndex = process.env.PINECONE_INDEX_NAME;

  afterEach(() => {
    if (realKey === undefined) {
      delete process.env.PINECONE_API_KEY;
    } else {
      process.env.PINECONE_API_KEY = realKey;
    }
    if (realIndex === undefined) {
      delete process.env.PINECONE_INDEX_NAME;
    } else {
      process.env.PINECONE_INDEX_NAME = realIndex;
    }
    __resetPineconeClientForTests();
  });

  it('returns null when PINECONE_API_KEY is not set', () => {
    delete process.env.PINECONE_API_KEY;
    __resetPineconeClientForTests();
    expect(getPineconeClient()).toBeNull();
  });

  it('returns null when PINECONE_API_KEY is an empty string', () => {
    process.env.PINECONE_API_KEY = '';
    __resetPineconeClientForTests();
    expect(getPineconeClient()).toBeNull();
  });

  it('exports the expected default index name', () => {
    expect(PINECONE_DEFAULT_INDEX_NAME).toBe('abarva-tenant-context-prod');
  });
});

describe('PineconeClient.upsert', () => {
  it('returns { upsertedCount: 0 } and skips the SDK on empty input', async () => {
    const { index, upsertCalls } = makeFakeIndex();
    const client = createPineconeClientForTests(index);
    const out = await client.upsert([]);
    expect(out).toEqual({ upsertedCount: 0 });
    expect(upsertCalls).toHaveLength(0);
  });

  it('batches at 100 vectors per API call', async () => {
    const { index, upsertCalls } = makeFakeIndex();
    const client = createPineconeClientForTests(index);

    const items = Array.from({ length: 250 }, (_, i) => makeUpsertItem(`chunk-${i}`));
    const out = await client.upsert(items);

    expect(PINECONE_UPSERT_BATCH_SIZE).toBe(100);
    expect(out.upsertedCount).toBe(250);
    expect(upsertCalls).toHaveLength(3); // 100 + 100 + 50
    expect((upsertCalls[0] as unknown[]).length).toBe(100);
    expect((upsertCalls[1] as unknown[]).length).toBe(100);
    expect((upsertCalls[2] as unknown[]).length).toBe(50);
  });

  it('serialises metadata fields onto each upserted record', async () => {
    const { index, upsertCalls } = makeFakeIndex();
    const client = createPineconeClientForTests(index);
    await client.upsert([makeUpsertItem('chunk-1')]);

    const records = upsertCalls[0] as Array<{
      id: string;
      values: number[];
      metadata: Record<string, unknown>;
    }>;
    expect(records[0].id).toBe('chunk-1');
    expect(records[0].values).toHaveLength(EMBED_DIM);
    expect(records[0].metadata).toMatchObject({
      tenant_key: 'apex-retail',
      record_kind: 'kpi_definition',
      source_segment: 'kpi_dictionary',
      record_id: 'kpi_dictionary:apex:nps',
      confidence: 0.85,
      data_classification: 'internal',
      chunk_index: 0,
      source_doc: 'kpi_dictionary.csv',
    });
  });

  it('throws when an item is missing tenant_key (tenant-isolation safety net)', async () => {
    const { index } = makeFakeIndex();
    const client = createPineconeClientForTests(index);
    const broken: PineconeUpsertItem = {
      id: 'chunk-x',
      vector: new Array<number>(EMBED_DIM).fill(0),
      metadata: {
        tenant_key: '',
        record_kind: 'kpi_definition',
        source_segment: 'kpi_dictionary',
        record_id: 'r',
      },
    };
    await expect(client.upsert([broken])).rejects.toThrow(/missing required metadata.tenant_key/);
  });

  it('throws on empty vector', async () => {
    const { index } = makeFakeIndex();
    const client = createPineconeClientForTests(index);
    const broken: PineconeUpsertItem = {
      id: 'chunk-x',
      vector: [],
      metadata: {
        tenant_key: 't',
        record_kind: 'k',
        source_segment: 's',
        record_id: 'r',
      },
    };
    await expect(client.upsert([broken])).rejects.toThrow(/no vector/);
  });
});

describe('PineconeClient.query', () => {
  it('always sets tenant_key in the metadata filter', async () => {
    const fake = makeFakeIndex();
    const client = createPineconeClientForTests(fake.index);
    await client.query({ vector: [0.1, 0.2], tenantKey: 'apex-retail' });

    expect(fake.queryCalls).toHaveLength(1);
    expect(fake.queryCalls[0].filter).toEqual({
      tenant_key: { $eq: 'apex-retail' },
    });
  });

  it('ANDs caller-supplied metadataFilter with the tenant_key filter', async () => {
    const fake = makeFakeIndex();
    const client = createPineconeClientForTests(fake.index);
    await client.query({
      vector: [0.1],
      tenantKey: 'apex-retail',
      metadataFilter: { record_kind: { $eq: 'kpi_definition' } },
    });
    expect(fake.queryCalls[0].filter).toEqual({
      tenant_key: { $eq: 'apex-retail' },
      record_kind: { $eq: 'kpi_definition' },
    });
  });

  it('defaults topK to 10 and clamps to MAX_TOP_K (100)', async () => {
    const fake = makeFakeIndex();
    const client = createPineconeClientForTests(fake.index);

    await client.query({ vector: [0.1], tenantKey: 'apex-retail' });
    expect(fake.queryCalls[0].topK).toBe(10);

    await client.query({ vector: [0.1], tenantKey: 'apex-retail', topK: 9999 });
    expect(fake.queryCalls[1].topK).toBe(100);

    await client.query({ vector: [0.1], tenantKey: 'apex-retail', topK: 0 });
    expect(fake.queryCalls[2].topK).toBe(1);
  });

  it('parses Pinecone matches into PineconeQueryResult shape', async () => {
    const fake = makeFakeIndex();
    fake.matches.push(
      {
        id: 'chunk-1',
        score: 0.91,
        metadata: {
          tenant_key: 'apex-retail',
          record_kind: 'kpi_definition',
          source_segment: 'kpi_dictionary',
          record_id: 'kpi_dictionary:apex:nps',
          confidence: 0.85,
          chunk_index: 0,
        },
      },
      { id: 'chunk-2', score: 0.84, metadata: { tenant_key: 'apex-retail', record_kind: 'k', source_segment: 's', record_id: 'r' } },
    );

    const client = createPineconeClientForTests(fake.index);
    const out = await client.query({ vector: [0.1], tenantKey: 'apex-retail' });
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({ id: 'chunk-1', score: 0.91 });
    expect(out[0].metadata.tenant_key).toBe('apex-retail');
    expect(out[0].metadata.confidence).toBe(0.85);
    expect(out[0].metadata.chunk_index).toBe(0);
  });

  it('throws when tenantKey is empty (tenant-isolation contract)', async () => {
    const fake = makeFakeIndex();
    const client = createPineconeClientForTests(fake.index);
    await expect(
      client.query({ vector: [0.1], tenantKey: '' }),
    ).rejects.toThrow(/tenantKey is required/);
  });

  it('throws on empty vector', async () => {
    const fake = makeFakeIndex();
    const client = createPineconeClientForTests(fake.index);
    await expect(
      client.query({ vector: [], tenantKey: 'apex-retail' }),
    ).rejects.toThrow(/vector is required/);
  });

  it('does not leak across tenants — tenant_key filter is the only enforcement', async () => {
    // The fake echoes whatever the client passes; we assert the
    // filter shape so a Pinecone-side mistake can't silently expose
    // the wrong tenant. (Real cross-tenant probes live in
    // TENANT_ISOLATION_PROBES.)
    const fake = makeFakeIndex();
    const client = createPineconeClientForTests(fake.index);
    await client.query({ vector: [0.1], tenantKey: 'tenant-a' });
    await client.query({ vector: [0.1], tenantKey: 'tenant-b' });
    expect(fake.queryCalls[0].filter).toEqual({ tenant_key: { $eq: 'tenant-a' } });
    expect(fake.queryCalls[1].filter).toEqual({ tenant_key: { $eq: 'tenant-b' } });
  });
});

describe('PineconeClient.deleteByIds', () => {
  it('no-ops on empty input', async () => {
    const fake = makeFakeIndex();
    const client = createPineconeClientForTests(fake.index);
    await client.deleteByIds([]);
    expect(fake.deleteCalls).toHaveLength(0);
  });

  it('calls deleteMany with the ids list, batched at 100', async () => {
    const fake = makeFakeIndex();
    const client = createPineconeClientForTests(fake.index);
    const ids = Array.from({ length: 220 }, (_, i) => `chunk-${i}`);
    await client.deleteByIds(ids);
    expect(fake.deleteCalls).toHaveLength(3);
    expect(fake.deleteCalls[0]).toEqual({ ids: ids.slice(0, 100) });
    expect(fake.deleteCalls[1]).toEqual({ ids: ids.slice(100, 200) });
    expect(fake.deleteCalls[2]).toEqual({ ids: ids.slice(200) });
  });
});

describe('PineconeClient.deleteByTenant', () => {
  it('calls deleteMany with the tenant_key metadata filter', async () => {
    const fake = makeFakeIndex();
    const client = createPineconeClientForTests(fake.index);
    await client.deleteByTenant('apex-retail');
    expect(fake.deleteCalls).toEqual([
      { filter: { tenant_key: { $eq: 'apex-retail' } } },
    ]);
  });

  it('throws on empty tenantKey', async () => {
    const fake = makeFakeIndex();
    const client = createPineconeClientForTests(fake.index);
    await expect(client.deleteByTenant('')).rejects.toThrow(/tenantKey is required/);
  });
});
