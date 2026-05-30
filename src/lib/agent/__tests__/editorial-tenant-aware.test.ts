// PR-B (2026-05-30) — Tenant-aware Steward editorial body.
//
// Locks the production-readiness editorial template to render the
// active tenant's display name (never "Apex Retail" for a non-Apex
// tenant). Spec: docs/build/ADMIN_HOME_FULL_TEST_2026-05-30.md §2
// Layer 5 + §6 F4 + §7.1 (PR-B).

import { buildAgentContext } from '../context-bundle';
import { generateStewardEditorial } from '../editorial';

const CANONICAL_TENANTS: ReadonlyArray<{ slug: string; name: string }> = [
  { slug: 'apex-retail', name: 'Apex Retail' },
  { slug: 'meridian', name: 'Meridian Health System' },
  { slug: 'first-capital', name: 'First Capital Financial' },
  { slug: 'northstar-clinical', name: 'Northstar Clinical Technologies' },
  { slug: 'skyharbor-air', name: 'SkyHarbor Air' },
];

describe('Steward editorial · production-readiness body is tenant-aware', () => {
  it.each(CANONICAL_TENANTS)(
    'renders the right display name for %s and never leaks other canonical tenants',
    ({ slug, name }) => {
      const ctx = buildAgentContext(slug, 'admin', 'production-readiness');
      const editorial = generateStewardEditorial(ctx);

      // The body must include this tenant's display name.
      expect(editorial.body).toContain(`Demo readiness is strong for ${name}`);

      // The body must not include any other canonical tenant's display
      // name. (Apex Retail in particular was the Codex-observed leak.)
      const otherTenants = CANONICAL_TENANTS.filter((t) => t.slug !== slug);
      for (const other of otherTenants) {
        expect(editorial.body).not.toContain(other.name);
      }

      // Production-readiness blockers wording stays stable.
      expect(editorial.body).toContain('Production is blocked by');
      expect(editorial.body).toContain('live audit');
    },
  );

  it('treats an unknown tenant slug as shell_only without leaking Apex', () => {
    const ctx = buildAgentContext(
      'unknown-tenant-xyz',
      'admin',
      'production-readiness',
    );
    const editorial = generateStewardEditorial(ctx);

    expect(editorial.body).not.toContain('Apex Retail');
    expect(editorial.body).not.toContain('Meridian');
    expect(editorial.body).not.toContain('SkyHarbor');
    // Falls through to whatever resolveTenant returns for the slug;
    // verified separately in context-bundle-tenant-resolve.test.ts.
    expect(editorial.body).toContain('Demo readiness is strong for');
  });
});
