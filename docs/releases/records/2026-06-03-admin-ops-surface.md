# 2026-06-03-admin-ops-surface — Admin Ops Surface

## Release ID

`2026-06-03-admin-ops-surface`

## Status

`candidate`

## Plain-English Summary

Adds an admin-only Ops Console that shows how operational actions such as
re-indexing, migration dry-runs, Source backfills, quarantine replay, audit
exports, and secret rotation must be approved, validated, audited, and rolled
back. The page does not directly execute production jobs.

## Layer Impact

- `internal-admin`: adds a new `/admin/ops` operator surface inside the existing
  admin-only route family.
- `global-control-lane`: documents shared operational controls that apply before
  any client-scoped execution is allowed.

## Client Applicability

- All clients: no runtime client-data changes.
- Specific clients: none.
- Internal only: AbarVa administrators with existing `/admin/*` access.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `src/app/(maestro)/admin/ops/page.tsx`
- `src/lib/admin/ops-surface.ts`
- `src/lib/admin/__tests__/ops-surface.test.ts`
- `src/lib/admin/admin-shell-config.ts`
- `src/lib/admin/home-overview-v2.ts`
- `src/lib/admin/admin-surface-completeness.ts`
- `scripts/admin/verify-admin-ops-surface.mjs`
- `docs/runbooks/admin-ops-surface.md`
- `docs/build/ADMIN_OPS_SURFACE_2026-06-03.md`

## QA / Validation

- Pass: `node scripts/admin/verify-admin-ops-surface.mjs`
- Pass: `npx jest src/lib/admin/__tests__/ops-surface.test.ts src/lib/admin/__tests__/home-overview-v2-pre-w4-pr5.test.ts --runInBand`
- Pass: focused ESLint for modified admin route, model, tests, and verifier.
- Pass: `git diff --check`
- Pass: `npm run release:check -- --base origin/main --head HEAD`
- Blocked, unrelated local dependency: `npx tsc --noEmit --pretty false`
  stopped on `tests/accessibility/public-axe.spec.ts` because
  `@axe-core/playwright` is not installed in the local worktree.

## Rollout Plan

Merge to `main`; Vercel deploy makes `/admin/ops` available to existing admin
users through the admin sidebar and admin home panel.

## Rollback Plan

Revert the PR. The change has no migrations and does not mutate client data.

## Audit Evidence

- PR URL once opened.
- CI checks.
- Local verifier/test output.
- Release record and build manifest.

## Known Gaps

This is the governed surface foundation. T035 remains `In progress` until
production operations are backed by a job runner with idempotency, locks,
retries, approval capture, and immutable audit-log writes.
