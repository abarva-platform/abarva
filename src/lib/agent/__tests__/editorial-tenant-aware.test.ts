// PR-B (2026-05-30) — Tenant-aware Steward editorial body.
//
// Locks the production-readiness editorial template to render the active
// tenant's display name, never another tenant's. Spec:
// docs/build/ADMIN_HOME_FULL_TEST_2026-05-30.md §2 Layer 5 + §6 F4 + §7.1.
//
// T-010 (2026-09-19) — three of the five cases were red on `main`, and the
// reason matters more than the redness: each case asserted a hand-typed
// display name FIRST and the no-leak property second, so when the resolver
// moved to demo-safe cover names the display-name assertion threw and the
// leak check — the only reason this suite exists — stopped executing for
// those tenants entirely. The tenant list and every expected name are now
// derived from CANONICAL_TENANT_KEYS and from the resolver, per AGENTS.md
// (tenants come from code, never a hand-typed list), so a copy change cannot
// take the leak check offline again.

import { buildAgentContext } from '../context-bundle';
import { generateStewardEditorial } from '../editorial';
import { CANONICAL_TENANT_KEYS } from '@/lib/tenant/aliases';
import { ALL_CLIENTS } from '@/lib/client-config';

const contextFor = (slug: string) =>
  buildAgentContext(slug, 'admin', 'production-readiness');

const CANONICAL_NAMES = CANONICAL_TENANT_KEYS.map(
  (slug) => contextFor(slug).tenant.name,
);

// The context bundle and the client registry do not agree on every label
// (the bundle says 'Apex Retail' where the registry says 'Retail Demo'), and
// the registry's name is the one a silent-default leak would print. Both
// vocabularies therefore count as a tenant name for isolation purposes.
const TENANT_LABELS = [
  ...new Set([...CANONICAL_NAMES, ...ALL_CLIENTS.map((client) => client.name)]),
];


// A label that overlaps this tenant's own name is this tenant's label, not a
// leak: the registry calls the health tenant 'Meridian Health' where the
// bundle calls it 'Meridian Health System'. Only disjoint labels are other
// tenants' names.
const namesAnotherTenant = (label: string, ...own: string[]) =>
  !own.some(
    (name) => name.includes(label) || label.includes(name),
  );

describe('Steward editorial · production-readiness body is tenant-aware', () => {
  it.each([...CANONICAL_TENANT_KEYS])(
    'names the resolved tenant %s and never leaks another canonical tenant',
    (slug) => {
      const ctx = contextFor(slug);
      const editorial = generateStewardEditorial(ctx);

      expect(editorial.body).toContain(
        `Demo readiness is strong for ${ctx.tenant.name}`,
      );

      for (const other of TENANT_LABELS.filter((label) =>
        namesAnotherTenant(label, ctx.tenant.name),
      )) {
        expect(editorial.body).not.toContain(other);
      }

      expect(editorial.body).toContain('Production is blocked by');
      expect(editorial.body).toContain('live audit');
    },
  );

  it('treats an unknown tenant slug as shell_only without naming any tenant', () => {
    const ctx = buildAgentContext(
      'unknown-tenant-xyz',
      'admin',
      'production-readiness',
    );
    const editorial = generateStewardEditorial(ctx);

    // canonicalClientDisplayName answers ANY unrecognised key with the
    // default client's registry name, so the body naming a stranger after
    // one of our tenants is the failure this case exists for.
    for (const label of TENANT_LABELS) {
      expect(editorial.body).not.toContain(label);
    }
    expect(editorial.body).toContain(
      'Demo readiness is strong for unknown-tenant-xyz',
    );
  });
});
