import { resolveTenantHome } from '@/components/home/tenant-home-fixtures';
import { getITStack } from '@/lib/home/tenant-inventory';

describe('Apex home truth spine', () => {
  it('renders the corrected Packet 18 Apex profile instead of the retired demo facts', () => {
    const home = resolveTenantHome('apexretail');

    expect(home.tagline).toContain('$24.8B');
    expect(home.tagline).toContain('96,000 employees');
    expect(home.tagline).toContain('SAP ECC 6.0');
    expect(home.tagline).not.toContain('$18B');
    expect(home.tagline).not.toContain('72,000 employees');
    expect(home.tagline).not.toContain('SAP S/4');
  });

  it('shows SAP ECC 6.0 as the current-state ERP in the home inventory', () => {
    const apexStack = getITStack('apexretail');

    expect(apexStack.some((item) => item.name === 'SAP ECC 6.0' && item.budgetAnnual === 22_000_000)).toBe(true);
    expect(apexStack.some((item) => item.name === 'SAP S/4HANA')).toBe(false);
  });
});
