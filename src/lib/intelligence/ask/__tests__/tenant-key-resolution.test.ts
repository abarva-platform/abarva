import { resolveAskTenantKeyFallback } from '../tenant-key-resolution';

describe('ask tenant key fallback', () => {
  it('maps the app-facing SkyHarbor client key to the loaded inventory key', () => {
    expect(resolveAskTenantKeyFallback('skyharbor', null)).toEqual({
      requestedClientKey: 'skyharbor',
      tenantInventoryKey: 'skyharbor-air',
    });
  });

  it('uses surface clientKey when the body client is absent', () => {
    expect(resolveAskTenantKeyFallback(null, { clientKey: 'skyharbor' })).toEqual({
      requestedClientKey: 'skyharbor',
      tenantInventoryKey: 'skyharbor-air',
    });
  });

  it('does not infer tenant data from display-name-only activeClient text', () => {
    expect(resolveAskTenantKeyFallback(null, { activeClient: 'SkyHarbor Air' })).toEqual({
      requestedClientKey: null,
      tenantInventoryKey: null,
    });
  });
});
