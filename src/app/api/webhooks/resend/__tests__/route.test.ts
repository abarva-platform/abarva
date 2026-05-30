/**
 * W4-PR-7 · Resend webhook route tests
 *
 * Route-level concerns only:
 *   • 503 when RESEND_WEBHOOK_SECRET is unset.
 *   • 401 on signature mismatch (broker NOT called).
 *   • 200 on valid signature + happy broker path.
 *   • 200 on malformed body (post-signature) — log + acknowledge.
 *   • Health route returns the last-received timestamp.
 *
 * Broker pipeline is mocked — the broker's own test file covers it.
 */

jest.mock('@/lib/admin/broker/resend-webhook-broker', () => ({
  processResendWebhookEvent: jest.fn(),
  recordWebhookReceived: jest.fn(),
  getLastWebhookReceivedAt: jest.fn(),
}));

jest.mock('@/lib/notifications/resend-webhook-signature', () => ({
  verifyResendSignature: jest.fn(),
}));

import { POST } from '../route';
import { GET as healthGet } from '../health/route';
import {
  processResendWebhookEvent,
  recordWebhookReceived,
  getLastWebhookReceivedAt,
} from '@/lib/admin/broker/resend-webhook-broker';
import { verifyResendSignature } from '@/lib/notifications/resend-webhook-signature';

const processMock = processResendWebhookEvent as unknown as jest.Mock;
const recordMock = recordWebhookReceived as unknown as jest.Mock;
const lastAtMock = getLastWebhookReceivedAt as unknown as jest.Mock;
const verifyMock = verifyResendSignature as unknown as jest.Mock;

function makeRequest(body: string, headers: Record<string, string> = {}): import('next/server').NextRequest {
  const h = new Headers({
    'svix-id': 'msg_2abc',
    'svix-timestamp': String(Math.floor(Date.now() / 1000)),
    'svix-signature': 'v1,deadbeef',
    'content-type': 'application/json',
    ...headers,
  });
  // Construct a minimal Request-like object the route can read.
  return {
    headers: h,
    async text() {
      return body;
    },
  } as unknown as import('next/server').NextRequest;
}

const SECRET_KEY = 'RESEND_WEBHOOK_SECRET';

describe('POST /api/webhooks/resend · misconfigured', () => {
  it('returns 503 when RESEND_WEBHOOK_SECRET is not set', async () => {
    const prev = process.env[SECRET_KEY];
    delete process.env[SECRET_KEY];
    try {
      const res = await POST(makeRequest('{}'));
      expect(res.status).toBe(503);
      const body = await res.json();
      expect(body.error).toBe('webhook_misconfigured');
      expect(verifyMock).not.toHaveBeenCalled();
      expect(processMock).not.toHaveBeenCalled();
    } finally {
      if (prev !== undefined) process.env[SECRET_KEY] = prev;
    }
  });
});

describe('POST /api/webhooks/resend · signature', () => {
  beforeEach(() => {
    process.env[SECRET_KEY] = 'whsec_test_secret';
    jest.clearAllMocks();
  });

  it('returns 401 and does NOT call the broker on signature mismatch', async () => {
    verifyMock.mockReturnValue({ ok: false, reason: 'signature_mismatch' });
    const res = await POST(makeRequest('{"type":"email.delivered","data":{"email_id":"x"}}'));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('invalid_signature');
    expect(body.reason).toBe('signature_mismatch');
    expect(processMock).not.toHaveBeenCalled();
    expect(recordMock).not.toHaveBeenCalled();
  });

  it('returns 401 on missing header', async () => {
    verifyMock.mockReturnValue({ ok: false, reason: 'missing_header' });
    const res = await POST(makeRequest('{}'));
    expect(res.status).toBe(401);
  });
});

describe('POST /api/webhooks/resend · happy path', () => {
  beforeEach(() => {
    process.env[SECRET_KEY] = 'whsec_test_secret';
    jest.clearAllMocks();
    verifyMock.mockReturnValue({ ok: true });
  });

  it('verifies, marks liveness, dispatches, returns 200', async () => {
    processMock.mockResolvedValue({ ok: true, action: 'status_transitioned', from: 'queued', to: 'sent' });
    const res = await POST(
      makeRequest('{"type":"email.sent","data":{"email_id":"resend_msg_1"}}'),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.action).toBe('status_transitioned');
    expect(recordMock).toHaveBeenCalledTimes(1);
    expect(processMock).toHaveBeenCalledTimes(1);
    expect(processMock).toHaveBeenCalledWith(expect.objectContaining({
      type: 'email.sent',
      data: expect.objectContaining({ email_id: 'resend_msg_1' }),
    }));
  });

  it('returns 200 on malformed body without invoking the broker', async () => {
    const res = await POST(makeRequest('not-json'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ignored).toBe('malformed_body');
    expect(processMock).not.toHaveBeenCalled();
  });

  it('returns 200 even when the broker throws', async () => {
    processMock.mockRejectedValue(new Error('boom'));
    const res = await POST(
      makeRequest('{"type":"email.delivered","data":{"email_id":"x"}}'),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.error).toBe('broker_threw');
  });
});

describe('GET /api/webhooks/resend/health', () => {
  it('returns 200 with last-received timestamp and configured flag', async () => {
    process.env[SECRET_KEY] = 'whsec_test_secret';
    lastAtMock.mockReturnValue('2026-05-30T12:00:00.000Z');
    const res = await healthGet();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.configured).toBe(true);
    expect(body.lastWebhookReceivedAt).toBe('2026-05-30T12:00:00.000Z');
  });

  it('reports configured=false when no secret is set', async () => {
    const prev = process.env[SECRET_KEY];
    delete process.env[SECRET_KEY];
    try {
      lastAtMock.mockReturnValue(null);
      const res = await healthGet();
      const body = await res.json();
      expect(body.configured).toBe(false);
      expect(body.lastWebhookReceivedAt).toBeNull();
    } finally {
      if (prev !== undefined) process.env[SECRET_KEY] = prev;
    }
  });
});
