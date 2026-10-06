const mockAzureMaybeSingle = jest.fn();
const mockAzureSelect = jest.fn();
const mockRequireTenancy = jest.fn();
const mockGetProgramById = jest.fn();

jest.mock('@/lib/data-plane/azureRead', () => ({
  azureRead: {
    maybeSingle: (...args: unknown[]) => mockAzureMaybeSingle(...args),
    select: (...args: unknown[]) => mockAzureSelect(...args),
  },
}));

jest.mock('@/lib/auth/tenancy', () => ({
  requireTenancy: () => mockRequireTenancy(),
}));

jest.mock('../../queries', () => ({
  getProgramById: (...args: unknown[]) => mockGetProgramById(...args),
}));

import { canonicalClientDisplayName } from '@/lib/client-config';

import { loadMoveBusinessCaseInput } from '../load-move-business-case-input';

describe('loadMoveBusinessCaseInput', () => {
  beforeEach(() => {
    mockAzureMaybeSingle.mockReset();
    mockAzureSelect.mockReset();
    mockRequireTenancy.mockReset();
    mockGetProgramById.mockReset();
    mockAzureSelect.mockResolvedValue([]);
    mockRequireTenancy.mockResolvedValue({
      clientId: 'client-1',
      clientKey: 'apexretail',
      userId: 'user-1',
    });
    mockGetProgramById.mockResolvedValue({
      id: 'move-1',
      clientId: 'client-1',
      name: 'Contact center AI',
      archivedAt: null,
      deletedAt: null,
      functionPackKey: 'retail.contact_center',
      charter: { problem: 'Reduce call transfers' },
    });
  });

  it('loads tenant labels and engagement substrate through azureRead after RBAC program lookup', async () => {
    mockAzureMaybeSingle
      .mockResolvedValueOnce({ key: 'apex-retail', name: 'Apex Retail', industry_code: 'retail' })
      .mockResolvedValueOnce({
        baseline_metrics: [{ metric: 'transfer_rate', value: 0.22 }],
        industry_code: 'retail-storefront',
      });

    await expect(loadMoveBusinessCaseInput('move-1')).resolves.toMatchObject({
      industry_code: 'retail-storefront',
      name: 'Contact center AI',
      function_pack_key: 'retail.contact_center',
      tenant_key: 'apex-retail',
      tenant_name: 'Apex Retail',
      baseline_metrics: [{ metric: 'transfer_rate', value: 0.22 }],
    });
    expect(mockAzureMaybeSingle).toHaveBeenCalledWith({
      table: 'clients',
      columns: ['key', 'name', 'industry_code'],
      where: { id: 'client-1' },
    });
    expect(mockAzureMaybeSingle).toHaveBeenCalledWith({
      table: 'engagements',
      columns: ['baseline_metrics', 'industry_code'],
      where: { id: 'move-1' },
    });
  });

  it('falls back to the client industry only when the engagement has no industry code', async () => {
    mockAzureMaybeSingle
      .mockResolvedValueOnce({ key: 'apex-retail', name: 'Apex Retail', industry_code: 'retail' })
      .mockResolvedValueOnce({ baseline_metrics: [], industry_code: null });

    await expect(loadMoveBusinessCaseInput('move-1')).resolves.toMatchObject({
      industry_code: 'retail',
    });
  });

  it('uses the tenancy client key for deck labels when the client row lookup misses', async () => {
    // The fallback's contract is WHERE the label comes from, not what it says
    // today. This case used to pin the display string itself and went red the
    // day a deliberate rename moved it — a label change reported as a defect,
    // while the wiring it exists to protect was never in question. The
    // expectation is now taken from the same display-name authority the loader
    // consults, so a rename travels and a rewiring still fails.
    const tenantKey = 'skyharbor-air';
    const expectedName = canonicalClientDisplayName({
      key: tenantKey,
      name: null,
    });

    // Non-vacuous: if the authority ever returned the key unchanged or an empty
    // string, the assertion below would pass while the loader did nothing.
    expect(expectedName).toBeTruthy();
    expect(expectedName).not.toBe(tenantKey);

    mockRequireTenancy.mockResolvedValue({
      clientId: 'client-1',
      clientKey: tenantKey,
      userId: 'user-1',
    });
    mockAzureMaybeSingle
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        baseline_metrics: [{ metric: 'misconnect_rate', value: 0.18 }],
        industry_code: 'GLOBAL_NETWORK_AIRLINE',
      });

    await expect(loadMoveBusinessCaseInput('move-1')).resolves.toMatchObject({
      industry_code: 'GLOBAL_NETWORK_AIRLINE',
      tenant_key: tenantKey,
      tenant_name: expectedName,
      baseline_metrics: [{ metric: 'misconnect_rate', value: 0.18 }],
    });
  });

  it('returns null when the move fails the tenant-scoped program lookup', async () => {
    mockGetProgramById.mockResolvedValue(null);

    await expect(loadMoveBusinessCaseInput('move-1')).resolves.toBeNull();
    expect(mockAzureMaybeSingle).not.toHaveBeenCalled();
  });
});
