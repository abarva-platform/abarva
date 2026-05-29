import {
  getTenantContextSummary,
  getTenantEmbeddingHistory,
  getTenantEvidenceMapForFile,
  getTenantPendingChunks,
  getTenantSourceFiles,
} from './tenant-context-read-model';
import { azureRead } from '@/lib/data-plane/azureRead';

jest.mock('@/lib/data-plane/azureRead', () => ({
  azureRead: {
    maybeSingle: jest.fn(),
    select: jest.fn(),
  },
}));

const maybeSingleMock = azureRead.maybeSingle as jest.MockedFunction<typeof azureRead.maybeSingle>;
const selectMock = azureRead.select as jest.MockedFunction<typeof azureRead.select>;

describe('tenant context read model', () => {
  beforeEach(() => {
    maybeSingleMock.mockReset();
    selectMock.mockReset();
  });

  it('builds the tenant summary from azureRead rows', async () => {
    maybeSingleMock.mockResolvedValueOnce({
      id: 'apexretail',
      tenant_key: 'apex-retail',
      slug: 'apex',
      name: 'Apex Retail',
    });
    selectMock
      .mockResolvedValueOnce([
        {
          chunk_id: 'APX-CHUNK-1',
          source_doc: 'portfolio.csv',
          chunk_index: 1,
          embedding_status: 'embedded',
          embedding_model: 'text-embedding-3-large',
          embedded_at: '2026-05-28T10:00:00Z',
          created_at: '2026-05-28T09:00:00Z',
        },
        {
          chunk_id: 'APX-CHUNK-2',
          source_doc: 'portfolio.csv',
          chunk_index: 2,
          embedding_status: 'failed',
          embedding_model: null,
          embedded_at: null,
          created_at: '2026-05-28T09:05:00Z',
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'audit-1',
          artifact_id: 'APX-CHUNK-1',
          provider: 'openai',
          model: 'text-embedding-3-large',
          policy_decision: 'allow',
          created_at: '2026-05-28T10:01:00Z',
          request_metadata: { chunk_id: 'APX-CHUNK-1' },
        },
      ]);

    await expect(getTenantContextSummary('apexretail')).resolves.toEqual({
      tenantKey: 'apex-retail',
      displayName: 'Apex Retail',
      ingestionFilesCount: 1,
      chunksCount: 2,
      chunksEmbedded: 1,
      chunksPending: 0,
      chunksFailed: 1,
      lastEmbeddedAt: '2026-05-28T10:00:00Z',
      embeddingProviders: ['openai'],
      embeddingModels: ['text-embedding-3-large'],
      totalEmbeddingCalls: 1,
    });
    expect(maybeSingleMock).toHaveBeenCalledWith(expect.objectContaining({
      table: 'clients',
      where: { id: 'apexretail' },
      missingTable: 'empty',
    }));
    expect(selectMock).toHaveBeenCalledWith(expect.objectContaining({
      table: 'enterprise_context_chunks',
      where: { client_id: 'apexretail' },
      missingTable: 'empty',
    }));
  });

  it('groups source files from context chunks', async () => {
    selectMock.mockResolvedValueOnce([
      {
        chunk_id: 'c2',
        source_doc: 'contracts.csv',
        chunk_index: 2,
        embedding_status: 'embedded',
        created_at: '2026-05-28T10:00:00Z',
      },
      {
        chunk_id: 'c1',
        source_doc: 'contracts.csv',
        chunk_index: 1,
        embedding_status: 'embedded',
        created_at: '2026-05-28T09:00:00Z',
      },
    ]);

    await expect(getTenantSourceFiles('apexretail')).resolves.toEqual([
      {
        source_doc: 'contracts.csv',
        chunk_count: 2,
        first_loaded_at: '2026-05-28T09:00:00Z',
        sample_chunk_id: 'c2',
      },
    ]);
  });

  it('maps embedding audit history from azureRead', async () => {
    selectMock.mockResolvedValueOnce([
      {
        id: 'audit-1',
        artifact_id: 'chunk-from-artifact',
        provider: 'openai',
        model: 'text-embedding-3-large',
        policy_decision: 'allow',
        created_at: '2026-05-28T10:01:00Z',
        request_metadata: { chunk_id: 'chunk-from-meta' },
      },
    ]);

    await expect(getTenantEmbeddingHistory('apexretail')).resolves.toEqual([
      {
        id: 'audit-1',
        chunk_id: 'chunk-from-meta',
        provider: 'openai',
        model: 'text-embedding-3-large',
        policy_decision: 'allow',
        created_at: '2026-05-28T10:01:00Z',
      },
    ]);
    expect(selectMock).toHaveBeenCalledWith(expect.objectContaining({
      table: 'ai_egress_audit',
      where: {
        tenant_id: 'apexretail',
        workflow: 'substrate-loader-embed',
      },
      limit: 100,
    }));
  });

  it('tenant-scopes evidence map and pending chunk reads', async () => {
    selectMock
      .mockResolvedValueOnce([
        {
          chunk_id: 'c1',
          chunk_index: '7',
          chunk_text: 'Evidence text',
          embedding_status: 'embedded',
          embedded_at: '2026-05-28T10:00:00Z',
        },
      ])
      .mockResolvedValueOnce([
        {
          chunk_id: 'c2',
          source_doc: 'portfolio.csv',
          chunk_index: 8,
          embedding_status: 'failed',
          updated_at: '2026-05-28T10:05:00Z',
          embedded_at: null,
          embedding_error: 'rate limit',
        },
      ]);

    await expect(getTenantEvidenceMapForFile('apexretail', 'portfolio.csv')).resolves.toEqual([
      {
        chunk_id: 'c1',
        chunk_index: 7,
        chunk_text: 'Evidence text',
        embedding_status: 'embedded',
        embedded_at: '2026-05-28T10:00:00Z',
      },
    ]);
    await expect(getTenantPendingChunks('apexretail', { limit: 10 })).resolves.toEqual([
      {
        chunk_id: 'c2',
        source_doc: 'portfolio.csv',
        chunk_index: 8,
        embedding_status: 'failed',
        last_attempt_at: '2026-05-28T10:05:00Z',
        error_message: 'rate limit',
      },
    ]);

    expect(selectMock).toHaveBeenNthCalledWith(1, expect.objectContaining({
      table: 'enterprise_context_chunks',
      where: {
        client_id: 'apexretail',
        source_doc: 'portfolio.csv',
      },
      orderBy: { column: 'chunk_index', direction: 'asc' },
    }));
    expect(selectMock).toHaveBeenNthCalledWith(2, expect.objectContaining({
      table: 'enterprise_context_chunks',
      where: {
        client_id: 'apexretail',
        embedding_status: { op: 'in', value: ['pending', 'failed'] },
      },
      orderBy: { column: 'updated_at', direction: 'desc' },
      limit: 10,
    }));
  });

  it('preserves empty fallback behavior when azureRead fails', async () => {
    maybeSingleMock.mockRejectedValueOnce(new Error('db unavailable'));
    selectMock
      .mockRejectedValueOnce(new Error('db unavailable'))
      .mockRejectedValueOnce(new Error('db unavailable'));

    await expect(getTenantContextSummary('apexretail')).resolves.toEqual({
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
  });
});
