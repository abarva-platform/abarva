import { requireTenancy } from '@/lib/auth/tenancy';
import { requireAtlasTenancy } from '../_auth';

jest.mock('@/lib/auth/tenancy', () => ({
  requireTenancy: jest.fn(),
}));

const requireTenancyMock = requireTenancy as jest.MockedFunction<typeof requireTenancy>;

describe('/api/v1/atlas auth user id normalization', () => {
  beforeEach(() => {
    requireTenancyMock.mockReset();
  });

  it('drops Clerk fallback ids before Atlas writes to UUID-backed person columns', async () => {
    requireTenancyMock.mockResolvedValue({
      clientId: 'client-meridian',
      clientKey: 'meridian',
      userId: 'clerk:user_3DT3BS5dN0BeqHODKBvU2dnTjb8',
    });

    await expect(requireAtlasTenancy('meridian')).resolves.toEqual({
      clientId: 'client-meridian',
      userId: null,
    });
  });

  it('preserves UUID person ids for Atlas audit attribution', async () => {
    const personId = '00000000-0000-4000-8000-000000000001';
    requireTenancyMock.mockResolvedValue({
      clientId: 'client-apex',
      clientKey: 'apexretail',
      userId: personId,
    });

    await expect(requireAtlasTenancy('client-apex')).resolves.toEqual({
      clientId: 'client-apex',
      userId: personId,
    });
  });
});
