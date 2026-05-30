const azureReadSelectMock = jest.fn();
const azureReadMaybeSingleMock = jest.fn();

jest.mock('@/lib/data-plane/azureRead', () => ({
  azureRead: {
    select: (...args: unknown[]) => azureReadSelectMock(...args),
    maybeSingle: (...args: unknown[]) => azureReadMaybeSingleMock(...args),
  },
}));

import {
  getTenantContextSummary,
  getTenantEmbeddingHistory,
  getTenantEvidenceMapForFile,
  getTenantIngestionStages,
  getTenantPendingChunks,
  getTenantSourceFiles,
} from '../tenant-context-read-model';

type Operation = {
  op: string;
  column?: string;
  value?: unknown;
};

const clientRow = {
  id: 'client-1',
  tenant_key: 'northstar-clinical',
  slug: 'northstar-clinical',
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
  azureReadMaybeSingleMock.mockImplementation((request: { table: string; where?: Record<string, unknown> }) => {
    operations.push({ op: 'maybeSingle', column: request.table, value: request.where });
    if (request.table === 'clients') return Promise.resolve(clients[0] ?? null);
    return Promise.resolve(null);
  });
  azureReadSelectMock.mockImplementation((request: { table: string; where?: Record<string, unknown> }) => {
    operations.push({ op: 'select', column: request.table, value: request.where });
    if (request.table === 'enterprise_context_chunks') return Promise.resolve(chunks);
    if (request.table === 'ai_egress_audit') return Promise.resolve(audits);
    return Promise.resolve([]);
  });
  return operations;
}

describe('tenant context read model', () => {
  beforeEach(() => {
    azureReadSelectMock.mockReset();
    azureReadMaybeSingleMock.mockReset();
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

    expect(summary.tenantKey).toBe('northstar-clinical');
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

  it('normalizes postgres Date timestamps before returning page-facing rows', async () => {
    installMockData({
      chunks: [
        {
          ...chunkRows[0],
          embedded_at: new Date('2026-05-26T10:00:00Z'),
          created_at: new Date('2026-05-26T09:00:00Z'),
          updated_at: new Date('2026-05-26T10:00:00Z'),
        },
      ],
      audits: [
        {
          ...auditRows[0],
          created_at: new Date('2026-05-26T10:00:30Z'),
        },
      ],
    });

    await expect(getTenantContextSummary('client-1')).resolves.toMatchObject({
      lastEmbeddedAt: '2026-05-26T10:00:00.000Z',
    });
    await expect(getTenantSourceFiles('client-1')).resolves.toEqual([
      expect.objectContaining({
        first_loaded_at: '2026-05-26T09:00:00.000Z',
      }),
    ]);
    await expect(getTenantEmbeddingHistory('client-1')).resolves.toEqual([
      expect.objectContaining({
        created_at: '2026-05-26T10:00:30.000Z',
      }),
    ]);
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
        { op: 'select', column: 'enterprise_context_chunks', value: { client_id: 'client-1', source_doc: 'apps.csv' } },
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
