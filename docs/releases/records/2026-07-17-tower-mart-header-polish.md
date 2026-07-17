# 2026-07-17-tower-mart-header-polish — Tower Mart Header Label Polish

## Release ID

`2026-07-17-tower-mart-header-polish`

## Status

`candidate`

## Plain-English Summary

Fixes a Tower header label on the new mart-backed command center. The page now describes the mart count as portfolio items instead of rendering the broken text `entit entities`.

## Layer Impact

- Product UI: Updates only the Tower masthead count label for the mart-backed view.
- Data plane: No data model, mart, migration, loader, or write-path change.

## Client Applicability

- All clients: No.
- Specific clients: Healthcare Demo / Meridian Tower mart view.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/tower/TowerIndexPage.tsx`

## QA / Validation

- `npx jest src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx --runInBand` passed in the populated Tower command-center worktree after the identical patch.
- `git diff --check` passed.
- `npm run release:check` was run and required this release record.

## Rollout Plan

Merge through the protected PR lane. The approved Azure Container Apps main deploy workflow will build and deploy the updated image. No database migration or data-build job is required.

## Deployment Authority

- Repo-owned deploy workflow: Required after merge.
- Shared runtime mutators: None.
- Approved image digest: Determined by the main ACA deploy workflow.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes, Tower page should show `portfolio items` in the masthead.

## Rollback Plan

Revert this UI-only commit or roll back to the prior ACA image if needed. No data rollback is required.

## Audit Evidence

- Focused Tower component test output.
- Post-deploy signed-in Tower screenshot after the main deploy.

## Known Gaps

This release only fixes the Tower masthead wording. It does not change the underlying Tower mart, add new fields, reload data, or alter the proof bundle created by the prior Tower command-mart release. A post-deploy signed-in screenshot is still required before calling the polish live-proven.
