# 2026-09-19-source-intake-branch-contract — Source Intake Branch Contract

## Release ID

`2026-09-19-source-intake-branch-contract`

## Status

`candidate`

## Plain-English Summary

The deterministic Source adviser now distinguishes a concise new-event intake
request from advice about an event that already exists. Eventless intake
requests return the five minimum facts without calling a model or creating an
event; existing-event prompts remain on the governed event-advice path.

## Layer Impact

- Release lane: `global-control-lane`.
- Product control layer: deterministic Source adviser response shaping.
- Product runtime: the eventless helper branch now returns structured intake guidance.
- Data layer: no schema, migration, loader, projection, or tenant-data change.

## Client Applicability

- All clients: shared deterministic Source adviser helper.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Added a structured eventless-intake response for concise sourcing requests.
- Preserved the generic missing-event error for non-intake questions.
- Proved an existing event never emits origination intake guidance.
- Returned the repaired Nexus API stub suite to required Source integration CI.
- Lowered the Source integration quarantine ceiling from 14 to 13.

## QA / Validation

- PASS — focused Source Nexus API stub integration suite.
- PASS — full registered Source integration test lane.
- PASS — Source integration quarantine integrity check.
- PASS — TypeScript, ESLint, behavior tests, and release-control check.
- PASS — mutations disabling eventless intake or applying intake to existing events fail.

## Rollout Plan

Merge through the protected pull-request path after its prerequisite test-control
changes, then use the repo-owned ACA deploy workflow. No data migration, Azure
job, feature flag, or manual runtime operation is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside that workflow.
- Approved image digest: Assigned by the deploy workflow after merge.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Required after deployment.
- Feature/env flag update path: None.
- Live signed-in proof required: Required before describing the behavior as live on a user-facing route.

## Rollback Plan

Revert the pull request to restore the former generic missing-event response and
quarantine row.

## Audit Evidence

- Pull request and CI results after publication.
- Local command output recorded in the pull-request validation summary.

## Known Gaps

The eventless helper branch is not itself a user-facing route. Route-level
acceptance remains separate from this deterministic contract.
