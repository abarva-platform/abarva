import { HOME_PANELS } from '../panel-inventory';

describe('HOME_PANELS', () => {
  it('routes setup/admin panels to Admin instead of legacy Home setup paths', () => {
    const byId = Object.fromEntries(HOME_PANELS.map((panel) => [panel.id, panel]));

    expect(byId.configuration?.route).toBe('/admin/setup');
    expect(byId.connectors?.route).toBe('/admin/connectors');
    expect(byId['data-trust']?.route).toBe('/admin/data-trust');
    expect(byId['agent-readiness']?.route).toBe('/admin/agent-readiness');
    expect(byId['tenant-profile']?.route).toBe('/admin/tenant');

    for (const id of [
      'configuration',
      'connectors',
      'data-trust',
      'agent-readiness',
      'tenant-profile',
    ]) {
      expect(byId[id]?.route).not.toMatch(/^\/home\//);
    }
  });
});
