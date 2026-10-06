import {
  getActiveClientKey,
  getActiveClientRow,
  TenantLookupUnavailableError,
} from '@/lib/active-client';

// The `name` these cases assert is the canonical registry display name from
// `DEMO_SAFE_CLIENT_NAMES` (src/lib/client-config.ts), NOT the raw `clients.name`
// column the mock returns. Each case therefore feeds a non-canonical row name and
// pins the canonical result as an exact string literal. The literal is deliberate:
// asserting `DEMO_SAFE_CLIENT_NAMES.meridian` would read the same constant the
// product reads and would pass whatever that constant said, which is no assertion
// at all.
//
// Provenance for those literals, so the next reader does not re-derive it:
//   apexretail  "Apex Retail Group"      -> "Retail Demo"      #4276 / 1886b8d24, 2026-07-01
//   meridian    "Meridian Health System" -> "Healthcare Demo"  #4276 / 1886b8d24, 2026-07-01
//                                        -> "Meridian Health"  #5987 / 9f4d7fdeb, 2026-08-07
//
// Three cases in this file asserted the pre-#4276 values and were red from
// 2026-07-01 until backlog item T-559. Nothing reported it because no workflow ran
// this file. It is now named by exact path in `.github/workflows/unit-suites.yml`
// so the same silence cannot recur.

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
      name: 'Retail Demo',
      industry_code: 'RETAIL',
      key: 'apexretail',
    });
    expect(mockAzureMaybeSingle).toHaveBeenCalledWith({
      table: 'clients',
      columns: ['id', 'name', 'industry_code'],
      where: { tenant_key: 'apexretail' },
    });
  });

  it('canonicalizes a Meridian database row alias to the canonical display name', async () => {
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
      name: 'Meridian Health System',
      industry_code: 'HEALTHCARE_IDN',
    });

    await expect(getActiveClientRow()).resolves.toEqual({
      id: 'client-meridian-uuid',
      name: 'Meridian Health',
      industry_code: 'HEALTHCARE_IDN',
      key: 'meridian',
    });
  });
});

// Regression for the artifact-download HTTP 503 (Moves File Cabinet). The download
// route returns 503 only when requireTenancy() → getActiveClientRow() throws
// TenantLookupUnavailableError. A single transient DB/VNet blip on a freshly routed
// request must NOT dead-end the download; getActiveClientRow retries the lookup a couple
// of times before giving up so a one-off blip recovers, and only a sustained outage 503s.
describe('getActiveClientRow tenant-lookup resilience (download 503 fix)', () => {
  beforeEach(() => {
    currentUserMock.mockReset();
    cookiesMock.mockReset();
    mockAzureMaybeSingle.mockReset();
    currentUserMock.mockResolvedValue({
      publicMetadata: { role: 'client' },
      primaryEmailAddress: { emailAddress: 'carlos.rivera@apexretail.com' },
      emailAddresses: [],
    });
    cookiesMock.mockResolvedValue({ get: () => null });
  });

  it('recovers from a transient tenant-lookup blip instead of 503-ing on the first failure', async () => {
    mockAzureMaybeSingle
      .mockRejectedValueOnce(new Error('ECONNRESET'))
      .mockResolvedValueOnce({
        id: 'client-apex-uuid',
        name: 'Apex Retail Group LLC',
        industry_code: 'RETAIL',
      });

    await expect(getActiveClientRow()).resolves.toEqual({
      id: 'client-apex-uuid',
      name: 'Retail Demo',
      industry_code: 'RETAIL',
      key: 'apexretail',
    });
    // Proves the retry fired (first attempt threw, a later attempt succeeded).
    expect(mockAzureMaybeSingle.mock.calls.length).toBeGreaterThan(1);
  });

  it('still throws TenantLookupUnavailableError (→ retryable 503) after a sustained outage', async () => {
    mockAzureMaybeSingle.mockRejectedValue(new Error('db down'));

    await expect(getActiveClientRow()).rejects.toBeInstanceOf(
      TenantLookupUnavailableError,
    );
    // Initial attempt + 2 retries = 3 lookups before giving up.
    expect(mockAzureMaybeSingle.mock.calls.length).toBeGreaterThanOrEqual(3);
  });
});
