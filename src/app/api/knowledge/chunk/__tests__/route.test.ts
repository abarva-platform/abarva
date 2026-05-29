const mockAzureRead = {
  query: jest.fn(),
  select: jest.fn(),
  maybeSingle: jest.fn(),
  count: jest.fn(),
  withSession: jest.fn(),
};

jest.mock('@/lib/data-plane/azureRead', () => ({
  azureRead: mockAzureRead,
}));

function knowledgeChunkRequest(search: string): Request {
  return new Request(`http://localhost/api/knowledge/chunk${search}`);
}

describe('GET /api/knowledge/chunk read plane', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAzureRead.query.mockResolvedValue([
      {
        pinecone_id: 'pc_1',
        chunk_text: 'Chunk text from corpus',
        section: 'overview',
        page_number: 12,
        chunk_metadata: { attribution: 'p. 12' },
        source_key: 'source_1',
        title: 'Source One',
        publisher: 'AbarVa',
        source_url: 'https://example.com/source',
        license_class: 'internal',
      },
    ]);
    mockAzureRead.maybeSingle.mockResolvedValue({
      id: 'source_uuid_1',
      source_key: 'source_1',
      title: 'Source One',
      publisher: 'AbarVa',
      source_url: 'https://example.com/source',
      license_class: 'internal',
    });
    mockAzureRead.select.mockResolvedValue([
      {
        pinecone_id: 'pc_2',
        chunk_text: 'Chunk by source',
        section: 'summary',
        page_number: 3,
        chunk_metadata: { attribution: 'p. 3' },
      },
    ]);
  });

  it('loads a chunk by pinecone id through azureRead SQL join', async () => {
    const { GET } = await import('@/app/api/knowledge/chunk/route');
    const res = await GET(knowledgeChunkRequest('?pinecone_id=pc_1') as never);

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      chunk: {
        source_key: 'source_1',
        title: 'Source One',
        chunk_text: 'Chunk text from corpus',
        attribution: 'p. 12',
      },
    });
    expect(mockAzureRead.query).toHaveBeenCalledWith(expect.stringContaining('FROM knowledge_chunks kc'), ['pc_1']);
  });

  it('loads source metadata and a matching chunk through azureRead selects', async () => {
    const { GET } = await import('@/app/api/knowledge/chunk/route');
    const res = await GET(knowledgeChunkRequest('?source_key=source_1&section=summary&page=3') as never);

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      chunk: {
        source_key: 'source_1',
        title: 'Source One',
        section: 'summary',
        page_number: 3,
        chunk_text: 'Chunk by source',
      },
    });
    expect(mockAzureRead.maybeSingle).toHaveBeenCalledWith(expect.objectContaining({
      table: 'knowledge_sources',
      where: { source_key: 'source_1' },
    }));
    expect(mockAzureRead.select).toHaveBeenCalledWith(expect.objectContaining({
      table: 'knowledge_chunks',
      where: { source_id: 'source_uuid_1', section: 'summary', page_number: 3 },
      limit: 1,
    }));
  });
});

export {};
