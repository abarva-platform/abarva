# 2026-08-15-source-optimize-finance-handoff-operator — Optimize Finance Handoff Operator

## Release ID

`2026-08-15-source-optimize-finance-handoff-operator`

## Status

`candidate`

## Plain-English Summary

Source Optimize now has a narrow private-operator command to record the
Finance/Tower handoff request when a contract optimization case already has an
agreed vendor outcome and finance value proof. The command does not write
realized value; it creates the governed handoff request and moves the case to
the Finance/Tower confirmation state.

## Layer Impact

- Release lane: `global-control-lane`.
- Canonical model: writes only to persisted Source optimization workflow tables
  after validating the governed baseline, selected opportunity, and agreed
  outcome.
- Products: Source Optimize workflow readback can now prove whether the
  Finance/Tower handoff request exists separately from finance realization.

## Client Applicability

- All clients: yes, for tenants using the Source Optimize contract workflow.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/source/request-contract-optimization-finance-handoff.ts`
- `scripts/source/readback-contract-optimization-spine.ts`
- `package.json`

## QA / Validation

- Required before merge: TypeScript compile for the added script.
- Required before merge: ESLint for the added and changed scripts.
- Required before merge: existing Source Optimize workflow test suite.
- Required after deploy: repo-owned ACA deploy workflow completes.
- Required after deploy: ACA runtime invariant passes for web and worker images.
- Required before claiming data applied: private ACA operator job executes
  `source:contract-optimization:finance-handoff:apply` with a digest-pinned image.
- Required before claiming workflow proof: readback shows a
  `finance_value_confirmation` approval request and unchanged
  `finance_realization` count.

## Rollout Plan

Merge through the protected pull-request lane. The repo-owned Azure Container
Apps main deploy workflow builds and deploys the resulting image. After the
runtime invariant passes, run the private ACA operator job for the targeted
tenant/contract and capture the proof bundle.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none in this PR.
- Approved image digest: assigned by the deploy workflow after merge.
- ACA runtime invariant: required before claiming live.
- Worker image invariant: required before claiming live.
- Feature/env flag update path: none.
- Mutating data job: required for applying a Finance/Tower handoff request.

## Rollback Plan

Revert the merge commit to remove the operator command and readback enhancement.
If a handoff request was applied in data and must be unwound, use a separate
audited data-plane correction that cancels the request rather than deleting
workflow history.

## Audit Evidence

- Pull request URL after publication.
- GitHub Actions deploy run after merge.
- ACA runtime-invariant readback after deploy.
- Private ACA operator proof bundle for plan/apply and readback.

## Known Gaps

Signed-in browser proof depends on the browser-control bridge being available.
If it is unavailable, use data readback only and do not claim signed-in proof.
