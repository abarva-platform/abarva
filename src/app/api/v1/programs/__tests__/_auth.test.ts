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
    });

    await expect(requireTenancy()).resolves.toMatchObject({
      clientId: 'client-meridian-uuid',
      userId: 'clerk:user_demo_meridian',
      role: 'client_viewer',
    });
  });

  it('still rejects fully unauthenticated requests', async () => {
    getCurrentPersonMock.mockResolvedValue(null);
    getCurrentUserMock.mockResolvedValue(null);

    await expect(requireTenancy()).rejects.toEqual(new TenancyError('unauthenticated'));
  });
});
