import { getActiveClientKey, getActiveClientRow } from '@/lib/active-client';

const currentUserMock = jest.fn();
const cookiesMock = jest.fn();
const getServerSupabaseMock = jest.fn();

jest.mock('@clerk/nextjs/server', () => ({
  currentUser: () => currentUserMock(),
}));

jest.mock('next/headers', () => ({
  cookies: () => cookiesMock(),
}));

jest.mock('@/lib/supabase-server', () => ({
  getServerSupabase: () => getServerSupabaseMock(),
}));

describe('getActiveClientKey', () => {
  beforeEach(() => {
    currentUserMock.mockReset();
    cookiesMock.mockReset();
    getServerSupabaseMock.mockReset();
  });

  it('pins explicit client-domain personas before stale active-client cookies', async () => {
    currentUserMock.mockResolvedValue({
      publicMetadata: { role: 'admin' },
      primaryEmailAddress: { emailAddress: 'nina.patel@meridian-health.example.com' },
      emailAddresses: [],
    });
    cookiesMock.mockResolvedValue({
      get: () => ({ value: 'apexretail' }),
    });

    await expect(getActiveClientKey()).resolves.toBe('meridian');
  });

  it('resolves data-backed client rows by tenant_key before display-name aliases', async () => {
    currentUserMock.mockResolvedValue({
      publicMetadata: { role: 'client' },
      primaryEmailAddress: { emailAddress: 'carlos.rivera@apexretail.com' },
      emailAddresses: [],
    });
    cookiesMock.mockResolvedValue({
      get: () => null,
    });

    const maybeSingle = jest.fn(async () => ({
      data: {
        id: 'client-apex-uuid',
        name: 'Apex Retail Group LLC',
        industry_code: 'RETAIL',
      },
    }));
    const limit = jest.fn(() => ({ maybeSingle }));
    const eq = jest.fn(() => ({ limit }));
    const ilike = jest.fn(() => ({ maybeSingle: jest.fn(async () => ({ data: null })) }));
    const select = jest.fn(() => ({ eq, ilike }));
    const from = jest.fn(() => ({ select }));
    getServerSupabaseMock.mockReturnValue({ from });

    await expect(getActiveClientRow()).resolves.toEqual({
      id: 'client-apex-uuid',
      name: 'Apex Retail Group LLC',
      industry_code: 'RETAIL',
      key: 'apexretail',
    });
    expect(from).toHaveBeenCalledWith('clients');
    expect(eq).toHaveBeenCalledWith('tenant_key', 'apexretail');
  });
});
