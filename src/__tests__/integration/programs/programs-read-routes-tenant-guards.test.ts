import type { NextRequest } from 'next/server';

const requireTenancy = jest.fn();
const getProgramsRouteSupabase = jest.fn();
const getProgramById = jest.fn();
const getPendingApprovals = jest.fn();
const getOpenMaestroFlags = jest.fn();
const getMilestones = jest.fn();
const getRisks = jest.fn();
const getWorkItems = jest.fn();
const getModuleState = jest.fn();
const canReadProgram = jest.fn();
const loadUserProgramAccessPolicy = jest.fn();
const getExecuteRollupWithClient = jest.fn();
const listThreads = jest.fn();
const createThread = jest.fn();

class MockTenancyError extends Error {
  constructor(public readonly code: 'unauthenticated' | 'no_client') {
    super(code);
  }
}

function makeSupabaseStub() {
  const maybeSingle = jest
    .fn()
    .mockResolvedValueOnce({ data: null, error: null })
    .mockResolvedValueOnce({ data: null, error: null });
  const limit = jest.fn(() => ({ maybeSingle }));
  const order = jest.fn(() => ({ limit, maybeSingle }));
  const eq = jest.fn(() => ({ eq, order, maybeSingle }));
  const select = jest.fn(() => ({ eq, order, limit, maybeSingle }));
  const from = jest.fn(() => ({ select }));
  return { from };
}

jest.mock('@/app/api/v1/programs/_auth', () => ({
  requireTenancy,
  TenancyError: MockTenancyError,
  tenancyErrorResponse: (err: unknown) => {
    if (err instanceof MockTenancyError) {
      if (err.code === 'unauthenticated') {
        return Response.json({ error: 'unauthenticated' }, { status: 401 });
      }
      return Response.json({ error: 'no_client' }, { status: 403 });
    }
    throw err;
  },
}));

jest.mock('@/lib/programs/programs-auth-mode-server', () => ({
  getProgramsRouteSupabase,
}));

jest.mock('@/lib/programs/queries', () => ({
  getProgramById,
  getPendingApprovals,
  getOpenMaestroFlags,
  getMilestones,
  getRisks,
  getWorkItems,
  getModuleState,
}));

jest.mock('@/lib/auth/program-access-policy', () => ({
  canReadProgram,
  loadUserProgramAccessPolicy,
}));

jest.mock('@/lib/programs/execute', () => ({
  getExecuteRollupWithClient,
}));

jest.mock('@/lib/programs/nexus', () => ({
  listThreads,
  createThread,
}));

function makeGetReq(url = 'http://localhost'): NextRequest {
  return new Request(url, { method: 'GET' }) as unknown as NextRequest;
}

function makePostReq(body: unknown): NextRequest {
  return new Request('http://localhost', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

describe('Programs read routes tenant guards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    requireTenancy.mockResolvedValue({ clientId: 'client_meridian', userId: 'person_1', role: 'sponsor' });
    getProgramsRouteSupabase.mockResolvedValue({ mode: 'service_role', supabase: makeSupabaseStub() });
    getProgramById.mockResolvedValue({ id: 'eng_1' });
    canReadProgram.mockResolvedValue(true);
    loadUserProgramAccessPolicy.mockResolvedValue({
      tenantRole: 'tenant_member',
      canCreatePrograms: true,
      canApprovePrograms: true,
      canApproveGates: true,
      financialVisibility: false,
      modules: [],
      programIdsAllowed: null,
      sourceEventIdsAllowed: null,
    });
    getPendingApprovals.mockResolvedValue([{ id: 'ap_1' }]);
    getOpenMaestroFlags.mockResolvedValue([{ id: 'flag_1' }]);
    getMilestones.mockResolvedValue([{ id: 'ms_1' }]);
    getRisks.mockResolvedValue([{ id: 'risk_1' }]);
    getWorkItems.mockResolvedValue([{ id: 'wi_1' }]);
    getModuleState.mockResolvedValue([
      {
        id: 'mod_1',
        engagementId: 'eng_1',
        moduleKey: 'discovery',
        moduleName: 'Discovery',
        phaseNumber: 1,
        moduleOrder: 1,
        status: 'in_progress',
        state: {},
        assignedUserId: null,
        startedAt: null,
        completedAt: null,
      },
    ]);
    getExecuteRollupWithClient.mockResolvedValue({ summary: 'ok' });
    listThreads.mockResolvedValue([{ id: 'thread_1' }]);
    createThread.mockResolvedValue({ id: 'thread_2' });
  });

  async function expectNoMembershipDenied(getFn: () => Promise<Response>) {
    requireTenancy.mockRejectedValueOnce(new MockTenancyError('no_client'));
    const res = await getFn();
    expect(res.status).toBe(403);
  }

  it('execute route: own-tenant pass, foreign 404, no-membership denied, write denied (no POST export)', async () => {
    const mod = await import('@/app/api/v1/programs/[programId]/execute/route');

    const ok = await mod.GET(makeGetReq(), { params: Promise.resolve({ programId: 'eng_1' }) });
    expect(ok.status).toBe(200);

    getProgramById.mockResolvedValueOnce(null);
    const foreign = await mod.GET(makeGetReq(), { params: Promise.resolve({ programId: 'eng_foreign' }) });
    expect(foreign.status).toBe(404);

    await expectNoMembershipDenied(() => mod.GET(makeGetReq(), { params: Promise.resolve({ programId: 'eng_1' }) }));

    expect((mod as { POST?: unknown }).POST).toBeUndefined();
  });

  it('flags route: own-tenant pass, foreign 404, no-membership denied, write denied (no POST export)', async () => {
    const mod = await import('@/app/api/v1/programs/[programId]/flags/route');

    const ok = await mod.GET(makeGetReq(), { params: Promise.resolve({ programId: 'eng_1' }) });
    expect(ok.status).toBe(200);

    getProgramById.mockResolvedValueOnce(null);
    const foreign = await mod.GET(makeGetReq(), { params: Promise.resolve({ programId: 'eng_foreign' }) });
    expect(foreign.status).toBe(404);

    await expectNoMembershipDenied(() => mod.GET(makeGetReq(), { params: Promise.resolve({ programId: 'eng_1' }) }));

    expect((mod as { POST?: unknown }).POST).toBeUndefined();
  });

  it('approvals route: own-tenant pass, foreign 404, no-membership denied, cross-tenant write denied', async () => {
    const mod = await import('@/app/api/v1/programs/[programId]/approvals/route');

    const ok = await mod.GET(makeGetReq(), { params: Promise.resolve({ programId: 'eng_1' }) });
    expect(ok.status).toBe(200);

    getProgramById.mockResolvedValueOnce(null);
    const foreign = await mod.GET(makeGetReq(), { params: Promise.resolve({ programId: 'eng_foreign' }) });
    expect(foreign.status).toBe(404);

    await expectNoMembershipDenied(() => mod.GET(makeGetReq(), { params: Promise.resolve({ programId: 'eng_1' }) }));

    getProgramById.mockResolvedValueOnce(null);
    const write = await mod.POST(makePostReq({ requestType: 'phase_advance', headline: 'x' }), {
      params: Promise.resolve({ programId: 'eng_foreign' }),
    });
    expect(write.status).toBe(404);
  });

  it('milestones route: own-tenant pass, foreign 404, no-membership denied, cross-tenant write denied', async () => {
    const mod = await import('@/app/api/v1/programs/[programId]/milestones/route');

    const ok = await mod.GET(makeGetReq(), { params: Promise.resolve({ programId: 'eng_1' }) });
    expect(ok.status).toBe(200);

    getProgramById.mockResolvedValueOnce(null);
    const foreign = await mod.GET(makeGetReq(), { params: Promise.resolve({ programId: 'eng_foreign' }) });
    expect(foreign.status).toBe(404);

    await expectNoMembershipDenied(() => mod.GET(makeGetReq(), { params: Promise.resolve({ programId: 'eng_1' }) }));

    getProgramById.mockResolvedValueOnce(null);
    const write = await mod.POST(makePostReq({ name: 'M1' }), { params: Promise.resolve({ programId: 'eng_foreign' }) });
    expect(write.status).toBe(404);
  });

  it('risks route: own-tenant pass, foreign 404, no-membership denied, cross-tenant write denied', async () => {
    const mod = await import('@/app/api/v1/programs/[programId]/risks/route');

    const ok = await mod.GET(makeGetReq(), { params: Promise.resolve({ programId: 'eng_1' }) });
    expect(ok.status).toBe(200);

    getProgramById.mockResolvedValueOnce(null);
    const foreign = await mod.GET(makeGetReq(), { params: Promise.resolve({ programId: 'eng_foreign' }) });
    expect(foreign.status).toBe(404);

    await expectNoMembershipDenied(() => mod.GET(makeGetReq(), { params: Promise.resolve({ programId: 'eng_1' }) }));

    getProgramById.mockResolvedValueOnce(null);
    const write = await mod.POST(makePostReq({ title: 'R1', likelihood: 'high', impact: 'high' }), {
      params: Promise.resolve({ programId: 'eng_foreign' }),
    });
    expect(write.status).toBe(404);
  });

  it('work-items route: own-tenant pass, foreign 404, no-membership denied, cross-tenant write denied', async () => {
    const mod = await import('@/app/api/v1/programs/[programId]/work-items/route');

    const ok = await mod.GET(makeGetReq(), { params: Promise.resolve({ programId: 'eng_1' }) });
    expect(ok.status).toBe(200);

    getProgramById.mockResolvedValueOnce(null);
    const foreign = await mod.GET(makeGetReq(), { params: Promise.resolve({ programId: 'eng_foreign' }) });
    expect(foreign.status).toBe(404);

    await expectNoMembershipDenied(() => mod.GET(makeGetReq(), { params: Promise.resolve({ programId: 'eng_1' }) }));

    getProgramById.mockResolvedValueOnce(null);
    const write = await mod.POST(makePostReq({ title: 'Task', itemType: 'task' }), {
      params: Promise.resolve({ programId: 'eng_foreign' }),
    });
    expect(write.status).toBe(404);
  });

  it('module route: own-tenant pass, foreign 404, no-membership denied, write denied (no POST export)', async () => {
    const mod = await import('@/app/api/v1/programs/[programId]/module/[key]/route');

    const ok = await mod.GET(makeGetReq(), { params: Promise.resolve({ programId: 'eng_1', key: 'discovery' }) });
    expect(ok.status).toBe(200);

    getProgramById.mockResolvedValueOnce(null);
    const foreign = await mod.GET(makeGetReq(), {
      params: Promise.resolve({ programId: 'eng_foreign', key: 'discovery' }),
    });
    expect(foreign.status).toBe(404);

    await expectNoMembershipDenied(() =>
      mod.GET(makeGetReq(), { params: Promise.resolve({ programId: 'eng_1', key: 'discovery' }) }),
    );

    expect((mod as { POST?: unknown }).POST).toBeUndefined();
  });

  it('nexus threads route: own-tenant pass, foreign 404, no-membership denied, cross-tenant write denied', async () => {
    const mod = await import('@/app/api/v1/programs/[programId]/nexus/threads/route');

    const ok = await mod.GET(makeGetReq('http://localhost?mode=side_panel'), {
      params: Promise.resolve({ programId: 'eng_1' }),
    });
    expect(ok.status).toBe(200);

    getProgramById.mockResolvedValueOnce(null);
    const foreign = await mod.GET(makeGetReq(), { params: Promise.resolve({ programId: 'eng_foreign' }) });
    expect(foreign.status).toBe(404);

    await expectNoMembershipDenied(() => mod.GET(makeGetReq(), { params: Promise.resolve({ programId: 'eng_1' }) }));

    getProgramById.mockResolvedValueOnce(null);
    const write = await mod.POST(makePostReq({ mode: 'side_panel' }), {
      params: Promise.resolve({ programId: 'eng_foreign' }),
    });
    expect(write.status).toBeGreaterThanOrEqual(400);
  });
});
