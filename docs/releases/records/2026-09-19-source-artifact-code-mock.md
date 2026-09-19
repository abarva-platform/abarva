# 2026-09-19-source-artifact-code-mock — Source Artifact-Code Test Contract

## Release ID

`2026-09-19-source-artifact-code-mock`

## Status

`candidate`

## Plain-English Summary

The Source pricing round-trip integration suite now preserves the production
artifact-code resolver when mocking deliverable construction. The suite proves
that pricing templates and pricing comparisons remain distinct dispatch paths.

## Layer Impact

- Release lane: `global-control-lane`.
- Product control layer: integration-test coverage and release evidence only.
- Product runtime: no renderer, route, authorization, or data behavior changed.

## Client Applicability

- All clients: shared Source artifact-render validation.
- Specific clients: None.
- Internal only: CI quarantine reduction and release evidence.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Replaced a whole-module spec-builder mock with a partial mock.
- Added a production-resolver assertion for pricing template and comparison variants.
- Returned the pricing round-trip suite to required Source integration CI.
- Lowered the Source integration quarantine ceiling from 16 to 15.

## QA / Validation

- PASS — focused pricing upload/list/download/render integration suite.
- PASS — full registered Source integration test lane.
- PASS — Source integration quarantine integrity check.
- PASS — TypeScript, ESLint, behavior tests, and release-control check.
- PASS — mutation mapping the comparison variant to the template kind fails.

## Rollout Plan

Merge through the protected pull-request path after its prerequisite test-control
changes. No data migration, Azure job, feature flag, or manual runtime operation
is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this change.
- Approved image digest: Assigned by the deploy workflow after merge.
- ACA runtime invariant: Required if a deployment is performed.
- Worker image invariant: Required if a deployment is performed.
- Feature/env flag update path: None.
- Live signed-in proof required: No; this release changes tests only.

## Rollback Plan

Revert the pull request to restore the former mock and quarantine row.

## Audit Evidence

- Pull request and CI results after publication.
- Local command output recorded in the pull-request validation summary.

## Known Gaps

None known within the pricing artifact-code round-trip contract.
