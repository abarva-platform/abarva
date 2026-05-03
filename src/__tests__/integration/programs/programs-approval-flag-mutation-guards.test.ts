import type { NextRequest } from 'next/server';

class TenancyError extends Error {
  constructor(public readonly code: 'unauthenticated' | 'no_client') {
    super(code);
  }
}

const requireTenancy = jest.fn();
const getProgramsRouteSupabase = jest.fn();
const getProgramById = jest.fn();
const loadUserProgramAccessPolicy = jest.fn();
const requestFounderApproval = jest.fn();
const hasAuthority = jest.fn();
const decideApproval = jest.fn();
const resolveMaestroFlag = jest.fn();

jest.mock('@/app/api/v1/programs/_auth', () => ({
  TenancyError,
  requireTenancy,
  tenancyErrorResponse: (err: unknown) => {
    if (err instanceof TenancyError) {
      return Response.json({ error: err.code }, { status: err.code === 'unauthenticated' ? 401 : 403 });
    }
    throw err;
  },
}));

jest.mock('@/lib/programs/programs-auth-mode-server', () => ({
  getProgramsRouteSupabase,
}));

jest.mock('@/lib/programs/queries', () => ({
  getProgramById,
}));

jest.mock('@/lib/auth/program-access-policy', () => ({
  loadUserProgramAccessPolicy,
  canReadProgram: jest.fn().mockResolvedValue(true),
}));

jest.mock('@/lib/programs/governance', () => ({
  requestFounderApproval,
  hasAuthority,
  decideApproval,
  resolveMaestroFlag,
}));

const CTX = { clientId: 'client_meridian', userId: 'person_1', role: 'client_admin' };
const OWN_PROGRAM = 'eng_own';
const FOREIGN_PROGRAM = 'eng_foreign';

function makePost(body: unknown): NextRequest {
  return new Request('http://localhost', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

beforeEach(() => {
  jest.clearAllMocks();
  requireTenancy.mockResolvedValue(CTX);
  getProgramsRouteSupabase.mockResolvedValue({ mode: 'service_role', supabase: { mocked: true } });
  getProgramById.mockImplementation((_ctx, programId) =>
    programId === OWN_PROGRAM ? Promise.resolve({ id: OWN_PROGRAM, currentPhase: 0 }) : Promise.resolve(null),
  );
  loadUserProgramAccessPolicy.mockResolvedValue({
    programIdsAllowed: null,
    canApproveGates: true,
  });
  requestFounderApproval.mockResolvedValue('far_1');
  hasAuthority.mockResolvedValue(true);
  decideApproval.mockResolvedValue(true);
  resolveMaestroFlag.mockResolvedValue(true);
});

describe('POST /api/v1/programs/[programId]/approvals', () => {
  const routePath = '@/app/api/v1/programs/[programId]/approvals/route';
  const payload = {
    requestType: 'phase_gate',
    headline: 'Need sponsor gate approval',
  };

  async function invoke(programId: string, body: Record<string, unknown> = payload) {
    const mod = await import(routePath);
    return mod.POST(makePost(body), { params: Promise.resolve({ programId }) });
  }

  it('allows own-tenant approval request creation', async () => {
    const res = await invoke(OWN_PROGRAM);
    expect(res.status).toBe(201);
    expect(getProgramsRouteSupabase).toHaveBeenCalledWith('mutation');
    expect(requestFounderApproval).toHaveBeenCalled();
  });

  it('returns 404 for foreign-tenant program id', async () => {
    const res = await invoke(FOREIGN_PROGRAM);
    expect(res.status).toBe(404);
  });

  it('denies cross-tenant write attempt with crafted payload', async () => {
    const res = await invoke(FOREIGN_PROGRAM, {
      ...payload,
      engagementId: OWN_PROGRAM,
      clientId: 'client_apex',
    });
    expect(res.status).toBe(404);
  });

  it('denies users without tenant membership', async () => {
    requireTenancy.mockRejectedValueOnce(new TenancyError('no_client'));
    const res = await invoke(OWN_PROGRAM);
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: 'no_client' });
  });
});

describe('POST /api/v1/programs/[programId]/approvals/[approvalId]/decide', () => {
  const routePath = '@/app/api/v1/programs/[programId]/approvals/[approvalId]/decide/route';
  const payload = { decision: 'approved' as const, notes: 'looks good' };

  async function invoke(programId: string, approvalId = 'apr_1') {
    const mod = await import(routePath);
    return mod.POST(makePost(payload), { params: Promise.resolve({ programId, approvalId }) });
  }

  it('allows own-tenant approval decisions', async () => {
    const res = await invoke(OWN_PROGRAM);
    expect(res.status).toBe(200);
    expect(getProgramsRouteSupabase).toHaveBeenCalledWith('mutation');
    expect(decideApproval).toHaveBeenCalled();
  });

  it('returns 404 for foreign-tenant program id', async () => {
    const res = await invoke(FOREIGN_PROGRAM);
    expect(res.status).toBe(404);
  });

  it('denies cross-tenant write attempts with foreign approval ids', async () => {
    decideApproval.mockResolvedValueOnce(false);
    const res = await invoke(OWN_PROGRAM, 'apr_foreign');
    expect(res.status).toBe(404);
  });

  it('denies users without tenant membership', async () => {
    requireTenancy.mockRejectedValueOnce(new TenancyError('no_client'));
    const res = await invoke(OWN_PROGRAM);
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: 'no_client' });
  });
});

describe('POST /api/v1/programs/[programId]/flags/[flagId]/resolve', () => {
  const routePath = '@/app/api/v1/programs/[programId]/flags/[flagId]/resolve/route';
  const payload = { resolutionNotes: 'closed after mitigations' };

  async function invoke(programId: string, flagId = 'flag_1') {
    const mod = await import(routePath);
    return mod.POST(makePost(payload), { params: Promise.resolve({ programId, flagId }) });
  }

  it('allows own-tenant flag resolution', async () => {
    const res = await invoke(OWN_PROGRAM);
    expect(res.status).toBe(200);
    expect(getProgramsRouteSupabase).toHaveBeenCalledWith('mutation');
    expect(resolveMaestroFlag).toHaveBeenCalled();
  });

  it('returns 404 for foreign-tenant program id', async () => {
    const res = await invoke(FOREIGN_PROGRAM);
    expect(res.status).toBe(404);
  });

  it('denies cross-tenant write attempts with foreign flag ids', async () => {
    resolveMaestroFlag.mockResolvedValueOnce(false);
    const res = await invoke(OWN_PROGRAM, 'flag_foreign');
    expect(res.status).toBe(404);
  });

  it('denies users without tenant membership', async () => {
    requireTenancy.mockRejectedValueOnce(new TenancyError('no_client'));
    const res = await invoke(OWN_PROGRAM);
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: 'no_client' });
  });
});
