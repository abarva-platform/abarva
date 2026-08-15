# 2026-08-15-source-optimize-action-trace-guard — Optimize Action Trace Guard

## Release ID

`2026-08-15-source-optimize-action-trace-guard`

## Status

`candidate`

## Plain-English Summary

Contract optimization approval actions now enforce the same traceability rule on
the server that the workflow rail presents in the UI. If an optimization
opportunity states a dollar amount, the action cannot create a vendor-outreach
approval request unless a completed calculation run reproduces that amount.

## Layer Impact

- Release lane: `global-control-lane`.
- Canonical model: reads persisted optimization opportunities and calculation
  runs as the authority for whether a stated amount is reproducible.
- Products: Source Optimize workflow actions now reject untraceable stated
  amounts before writing approval state.

## Client Applicability

- All clients: yes, for tenants using the Source Optimize contract workflow.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/data-model/contract-optimization-workflow-actions.ts`
- `src/lib/source/data-model/__tests__/contract-optimization-workflow-actions.test.ts`

## QA / Validation

- Pass: `npx jest src/lib/source/data-model/__tests__/contract-optimization-workflow-actions.test.ts --runInBand`
- Pass: `npx jest src/components/source/__tests__/SourceOptimizeContractPage.test.tsx src/lib/source/data-model/__tests__/contract-optimization-workflow-step.test.ts src/lib/source/data-model/__tests__/contract-optimization-workflow-actions.test.ts src/lib/source/data-model/__tests__/read-adapter.contract-optimization.test.ts 'src/app/api/source/optimize/contract/[contractId]/workflow/__tests__/route.test.ts' --runInBand`
- Pass: `npx eslint src/lib/source/data-model/contract-optimization-workflow-actions.ts src/lib/source/data-model/__tests__/contract-optimization-workflow-actions.test.ts`

## Rollout Plan

Merge through the protected pull-request lane. The repo-owned Azure Container
Apps main deploy workflow builds and deploys the resulting image.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none in this PR.
- Approved image digest: assigned by the deploy workflow after merge.
- ACA runtime invariant: required before claiming live.
- Worker image invariant: required before claiming live.
- Feature/env flag update path: none.
- Live signed-in proof required: required for product proof; API-level and
  runtime proof remain separate.

## Rollback Plan

Revert the merge commit and allow the repo-owned deploy workflow to restore the
previous action behavior.

## Audit Evidence

- Pull request URL after publication.
- GitHub Actions deploy run after merge.
- ACA runtime-invariant readback after deploy.
- Targeted workflow-action and Source Optimize test output listed above.

## Known Gaps

Signed-in browser proof depends on the browser-control bridge being available.
If it is unavailable, do not claim signed-in proof from this release record.
