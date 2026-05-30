/**
 * W4-PR-3 · connector test route → emitNotification("connector.failed")
 *
 * Verifies that the manual probe route fans out the `connector.failed`
 * notification when the broker reports a `live → degraded` transition,
 * skips the emit for `none` / `recovered` transitions, and never surfaces
 * a broker outage to the probe verdict.
 */

const mockAuth = jest.fn();
const mockClerkUsersGetUser = jest.fn();
const mockGetActiveClientRow = jest.fn();
const mockTestConnector = jest.fn();
const mockWriteAudit = jest.fn();
const mockEmitNotification = jest.fn(async () => ({
  eventId: 'evt_1',
  enqueuedDeliveries: 1,
}));

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

jest.mock('@/lib/admin/broker/notification-broker', () => ({
  emitNotification: (...args: unknown[]) => mockEmitNotification(...args),
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
  mockEmitNotification.mockResolvedValue({
    eventId: 'evt_1',
    enqueuedDeliveries: 1,
  });
  __resetConnectorTestRateLimit();
  mockAuth.mockResolvedValue({ userId: 'user_admin' });
  mockClerkUsersGetUser.mockResolvedValue({
    publicMetadata: { role: 'admin' },
  });
  mockGetActiveClientRow.mockResolvedValue({ key: 'apex-retail' });
});

describe('W4-PR-3 · POST /api/admin/connectors/[id]/test · connector.failed emit', () => {
  it('emits connector.failed when transition is degraded', async () => {
    mockTestConnector.mockResolvedValue({
      ok: false,
      latencyMs: 7,
      reason: 'http 503 from provider',
      probedAtIso: '2026-05-30T12:00:00.000Z',
      priorStatus: 'live',
      nextStatus: 'degraded',
      transition: { kind: 'degraded', reason: 'http 503 from provider' },
    });

    const { POST } = await import('../route');
    const res = await POST(asNextRequest(), paramsOf('conn-x'));
    expect(res.status).toBe(200);
    await new Promise((r) => setImmediate(r));

    expect(mockEmitNotification).toHaveBeenCalledTimes(1);
    const [arg] = mockEmitNotification.mock.calls[0];
    expect(arg).toMatchObject({
      tenantKey: 'apex-retail',
      eventType: 'connector.failed',
      actorUserId: 'user_admin',
      targetResourceId: 'conn-x',
    });
    expect(arg.payload).toMatchObject({
      connectorId: 'conn-x',
      failureReason: 'http 503 from provider',
    });
  });

  it('does NOT emit on transition=none', async () => {
    mockTestConnector.mockResolvedValue({
      ok: true,
      latencyMs: 3,
      probedAtIso: '2026-05-30T12:00:00.000Z',
      priorStatus: 'live',
      nextStatus: 'live',
      transition: { kind: 'none' },
    });

    const { POST } = await import('../route');
    const res = await POST(asNextRequest(), paramsOf('conn-x'));
    expect(res.status).toBe(200);
    await new Promise((r) => setImmediate(r));

    expect(mockEmitNotification).not.toHaveBeenCalled();
  });

  it('does NOT emit on transition=recovered', async () => {
    mockTestConnector.mockResolvedValue({
      ok: true,
      latencyMs: 3,
      probedAtIso: '2026-05-30T12:00:00.000Z',
      priorStatus: 'degraded',
      nextStatus: 'live',
      transition: { kind: 'recovered' },
    });

    const { POST } = await import('../route');
    const res = await POST(asNextRequest(), paramsOf('conn-x'));
    expect(res.status).toBe(200);
    await new Promise((r) => setImmediate(r));

    expect(mockEmitNotification).not.toHaveBeenCalled();
  });

  it('does NOT emit when the broker itself throws (handled by route as 500)', async () => {
    mockTestConnector.mockRejectedValue(new Error('boom'));

    const { POST } = await import('../route');
    const res = await POST(asNextRequest(), paramsOf('conn-x'));
    expect(res.status).toBe(500);
    await new Promise((r) => setImmediate(r));

    expect(mockEmitNotification).not.toHaveBeenCalled();
  });

  it('does NOT propagate broker emit failures into the probe response', async () => {
    mockTestConnector.mockResolvedValue({
      ok: false,
      latencyMs: 7,
      reason: 'http 503',
      probedAtIso: '2026-05-30T12:00:00.000Z',
      priorStatus: 'live',
      nextStatus: 'degraded',
      transition: { kind: 'degraded', reason: 'http 503' },
    });
    mockEmitNotification.mockRejectedValueOnce(new Error('broker down'));

    const { POST } = await import('../route');
    const res = await POST(asNextRequest(), paramsOf('conn-x'));
    expect(res.status).toBe(200);
    await new Promise((r) => setImmediate(r));

    const body = await res.json();
    expect(body).toMatchObject({
      ok: false,
      latencyMs: 7,
      reason: 'http 503',
      transition: { kind: 'degraded' },
    });
    expect(mockEmitNotification).toHaveBeenCalledTimes(1);
  });
});
