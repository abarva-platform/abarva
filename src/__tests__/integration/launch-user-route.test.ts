const getUserList = jest.fn();
const createUser = jest.fn();
const updateUser = jest.fn();

jest.mock('@clerk/backend', () => ({
  createClerkClient: () => ({
    users: { getUserList, createUser, updateUser },
  }),
}));

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/auth/launch-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/launch-user', () => {
  const originalSecret = process.env.CLERK_SECRET_KEY;
  const originalAllowedEmails = process.env.ABARVA_LAUNCH_ALLOWED_EMAILS;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env.CLERK_SECRET_KEY = 'sk_test_launch';
    delete process.env.ABARVA_LAUNCH_ALLOWED_EMAILS;
    getUserList.mockResolvedValue({ data: [] });
    createUser.mockResolvedValue({ id: 'user_created_1' });
    updateUser.mockResolvedValue({ id: 'user_existing_1' });
  });

  afterAll(() => {
    process.env.CLERK_SECRET_KEY = originalSecret;
    if (originalAllowedEmails === undefined) {
      delete process.env.ABARVA_LAUNCH_ALLOWED_EMAILS;
    } else {
      process.env.ABARVA_LAUNCH_ALLOWED_EMAILS = originalAllowedEmails;
    }
  });

  it('creates a Clerk user for an approved launch identity before OTP starts', async () => {
    process.env.ABARVA_LAUNCH_ALLOWED_EMAILS = 'operator@example.com:admin:meridian';

    const { POST } = await import('@/app/api/auth/launch-user/route');
    const res = await POST(makeRequest({ email: 'Operator@Example.com ' }));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      status: 'created',
      role: 'admin',
      clientKey: 'meridian',
    });
    expect(createUser).toHaveBeenCalledWith(expect.objectContaining({
      emailAddress: ['operator@example.com'],
      phoneNumber: [expect.stringMatching(/^\+120255501\d{2}$/)],
      skipPasswordRequirement: true,
      publicMetadata: expect.objectContaining({
        role: 'admin',
        clientId: 'meridian',
        defaultClientId: 'meridian',
        moduleAccess: ['setup', 'programs', 'source', 'intelligence', 'tower'],
        tenantRoles: expect.objectContaining({
          meridian: 'tenant_admin',
          'meridian-health': 'tenant_admin',
          meridian_health_global: 'tenant_admin',
        }),
      }),
    }));
  });

  it('refreshes an existing approved user instead of creating a duplicate', async () => {
    getUserList.mockResolvedValueOnce({
      data: [{ id: 'user_existing_1', publicMetadata: { role: 'client' } }],
    });

    const { POST } = await import('@/app/api/auth/launch-user/route');
    const res = await POST(makeRequest({ email: 'anand.sundaram+apex@thesundaram.com' }));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      status: 'updated',
      role: 'client',
      clientKey: 'apexretail',
    });
    expect(createUser).not.toHaveBeenCalled();
    expect(updateUser).toHaveBeenCalledWith(
      'user_existing_1',
      expect.objectContaining({
        publicMetadata: expect.objectContaining({
          role: 'client',
          clientId: 'apexretail',
          defaultClientId: 'apexretail',
          tenantRoles: expect.objectContaining({
            apexretail: 'viewer',
            'apex-retail': 'viewer',
          }),
        }),
      }),
    );
  });

  it('does not touch Clerk for unapproved email addresses', async () => {
    const { POST } = await import('@/app/api/auth/launch-user/route');
    const res = await POST(makeRequest({ email: 'person@example.com' }));

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toMatchObject({ error: 'access_not_provisioned' });
    expect(getUserList).not.toHaveBeenCalled();
    expect(createUser).not.toHaveBeenCalled();
    expect(updateUser).not.toHaveBeenCalled();
  });

  it('fails closed when Clerk is not configured', async () => {
    process.env.ABARVA_LAUNCH_ALLOWED_EMAILS = 'operator@example.com:admin:meridian';
    delete process.env.CLERK_SECRET_KEY;

    const { POST } = await import('@/app/api/auth/launch-user/route');
    const res = await POST(makeRequest({ email: 'operator@example.com' }));

    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toMatchObject({ error: 'clerk_not_configured' });
    expect(getUserList).not.toHaveBeenCalled();
    expect(createUser).not.toHaveBeenCalled();
  });

  it('surfaces Clerk provisioning failures as JSON instead of an empty 500', async () => {
    process.env.ABARVA_LAUNCH_ALLOWED_EMAILS = 'operator@example.com:admin:meridian';
    createUser.mockRejectedValueOnce(Object.assign(new Error('Unprocessable Entity'), {
      code: 'api_response_error',
      status: 422,
      clerkTraceId: 'trace_123',
      errors: [{ code: 'form_data_missing' }],
    }));

    const { POST } = await import('@/app/api/auth/launch-user/route');
    const res = await POST(makeRequest({ email: 'operator@example.com' }));

    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toMatchObject({
      error: 'clerk_user_provisioning_failed',
    });
  });
});

export {};
