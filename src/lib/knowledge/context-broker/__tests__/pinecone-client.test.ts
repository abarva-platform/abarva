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
  PINECONE_DEFAULT_TENANT_INDEX_NAME,
  PINECONE_DEFAULT_WORLDVIEW_INDEX_NAME,
  PINECONE_INDEX_TENANT,
  PINECONE_INDEX_WORLDVIEW,
  PINECONE_UPSERT_BATCH_SIZE,
  type PineconeClient,
  type PineconeIndexLike,
  type PineconeUpsertItem,
  type PineconeWorldviewMetadata,
} from '../pinecone-client';

const EMBED_DIM = 1536;

/** Helper: build a properly-dimensioned tenant query vector for tests. */
function tenantVec(): number[] {
  return new Array<number>(EMBED_DIM).fill(0.001);
}

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
    async upsert(args) {
      upsertCalls.push(args.records);
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
    await client.query({ vector: tenantVec(), tenantKey: 'apex-retail' });

    expect(fake.queryCalls).toHaveLength(1);
    expect(fake.queryCalls[0].filter).toEqual({
      tenant_key: { $eq: 'apex-retail' },
    });
  });

  it('ANDs caller-supplied metadataFilter with the tenant_key filter', async () => {
    const fake = makeFakeIndex();
    const client = createPineconeClientForTests(fake.index);
    await client.query({
      vector: tenantVec(),
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

    await client.query({ vector: tenantVec(), tenantKey: 'apex-retail' });
    expect(fake.queryCalls[0].topK).toBe(10);

    await client.query({ vector: tenantVec(), tenantKey: 'apex-retail', topK: 9999 });
    expect(fake.queryCalls[1].topK).toBe(100);

    await client.query({ vector: tenantVec(), tenantKey: 'apex-retail', topK: 0 });
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
    const out = await client.query({ vector: tenantVec(), tenantKey: 'apex-retail' });
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
      client.query({ vector: tenantVec(), tenantKey: '' }),
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
    await client.query({ vector: tenantVec(), tenantKey: 'tenant-a' });
    await client.query({ vector: tenantVec(), tenantKey: 'tenant-b' });
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

// ── WV-INGEST: multi-index registry + worldview mode ────────────────

const WORLDVIEW_DIM = 3072;

function makeWorldviewItem(
  id: string,
  thesisId: string,
): PineconeUpsertItem<PineconeWorldviewMetadata> {
  return {
    id,
    vector: new Array<number>(WORLDVIEW_DIM).fill(0.001),
    metadata: {
      chunk_id: id,
      thesis_id: thesisId,
      thesis_title: 'Foundation Models as the Next Enterprise OS',
      chunk_position: 1,
      chunk_total_in_thesis: 17,
      chunk_title: 'The OS Shift Is Real, But Misnamed',
      chunk_type: 'claim',
      keywords: ['enterprise OS', 'binding layer'],
      audience_tags: ['founder', 'investor'],
      primary_audience: 'founder',
      confidence: 0.82,
      is_forecast: true,
      validation_status: 'draft',
      last_validated: '2026-04-30',
      source_basis: 'worldview_corpus',
    },
  };
}

describe('multi-index config exports (WV-INGEST)', () => {
  it('PINECONE_INDEX_TENANT carries 1536 dims and tenant mode', () => {
    expect(PINECONE_INDEX_TENANT.dimension).toBe(1536);
    expect(PINECONE_INDEX_TENANT.metric).toBe('cosine');
    expect(PINECONE_INDEX_TENANT.mode).toBe('tenant');
  });

  it('PINECONE_INDEX_WORLDVIEW carries 3072 dims, worldview namespace, worldview mode', () => {
    expect(PINECONE_INDEX_WORLDVIEW.dimension).toBe(3072);
    expect(PINECONE_INDEX_WORLDVIEW.metric).toBe('cosine');
    expect(PINECONE_INDEX_WORLDVIEW.namespace).toBe('worldview');
    expect(PINECONE_INDEX_WORLDVIEW.mode).toBe('worldview');
  });

  it('exposes default index names for both indexes', () => {
    expect(PINECONE_DEFAULT_TENANT_INDEX_NAME).toBe('abarva-tenant-context-prod');
    expect(PINECONE_DEFAULT_WORLDVIEW_INDEX_NAME).toBe('abarva-worldview-prod');
    // Back-compat alias matches the tenant name.
    expect(PINECONE_DEFAULT_INDEX_NAME).toBe(PINECONE_DEFAULT_TENANT_INDEX_NAME);
  });
});

describe('getPineconeClient(config) — multi-index registry', () => {
  const realKey = process.env.PINECONE_API_KEY;

  afterEach(() => {
    if (realKey === undefined) {
      delete process.env.PINECONE_API_KEY;
    } else {
      process.env.PINECONE_API_KEY = realKey;
    }
    __resetPineconeClientForTests();
  });

  it('returns null for both indexes when PINECONE_API_KEY is not set', () => {
    delete process.env.PINECONE_API_KEY;
    __resetPineconeClientForTests();
    expect(getPineconeClient(PINECONE_INDEX_TENANT)).toBeNull();
    expect(getPineconeClient(PINECONE_INDEX_WORLDVIEW)).toBeNull();
  });

  it('returns distinct clients for tenant and worldview indexes', () => {
    process.env.PINECONE_API_KEY = 'test-key';
    __resetPineconeClientForTests();
    const tenant = getPineconeClient(PINECONE_INDEX_TENANT);
    const worldview = getPineconeClient(PINECONE_INDEX_WORLDVIEW);
    expect(tenant).not.toBeNull();
    expect(worldview).not.toBeNull();
    expect(tenant).not.toBe(worldview);
    expect(tenant?.getConfig?.()?.mode).toBe('tenant');
    expect(worldview?.getConfig?.()?.mode).toBe('worldview');
  });

  it('memoises clients by index name', () => {
    process.env.PINECONE_API_KEY = 'test-key';
    __resetPineconeClientForTests();
    const a = getPineconeClient(PINECONE_INDEX_TENANT);
    const b = getPineconeClient(PINECONE_INDEX_TENANT);
    expect(a).toBe(b);
  });
});

describe('worldview-mode PineconeClient', () => {
  it('upsert validates 3072-dim vectors against the worldview config', async () => {
    const fake = makeFakeIndex();
    const client = createPineconeClientForTests<PineconeWorldviewMetadata>(
      fake.index,
      PINECONE_INDEX_WORLDVIEW,
    );
    await client.upsert([makeWorldviewItem('worldview:W1:001', 'W1')]);
    const records = fake.upsertCalls[0] as Array<{
      id: string;
      values: number[];
      metadata: Record<string, unknown>;
    }>;
    expect(records).toHaveLength(1);
    expect(records[0].id).toBe('worldview:W1:001');
    expect(records[0].values).toHaveLength(WORLDVIEW_DIM);
    // Worldview metadata round-trips the structured fields.
    expect(records[0].metadata).toMatchObject({
      chunk_id: 'worldview:W1:001',
      thesis_id: 'W1',
      thesis_title: 'Foundation Models as the Next Enterprise OS',
      chunk_position: 1,
      chunk_title: 'The OS Shift Is Real, But Misnamed',
      chunk_type: 'claim',
      keywords: ['enterprise OS', 'binding layer'],
      audience_tags: ['founder', 'investor'],
      primary_audience: 'founder',
      confidence: 0.82,
      is_forecast: true,
      validation_status: 'draft',
      last_validated: '2026-04-30',
      source_basis: 'worldview_corpus',
    });
  });

  it('upsert throws when vector dimension does not match the index config', async () => {
    const fake = makeFakeIndex();
    const client: PineconeClient<PineconeWorldviewMetadata> =
      createPineconeClientForTests<PineconeWorldviewMetadata>(
        fake.index,
        PINECONE_INDEX_WORLDVIEW,
      );
    const wrongDim: PineconeUpsertItem<PineconeWorldviewMetadata> = {
      id: 'worldview:W1:001',
      vector: new Array<number>(1536).fill(0), // tenant-dim vector
      metadata: {
        chunk_id: 'worldview:W1:001',
        thesis_id: 'W1',
        thesis_title: 't',
        source_basis: 'worldview_corpus',
      },
    };
    await expect(client.upsert([wrongDim])).rejects.toThrow(
      /1536-dim vector; index .* expects 3072/,
    );
  });

  it('query does NOT require tenantKey on worldview-mode index', async () => {
    const fake = makeFakeIndex();
    const client = createPineconeClientForTests<PineconeWorldviewMetadata>(
      fake.index,
      PINECONE_INDEX_WORLDVIEW,
    );
    await client.query({ vector: new Array<number>(WORLDVIEW_DIM).fill(0.1) });
    expect(fake.queryCalls).toHaveLength(1);
    // No filter means the full namespace is searched.
    expect(fake.queryCalls[0].filter).toBeUndefined();
  });

  it('query passes through caller-supplied metadata filter on worldview', async () => {
    const fake = makeFakeIndex();
    const client = createPineconeClientForTests<PineconeWorldviewMetadata>(
      fake.index,
      PINECONE_INDEX_WORLDVIEW,
    );
    await client.query({
      vector: new Array<number>(WORLDVIEW_DIM).fill(0.1),
      metadataFilter: { thesis_id: { $eq: 'W1' } },
    });
    expect(fake.queryCalls[0].filter).toEqual({ thesis_id: { $eq: 'W1' } });
    // Importantly: no `tenant_key` key is injected for worldview.
    expect(fake.queryCalls[0].filter).not.toHaveProperty('tenant_key');
  });

  it('query rejects vectors with the wrong dimension on worldview', async () => {
    const fake = makeFakeIndex();
    const client = createPineconeClientForTests<PineconeWorldviewMetadata>(
      fake.index,
      PINECONE_INDEX_WORLDVIEW,
    );
    await expect(
      client.query({ vector: [0.1, 0.2, 0.3] }), // 3 dims, not 3072
    ).rejects.toThrow(/expects 3072/);
  });

  it('deleteByTenant throws on worldview-mode index', async () => {
    const fake = makeFakeIndex();
    const client = createPineconeClientForTests<PineconeWorldviewMetadata>(
      fake.index,
      PINECONE_INDEX_WORLDVIEW,
    );
    await expect(client.deleteByTenant('apex-retail')).rejects.toThrow(
      /not supported on worldview-mode/,
    );
  });

  it('tenant-mode query still requires tenantKey (back-compat with CB-3)', async () => {
    const fake = makeFakeIndex();
    const client = createPineconeClientForTests(fake.index, PINECONE_INDEX_TENANT);
    await expect(
      client.query({ vector: new Array<number>(EMBED_DIM).fill(0.1) }),
    ).rejects.toThrow(/tenantKey is required/);
  });
});
