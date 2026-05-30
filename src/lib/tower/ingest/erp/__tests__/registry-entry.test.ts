// Tower · ERP ingest · registry entry assertions.
//
// Locks in the contract that the Oracle/SAP ERP entry is present in
// the onboarding catalog, declares the confidential data class, and
// targets the cost + value dimensions.

import { ONBOARDING_CATALOG } from '@/lib/tower/onboarding-catalog';

describe('onboarding catalog · oracle_sap_erp entry', () => {
  const entry = ONBOARDING_CATALOG.find((c) => c.key === 'oracle_sap_erp');

  it('is present in the registry', () => {
    expect(entry).toBeDefined();
  });

  it('declares dataClass=confidential', () => {
    expect(entry?.dataClass).toBe('confidential');
  });

  it('targets cost + value dimensions', () => {
    expect(entry?.dimensions).toEqual(expect.arrayContaining(['cost', 'value']));
  });

  it('mentions both Oracle and SAP extract paths in steps', () => {
    const joined = (entry?.steps ?? []).join(' \n ');
    expect(joined).toMatch(/Oracle/i);
    expect(joined).toMatch(/SAP/i);
  });

  it('maps key source columns onto the new Tower tables', () => {
    const targets = (entry?.fields ?? []).map((f) => f.target);
    expect(targets).toEqual(
      expect.arrayContaining([
        'tower_program_financials.program_id',
        'tower_program_financials.actual_usd',
        'tower_program_financials.capex_usd',
        'tower_program_financials.opex_usd',
        'tower_vendor_spend.vendor_name',
      ]),
    );
  });
});
