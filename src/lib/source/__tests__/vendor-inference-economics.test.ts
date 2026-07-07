import {
  getInferenceEconomicsForClientVendor,
  getInferenceEconomicsForVendor,
  listInferenceEconomicsForClient,
  SIGNATURE_CLIENT_VENDOR_INFERENCE_ECONOMICS,
} from '../vendor-inference-economics';

describe('vendor inference economics catalog', () => {
  it('covers at least six signature-client vendor scorecards with structured gaps', () => {
    expect(SIGNATURE_CLIENT_VENDOR_INFERENCE_ECONOMICS).toHaveLength(7);

    for (const row of SIGNATURE_CLIENT_VENDOR_INFERENCE_ECONOMICS) {
      expect(row.inferenceEconomics).toEqual({
        perCallUsd: null,
        pricingTierLadder: [],
        repricingClauseText: null,
        repricingNoticeDays: null,
        volumeLockExpiresOn: null,
        contractCeilingUsdPerYear: null,
        asOf: '2026-05-31',
      });
      expect(row.sourceBasis).toMatch(/^datasets\//);
    }
  });

  it('loads signature vendor economics for Apex, Meridian, and SkyHarbor', () => {
    expect(listInferenceEconomicsForClient('apex-retail').map((row) => row.vendorName)).toEqual(
      expect.arrayContaining(['Adobe', 'AWS', 'IBM Sterling OMS']),
    );
    expect(listInferenceEconomicsForClient('meridian-health').map((row) => row.vendorName)).toEqual(
      expect.arrayContaining(['Nuance/Microsoft', 'AWS']),
    );
    expect(listInferenceEconomicsForClient('skyharbor-air').map((row) => row.vendorName)).toEqual(
      expect.arrayContaining(['IBM', 'AWS']),
    );
  });

  it('resolves common product aliases without crossing client scope', () => {
    expect(getInferenceEconomicsForVendor('Adobe CDP')?.asOf).toBe('2026-05-31');
    expect(getInferenceEconomicsForVendor('DAX Copilot')?.asOf).toBe('2026-05-31');
    expect(getInferenceEconomicsForVendor('IBM mainframe')?.asOf).toBe('2026-05-31');

    expect(getInferenceEconomicsForClientVendor('apex-retail', 'Nuance/Microsoft')).toBeNull();
    expect(getInferenceEconomicsForClientVendor('skyharbor-air', 'Adobe')).toBeNull();
  });
});
