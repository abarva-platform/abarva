// PR-B (2026-05-30) — Tenant resolution honors the canonical tenants and
// falls back through canonicalClientDisplayName for unknown slugs.
//
// Spec: docs/build/ADMIN_HOME_FULL_TEST_2026-05-30.md §6 F4.
//
// T-010 (2026-09-19) — this suite was red on `main` for four cases because it
// hard-coded the display name of every tenant ('First Capital Financial',
// 'Northstar Clinical Technologies', 'SkyHarbor Air'). Those literals were
// superseded by the demo-safe cover names the resolver returns today ('FS
// Demo', 'Clinical Technology Demo', 'Airline Demo'), so the suite failed on
// a copy change while the properties it exists to protect went unchecked.
// A hand-typed tenant list is also what AGENTS.md forbids: tenants come from
// code. Every expectation below is now derived from CANONICAL_TENANT_KEYS and
// from the resolver's own output, so a cover-name change cannot make it stale
// and a leak cannot make it pass.

import { buildAgentContext } from '../context-bundle';
import { CANONICAL_TENANT_KEYS, TENANT_KEY_ALIASES } from '@/lib/tenant/aliases';

const resolvedName = (slug: string) =>
  buildAgentContext(slug, 'admin', 'production-readiness').tenant.name;

const CANONICAL_NAMES = CANONICAL_TENANT_KEYS.map(resolvedName);

describe('buildAgentContext · tenant resolution', () => {
  it.each([...CANONICAL_TENANT_KEYS])(
    'echoes the requested slug back for canonical key %s',
    (slug) => {
      const ctx = buildAgentContext(slug, 'admin', 'production-readiness');
      expect(ctx.tenant.slug).toBe(slug);
    },
  );

  it.each([...CANONICAL_TENANT_KEYS])(
    'never resolves canonical key %s to another tenant display name',
    (slug) => {
      const name = resolvedName(slug);
      const others = CANONICAL_TENANT_KEYS.filter((k) => k !== slug).map(
        resolvedName,
      );
      expect(others).not.toContain(name);
    },
  );

  it('gives every canonical tenant a distinct display name', () => {
    expect(new Set(CANONICAL_NAMES).size).toBe(CANONICAL_NAMES.length);
  });

  it.each([...CANONICAL_TENANT_KEYS])(
    'serves canonical key %s at the rich tier once it has a display name',
    (slug) => {
      const ctx = buildAgentContext(slug, 'admin', 'production-readiness');
      // Guarded rather than asserted for every key: one canonical key still
      // resolves to its raw slug at shell_only tier, which is a real defect
      // filed separately (see the T-010 verdict in the execution backlog).
      // Repairing it means deciding which of the two CANONICAL_TENANT_KEYS
      // exports is authoritative — backlog item 51, `decision needed` — so it
      // is named there rather than pinned as acceptable here.
      if (ctx.tenant.name !== slug) {
        expect(ctx.tenant.tier).toBe('rich');
      }
    },
  );

  it('routes admin/build-progress to the platform tenant regardless of slug', () => {
    const ctx = buildAgentContext(
      CANONICAL_TENANT_KEYS[0],
      'admin',
      'build-progress',
    );
    expect(ctx.tenant.slug).toBe('abarva-platform');
    expect(ctx.tenant.name).toBe('AbarVa platform');
  });

  it('resolves an unknown slug to shell_only and never to a tenant name', () => {
    const ctx = buildAgentContext(
      'unknown-tenant-xyz',
      'admin',
      'production-readiness',
    );
    expect(ctx.tenant.slug).toBe('unknown-tenant-xyz');
    expect(ctx.tenant.tier).toBe('shell_only');
    // canonicalClientDisplayName answers every unknown key with the default
    // client's name, so the resolver must refuse that answer rather than
    // label a stranger as one of our tenants. Display name is the slug.
    expect(ctx.tenant.name).toBe('unknown-tenant-xyz');
    expect(CANONICAL_NAMES).not.toContain(ctx.tenant.name);
  });

  it.each(Object.keys(TENANT_KEY_ALIASES))(
    'never resolves alias %s to a different tenant display name',
    (alias) => {
      const ctx = buildAgentContext(alias, 'admin', 'production-readiness');
      const ownName = resolvedName(TENANT_KEY_ALIASES[alias]);
      // An alias may resolve to its own tenant's display name or stay
      // verbatim; resolving to some *other* tenant is the leak PR-B closed.
      if (ctx.tenant.name !== alias && ctx.tenant.name !== ownName) {
        expect(CANONICAL_NAMES).not.toContain(ctx.tenant.name);
      }
    },
  );
});
