jest.mock('server-only', () => ({}));

const mockRun = jest.fn();

jest.mock('@/lib/data-plane/read-adapters/azureSession', () => ({
  createDefaultSession: jest.fn(() => async (fn: (run: typeof mockRun) => Promise<unknown>) => fn(mockRun)),
}));

import {
  formatTenantFactAvailabilityBlock,
  getTenantFactFingerprint,
  type TenantFactFingerprint,
} from '../tenant-fact-fingerprint';

describe('tenant fact availability no-fabrication guard', () => {
  beforeEach(() => {
    mockRun.mockReset();
  });

  it('marks unavailable named-entity classes as false and forbids fabrication', () => {
    const fingerprint: TenantFactFingerprint = {
      hasExecutiveBios: false,
      hasApplicationPortfolio: true,
      hasVendorContracts: true,
      hasInitiatives: false,
      hasFinancials: false,
      hasBoardMinutes: false,
      namedEntityClasses: ['apps', 'vendors'],
    };

    const block = formatTenantFactAvailabilityBlock(fingerprint);

    expect(block).toContain('Executive bios:        false');
    expect(block).toContain('Application portfolio: true');
    expect(block).toContain('Vendor contracts:      true');
    expect(block).toContain('Initiatives:           false');
    expect(block).toContain('Financial figures:     false');
    expect(block).toContain('Never fabricate names, dollars, dates, vendors, systems, executives, renewals, initiatives');
    expect(block).toContain('this is a pattern, not your data');
  });

  it('resolves tenant inventory keys against the Azure data plane before computing availability', async () => {
    mockRun.mockImplementation(async (sql: string, params: unknown[]) => {
      if (/FROM clients[\s\S]+tenant_key/.test(sql)) {
        expect(params[0]).toEqual(['skyharbor-air', 'skyharbor']);
        return [{ id: 'skyharbor-client-id' }];
      }
      if (/FROM applications/.test(sql)) return [{ count: 92 }];
      if (/FROM vendor_contracts/.test(sql)) return [{ count: 52 }];
      if (/FROM ai_initiatives/.test(sql)) return [{ count: 38 }];
      if (/SELECT annual_revenue_usd/.test(sql)) {
        expect(params[0]).toBe('skyharbor-client-id');
        return [{ annual_revenue_usd: 52_100_000_000, it_budget_usd: 3_200_000_000, ai_budget_usd: null }];
      }
      if (/FROM enterprise_context_chunks/.test(sql)) {
        const segments = params[1] as string[];
        if (segments.includes('org_structure')) return [{ chunk_text: 'Amala Rao CIO executive' }];
        if (segments.includes('it_financials')) return [{ chunk_text: 'FY2026 budget $3.2B value realized disputed' }];
        if (segments.includes('enterprise_profile')) return [{ chunk_text: 'board modernization update' }];
      }
      return [];
    });

    const fingerprint = await getTenantFactFingerprint({ tenantInventoryKey: 'skyharbor' });

    expect(fingerprint).toMatchObject({
      hasExecutiveBios: true,
      hasApplicationPortfolio: true,
      hasVendorContracts: true,
      hasInitiatives: true,
      hasFinancials: true,
      hasBoardMinutes: true,
    });
    expect(fingerprint?.namedEntityClasses).toEqual(['executives', 'apps', 'vendors', 'initiatives', 'financials', 'board']);
  });

  it('resolves Lakeshore app keys to the Azure broker tenant aliases', async () => {
    mockRun.mockImplementation(async (sql: string, params: unknown[]) => {
      if (/FROM clients[\s\S]+tenant_key/.test(sql)) {
        expect(params[0]).toEqual(['lakeshore-holdings', 'lakeshore']);
        return [{ id: 'lakeshore-client-id' }];
      }
      if (/FROM applications/.test(sql)) return [{ count: 18 }];
      if (/FROM vendor_contracts/.test(sql)) return [{ count: 82 }];
      if (/FROM ai_initiatives/.test(sql)) return [{ count: 40 }];
      if (/SELECT annual_revenue_usd/.test(sql)) {
        expect(params[0]).toBe('lakeshore-client-id');
        return [{ annual_revenue_usd: null, it_budget_usd: 1_200_000_000, ai_budget_usd: null }];
      }
      if (/FROM enterprise_context_chunks/.test(sql)) {
        const segments = params[1] as string[];
        if (segments.includes('org_structure')) return [{ chunk_text: 'Quinn Chen treasury executive' }];
        if (segments.includes('enterprise_profile')) return [{ chunk_text: 'board modernization update' }];
      }
      return [];
    });

    const fingerprint = await getTenantFactFingerprint({ tenantInventoryKey: 'lakeshore' });

    expect(fingerprint).toMatchObject({
      hasExecutiveBios: true,
      hasApplicationPortfolio: true,
      hasVendorContracts: true,
      hasInitiatives: true,
      hasFinancials: true,
      hasBoardMinutes: true,
    });
    expect(fingerprint?.namedEntityClasses).toEqual(['executives', 'apps', 'vendors', 'initiatives', 'financials', 'board']);
  });
});
