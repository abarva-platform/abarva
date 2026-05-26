const fromMock = jest.fn();

jest.mock('@/lib/supabase-server', () => ({
  getServerSupabase: () => ({ from: fromMock }),
}));

import {
  getTenantContextSummary,
  getTenantEmbeddingHistory,
  getTenantEvidenceMapForFile,
  getTenantIngestionStages,
  getTenantPendingChunks,
  getTenantSourceFiles,
} from '../tenant-context-read-model';

interface BuilderResult {
  data: unknown;
  error: unknown;
}

type Operation = {
  op: string;
  column?: string;
  value?: unknown;
};

function makeBuilder(result: BuilderResult, operations: Operation[] = []) {
  const builder: Record<string, unknown> = {};
  builder.select = () => builder;
  builder.eq = (column: string, value: unknown) => {
    operations.push({ op: 'eq', column, value });
    return builder;
  };
  builder.in = (column: string, value: unknown) => {
    operations.push({ op: 'in', column, value });
    return builder;
  };
  builder.order = () => builder;
  builder.limit = () => builder;
  builder.maybeSingle = () => Promise.resolve(result);
  builder.then = (resolve: (r: BuilderResult) => unknown) =>
    Promise.resolve(result).then(resolve);
  return builder as {
    select: () => unknown;
    eq: (column: string, value: unknown) => unknown;
    in: (column: string, value: unknown) => unknown;
    order: () => unknown;
    limit: () => unknown;
    maybeSingle: () => Promise<BuilderResult>;
    then: (r: (x: BuilderResult) => unknown) => Promise<unknown>;
  };
}

const clientRow = {
  id: 'client-1',
  tenant_key: 'northstar',
  slug: 'northstar-medtech',
  name: 'Northstar Clinical Technologies',
};

const chunkRows = [
  {
    chunk_id: 'chunk-1',
    source_doc: 'apps.csv',
    chunk_index: 0,
    chunk_text: 'Application portfolio evidence',
    embedding_status: 'embedded',
    embedding_model: 'text-embedding-3-small',
    embedded_at: '2026-05-26T10:00:00Z',
    embedding_error: null,
    created_at: '2026-05-26T09:00:00Z',
    updated_at: '2026-05-26T10:00:00Z',
    provenance: {},
    chunk_metadata: {},
  },
  {
    chunk_id: 'chunk-2',
    source_doc: 'apps.csv',
    chunk_index: 1,
    chunk_text: 'Second application portfolio evidence',
    embedding_status: 'pending',
    embedding_model: null,
    embedded_at: null,
    embedding_error: null,
    created_at: '2026-05-26T09:05:00Z',
    updated_at: '2026-05-26T09:05:00Z',
    provenance: {},
    chunk_metadata: {},
  },
  {
    chunk_id: 'chunk-3',
    source_doc: 'vendors.csv',
    chunk_index: 0,
    chunk_text: 'Vendor contract evidence',
    embedding_status: 'failed',
    embedding_model: null,
    embedded_at: null,
    embedding_error: 'embedding timeout',
    created_at: '2026-05-26T09:10:00Z',
    updated_at: '2026-05-26T09:15:00Z',
    provenance: {},
    chunk_metadata: {},
  },
];

const auditRows = [
  {
    id: 'audit-1',
    artifact_id: 'chunk-1',
    provider: 'openai-embeddings-primary',
    model: 'text-embedding-3-small',
    policy_decision: 'allow',
    created_at: '2026-05-26T10:00:30Z',
    request_metadata: { chunk_id: 'chunk-1' },
  },
  {
    id: 'audit-2',
    artifact_id: 'chunk-2',
    provider: 'openai-embeddings-primary',
    model: 'text-embedding-3-small',
    policy_decision: 'allow',
    created_at: '2026-05-26T10:01:30Z',
    request_metadata: { chunk_id: 'chunk-2' },
  },
];

function installMockData({
  clients = [clientRow],
  chunks = chunkRows,
  audits = auditRows,
}: {
  clients?: unknown[];
  chunks?: unknown[];
  audits?: unknown[];
} = {}) {
  const operations: Operation[] = [];
  fromMock.mockImplementation((table: string) => {
    if (table === 'clients') {
      return makeBuilder({ data: clients[0] ?? null, error: null }, operations);
    }
    if (table === 'enterprise_context_chunks') {
      return makeBuilder({ data: chunks, error: null }, operations);
    }
    if (table === 'ai_egress_audit') {
      return makeBuilder({ data: audits, error: null }, operations);
    }
    return makeBuilder({ data: null, error: { message: 'unknown table' } }, operations);
  });
  return operations;
}

describe('tenant context read model', () => {
  beforeEach(() => {
    fromMock.mockReset();
  });

  it('returns zero counts when tenant rows are absent', async () => {
    installMockData({ clients: [], chunks: [], audits: [] });

    const summary = await getTenantContextSummary('client-1');
    const stages = await getTenantIngestionStages('client-1');

    expect(summary).toMatchObject({
      tenantKey: 'unknown',
      displayName: 'Active client',
      ingestionFilesCount: 0,
      chunksCount: 0,
      chunksEmbedded: 0,
      chunksPending: 0,
      chunksFailed: 0,
      lastEmbeddedAt: null,
      embeddingProviders: [],
      embeddingModels: [],
      totalEmbeddingCalls: 0,
    });
    expect(stages).toHaveLength(8);
    expect(stages.every((stage) => stage.files === 0 && stage.facts === 0)).toBe(true);
  });

  it('summarizes chunk counts, provider grouping, model grouping, and latest embedded time', async () => {
    installMockData();

    const summary = await getTenantContextSummary('client-1');

    expect(summary.tenantKey).toBe('northstar');
    expect(summary.displayName).toBe('Northstar Clinical Technologies');
    expect(summary.ingestionFilesCount).toBe(2);
    expect(summary.chunksCount).toBe(3);
    expect(summary.chunksEmbedded).toBe(1);
    expect(summary.chunksPending).toBe(1);
    expect(summary.chunksFailed).toBe(1);
    expect(summary.lastEmbeddedAt).toBe('2026-05-26T10:00:00Z');
    expect(summary.embeddingProviders).toEqual(['openai-embeddings-primary']);
    expect(summary.embeddingModels).toEqual(['text-embedding-3-small']);
    expect(summary.totalEmbeddingCalls).toBe(2);
  });

  it('groups source files and preserves representative chunk ids', async () => {
    installMockData();

    const files = await getTenantSourceFiles('client-1');

    expect(files).toEqual([
      {
        source_doc: 'apps.csv',
        chunk_count: 2,
        first_loaded_at: '2026-05-26T09:00:00Z',
        sample_chunk_id: 'chunk-1',
      },
      {
        source_doc: 'vendors.csv',
        chunk_count: 1,
        first_loaded_at: '2026-05-26T09:10:00Z',
        sample_chunk_id: 'chunk-3',
      },
    ]);
  });

  it('filters evidence maps by client id and source document', async () => {
    const operations = installMockData({ chunks: [chunkRows[0]] });

    const rows = await getTenantEvidenceMapForFile('client-1', 'apps.csv');

    expect(rows).toEqual([
      {
        chunk_id: 'chunk-1',
        chunk_index: 0,
        chunk_text: 'Application portfolio evidence',
        embedding_status: 'embedded',
        embedded_at: '2026-05-26T10:00:00Z',
      },
    ]);
    expect(operations).toEqual(
      expect.arrayContaining([
        { op: 'eq', column: 'client_id', value: 'client-1' },
        { op: 'eq', column: 'source_doc', value: 'apps.csv' },
      ]),
    );
  });

  it('returns embedding history rows from egress audit metadata', async () => {
    installMockData();

    const history = await getTenantEmbeddingHistory('client-1');

    expect(history[0]).toEqual({
      id: 'audit-1',
      chunk_id: 'chunk-1',
      provider: 'openai-embeddings-primary',
      model: 'text-embedding-3-small',
      policy_decision: 'allow',
      created_at: '2026-05-26T10:00:30Z',
    });
  });

  it('returns pending and failed chunks with last error details', async () => {
    installMockData({ chunks: [chunkRows[1], chunkRows[2]] });

    const pending = await getTenantPendingChunks('client-1');

    expect(pending).toEqual([
      {
        chunk_id: 'chunk-2',
        source_doc: 'apps.csv',
        chunk_index: 1,
        embedding_status: 'pending',
        last_attempt_at: '2026-05-26T09:05:00Z',
        error_message: null,
      },
      {
        chunk_id: 'chunk-3',
        source_doc: 'vendors.csv',
        chunk_index: 0,
        embedding_status: 'failed',
        last_attempt_at: '2026-05-26T09:15:00Z',
        error_message: 'embedding timeout',
      },
    ]);
  });
});
