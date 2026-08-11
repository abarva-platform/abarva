# 2026-08-11-source-optimize-partial-baseline — Source Optimize Partial Baseline

## Release ID

`2026-08-11-source-optimize-partial-baseline`

## Status

`candidate`

## Plain-English Summary

The Source Optimize Contract page now renders a partial commercial baseline from the selected Contract 360 row when a persisted `source.optimization_baseline` row is not yet available. Known contract-register values such as annual value, actual spend, and committed value remain visible, while pricing schedule tie-out stays explicitly pending. This removes a misleading state where the page could show contract exposure in one panel and "Not established" for the same values in the baseline panel.

## Layer Impact

Release lane: `global-control-lane`.

Canonical model / Source read model: no schema or source-system semantics change. The adapter only uses the selected `source.contract_360` row as a fallback read source for baseline display when the persisted baseline table is absent or sparse.

Products: Source Optimize Contract baseline/readiness panels become more coherent for every tenant using the shared optimization opportunity read path.

## Client Applicability

- All clients: Yes, for tenants using Source Optimize Contract.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/data-model/read-adapter.ts`
- `src/lib/source/data-model/__tests__/read-adapter.contract-optimization.test.ts`

## QA / Validation

- `npx jest src/lib/source/data-model/__tests__/read-adapter.contract-optimization.test.ts --runInBand` passed.
- `npx jest src/components/source/__tests__/SourceOptimizeContractPage.test.tsx src/lib/source/data-model/__tests__/contract-optimization-spine.test.ts src/lib/source/data-model/__tests__/contract-optimization-opportunity.test.ts src/lib/source/data-model/__tests__/read-adapter.contract-optimization.test.ts --runInBand` passed.
- `npx eslint src/lib/source/data-model/read-adapter.ts src/lib/source/data-model/__tests__/read-adapter.contract-optimization.test.ts` passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` passed.
- `npm run release:check` passed.

## Rollout Plan

Merge through the protected GitHub PR lane. The repo-owned Azure Container Apps main deployment workflow builds and deploys the exact merged SHA.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: GitHub Actions workflow only.
- Approved image digest: To be captured after deploy.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required by the deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Source Optimize Contract baseline panel for a selected contract with no persisted baseline row.

## Rollback Plan

Revert the PR and allow the repo-owned ACA main deployment workflow to redeploy the previous adapter behavior. No migration rollback is required.

## Audit Evidence

- PR URL: To be added after PR creation.
- CI/deploy run: To be added after merge and deploy.
- Live proof: Verify the optimize page shows selected Contract 360 annual/actual/committed values while keeping pricing schedule tie-out pending.

## Known Gaps

This release does not create missing pricing schedule rows or approve an optimization value claim. It only fixes the display/read-model fallback so known contract-register values are not hidden when pricing detail is pending.
