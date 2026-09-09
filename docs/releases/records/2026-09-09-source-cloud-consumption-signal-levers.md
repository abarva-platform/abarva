# 2026-09-09-source-cloud-consumption-signal-levers — Source Signal-Stage Contract Levers

## Release ID

`2026-09-09-source-cloud-consumption-signal-levers`

## Status

`candidate`

## Plain-English Summary

Extends the governed synthetic cloud-consumption contract package with two low-confidence optimization signals. The product can now show advisory levers separately from document-evidenced quantified levers, so Source360 and aVa can help an executive ask the right commercial questions without presenting unsupported savings as proven.

## Layer Impact

Affected lanes: `client-data-lane`, `public-demo`.

Layer 1 client intake: updates the synthetic source files, workbook, package manifest, and QA previews for the existing cloud-consumption package.

Layer 2 source adapters: the loader quality gate now validates optional opportunity stage, amount-state, and evidence-grade fields before the data-build job can proceed.

Layer 3 canonical model: optimization opportunities can now preserve signal-stage, range-valued, system-evidenced states from the package instead of being coerced into quantified exact opportunities.

Layer 4 products: Source workspace opportunity cards and aVa contract grounding expose confidence alongside stage and evidence grade.

## Client Applicability

- All clients: no direct runtime effect outside the governed package and shared display logic.
- Specific clients: the synthetic demo tenant package for cloud-consumption contract optimization.
- Internal only: package authoring, local QA, and governed load operations.
- Public/demo only: synthetic demo dataset after governed load approval.
- Feature flag: none.

## Changes Included

Updates the cloud-consumption package builder and loader, the synthetic package source files and workbook previews, the Source workspace view model and contract canvas, the aVa contract grounding context, and loader regression coverage.

## QA / Validation

- `node scripts/source/build-meridian-databricks-cloud-consumption-package.mjs` — PASS.
- `node scripts/source/load-cloud-consumption-package.mjs --mode=plan --dataset-version=meridian-databricks-consumption-commit-v1-20260908 --package-dir=datasets/source/cloud-consumption/meridian-databricks-consumption-commit-v1-20260908 --proof-dir=datasets/source/cloud-consumption/meridian-databricks-consumption-commit-v1-20260908/qa/plan-proof` — PASS.
- Plan readback expectation: 169 Layer 2 rows, 6 optimization opportunities, 20 opportunity-evidence links, 6 Layer 4 cloud opportunity rows.
- `npm test -- scripts/source/__tests__/load-cloud-consumption-package.test.ts src/lib/source/facts/view/__tests__/ava-contract-grounding-context.test.ts src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts src/app/(maestro)/source/preview/workspace/__tests__/ContractCanvas.executive-story.test.tsx --runInBand` — PASS.
- `npx eslint scripts/source/build-meridian-databricks-cloud-consumption-package.mjs scripts/source/load-cloud-consumption-package.mjs scripts/source/__tests__/load-cloud-consumption-package.test.ts src/lib/source/facts/view/ava-contract-grounding-context.ts src/app/(maestro)/source/preview/workspace/buildViewModel.ts src/app/(maestro)/source/preview/workspace/canvases/ContractCanvas.tsx` — PASS.

## Rollout Plan

Merge through PR, deploy the approved main SHA through the repo-owned Azure Container Apps main workflow, prove the digest-pinned runtime invariant, then run the governed ACA data-build job sequence for Layer 2, Layer 3, Layer 4, and Tower bridge projections. After readback, lineage reports, and live signed-in Source360/aVa proof pass, update this record from `candidate` to `live-proven`.

## Deployment Authority

- Repo-owned deploy workflow: required before runtime proof.
- Shared runtime mutators: not authorized outside the repo-owned deploy workflow.
- Approved image digest: pending deployment.
- ACA runtime invariant: required before data-build jobs.
- Worker image invariant: required before data-build jobs.
- Feature/env flag update path: none.
- Live signed-in proof required: Source360, Source workspace, Optimize, and aVa contract grounding.

## Rollback Plan

Before load, revert the PR. After load, re-run the governed package data-build job from the prior package state or execute the approved package-scoped rollback/delete procedure for this dataset version. Web runtime rollback follows the normal ACA digest-pinned rollback path.

## Audit Evidence

Inspect the package README, package manifest, QA plan proof, workbook previews, loader test output, ESLint output, ACA deploy workflow, data-build proof bundles, lineage reports, and live signed-in proof artifacts.

## Known Gaps

The two new opportunities are intentionally low-confidence signal-stage candidates. They require additional enterprise evidence before upgrade: one accepted comparable benchmark for discount-band review and one per-SKU usage comparison for serverless/classic economics. Raw/full vendor contract documents remain outside the public repository.
