# 2026-05-30-pr-g-apex-leak-regression-gate — PR-G · Apex-leak regression gate (F8 + F9)

## Release ID

`2026-05-30-pr-g-apex-leak-regression-gate`

## Status

`candidate`

## Plain-English Summary

Locks the gate behind the 6-layer Apex tenant leak that PR-A through PR-E
eliminated. Two artifacts:

1. **Jest hygiene scanner** (`src/__tests__/hygiene/no-apex-literal-leak.test.ts`)
   walks `src/app/(maestro)/admin`, `src/components/admin`, and
   `src/components/setup`, and fails CI if any file mentions the Apex tenant
   literal (display name, slug variants, or the CDP product reference) outside
   an explicit allow-list. The allow-list only covers tests; production
   admin/setup surfaces must be tenant-neutral.
2. **Playwright e2e walker** (`tests/e2e/admin-tenant-isolation.spec.ts`) for
   each of the 4 non-Apex canonical tenants (Meridian, First Capital,
   Northstar, Skyharbor) signs in as the tenant's CXO admin, walks the
   canonical 18 admin routes, and asserts the rendered DOM carries no Apex
   literal. Skips cleanly when Clerk/Supabase env is absent; never blocks CI
   on its own.

Running the hygiene scanner against the post-PR-E tree surfaced 4 residual
leaks (`/admin` overview fallback, `/admin/segments/[segmentId]` fallback,
"Authorizing as Apex Retail Group admin" hard-coded UI string in
`ConnectorReconnectPage`, and an `AppShell topBar.tenantName` literal in the
dead `SetupConnectorsPage` left over from the legacy 5-tab SubNavStrip era).
This PR fixes them: the two page-level fallbacks now resolve via
`resolveAdminTenant()` (the PR-A helper that throws into `/admin/error.tsx`
when no active tenant is resolved), the reconnect-page string now flows
through a new `tenantName` prop wired from the server page wrapper, and the
dead `SetupConnectorsPage` is deleted (an existing hygiene test already
documented it as "removed").

## Layer Impact

- `qa-validation-lane`: adds a Jest hygiene scanner and a Playwright e2e
  walker. Both target the admin/setup surfaces; the scanner runs in the
  default Jest suite, the e2e walker is wired to `npm run test:e2e`.
- `global-control-lane`: removes the last four `?? 'apex-retail' /
  ?? 'apexretail'` fallbacks from `/admin` overview, the per-segment
  detail page, and the connector-reconnect editorial string. Closes the
  PR-A..E elimination arc.

## Client Applicability

- All clients: yes (defensive — removes residual Apex defaults that could
  surface for any non-Apex tenant)
- Specific clients: n/a
- Internal only: regression gate is internal CI; no client-visible change.
- Public/demo only: n/a
- Feature flag: none

## Changes Included

- `src/__tests__/hygiene/no-apex-literal-leak.test.ts` (new) — Jest hygiene
  scanner with allow-list discipline.
- `tests/e2e/admin-tenant-isolation.spec.ts` (new) — Playwright walker for
  4 non-Apex tenants × 18 admin routes (72 generated tests).
- `src/app/(maestro)/admin/page.tsx` — switch tenant resolution from
  `getActiveClientRow() ?? 'Apex Retail Group'` to `resolveAdminTenant()`.
- `src/app/(maestro)/admin/segments/[segmentId]/page.tsx` — same swap for
  the per-segment detail route.
- `src/components/setup/ConnectorReconnectPage.tsx` — accept a
  `tenantName` prop instead of hard-coding "Apex Retail Group admin".
- `src/app/(maestro)/admin/connectors/[connectorId]/reconnect/page.tsx`
  — pass `tenant.tenantName` through to `ConnectorReconnectPage`.
- `src/components/setup/SetupConnectorsPage.tsx` — deleted (dead since
  Wave 1 PR-3; already documented as "removed" in
  `src/__tests__/hygiene/shell-v2-mode-layout.test.ts`).
- `docs/releases/records/2026-05-30-pr-g-apex-leak-regression-gate.md` (this
  release record).

## QA / Validation

- `npx jest src/__tests__/hygiene/no-apex-literal-leak.test.ts` — **PASS**
  (1 suite, 1 test). Confirms zero Apex literals across the admin + setup
  surfaces after the four residual leaks were fixed.
- `npx jest src/lib/admin/__tests__/admin-tenant.test.ts` — **PASS** (11
  tests). Confirms the `resolveAdminTenant()` helper used by the PR-G
  fixes still behaves correctly.
- `npx jest src/app/__maestro_/admin/__tests__/layout-access.test.ts` —
  **PASS** (3 tests). Confirms admin layout access logic unaffected.
- `npx playwright test tests/e2e/admin-tenant-isolation.spec.ts --list` —
  enumerates 72 generated tests (4 tenants × 18 routes). Full execution
  requires real Clerk + Supabase env (CLERK_SESSION_TOKEN /
  CLERK_SECRET_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  and is skipped when those are absent.
- `npx eslint` (changed files) — clean.
- `npx tsc --noEmit` — clean for changed files (pre-existing
  `@azure/*` / `pptxgenjs` / `@resvg` errors are workflow artifacts noted
  in user memory; unrelated to this PR).
- Pre-existing hygiene failures (`canonical-paths.test.ts` and
  `shell-v2-mode-layout.test.ts`) exist on `origin/main` prior to this PR
  and are unrelated to the leak gate.

## Rollout Plan

Merge to `main`. Vercel deploys automatically. Jest hygiene scanner runs
on every PR / push (no config change needed — it lives under
`src/__tests__/`). Playwright e2e walker runs only via `npm run test:e2e`
and remains optional in default CI because it needs real Clerk/Supabase
env to execute.

## Rollback Plan

Revert the PR. The hygiene test and the e2e spec are pure-additive; the
four leak fixes touch self-contained surfaces (admin overview page,
per-segment detail page, reconnect page wrapper + prop, dead-code
deletion). No migration, no data change.

## Audit Evidence

- Mission spec: `docs/build/ADMIN_HOME_FULL_TEST_2026-05-30.md` §6 F8 + F9
  (not present in this worktree; referenced as the source of truth for
  the regression-gate requirement).
- PR-A..E precedent: PR #2590, #2591, #2592, #2593, #2594 (the prior
  layers of the Apex-leak elimination).
- Hygiene scanner run: see `npx jest
  src/__tests__/hygiene/no-apex-literal-leak.test.ts` — output captured
  in PR description.
- Playwright enumeration: see `npx playwright test
  tests/e2e/admin-tenant-isolation.spec.ts --list` — 72 tests.

## Known Gaps

- The Playwright e2e walker is configured to skip when Clerk / Supabase
  env is unavailable. It does NOT fail CI on its own — the Jest hygiene
  scanner is the always-on guard. Enabling the e2e walker in default CI
  requires provisioning the CXO personas for Northstar and Skyharbor (per
  `scripts/provision-cxo-personas.ts`) and adding the env to the CI
  secrets store. Until then the walker remains a manual gate run before
  pilot onboarding.
- The Jest scanner pattern is intentionally broad (case-insensitive,
  matches any of the four leak literals). A future leak that uses a
  different spelling (e.g. "Apex-Retail Holdings") would not trip. If a
  new variant appears it must be added to `LEAK_PATTERN`.
