// PR-B (2026-05-30) — Tenant resolution honors canonical 5 tenants and
// falls back through canonicalClientDisplayName for unknown slugs.
//
// Spec: docs/build/ADMIN_HOME_FULL_TEST_2026-05-30.md §6 F4.

import { buildAgentContext } from '../context-bundle';

describe('buildAgentContext · tenant resolution', () => {
  it.each([
    ['apex-retail', 'Apex Retail', 'rich'],
    ['meridian', 'Meridian Health System', 'rich'],
    ['first-capital', 'First Capital Financial', 'rich'],
    ['northstar-clinical', 'Northstar Clinical Technologies', 'rich'],
    ['skyharbor-air', 'SkyHarbor Air', 'rich'],
  ])(
    'resolves canonical slug %s to display name "%s" and tier "%s"',
    (slug, expectedName, expectedTier) => {
      const ctx = buildAgentContext(slug, 'admin', 'production-readiness');
      expect(ctx.tenant.slug).toBe(slug);
      expect(ctx.tenant.name).toBe(expectedName);
      expect(ctx.tenant.tier).toBe(expectedTier);
    },
  );

  it('routes admin/build-progress to the platform tenant regardless of slug', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'build-progress');
    expect(ctx.tenant.slug).toBe('abarva-platform');
    expect(ctx.tenant.name).toBe('AbarVa platform');
  });

  it('resolves unknown slug to shell_only tier', () => {
    const ctx = buildAgentContext(
      'unknown-tenant-xyz',
      'admin',
      'production-readiness',
    );
    expect(ctx.tenant.slug).toBe('unknown-tenant-xyz');
    expect(ctx.tenant.tier).toBe('shell_only');
    // No canonical mapping → display name is the slug verbatim.
    expect(ctx.tenant.name).toBe('unknown-tenant-xyz');
  });

  it('maps a known canonical alias (firstcapital) to canonical display name on the fallback path', () => {
    // 'firstcapital' (no dash) is not in TENANT_CONTEXT_BY_SLUG but is
    // recognized by canonicalClientDisplayName. The fallback branch must
    // surface the canonical display name so ContextBar never shows the
    // raw lowercase slug.
    const ctx = buildAgentContext(
      'firstcapital',
      'admin',
      'production-readiness',
    );
    expect(ctx.tenant.tier).toBe('shell_only');
    expect(ctx.tenant.name).toBe('First Capital Financial');
  });
});
