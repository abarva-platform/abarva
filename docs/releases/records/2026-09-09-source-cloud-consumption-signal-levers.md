# 2026-09-09-source-cloud-consumption-signal-levers — Source Signal-Stage Contract Levers

## Release ID

`2026-09-09-source-cloud-consumption-signal-levers`

## Status

`live-proven`

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

Follow-up reconciliation fix: the governed cloud-consumption loader now writes the calculation output key expected by the contract-optimization traceability reader, so persisted opportunity amounts can be reproduced by the Source Optimize value-proof gate.

Follow-up answer-surface fix: the deterministic Source aVa opportunity table now preserves opportunity stage, exact confidence, evidence grade, and blocking gap fields instead of collapsing them into generic state/evidence prose.

Follow-up priority fix: when rich contract opportunity rows and fallback contract-directory rows are both present, Source aVa now prefers the rich rows so confidence, stage, evidence grade, and blocking gaps survive into the live table.

Follow-up context parity fix: Source workspace now enriches fallback contract opportunity directory rows with governed opportunity stage, confidence, evidence grade, blocking gap, owner, and next action fields so aVa receives the same decision metadata that Contract 360 renders.

## QA / Validation

- `node scripts/source/build-meridian-databricks-cloud-consumption-package.mjs` — PASS.
- `node scripts/source/load-cloud-consumption-package.mjs --mode=plan --dataset-version=meridian-databricks-consumption-commit-v1-20260908 --package-dir=datasets/source/cloud-consumption/meridian-databricks-consumption-commit-v1-20260908 --proof-dir=datasets/source/cloud-consumption/meridian-databricks-consumption-commit-v1-20260908/qa/plan-proof` — PASS.
- Plan readback expectation: 169 Layer 2 rows, 6 optimization opportunities, 20 opportunity-evidence links, 6 Layer 4 cloud opportunity rows.
- `npm test -- scripts/source/__tests__/load-cloud-consumption-package.test.ts src/lib/source/facts/view/__tests__/ava-contract-grounding-context.test.ts src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts src/app/(maestro)/source/preview/workspace/__tests__/ContractCanvas.executive-story.test.tsx --runInBand` — PASS.
- `npx eslint scripts/source/build-meridian-databricks-cloud-consumption-package.mjs scripts/source/load-cloud-consumption-package.mjs scripts/source/__tests__/load-cloud-consumption-package.test.ts src/lib/source/facts/view/ava-contract-grounding-context.ts src/app/(maestro)/source/preview/workspace/buildViewModel.ts src/app/(maestro)/source/preview/workspace/canvases/ContractCanvas.tsx` — PASS.
- Follow-up calculation-output-key validation: `node scripts/source/load-cloud-consumption-package.mjs --mode=plan --dataset-version=meridian-databricks-consumption-commit-v1-20260908 --package-dir=datasets/source/cloud-consumption/meridian-databricks-consumption-commit-v1-20260908 --proof-dir=/tmp/source-dbx-calc-key-plan-20260909T1420Z` — PASS; `npx jest --runTestsByPath scripts/source/__tests__/load-cloud-consumption-package.test.ts src/lib/source/data-model/__tests__/contract-optimization-traceability.test.ts src/lib/source/data-model/__tests__/read-adapter.contract-optimization.test.ts --runInBand` — PASS; `npx eslint scripts/source/load-cloud-consumption-package.mjs scripts/source/__tests__/load-cloud-consumption-package.test.ts` — PASS.
- Follow-up Source aVa table-field validation: `npx jest --runTestsByPath src/lib/source/ava/__tests__/source-workspace-visual-answer.test.ts --runInBand` — PASS; `npx eslint src/lib/source/ava/source-workspace-visual-answer.ts src/lib/source/ava/__tests__/source-workspace-visual-answer.test.ts` — PASS.
- Follow-up Source aVa rich-row priority validation: `npx jest --runTestsByPath src/lib/source/ava/__tests__/source-workspace-visual-answer.test.ts --runInBand` — PASS; `npx eslint src/lib/source/ava/source-workspace-visual-answer.ts src/lib/source/ava/__tests__/source-workspace-visual-answer.test.ts` — PASS.
- Follow-up Source workspace aVa context parity validation: `npx jest --runTestsByPath src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts src/lib/source/ava/__tests__/source-workspace-visual-answer.test.ts --runInBand` — PASS.
- Deploy/runtime proof for the live-proven build: repo-owned ACA main deploy workflow `34373355668` completed successfully for SHA `478e295ffe145b8cc52de87c6f4c8641c6802192`; approved image `acrabarvalab001.azurecr.io/abarva/web@sha256:e266ec4d5654511d3e129d4dd9b2e30c684fbda40a4414e2657e05b56091efe2`; active revision `ca-abarva-web-lab-eastus--m478e295f` has 100% traffic; web template, active revision, and required worker jobs all match the approved digest.
- Governed data-build reconciliation for `meridian-databricks-consumption-commit-v1-20260908`: Layer 2 expected/readback 169 rows; Layer 3 expected/readback matched for 169 source snapshots, 1 contract, 1 vendor, 6 optimization opportunities, 6 valuation rows, 6 evidence requirements, and 108 canonical fact assertions; Layer 4 expected/readback matched for Contract 360, vendor portfolio, spend, usage, commitment coverage, resource inventory, tag quality, invoice reconciliation, and 6 cloud opportunity rows.
- Tower bridge reconciliation: Source readback matched expected counts for 1 contract, 6 opportunities, 12 spend months, 48 usage rows, 12 commitment-coverage rows, 12 resource-inventory rows, 12 tag-quality rows, 12 AP reconciliation rows, and 0 missing source refs; Tower bridge produced 30 projection entries, 6 recommended-action rows, 6 value-proof rows, 6 cost-lens rows, 6 evidence rows, 6 risk-lens rows, and 12 cube-slice rows.
- Lineage checks: Source substrate lineage reported no source errors and no conflict groups for the package path; Tower fact-lineage report for the tenant reported no `CONFLICT` metrics.
- Live signed-in proof: Source Workspace and Contract 360 rendered the selected contract, vendor, annual value, actual spend, negotiable opportunity total, 6 deterministic cards, and no conflict marker on the deployed digest. aVa returned a six-row opportunity table with the expected lever amounts, exact confidence values, stage, evidence grade, blocking gap, and next-action metadata.

## Rollout Plan

Completed through PR, deployed the approved main SHA through the repo-owned Azure Container Apps main workflow, proved the digest-pinned runtime invariant, then ran the governed ACA data-build job sequence for Layer 2, Layer 3, Layer 4, and Tower bridge projections. Readback, lineage reports, and live signed-in Source360/aVa proof passed.

## Deployment Authority

- Repo-owned deploy workflow: required before runtime proof.
- Shared runtime mutators: not authorized outside the repo-owned deploy workflow.
- Approved image digest: `sha256:e266ec4d5654511d3e129d4dd9b2e30c684fbda40a4414e2657e05b56091efe2`.
- ACA runtime invariant: passed.
- Worker image invariant: passed.
- Feature/env flag update path: none.
- Live signed-in proof required: Source360, Source workspace, Optimize, and aVa contract grounding.

## Rollback Plan

Before load, revert the PR. After load, re-run the governed package data-build job from the prior package state or execute the approved package-scoped rollback/delete procedure for this dataset version. Web runtime rollback follows the normal ACA digest-pinned rollback path.

## Audit Evidence

Inspect the package README, package manifest, QA plan proof, workbook previews, loader test output, ESLint output, ACA deploy workflow `34373355668`, runtime-invariant proof bundle, governed data-build proof bundles, lineage reports, and live signed-in proof artifacts.

## Known Gaps

The two new opportunities are intentionally low-confidence signal-stage candidates. They require additional enterprise evidence before upgrade: one accepted comparable benchmark for discount-band review and one per-SKU usage comparison for serverless/classic economics. Raw/full vendor contract documents remain outside the public repository.
