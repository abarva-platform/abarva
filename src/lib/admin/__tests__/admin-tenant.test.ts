/**
 * resolveAdminTenant — multi-tenant resolution tests (Setup Fix Package PR 2).
 *
 * Locks in: every supported ClientKey resolves to a stable tenantSlug
 * (used by Setup page-view builders + agent context broker) and the
 * canonical display name (shown in the AdminCanonShellV2 top bar).
 */

jest.mock('@/lib/active-client', () => ({
  getActiveClientRow: jest.fn(),
}));

import { resolveAdminTenant } from '../admin-tenant';
import { getActiveClientRow } from '@/lib/active-client';

const mockGetActiveClientRow = getActiveClientRow as jest.Mock;

describe('resolveAdminTenant', () => {
  beforeEach(() => {
    mockGetActiveClientRow.mockReset();
  });

  it.each([
    {
      key: 'apexretail',
      name: 'Apex Retail Group',
      expectedSlug: 'apex-retail',
      expectedName: 'Apex Retail Group',
    },
    {
      key: 'meridian',
      name: 'Meridian Health System',
      expectedSlug: 'meridian',
      expectedName: 'Meridian Health System',
    },
    {
      key: 'arcturus',
      name: 'First Capital Financial',
      expectedSlug: 'first-capital',
      expectedName: 'First Capital Financial',
    },
    {
      key: 'keystone',
      name: 'Keystone Energy Holdings',
      expectedSlug: 'keystone',
      expectedName: 'Keystone Energy Holdings',
    },
  ])(
    'resolves $key → slug=$expectedSlug, name=$expectedName',
    async ({ key, name, expectedSlug, expectedName }) => {
      mockGetActiveClientRow.mockResolvedValue({ id: '1', key, name });
      const tenant = await resolveAdminTenant();
      expect(tenant.clientKey).toBe(key);
      expect(tenant.tenantSlug).toBe(expectedSlug);
      expect(tenant.tenantName).toBe(expectedName);
    },
  );

  it('falls back to apexretail when no active client', async () => {
    mockGetActiveClientRow.mockResolvedValue(null);
    const tenant = await resolveAdminTenant();
    expect(tenant.clientKey).toBe('apexretail');
    expect(tenant.tenantSlug).toBe('apex-retail');
    expect(tenant.tenantName).toBe('Apex Retail Group');
  });

  it('falls back when getActiveClientRow rejects', async () => {
    mockGetActiveClientRow.mockRejectedValue(new Error('clerk session unavailable'));
    const tenant = await resolveAdminTenant();
    expect(tenant.clientKey).toBe('apexretail');
    expect(tenant.tenantSlug).toBe('apex-retail');
  });

  it('arcturus key with legacy "Arcturus Financial" name still maps to canonical "First Capital Financial"', async () => {
    mockGetActiveClientRow.mockResolvedValue({
      id: '2',
      key: 'arcturus',
      name: 'Arcturus Financial',
    });
    const tenant = await resolveAdminTenant();
    expect(tenant.tenantName).toBe('First Capital Financial');
  });
});
