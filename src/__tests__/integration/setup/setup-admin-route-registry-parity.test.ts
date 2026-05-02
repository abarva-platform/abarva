import {
  getRouteById,
  getRoutesBySurface,
} from '@/lib/routes/registry';
import fs from 'node:fs';
import path from 'node:path';

describe('Setup canonical route registry parity', () => {
  it('registers /admin as the canonical Setup operator entry', () => {
    const route = getRouteById('admin-index');

    expect(route).toBeDefined();
    expect(route!.pattern).toBe('/admin');
    expect(route!.label).toBe('Admin Portal');
    expect(route!.shellKind).toBe('admin');
    expect(route!.surface).toBe('admin');
    expect(route!.primaryAgent).toBe('Steward');
    expect(route!.requiresAuth).toBe(true);
    expect(route!.active).toBe(true);
    expect(route!.notes).toContain('/platform/admin');
  });

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

  it('registers canonical connector, users, invite, and audit Setup routes under /admin/*', () => {
    const expected = [
      ['admin-connectors', '/admin/connectors', 'Setup Connectors'],
      ['admin-connector-detail', '/admin/connectors/[connectorId]', 'Setup Connector Detail'],
      ['admin-connector-reconnect', '/admin/connectors/[connectorId]/reconnect', 'Setup Connector Reconnect'],
      ['admin-users', '/admin/users', 'Setup Users'],
      ['admin-users-access', '/admin/users-access', 'Setup Users Access'],
      ['admin-invite', '/admin/invite', 'Setup Invite User'],
      ['admin-audit', '/admin/audit', 'Setup Audit Log'],
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

  it('does not add legacy platform Setup routes as canonical connector/users/audit patterns', () => {
    const adminRoutes = getRoutesBySurface('admin').map((route) => route.pattern);

    expect(adminRoutes).not.toContain('/platform/admin');
    expect(adminRoutes).not.toContain('/platform/admin/connectors');
    expect(adminRoutes).not.toContain('/platform/admin/users');
    expect(adminRoutes).not.toContain('/platform/admin/audit');
  });

  it('keeps /setup as a thin compatibility bridge to the canonical /admin setup control plane', () => {
    const setupPageSource = fs.readFileSync(
      path.join(process.cwd(), 'src/app/setup/page.tsx'),
      'utf8',
    );
    const proxySource = fs.readFileSync(
      path.join(process.cwd(), 'src/proxy.ts'),
      'utf8',
    );

    expect(setupPageSource).toContain("redirect('/admin')");
    expect(setupPageSource).not.toContain('AdminCanonShellV2');
    expect(proxySource).toContain("request.nextUrl.pathname === '/setup'");
    expect(proxySource).toContain("request.nextUrl.pathname.startsWith('/setup/')");
    expect(proxySource).toContain("NextResponse.redirect(new URL('/admin', request.url))");
  });
});
