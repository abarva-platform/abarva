import {
  inferSourceEventClientKeyFromSlug,
  inferSessionRoleFromEmail,
  isLockedTenantRole,
  isExternalOnlyRole,
  isNewClientSetupEmail,
  resolvePinnedSessionClientKey,
  resolvePostSignInPath,
  resolveSessionClientKey,
  resolveSessionRole,
  shouldDenySourceEventSlugForActiveClient,
  shouldDenySourceEventSlugForPinnedClient,
  shouldStripUnauthorizedClientParam,
} from '@/lib/auth/access-routing';

describe('access-routing', () => {
  test('prefers explicit clientId when it is valid', () => {
    expect(resolveSessionClientKey({ clientId: 'apexretail', defaultClientId: 'meridian' })).toBe('apexretail');
  });

  test('falls back to default client when explicit clientId is missing', () => {
    expect(resolveSessionClientKey({ defaultClientId: 'skyharbor' })).toBe('skyharbor');
  });

  test('falls back to canonical client email domain when client metadata is missing', () => {
    expect(resolveSessionClientKey({ email: 'noah.patel@apex-retail.example.com' })).toBe('apexretail');
    expect(resolveSessionClientKey({ email: 'lena.ortiz@firstcapital.example.com' })).toBe('arcturus');
    expect(resolveSessionClientKey({ email: 'elena.rivera@meridian-health.example.com' })).toBe('meridian');
    expect(resolveSessionClientKey({ email: 'cfo@lakeshore-holdings.example.com' })).toBe('lakeshore');
  });

  test('falls back to global default for invalid values', () => {
    expect(resolveSessionClientKey({ clientId: 'unknown', defaultClientId: 'nope' })).toBe('apexretail');
  });

  test('strict pinned client resolver never falls back to the global default', () => {
    expect(resolvePinnedSessionClientKey({ clientId: 'unknown', defaultClientId: 'nope' })).toBeNull();
    expect(resolvePinnedSessionClientKey({ email: 'noah.patel@apex-retail.example.com' })).toBe('apexretail');
    expect(resolvePinnedSessionClientKey({ email: 'anand.sundaram@thesundaram.com' })).toBeNull();
  });

  test('founder domain does not implicitly resolve to a client workspace', () => {
    expect(resolveSessionClientKey({ email: 'anand.sundaram@thesundaram.com' })).toBe('apexretail');
  });

  test('infers roles for canonical client logins only', () => {
    expect(inferSessionRoleFromEmail('anand+clerk_test@abarva.com')).toBeNull();
    expect(inferSessionRoleFromEmail('anand.sundaram@thesundaram.com')).toBeNull();
    expect(inferSessionRoleFromEmail('investor+clerk_test@abarva.com')).toBeNull();
    expect(inferSessionRoleFromEmail('demo-meridian+clerk_test@abarva.com')).toBeNull();
    expect(inferSessionRoleFromEmail('elena.rivera@meridian-health.example.com')).toBe('client');
    expect(inferSessionRoleFromEmail('cfo@lakeshore-holdings.example.com')).toBe('client');
    expect(resolveSessionRole(undefined, 'noah.patel@apex-retail.example.com')).toBe('client');
  });

  test('does not recognize the retired new-client setup alias', () => {
    expect(isNewClientSetupEmail('demo-new+clerk_test@abarva.com')).toBe(false);
    expect(resolvePostSignInPath(undefined, { email: 'demo-new+clerk_test@abarva.com' })).toBe('/home?client=apexretail');
  });

  test('routes investors to investor surface when Clerk metadata says investor', () => {
    expect(resolvePostSignInPath('investor', { defaultClientId: 'skyharbor' })).toBe('/investor?client=skyharbor');
  });

  test('routes admins to tenant home', () => {
    expect(resolvePostSignInPath('admin', { defaultClientId: 'arcturus' })).toBe('/home?client=arcturus');
  });

  test('routes locked client users to their pinned client', () => {
    expect(resolvePostSignInPath('client', { clientId: 'meridian', defaultClientId: 'apexretail' })).toBe('/home?client=meridian');
    expect(resolvePostSignInPath(undefined, { email: 'noah.patel@apex-retail.example.com' })).toBe('/home?client=apexretail');
  });

  test('recognizes locked tenant roles from role or canonical email domain', () => {
    expect(isLockedTenantRole('client', null)).toBe(true);
    expect(isLockedTenantRole(undefined, 'ethan.brooks@firstcapital.example.com')).toBe(true);
    expect(isLockedTenantRole(undefined, 'cfo@lakeshore-holdings.example.com')).toBe(true);
    expect(isLockedTenantRole(undefined, 'retired-energy-demo@example.com')).toBe(false);
    expect(isLockedTenantRole(undefined, 'anand.sundaram@thesundaram.com')).toBe(false);
  });

  test('strips unauthorized client params for locked sessions', () => {
    expect(
      shouldStripUnauthorizedClientParam(
        undefined,
        { email: 'noah.patel@apex-retail.example.com' },
        'meridian',
      ),
    ).toBe(true);
    expect(
      shouldStripUnauthorizedClientParam(
        undefined,
        { email: 'noah.patel@apex-retail.example.com' },
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
        'client',
        { email: 'anand.sundaram@thesundaram.com', clientId: 'meridian', defaultClientId: 'meridian' },
        'apexretail',
      ),
    ).toBe(true);
  });

  test('infers client ownership from Source event slugs with tenant hints', () => {
    expect(inferSourceEventClientKeyFromSlug('apex-retail-ams-outsourcing-2026')).toBe('apexretail');
    expect(inferSourceEventClientKeyFromSlug('SRC-MER-046')).toBe('meridian');
    expect(inferSourceEventClientKeyFromSlug('skyharbor-air-renewal-2026')).toBe('skyharbor');
    expect(inferSourceEventClientKeyFromSlug('lakeshore-kyriba-rollout-2026')).toBe('lakeshore');
    expect(inferSourceEventClientKeyFromSlug('unknown-source-event')).toBeNull();
  });

  test('denies locked client users when a Source event slug clearly belongs to another client', () => {
    expect(
      shouldDenySourceEventSlugForPinnedClient(
        undefined,
        { email: 'cdio@meridian-health.example.com' },
        'apex-retail-ams-outsourcing-2026',
      ),
    ).toBe(true);

    expect(
      shouldDenySourceEventSlugForPinnedClient(
        undefined,
        { email: 'cio@apex-retail.example.com' },
        'apex-retail-ams-outsourcing-2026',
      ),
    ).toBe(false);

    expect(
      shouldDenySourceEventSlugForPinnedClient(
        'admin',
        { email: 'anand.sundaram@thesundaram.com', defaultClientId: 'meridian' },
        'apex-retail-ams-outsourcing-2026',
      ),
    ).toBe(false);

    expect(
      shouldDenySourceEventSlugForPinnedClient(
        undefined,
        { email: 'cfo@lakeshore-holdings.example.com' },
        'apex-retail-ams-outsourcing-2026',
      ),
    ).toBe(true);

    expect(
      shouldDenySourceEventSlugForPinnedClient(
        undefined,
        { email: 'cfo@lakeshore-holdings.example.com' },
        'lakeshore-kyriba-rollout-2026',
      ),
    ).toBe(false);
  });

  test('denies Source event slugs that conflict with the active client cookie', () => {
    expect(shouldDenySourceEventSlugForActiveClient('meridian', 'apex-retail-ams-outsourcing-2026')).toBe(true);
    expect(shouldDenySourceEventSlugForActiveClient('apexretail', 'apex-retail-ams-outsourcing-2026')).toBe(false);
    expect(shouldDenySourceEventSlugForActiveClient('lakeshore', 'lakeshore-kyriba-rollout-2026')).toBe(false);
    expect(shouldDenySourceEventSlugForActiveClient('meridian', 'lakeshore-kyriba-rollout-2026')).toBe(true);
    expect(shouldDenySourceEventSlugForActiveClient('unknown', 'apex-retail-ams-outsourcing-2026')).toBe(false);
    expect(shouldDenySourceEventSlugForActiveClient('meridian', 'source-event-without-tenant-hint')).toBe(false);
  });

  test('routes external users to the public surface', () => {
    expect(isExternalOnlyRole('external')).toBe(true);
    expect(resolvePostSignInPath('external', { clientId: 'meridian' })).toBe('/');
  });
});
