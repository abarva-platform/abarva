import { getVendorsForClient } from '../vendors-data';

jest.mock('server-only', () => ({}));

const getVendorRowsForClient = jest.fn();

jest.mock('@/lib/data-plane/read-adapters/intelligenceVendorsReadAdapter', () => ({
  selectIntelligenceVendorsReadAdapter: () => ({
    getVendorRowsForClient,
  }),
}));

describe('getVendorsForClient', () => {
  beforeEach(() => {
    getVendorRowsForClient.mockReset();
  });

  it('attaches inference economics to signature-client vendor rollups', async () => {
    getVendorRowsForClient.mockResolvedValue([
      {
        vendor_id: 'vendor:apex:adobe',
        initiative_id: 'INIT-MMM',
        vendor_name: 'Adobe',
        contract_value_usd: 4_200_000,
        renewal_date: '2026-09-30',
        financial_health: 'strong',
        notes: 'Marketing and content',
        initiative: {
          initiative_id: 'INIT-MMM',
          display_id: 'APX-25',
          name: 'Marketing Mix Modeling Modernization',
          status_flag: 'on_track',
          stage: 'scale',
          client_id: 'apex-retail',
        },
      },
      {
        vendor_id: 'vendor:apex:unscored',
        initiative_id: 'INIT-OTHER',
        vendor_name: 'Unscored Vendor',
        contract_value_usd: null,
        renewal_date: null,
        financial_health: null,
        notes: null,
        initiative: {
          initiative_id: 'INIT-OTHER',
          display_id: 'APX-99',
          name: 'Other initiative',
          status_flag: 'on_track',
          stage: 'plan',
          client_id: 'apex-retail',
        },
      },
    ]);

    const data = await getVendorsForClient('apex-retail');
    const adobe = data.vendors.find((vendor) => vendor.vendorName === 'Adobe');
    const unscored = data.vendors.find((vendor) => vendor.vendorName === 'Unscored Vendor');

    expect(adobe?.inferenceEconomics).toEqual({
      perCallUsd: null,
      pricingTierLadder: [],
      repricingClauseText: null,
      repricingNoticeDays: null,
      volumeLockExpiresOn: null,
      contractCeilingUsdPerYear: null,
      asOf: '2026-05-31',
    });
    expect(adobe?.initiatives[0]?.inferenceEconomics?.asOf).toBe('2026-05-31');
    expect(unscored?.inferenceEconomics).toBeNull();
  });
});
