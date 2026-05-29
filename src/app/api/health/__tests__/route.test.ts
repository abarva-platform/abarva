const mockAzureRead = {
  query: jest.fn(),
  select: jest.fn(),
  maybeSingle: jest.fn(),
  count: jest.fn(),
  withSession: jest.fn(),
};
const isNeo4jEnabled = jest.fn();
const getGraphDriverIfEnabled = jest.fn();

jest.mock('@/lib/data-plane/azureRead', () => ({
  azureRead: mockAzureRead,
}));

jest.mock('@/lib/graph/neo4j-gate', () => ({
  isNeo4jEnabled,
}));

jest.mock('@/lib/graph/driver', () => ({
  getGraphDriverIfEnabled,
}));

jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    query: jest.fn().mockResolvedValue({ rows: [{ ok: 1 }] }),
  })),
}));

describe('GET /api/health read plane', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.DATABASE_URL;
    mockAzureRead.query.mockResolvedValue([{ id: 'engagement_1' }]);
    isNeo4jEnabled.mockReturnValue(false);
  });

  it('checks Postgres liveness through azureRead', async () => {
    const { GET } = await import('@/app/api/health/route');
    const res = await GET();

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      checks: {
        postgres: true,
        direct_postgres: false,
        neo4j: 'skipped',
      },
    });
    expect(mockAzureRead.query).toHaveBeenCalledWith('SELECT id FROM engagements LIMIT 1');
    expect(getGraphDriverIfEnabled).not.toHaveBeenCalled();
  });
});

export {};
