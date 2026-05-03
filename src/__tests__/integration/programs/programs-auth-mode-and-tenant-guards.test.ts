import type { NextRequest } from 'next/server';

const requireTenancy = jest.fn();
const getProgramPortfolio = jest.fn();
const getProgramById = jest.fn();
const buildProgramSummary = jest.fn();
const buildProgramFullState = jest.fn();
const getProgramsRouteSupabase = jest.fn();
const decideApproval = jest.fn();
const hasAuthority = jest.fn();
const resolveMaestroFlag = jest.fn();
const blockWorkItem = jest.fn();
const markWorkItemNexusDrafted = jest.fn();
const updateWorkItemStatus = jest.fn();

jest.mock('@/app/api/v1/programs/_auth', () => ({
  requireTenancy,
  tenancyErrorResponse: (err: unknown) => {
    throw err;
  },
}));

jest.mock('@/lib/programs/queries', () => ({
  getProgramPortfolio,
  getProgramById,
}));

jest.mock('@/lib/programs/transformers', () => ({
  buildProgramSummary,
  buildProgramFullState,
}));

jest.mock('@/lib/programs/programs-auth-mode-server', () => ({
  getProgramsRouteSupabase,
}));

jest.mock('@/lib/programs/governance', () => ({
  decideApproval,
  hasAuthority,
  resolveMaestroFlag,
}));

jest.mock('@/lib/programs/execute', () => ({
  blockWorkItem,
  markWorkItemNexusDrafted,
}));

jest.mock('@/lib/programs/mutations', () => ({
  updateWorkItemStatus,
}));

describe('Programs auth-mode pilot routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    requireTenancy.mockResolvedValue({ clientId: 'client_meridian', userId: 'person_1', role: 'sponsor' });
    getProgramsRouteSupabase.mockResolvedValue({ mode: 'service_role', supabase: { mocked: true } });
  });

  it('wraps portfolio GET with route-family auth mode', async () => {
    getProgramsRouteSupabase.mockResolvedValueOnce({ mode: 'authenticated', supabase: { mocked: true } });
    getProgramPortfolio.mockResolvedValueOnce([{ id: 'eng_1' }]);
    buildProgramSummary.mockResolvedValueOnce({ id: 'eng_1', name: 'Move 1' });

    const { GET } = await import('@/app/api/v1/programs/route');
    const res = await GET();

    expect(getProgramsRouteSupabase).toHaveBeenCalledWith('portfolio');
    expect(getProgramPortfolio).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: 'client_meridian' }),
      expect.objectContaining({ limit: 100, supabase: { mocked: true } }),
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ programs: [{ id: 'eng_1', name: 'Move 1' }] });
  });

  it('wraps detail GET with route-family auth mode and preserves not_found contract', async () => {
    getProgramsRouteSupabase.mockResolvedValueOnce({ mode: 'service_role', supabase: { mocked: true } });
    getProgramById.mockResolvedValueOnce(null);

    const { GET } = await import('@/app/api/v1/programs/[programId]/route');
    const res = await GET(new Request('http://localhost/api/v1/programs/eng_404'), {
      params: Promise.resolve({ programId: 'eng_404' }),
    });

    expect(getProgramsRouteSupabase).toHaveBeenCalledWith('detail');
    expect(getProgramById).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: 'client_meridian' }),
      'eng_404',
      expect.objectContaining({ supabase: { mocked: true } }),
    );
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: 'not_found' });
  });
});

describe('Programs tenant guard routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    requireTenancy.mockResolvedValue({ clientId: 'client_meridian', userId: 'person_1', role: 'sponsor' });
  });

  function makePost(body: unknown): NextRequest {
    return new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }) as unknown as NextRequest;
  }

  function makePatch(body: unknown): NextRequest {
    return new Request('http://localhost', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }) as unknown as NextRequest;
  }

  it('returns 404 when approval decision target is outside tenant scope', async () => {
    getProgramById.mockResolvedValueOnce({ id: 'eng_1' });
    hasAuthority.mockResolvedValueOnce(true);
    decideApproval.mockResolvedValueOnce(false);

    const { POST } = await import('@/app/api/v1/programs/[programId]/approvals/[approvalId]/decide/route');
    const res = await POST(makePost({ decision: 'approved', notes: 'ok' }), {
      params: Promise.resolve({ programId: 'eng_1', approvalId: 'apr_foreign' }),
    });

    expect(decideApproval).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: 'client_meridian' }),
      'eng_1',
      'apr_foreign',
      'approved',
      'ok',
    );
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: 'not_found' });
  });

  it('returns 404 when resolving a flag outside tenant scope', async () => {
    getProgramById.mockResolvedValueOnce({ id: 'eng_1' });
    resolveMaestroFlag.mockResolvedValueOnce(false);

    const { POST } = await import('@/app/api/v1/programs/[programId]/flags/[flagId]/resolve/route');
    const res = await POST(makePost({ resolutionNotes: 'done' }), {
      params: Promise.resolve({ programId: 'eng_1', flagId: 'flag_foreign' }),
    });

    expect(resolveMaestroFlag).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: 'client_meridian' }),
      'eng_1',
      'flag_foreign',
      'done',
    );
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: 'not_found' });
  });

  it('returns 404 on work-item PATCH when program is outside tenant scope', async () => {
    getProgramById.mockResolvedValueOnce(null);

    const { PATCH } = await import('@/app/api/v1/programs/[programId]/work-items/[workItemId]/route');
    const res = await PATCH(makePatch({ status: 'in_progress' }), {
      params: Promise.resolve({ programId: 'eng_foreign', workItemId: 'wi_1' }),
    });

    expect(blockWorkItem).not.toHaveBeenCalled();
    expect(markWorkItemNexusDrafted).not.toHaveBeenCalled();
    expect(updateWorkItemStatus).not.toHaveBeenCalled();
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: 'not_found' });
  });
});
