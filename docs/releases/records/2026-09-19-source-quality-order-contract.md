# 2026-09-19-source-quality-order-contract — Source Quality-Order Test Contract

## Release ID

`2026-09-19-source-quality-order-contract`

## Status

`candidate`

## Plain-English Summary

The Source artifact-generation integration contract now verifies the order of
quality controls by their executable calls instead of depending on local
variable names. Deterministic completion and sanitization must precede the
second review, deterministic claim gating must follow it, and the completed
quality pipeline must run before artifact persistence.

## Layer Impact

- Release lane: `global-control-lane`.
- Product control layer: integration-test coverage and release evidence only.
- Product runtime: no generation, prompt, persistence, authorization, or data behavior changed.

## Client Applicability

- All clients: shared Source artifact-generation validation.
- Specific clients: None.
- Internal only: CI quarantine reduction and release evidence.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Replaced a quality-review variable-name assertion with a TypeScript call-order contract.
- Proved deterministic completion, sanitization, review, and claim gating remain ordered.
- Proved the quality pipeline runs before the artifact-body persistence seam.
- Returned the repaired access-control suite to required Source integration CI.
- Lowered the Source integration quarantine ceiling from 15 to 14.

## QA / Validation

- PASS — focused Source access-control integration suite.
- PASS — full registered Source integration test lane.
- PASS — Source integration quarantine integrity check.
- PASS — TypeScript, ESLint, behavior tests, and release-control check.
- PASS — moving the deterministic claim-gate call ahead of the second review fails.

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

Revert the pull request to restore the former source-text assertion and
quarantine row.

## Audit Evidence

- Pull request and CI results after publication.
- Local command output recorded in the pull-request validation summary.

## Known Gaps

None known within the quality-order integration contract.
