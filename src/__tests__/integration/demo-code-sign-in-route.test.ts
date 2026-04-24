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

  it('rejects non-demo email addresses', async () => {
    const { POST } = await import('@/app/api/auth/demo-code-sign-in/route');
    const res = await POST(makeRequest({
      email: 'real-user@abarva.com',
      code: '424242',
    }));

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toMatchObject({ error: 'unsupported_demo_account' });
    expect(getUserList).not.toHaveBeenCalled();
  });

  it('rejects an invalid demo code', async () => {
    const { POST } = await import('@/app/api/auth/demo-code-sign-in/route');
    const res = await POST(makeRequest({
      email: 'demo-meridian+clerk_test@abarva.com',
      code: '000000',
    }));

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toMatchObject({ error: 'invalid_demo_code' });
    expect(getUserList).not.toHaveBeenCalled();
  });

  it('returns a sign-in ticket for a supported demo account', async () => {
    const { POST } = await import('@/app/api/auth/demo-code-sign-in/route');
    const res = await POST(makeRequest({
      email: 'demo-meridian+clerk_test@abarva.com',
      code: '424242',
    }));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ ticket: 'ticket_demo_1' });
    expect(getUserList).toHaveBeenCalledWith({
      emailAddress: ['demo-meridian+clerk_test@abarva.com'],
      limit: 1,
    });
    expect(createSignInToken).toHaveBeenCalledWith({
      userId: 'user_demo_1',
      expiresInSeconds: 300,
    });
  });
});
