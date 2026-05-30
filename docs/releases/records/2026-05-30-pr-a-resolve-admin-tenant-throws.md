# 2026-05-30-pr-a-resolve-admin-tenant-throws — resolveAdminTenant throws on unresolved (PR-A · P0 Apex-leak)

## Release ID

`2026-05-30-pr-a-resolve-admin-tenant-throws`

## Status

`candidate`

## Plain-English Summary

The master Apex fallback inside `resolveAdminTenant()` has been removed.
Previously, any time the admin / Setup surface failed to resolve the active
tenant — DB error, missing client row, unknown key, missing slug mapping,
missing canonical name — the function silently routed the user into an
Apex-branded shell. That single function was the master switch for ~17
known Apex-content leak paths on Setup pages for SkyHarbor, Meridian,
First Capital, and Northstar tenants.

After this change, every unresolved-tenant branch throws a typed
`AdminTenantUnresolvedError`. A new `/admin/error.tsx` boundary catches
that error and renders an explicit "no active tenant" recovery panel
with Try-again / Sign-in / Switch-tenant actions, using the locked
design system. Non-tenant errors are rethrown to the parent
`(maestro)/error.tsx`.

This is fail-loud by design: we never auto-pick a tenant for the user.

## Layer Impact

- `runtime-app-lane` (security): changes the runtime resolution behavior
  for every Setup / Admin page in `src/app/(maestro)/admin/*`. Pages will
  now render the new error panel instead of Apex-content fallback when
  Clerk → Supabase tenant resolution fails post-auth.
- `qa-validation-lane`: unit tests rewritten to lock the new contract;
  added negative-path coverage for every throw branch.

## Client Applicability

- All clients: positive change — prevents cross-tenant Apex content leak
  on auth hiccups. No client-specific opt-in or feature flag.
- Specific clients: none isolated.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/admin/admin-tenant.ts`
  - Remove `FALLBACK_CLIENT_KEY` and `FALLBACK_TENANT_NAME` constants.
  - Add exported `class AdminTenantUnresolvedError extends Error`.
  - Rewrite `resolveAdminTenant()` to throw on every unresolved branch
    (DB error → wrap; null row → throw; bad key → throw; missing slug →
    throw; null canonical name → throw).
- `src/app/(maestro)/admin/error.tsx` (new)
  - Next.js 16 error boundary. Catches `AdminTenantUnresolvedError` and
    renders `UnresolvedTenantPanel`. Rethrows other errors to the parent
    `(maestro)/error.tsx`.
- `src/lib/admin/__tests__/admin-tenant.test.ts`
  - Removed the two "falls back to apexretail" assertions.
  - Added 6 new assertions covering every throw branch + error-name
    invariant.
- `docs/releases/records/2026-05-30-pr-a-resolve-admin-tenant-throws.md`
  - This release record.

## QA / Validation

- PASS `npx jest src/lib/admin/__tests__/admin-tenant.test.ts` — 11/11
  tests pass (1 happy-path + 1 legacy-name + 6 throw paths + 3 enum
  cases via `it.each`).
- PASS `npx jest src/app/(maestro)/admin/ src/lib/admin/` — 423/424 tests
  pass; the one failure (`users-access-sso.test.ts › Configure SSO
  action is now safe and links to docs`) is pre-existing and unrelated
  (asserts `status === 'safe'` but receives `'hard_gated'`).
- PASS `npx eslint src/lib/admin/admin-tenant.ts
  src/lib/admin/__tests__/admin-tenant.test.ts
  src/app/(maestro)/admin/error.tsx` — clean.
- PASS `npx tsc --noEmit` — clean.
- PASS `npm run test:behaviors` — 85/90 pass; 5 failures all in
  `tenant-onboarding.test.ts` (pre-existing `CLIENT_KEY_TO_DB_SLUGS`
  record not found in `add-tenant.ts`), unrelated to this change.

## Rollout Plan

Merge to `main` → Vercel production deploy is automatic.
No DB migration. No feature flag. No runbook.

## Rollback Plan

Revert the PR. Single squashed commit, isolated to admin-tenant +
error.tsx + test + release record. No data plane changes.

Revert restores the silent-Apex-fallback master switch, so rollback is
only appropriate if the new error panel itself causes a regression
(e.g. infinite reset loop on a downstream tenant). The four leaked
demo paths remain present under the prior fallback.

## Audit Evidence

- Source spec: `docs/build/ADMIN_HOME_FULL_TEST_2026-05-30.md` §2 Layer
  1 (master switch identification) + §6 F1 (failure mode F1: silent
  Apex fallback) + §7.2 (PR-A diff spec).
- PR: (filled in on creation).
- CI run: linked from PR.
- Test output: see QA / Validation above.

## Known Gaps

- The `/admin/error.tsx` panel renders a generic "no active tenant"
  state. It does not yet show the actual tenant picker UI inline;
  the "Switch tenant" CTA links to `/admin/customer` (the canonical
  tenant-switcher surface).
- The "Switch tenant" link is shown to all visitors of `/admin`
  (which is already admin-gated at the layout level). A future
  refinement could hide it for non-platform admins.
- The 16 remaining specific Apex-content leak paths identified in
  ADMIN_HOME_FULL_TEST_2026-05-30.md §3+ are deliberately out of
  scope for PR-A. They will land in follow-up PRs (PR-B onward).
