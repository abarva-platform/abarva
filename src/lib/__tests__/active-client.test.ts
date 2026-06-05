import { getActiveClientKey, getActiveClientRow } from '@/lib/active-client';

const currentUserMock = jest.fn();
const cookiesMock = jest.fn();
const mockAzureMaybeSingle = jest.fn();

jest.mock('@clerk/nextjs/server', () => ({
  currentUser: () => currentUserMock(),
}));

jest.mock('next/headers', () => ({
  cookies: () => cookiesMock(),
}));

jest.mock('@/lib/data-plane/azureRead', () => ({
  azureRead: {
    maybeSingle: (...args: unknown[]) => mockAzureMaybeSingle(...args),
  },
}));

describe('getActiveClientKey', () => {
  beforeEach(() => {
    currentUserMock.mockReset();
    cookiesMock.mockReset();
    mockAzureMaybeSingle.mockReset();
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

  it('does not let locked client roles switch tenants through requested client ids', async () => {
    currentUserMock.mockResolvedValue({
      publicMetadata: { role: 'client', clientId: 'meridian' },
      primaryEmailAddress: { emailAddress: 'external.cdao@example.com' },
      emailAddresses: [],
    });
    cookiesMock.mockResolvedValue({
      get: () => ({ value: 'apexretail' }),
    });

    await expect(getActiveClientKey('apexretail')).resolves.toBe('meridian');
  });

  it('falls back to locked-role metadata before requested client ids when only defaultClientId is present', async () => {
    currentUserMock.mockResolvedValue({
      publicMetadata: { role: 'maestro', defaultClientId: 'arcturus' },
      primaryEmailAddress: { emailAddress: 'firstcapital.demo@example.com' },
      emailAddresses: [],
    });
    cookiesMock.mockResolvedValue({
      get: () => ({ value: 'apexretail' }),
    });

    await expect(getActiveClientKey('meridian')).resolves.toBe('arcturus');
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

    mockAzureMaybeSingle.mockResolvedValueOnce({
      id: 'client-apex-uuid',
      name: 'Apex Retail Group LLC',
      industry_code: 'RETAIL',
    });

    await expect(getActiveClientRow()).resolves.toEqual({
      id: 'client-apex-uuid',
      name: 'Apex Retail Group',
      industry_code: 'RETAIL',
      key: 'apexretail',
    });
    expect(mockAzureMaybeSingle).toHaveBeenCalledWith({
      table: 'clients',
      columns: ['id', 'name', 'industry_code'],
      where: { tenant_key: 'apexretail' },
    });
  });

  it('canonicalizes Meridian database rows to Meridian Health System', async () => {
    currentUserMock.mockResolvedValue({
      publicMetadata: { role: 'client' },
      primaryEmailAddress: { emailAddress: 'anita.krishnamurthy@meridian-health.example.com' },
      emailAddresses: [],
    });
    cookiesMock.mockResolvedValue({
      get: () => null,
    });

    mockAzureMaybeSingle.mockResolvedValueOnce({
      id: 'client-meridian-uuid',
      name: 'Meridian Health',
      industry_code: 'HEALTHCARE_IDN',
    });

    await expect(getActiveClientRow()).resolves.toEqual({
      id: 'client-meridian-uuid',
      name: 'Meridian Health System',
      industry_code: 'HEALTHCARE_IDN',
      key: 'meridian',
    });
  });
});
