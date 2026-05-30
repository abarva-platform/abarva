import { buildAgentContext } from '../context-bundle';
import { generateStewardEditorial } from '../editorial';

describe('admin Steward editorial tenant isolation', () => {
  it.each([
    ['apex-retail', 'Apex Retail'],
    ['skyharbor-air', 'SkyHarbor Air'],
    ['meridian', 'Meridian Health System'],
  ])('renders production readiness copy for %s without other tenant names', (tenantSlug, tenantName) => {
    const ctx = buildAgentContext(tenantSlug, 'admin', 'production-readiness');
    const editorial = generateStewardEditorial(ctx);

    expect(editorial.body).toContain(`Demo readiness is strong for ${tenantName}`);

    const otherTenants = ['Apex Retail', 'SkyHarbor', 'Meridian'].filter(
      (name) => !tenantName.includes(name),
    );
    for (const otherTenant of otherTenants) {
      expect(editorial.body).not.toContain(otherTenant);
    }
  });
});
