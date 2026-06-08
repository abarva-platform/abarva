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

jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    query: jest.fn().mockResolvedValue({ rows: [{ ok: 1 }] }),
  })),
}));

describe('GET /api/health read plane', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.DATABASE_URL;
    mockAzureRead.query.mockResolvedValue([{ ok: 1 }]);
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
        azure_graph: 'postgres',
      },
    });
    expect(mockAzureRead.query).toHaveBeenCalledWith('SELECT 1 AS ok');
  });

  it('keeps health green when direct Postgres succeeds and the read adapter is degraded', async () => {
    process.env.DATABASE_URL = 'postgres://health.example/db';
    mockAzureRead.query.mockRejectedValueOnce(new Error('read adapter degraded'));

    const { GET } = await import('@/app/api/health/route');
    const res = await GET();

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      checks: {
        postgres: false,
        direct_postgres: true,
        azure_graph: 'postgres',
      },
    });
  });
});

export {};
