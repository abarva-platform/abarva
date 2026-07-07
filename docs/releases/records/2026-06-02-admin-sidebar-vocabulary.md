# 2026-06-02-admin-sidebar-vocabulary — Admin Sidebar Vocabulary Alignment

## Release ID

`2026-06-02-admin-sidebar-vocabulary`

## Status

`candidate`

## Plain-English Summary

Updates the Admin sidebar header from setup-era wording to `Admin workspace`. The sidebar now describes the area as the tenant-readiness control plane, matching the approved Home/Admin separation and the shell vocabulary already merged.

## Layer Impact

Global control lane Admin UI. This changes visible Admin chrome text and its regression tests only; it does not change data loading, private data-plane behavior, authorization, or route structure.

## Client Applicability

- All clients: Signed-in users with Admin access see the updated sidebar vocabulary.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/components/admin/AdminSidebar.tsx`
- `src/__tests__/integration/admin/admin-route-shell-enforcement.test.ts`
- `src/components/admin/__tests__/admin-sidebar-vocabulary.test.ts`

## QA / Validation

Local validation:

- PASS — `npx jest --runTestsByPath src/components/admin/__tests__/admin-sidebar-vocabulary.test.ts src/__tests__/integration/admin/admin-route-shell-enforcement.test.ts --runInBand`
- PASS — `npx eslint src/components/admin/AdminSidebar.tsx src/components/admin/__tests__/admin-sidebar-vocabulary.test.ts src/__tests__/integration/admin/admin-route-shell-enforcement.test.ts`
- PASS — `git diff --check`
- PASS — `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to `main` and deploy through the normal Vercel pipeline. No migration or feature flag is required.

## Rollback Plan

Revert the PR to restore the previous sidebar wording and test expectations. No data rollback is required.

## Audit Evidence

Inspect the PR diff, local validation output, release-control gate, CI results, and Vercel preview.

## Known Gaps

Internal token and package names such as `SETUP_*` remain unchanged for compatibility. This PR changes visible Admin sidebar vocabulary only.
