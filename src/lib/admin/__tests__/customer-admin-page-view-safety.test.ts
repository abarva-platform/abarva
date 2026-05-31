jest.mock('server-only', () => ({}));

jest.mock('../admin-tenant', () => ({
  resolveAdminTenant: jest.fn(),
}));

jest.mock('@/lib/auth/tenancy', () => ({
  requireTenancy: jest.fn(),
}));

jest.mock('@/lib/auth/program-access-policy', () => ({
  loadUserProgramAccessPolicy: jest.fn(),
}));

jest.mock('../data/admin-audit-log-adapter', () => ({
  getAdminAuditEvents: jest.fn(),
}));

jest.mock('../data/admin-users-adapter', () => ({
  getAdminUsers: jest.fn(),
}));

jest.mock('@/lib/data-plane/azureRead', () => ({
  azureRead: {
    select: jest.fn(),
  },
}));

jest.mock('../setup-data-broker', () => ({
  getSetupInventorySnapshot: jest.fn(),
}));

jest.mock('../setup-acts-registry', () => ({
  buildAuthoredInventoryFallback: jest.fn(() => ({ segments: [] })),
  getSetupActsContent: jest.fn(() => ({ segments: [] })),
  mergeInventorySnapshot: jest.fn((_base, snapshot) => snapshot ?? { segments: [] }),
}));

import { buildCustomerAdminPageView } from '../customer-admin-read-model';
import { resolveAdminTenant } from '../admin-tenant';
import { requireTenancy } from '@/lib/auth/tenancy';
import { loadUserProgramAccessPolicy } from '@/lib/auth/program-access-policy';
import { getAdminAuditEvents } from '../data/admin-audit-log-adapter';
import { getAdminUsers } from '../data/admin-users-adapter';
import { azureRead } from '@/lib/data-plane/azureRead';

const tenant = {
  clientId: 'client-apex',
  clientKey: 'apexretail',
  tenantSlug: 'apex-retail',
  tenantName: 'Apex Retail Group',
} as const;

describe('Customer Admin page view safety', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (resolveAdminTenant as jest.Mock).mockResolvedValue(tenant);
  });

  it('does not load tenant admin panels before customer-admin access is granted', async () => {
    (requireTenancy as jest.Mock).mockResolvedValue({ clientId: 'client-apex', userId: 'user-1' });
    (loadUserProgramAccessPolicy as jest.Mock).mockResolvedValue({
      accessLevel: 'program_member',
      canAdminUsers: false,
    });

    const view = await buildCustomerAdminPageView();

    expect(view.access.allowed).toBe(false);
    expect(view.audit.events).toEqual([]);
    expect(view.users.users).toEqual([]);
    expect(view.aiEgress.rows).toEqual([]);
    expect(view.substrate.segments).toEqual([]);
    expect(view.banners.join(' ')).toContain('No tenant admin panels were loaded');
    expect(getAdminAuditEvents).not.toHaveBeenCalled();
    expect(getAdminUsers).not.toHaveBeenCalled();
    expect(azureRead.select).not.toHaveBeenCalled();
  });

  it('returns an empty view on active-tenant and tenancy mismatch', async () => {
    (requireTenancy as jest.Mock).mockResolvedValue({ clientId: 'client-meridian', userId: 'user-1' });

    const view = await buildCustomerAdminPageView();

    expect(view.access.allowed).toBe(false);
    expect(view.clientId).toBeNull();
    expect(view.banners.join(' ')).toContain('does not match the active tenant');
    expect(loadUserProgramAccessPolicy).not.toHaveBeenCalled();
    expect(getAdminAuditEvents).not.toHaveBeenCalled();
    expect(getAdminUsers).not.toHaveBeenCalled();
    expect(azureRead.select).not.toHaveBeenCalled();
  });
});
