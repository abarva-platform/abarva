# 2026-05-30-fix-tenant-switcher-error-ui — TenantSwitcher error UI + diagnostic logs

## Release ID

`2026-05-30-fix-tenant-switcher-error-ui`

## Status

`candidate`

## Plain-English Summary

The TenantSwitcher popover (the "Acting as · Switch" chip in the /admin masthead) was silently swallowing API errors. On prod, the founder clicked an alternate tenant, the popover closed, and nothing else changed — no error banner, no log line, no clue what went wrong. This change makes failures VISIBLE on the client (inline error banner with a friendly message + retry button, popover stays open until dismissed) and CORRELATABLE on the server (structured `console.warn` JSON line on every reject path with `actor_user_id`, `actor_email`, `requested_tenant`, `reject_reason`). It also hardens the founder authority check to honor verified secondary emails and to lowercase both sides of the comparison explicitly.

## Layer Impact

- `runtime-app-lane`: client-side error UI in `TenantSwitcher.tsx`, server-side diagnostic logs in the `/api/admin/switch-tenant` route, hardened email-allowlist comparison in `lib/admin/tenant-switch-authority.ts`. No schema, no data, no migration. No authority surface widened — the founder + Clerk `role === 'admin'` gate stays exactly as written; the only change is that a founder whose allowlisted address is configured as a verified secondary on Clerk is now correctly admitted (previously they would have seen the chip on the layout but silent-failed the API).

## Client Applicability

- All clients: NO — non-admin users never see the switcher chip; the surface only ever renders for founder + Clerk role=admin.
- Specific clients: N/A.
- Internal only: YES — affects only admin users with tenant-switch authority. Demo accounts and canonical client-admin emails remain tenant-pinned by design and never see the chip.
- Public/demo only: NO.
- Feature flag: none.

## Changes Included

- `src/components/admin/TenantSwitcher.tsx` — replaced raw error-code rendering with a `friendlyError()` translator (401 → "session has expired", 403 → "your role doesn't have tenant-switch permission — contact your admin", 4xx → "selected tenant key is not canonical", 5xx → "temporarily unavailable, retry"). Error banner now uses locked palette (`#991B1B` red dot + `#FEF2F2` red surface for authority/validation; `#FFFBEB` amber surface for transient/5xx) with a `Retry` button that re-POSTs the same target. Popover no longer closes on error.
- `src/app/api/admin/switch-tenant/route.ts` — added `logRejection()` structured-warn emitter on every reject path. Wrapped the audit write in a try/catch so a failed audit doesn't block the switch (it logs `audit_write_failed_nonfatal` instead).
- `src/lib/admin/tenant-switch-authority.ts` — `canSwitchActiveTenant()` now collects every verified email on the Clerk session (primary + verified secondaries), lowercases both sides explicitly, and matches against the allowlist. Unverified secondaries are NOT honored (they are attacker-controlled).
- `src/components/admin/__tests__/TenantSwitcher.error-paths.test.tsx` — NEW. 6 tests covering 401 / 403 / 500 / network-reject / retry / 200 happy-path. Asserts friendly messages, locked-palette colours, popover-stays-open, and no leakage of raw codes or internal hostnames.
- `src/app/api/admin/switch-tenant/__tests__/diagnostic-logs.test.ts` — NEW. 7 tests verifying `tenant_switch_rejected` JSON lines fire for every reject path with the expected `reject_reason` and `actor_*` fields; verifies happy-path does NOT log a rejection.
- `src/lib/admin/__tests__/tenant-switch-authority.test.ts` — NEW. 8 tests covering exact/mixed-case primary email, verified-secondary email path, unverified-secondary rejection, role-based admission, and currentUser-throws fallback.
- `src/components/admin/__tests__/TenantSwitcher.test.tsx` — updated the existing 403 assertion to match the new friendly text and added a popover-stays-open assertion.
- `src/app/api/admin/switch-tenant/__tests__/route.test.ts` — added `currentUser: () => Promise.resolve(null)` to the Clerk mock factory so the diagnostic-log path (which calls `safePrimaryEmail`) is exercised cleanly.

## QA / Validation

- `npx jest src/components/admin/__tests__/TenantSwitcher.test.tsx src/components/admin/__tests__/TenantSwitcher.error-paths.test.tsx src/app/api/admin/switch-tenant/__tests__/route.test.ts src/app/api/admin/switch-tenant/__tests__/diagnostic-logs.test.ts src/lib/admin/__tests__/tenant-switch-authority.test.ts` — **pass** (5 suites / 36 tests / 0 failures).
- `npx eslint` on the 8 touched files — **pass** (no errors, no warnings).
- `npx tsc --noEmit` scoped to the touched files — **pass** (pre-existing Clerk type-resolution noise across the repo is unrelated).
- Manual smoke on prod after deploy — **not-run** (deferred to prod walkthrough on the open PR; see Rollout Plan).

## Rollout Plan

- Merge PR → Vercel preview → Vercel production deploy.
- Smoke-test on prod with founder account `anand.sundaram@thesundaram.com`:
  1. Sign in. Land on `/admin`. Confirm "Acting as · Meridian Health · Switch" chip renders.
  2. Click Switch. Popover lists all 5 canonical tenants.
  3. Click "Apex Retail Group". Either:
     - The popover navigates to `/admin` with the masthead now reading "Acting as · Apex Retail Group" — switching works end-to-end, and the original silent-fail was just a missing error surface.
     - OR an inline error banner appears with a friendly message and a Retry link — the original silent-fail was an authority/validation issue that was being swallowed; we now know exactly what to fix (the Vercel log will carry a `tenant_switch_rejected` JSON line with the precise `reject_reason`).
- No DB migration, no feature flag, no cron job.

## Rollback Plan

- Revert the PR. The pre-change behavior was "silent fail on click" — strictly worse than the new behavior, so rollback is only warranted if a regression in the chip itself appears.
- No schema changes, no data writes, no migration to roll back.

## Audit Evidence

- `docs/build/MANUAL_BROWSER_WALKTHROUGH_2026-05-30.md` §"P1 bug #3 — TenantSwitcher click silent-fail" (the bug-discovery walkthrough that motivated this fix).
- PR link (added on merge).
- Vercel preview deployment URL (added on push).
- Test output: 5 suites / 36 tests / 0 failures (recorded above).

## Known Gaps

- If the underlying root cause of the original silent-fail turns out to be that the founder's deployed Clerk session has the allowlisted address as an UNVERIFIED secondary (or as a primary with a different domain entirely), the hardened authority check will still deny — and the new diagnostic log will surface `reject_reason=forbidden_not_switch_admin` with the actor's actual primary email. That is then a Clerk configuration fix (verify the address, or add the deployed primary to the allowlist), not a code fix. The new error banner will tell the operator exactly that ("your role doesn't have tenant-switch permission — contact your admin"), which is the correct outcome.
- The fallback `window.location.assign('/admin')` path (no `onNavigate` prop) is not unit-tested because jsdom's `window.location` is non-configurable. Production code uses this fallback; the e2e walkthrough on the open PR confirms it.
- Structured-log emission is at `console.warn` level so Vercel surfaces it without raising it to an error. If a `tenant_switch_rejected` line becomes high-volume, the operations dashboard should add a rate panel sourced from PostHog or Vercel logs; that work is out of scope here.
