/**
 * Atlas person-id normalization.
 *
 * The two assertions below were stale rather than wrong: `AtlasTenancyCtx`
 * gained `clientKey` (the boundary in `_auth.ts` accepts an explicit tenant
 * key as well as an id, and returns it), so a strict `toEqual` on the old
 * two-field shape failed on a field nobody had asserted was absent. The
 * expected objects now carry `clientKey`, which keeps the comparison strict:
 * a third field appearing silently still fails.
 */

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
      clientKey: 'meridian',
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
      clientKey: 'apexretail',
      userId: personId,
    });
  });
});
