import fs from 'node:fs';
import path from 'node:path';

function read(filePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), filePath), 'utf8');
}

describe('DESROUTE3 admin shell enforcement', () => {
  // ADMIN8 — admin tree consolidated under /admin/*. The legacy
  // /platform/admin{,/production-readiness} pages are thin redirects.
  // Setup Fix Package PR 1 removed AI Initiatives, Build Progress,
  // Architecture, and Reasoning panels (and the legacy
  // /platform/admin/architecture redirect).
  const adminRoute = 'src/app/(maestro)/admin/page.tsx';
  const productionRoute = 'src/app/(maestro)/admin/production-readiness/page.tsx';
  const adminLayout = 'src/app/(maestro)/admin/layout.tsx';
  const adminSidebar = 'src/components/admin/AdminSidebar.tsx';
  const adminShellConfig = 'src/lib/admin/admin-shell-config.ts';

  // Legacy redirect pages (must remain redirect-only, not render shells).
  const legacyAdminRoute = 'src/app/(maestro)/platform/admin/page.tsx';
  const legacyProductionRoute = 'src/app/(maestro)/platform/admin/production-readiness/page.tsx';

  it('admin home renders natively while production keeps the canonical shell', () => {
    const adminSource = read(adminRoute);
    expect(adminSource).toContain('data-admin-home-native');
    expect(adminSource).toContain('AdminCanonShellV2');
    expect(adminSource).toContain('resolveAdminTenant');
    expect(adminSource).not.toContain('iframe');
    expect(adminSource).not.toContain('HomeOverviewV2');

    const productionSource = read(productionRoute);
    expect(productionSource).toContain('AdminCanonShellV2');
  });

  it('active admin route avoids known legacy rail shell import', () => {
    const source = read(adminRoute);
    expect(source).not.toContain('StewardAdminRail');
  });

  it('admin shell exposes the native left menu for browser QA', () => {
    const sidebarSource = read(adminSidebar);
    expect(sidebarSource).toContain('data-admin-sidebar="true"');
    expect(sidebarSource).toContain('ADMIN_SUB_SECTIONS');
    expect(sidebarSource).toContain('Admin workspace');
    expect(sidebarSource).not.toContain('Setup · Admin');
  });

  it('admin left menu stays inside admin-canvas routes', () => {
    const configSource = read(adminShellConfig);
    expect(configSource).not.toContain('id: "training"');
    expect(configSource).not.toContain('href: "/home/learn"');
  });

  it('canonical production readiness route continues to exist', () => {
    expect(fs.existsSync(path.join(process.cwd(), productionRoute))).toBe(true);
  });

  it('legacy /platform/admin/* pages are thin redirects (ADMIN8)', () => {
    [
      { file: legacyAdminRoute, target: "redirect('/admin')" },
      { file: legacyProductionRoute, target: "redirect('/admin/production-readiness')" },
    ].forEach(({ file, target }) => {
      const source = read(file);
      expect(source).toContain(target);
      expect(source).not.toContain('AdminCanonShellV2');
    });
  });

  it('canonical admin layout enforces auth via @clerk/nextjs/server', () => {
    const source = read(adminLayout);
    expect(source).toContain('@clerk/nextjs/server');
    expect(source).not.toContain('next-auth');
  });

  it('allows only the approved demo accounts into Setup for demo walks', () => {
    const source = read(adminLayout);
    expect(source).toContain('"demo-apexretail+clerk_test@abarva.com"');
    expect(source).toContain('"demo-meridian+clerk_test@abarva.com"');
    expect(source).toContain('"demo-firstcapital+clerk_test@abarva.com"');
    expect(source).not.toContain('"retired-energy-demo@example.com"');
    expect(source).not.toContain('"demo-arcturus+clerk_test@abarva.com"');
  });
});
