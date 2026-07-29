import { readProxySessionIdentity } from '@/proxy';

describe('proxy session identity fallback', () => {
  it('uses Clerk user publicMetadata when the session token omits publicMetadata', () => {
    const identity = readProxySessionIdentity(
      { sub: 'user_123' },
      {
        publicMetadata: {
          role: 'client',
          clientId: 'meridian',
          defaultClientId: 'meridian',
          foundationTenant: true,
          proofLogin: true,
          foundationTenantKey: 'airline-demo-new',
          tenantKey: 'airline-demo-new',
        },
        primaryEmailAddress: { emailAddress: 'operator@example.com' },
      },
    );

    expect(identity.metadata).toEqual({
      role: 'client',
      clientId: 'meridian',
      defaultClientId: 'meridian',
      foundationTenant: true,
      proofLogin: true,
      foundationTenantKey: 'airline-demo-new',
      tenantKey: 'airline-demo-new',
    });
    expect(identity.email).toBe('operator@example.com');
    expect(identity.source).toBe('clerk_user_fallback');
  });

  it('keeps session claim metadata authoritative and fills only missing fields from Clerk', () => {
    const identity = readProxySessionIdentity(
      {
        emailAddress: 'claims@example.com',
        publicMetadata: {
          role: 'admin',
          clientId: 'skyharbor',
        },
      },
      {
        publicMetadata: {
          role: 'client',
          clientId: 'meridian',
          defaultClientId: 'skyharbor',
        },
        primaryEmailAddress: { emailAddress: 'clerk@example.com' },
      },
    );

    expect(identity.metadata).toEqual({
      role: 'admin',
      clientId: 'skyharbor',
      defaultClientId: 'skyharbor',
    });
    expect(identity.email).toBe('claims@example.com');
  });
});
