import {
  inferSessionRoleFromEmail,
  isLockedTenantRole,
  isExternalOnlyRole,
  isNewClientSetupEmail,
  resolvePinnedSessionClientKey,
  resolvePostSignInPath,
  resolveSessionClientKey,
  resolveSessionRole,
  shouldStripUnauthorizedClientParam,
} from '@/lib/auth/access-routing';

describe('access-routing', () => {
  test('prefers explicit clientId when it is valid', () => {
    expect(resolveSessionClientKey({ clientId: 'apexretail', defaultClientId: 'meridian' })).toBe('apexretail');
  });

  test('falls back to default client when explicit clientId is missing', () => {
    expect(resolveSessionClientKey({ defaultClientId: 'keystone' })).toBe('keystone');
  });

  test('falls back to email alias when client metadata is missing', () => {
    expect(resolveSessionClientKey({ email: 'demo-apexretail+clerk_test@abarva.com' })).toBe('apexretail');
    expect(resolveSessionClientKey({ email: 'demo-firstcapital+clerk_test@abarva.com' })).toBe('arcturus');
    expect(resolveSessionClientKey({ email: 'demo-nexora+clerk_test@abarva.com' })).toBe('keystone');
  });

  test('falls back to global default for invalid values', () => {
    expect(resolveSessionClientKey({ clientId: 'unknown', defaultClientId: 'nope' })).toBe('meridian');
  });

  test('strict pinned client resolver never falls back to the global default', () => {
    expect(resolvePinnedSessionClientKey({ clientId: 'unknown', defaultClientId: 'nope' })).toBeNull();
    expect(resolvePinnedSessionClientKey({ email: 'demo-apexretail+clerk_test@abarva.com' })).toBe('apexretail');
  });

  test('infers roles for legacy demo logins', () => {
    expect(inferSessionRoleFromEmail('anand+clerk_test@abarva.com')).toBe('admin');
    expect(inferSessionRoleFromEmail('investor+clerk_test@abarva.com')).toBe('investor');
    expect(inferSessionRoleFromEmail('demo-meridian+clerk_test@abarva.com')).toBe('client');
    expect(resolveSessionRole(undefined, 'demo-apexretail+clerk_test@abarva.com')).toBe('client');
  });

  test('recognizes the new client setup alias', () => {
    expect(isNewClientSetupEmail('demo-new+clerk_test@abarva.com')).toBe(true);
    expect(resolvePostSignInPath(undefined, { email: 'demo-new+clerk_test@abarva.com' })).toBe('/tower/onboard');
  });

  test('routes investors to investor surface', () => {
    expect(resolvePostSignInPath('investor', { defaultClientId: 'keystone' })).toBe('/investor?client=keystone');
  });

  test('routes admins to tenant home', () => {
    expect(resolvePostSignInPath('admin', { defaultClientId: 'arcturus' })).toBe('/home?client=arcturus');
  });

  test('routes locked client users to their pinned client', () => {
    expect(resolvePostSignInPath('client', { clientId: 'meridian', defaultClientId: 'apexretail' })).toBe('/home?client=meridian');
    expect(resolvePostSignInPath(undefined, { email: 'demo-apexretail+clerk_test@abarva.com' })).toBe('/home?client=apexretail');
  });

  test('recognizes locked tenant roles from role or email alias', () => {
    expect(isLockedTenantRole('client', null)).toBe(true);
    expect(isLockedTenantRole(undefined, 'demo-keystone+clerk_test@abarva.com')).toBe(true);
    expect(isLockedTenantRole('admin', 'anand+clerk_test@abarva.com')).toBe(false);
  });

  test('strips unauthorized client params for locked sessions', () => {
    expect(
      shouldStripUnauthorizedClientParam(
        undefined,
        { email: 'demo-apexretail+clerk_test@abarva.com' },
        'meridian',
      ),
    ).toBe(true);
    expect(
      shouldStripUnauthorizedClientParam(
        undefined,
        { email: 'demo-apexretail+clerk_test@abarva.com' },
        'apexretail',
      ),
    ).toBe(false);
    expect(
      shouldStripUnauthorizedClientParam(
        'client',
        { email: null, clientId: null, defaultClientId: null },
        'apexretail',
      ),
    ).toBe(false);
    expect(
      shouldStripUnauthorizedClientParam(
        'admin',
        { email: 'anand+clerk_test@abarva.com', defaultClientId: 'meridian' },
        'apexretail',
      ),
    ).toBe(false);
  });

  test('routes external users to the public surface', () => {
    expect(isExternalOnlyRole('external')).toBe(true);
    expect(resolvePostSignInPath('external', { clientId: 'meridian' })).toBe('/');
  });
});
