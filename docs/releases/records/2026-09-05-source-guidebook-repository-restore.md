# 2026-09-05-source-guidebook-repository-restore — Source Guidebook Repository Restore

## Release ID

`2026-09-05-source-guidebook-repository-restore`

## Status

`candidate`

## Plain-English Summary

Restores the Source stage guidebook repository table that existing Source event
pages and the governed database migration readback use. The change recreates the
table, read policies, service-role access, lookup indexes, and minimal published
defaults so application-level readback can prove the repository path after a
schema apply.

## Layer Impact

- `client-data-lane`: Restores a Source-native schema object and seeded global
  defaults used by the Source event guidebook repository.
- `global-control-lane`: Repairs the shared database migration workflow's
  post-apply repository readback path.

## Client Applicability

- All clients: Existing Source event pages can read global guidebook defaults
  when a stage has one.
- Specific clients: None.
- Internal only: The migration workflow readback guard is internal release
  infrastructure.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `supabase/migrations/20260905123000_source_stage_guidebooks_restore.sql`
- `src/__tests__/integration/source/source-stage-guidebooks-restore-migration.test.ts`

## QA / Validation

- PASS: `npm run test:integration -- --runTestsByPath src/__tests__/integration/source/source-stage-guidebooks-restore-migration.test.ts --runInBand`
- PASS: `npm run test:integration -- --runTestsByPath src/__tests__/integration/source/source-event-approval-ledger-restore-migration.test.ts src/__tests__/integration/source/source-stage-guidebooks-restore-migration.test.ts --runInBand`
- PENDING: `npm run release:check` after this record is added in the required
  release-record shape.
- PENDING: governed database migration workflow apply and repository readback.

## Rollout Plan

1. Merge through PR.
2. Build and deploy the exact merge SHA through the repo-owned ACA main deploy
   workflow.
3. Run the governed database migration workflow in apply mode.
4. Confirm schema readback, migration ledger, repository readback, and affected
   Source event route smoke.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: No ad-hoc runtime mutation; use the repo-owned ACA
  main deploy workflow only.
- Approved image digest: Pending ACA deploy output.
- ACA runtime invariant: Required before calling the release deployed.
- Worker image invariant: Required where the deploy workflow updates worker job
  images.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, affected Source event route smoke after
  migration apply.

## Rollback Plan

Revert the release commit if product code should stop depending on the
guidebook repository. The migration is additive and should not be rolled back
destructively without a separate audited cleanup plan.

## Audit Evidence

- Pull request for this release.
- ACA main deploy workflow run for the merge SHA.
- Database migration workflow apply artifact showing schema readback and
  repository readback.
- Affected Source event route smoke after apply.

## Known Gaps

- The release is not active until the PR is merged, deployed, and applied
  through the governed database migration workflow.
