const getCurrentPersonMock = jest.fn();
const getCurrentUserMock = jest.fn();
const getActiveClientRowMock = jest.fn();

jest.mock('@/lib/auth/maestro', () => ({
  __esModule: true,
  getCurrentPerson: (...args: unknown[]) => getCurrentPersonMock(...args),
}));

jest.mock('@/lib/auth/current-user', () => ({
  __esModule: true,
  getCurrentUser: (...args: unknown[]) => getCurrentUserMock(...args),
}));

jest.mock('@/lib/active-client', () => ({
  __esModule: true,
  getActiveClientRow: (...args: unknown[]) => getActiveClientRowMock(...args),
}));

import { requireTenancy, TenancyError } from '../_auth';

describe('programs requireTenancy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getActiveClientRowMock.mockResolvedValue({
      id: 'client-meridian-uuid',
      name: 'Meridian Health System',
      industry_code: 'HEALTHCARE_IDN',
      key: 'meridian',
    });
  });

  it('accepts signed-in Clerk demo users without a linked persons row', async () => {
    getCurrentPersonMock.mockResolvedValue(null);
    getCurrentUserMock.mockResolvedValue({
      personId: null,
      clerkUserId: 'user_demo_meridian',
      primaryRole: 'client_viewer',
      tenantRoles: { meridian: 'tenant_admin' },
    });

    await expect(requireTenancy()).resolves.toMatchObject({
      clientId: 'client-meridian-uuid',
      userId: 'clerk:user_demo_meridian',
      clerkUserId: 'user_demo_meridian',
      tenantRole: 'tenant_admin',
      role: 'client_viewer',
    });
  });

  it('does not trust legacy display-name person ids as UUID actor ids', async () => {
    getCurrentPersonMock.mockResolvedValue({
      id: 'Anand Sundaram',
      role: 'client_viewer',
      email: 'anand.sundaram+lakeshore@thesundaram.com',
    });
    getCurrentUserMock.mockResolvedValue({
      personId: 'Anand Sundaram',
      clerkUserId: 'user_demo_lakeshore',
      primaryRole: 'client_viewer',
      tenantRoles: { lakeshore: 'tenant_admin' },
      email: 'anand.sundaram+lakeshore@thesundaram.com',
      name: 'Anand Sundaram',
    });
    getActiveClientRowMock.mockResolvedValue({
      id: 'client-lakeshore-uuid',
      name: 'Industrial Demo',
      industry_code: 'INDUSTRIAL',
      key: 'lakeshore',
    });

    await expect(requireTenancy()).resolves.toMatchObject({
      clientId: 'client-lakeshore-uuid',
      userId: 'clerk:user_demo_lakeshore',
      clerkUserId: 'user_demo_lakeshore',
      tenantRole: 'tenant_admin',
      role: 'client_viewer',
      email: 'anand.sundaram+lakeshore@thesundaram.com',
    });
  });

  it('still rejects fully unauthenticated requests', async () => {
    getCurrentPersonMock.mockResolvedValue(null);
    getCurrentUserMock.mockResolvedValue(null);

    await expect(requireTenancy()).rejects.toEqual(new TenancyError('unauthenticated'));
  });
});
