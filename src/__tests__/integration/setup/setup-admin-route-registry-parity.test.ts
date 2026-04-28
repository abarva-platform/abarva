import {
  getRouteById,
  getRoutesBySurface,
} from '@/lib/routes/registry';

describe('Setup canonical route registry parity', () => {
  it('registers canonical W6 Setup governance routes under /admin/*', () => {
    const expected = [
      ['admin-policies', '/admin/policies', 'Setup Policies'],
      ['admin-tenant', '/admin/tenant', 'Setup Tenant'],
      ['admin-architecture', '/admin/architecture', 'Admin Architecture'],
    ] as const;

    for (const [routeId, pattern, label] of expected) {
      const route = getRouteById(routeId);
      expect(route).toBeDefined();
      expect(route!.pattern).toBe(pattern);
      expect(route!.label).toBe(label);
      expect(route!.shellKind).toBe('admin');
      expect(route!.surface).toBe('admin');
      expect(route!.primaryAgent).toBe('Steward');
      expect(route!.requiresAuth).toBe(true);
      expect(route!.active).toBe(true);
    }
  });

  it('keeps platform architecture as a legacy redirect bridge, not canonical registry pattern', () => {
    const architecture = getRouteById('admin-architecture');

    expect(architecture?.pattern).toBe('/admin/architecture');
    expect(architecture?.notes).toContain('/platform/admin/architecture');
    expect(getRoutesBySurface('admin').some((route) => route.pattern === '/platform/admin/architecture')).toBe(false);
  });
});
