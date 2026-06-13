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

jest.mock('../queries', () => ({
  getProgramById: (...args: unknown[]) => mockGetProgramById(...args),
}));

import { loadMoveBusinessCaseInput } from './load-move-business-case-input';

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
    mockRequireTenancy.mockResolvedValue({
      clientId: 'client-1',
      clientKey: 'skyharbor-air',
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
      tenant_key: 'skyharbor-air',
      tenant_name: 'SkyHarbor Air',
      baseline_metrics: [{ metric: 'misconnect_rate', value: 0.18 }],
    });
  });

  it('returns null when the move fails the tenant-scoped program lookup', async () => {
    mockGetProgramById.mockResolvedValue(null);

    await expect(loadMoveBusinessCaseInput('move-1')).resolves.toBeNull();
    expect(mockAzureMaybeSingle).not.toHaveBeenCalled();
  });
});
