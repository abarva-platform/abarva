const mockAuth = jest.fn();
const mockGetActiveClientRow = jest.fn();
const mockRequireTenancy = jest.fn();
const mockLoadUserProgramAccessPolicy = jest.fn();

jest.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
}));

jest.mock('@/lib/active-client', () => ({
  getActiveClientRow: () => mockGetActiveClientRow(),
}));

class MockTenancyError extends Error {
  constructor(public readonly code: 'unauthenticated' | 'no_client') {
    super(code);
  }
}

jest.mock('@/lib/auth/tenancy', () => ({
  requireTenancy: () => mockRequireTenancy(),
  TenancyError: MockTenancyError,
}));

jest.mock('@/lib/auth/program-access-policy', () => ({
  loadUserProgramAccessPolicy: (ctx: unknown) => mockLoadUserProgramAccessPolicy(ctx),
}));

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  mockAuth.mockResolvedValue({ userId: 'clerk_user_123' });
  mockGetActiveClientRow.mockResolvedValue({
    id: 'client-apex',
    key: 'apexretail',
    name: 'Apex Retail Group',
  });
  mockRequireTenancy.mockResolvedValue({
    clientId: 'client-apex',
    userId: 'person-apex-admin',
    role: 'client_admin',
    email: 'maya.desai@apex-retail.example.com',
  });
});

describe('approval admin auth', () => {
  it('allows a DB-backed gate approver even without Clerk tenantRoles', async () => {
    mockLoadUserProgramAccessPolicy.mockResolvedValue({
      canAdminUsers: false,
      canApproveGates: true,
    });

    const { requireAdminDecide } = await import('../_auth');
    await expect(requireAdminDecide()).resolves.toEqual({
      userId: 'person-apex-admin',
      tenantKey: 'apexretail',
      isAdmin: true,
    });
    expect(mockLoadUserProgramAccessPolicy).toHaveBeenCalledWith({
      clientId: 'client-apex',
      userId: 'person-apex-admin',
      role: 'client_admin',
      email: 'maya.desai@apex-retail.example.com',
    });
  });

  it('allows a DB-backed tenant admin to decide approvals', async () => {
    mockLoadUserProgramAccessPolicy.mockResolvedValue({
      canAdminUsers: true,
      canApproveGates: false,
    });

    const { requireAdminDecide } = await import('../_auth');
    await expect(requireAdminDecide()).resolves.toMatchObject({
      userId: 'person-apex-admin',
      tenantKey: 'apexretail',
      isAdmin: true,
    });
  });

  it('rejects active-client members without admin or gate-approval rights', async () => {
    mockLoadUserProgramAccessPolicy.mockResolvedValue({
      canAdminUsers: false,
      canApproveGates: false,
    });

    const { requireAdminDecide } = await import('../_auth');
    await expect(requireAdminDecide()).rejects.toMatchObject({
      status: 403,
      code: 'forbidden_admin_required',
    });
  });

  it('maps missing active tenant to no_tenant', async () => {
    mockGetActiveClientRow.mockResolvedValue(null);

    const { requireAdminDecide } = await import('../_auth');
    await expect(requireAdminDecide()).rejects.toMatchObject({
      status: 403,
      code: 'no_tenant',
    });
  });
});
