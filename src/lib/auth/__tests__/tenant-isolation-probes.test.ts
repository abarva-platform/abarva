// S7 · Tenant isolation probes.
//
// Deterministic unit-level coverage for the pure decision functions
// that gate tenant access. The runtime guards `assertTenantAccess` and
// `checkTenantAccess` in src/lib/auth/tenant-access.ts wrap these
// functions plus Clerk + Supabase identity resolution; the identity
// resolution layer is verified in live walks (see
// docs/build/TENANT_ISOLATION_PROBES.md), while every decision a
// would-be cross-tenant user must pass through is exercised here.
//
// No live network. No model calls. No mocks of Clerk or Supabase.

import {
  canAccessTenantClient,
  tenantKeyForProgramCode,
} from '../tenant-access';
import {
  inferSessionRoleFromEmail,
  isLockedTenantRole,
  resolvePinnedSessionClientKey,
  resolveSessionClientKey,
  resolveSessionRole,
  shouldStripUnauthorizedClientParam,
} from '../access-routing';
import {
  ALL_CLIENTS,
  DEFAULT_CLIENT_KEY,
  inferClientKeyFromEmail,
  isClientKey,
  type ClientKey,
} from '@/lib/client-config';
import { findTenantByRouteSlug } from '@/lib/deliverables/seed-route-resolver';

// ----------------------------------------------------------------------
// Snapshot helpers — mirror the shape produced inside tenant-access.ts.
// canAccessTenantClient is exported and accepts this same shape.
// ----------------------------------------------------------------------

type TestSnapshot = Parameters<typeof canAccessTenantClient>[0];

function snapshot(overrides: Partial<TestSnapshot> = {}): TestSnapshot {
  return {
    sessionRole: 'client',
    pinnedClientKey: null,
    membershipClientKeys: [],
    inferredClientKey: null,
    ...overrides,
  };
}

const CANONICAL_TENANTS: ReadonlyArray<{
  tenantKey: ClientKey;
  routeSlug: string;
  programCodePrefix: string;
  exampleProgramCode: string;
}> = [
  {
    tenantKey: 'apexretail',
    routeSlug: 'apex-retail',
    programCodePrefix: 'APX',
    exampleProgramCode: 'APX-01',
  },
  {
    tenantKey: 'meridian',
    routeSlug: 'meridian-health',
    programCodePrefix: 'MRD',
    exampleProgramCode: 'MRD-01',
  },
  {
    tenantKey: 'arcturus',
    routeSlug: 'first-capital-financial',
    programCodePrefix: 'FCF',
    exampleProgramCode: 'FCF-01',
  },
  {
    tenantKey: 'keystone',
    routeSlug: 'keystone-energy',
    programCodePrefix: 'KST',
    exampleProgramCode: 'KST-01',
  },
];

// =====================================================================
// Probe 1 · canAccessTenantClient · cross-tenant access denial
// =====================================================================

describe('Probe 1 · canAccessTenantClient · cross-tenant access denial', () => {
  it('blocks a Meridian-pinned client from reading the Apex Retail tenant', () => {
    const meridianUser = snapshot({
      sessionRole: 'client',
      pinnedClientKey: 'meridian',
      membershipClientKeys: ['meridian'],
    });
    expect(canAccessTenantClient(meridianUser, 'apexretail')).toBe(false);
  });

  it('blocks an Apex-pinned client from reading the Meridian tenant', () => {
    const apexUser = snapshot({
      sessionRole: 'client',
      pinnedClientKey: 'apexretail',
      membershipClientKeys: ['apexretail'],
    });
    expect(canAccessTenantClient(apexUser, 'meridian')).toBe(false);
  });

  it('blocks every cross-tenant pair across the four canonical tenants', () => {
    const tenants: ClientKey[] = ['meridian', 'apexretail', 'arcturus', 'keystone'];
    for (const userTenant of tenants) {
      const user = snapshot({
        sessionRole: 'client',
        pinnedClientKey: userTenant,
        membershipClientKeys: [userTenant],
      });
      for (const targetTenant of tenants) {
        const expected = userTenant === targetTenant;
        expect(canAccessTenantClient(user, targetTenant)).toBe(expected);
      }
    }
  });

  it('allows a client whose membership list contains the target tenant', () => {
    const multiTenantUser = snapshot({
      sessionRole: 'client',
      membershipClientKeys: ['meridian', 'arcturus'],
      pinnedClientKey: null,
    });
    expect(canAccessTenantClient(multiTenantUser, 'meridian')).toBe(true);
    expect(canAccessTenantClient(multiTenantUser, 'arcturus')).toBe(true);
    expect(canAccessTenantClient(multiTenantUser, 'apexretail')).toBe(false);
  });

  it('allows a client pinned to the target tenant when membership list is empty', () => {
    const pinnedOnlyUser = snapshot({
      sessionRole: 'client',
      pinnedClientKey: 'keystone',
      membershipClientKeys: [],
    });
    expect(canAccessTenantClient(pinnedOnlyUser, 'keystone')).toBe(true);
    expect(canAccessTenantClient(pinnedOnlyUser, 'meridian')).toBe(false);
  });

  it('prefers email-inferred tenant when no memberships are present for client users', () => {
    const inferredTenantUser = snapshot({
      sessionRole: 'client',
      pinnedClientKey: 'meridian',
      inferredClientKey: 'apexretail',
      membershipClientKeys: [],
    });
    expect(canAccessTenantClient(inferredTenantUser, 'apexretail')).toBe(true);
    expect(canAccessTenantClient(inferredTenantUser, 'meridian')).toBe(false);
  });

  it('blocks a client with no pinned tenant and no membership', () => {
    const orphanUser = snapshot({
      sessionRole: 'client',
      pinnedClientKey: null,
      membershipClientKeys: [],
    });
    for (const tenant of ['meridian', 'apexretail', 'arcturus', 'keystone'] as ClientKey[]) {
      expect(canAccessTenantClient(orphanUser, tenant)).toBe(false);
    }
  });
});

// =====================================================================
// Probe 2 · canAccessTenantClient · admin / role behavior
// =====================================================================

describe('Probe 2 · canAccessTenantClient · admin role behavior', () => {
  it('allows admin role to access every canonical tenant regardless of pinning', () => {
    const adminUser = snapshot({
      sessionRole: 'admin',
      pinnedClientKey: null,
      membershipClientKeys: [],
    });
    for (const tenant of ['meridian', 'apexretail', 'arcturus', 'keystone'] as ClientKey[]) {
      expect(canAccessTenantClient(adminUser, tenant)).toBe(true);
    }
  });

  it('does not implicitly elevate maestro role to admin', () => {
    const maestroUser = snapshot({
      sessionRole: 'maestro',
      pinnedClientKey: null,
      membershipClientKeys: [],
    });
    // Maestro with no pin and no membership should be denied to avoid
    // accidentally widening the surface; explicit admin is required.
    expect(canAccessTenantClient(maestroUser, 'meridian')).toBe(false);
  });

  it('does not implicitly elevate investor role to admin', () => {
    const investorUser = snapshot({
      sessionRole: 'investor',
      pinnedClientKey: null,
      membershipClientKeys: [],
    });
    expect(canAccessTenantClient(investorUser, 'meridian')).toBe(false);
  });

  it('does not allow unknown/external roles to bypass the gate', () => {
    const externalUser = snapshot({
      sessionRole: 'external',
      pinnedClientKey: null,
      membershipClientKeys: [],
    });
    expect(canAccessTenantClient(externalUser, 'meridian')).toBe(false);
  });
});

// =====================================================================
// Probe 3 · findTenantByRouteSlug · canonical and unknown slugs
// =====================================================================

describe('Probe 3 · findTenantByRouteSlug · slug resolution', () => {
  it('resolves the canonical route slug for every canonical tenant', () => {
    for (const t of CANONICAL_TENANTS) {
      const tenant = findTenantByRouteSlug(t.routeSlug);
      expect(tenant).not.toBeNull();
      expect(tenant?.tenantKey).toBe(t.tenantKey);
    }
  });

  it('also resolves by tenantKey alias (the seed treats key and slug interchangeably)', () => {
    for (const t of CANONICAL_TENANTS) {
      const tenant = findTenantByRouteSlug(t.tenantKey);
      expect(tenant).not.toBeNull();
      expect(tenant?.tenantKey).toBe(t.tenantKey);
    }
  });

  it('returns null for an unknown tenant slug', () => {
    expect(findTenantByRouteSlug('not-a-real-tenant')).toBeNull();
    expect(findTenantByRouteSlug('apex-retial')).toBeNull(); // typo
  });

  it('returns null for an empty slug', () => {
    expect(findTenantByRouteSlug('')).toBeNull();
  });

  it('does not match a partial slug substring', () => {
    expect(findTenantByRouteSlug('apex')).toBeNull();
    expect(findTenantByRouteSlug('meridian-health-typo')).toBeNull();
  });
});

// =====================================================================
// Probe 4 · tenantKeyForProgramCode · seed-driven mapping
// =====================================================================

describe('Probe 4 · tenantKeyForProgramCode · program → tenant key', () => {
  it('maps APX-* program codes to the apexretail tenant key', () => {
    expect(tenantKeyForProgramCode('APX-01')).toBe('apexretail');
    expect(tenantKeyForProgramCode('APX-02')).toBe('apexretail');
  });

  it('maps MRD-* program codes to the meridian tenant key', () => {
    expect(tenantKeyForProgramCode('MRD-01')).toBe('meridian');
    expect(tenantKeyForProgramCode('MRD-02')).toBe('meridian');
  });

  it('is case-insensitive and trims whitespace on the program code', () => {
    expect(tenantKeyForProgramCode(' apx-01 ')).toBe('apexretail');
    expect(tenantKeyForProgramCode('apx-01')).toBe('apexretail');
  });

  it('returns null for an unknown program code', () => {
    expect(tenantKeyForProgramCode('XXX-99')).toBeNull();
    expect(tenantKeyForProgramCode('')).toBeNull();
  });

  it('does not cross-bind APX codes to the meridian tenant', () => {
    expect(tenantKeyForProgramCode('APX-01')).not.toBe('meridian');
  });

  it('does not cross-bind MRD codes to the apexretail tenant', () => {
    expect(tenantKeyForProgramCode('MRD-01')).not.toBe('apexretail');
  });
});

// =====================================================================
// Probe 5 · email-based client inference
// =====================================================================

describe('Probe 5 · inferClientKeyFromEmail', () => {
  it('infers meridian from canonical Meridian demo emails', () => {
    expect(inferClientKeyFromEmail('demo-meridian+clerk_test@abarva.com')).toBe(
      'meridian',
    );
    expect(inferClientKeyFromEmail('mh+clerk_test@abarva.com')).toBe('meridian');
  });

  it('infers apexretail from canonical Apex Retail demo emails', () => {
    expect(inferClientKeyFromEmail('demo-apexretail+clerk_test@abarva.com')).toBe(
      'apexretail',
    );
    expect(inferClientKeyFromEmail('apex+clerk_test@abarva.com')).toBe('apexretail');
  });

  it('infers arcturus from canonical Arcturus and First Capital demo emails', () => {
    expect(inferClientKeyFromEmail('demo-arcturus+clerk_test@abarva.com')).toBe(
      'arcturus',
    );
    expect(inferClientKeyFromEmail('demo-firstcapital+clerk_test@abarva.com')).toBe(
      'arcturus',
    );
    expect(inferClientKeyFromEmail('af+clerk_test@abarva.com')).toBe('arcturus');
  });

  it('infers keystone from canonical Keystone demo emails', () => {
    expect(inferClientKeyFromEmail('demo-keystone+clerk_test@abarva.com')).toBe(
      'keystone',
    );
    expect(inferClientKeyFromEmail('ke+clerk_test@abarva.com')).toBe('keystone');
  });

  it('returns null for unknown emails', () => {
    expect(inferClientKeyFromEmail('someone@example.com')).toBeNull();
    expect(inferClientKeyFromEmail(null)).toBeNull();
    expect(inferClientKeyFromEmail(undefined)).toBeNull();
    expect(inferClientKeyFromEmail('')).toBeNull();
  });

  it('does not cross-bind a Meridian email to a non-Meridian tenant', () => {
    expect(inferClientKeyFromEmail('demo-meridian+clerk_test@abarva.com')).not.toBe(
      'apexretail',
    );
  });
});

// =====================================================================
// Probe 6 · session-role inference
// =====================================================================

describe('Probe 6 · session role inference', () => {
  it('infers admin only for the canonical admin emails', () => {
    expect(inferSessionRoleFromEmail('anand+clerk_test@abarva.com')).toBe('admin');
    expect(inferSessionRoleFromEmail('anand.sundaram@thesundaram.com')).toBe('admin');
  });

  it('infers investor only for the canonical investor email', () => {
    expect(inferSessionRoleFromEmail('investor+clerk_test@abarva.com')).toBe(
      'investor',
    );
  });

  it('infers client for canonical demo client emails', () => {
    expect(inferSessionRoleFromEmail('demo-meridian+clerk_test@abarva.com')).toBe(
      'client',
    );
    expect(inferSessionRoleFromEmail('demo-apexretail+clerk_test@abarva.com')).toBe(
      'client',
    );
  });

  it('returns null for unknown emails', () => {
    expect(inferSessionRoleFromEmail('someone@example.com')).toBeNull();
    expect(inferSessionRoleFromEmail(null)).toBeNull();
  });

  it('resolveSessionRole prefers an explicit role over email inference', () => {
    expect(resolveSessionRole('admin', 'demo-meridian+clerk_test@abarva.com')).toBe(
      'admin',
    );
  });

  it('resolveSessionRole falls back to email when no role is supplied', () => {
    expect(resolveSessionRole(null, 'investor+clerk_test@abarva.com')).toBe(
      'investor',
    );
  });

  it('isLockedTenantRole is true for client and maestro, false for admin/investor/external', () => {
    expect(isLockedTenantRole('client', null)).toBe(true);
    expect(isLockedTenantRole('maestro', null)).toBe(true);
    expect(isLockedTenantRole('admin', null)).toBe(false);
    expect(isLockedTenantRole('investor', null)).toBe(false);
    expect(isLockedTenantRole('external', null)).toBe(false);
  });
});

// =====================================================================
// Probe 7 · pinned client resolution
// =====================================================================

describe('Probe 7 · resolvePinnedSessionClientKey', () => {
  it('returns explicit clientId when it is a known ClientKey', () => {
    expect(resolvePinnedSessionClientKey({ clientId: 'apexretail' })).toBe(
      'apexretail',
    );
  });

  it('falls back to defaultClientId when explicit clientId is invalid', () => {
    expect(
      resolvePinnedSessionClientKey({
        clientId: 'not-a-tenant',
        defaultClientId: 'meridian',
      }),
    ).toBe('meridian');
  });

  it('falls back to email inference when neither clientId nor default is set', () => {
    expect(
      resolvePinnedSessionClientKey({
        email: 'demo-keystone+clerk_test@abarva.com',
      }),
    ).toBe('keystone');
  });

  it('returns null when no signal resolves to a ClientKey', () => {
    expect(resolvePinnedSessionClientKey({ email: 'unknown@example.com' })).toBeNull();
    expect(resolvePinnedSessionClientKey({})).toBeNull();
  });

  it('resolveSessionClientKey falls back to DEFAULT_CLIENT_KEY when no signal resolves', () => {
    expect(resolveSessionClientKey({ email: 'unknown@example.com' })).toBe(
      DEFAULT_CLIENT_KEY,
    );
  });
});

// =====================================================================
// Probe 8 · shouldStripUnauthorizedClientParam
// =====================================================================

describe('Probe 8 · shouldStripUnauthorizedClientParam', () => {
  it('strips when a locked client requests a different tenant via ?client=', () => {
    expect(
      shouldStripUnauthorizedClientParam(
        'client',
        { email: 'demo-meridian+clerk_test@abarva.com' },
        'apexretail',
      ),
    ).toBe(true);
  });

  it('does not strip when the requested tenant matches the pinned tenant', () => {
    expect(
      shouldStripUnauthorizedClientParam(
        'client',
        { email: 'demo-meridian+clerk_test@abarva.com' },
        'meridian',
      ),
    ).toBe(false);
  });

  it('does not strip for admin role (admin can switch tenants freely)', () => {
    expect(
      shouldStripUnauthorizedClientParam(
        'admin',
        { email: 'anand+clerk_test@abarva.com' },
        'apexretail',
      ),
    ).toBe(false);
  });

  it('does not strip when no requested client param is present', () => {
    expect(
      shouldStripUnauthorizedClientParam(
        'client',
        { email: 'demo-meridian+clerk_test@abarva.com' },
        null,
      ),
    ).toBe(false);
  });

  it('does not strip when the locked role has no resolvable pinned tenant', () => {
    expect(
      shouldStripUnauthorizedClientParam(
        'client',
        { email: 'someone@example.com' },
        'meridian',
      ),
    ).toBe(false);
  });
});

// =====================================================================
// Probe 9 · isClientKey · tenant key validation
// =====================================================================

describe('Probe 9 · isClientKey', () => {
  it('accepts every canonical tenant key', () => {
    for (const client of ALL_CLIENTS) {
      expect(isClientKey(client.id)).toBe(true);
    }
  });

  it('rejects unknown strings, null, undefined, and empty', () => {
    expect(isClientKey('not-a-tenant')).toBe(false);
    expect(isClientKey('apex-retail')).toBe(false); // route slug, not a key
    expect(isClientKey(null)).toBe(false);
    expect(isClientKey(undefined)).toBe(false);
    expect(isClientKey('')).toBe(false);
  });
});

// =====================================================================
// Probe 10 · End-to-end probe walk · "URL says X, user is Y" denial
// =====================================================================

describe('Probe 10 · End-to-end probe walk', () => {
  it('mirrors the April 24 finding: Meridian client navigating to /tenant/apex-retail/* is denied', () => {
    // Step 1: route slug resolves to the apexretail tenant.
    const tenant = findTenantByRouteSlug('apex-retail');
    expect(tenant?.tenantKey).toBe('apexretail');

    // Step 2: the user's session resolves as a Meridian client.
    const userEmail = 'demo-meridian+clerk_test@abarva.com';
    const role = resolveSessionRole(null, userEmail);
    expect(role).toBe('client');
    const pinnedKey = resolvePinnedSessionClientKey({ email: userEmail });
    expect(pinnedKey).toBe('meridian');

    // Step 3: the access check denies the cross-tenant URL.
    const allowed = canAccessTenantClient(
      snapshot({
        sessionRole: role,
        pinnedClientKey: pinnedKey,
        membershipClientKeys: ['meridian'],
      }),
      tenant!.tenantKey as ClientKey,
    );
    expect(allowed).toBe(false);
  });

  it('mirrors the inverse: Apex client navigating to /tenant/meridian-health/* is denied', () => {
    const tenant = findTenantByRouteSlug('meridian-health');
    expect(tenant?.tenantKey).toBe('meridian');

    const userEmail = 'demo-apexretail+clerk_test@abarva.com';
    const pinnedKey = resolvePinnedSessionClientKey({ email: userEmail });
    expect(pinnedKey).toBe('apexretail');

    const allowed = canAccessTenantClient(
      snapshot({
        sessionRole: 'client',
        pinnedClientKey: pinnedKey,
        membershipClientKeys: ['apexretail'],
      }),
      tenant!.tenantKey as ClientKey,
    );
    expect(allowed).toBe(false);
  });

  it('admin user can reach any tenant URL', () => {
    for (const t of CANONICAL_TENANTS) {
      const tenant = findTenantByRouteSlug(t.routeSlug);
      expect(tenant).not.toBeNull();
      const allowed = canAccessTenantClient(
        snapshot({
          sessionRole: 'admin',
          pinnedClientKey: null,
          membershipClientKeys: [],
        }),
        tenant!.tenantKey as ClientKey,
      );
      expect(allowed).toBe(true);
    }
  });

  it('unknown tenant slug never resolves, so no access decision is even reached', () => {
    expect(findTenantByRouteSlug('totally-fake-tenant')).toBeNull();
  });
});
