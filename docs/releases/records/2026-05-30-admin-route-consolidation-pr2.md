# 2026-05-30 — Admin route consolidation (Wave 1 PR-2)

## Release ID

`2026-05-30-admin-route-consolidation-pr2`

## Status

`released`

## Plain-English Summary

The Setup/Admin surface had grown to 25 sub-routes, several of which
overlapped or were named after AI agents instead of the operator
workflow. PR #2502 trimmed four of them. `/admin/users` was redundant
with the richer `/admin/users-access` roster and was deleted. The
891-line `/admin/invite` page was demoted to a modal dialog launched
from Users & Access — same flow, no longer a top-level URL. The
legacy `/admin/agents/atlas` redirect-only page was removed (the
workflow-anchored successor is `/admin/cross-program-signals`). The
raw Atlas trace inspector at `/admin/atlas/traces` was relocated to
a new `/engineering/traces` route, because raw diagnostics are an
engineering surface, not a Trust Plane surface. Every old URL still
works — all four are 301-redirected by the proxy.

## Layer Impact

- **App / Routing layer:** Three routes deleted, one relocated. The
  proxy (`src/proxy.ts`) gains an `adminRouteConsolidationMap` that
  301-redirects the four legacy URLs to their canonical replacements.
  A new `/engineering(.*)` matcher is added to
  `AUTH_REQUIRED_ROUTE_PATTERNS`.
- **Component layer:** `SetupUsersPage` (309 LOC) deleted.
  `InviteCollaboratorPage` renamed to `InviteCollaboratorDialog`
  and rewrapped in a controlled `<dialog>` element. New
  `InviteCollaboratorLauncher` client component owns open-state
  and exposes the CTA.
- **Hygiene / test layer:** New
  `src/__tests__/hygiene/admin-routes-resolve.test.ts` (34 tests)
  guards against regressions — sidebar entries and
  `composeHomeV2Extras` panels/readiness arrays are checked against
  the deleted-route set; the proxy redirect map is checked for
  coverage.

No data-plane, broker, RLS, or runtime cost impact. No design-token
changes.

## Client Applicability

- **All clients** — applies to every tenant. The Setup/Admin
  surface is shared infrastructure.
- **No feature flag.**
- **No public/demo-specific behavior.**

## Changes Included

- PR #2502 · `refactor(setup): delete redundant /admin routes (Wave 1 PR-2)`
  - `f8c97b606` · delete `/admin/users` + `SetupUsersPage.tsx` + add proxy redirect
  - `a44d17cf5` · demote `/admin/invite` to dialog; mount launcher on `/admin/users-access`
  - `cf536dc0f` · delete `/admin/agents/atlas` legacy redirect page
  - `241b8acea` · relocate `/admin/atlas/traces` → `/engineering/traces`
  - `8f09e8bf9` · add `admin-routes-resolve` hygiene guard (34 tests)
- Verdict spine: `docs/build/SETUP_AUDIT_2026-05-30_VERDICT.md` §5.5
- Final merge commit: `464c683da49f68cd9333632b2a23281d6662999a`

## QA / Validation

- `npx eslint src/` — 0 errors (154 pre-existing warnings, unchanged).
- `npx jest src/__tests__/hygiene/admin-routes-resolve.test.ts` — 34/34 pass.
- `npx jest src/__tests__/hygiene/shell-v2-mode-layout.test.ts` — 27/28 pass; the one failing test is a pre-existing AppTopBar label assertion unrelated to this PR.
- `npx jest src/__tests__/unit/proxy-public-routes.test.ts` — 10/10 pass.
- `npm run test:nav` — 26/26 pass.
- `npm run test:behaviors` — 69/74 pass; 5 failing tests are all in `tenant-onboarding.test.ts` looking for a `CLIENT_KEY_TO_DB_SLUGS` record that has been refactored upstream — pre-existing failure, not introduced by this PR.
- `npx tsc --noEmit` — no new errors in files this PR touched. The pre-existing workflow-artifact errors from missing `@azure/*` and `pptxgenjs` types remain (documented in user memory `feedback_typecheck_workflow_artifact.md`).

## Rollout Plan

- Squash-merged to `main` 2026-05-30 11:41 UTC.
- Vercel preview/production deploy will pick up automatically.
- No data-plane migrations.
- No feature flag — applies immediately on deploy.

## Rollback Plan

- `git revert 464c683da49f68cd9333632b2a23281d6662999a -m 1` and
  redeploy. The change is a code-only refactor; reverting restores
  the four deleted/moved routes and removes the proxy redirect map.
- The `InviteCollaboratorDialog` rename can be unwound via git
  history (the file is git-mv'd, not rewritten).

## Audit Evidence

- PR: https://github.com/anandsundaram-hash/abarva/pull/2502
- Verdict spine: `docs/build/SETUP_AUDIT_2026-05-30_VERDICT.md`
- Merge commit: `464c683da49f68cd9333632b2a23281d6662999a`
- Hygiene test artifact: `src/__tests__/hygiene/admin-routes-resolve.test.ts`
- Proxy redirect map: `src/proxy.ts` → `adminRouteConsolidationMap`

## Known Gaps

- The `Release Control Gate` CI check failed on the PR itself
  because this release record was not added before the squash-merge.
  This record is filed retroactively. Future Setup/Admin
  consolidation PRs (Wave 1 PR-3, PR-5, PR-6 per
  `SETUP_AUDIT_2026-05-30_VERDICT.md` §7) must include their
  release record in the same PR.
- `/home/users-access` does not exist as a route (the
  `home-overview-v2.ts` panel array still points to it). That's
  PR-1's domain — the panel array rewrite — and is not in scope
  for this PR. The hygiene test added here verifies that no panel
  href points at PR-2's deleted routes, but does not yet verify
  the full panel array resolves.
