import { isExternalOnlyRole, resolvePostSignInPath, resolveSessionClientKey } from '@/lib/auth/access-routing';

describe('access-routing', () => {
  test('prefers explicit clientId when it is valid', () => {
    expect(resolveSessionClientKey({ clientId: 'apexretail', defaultClientId: 'meridian' })).toBe('apexretail');
  });

  test('falls back to default client when explicit clientId is missing', () => {
    expect(resolveSessionClientKey({ defaultClientId: 'keystone' })).toBe('keystone');
  });

  test('falls back to global default for invalid values', () => {
    expect(resolveSessionClientKey({ clientId: 'unknown', defaultClientId: 'nope' })).toBe('meridian');
  });

  test('routes investors to investor surface', () => {
    expect(resolvePostSignInPath('investor', { defaultClientId: 'keystone' })).toBe('/investor?client=keystone');
  });

  test('routes admins to tenant home', () => {
    expect(resolvePostSignInPath('admin', { defaultClientId: 'arcturus' })).toBe('/home?client=arcturus');
  });

  test('routes locked client users to their pinned client', () => {
    expect(resolvePostSignInPath('client', { clientId: 'meridian', defaultClientId: 'apexretail' })).toBe('/home?client=meridian');
  });

  test('routes external users to the public surface', () => {
    expect(isExternalOnlyRole('external')).toBe(true);
    expect(resolvePostSignInPath('external', { clientId: 'meridian' })).toBe('/');
  });
});
