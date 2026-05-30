/**
 * W4-PR-5 · /api/cron/notifications-tick route tests
 *
 * Coverage:
 *   • Missing CRON_SECRET → 401.
 *   • Wrong bearer token → 401.
 *   • Right bearer token → 200 with dispatch result.
 *   • Health endpoint: auth + response shape.
 */

const dispatchTickMock = jest.fn();
const dispatchHealthMock = jest.fn();

jest.mock('@/lib/admin/broker/notification-dispatch-broker', () => ({
  dispatchTick: (...args: unknown[]) => dispatchTickMock(...args),
  dispatchHealth: (...args: unknown[]) => dispatchHealthMock(...args),
}));

import { NextRequest } from 'next/server';

function makeReq(opts: { auth?: string | null; path?: string } = {}): NextRequest {
  const headers: Record<string, string> = {};
  if (opts.auth) headers['authorization'] = opts.auth;
  const url = opts.path
    ? `http://localhost${opts.path}`
    : 'http://localhost/api/cron/notifications-tick';
  return new NextRequest(new Request(url, { method: 'GET', headers }));
}

describe('GET /api/cron/notifications-tick', () => {
  const originalEnv = process.env.CRON_SECRET;
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CRON_SECRET = 'test-secret-abc123';
    dispatchTickMock.mockResolvedValue({
      processed: 5,
      sent: 4,
      failed: 1,
      skipped: 0,
      durationMs: 123,
    });
  });
  afterAll(() => {
    if (originalEnv === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = originalEnv;
  });

  it('returns 401 when CRON_SECRET is unset', async () => {
    delete process.env.CRON_SECRET;
    const { GET } = await import('../route');
    const res = await GET(makeReq({ auth: 'Bearer anything' }));
    expect(res.status).toBe(401);
    expect(dispatchTickMock).not.toHaveBeenCalled();
  });

  it('returns 401 when authorization header is missing', async () => {
    const { GET } = await import('../route');
    const res = await GET(makeReq());
    expect(res.status).toBe(401);
    expect(dispatchTickMock).not.toHaveBeenCalled();
  });

  it('returns 401 when bearer token does not match', async () => {
    const { GET } = await import('../route');
    const res = await GET(makeReq({ auth: 'Bearer wrong-token' }));
    expect(res.status).toBe(401);
    expect(dispatchTickMock).not.toHaveBeenCalled();
  });

  it('returns 401 when scheme is not Bearer', async () => {
    const { GET } = await import('../route');
    const res = await GET(makeReq({ auth: 'Basic test-secret-abc123' }));
    expect(res.status).toBe(401);
  });

  it('returns 200 + dispatch counters with valid bearer', async () => {
    const { GET } = await import('../route');
    const res = await GET(makeReq({ auth: 'Bearer test-secret-abc123' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      ok: true,
      processed: 5,
      sent: 4,
      failed: 1,
      skipped: 0,
      durationMs: 123,
    });
    expect(dispatchTickMock).toHaveBeenCalledTimes(1);
  });
});

describe('GET /api/cron/notifications-tick/health', () => {
  const originalEnv = process.env.CRON_SECRET;
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CRON_SECRET = 'test-secret-abc123';
    dispatchHealthMock.mockResolvedValue({
      queuedCount: 2,
      oldestQueuedAt: '2026-06-01T11:50:00Z',
      lastSentAt: '2026-06-01T11:59:00Z',
      lastFailedAt: null,
    });
  });
  afterAll(() => {
    if (originalEnv === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = originalEnv;
  });

  it('returns 401 without auth', async () => {
    const { GET } = await import('../health/route');
    const res = await GET(makeReq({ path: '/api/cron/notifications-tick/health' }));
    expect(res.status).toBe(401);
    expect(dispatchHealthMock).not.toHaveBeenCalled();
  });

  it('returns 200 + snapshot with valid bearer', async () => {
    const { GET } = await import('../health/route');
    const res = await GET(
      makeReq({
        auth: 'Bearer test-secret-abc123',
        path: '/api/cron/notifications-tick/health',
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.queuedCount).toBe(2);
    expect(body.oldestQueuedAt).toBe('2026-06-01T11:50:00Z');
    expect(body.lastSentAt).toBe('2026-06-01T11:59:00Z');
    expect(body.lastFailedAt).toBeNull();
    expect(typeof body.lastTickTs).toBe('string');
  });
});
