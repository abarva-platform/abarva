# Tenant Isolation Probes · S7

Last updated: 2026-04-24
Owner: Tests-only slice; runs deterministically in CI.

## Purpose

The April 24 2026 crawler caught a Meridian-authenticated user who could
load `/tenant/apex-retail/...` and see full Apex content with an active
APPROVE DECISION button. The data leak was fixed by routing every
tenant-scoped surface through `assertTenantAccess` /
`checkTenantAccess`. S7 codifies the decision logic those guards rely
on as deterministic regression tests so a future refactor cannot
silently re-open the cross-tenant path.

## What this slice covers

The probes live in
[`src/lib/auth/__tests__/tenant-isolation-probes.test.ts`](../../src/lib/auth/__tests__/tenant-isolation-probes.test.ts).
They cover the **pure decision functions** that any cross-tenant access
must pass through. None of these tests require Clerk, Supabase, the
network, or running routes.

### Functions exercised

- `canAccessTenantClient(snapshot, clientKey)` — the access gate
  itself, given a fully built snapshot.
- `tenantKeyForProgramCode(programCode)` — program code → tenant key.
  Backs the `/api/v1/programs/...` style routes that take a code.
- `findTenantByRouteSlug(slug)` — URL slug → tenant seed plan. Backs
  `/tenant/[tenantSlug]/...` routes.
- `inferClientKeyFromEmail(email)` — email → tenant inference.
- `inferSessionRoleFromEmail(email)` and `resolveSessionRole(role,
  email)` — role inference.
- `resolvePinnedSessionClientKey(input)` and
  `resolveSessionClientKey(input)` — pinned-tenant resolution.
- `isLockedTenantRole(role, email)` — which roles are forced to one
  tenant.
- `shouldStripUnauthorizedClientParam(role, input, requestedClientId)`
  — query-string scrub for locked tenants.
- `isClientKey(value)` — tenant key validation.

### Probe scenarios (canonical four tenants)

Tenant matrix used in the tests:

| tenantKey   | routeSlug                  | code prefix | example code |
|-------------|----------------------------|-------------|--------------|
| apexretail  | apex-retail                | APX         | APX-01       |
| meridian    | meridian-health            | MRD         | MRD-01       |
| arcturus    | first-capital-financial    | FCF         | FCF-01       |
| keystone    | keystone-energy            | KST         | KST-01       |

The 10 probe groups in the test file cover:

1. Cross-tenant denial — every pair across the canonical four; pinned
   user, membership user, orphan user, multi-tenant user.
2. Role behavior — admin allowed everywhere; maestro/investor/external
   denied without explicit pin or membership.
3. Slug resolution — canonical slug, tenantKey alias, unknown slug,
   empty slug, partial-substring slug.
4. Program code → tenant key — APX/MRD with case + whitespace handling,
   unknown codes, no cross-binding.
5. Email-based client inference — every demo email family, unknown
   emails return null, no cross-binding.
6. Session role inference — admin/investor/client emails, role override
   wins over email inference, locked-role membership.
7. Pinned client resolution — explicit clientId, fallback to default,
   email fallback, null when nothing resolves.
8. Strip-unauthorized-client — locked role + mismatched
   `?client=` strips, matching does not, admin never strips, no scrub
   when no requested param, no scrub when no pin.
9. `isClientKey` — every canonical key, plus rejection of slugs, null,
   undefined, empty.
10. End-to-end probe walk — mirrors the original April 24 finding:
    Meridian client → /tenant/apex-retail/* denied; Apex client →
    /tenant/meridian-health/* denied; admin reaches all four; unknown
    slug never resolves.

## What this slice does NOT cover

These remain manual or live walks. None are regressions hidden by S7;
they are the layers above the pure decision functions.

- **Live route walk.** A real Meridian Clerk session loading
  `/tenant/apex-retail/programs/...` and getting a 403 with no leaked
  body. Verified manually on 2026-04-24 (Dr. L crawler) and recorded as
  Cycle 2 C2-01 PASS in `CYCLE_STATE.md`.
- **Clerk session claims integration.** `assertTenantAccess` reads
  `auth().sessionClaims.publicMetadata.role` and `clientId`. The
  decision functions assume those values are correctly extracted; an
  integration test would require a live Clerk session.
- **Supabase membership query.** `getCurrentUser` derives
  `accessibleClients` from `client_users` membership rows in Supabase.
  S7 tests the gate that consumes those rows; the row-level RLS check
  itself is verified in production migration tests.
- **API route handlers.** `/api/programs/...` and
  `/api/v1/programs/...` call `checkTenantAccessByKey` /
  `tenantKeyForProgramCode`. Per-route end-to-end tests are deferred
  to a future slice that owns the Supabase client mock infrastructure.
- **403 vs 404 wire-format.** The HTML response shape (`/forbidden.tsx`
  vs `notFound()`) is verified via a live walk, not a probe.

## When to extend these probes

Add a new test in this file when:

- A new tenant is added to `ALL_CLIENTS` in `src/lib/client-config.ts`.
- A new role is introduced in `AppSessionRole`.
- The decision functions in `tenant-access.ts` or `access-routing.ts`
  gain a new branch.
- A new program code prefix is introduced.

Do **not** add tests here that require live Clerk or Supabase. Those
belong in an integration suite with a documented mocking strategy.

## Status

S7 status in `docs/build/build-slices.json` moves to `code_complete`
when:

- `npx tsc --noEmit --pretty false` passes.
- `npx jest src/lib/auth/__tests__/tenant-isolation-probes.test.ts`
  passes.
- `npm run build` passes.

Promotion to `verified` requires an explicit live walk by founder or a
named persona crawler that confirms the cross-tenant 403 in a browser.
