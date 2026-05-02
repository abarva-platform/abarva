import type { ReactNode } from 'react';

const mockRequireTenancy = jest.fn();
const mockLoadUserProgramAccessPolicy = jest.fn();

jest.mock('@/lib/auth/tenancy', () => ({
  requireTenancy: () => mockRequireTenancy(),
}));

jest.mock('@/lib/auth/program-access-policy', () => ({
  loadUserProgramAccessPolicy: (ctx: unknown) => mockLoadUserProgramAccessPolicy(ctx),
}));

jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
  currentUser: jest.fn(),
}));

jest.mock('next/server', () => ({
  connection: jest.fn(),
}));

jest.mock('@/components/admin/AdminCanonShellV2', () => ({
  AdminCanonShellV2: ({ children }: { children: ReactNode }) => children,
}));

jest.mock('@/components/admin/EditorialCanvas', () => ({
  EditorialCanvas: ({ children }: { children: ReactNode }) => children,
}));

jest.mock('@/components/admin/AgentRail', () => ({
  AgentRail: () => null,
}));

describe('admin layout tenant access', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows tenant-pinned client admins from DB policy into Setup', async () => {
    const tenancy = { clientId: 'client-1', userId: 'person-1' };
    mockRequireTenancy.mockResolvedValue(tenancy);
    mockLoadUserProgramAccessPolicy.mockResolvedValue({ canAdminUsers: true });

    const { hasTenantAdminAccess } = await import('../layout');
    await expect(hasTenantAdminAccess()).resolves.toBe(true);
    expect(mockLoadUserProgramAccessPolicy).toHaveBeenCalledWith(tenancy);
  });

  it('denies non-admin users when DB policy does not grant admin rights', async () => {
    mockRequireTenancy.mockResolvedValue({ clientId: 'client-1', userId: 'person-2' });
    mockLoadUserProgramAccessPolicy.mockResolvedValue({ canAdminUsers: false });

    const { hasTenantAdminAccess } = await import('../layout');
    await expect(hasTenantAdminAccess()).resolves.toBe(false);
  });

  it('fails closed when tenancy cannot be resolved', async () => {
    mockRequireTenancy.mockRejectedValue(new Error('no_client'));

    const { hasTenantAdminAccess } = await import('../layout');
    await expect(hasTenantAdminAccess()).resolves.toBe(false);
  });
});
