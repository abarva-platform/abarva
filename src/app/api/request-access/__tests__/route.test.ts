import type { NextRequest } from 'next/server';

const insertMock = jest.fn();
const resendSendMock = jest.fn();

jest.mock('@/lib/data-plane/postgresCompat', () => ({
  getAzureWriteFluentClient: () => ({
    from: () => ({
      insert: insertMock,
    }),
  }),
}));

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: resendSendMock,
    },
  })),
}));

function makeRequest(body: unknown): NextRequest {
  return {
    json: async () => body,
    headers: {
      get: (name: string) => (name.toLowerCase() === 'user-agent' ? 'jest-agent' : null),
    },
  } as unknown as NextRequest;
}

describe('POST /api/request-access', () => {
  const previousEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    insertMock.mockReset();
    resendSendMock.mockReset();
    insertMock.mockResolvedValue({ error: null });
    resendSendMock.mockResolvedValue({ data: { id: 'email-test-id' }, error: null });
    process.env = {
      ...previousEnv,
      RESEND_API_KEY: 'test-resend-key',
      RESEND_FROM_EMAIL: '',
    };
  });

  afterAll(() => {
    process.env = previousEnv;
  });

  it('uses the verified send.abarva.ai sender by default', async () => {
    const { POST } = await import('../route');

    const response = await POST(
      makeRequest({
        name: 'Anand Sundaram',
        email: 'anand@thesundaram.com',
        company: 'AbarVa',
      }),
    );

    expect(response.status).toBe(200);
    expect(resendSendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'AbarVa Preview <support@send.abarva.ai>',
        to: ['admin@abarva.ai'],
        replyTo: 'anand@thesundaram.com',
      }),
    );
  });

  it('allows Azure env to override the sender', async () => {
    process.env.RESEND_FROM_EMAIL = 'AbarVa Preview <hello@send.abarva.ai>';
    const { POST } = await import('../route');

    await POST(
      makeRequest({
        name: 'Anand Sundaram',
        email: 'anand@thesundaram.com',
        company: 'AbarVa',
      }),
    );

    expect(resendSendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'AbarVa Preview <hello@send.abarva.ai>',
      }),
    );
  });

  it('does not alert for expected validation errors', async () => {
    const { POST } = await import('../route');

    const response = await POST(
      makeRequest({
        name: 'Anand Sundaram',
        email: 'anand@gmail.com',
        company: 'AbarVa',
      }),
    );

    expect(response.status).toBe(422);
    expect(insertMock).not.toHaveBeenCalled();
    expect(resendSendMock).not.toHaveBeenCalled();
  });

  it('alerts admin when the durable store fails but the lead email still succeeds', async () => {
    insertMock.mockRejectedValueOnce(new Error('database unavailable'));
    const { POST } = await import('../route');

    const response = await POST(
      makeRequest({
        name: 'Anand Sundaram',
        email: 'anand@thesundaram.com',
        company: 'AbarVa',
      }),
    );

    expect(response.status).toBe(200);
    expect(resendSendMock).toHaveBeenCalledTimes(2);
    expect(resendSendMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        from: 'AbarVa Preview <support@send.abarva.ai>',
        to: ['admin@abarva.ai'],
        subject: '[AbarVa alert] Request access warning',
        text: expect.stringContaining('store_failed: database unavailable'),
      }),
    );
  });

  it('alerts admin and fails closed when production captures the lead nowhere', async () => {
    Object.assign(process.env, { NODE_ENV: 'production' });
    insertMock.mockRejectedValueOnce(new Error('database unavailable'));
    resendSendMock
      .mockRejectedValueOnce(new Error('resend unavailable'))
      .mockResolvedValueOnce({ data: { id: 'alert-email-id' }, error: null });
    const { POST } = await import('../route');

    const response = await POST(
      makeRequest({
        name: 'Anand Sundaram',
        email: 'anand@thesundaram.com',
        company: 'AbarVa',
      }),
    );

    expect(response.status).toBe(500);
    expect(resendSendMock).toHaveBeenCalledTimes(2);
    expect(resendSendMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        to: ['admin@abarva.ai'],
        subject: '[AbarVa alert] Request access critical',
        text: expect.stringContaining('Lead email sent: no'),
      }),
    );
  });
});
