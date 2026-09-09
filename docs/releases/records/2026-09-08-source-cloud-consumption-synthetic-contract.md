# 2026-09-08-source-cloud-consumption-synthetic-contract — Source Cloud Consumption Synthetic Contract Package

## Release ID

`2026-09-08-source-cloud-consumption-synthetic-contract`

## Status

`candidate`

## Plain-English Summary

Adds a governed synthetic cloud-consumption contract package that can be loaded through the Source data-build path. The package is designed to make a named cloud data-platform vendor contract visible in Source360 with contract terms, commitment economics, monthly usage, evidence references, and candidate optimization opportunities while keeping raw/full vendor contract documents outside the public repository.

## Layer Impact

Affected lanes: `client-data-lane`, `public-demo`.

Layer 1 client intake: adds synthetic source files, synthetic evidence summaries, a governed workbook, package metadata, and package QA proof.

Layer 2 source adapters: tightens the cloud-consumption loader quality gate so opportunity evidence references can resolve to either source rows or declared evidence documents.

Layer 3 canonical model: preserves total committed contract value separately from annual commitment when loading contract records and optimization baselines.

Layer 4 products: prepares Source360, Source workspace, cloud-consumption sourcing cubes, and aVa contract grounding to read the package after an approved data-build job.

## Client Applicability

- All clients: no direct runtime effect before the package is loaded.
- Specific clients: none.
- Internal only: package authoring, local workbook QA, and non-mutating load planning.
- Public/demo only: synthetic demo dataset after governed load approval.
- Feature flag: none.

## Changes Included

Adds a cloud-consumption package builder, synthetic source-file package, governed dataset manifest, workbook previews, non-mutating load-plan proof, loader handling for total committed value fields, normalized `negotiated_improvement` opportunity typing, and retained negotiation detail fields for buyer ask, concession, timing, owner, priority, and risk.

## QA / Validation

- `node scripts/source/load-cloud-consumption-package.mjs --mode=plan --dataset-version=meridian-databricks-consumption-commit-v1-20260908 --package-dir=datasets/source/cloud-consumption/meridian-databricks-consumption-commit-v1-20260908 --proof-dir=datasets/source/cloud-consumption/meridian-databricks-consumption-commit-v1-20260908/qa/plan-proof` — PASS.
- `npm test -- scripts/source/__tests__/load-cloud-consumption-package.test.ts scripts/source/__tests__/load-contract-depth-package.test.ts scripts/source/__tests__/project-contract-depth-package-layer4.test.ts src/lib/source/contract-depth-package/__tests__/adapter.test.ts src/lib/source/contract-depth-package/__tests__/projection.test.ts src/lib/source/data-model/__tests__/read-adapter.contract-optimization.test.ts src/lib/source/facts/view/__tests__/ava-contract-grounding-context.test.ts --runInBand` — PASS.
- `npm run validate:context-corpus:manifests` — PASS.
- `npx eslint scripts/source/load-cloud-consumption-package.mjs scripts/source/build-meridian-databricks-cloud-consumption-package.mjs scripts/source/load-contract-depth-package.ts scripts/source/project-contract-optimization-spine.ts src/lib/source/contract-depth-package/projection.ts src/lib/source/data-model/contract-optimization-opportunity.ts src/lib/source/data-model/read-adapter.ts src/lib/source/facts/view/ava-contract-grounding-context.ts src/lib/source/door1/governed-opportunity-diagnosis.ts src/components/source/SourceOptimizeContractPage.tsx src/app/(maestro)/source/preview/workspace/buildViewModel.ts src/app/(maestro)/source/preview/workspace/canvases/EvidenceLineageGraph.tsx` — PASS.
- `npx tsc --noEmit --pretty false` — PASS.
- `npm run release:check` — PASS.
- Workbook rendered and inspected for Summary, Coverage, Opportunities, Levers, Sources, and Checks tabs.

## Rollout Plan

Merge through PR only. Runtime activation requires an approved Azure Container Apps data-build job to apply Layer 2, Layer 3, and Layer 4 projections, followed by readback and live signed-in Source360/aVa checks.

## Deployment Authority

- Repo-owned deploy workflow: required for web runtime code after merge.
- Shared runtime mutators: not authorized by this release record.
- Approved image digest: not assigned yet.
- ACA runtime invariant: must be proven after any deploy or flag/env update.
- Worker image invariant: required before any mutating data-build job.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for Source360 and aVa contract grounding after data load.

## Rollback Plan

Revert the PR before load, or run the approved data-build rollback/delete procedure for this dataset version if the package has been applied. Web runtime rollback follows the normal ACA digest-pinned rollback path.

## Audit Evidence

Inspect the package README, package manifest, QA plan proof, workbook previews, governance manifest validation output, loader test output, ESLint output, and eventual ACA data-build proof bundle.

## Known Gaps

No mutating data-build job has been run in this task. Source360 browser proof and aVa response proof remain gated on approved Layer 2/3/4 load and deployment.
