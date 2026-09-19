// Admin Steward editorial · tenant isolation across the alias surface.
//
// T-010 (2026-09-19) — this suite was red for the same reason as
// editorial-tenant-aware.test.ts (a hard-coded display name asserted before
// the leak check), and once both are derived from code it duplicated that
// suite outright: same generator, same three of the same tenants. It is
// repointed rather than deleted, at the half the other suite does not cover.
//
// Canonical keys are not the only slugs that reach this surface — a request
// can carry any historical alias, and canonicalClientDisplayName answers an
// unrecognised key with the DEFAULT client's name. So the alias table is
// where a cross-tenant label would actually appear.

import { buildAgentContext } from '../context-bundle';
import { generateStewardEditorial } from '../editorial';
import { CANONICAL_TENANT_KEYS, TENANT_KEY_ALIASES } from '@/lib/tenant/aliases';
import { ALL_CLIENTS } from '@/lib/client-config';

const contextFor = (slug: string) =>
  buildAgentContext(slug, 'admin', 'production-readiness');

const CANONICAL_NAMES = CANONICAL_TENANT_KEYS.map(
  (slug) => contextFor(slug).tenant.name,
);

// Both vocabularies count: the bundle's label and the client registry's, the
// latter being what the silent default would print for an unknown key.
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

describe('admin Steward editorial tenant isolation', () => {
  it.each(Object.keys(TENANT_KEY_ALIASES))(
    'renders production readiness copy for alias %s without naming another tenant',
    (alias) => {
      const ctx = contextFor(alias);
      const editorial = generateStewardEditorial(ctx);
      const ownName = contextFor(TENANT_KEY_ALIASES[alias]).tenant.name;

      expect(editorial.body).toContain(
        `Demo readiness is strong for ${ctx.tenant.name}`,
      );

      for (const other of TENANT_LABELS.filter((label) =>
        namesAnotherTenant(label, ctx.tenant.name, ownName),
      )) {
        expect(editorial.body).not.toContain(other);
      }
    },
  );
});
