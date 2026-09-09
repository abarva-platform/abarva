# 2026-09-08-source-cloud-consumption-synthetic-contract — Source Cloud Consumption Synthetic Contract Package

## Release ID

`2026-09-08-source-cloud-consumption-synthetic-contract`

## Status

`live-proven`

## Plain-English Summary

Adds a governed synthetic cloud-consumption contract package that can be loaded through the Source data-build path. The package is designed to make a named cloud data-platform vendor contract visible in Source360 with contract terms, commitment economics, monthly usage, evidence references, and candidate optimization opportunities while keeping raw/full vendor contract documents outside the public repository.

## Layer Impact

Affected lanes: `client-data-lane`, `public-demo`.

Layer 1 client intake: adds synthetic source files, synthetic evidence summaries, a governed workbook, package metadata, and package QA proof.

Layer 2 source adapters: tightens the cloud-consumption loader quality gate so opportunity evidence references can resolve to either source rows or declared evidence documents.

Layer 3 canonical model: preserves total committed contract value separately from annual commitment when loading contract records and optimization baselines.

Layer 4 products: prepares Source360, Source workspace, cloud-consumption sourcing cubes, and aVa contract grounding to read the package after an approved data-build job.

## Client Applicability

- All clients: no direct runtime effect outside the governed synthetic package.
- Specific clients: `meridian-health` synthetic demo package.
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
- Governed ACA data-build run `source-cloud-consumption-package-meridian-databricks-consumption-commit-v1-20260908-current-20260909T043545Z` applied Layer 2, Layer 3, Layer 4, and Tower bridge projections with package-scoped readback gates passing.
- Layer 2/3 readback: 167 adapter rows; 1 canonical vendor; 1 canonical contract; 12 spend observations; 4 opportunities; 6 evidence documents; quality gate `PASS`.
- Layer 4 readback: 1 Source Contract360 cloud contract; 12 spend rows; 4 opportunity rows; 48 usage rows; 12 commitment-coverage rows; 12 inventory rows; 12 tag-quality rows; 12 AP reconciliation rows; quality gate `PASS`.
- Tower bridge readback: 20 projection rows; 4 recommended-action rows; 4 value-proof rows; 8 cube slices; `source_ref_missing_rows: 0`; quality gate `PASS`.
- Tower fact-lineage report for `meridian-health`: zero conflicts on package-touched metrics.
- Source substrate lineage report for `meridian-health`: zero conflicts and zero source errors; portfolio headline metrics still include report-scope `ABSENT` rows and were not used as contract-specific proof.
- Live signed-in Source workspace proof for `MER-TECH-DBX-001` confirmed contract ID, vendor, annual value, actual annual spend, end date, notice window, auto-renewal, evidence posture, Optimize top action, and deterministic opportunity cards.
- Live signed-in aVa proof confirmed the summary and optimization-lever prompts render `MER-TECH-DBX-001` without empty-parens or fallback-contract-ID behavior, with the four optimization levers present in a table and supporting charts.

## Rollout Plan

Merged through PR and deployed through the repo-owned Azure Container Apps main workflow. Runtime activation was completed through governed ACA data-build jobs for Layer 2, Layer 3, Layer 4, and Tower bridge projections, followed by package readback and live signed-in Source360/aVa checks.

## Deployment Authority

- Repo-owned deploy workflow: completed.
- Shared runtime mutators: not authorized by this release record outside the governed ACA job path.
- Approved image digest: `acrabarvalab001.azurecr.io/abarva/web@sha256:e91c0bb1f6f1859511e9d75813877e36d92b8a695558cf625e65b6aa0c9ee4fa`
- ACA runtime invariant: passed after deployment; the web template image, 100%-traffic revision image, and required worker job images matched the approved digest.
- Worker image invariant: passed before and after the governed data-build job sequence.
- Feature/env flag update path: none.
- Live signed-in proof required: completed for Source360, Source workspace, Optimize, and aVa contract grounding.

## Rollback Plan

Revert the PR before load, or run the approved data-build rollback/delete procedure for this dataset version if the package has been applied. Web runtime rollback follows the normal ACA digest-pinned rollback path.

## Audit Evidence

Inspect the package README, package manifest, QA plan proof, workbook previews, governance manifest validation output, loader test output, ESLint output, ACA data-build proof bundles, lineage reports, and live signed-in proof artifacts.

Current run proof:

- Layer 2 apply: `/tmp/source-dbx-layer2-apply-current-20260909T043545Z/proof/source-cloud-consumption-package-apply-layer2-20260909T043634Z/summary.json`
- Layer 3 apply: `/tmp/source-dbx-layer3-apply-current-20260909T043545Z/proof/source-cloud-consumption-package-apply-layer3-20260909T043822Z/summary.json`
- Layer 2/3 verify: `/tmp/source-dbx-layer23-verify-current-20260909T043545Z-after-apply/proof/source-cloud-consumption-package-verify-20260909T044003Z/summary.json`
- Layer 4 apply: `/tmp/source-dbx-layer4-apply-current-20260909T043545Z/proof/source-cloud-consumption-package-apply-layer4-20260909T044147Z/summary.json`
- Layer 4 verify: `/tmp/source-dbx-layer4-verify-current-20260909T043545Z/proof/source-cloud-consumption-package-verify-layer4-20260909T044336Z/summary.json`
- Tower bridge apply: `/tmp/tower-source-dbx-bridge-apply-current-20260909T043545Z/proof/tower-source-cloud-bridge-apply-20260909T044522Z/summary.json`
- Tower bridge verify: `/tmp/tower-source-dbx-bridge-verify-current-20260909T043545Z/proof/tower-source-cloud-bridge-verify-20260909T044704Z/summary.json`
- Tower fact lineage: `/tmp/tower-fact-lineage-current-20260909T050812Z.json`
- Source substrate lineage: `/tmp/source-substrate-lineage-current-20260909T052048Z/05-structured-events.json`
- Live aVa proof text: `/tmp/source-contract-live-proof-20260909T0514Z/databricks-ava-levers.txt`
- Live aVa proof screenshot: `/tmp/source-contract-live-proof-20260909T0514Z/databricks-ava-levers.png`

## Known Gaps

Raw/full vendor contract documents remain outside the public repository and must stay in the local restricted evidence lane unless a separate governed intake process approves a sanitized derivative. The package is synthetic demo evidence only; values are candidate optimization signals, not finance-confirmed realized savings. Source substrate lineage has no conflicts, but some portfolio headline rows remain `ABSENT` by report scope; contract-specific readiness is established by the package readback and live Source/aVa proof above.
