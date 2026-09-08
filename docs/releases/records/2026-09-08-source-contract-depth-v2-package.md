# 2026-09-08-source-contract-depth-v2-package — Contract Depth V2 Package

## Release ID

`2026-09-08-source-contract-depth-v2-package`

## Status

`data-plane-verified`

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

## Rollout Plan

Merge through PR, deploy the repo-owned Azure Container Apps main workflow, then run or re-run the signed-in product and assistant proof for affected Source and Tower surfaces.

## Deployment Authority

- Repo-owned deploy workflow: Completed before the ACA job sequence.
- Shared runtime mutators: Only the approved repo-owned workflow may shift shared web traffic.
- Approved image digest: `acrabarvalab001.azurecr.io/abarva/web@sha256:2eb6b33cce7e18381b73acb0fddd3d205cc0f358f6f705964af721ab8d5f06f6`
- ACA runtime invariant: Passed for the deployed web runtime before the final Layer 4 and Tower bridge jobs.
- Worker image invariant: Not changed by this release.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes; blocked if the available browser session is signed into the wrong tenant.

## Rollback Plan

Rollback product code through the prior ACA image digest if any runtime issue appears. Data rollback should be handled by re-running Layer 4/Tower projections against the prior dataset version or filtering this dataset version from the serving views; do not delete data rows without a separate audited cleanup plan.

## Audit Evidence

- Local package: `datasets/source/contract-depth/meridian-laams-new-event-rich-v2-20260908/`
- Local projection command output.
- ACA job proof bundles under `proof/source-laams-rich-v2-azure-load-20260908/` for Layer 2, Layer 3, Layer 2/3 verify, Layer 4 apply/verify, and Tower bridge apply/verify.
- Signed-in product proof remains a separate gate from data-plane verification.

## Known Gaps

Current contract-depth loaders do not yet ingest raw New Event/RFP/vendor-response files as primary Source Event stage objects. Those files are preserved in the package for the next loader extension and must not be claimed as loaded until separately applied and verified.
