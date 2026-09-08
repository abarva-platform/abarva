# 2026-09-08-source-contract-depth-v2-package — Contract Depth V2 Package

## Release ID

`2026-09-08-source-contract-depth-v2-package`

## Status

`candidate`

## Plain-English Summary

Adds a tenant-scoped synthetic managed-services contract-depth package with richer contract terms, application scope, ticket and SLA evidence, invoice detail, resource model, document/page-text evidence, and Optimize candidate rows. The package is synthetic demo evidence only; it does not represent live-client truth or finance-confirmed realized savings.

## Layer Impact

Release lane: `client-data-lane`

Layer 1: Adds source files and synthetic document artifacts organized as operator evidence for a managed-services contract review.

Layer 2: Produces adapter-preview outputs using the existing contract-depth adapter path and preserves source-file/source-row lineage.

Layer 3: Produces canonical projection-preview outputs for contract, vendor, scope, performance, financial exposure, evidence, and opportunity objects.

Layer 4: Candidate only until the package is deployed in the ACA image and applied through the governed operator job path.

Layer 4 update: Serving-view refresh now treats the active contract row as the contract-depth version authority, so rebuilt package rows do not stack with older rows for the same contract.

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

## Rollout Plan

Merge through PR, deploy the repo-owned Azure Container Apps main workflow, then run the approved operator ACA job sequence for this dataset version: Layer 2 apply, Layer 3 apply, Layer 2/3 verify, Layer 4 apply, Layer 4 verify, document evidence apply if required, Tower bridge apply, Tower bridge verify, and signed-in product/aVa proof.

## Deployment Authority

- Repo-owned deploy workflow: Required before the ACA job can see this package.
- Shared runtime mutators: Only the approved repo-owned workflow may shift shared web traffic.
- Approved image digest: To be captured from the deploy workflow.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Not changed by this release.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes.

## Rollback Plan

Rollback product code through the prior ACA image digest if any runtime issue appears. Data rollback should be handled by re-running Layer 4/Tower projections against the prior dataset version or filtering this dataset version from the serving views; do not delete data rows without a separate audited cleanup plan.

## Audit Evidence

- Local package: `datasets/source/contract-depth/meridian-laams-new-event-rich-v2-20260908/`
- Local projection command output.
- Future ACA job proof bundles for Layer 2, Layer 3, Layer 4, Tower bridge, and signed-in product proof.

## Known Gaps

Current contract-depth loaders do not yet ingest raw New Event/RFP/vendor-response files as primary Source Event stage objects. Those files are preserved in the package for the next loader extension and must not be claimed as loaded until separately applied and verified.
