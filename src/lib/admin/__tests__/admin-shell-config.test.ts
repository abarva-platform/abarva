import { ADMIN_SUB_SECTIONS } from '@/lib/admin/admin-shell-config';

describe('admin shell navigation config', () => {
  it('surfaces the canonical setup/admin workspaces in the sidebar', () => {
    const byId = Object.fromEntries(
      ADMIN_SUB_SECTIONS.map((section) => [section.id, section]),
    );

    expect(byId.overview?.href).toBe('/admin');
    expect(byId['data-loads']?.href).toBe('/admin/setup');
    expect(byId.templates?.href).toBe('/admin/templates');
    expect(byId.connectors?.href).toBe('/admin/connectors');
    expect(byId.outputs?.href).toBe('/admin/outputs');
    expect(byId['users-access']?.href).toBe('/admin/users-access');
  });

  it('keeps setup/admin controls out of the Home route tree', () => {
    const setupAdminIds = new Set([
      'data-loads',
      'templates',
      'connectors',
      'outputs',
      'users-access',
      'customer-admin',
      'production-readiness',
      'compliance',
    ]);

    const setupAdminSections = ADMIN_SUB_SECTIONS.filter((section) =>
      setupAdminIds.has(section.id),
    );

    expect(setupAdminSections).toHaveLength(setupAdminIds.size);
    for (const section of setupAdminSections) {
      expect(section.href).toMatch(/^\/admin(\/|$)/);
      expect(section.href).not.toMatch(/^\/home(\/|$)/);
      expect(section.subtitle).not.toMatch(/cross-tenant|cross tenant/i);
    }
  });
});
