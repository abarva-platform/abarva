# 2026-05-30 — Re-delete Tenant page + SetupTenantPage (CL-2)

## Release ID

`2026-05-30-cleanup-redelete-tenant-pages`

## Status

`released`

## Plain-English Summary

Wave 1 PR-3 (commit `b4ee660a5`) deleted the legacy
`/admin/tenant` route and the 365-line `SetupTenantPage`
component, demoting tenant configuration to an inline tab on
`/admin?tab=tenant`. Wave 3 PR-7's squash-merge (commit
`42a097971`) accidentally re-introduced both files. This
cleanup PR re-deletes them, plus the orphaned
`/home/tenant-profile/page.tsx` re-export which had been
forwarding to the now-removed `/admin/tenant` route.

There is no user-visible change: the proxy already
301-redirects both `/admin/tenant` and `/home/tenant-profile`
to `/admin?tab=tenant`, and the `AdminTenantTab` component
on `/admin` continues to render the tenant configuration UI
inline.

## Layer Impact

- **runtime-app-lane** — three route/component files
  deleted. No behavior change because the proxy already
  redirects the legacy URLs.
- No broker, RLS, data-plane, design-token, or runtime cost
  impact.

## Client Applicability

- **All clients** — no user-visible change. Operators who
  bookmarked `/admin/tenant` or `/home/tenant-profile` keep
  landing on `/admin?tab=tenant` via the existing proxy
  redirects.
- No feature flag.

## Changes Included

- Deleted files:
  - `src/app/(maestro)/admin/tenant/page.tsx` (7 LOC)
  - `src/app/(maestro)/home/tenant-profile/page.tsx` (6 LOC)
  - `src/components/setup/SetupTenantPage.tsx` (365 LOC)
- Release record: this file.

No other code touched. The hygiene test
`src/__tests__/hygiene/admin-routes-resolve.test.ts` already
lists `/admin/tenant` in `DEAD_ADMIN_ROUTES`; no test changes
required.

## QA / Validation

- `npx eslint src/` — 0 errors (pre-existing warnings unchanged).
- `npx tsc --noEmit` — no new errors in touched files.
- `npm run test:nav` — passes.
- `npm run test:behaviors` — 5 pre-existing `tenant-onboarding.test.ts`
  failures unrelated to this PR (per W1-PR-2 release record and user
  memory `feedback_typecheck_workflow_artifact.md`).
- Verified proxy redirects in `src/proxy.ts`:
  - `'/admin/tenant': '/admin?tab=tenant'` (line 239)
  - `'/home/tenant-profile': '/admin?tab=tenant'` (line 200)

## Rollout Plan

- Squash-merge to `main`.
- Vercel preview/production deploy picks up automatically.
- No data-plane migrations.
- No feature flag — applies immediately on deploy.

## Rollback Plan

- `git revert <merge-commit> -m 1` and redeploy. The change
  is a code-only file deletion; reverting restores the three
  deleted files. Legacy URLs continue to redirect either way.

## Audit Evidence

- Verdict spine: `docs/build/SETUP_AUDIT_2026-05-30_VERDICT.md` §3
  (route altitude) and §5.5 (consolidation set).
- Originating release record: `2026-05-30-admin-route-consolidation-pr2.md`
  (and W1-PR-3 tenant-demote work which originally removed
  these files in commit `b4ee660a5`).
- Re-introduction trace: commit `42a097971` (Wave 3 PR-7 per-zone
  Suspense boundaries) squash-merge accidentally restored the
  files.

## Known Gaps

- None. This is a pure follow-up cleanup of a squash-merge
  artifact.
