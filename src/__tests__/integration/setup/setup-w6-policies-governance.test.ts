import { readFileSync } from 'fs';
import { join } from 'path';
import { POLICIES_FIXTURE } from '@/lib/setup/shell-setup-fixture';
import { TENANT_FIXTURE } from '@/lib/setup/shell-setup-tenant-fixture';

describe('Setup W6 policies and tenant governance lock', () => {
  it('keeps canonical policies and tenant routes wired to Setup pages', () => {
    const policiesRoute = readWorkspaceFile('src/app/(maestro)/admin/policies/page.tsx');
    const tenantRoute = readWorkspaceFile('src/app/(maestro)/admin/tenant/page.tsx');

    expect(policiesRoute).toContain("import { SetupPoliciesPage }");
    expect(policiesRoute).toContain('return <SetupPoliciesPage />');
    expect(tenantRoute).toContain("import { SetupTenantPage }");
    expect(tenantRoute).toContain('return <SetupTenantPage />');
  });

  it('keeps architecture platform route as a redirect-only legacy bridge', () => {
    const platformArchitectureRoute = readWorkspaceFile(
      'src/app/(maestro)/platform/admin/architecture/page.tsx',
    );

    expect(platformArchitectureRoute).toContain("redirect('/admin/architecture')");
    expect(platformArchitectureRoute).not.toContain('SetupArchitecturePage');
    expect(platformArchitectureRoute).not.toContain('AppShell');
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
