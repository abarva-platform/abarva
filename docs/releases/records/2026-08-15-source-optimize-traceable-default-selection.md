# 2026-08-15-source-optimize-traceable-default-selection — Source Optimize Prefers Traceable Defaults

## Release ID

`2026-08-15-source-optimize-traceable-default-selection`

## Status

`candidate`

## Plain-English Summary

Source Optimize now chooses a calculation-reproducible opportunity as the initial
working focus before choosing an untraced target amount. Existing workflow state
still wins: if an approval request or negotiated outcome is already active, the
page keeps that selected opportunity. This prevents the workflow from steering a
user toward a value that cannot be rebuilt from persisted calculation evidence
when a traceable opportunity is available.

## Layer Impact

- Canonical model: no schema or data changes. The persisted opportunity and
  calculation-run rows remain the source of truth.
- Products: Source Optimize read-model selection logic now uses the existing
  traceability classifier when picking the default opportunity. Release lane:
  `global-control-lane`.

## Client Applicability

- All clients: Applies to Source Optimize wherever the shared contract
  optimization read model is used.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/data-model/read-adapter.ts`
- `src/lib/source/data-model/__tests__/read-adapter.contract-optimization.test.ts`

## QA / Validation

- Passed: `npx jest src/lib/source/data-model/__tests__/read-adapter.contract-optimization.test.ts --runInBand`
- Passed: `npx jest src/components/source/__tests__/SourceOptimizeContractPage.test.tsx src/lib/source/data-model/__tests__/contract-optimization-workflow-step.test.ts src/lib/source/data-model/__tests__/contract-optimization-workflow-actions.test.ts src/lib/source/data-model/__tests__/read-adapter.contract-optimization.test.ts 'src/app/api/source/optimize/contract/[contractId]/workflow/__tests__/route.test.ts' --runInBand`
- Passed: `npx eslint src/lib/source/data-model/read-adapter.ts src/lib/source/data-model/__tests__/read-adapter.contract-optimization.test.ts`
- Passed: `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false`
- Passed: `git diff --check`
- Passed: `npm run release:check`

## Rollout Plan

Merge to `main`; the repo-owned ACA main deploy workflow builds and deploys the
new image to the shared ACA runtime.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: No ad hoc runtime mutation in this release.
- Approved image digest: Produced by the repo-owned deploy workflow after merge.
- ACA runtime invariant: Required before claiming live deployment.
- Worker image invariant: Required before claiming live deployment.
- Feature/env flag update path: None.
- Live signed-in proof required: Required before claiming signed-in product proof;
  ACA invariant and health proof are not sufficient by themselves.

## Rollback Plan

Revert the PR and allow the repo-owned ACA main deploy workflow to redeploy the
previous behavior. No schema rollback is required.

## Audit Evidence

- Pull request URL and deployment run after merge.
- Focused Jest output showing the traceable-default regression test.
- ACA deployment evidence artifact after merge.

## Known Gaps

This does not create missing calculation runs or validate amount quality beyond
the existing traceability classifier. It only changes the initial default focus
when both traceable and untraceable opportunities are already present.
