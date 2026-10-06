# 2026-09-08-source-contract-depth-v2-package — Contract Depth V2 Package

## Release ID

`2026-09-08-source-contract-depth-v2-package`

## Status

`live-proven`

## Plain-English Summary

Adds a tenant-scoped synthetic managed-services contract-depth package with richer contract terms, application scope, ticket and SLA evidence, invoice detail, resource model, document/page-text evidence, and Optimize candidate rows. The package is synthetic demo evidence only; it does not represent live-client truth or finance-confirmed realized savings.

## Layer Impact

Release lane: `client-data-lane`

Layer 1: Adds source files and synthetic document artifacts organized as operator evidence for a managed-services contract review.

Layer 2: Produces adapter-preview outputs using the existing contract-depth adapter path and preserves source-file/source-row lineage.

Layer 3: Produces canonical projection-preview outputs for contract, vendor, scope, performance, financial exposure, evidence, and opportunity objects.

Layer 4: Applied and verified through the governed operator ACA job path for the package load run.

Layer 4 update: Serving-view refresh now treats the active contract row as the contract-depth version authority, so rebuilt package rows do not stack with older rows for the same contract.

Tower bridge: Applied and verified into the active Tower assessment context as Source contract-depth candidate rows, value/cost/evidence/risk rows, and cube slices with source references intact.

## Client Applicability

- All clients: No.
- Specific clients: Governed synthetic dataset only.
- Internal only: Operator build and proof flow.
- Public/demo only: Synthetic demo evidence.
- Feature flag: Not applicable.

## Changes Included

- `datasets/source/contract-depth/meridian-laams-new-event-rich-v2-20260908/`
- `docs/governance/dataset-manifests/meridian-laams-new-event-rich-v2-20260908.json`
- `scripts/source/project-contract-depth-package-layer4.ts`

## QA / Validation

- `npx tsx scripts/source/project-contract-depth-package.ts --package-dir=datasets/source/contract-depth/meridian-laams-new-event-rich-v2-20260908` passed.
- Layer 2 adapter preview status: `PASS`.
- Layer 3 projection preview status: `PASS`.
- Package checks include no finance-confirmed realized value, synthetic evidence policy, contract/vendor identity consistency, source-file lineage, and non-empty managed-services evidence coverage.
- Layer 4 serving-view guard added for active contract version scoping.
- ACA Layer 2 apply and Layer 3 apply completed for the governed load run.
- ACA Layer 2/3 verify completed with expected row readbacks.
- ACA Layer 4 apply and Layer 4 verify completed with package-scoped serving readbacks.
- ACA Tower bridge apply and verify completed with projection rows, Tower serving rows, cube slices, and source references reconciled.
- Current governed ACA data-build run `source-contract-depth-package-meridian-laams-new-event-rich-v2-20260908-current-20260909T044757Z` re-applied and verified Layer 2, Layer 3, Layer 4, and Tower bridge projections.
- Current Layer 2/3 readback: 622 adapter rows; 1 contract; 56 terms; 48 application-scope rows; 12 spend observations; 72 performance rows; 5 service-credit rows; 4 opportunities; 45 evidence documents; quality gate `PASS`.
- Current Layer 4 readback: 1 Source Contract360 record; 1 financial-exposure row; 1 operational-performance row; 48 app-scope rows; 12 spend rows; 72 performance rows; 4 opportunities; 45 page-text rows; 12 change orders; 30 resource-role rows; 72 invoice-line rows; 96 batch-operation rows; 4 QBR rows; quality gate `PASS`.
- Current Tower bridge readback: 20 projection rows; 4 recommended-action rows; 4 value-proof rows; 8 cube slices; `source_ref_missing_rows: 0`; quality gate `PASS`.
- Tower fact-lineage report for `meridian-health`: zero conflicts on package-touched metrics.
- Source substrate lineage report for `meridian-health`: zero conflicts and zero source errors; portfolio headline metrics still include report-scope `ABSENT` rows and were not used as contract-specific proof.
- Live signed-in Source workspace proof for `MER-TECH-LAAMS-001` confirmed contract ID, vendor, annual value, actual annual spend, end date, notice window, auto-renewal, evidence posture, Optimize top action, and deterministic opportunity cards.
- Live signed-in aVa proof confirmed the summary and optimization-lever prompts render `MER-TECH-LAAMS-001` without empty-parens or fallback-contract-ID behavior, with the four optimization levers present in a table and supporting charts.

## Rollout Plan

Merged through PR, deployed through the repo-owned Azure Container Apps main workflow, then verified the governed data-build outputs and signed-in product/assistant proof for affected Source and Tower surfaces.

## Deployment Authority

- Repo-owned deploy workflow: Completed before the ACA job sequence.
- Shared runtime mutators: Only the approved repo-owned workflow may shift shared web traffic.
- Approved image digest: `acrabarvalab001.azurecr.io/abarva/web@sha256:e91c0bb1f6f1859511e9d75813877e36d92b8a695558cf625e65b6aa0c9ee4fa`
- ACA runtime invariant: Passed after deployment; the web template image, 100%-traffic revision image, and required worker job images matched the approved digest.
- Worker image invariant: Passed before and after the governed data-build job sequence.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Completed for Source360, Source workspace, Optimize, and aVa contract grounding.

## Rollback Plan

Rollback product code through the prior ACA image digest if any runtime issue appears. Data rollback should be handled by re-running Layer 4/Tower projections against the prior dataset version or filtering this dataset version from the serving views; do not delete data rows without a separate audited cleanup plan.

## Audit Evidence

- Local package: `datasets/source/contract-depth/meridian-laams-new-event-rich-v2-20260908/`
- Local projection command output.
- ACA job proof bundles under `proof/source-laams-rich-v2-azure-load-20260908/` for Layer 2, Layer 3, Layer 2/3 verify, Layer 4 apply/verify, and Tower bridge apply/verify.
- Current Layer 2/3 verify: `/tmp/source-laams-layer23-verify-current-20260909T044757Z/proof/source-contract-depth-package-verify-20260909T045226Z/result.json`
- Current Layer 4 apply: `/tmp/source-laams-layer4-apply-current-20260909T044757Z/proof/source-contract-depth-package-layer4-apply-20260909T045451Z/summary.json`
- Current Layer 4 verify: `/tmp/source-laams-layer4-verify-current-20260909T044757Z/proof/source-contract-depth-package-layer4-verify-20260909T045633Z/summary.json`
- Current Tower bridge apply: `/tmp/tower-source-laams-bridge-apply-current-20260909T044757Z/proof/tower-source-cloud-bridge-apply-20260909T045849Z/summary.json`
- Current Tower bridge verify: `/tmp/tower-source-laams-bridge-verify-current-20260909T044757Z/proof/tower-source-cloud-bridge-verify-20260909T050033Z/summary.json`
- Tower fact lineage: `/tmp/tower-fact-lineage-current-20260909T050812Z.json`
- Source substrate lineage: `/tmp/source-substrate-lineage-current-20260909T052048Z/05-structured-events.json`
- Live aVa proof text: `/tmp/source-contract-live-proof-20260909T0514Z/laams-ava-levers.txt`
- Live aVa proof screenshot: `/tmp/source-contract-live-proof-20260909T0514Z/laams-ava-levers.png`

## Known Gaps

Current contract-depth loaders do not yet ingest raw New Event/RFP/vendor-response files as primary Source Event stage objects. Those files are preserved in the package for the next loader extension and must not be claimed as loaded until separately applied and verified.
