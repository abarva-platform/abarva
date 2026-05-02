const mockRequireTenancy = jest.fn();
const mockLoadUserProgramAccessPolicy = jest.fn();
const mockGetProgramById = jest.fn();
const mockEvaluateGate = jest.fn();
const mockRequestFounderApproval = jest.fn();
const mockAdvancePhase = jest.fn();

jest.mock('../../../_auth', () => ({
  requireTenancy: () => mockRequireTenancy(),
  tenancyErrorResponse: (err: unknown) => {
    throw err;
  },
}));

jest.mock('@/lib/auth/program-access-policy', () => ({
  loadUserProgramAccessPolicy: (ctx: unknown, opts: unknown) => mockLoadUserProgramAccessPolicy(ctx, opts),
}));

jest.mock('@/lib/programs/queries', () => ({
  getProgramById: (ctx: unknown, programId: string) => mockGetProgramById(ctx, programId),
}));

jest.mock('@/lib/programs/governance', () => ({
  evaluateGate: (ctx: unknown, programId: string, fromPhase: number, toPhase: number) =>
    mockEvaluateGate(ctx, programId, fromPhase, toPhase),
  requestFounderApproval: (ctx: unknown, programId: string, input: unknown) =>
    mockRequestFounderApproval(ctx, programId, input),
}));

jest.mock('@/lib/programs/mutations', () => ({
  advancePhase: (ctx: unknown, input: unknown) => mockAdvancePhase(ctx, input),
}));

jest.mock('@/lib/supabase-server', () => ({
  getServerSupabase: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({ maybeSingle: jest.fn() }),
        }),
      }),
    }),
  }),
}));

function req(body: unknown): Request {
  return new Request('http://test/api/v1/programs/prog-1/advance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const params = Promise.resolve({ programId: 'prog-1' });
const ctx = { clientId: 'client-1', userId: 'person-1', role: 'client_admin' };

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  mockRequireTenancy.mockResolvedValue(ctx);
  mockGetProgramById.mockResolvedValue({ id: 'prog-1', currentPhase: 0 });
  mockEvaluateGate.mockResolvedValue({
    failedChecks: [],
    requiresApproval: true,
    approverRole: 'sponsor',
  });
  mockAdvancePhase.mockResolvedValue({ programId: 'prog-1', newPhase: 1, snapshotId: 'snap-1' });
});

describe('POST /api/v1/programs/[programId]/advance', () => {
  it('self-approves phase advancement for callers with gate approval rights', async () => {
    mockLoadUserProgramAccessPolicy.mockResolvedValue({
      programIdsAllowed: null,
      canApproveGates: true,
    });

    const { POST } = await import('../route');
    const res = await POST(
      req({ toPhase: 1, selfApproveIfAuthorized: true, snapshot: { source: 'test' } }) as never,
      { params },
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ ok: true, newPhase: 1 });
    expect(mockRequestFounderApproval).not.toHaveBeenCalled();
    expect(mockAdvancePhase).toHaveBeenCalledWith(ctx, expect.objectContaining({
      programId: 'prog-1',
      fromPhase: 0,
      toPhase: 1,
      approvedByUserId: 'person-1',
    }));
  });

  it('creates an approval request when the caller cannot self-approve the gate', async () => {
    mockLoadUserProgramAccessPolicy.mockResolvedValue({
      programIdsAllowed: null,
      canApproveGates: false,
    });
    mockRequestFounderApproval.mockResolvedValue('approval-1');

    const { POST } = await import('../route');
    const res = await POST(
      req({ toPhase: 1, selfApproveIfAuthorized: true }) as never,
      { params },
    );

    expect(res.status).toBe(202);
    await expect(res.json()).resolves.toMatchObject({
      error: 'approval_required',
      approvalId: 'approval-1',
    });
    expect(mockRequestFounderApproval).toHaveBeenCalled();
    expect(mockAdvancePhase).not.toHaveBeenCalled();
  });
});

export {};
