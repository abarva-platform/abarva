jest.mock('server-only', () => ({}));

import {
  formatTenantFactAvailabilityBlock,
  type TenantFactFingerprint,
} from '../tenant-fact-fingerprint';

describe('tenant fact availability no-fabrication guard', () => {
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
});
