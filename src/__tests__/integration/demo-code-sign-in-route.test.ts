const getUserList = jest.fn();
const createSignInToken = jest.fn();

jest.mock('@clerk/backend', () => ({
  createClerkClient: () => ({
    users: { getUserList },
    signInTokens: { createSignInToken },
  }),
}));

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/auth/demo-code-sign-in', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/demo-code-sign-in', () => {
  const originalSecret = process.env.CLERK_SECRET_KEY;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CLERK_SECRET_KEY = 'sk_test_demo';

    getUserList.mockResolvedValue({
      data: [{ id: 'user_demo_1' }],
    });
    createSignInToken.mockResolvedValue({
      token: 'ticket_demo_1',
    });
  });

  afterAll(() => {
    process.env.CLERK_SECRET_KEY = originalSecret;
  });

  it('rejects non-canonical email addresses', async () => {
    const { POST } = await import('@/app/api/auth/demo-code-sign-in/route');
    const res = await POST(makeRequest({
      email: 'real-user@abarva.com',
      password: 'Demo2026!',
      code: '424242',
    }));

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toMatchObject({ error: 'invalid_credentials' });
    expect(getUserList).not.toHaveBeenCalled();
  });

  it('rejects old demo email addresses', async () => {
    const { POST } = await import('@/app/api/auth/demo-code-sign-in/route');
    const res = await POST(makeRequest({
      email: 'demo-meridian+clerk_test@abarva.com',
      password: 'Demo2026!',
      code: '424242',
    }));

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toMatchObject({ error: 'invalid_credentials' });
    expect(getUserList).not.toHaveBeenCalled();
  });

  it('rejects retired role-based demo email addresses', async () => {
    const { POST } = await import('@/app/api/auth/demo-code-sign-in/route');
    const res = await POST(makeRequest({
      email: 'cdio@meridian-health.example.com',
      password: 'Demo2026!',
      code: '424242',
    }));

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toMatchObject({ error: 'invalid_credentials' });
    expect(getUserList).not.toHaveBeenCalled();
  });

  it('rejects an invalid password', async () => {
    const { POST } = await import('@/app/api/auth/demo-code-sign-in/route');
    const res = await POST(makeRequest({
      email: 'anand.sundaram+meridian@thesundaram.com',
      password: 'wrong-password',
      code: '424242',
    }));

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toMatchObject({ error: 'invalid_credentials' });
    expect(getUserList).not.toHaveBeenCalled();
  });

  it('rejects an invalid demo code', async () => {
    const { POST } = await import('@/app/api/auth/demo-code-sign-in/route');
    const res = await POST(makeRequest({
      email: 'anand.sundaram+meridian@thesundaram.com',
      password: 'Demo2026!',
      code: '000000',
    }));

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toMatchObject({ error: 'invalid_credentials' });
    expect(getUserList).not.toHaveBeenCalled();
  });

  it('returns a sign-in ticket for a supported Apex account', async () => {
    const { POST } = await import('@/app/api/auth/demo-code-sign-in/route');
    const res = await POST(makeRequest({
      email: 'anand.sundaram+apex@thesundaram.com',
      password: 'Demo2026!',
      code: '424242',
    }));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ ticket: 'ticket_demo_1' });
    expect(getUserList).toHaveBeenCalledWith({
      emailAddress: ['anand.sundaram+apex@thesundaram.com'],
      limit: 1,
    });
    expect(createSignInToken).toHaveBeenCalledWith({
      userId: 'user_demo_1',
      expiresInSeconds: 300,
    });
  });

  it('returns a sign-in ticket for a supported Meridian account', async () => {
    const { POST } = await import('@/app/api/auth/demo-code-sign-in/route');
    const res = await POST(makeRequest({
      email: 'anand.sundaram+meridian@thesundaram.com',
      password: 'Demo2026!',
      code: '424242',
    }));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ ticket: 'ticket_demo_1' });
    expect(getUserList).toHaveBeenCalledWith({
      emailAddress: ['anand.sundaram+meridian@thesundaram.com'],
      limit: 1,
    });
  });
});
