# 2026-09-19-source-semantic-copy-contracts — Source Semantic Contracts

## Release ID

`2026-09-19-source-semantic-copy-contracts`

## Status

`candidate`

## Plain-English Summary

Two Source integration checks now validate the meaning of the rendered state
instead of obsolete wording. The scope gate proves that application and service
inventory evidence is present and usable. The award summary proves that the
lead remains subject to unresolved conditions before award.

## Layer Impact

- Release lane: `global-control-lane`.
- Product control layer: integration-test coverage and release evidence only.
- Product runtime: no component, scoring, route, or data behavior changed.

## Client Applicability

- All clients: shared Source evidence-gate and award-posture validation.
- Specific clients: None.
- Internal only: CI quarantine reduction and release evidence.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Replaced the scope-gate label assertion with evidence-row and evidence-state checks.
- Replaced the award-summary wording assertion with explicit condition checks.
- Returned the repaired gate-tab suite to required Source integration CI.
- Lowered the Source integration quarantine ceiling from 17 to 16.

## QA / Validation

- PASS — focused gate-tab and award-summary suites, with the separately tracked
  null-event failure preserved.
- PASS — full registered Source integration test lane.
- PASS — Source integration quarantine integrity check.
- PASS — TypeScript, ESLint, behavior tests, and release-control check.
- PASS — mutations removing usable inventory evidence or award conditions fail.

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

Revert the pull request to restore the former assertions and quarantine row.

## Audit Evidence

- Pull request and CI results after publication.
- Local command output recorded in the pull-request validation summary.

## Known Gaps

The executive-decision suite remains quarantined for its separately tracked
tenant-aware golden-event fixture failure.
