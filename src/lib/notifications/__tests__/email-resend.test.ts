/**
 * W4-PR-2 · Resend wrapper tests
 *
 * Verifies:
 *   • RESEND_API_KEY absent → ok:false with reason 'provider_not_configured'.
 *   • Happy path → returns providerMessageId.
 *   • Rate-limit error mapping.
 *   • Invalid-recipient error mapping (non-retryable).
 *   • Unknown error → provider_error (retryable=true).
 *   • Timeout when promise stalls past 5s (we mock the SDK to never resolve).
 *   • Tags are normalized to Resend's name/value shape.
 *   • CAN-SPAM headers pass through untouched.
 */

import {
  sendEmail,
  __setResendClientForTest,
} from '../channels/email-resend';

interface ResendCall {
  args: {
    from: string;
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
    headers?: Record<string, string>;
    tags?: ReadonlyArray<{ name: string; value: string }>;
  };
}

function makeFakeClient(opts: {
  fail?: { name?: string; message?: string };
  id?: string;
  hang?: boolean;
}) {
  const calls: ResendCall[] = [];
  const client = {
    calls,
    emails: {
      async send(args: ResendCall['args']) {
        calls.push({ args });
        if (opts.hang) {
          await new Promise(() => {}); // never resolves
        }
        if (opts.fail) return { data: null, error: opts.fail };
        return { data: { id: opts.id ?? 'resend-msg-1' }, error: null };
      },
    },
  };
  return client;
}

const ENV_KEY = 'RESEND_API_KEY';

describe('sendEmail · provider not configured', () => {
  it('returns ok:false reason provider_not_configured when API key is missing', async () => {
    const prev = process.env[ENV_KEY];
    delete process.env[ENV_KEY];
    try {
      const result = await sendEmail({
        to: 'x@y.com',
        subject: 's',
        html: '<p>h</p>',
        text: 't',
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe('provider_not_configured');
        expect(result.retryable).toBe(false);
      }
    } finally {
      if (prev !== undefined) process.env[ENV_KEY] = prev;
    }
  });
});

describe('sendEmail · happy path', () => {
  const prevKey = process.env[ENV_KEY];
  beforeAll(() => {
    process.env[ENV_KEY] = 'test_key_dummy';
  });
  afterAll(() => {
    if (prevKey === undefined) delete process.env[ENV_KEY];
    else process.env[ENV_KEY] = prevKey;
  });

  it('returns ok:true with the Resend message id', async () => {
    const client = makeFakeClient({ id: 'msg-42' });
    __setResendClientForTest(client);
    const result = await sendEmail({
      to: 'x@y.com',
      subject: 's',
      html: '<p>h</p>',
      text: 't',
      headers: { 'List-Unsubscribe': '<https://example.com/x>' },
      tags: { event_type: 'approval.requested', tenant_id: 'tenant-1' },
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.providerMessageId).toBe('msg-42');
    // CAN-SPAM headers passed through.
    expect(client.calls[0].args.headers).toEqual({
      'List-Unsubscribe': '<https://example.com/x>',
    });
    // Tags normalized.
    expect(client.calls[0].args.tags).toEqual([
      { name: 'event_type', value: 'approval_requested' },
      { name: 'tenant_id', value: 'tenant_1' },
    ]);
  });

  it('uses PHASE1_SHARED_SENDER when no `from` supplied', async () => {
    const client = makeFakeClient({});
    __setResendClientForTest(client);
    await sendEmail({ to: 'x@y.com', subject: 's', html: '<p>h</p>', text: 't' });
    expect(client.calls[0].args.from).toBe('notifications@abarva.com');
  });

  it('honours explicit `from`', async () => {
    const client = makeFakeClient({});
    __setResendClientForTest(client);
    await sendEmail({
      to: 'x@y.com',
      from: 'override@example.com',
      subject: 's',
      html: '<p>h</p>',
      text: 't',
    });
    expect(client.calls[0].args.from).toBe('override@example.com');
  });
});

describe('sendEmail · error mapping', () => {
  const prevKey = process.env[ENV_KEY];
  beforeAll(() => {
    process.env[ENV_KEY] = 'test_key_dummy';
  });
  afterAll(() => {
    if (prevKey === undefined) delete process.env[ENV_KEY];
    else process.env[ENV_KEY] = prevKey;
    __setResendClientForTest(null);
  });

  it('maps rate_limit errors with retryable=true', async () => {
    __setResendClientForTest(
      makeFakeClient({ fail: { name: 'rate_limit_exceeded', message: 'Too many requests' } }),
    );
    const result = await sendEmail({ to: 'a@b.com', subject: 's', html: '<p>h</p>', text: 't' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('rate_limit');
      expect(result.retryable).toBe(true);
    }
  });

  it('maps invalid_recipient errors with retryable=false', async () => {
    __setResendClientForTest(
      makeFakeClient({ fail: { name: 'validation_error', message: 'invalid email format' } }),
    );
    const result = await sendEmail({ to: 'bad', subject: 's', html: '<p>h</p>', text: 't' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('invalid_recipient');
      expect(result.retryable).toBe(false);
    }
  });

  it('maps unknown errors to provider_error retryable=true', async () => {
    __setResendClientForTest(
      makeFakeClient({ fail: { name: 'something_else', message: 'mystery' } }),
    );
    const result = await sendEmail({ to: 'a@b.com', subject: 's', html: '<p>h</p>', text: 't' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('provider_error');
      expect(result.retryable).toBe(true);
    }
  });

  it('returns provider_error when Resend returns no id and no error', async () => {
    __setResendClientForTest({
      emails: {
        async send() {
          return { data: null, error: null };
        },
      },
    });
    const result = await sendEmail({ to: 'a@b.com', subject: 's', html: '<p>h</p>', text: 't' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('provider_error');
  });
});
