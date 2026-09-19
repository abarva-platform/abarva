# 2026-09-19-source-empty-state-contract — Source Empty-State Contract

## Release ID

`2026-09-19-source-empty-state-contract`

## Status

`candidate`

## Plain-English Summary

The Source no-events experience now has one maintained integration contract.
It verifies the accessible heading, a single usable start action, safe rendering
of the active tenant name, useful setup links, and the absence of invented
agent or monitoring claims. An obsolete duplicate suite was retired.

## Layer Impact

- Release lane: `global-control-lane`.
- Product control layer: integration-test coverage and release evidence only.
- Product runtime: no component, route, authorization, or data behavior changed.

## Client Applicability

- All clients: shared Source empty-state validation.
- Specific clients: None.
- Internal only: CI quarantine reduction and release evidence.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Replaced duplicate literal-copy coverage with one semantic rendered suite.
- Added tenant-name escaping and fail-honest monitoring assertions.
- Removed the obsolete duplicate suite from Source integration quarantine.
- Lowered the Source integration quarantine ceiling from 18 to 17.

## QA / Validation

- PASS — focused Source empty-state integration tests.
- PASS — full registered Source integration test lane.
- PASS — Source integration quarantine integrity check.
- PASS — TypeScript, ESLint, behavior tests, and release-control check.
- PASS — mutation checks for the start destination and agent-claim refusal.

## Rollout Plan

Merge through the protected pull-request path after its prerequisite route-test
change. No data migration, Azure job, feature flag, or manual runtime operation
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

Revert the pull request to restore the prior duplicate suite and quarantine row.

## Audit Evidence

- Pull request and CI results after publication.
- Local command output recorded in the pull-request validation summary.

## Known Gaps

None known within the Source no-events contract.
