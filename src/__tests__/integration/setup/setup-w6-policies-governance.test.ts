import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { POLICIES_FIXTURE } from '@/lib/setup/shell-setup-fixture';
import { TENANT_FIXTURE } from '@/lib/setup/shell-setup-tenant-fixture';
import { RETIRED_ADMIN_ROUTE_REDIRECTS } from '@/proxy';

describe('Setup W6 policies and tenant governance lock', () => {
  // Wave 1 PR-3 (2026-05-30) updated this assertion per
  // SETUP_AUDIT_2026-05-30_VERDICT §5.5: /admin/policies is rewrapped in
  // AdminCanonShellV2 (no SubNavStrip); /admin/tenant is demoted to a
  // tab inside /admin Overview (the standalone route is deleted, and
  // src/proxy.ts 301-redirects the old URL).
  it('wraps the canonical policies route in AdminCanonShellV2', () => {
    const policiesRoute = readWorkspaceFile('src/app/(maestro)/admin/policies/page.tsx');

    expect(policiesRoute).toContain("import { SetupPoliciesPage }");
    expect(policiesRoute).toContain('AdminCanonShellV2');
    expect(policiesRoute).toContain('<SetupPoliciesPage />');
  });

  it('retains the retired /admin/tenant redirect while /admin hosts the Maestro home', () => {
    const tenantRouteAbsent = !existsSync(
      join(process.cwd(), 'src/app/(maestro)/admin/tenant/page.tsx'),
    );
    expect(tenantRouteAbsent).toBe(true);

    // 2026-09-19 (T-035) · `data-admin-home-native` and `AdminCanonShellV2` were
    // both stale: /admin was rebuilt as a server component that renders through
    // AppShell with the setup surface. The marker attribute went with the old
    // markup. What the case is protecting is unchanged — /admin is a real page
    // that resolves its own tenant, not an iframe and not a tab wrapper around a
    // retired route — so that is what is asserted.
    const adminRoute = readWorkspaceFile('src/app/(maestro)/admin/page.tsx');
    expect(adminRoute).toContain('AppShell');
    expect(adminRoute).toContain('surface="setup"');
    expect(adminRoute).toContain('resolveAdminTenant');
    expect(adminRoute).not.toContain('AdminOverviewTabs');
    expect(adminRoute).not.toContain('AdminTenantTab');
    expect(adminRoute).not.toContain('iframe');

    // 2026-09-19 (T-035) · These two lines used to read src/proxy.ts as text and
    // match `'/admin/tenant'` and `'/admin?tab=tenant'` with single quotes. Both
    // were wrong by then: the file is double-quoted, and the 2026-06-14
    // Admin/Setup sunset retargeted the redirect from the tenant tab onto
    // `/admin` itself. A string match on a source file fails on a quote change
    // and passes on a behavior change. Assert the redirect map instead.
    expect(Object.keys(RETIRED_ADMIN_ROUTE_REDIRECTS)).toContain('/admin/tenant');
    expect(RETIRED_ADMIN_ROUTE_REDIRECTS['/admin/tenant']).toBe('/admin');
  });

  it('keeps architecture platform route as a redirect-only legacy bridge', () => {
    const platformArchitecturePath = 'src/app/(maestro)/platform/admin/architecture/page.tsx';
    const platformArchitectureAbsent = !existsSync(join(process.cwd(), platformArchitecturePath));

    expect(platformArchitectureAbsent).toBe(true);
  });

  it('locks the seeded policy governance posture', () => {
    expect(POLICIES_FIXTURE).toHaveLength(5);
    expect(POLICIES_FIXTURE.filter((policy) => policy.status === 'active')).toHaveLength(3);
    expect(POLICIES_FIXTURE.filter((policy) => policy.status === 'review-due')).toHaveLength(1);
    expect(POLICIES_FIXTURE.filter((policy) => policy.status === 'draft')).toHaveLength(1);

    for (const policy of POLICIES_FIXTURE) {
      expect(['data', 'access', 'compliance', 'ai']).toContain(policy.category);
      expect(['active', 'review-due', 'draft']).toContain(policy.status);
      expect(policy.owner.trim().length).toBeGreaterThan(0);
      expect(policy.nextReview.trim().length).toBeGreaterThan(0);
    }
  });

  it('keeps the Apex tenant locked as an Enterprise governance profile', () => {
    expect(TENANT_FIXTURE.name).toBe('Apex Retail Group');
    expect(TENANT_FIXTURE.slug).toBe('apex-retail');
    expect(TENANT_FIXTURE.tier).toBe('Enterprise');
    expect(TENANT_FIXTURE.status).toBe('locked');
    expect(TENANT_FIXTURE.ssoProvider).toBe('Okta');
    expect(TENANT_FIXTURE.dataResidency).toBe('US-East-1 (AWS)');
  });

  it('keeps W6 scoped away from new connector classes and live governance persistence', () => {
    const plan = readWorkspaceFile('docs/build/setup/WAVE-W6-PLAN.md');

    expect(plan).toContain('no new connector classes expected');
    expect(plan).toContain('should stay deterministic until backed');
    expect(plan).toContain('policies, tenant, governance architecture');
    expect(plan).not.toMatch(/migration/i);
  });
});

function readWorkspaceFile(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), 'utf8');
}
