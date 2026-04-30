// OV2-2d-RBAC · tenant-roles.ts unit tests
//
// Coverage:
//   • getUserTenantRole
//       - returns 'tenant_admin' when publicMetadata.tenantRoles[key] = 'tenant_admin'
//       - returns 'sponsor' / 'sme' / 'viewer' when explicitly assigned
//       - returns 'tenant_admin' for a platform-admin user (role === 'admin')
//         on any tenantKey that lacks an explicit assignment
//       - returns 'tenant_admin' for an allowlisted email on any tenantKey
//       - returns null when no role and not platform admin
//       - returns null when Clerk user id mismatches the requested userId
//       - returns null when unauthenticated
//   • requireTenantAdmin
//       - resolves for explicit tenant_admin assignment
//       - resolves for platform admin
//       - throws TenantRoleError(401, 'unauthenticated') when no Clerk user
//       - throws TenantRoleError(403, 'forbidden_tenant_admin_required')
//         when authenticated but lacking the role
//       - throws TenantRoleError(403, ...) on userId mismatch (no
//         silent approval)
//
// The Clerk `currentUser()` boundary is mocked at the module level.

const mockCurrentUser = jest.fn();

jest.mock('@clerk/nextjs/server', () => ({
  currentUser: () => mockCurrentUser(),
}));

import {
  TenantRoleError,
  getUserTenantRole,
  requireTenantAdmin,
} from '../tenant-roles';

interface ClerkUserShape {
  id: string;
  publicMetadata?: {
    role?: string;
    legacyRole?: string;
    tenantRoles?: unknown;
  };
  unsafeMetadata?: {
    role?: string;
  };
  primaryEmailAddress?: { emailAddress: string } | null;
}

function makeUser(overrides: Partial<ClerkUserShape> = {}): ClerkUserShape {
  return {
    id: 'user_123',
    publicMetadata: {},
    unsafeMetadata: {},
    primaryEmailAddress: { emailAddress: 'sponsor@apex.example' },
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getUserTenantRole', () => {
  it("returns 'tenant_admin' when metadata sets tenantRoles[tenantKey]", async () => {
    mockCurrentUser.mockResolvedValue(
      makeUser({
        publicMetadata: {
          tenantRoles: { 'apex-retail': 'tenant_admin' },
        },
      }),
    );
    await expect(
      getUserTenantRole({ userId: 'user_123', tenantKey: 'apex-retail' }),
    ).resolves.toBe('tenant_admin');
  });

  it.each(['sponsor', 'sme', 'viewer'] as const)(
    "returns '%s' when explicitly assigned",
    async (role) => {
      mockCurrentUser.mockResolvedValue(
        makeUser({
          publicMetadata: {
            tenantRoles: { 'apex-retail': role },
          },
        }),
      );
      await expect(
        getUserTenantRole({ userId: 'user_123', tenantKey: 'apex-retail' }),
      ).resolves.toBe(role);
    },
  );

  it("returns 'tenant_admin' for a platform-admin user on any tenantKey", async () => {
    mockCurrentUser.mockResolvedValue(
      makeUser({
        publicMetadata: { role: 'admin' },
      }),
    );
    await expect(
      getUserTenantRole({ userId: 'user_123', tenantKey: 'apex-retail' }),
    ).resolves.toBe('tenant_admin');
    await expect(
      getUserTenantRole({ userId: 'user_123', tenantKey: 'meridian' }),
    ).resolves.toBe('tenant_admin');
  });

  it("returns 'tenant_admin' for an allowlisted email on any tenantKey", async () => {
    mockCurrentUser.mockResolvedValue(
      makeUser({
        primaryEmailAddress: {
          emailAddress: 'anand.sundaram@thesundaram.com',
        },
      }),
    );
    await expect(
      getUserTenantRole({ userId: 'user_123', tenantKey: 'apex-retail' }),
    ).resolves.toBe('tenant_admin');
  });

  it('returns null when no role assigned and not a platform admin', async () => {
    mockCurrentUser.mockResolvedValue(makeUser());
    await expect(
      getUserTenantRole({ userId: 'user_123', tenantKey: 'apex-retail' }),
    ).resolves.toBeNull();
  });

  it('returns null when no role assigned for the requested tenant (other tenants assigned)', async () => {
    mockCurrentUser.mockResolvedValue(
      makeUser({
        publicMetadata: {
          tenantRoles: { meridian: 'tenant_admin' },
        },
      }),
    );
    await expect(
      getUserTenantRole({ userId: 'user_123', tenantKey: 'apex-retail' }),
    ).resolves.toBeNull();
  });

  it('returns null when the Clerk user id does not match the requested userId', async () => {
    mockCurrentUser.mockResolvedValue(
      makeUser({
        publicMetadata: { role: 'admin' },
      }),
    );
    await expect(
      getUserTenantRole({ userId: 'someone_else', tenantKey: 'apex-retail' }),
    ).resolves.toBeNull();
  });

  it('returns null when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);
    await expect(
      getUserTenantRole({ userId: 'user_123', tenantKey: 'apex-retail' }),
    ).resolves.toBeNull();
  });

  it('ignores malformed tenantRoles values', async () => {
    mockCurrentUser.mockResolvedValue(
      makeUser({
        publicMetadata: {
          // arrays / strings / unknown values must not be treated as roles
          tenantRoles: ['tenant_admin'] as unknown,
        },
      }),
    );
    await expect(
      getUserTenantRole({ userId: 'user_123', tenantKey: 'apex-retail' }),
    ).resolves.toBeNull();
  });

  it('ignores unknown role strings in tenantRoles', async () => {
    mockCurrentUser.mockResolvedValue(
      makeUser({
        publicMetadata: {
          tenantRoles: { 'apex-retail': 'super_user' },
        },
      }),
    );
    await expect(
      getUserTenantRole({ userId: 'user_123', tenantKey: 'apex-retail' }),
    ).resolves.toBeNull();
  });
});

describe('requireTenantAdmin', () => {
  it('resolves when tenantRoles[tenantKey] === tenant_admin', async () => {
    mockCurrentUser.mockResolvedValue(
      makeUser({
        publicMetadata: {
          tenantRoles: { 'apex-retail': 'tenant_admin' },
        },
      }),
    );
    await expect(
      requireTenantAdmin({ userId: 'user_123', tenantKey: 'apex-retail' }),
    ).resolves.toBeUndefined();
  });

  it('resolves for a platform admin (publicMetadata.role === admin)', async () => {
    mockCurrentUser.mockResolvedValue(
      makeUser({ publicMetadata: { role: 'admin' } }),
    );
    await expect(
      requireTenantAdmin({ userId: 'user_123', tenantKey: 'apex-retail' }),
    ).resolves.toBeUndefined();
  });

  it('resolves for an allowlisted email even without admin role', async () => {
    mockCurrentUser.mockResolvedValue(
      makeUser({
        primaryEmailAddress: {
          emailAddress: 'anand.sundaram@thesundaram.com',
        },
      }),
    );
    await expect(
      requireTenantAdmin({ userId: 'user_123', tenantKey: 'meridian' }),
    ).resolves.toBeUndefined();
  });

  it('throws TenantRoleError(401, unauthenticated) when no Clerk session', async () => {
    mockCurrentUser.mockResolvedValue(null);
    await expect(
      requireTenantAdmin({ userId: 'user_123', tenantKey: 'apex-retail' }),
    ).rejects.toMatchObject({
      name: 'TenantRoleError',
      status: 401,
      code: 'unauthenticated',
    });
  });

  it('throws TenantRoleError(403, forbidden_tenant_admin_required) when role is sponsor', async () => {
    mockCurrentUser.mockResolvedValue(
      makeUser({
        publicMetadata: {
          tenantRoles: { 'apex-retail': 'sponsor' },
        },
      }),
    );
    await expect(
      requireTenantAdmin({ userId: 'user_123', tenantKey: 'apex-retail' }),
    ).rejects.toMatchObject({
      name: 'TenantRoleError',
      status: 403,
      code: 'forbidden_tenant_admin_required',
    });
  });

  it('throws 403 when authenticated but no role assigned and not a platform admin', async () => {
    mockCurrentUser.mockResolvedValue(makeUser());
    await expect(
      requireTenantAdmin({ userId: 'user_123', tenantKey: 'apex-retail' }),
    ).rejects.toBeInstanceOf(TenantRoleError);
  });

  it('throws 403 on userId mismatch even when caller is otherwise platform admin', async () => {
    mockCurrentUser.mockResolvedValue(
      makeUser({ publicMetadata: { role: 'admin' } }),
    );
    await expect(
      requireTenantAdmin({ userId: 'someone_else', tenantKey: 'apex-retail' }),
    ).rejects.toMatchObject({
      status: 403,
      code: 'forbidden_tenant_admin_required',
    });
  });
});
