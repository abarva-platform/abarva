// Tenant-access guard · C2-01 regression test
//
// Proves the helper functions in src/lib/auth/tenant-access.ts return the
// right verdict across the crawler-confirmed scenarios:
// - Meridian user on Apex URL → forbidden
// - Apex user on Apex URL → ok
// - Maestro on any URL → ok
// - Unknown programCode → 404-equivalent
// - programCode→tenantKey resolution for every seeded program

import type { CurrentUser } from '@/lib/auth/current-user';

jest.mock('@/lib/auth/current-user', () => {
  const original = jest.requireActual('@/lib/auth/current-user');
  return {
    ...original,
    getCurrentUser: jest.fn(),
  };
});

import { getCurrentUser } from '@/lib/auth/current-user';
import {
  checkTenantAccess,
  checkTenantAccessByKey,
  tenantKeyForProgramCode,
} from '@/lib/auth/tenant-access';

const mockedGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>;

function userFixture(overrides: Partial<CurrentUser> = {}): CurrentUser {
  return {
    personId: 'person-1',
    clerkUserId: 'clerk-1',
    metadataClientKey: null,
    name: 'Test User',
    email: 'test@example.com',
    primaryRole: 'client_viewer',
    accessibleClients: [],
    defaultClientId: null,
    ...overrides,
  };
}

describe('tenant-access guard', () => {
  afterEach(() => {
    mockedGetCurrentUser.mockReset();
  });

  describe('checkTenantAccess', () => {
    test('meridian-bound user hitting apex tenant URL is forbidden', async () => {
      mockedGetCurrentUser.mockResolvedValue(
        userFixture({
          metadataClientKey: 'meridian',
          accessibleClients: [{ clientId: 'meridian', name: 'Meridian Health', role: 'client_viewer' }],
        }),
      );
      const verdict = await checkTenantAccess('apex-retail');
      expect(verdict.ok).toBe(false);
      if (!verdict.ok) expect(verdict.reason).toBe('forbidden');
    });

    test('apex user hitting apex tenant URL is allowed', async () => {
      mockedGetCurrentUser.mockResolvedValue(
        userFixture({
          metadataClientKey: 'apexretail',
          accessibleClients: [{ clientId: 'apexretail', name: 'Apex Retail', role: 'client_viewer' }],
        }),
      );
      const verdict = await checkTenantAccess('apex-retail');
      expect(verdict.ok).toBe(true);
    });

    test('maestro bypasses tenant scoping and reads any tenant', async () => {
      mockedGetCurrentUser.mockResolvedValue(userFixture({ primaryRole: 'maestro' }));
      const apex = await checkTenantAccess('apex-retail');
      const meridian = await checkTenantAccess('meridian-health');
      expect(apex.ok).toBe(true);
      expect(meridian.ok).toBe(true);
    });

    test('unauthenticated caller returns unauthenticated reason', async () => {
      mockedGetCurrentUser.mockResolvedValue(null);
      const verdict = await checkTenantAccess('apex-retail');
      expect(verdict.ok).toBe(false);
      if (!verdict.ok) expect(verdict.reason).toBe('unauthenticated');
    });

    test('nonexistent tenant slug returns tenant_not_found', async () => {
      mockedGetCurrentUser.mockResolvedValue(userFixture());
      const verdict = await checkTenantAccess('nonexistent-tenant');
      expect(verdict.ok).toBe(false);
      if (!verdict.ok) expect(verdict.reason).toBe('tenant_not_found');
    });

    test('metadata clientKey alone grants access when membership table is empty', async () => {
      mockedGetCurrentUser.mockResolvedValue(
        userFixture({
          metadataClientKey: 'apexretail',
          accessibleClients: [],
        }),
      );
      const verdict = await checkTenantAccess('apex-retail');
      expect(verdict.ok).toBe(true);
    });
  });

  describe('checkTenantAccessByKey', () => {
    test('accepts internal clientKey directly for API-route gating', async () => {
      mockedGetCurrentUser.mockResolvedValue(
        userFixture({
          metadataClientKey: 'apexretail',
          accessibleClients: [{ clientId: 'apexretail', name: 'Apex Retail', role: 'client_viewer' }],
        }),
      );
      const verdict = await checkTenantAccessByKey('apexretail');
      expect(verdict.ok).toBe(true);
    });

    test('rejects cross-tenant clientKey for client_viewer', async () => {
      mockedGetCurrentUser.mockResolvedValue(
        userFixture({
          metadataClientKey: 'apexretail',
          accessibleClients: [{ clientId: 'apexretail', name: 'Apex Retail', role: 'client_viewer' }],
        }),
      );
      const verdict = await checkTenantAccessByKey('meridian');
      expect(verdict.ok).toBe(false);
      if (!verdict.ok) expect(verdict.reason).toBe('forbidden');
    });
  });

  describe('tenantKeyForProgramCode', () => {
    test('resolves APX-prefixed codes to apexretail', () => {
      expect(tenantKeyForProgramCode('APX-01')).toBe('apexretail');
    });

    test('resolves MRD-prefixed codes to meridian', () => {
      expect(tenantKeyForProgramCode('MRD-01')).toBe('meridian');
    });

    test('returns null for unknown program codes', () => {
      expect(tenantKeyForProgramCode('NOPE-999')).toBeNull();
      expect(tenantKeyForProgramCode('')).toBeNull();
    });
  });
});
