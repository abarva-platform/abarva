# 2026-09-21-source-purpose-review-state - Show Unreviewed Purpose Honestly

## Release ID

`2026-09-21-source-purpose-review-state`

## Status

`candidate`

## Plain-English Summary

Contract Story pages no longer compose a purpose statement from vendor, contract-name, and
archetype fields when no reviewed purpose extraction exists. The page now states that purpose
review is needed while continuing to show which governed header evidence is loaded.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4, Source: changes the presentation of an existing evidence state only.
- Layers 1-3: no intake, adapter, canonical fact, or read-model change.

## Client Applicability

- All clients: yes, on the Contract 360 Story surface.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Update the shared contract-purpose summary to distinguish reviewed purpose from review-needed.
- Add a rendered Story regression and update the purpose-summary contracts.

## QA / Validation

- The new rendered Story assertion failed against the prior behavior.
- Three focused suites pass with 20 tests.
- Replacing the review-needed heading with the former generic heading makes the rendered regression
  fail.
- Three focused suites / 20 tests and 82 behavior suites / 738 tests pass.
- TypeScript, focused ESLint, diff checking, and release control pass.

## Rollout Plan

Merge through a protected pull request and deploy through the repository-owned Azure Container Apps
main workflow.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside that workflow.
- Approved image digest: recorded by the deployment workflow.
- ACA runtime invariant: required after deployment.
- Worker image invariant: required after deployment.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes, for the affected Contract 360 Story state.

## Rollback Plan

Revert the squash merge and redeploy the resulting main revision through the same workflow. No data
rollback is required.

## Audit Evidence

- Focused Jest output for the Story and purpose-summary suites.
- Pull-request checks and deployment runtime-invariant artifact.
- A later signed-in Contract 360 Story capture for an unreviewed-purpose contract.

## Known Gaps

Signed-in re-acceptance is intentionally separate from this code candidate.
