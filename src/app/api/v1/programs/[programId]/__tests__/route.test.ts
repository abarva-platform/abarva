const requireTenancyMock = jest.fn();
const getProgramByIdMock = jest.fn();
const buildProgramFullStateMock = jest.fn();

jest.mock('../../_auth', () => ({
  requireTenancy: () => requireTenancyMock(),
  tenancyErrorResponse: (err: unknown) => {
    throw err;
  },
}));

jest.mock('@/lib/programs/queries', () => ({
  getProgramById: (ctx: unknown, programId: string, opts?: unknown) =>
    getProgramByIdMock(ctx, programId, opts),
}));

jest.mock('@/lib/programs/transformers', () => ({
  buildProgramFullState: (ctx: unknown, program: unknown) =>
    buildProgramFullStateMock(ctx, program),
}));

const ctx = {
  clientId: 'f2ef0b6a-9f20-4d3d-9dd9-8f8ec01f2a61',
  clientKey: 'lakeshore',
  userId: 'person-lakeshore-cfo',
  role: 'maestro',
};

const program = {
  id: '1196dac0-715c-45ce-8eeb-5e70792d9aa4',
  name: 'Kyriba global treasury rollout',
  archivedAt: null,
  deletedAt: null,
};

describe('GET /api/v1/programs/[programId]', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    requireTenancyMock.mockResolvedValue(ctx);
    getProgramByIdMock.mockResolvedValue(program);
    buildProgramFullStateMock.mockResolvedValue({
      id: program.id,
      name: program.name,
      clientName: 'Lakeshore Holdings',
      deliverables: [],
    });
  });

  it('uses the tenancy-scoped Azure/Postgres read path for a single program', async () => {
    const { GET } = await import('../route');

    const res = await GET(new Request('http://test/api/v1/programs/1196dac0-715c-45ce-8eeb-5e70792d9aa4'), {
      params: Promise.resolve({ programId: program.id }),
    });

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      program: {
        id: program.id,
        name: program.name,
        clientName: 'Lakeshore Holdings',
      },
    });
    expect(getProgramByIdMock).toHaveBeenCalledWith(ctx, program.id, undefined);
    expect(buildProgramFullStateMock).toHaveBeenCalledWith(ctx, program);
  });

  it('returns not_found when the program is outside the active tenant', async () => {
    getProgramByIdMock.mockResolvedValue(null);
    const { GET } = await import('../route');

    const res = await GET(new Request('http://test/api/v1/programs/not-visible'), {
      params: Promise.resolve({ programId: 'not-visible' }),
    });

    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: 'not_found' });
  });
});
