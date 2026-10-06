# 2026-09-10-source-cloud-control-readiness — Source Cloud Control Readiness

## Release ID

`2026-09-10-source-cloud-control-readiness`

## Status

`candidate`

## Plain-English Summary

This release enforces the Source cloud-consumption opportunity projection so control-only actions render as control blockers instead of finance-confirmation opportunities. It keeps canonical optimization rows ahead of legacy rows when both paths contain the same opportunity ID.

## Layer Impact

Release lane: `client-data-lane`.

Layer 3 is unchanged. The canonical optimization opportunity rows and their value types remain the source of truth.

Layer 4 changes. The consumption opportunity read model is replaced with an idempotent view definition that preserves existing column order while correcting control-action readiness classification.

## Client Applicability

- All clients: Yes, for the shared Source cloud-consumption read model.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `supabase/migrations/20260910231500_source_cloud_l4_control_readiness_projection.sql`
- `scripts/source/__tests__/load-cloud-consumption-package.test.ts`

## QA / Validation

Pre-merge validation:

- PASS: `npm test -- --runTestsByPath scripts/source/__tests__/load-cloud-consumption-package.test.ts`
- PASS: `git diff --check`
- PASS: `npm run release:check`
- NOT RUN pre-merge: ACA schema apply through the approved operator job. This runs only after the repo-owned deploy publishes the migration.
- NOT RUN pre-merge: Cloud-consumption Layer 4 apply and verify through the approved operator job. This runs only after the schema apply is complete.

## Rollout Plan

Merge through pull request, let the repo-owned ACA main deploy workflow publish the new image, verify the runtime invariant, run the approved schema-apply ACA job, then replay the cloud-consumption Layer 4 apply/verify jobs.

## Deployment Authority

- Repo-owned deploy workflow: Required for the web image.
- Shared runtime mutators: Not allowed outside the repo-owned workflow.
- Approved image digest: To be captured after deployment.
- ACA runtime invariant: Required before data-build replay.
- Worker image invariant: Required before data-build replay.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Source Contract 360 and Optimize for the affected package after data refresh.

## Rollback Plan

Rollback requires a forward migration or a restored view definition. Reverting application code alone does not remove or replace the Layer 4 database view.

## Audit Evidence

Inspect the pull request, migration file, targeted test output, release-check output, ACA deploy workflow run, schema-apply job logs, Layer 4 job proof bundle, and signed-in Source smoke proof.

## Known Gaps

This release does not change opportunity data, opportunity sizing, tab narrative design, or aVa answer generation. It only repairs the Layer 4 readiness projection for control actions.
