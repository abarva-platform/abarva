# 2026-09-19-source-canonical-route-contract — Source Canonical Route Contract

## Release ID

`2026-09-19-source-canonical-route-contract`

## Status

`candidate`

## Plain-English Summary

Source route tests now exercise one canonical navigation contract: `/source`
mounts the governed command center, while retired entry points redirect there
and preserve relevant query context. Six repaired integration suites return to
the required Source test lane.

## Layer Impact

- Release lane: `global-control-lane`.
- Product control layer: test coverage and release evidence only.
- Product runtime: no route, component, authorization, or data behavior changed.

## Client Applicability

- All clients: shared Source route-contract validation.
- Specific clients: None.
- Internal only: CI quarantine reduction and release evidence.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Added an executable canonical-route integration contract.
- Removed duplicated route source-string assertions from seven legacy suites.
- Returned six repaired suites to the required Source integration workflow.
- Lowered the Source integration quarantine ceiling from 24 to 18.

## QA / Validation

- PASS — focused Source canonical-route and repaired-suite tests.
- PASS — full registered Source integration test lane.
- PASS — Source integration quarantine integrity check.
- PASS — TypeScript, ESLint, behavior tests, and release-control check.
- PASS — mutation check proving the canonical-route contract fails when a compatibility
  route targets the former entry path.

## Rollout Plan

Merge through the protected pull-request path. No data migration, Azure job,
feature flag, or manual runtime operation is required. The repository-owned ACA
workflow may deploy the unchanged product behavior with the next main release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this change.
- Approved image digest: Assigned by the deploy workflow after merge.
- ACA runtime invariant: Required if a deployment is performed.
- Worker image invariant: Required if a deployment is performed.
- Feature/env flag update path: None.
- Live signed-in proof required: No; this release changes tests only.

## Rollback Plan

Revert the pull request to restore the prior assertions and quarantine list.

## Audit Evidence

- Pull request and CI results after publication.
- Local command output recorded in the pull-request validation summary.

## Known Gaps

The compatibility alias remains supported intentionally. One separately tracked
legacy-stage suite remains quarantined for a non-route contract failure.
