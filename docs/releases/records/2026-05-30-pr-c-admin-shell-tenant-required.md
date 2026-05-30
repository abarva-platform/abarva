# Release Record: 2026-05-30-pr-c-admin-shell-tenant-required

## Release ID
`2026-05-30-pr-c-admin-shell-tenant-required`

## Status
`candidate`

## Lane
`global-control-lane` (security correctness across every tenant)

## Plain-English Summary
`AdminCanonShellV2.tenantName` is now a **required** prop. The previous
default value `'Apex Retail Group'` caused LEAK-B: any page that rendered
the canonical admin shell without explicitly threading a tenant name
silently displayed "Apex Retail Group" in the masthead — regardless of
which client was logged in.

This PR:

1. Removes the `'Apex Retail Group'` default in
   `src/components/admin/AdminCanonShellV2.tsx` and makes the prop
   required at the TypeScript type level.
2. Fixes every page caller that was relying on the leaked default:
   - `/admin/cross-program-signals` — now threads the active client's
     display name (already computed locally).
   - `/admin/depth-scorecard` — now calls `resolveAdminTenant()` and
     passes `tenant.tenantName`.
   - `/admin/programs/approvals` (both shells: empty-state + main) — the
     empty-state shell uses the neutral literal `"AbarVa Admin"`; the
     main shell uses the resolved tenant display name.
   - `/admin/programs/approvals/[requestId]` — threads the resolved
     tenant name.
   - `/admin/layout` (unauthorized shell) — uses the neutral literal
     `"AbarVa Admin"` so the access-denied page never claims to belong
     to Apex.
   - `/admin/inbox` — replaced the optional `client?.name ?? undefined`
     pattern with `resolveAdminTenant().tenantName` so the prop is
     always a real string.
3. Also fixes 8 collateral callers (the same code path) that were not in
   the original spec but would have broken the build once the prop became
   required: 7 `/docs/reasoning/*` doc pages and 1
   `/engineering/traces` page. Those surfaces are not tenant-scoped, so
   they pass explicit neutral literals (`"AbarVa Docs"`,
   `"AbarVa Engineering"`) — chosen at the call site, never as a
   component default.
4. Adds a hygiene test
   (`src/components/admin/__tests__/admin-shell-tenant-required.test.ts`)
   that scans every `*.tsx` under `src/app/` and fails (with file:line)
   for any `<AdminCanonShellV2 ...>` opening tag that does not include a
   `tenantName=` attribute. TypeScript's required-prop check is the
   primary gate; this test catches the failure mode of someone
   reintroducing a default value or bypassing the type with
   `@ts-ignore`.

## Layer Impact
- **runtime-app-lane (security):** App-tier UI; no schema, RLS, broker,
  vector, or data-plane change. No new dependencies.

## Client Applicability
All clients (apexretail, meridian, arcturus, northstar, skyharbor). The
leak previously affected every non-Apex tenant on the 6 named admin
routes — they all saw "Apex Retail Group" in the masthead.

## Changes Included
- `src/components/admin/AdminCanonShellV2.tsx` — prop made required;
  default removed; JSDoc updated to document the rationale and the
  recommended `resolveAdminTenant()` flow.
- `src/components/admin/__tests__/AdminCanonShellV2.test.tsx` — existing
  test updated to pass `tenantName="Test Tenant"` (was relying on the
  removed default).
- `src/components/admin/__tests__/admin-shell-tenant-required.test.ts`
  — **new** hygiene test (LEAK-B regression guard).
- `src/app/(maestro)/admin/cross-program-signals/page.tsx`
- `src/app/(maestro)/admin/depth-scorecard/page.tsx`
- `src/app/(maestro)/admin/programs/approvals/page.tsx` (both shells)
- `src/app/(maestro)/admin/programs/approvals/[requestId]/page.tsx`
- `src/app/(maestro)/admin/layout.tsx` (unauthorized shell)
- `src/app/(maestro)/admin/inbox/page.tsx`
- `src/app/(maestro)/docs/reasoning/about/page.tsx`
- `src/app/(maestro)/docs/reasoning/api/page.tsx`
- `src/app/(maestro)/docs/reasoning/changelog/page.tsx`
- `src/app/(maestro)/docs/reasoning/demo/page.tsx`
- `src/app/(maestro)/docs/reasoning/page.tsx`
- `src/app/(maestro)/docs/reasoning/patterns/page.tsx`
- `src/app/(maestro)/docs/reasoning/quickstart/page.tsx`
- `src/app/(maestro)/engineering/traces/page.tsx`

## QA / Validation
- **PASS** `npx tsc --noEmit` (only pre-existing Azure-SDK / pptxgenjs /
  resvg "Cannot find module" noise unrelated to this change; per
  `feedback_typecheck_workflow_artifact.md` those are workflow artifacts
  in a fresh worktree after `npm install`).
- **PASS** `npx eslint` on all changed files.
- **PASS** `npx jest src/components/admin/__tests__/admin-shell-tenant-required.test.ts`
  (new hygiene test — 1 case, scans every admin/docs/engineering call
  site and finds zero offenders).
- **PASS** `npx jest src/components/admin/__tests__/AdminCanonShellV2.test.tsx`
  (existing render test with the new required prop).
- **PASS** 17/18 suites under `src/components/admin/__tests__/`; the one
  failing suite (`no-sub-nav-strip.test.ts`) is a pre-existing failure
  about `SetupConnectorsPage.tsx` that this PR does not touch — verified
  by stashing the change and rerunning on `main`.

## Rollout Plan
- Merge to `main`.
- Vercel auto-deploys to production on push.
- No data migration. No env var change. No feature flag.

## Rollback Plan
- Revert the PR. The previous behavior (Apex-leak default) is
  reinstated. No data cleanup required.

## Audit Evidence
- Spec: `docs/build/ADMIN_HOME_FULL_TEST_2026-05-30.md` §2 Layer 2 + §6
  F3 + §7.3 + §7.5 (LEAK-B).
- Hygiene test path:
  `src/components/admin/__tests__/admin-shell-tenant-required.test.ts`.

## Known Gaps
None for PR-C. Companion PRs PR-A (tenant resolution) and PR-B
(top-bar component) are tracked separately in the same Apex-leak
elimination wave.
