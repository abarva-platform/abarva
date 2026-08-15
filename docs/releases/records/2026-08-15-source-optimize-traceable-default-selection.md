# 2026-08-15-source-optimize-traceable-default-selection — Source Optimize Prefers Traceable Defaults

## Release ID

`2026-08-15-source-optimize-traceable-default-selection`

## Status

`live-proven`

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
- Live signed-in browser proof after ACA deploy: direct navigation to `/source/optimize?contractId=CTR-090` rendered the Optimize Contract module, selected `Negotiated improvement`, showed Step 7, and retained the calculation-run traceability summary.

## Rollout Plan

Merge to `main`; the repo-owned ACA main deploy workflow builds and deploys the
new image to the shared ACA runtime.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: No ad hoc runtime mutation in this release.
- Approved image digest: `acrabarvalab001.azurecr.io/abarva/web@sha256:49cbbda5bfeebcbc64c2d50f2b992de784620933c7c2d9aa64a9b4186b842228`.
- ACA runtime invariant: Proven on `ca-abarva-web-lab-eastus--m36cd2c7f` with 100% traffic.
- Worker image invariant: Delivery worker jobs matched the same approved digest; historical data/operator jobs are not part of this proof.
- Feature/env flag update path: None.
- Live signed-in proof required: Completed for the direct selected-contract Optimize route.

## Rollback Plan

Revert the PR and allow the repo-owned ACA main deploy workflow to redeploy the
previous behavior. No schema rollback is required.

## Audit Evidence

- Pull request URL: https://github.com/abarva-platform/abarva/pull/6359
- Merge commit: `8dc5e2c564f3c512c2a6873ed0c077150fad21f4`
- ACA deployment run: `31886533505`
- Runtime revision: `ca-abarva-web-lab-eastus--m36cd2c7f`
- Signed-in browser proof: `/source/optimize?contractId=CTR-090` rendered `Selected opportunity: Negotiated improvement`, `Step 7 of 7`, and `6 of 6 stated amounts are reproducible from calculation runs ($6.8M)`.
- Focused Jest output showing the traceable-default regression test.

## Known Gaps

This does not create missing calculation runs or validate amount quality beyond
the existing traceability classifier. It only changes the initial default focus
when both traceable and untraceable opportunities are already present.
