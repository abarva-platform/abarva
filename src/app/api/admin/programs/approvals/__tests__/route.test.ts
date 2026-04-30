/**
 * OV2-2c · /api/admin/programs/approvals route tests
 *
 * Coverage:
 *   • GET requires auth (401 when unauthenticated, 403 when no tenant)
 *   • GET happy-path returns ok + requests + counts
 *   • POST without admin role returns 403
 *   • POST with decision='rejected' and empty rationale returns 400
 *   • POST happy-path (decision='approved') returns 200 + updated request
 *
 * The auth + tenant resolution and the DB helpers are mocked at the
 * module boundary so the route itself is exercised end-to-end without
 * a live Postgres / Clerk dependency.
 */

import type { ApprovalRequest } from '@/lib/programs/approval';

const mockRequireAdminAuth = jest.fn();
const mockRequireAdminDecide = jest.fn();
const mockGetApprovalQueueForTenant = jest.fn();
const mockGetApprovalRequestById = jest.fn();
const mockDecideApprovalRequest = jest.fn();

const mockSupabaseSelect = jest.fn();
interface SupabaseChain {
  select: jest.Mock;
  eq: jest.Mock;
  in: jest.Mock;
  gte: jest.Mock;
}
const supabaseChain: SupabaseChain = {
  select: jest.fn(),
  eq: jest.fn(),
  in: jest.fn(),
  gte: jest.fn(),
};
supabaseChain.select.mockReturnValue(supabaseChain);
supabaseChain.eq.mockReturnValue(supabaseChain);
supabaseChain.in.mockReturnValue(supabaseChain);
supabaseChain.gte.mockResolvedValue({ data: [], error: null });

jest.mock('@/app/api/admin/programs/approvals/_auth', () => ({
  requireAdminAuth: () => mockRequireAdminAuth(),
  requireAdminDecide: () => mockRequireAdminDecide(),
  adminAuthErrorResponse: (err: unknown) => {
    const e = err as { status?: number; code?: string };
    if (e && typeof e.status === 'number' && typeof e.code === 'string') {
      return Response.json({ error: e.code }, { status: e.status });
    }
    throw err;
  },
  AdminAuthError: class AdminAuthError extends Error {
    constructor(
      public status: 401 | 403,
      public code: string,
    ) {
      super(code);
    }
  },
}));

jest.mock('@/lib/programs/approval', () => ({
  getApprovalQueueForTenant: (k: string) => mockGetApprovalQueueForTenant(k),
  getApprovalRequestById: (id: string) => mockGetApprovalRequestById(id),
  decideApprovalRequest: (input: unknown) => mockDecideApprovalRequest(input),
}));

jest.mock('@/lib/supabase-server', () => ({
  getServerSupabase: () => ({
    from: () => ({
      select: (...args: unknown[]) => {
        mockSupabaseSelect(...args);
        return supabaseChain;
      },
    }),
  }),
}));

function fakeRequest(body: unknown): Request {
  return new Request('http://test/api/admin/programs/approvals/req-1', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function approvalFixture(overrides: Partial<ApprovalRequest> = {}): ApprovalRequest {
  return {
    id: 'req-1',
    tenantKey: 'apex-retail',
    programId: 'prog-1',
    requestedByUserId: 'user-2',
    requestedAt: '2026-04-29T12:00:00Z',
    requestStatus: 'pending',
    decidedByUserId: null,
    decidedAt: null,
    decisionRationale: null,
    briefSnapshot: { program_name: 'Apex CDP 2026' },
    createdAt: '2026-04-29T12:00:00Z',
    updatedAt: '2026-04-29T12:00:00Z',
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  supabaseChain.select.mockReturnValue(supabaseChain);
  supabaseChain.eq.mockReturnValue(supabaseChain);
  supabaseChain.in.mockReturnValue(supabaseChain);
  supabaseChain.gte.mockResolvedValue({ data: [], error: null });
});

describe('GET /api/admin/programs/approvals', () => {
  it('returns 401 when unauthenticated', async () => {
    mockRequireAdminAuth.mockRejectedValue({
      status: 401,
      code: 'unauthenticated',
    });
    const { GET } = await import('../route');
    const res = await GET();
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: 'unauthenticated' });
  });

  it('returns 403 when no tenant is active', async () => {
    mockRequireAdminAuth.mockRejectedValue({
      status: 403,
      code: 'no_tenant',
    });
    const { GET } = await import('../route');
    const res = await GET();
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: 'no_tenant' });
  });

  it('returns ok with requests + counts on the happy path', async () => {
    mockRequireAdminAuth.mockResolvedValue({
      userId: 'u-admin',
      tenantKey: 'apex-retail',
      isAdmin: true,
    });
    const fixtures = [approvalFixture(), approvalFixture({ id: 'req-2' })];
    mockGetApprovalQueueForTenant.mockResolvedValue(fixtures);
    supabaseChain.gte.mockResolvedValue({
      data: [
        { request_status: 'approved' },
        { request_status: 'approved' },
        { request_status: 'rejected' },
      ],
      error: null,
    });

    const { GET } = await import('../route');
    const res = await GET();
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      ok: boolean;
      requests: ApprovalRequest[];
      counts: { pending: number; approved: number; rejected: number };
    };
    expect(json.ok).toBe(true);
    expect(json.requests).toHaveLength(2);
    expect(json.counts).toEqual({ pending: 2, approved: 2, rejected: 1 });
    expect(mockGetApprovalQueueForTenant).toHaveBeenCalledWith('apex-retail');
  });
});

describe('POST /api/admin/programs/approvals/[requestId]', () => {
  const params = Promise.resolve({ requestId: 'req-1' });

  it('returns 403 when caller lacks admin role', async () => {
    mockRequireAdminDecide.mockRejectedValue({
      status: 403,
      code: 'forbidden_admin_required',
    });
    const { POST } = await import('../[requestId]/route');
    const res = await POST(
      fakeRequest({ decision: 'approved' }) as never,
      { params },
    );
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({
      error: 'forbidden_admin_required',
    });
  });

  it('returns 400 when decision is rejected with no rationale', async () => {
    mockRequireAdminDecide.mockResolvedValue({
      userId: 'u-admin',
      tenantKey: 'apex-retail',
      isAdmin: true,
    });
    const { POST } = await import('../[requestId]/route');
    const res = await POST(
      fakeRequest({ decision: 'rejected' }) as never,
      { params },
    );
    expect(res.status).toBe(400);
    const json = (await res.json()) as { error: string };
    expect(json.error).toMatch(/rationale required/);
    expect(mockDecideApprovalRequest).not.toHaveBeenCalled();
  });

  it('returns 400 when decision value is unknown', async () => {
    mockRequireAdminDecide.mockResolvedValue({
      userId: 'u-admin',
      tenantKey: 'apex-retail',
      isAdmin: true,
    });
    const { POST } = await import('../[requestId]/route');
    const res = await POST(
      fakeRequest({ decision: 'maybe' }) as never,
      { params },
    );
    expect(res.status).toBe(400);
    const json = (await res.json()) as { error: string };
    expect(json.error).toMatch(/decision must be/);
  });

  it('returns 404 when the target row belongs to another tenant', async () => {
    mockRequireAdminDecide.mockResolvedValue({
      userId: 'u-admin',
      tenantKey: 'apex-retail',
      isAdmin: true,
    });
    mockGetApprovalRequestById.mockResolvedValue(
      approvalFixture({ tenantKey: 'meridian-bank' }),
    );
    const { POST } = await import('../[requestId]/route');
    const res = await POST(
      fakeRequest({ decision: 'approved' }) as never,
      { params },
    );
    expect(res.status).toBe(404);
    expect(mockDecideApprovalRequest).not.toHaveBeenCalled();
  });

  it('approves on the happy path and returns the updated request', async () => {
    mockRequireAdminDecide.mockResolvedValue({
      userId: 'u-admin',
      tenantKey: 'apex-retail',
      isAdmin: true,
    });
    mockGetApprovalRequestById.mockResolvedValue(approvalFixture());
    mockDecideApprovalRequest.mockResolvedValue(
      approvalFixture({
        requestStatus: 'approved',
        decidedByUserId: 'u-admin',
        decidedAt: '2026-04-29T13:00:00Z',
        decisionRationale: 'looks great',
      }),
    );
    const { POST } = await import('../[requestId]/route');
    const res = await POST(
      fakeRequest({
        decision: 'approved',
        rationale: 'looks great',
      }) as never,
      { params },
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      ok: boolean;
      request: ApprovalRequest;
    };
    expect(json.ok).toBe(true);
    expect(json.request.requestStatus).toBe('approved');
    expect(mockDecideApprovalRequest).toHaveBeenCalledWith({
      requestId: 'req-1',
      decidedByUserId: 'u-admin',
      decision: 'approved',
      rationale: 'looks great',
    });
  });

  it('rejects with a rationale on the happy path', async () => {
    mockRequireAdminDecide.mockResolvedValue({
      userId: 'u-admin',
      tenantKey: 'apex-retail',
      isAdmin: true,
    });
    mockGetApprovalRequestById.mockResolvedValue(approvalFixture());
    mockDecideApprovalRequest.mockResolvedValue(
      approvalFixture({
        requestStatus: 'rejected',
        decidedByUserId: 'u-admin',
        decisionRationale: 'sponsor not committed',
      }),
    );
    const { POST } = await import('../[requestId]/route');
    const res = await POST(
      fakeRequest({
        decision: 'rejected',
        rationale: 'sponsor not committed',
      }) as never,
      { params },
    );
    expect(res.status).toBe(200);
    expect(mockDecideApprovalRequest).toHaveBeenCalledWith({
      requestId: 'req-1',
      decidedByUserId: 'u-admin',
      decision: 'rejected',
      rationale: 'sponsor not committed',
    });
  });
});
