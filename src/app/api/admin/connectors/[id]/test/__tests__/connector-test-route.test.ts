/**
 * POST /api/admin/connectors/[id]/test route tests · PRE-W4-PR-3
 *
 * Coverage:
 *   • 401 when unauthenticated.
 *   • 403 when authenticated but role ∉ {admin, maestro}.
 *   • 403 when authenticated but no active tenant resolved.
 *   • 200 on the happy path; audit writer is called.
 *   • 404 when the broker reports the connector is not found.
 *   • 429 with `Retry-After` header when the per-tenant rate limit
 *     trips on the 11th call inside a minute.
 *   • 500 when the broker throws (unexpected internal error).
 */

const mockAuth = jest.fn();
const mockClerkUsersGetUser = jest.fn();
const mockGetActiveClientRow = jest.fn();
const mockTestConnector = jest.fn();
const mockWriteAudit = jest.fn();

jest.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
  clerkClient: async () => ({
    users: { getUser: (...args: unknown[]) => mockClerkUsersGetUser(...args) },
  }),
}));

jest.mock('@/lib/active-client', () => ({
  getActiveClientRow: () => mockGetActiveClientRow(),
}));

jest.mock('@/lib/admin/broker/connector-health-broker', () => ({
  testConnector: (...args: unknown[]) => mockTestConnector(...args),
}));

jest.mock('@/lib/admin/connector-test-audit', () => ({
  writeConnectorTestAudit: (input: unknown) => mockWriteAudit(input),
}));

import { NextRequest } from 'next/server';
import { __resetConnectorTestRateLimit } from '@/lib/admin/broker/connector-test-rate-limit';

function asNextRequest(): NextRequest {
  return new Request(
    'http://test/api/admin/connectors/conn-x/test',
    { method: 'POST' },
  ) as unknown as NextRequest;
}

function paramsOf(id: string): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockWriteAudit.mockResolvedValue(true);
  __resetConnectorTestRateLimit();
});

describe('POST /api/admin/connectors/[id]/test', () => {
  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const { POST } = await import('../route');
    const res = await POST(asNextRequest(), paramsOf('conn-x'));
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: 'unauthenticated' });
    expect(mockTestConnector).not.toHaveBeenCalled();
    expect(mockWriteAudit).not.toHaveBeenCalled();
  });

  it('returns 403 when the caller lacks admin or maestro role', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_demo' });
    mockClerkUsersGetUser.mockResolvedValue({
      publicMetadata: { role: 'client_viewer' },
    });
    const { POST } = await import('../route');
    const res = await POST(asNextRequest(), paramsOf('conn-x'));
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: 'forbidden_admin_only' });
    expect(mockTestConnector).not.toHaveBeenCalled();
  });

  it('returns 403 when no active tenant can be resolved', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_admin' });
    mockClerkUsersGetUser.mockResolvedValue({
      publicMetadata: { role: 'admin' },
    });
    mockGetActiveClientRow.mockResolvedValue(null);
    const { POST } = await import('../route');
    const res = await POST(asNextRequest(), paramsOf('conn-x'));
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: 'no_tenant' });
  });

  it('returns 200 with the probe result and fires the audit write', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_admin' });
    mockClerkUsersGetUser.mockResolvedValue({
      publicMetadata: { role: 'admin' },
    });
    mockGetActiveClientRow.mockResolvedValue({ key: 'apex-retail' });
    mockTestConnector.mockResolvedValue({
      ok: true,
      latencyMs: 42,
      probedAtIso: '2026-05-30T12:00:00.000Z',
      priorStatus: 'degraded',
      nextStatus: 'live',
      transition: { kind: 'recovered' },
    });

    const { POST } = await import('../route');
    const res = await POST(asNextRequest(), paramsOf('conn-x'));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      ok: true,
      latencyMs: 42,
      reason: undefined,
      probedAtIso: '2026-05-30T12:00:00.000Z',
      transition: { kind: 'recovered' },
    });
    expect(mockTestConnector).toHaveBeenCalledWith('apex-retail', 'conn-x');
    expect(mockWriteAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: 'user_admin',
        tenantKey: 'apex-retail',
        connectorId: 'conn-x',
      }),
    );
  });

  it('returns 404 when the broker reports not_found and skips the audit write', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_admin' });
    mockClerkUsersGetUser.mockResolvedValue({
      publicMetadata: { role: 'admin' },
    });
    mockGetActiveClientRow.mockResolvedValue({ key: 'apex-retail' });
    mockTestConnector.mockResolvedValue({
      ok: false,
      latencyMs: 0,
      reason: 'not_found',
      probedAtIso: '2026-05-30T12:00:00.000Z',
      priorStatus: null,
      nextStatus: null,
      transition: { kind: 'none' },
    });

    const { POST } = await import('../route');
    const res = await POST(asNextRequest(), paramsOf('does-not-exist'));
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: 'not_found' });
    expect(mockWriteAudit).not.toHaveBeenCalled();
  });

  it('enforces the per-tenant rate limit on the 11th call in a window', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_admin' });
    mockClerkUsersGetUser.mockResolvedValue({
      publicMetadata: { role: 'admin' },
    });
    mockGetActiveClientRow.mockResolvedValue({ key: 'apex-retail' });
    mockTestConnector.mockResolvedValue({
      ok: true,
      latencyMs: 1,
      probedAtIso: '2026-05-30T12:00:00.000Z',
      priorStatus: 'live',
      nextStatus: 'live',
      transition: { kind: 'none' },
    });

    const { POST } = await import('../route');
    // 10 allowed
    for (let i = 0; i < 10; i += 1) {
      const res = await POST(asNextRequest(), paramsOf(`conn-${i}`));
      expect(res.status).toBe(200);
    }
    // 11th rejected
    const blocked = await POST(asNextRequest(), paramsOf('conn-10'));
    expect(blocked.status).toBe(429);
    const body = await blocked.json();
    expect(body.error).toBe('rate_limited');
    expect(typeof body.retryAfterMs).toBe('number');
    expect(blocked.headers.get('Retry-After')).toBeTruthy();
  });

  it('returns 500 when the broker throws an unexpected error', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_admin' });
    mockClerkUsersGetUser.mockResolvedValue({
      publicMetadata: { role: 'admin' },
    });
    mockGetActiveClientRow.mockResolvedValue({ key: 'apex-retail' });
    mockTestConnector.mockRejectedValue(new Error('boom'));

    const { POST } = await import('../route');
    const res = await POST(asNextRequest(), paramsOf('conn-x'));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('internal_error');
  });
});
