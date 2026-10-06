# 2026-09-10-source-cloud-l4-readiness-repair - Source Cloud L4 Readiness Repair

## Release ID

`2026-09-10-source-cloud-l4-readiness-repair`

## Status

`candidate`

## Plain-English Summary

This release repairs the Source cloud-consumption Layer 4 opportunity projection so canonical optimization rows keep their readiness state when a legacy compatibility row has the same opportunity ID. Control actions remain control-required instead of being counted as finance-required value opportunities.

## Layer Impact

`client-data-lane`: Layer 3 is unchanged. The canonical optimization opportunity spine remains the source of truth for opportunity value type, amount, stage, evidence grade, owner, and next action.

`client-data-lane`: Layer 4 changes in one projection view: `consumption.sourcing_opportunity_v1`. The view still includes legacy Source opportunity rows, but suppresses a legacy row when a matching canonical optimization opportunity exists for the same tenant and opportunity ID.

## Client Applicability

- All clients: Yes, for tenants using the Source cloud-consumption Layer 4 opportunity projection.
- Specific clients: None named.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Migration: `supabase/migrations/20260910143500_source_cloud_l4_opportunity_readiness_repair.sql`
- Test: `scripts/source/__tests__/load-cloud-consumption-package.test.ts`

## QA / Validation

- Blocked before merge: targeted Source cloud-consumption loader tests need dependencies available in the clean worktree.
- Failed before merge: release record check initially failed because this record did not name the affected lane and did not state QA statuses explicitly.
- Not-run pending deploy: repo-owned ACA schema apply job.
- Not-run pending schema apply: governed ACA Layer 4 apply and verify for the affected cloud-consumption package.

## Rollout Plan

Merge through PR, deploy through the repo-owned ACA main deploy workflow, apply migrations through the governed ACA operator job, then rerun the affected Source cloud-consumption Layer 4 apply and verify jobs.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: ACA schema/data jobs only through `npm run ops:aca-job`.
- Approved image digest: To be captured after the main deploy workflow.
- ACA runtime invariant: Required before post-deploy data jobs.
- Worker image invariant: Required before post-deploy data jobs.
- Feature/env flag update path: None.
- Live signed-in proof required: Source Contract 360/Optimize affected contract smoke after data verification.

## Rollback Plan

Rollback the web runtime to the prior approved digest if the deployed app regresses. If the migration itself must be reversed, create a follow-up migration restoring the previous `consumption.sourcing_opportunity_v1` definition; do not edit migration history.

## Audit Evidence

- PR URL: pending.
- CI/check output: pending.
- ACA deploy digest and runtime invariant: pending.
- ACA schema/data job proof bundles: pending.

## Known Gaps

This does not add new contract evidence or change opportunity sizing. It only repairs the Layer 4 projection that classifies canonical opportunity readiness.
