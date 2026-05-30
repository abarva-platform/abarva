# 2026-05-30-setup-tenant-switcher — Tenant switcher chip on /admin masthead (Wave 2 PR-5)

## Release ID

`2026-05-30-setup-tenant-switcher`

## Status

`candidate`

## Plain-English Summary

Founder and platform-admin users can now flip the active tenant in view from a single inline chip in the `/admin` masthead — no more sign-out / sign-in to look at a second tenant during a multi-tenant incident response. The chip reads "Acting as <Tenant> · Switch". Clicking it opens a small dropdown with the 5 canonical tenants (Apex Retail, Meridian Health, First Capital, Northstar Clinical, SkyHarbor Air); selecting one POSTs to `/api/admin/switch-tenant`, sets the `abarva_active_client` cookie, and reloads `/admin` with the new tenant in view.

Authority is gated server-side. Non-admin sessions see a static "Acting as <Tenant>" label in the same DOM slot and never see the switch affordance. The three locked demo accounts (`demo-apexretail`, `demo-meridian`, `demo-firstcapital`) and the canonical client-admin emails (`cio@apex-retail.example.com`, etc.) are tenant-pinned by design and are explicitly NOT permitted to switch — they can still reach `/admin` but the chip never renders.

Every successful switch lands in `admin_audit_log` (`category='auth'`, `action='tenant_switched'`) with `actor_user_id` and the from/to canonical keys in metadata, so the Wave 2 PR-2 Isolation lane can surface "User X switched tenant A → B at HH:MM." A structured-log line is emitted on every switch as a second audit channel — failures of the DB write never block the user-visible action.

Per the audit verdict (`SETUP_AUDIT_2026-05-30_VERDICT.md` §5.6 Zone A; §7 Wave 2 PR 5), this is required-for-pilot infrastructure: without it, an admin investigating tenant A has to log out / log in or open a private window to look at tenant B.

## Layer Impact

- `runtime-app-lane`: New client component `TenantSwitcher.tsx` (chip + popover + fetch). New route `POST /api/admin/switch-tenant` with auth + canonical-key validation + cookie write + audit. New server helper `tenant-switch-authority.ts` (mirrors `/admin` route gate; restricted to founder + Clerk `role === 'admin'`). New server helper `tenant-switch-audit.ts` (writes `admin_audit_log` row, fixture-safe). Masthead in `HomeOverviewV2.tsx` extended with three optional props (`canSwitchTenant`, `currentCanonicalTenantKey`, `tenantSwitchOptions`); `(maestro)/admin/page.tsx` resolves authority server-side and passes them in.
- `architecture-lane`: No new broker. The route handler reads the auth/authority pair via existing helpers (`@clerk/nextjs/server` + `canSwitchActiveTenant`), validates against the canonical alias table, and writes through the existing `azureRead` (lookup) + `getAzureWriteFluentClient` (insert) seams. The client component never reads from Supabase directly — it goes through the API route.
- `qa-validation-lane`: 3 new test suites · 18 new tests. Component, API route, and masthead smoke each have their own file. Broker-boundary guard (`broker-boundary.test.ts`) passes; tsc clean; ESLint clean over every touched file.
- `data-plane-lane`: No schema change. The `admin_audit_log` table already exists from `20260426120500_admin_audit_log.sql`. The audit write is fixture-safe — in `ADMIN_DATA_MODE=fixture` (default in test + local) the row is not written and the structured-log channel carries the signal.

## Client Applicability

- All clients: The 5 canonical tenants are hardcoded — the same set the rest of the app already enforces (`CANONICAL_TENANT_KEYS` in `src/lib/tenant/aliases.ts`). Only platform-admin users see the chip on any tenant.
- Specific clients: None.
- Internal only: Effectively yes — the affordance only renders for the founder allowlist (`anand.sundaram@thesundaram.com`) and Clerk-metadata `role === 'admin'` users.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/admin/TenantSwitcher.tsx` (new) — client component; chip + popover; locked palette only (mono eyebrow, DM Sans body); POSTs canonical key only.
- `src/lib/admin/tenant-switch-authority.ts` (new) — server-side authority + canonical option provider; mirrors the `/admin` layout gate but stricter (excludes the demo + client-admin allowlists that are tenant-pinned by design).
- `src/lib/admin/tenant-switch-audit.ts` (new) — `admin_audit_log` writer; fixture-mode safe; resolves canonical key → `clients.id` for the FK; never throws into the route handler.
- `src/app/api/admin/switch-tenant/route.ts` (new) — POST handler; 401 / 403 / 400 / 200 contract; cookie + audit write; structured-log channel.
- `src/components/home/HomeOverviewV2.tsx` (modified) — three optional props (`canSwitchTenant`, `currentCanonicalTenantKey`, `tenantSwitchOptions`); inline render at the h1 baseline; static label fallback preserves DOM position for non-admin snapshots.
- `src/app/(maestro)/admin/page.tsx` (modified) — resolves authority + canonical option list server-side and threads them into `HomeOverviewV2`.
- `src/lib/active-client.ts` (modified) — docstring extended to document the preference precedence the switcher now relies on (cookie wins for non-locked roles after explicit `requestedClient`).
- `src/components/admin/__tests__/TenantSwitcher.test.tsx` (new) — 6 tests.
- `src/app/api/admin/switch-tenant/__tests__/route.test.ts` (new) — 9 tests.
- `src/components/home/__tests__/HomeOverviewV2.tenant-switcher.test.tsx` (new) — 3 tests.

## QA / Validation

- PASS: `npx jest src/components/admin/__tests__/TenantSwitcher.test.tsx` — 6/6.
- PASS: `npx jest src/app/api/admin/switch-tenant/__tests__/route.test.ts` — 9/9.
- PASS: `npx jest src/components/home/__tests__/HomeOverviewV2.tenant-switcher.test.tsx` — 3/3.
- PASS: `npx jest src/components/home/__tests__` — 11/11 (existing connector-cta + dom-order suites still green).
- PASS: `npx jest src/lib/admin/__tests__/broker-boundary.test.ts` — 2/2.
- PASS: `npx tsc --noEmit` — clean.
- PASS: `npx eslint` over every touched file — clean.

## Rollout Plan

Merge to main after CI passes. No migration. No feature flag. No deploy gate. The chip renders only when the server resolves the founder/admin posture; everything degrades to the existing static label otherwise. Cookie scope is the `/admin` surface only — non-admin reads of the cookie route through the same `resolveTenant.ts` precedence (still gated by `isLockedTenantRole`).

## Rollback Plan

Revert the PR. The masthead change is additive (the three new props are optional; default behavior is the static label). The new route is a leaf POST handler with no downstream callers other than the chip — removing the file drops the affordance back to "static label, no switch." The cookie name and shape match the existing `ACTIVE_CLIENT_COOKIE` already read by `resolveTenant.ts`, so any cookies written before rollback continue to resolve correctly via the existing resolver.

## Audit Evidence

- Audit verdict driving this work: `docs/build/SETUP_AUDIT_2026-05-30_VERDICT.md` §5.6 Zone A ("single inline switcher chip … for founder/admin multi-tenant"); §7 Wave 2 PR 5 ("Tenant switcher chip. Inline masthead chip — founder/admin can switch tenant from inside Setup. Required for incident response.").
- Canonical tenant list source of truth: `src/lib/tenant/aliases.ts` → `CANONICAL_TENANT_KEYS`. The route handler hard-validates against this via `isCanonicalTenantKey` from `src/lib/admin/tenant-switch-authority.ts`.
- Audit trail: every successful POST writes one row to `admin_audit_log` (category=`auth`, action=`tenant_switched`, metadata = `{ actor_user_id, from_canonical_key, to_canonical_key }`) and emits a structured-log line on the server.
- TenantSwitcher component: `src/components/admin/TenantSwitcher.tsx`.
- Switch API route: `src/app/api/admin/switch-tenant/route.ts`.

## Known Gaps

- The `admin_audit_log` write is fixture-mode-safe (skipped when `ADMIN_DATA_MODE=fixture`). Pilot deploys must run with `ADMIN_DATA_MODE=live` for the DB rows to land. The structured-log line is always emitted regardless.
- The chip currently navigates via `window.location.assign('/admin')` after a successful POST. A future revision could use a router refresh to avoid the full reload, but the reload is the safer posture today because it forces every downstream Setup data fetch to re-resolve through the new cookie.
- The "from" canonical key is resolved from the incoming cookie. When a user has never switched before, `from` is null in the audit row — that's intentional and matches the actual posture.
- The 5-tenant list is in two places (`ALL_CLIENTS` in `client-config.ts` and the alias table). The authority helper composes them at runtime so they remain consistent; if a sixth tenant is ever added, only `ALL_CLIENTS` + the alias table need to change.
