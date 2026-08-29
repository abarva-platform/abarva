# 2026-08-29-source-contract-depth-evidence-coverage - Contract Depth Evidence Coverage

## Release ID

`2026-08-29-source-contract-depth-evidence-coverage`

## Status

`candidate`

## Plain-English Summary

This candidate deepens the governed contract-depth package so product surfaces can show contract evidence coverage instead of only contract header, spend, SLA, and opportunity rows. It adds change-order rows, searchable contract page text, and deterministic fact assertions that let Source explain document coverage and recurring change-order exposure without asking an AI model to calculate those values.

## Layer Impact

Release lane: `client-data-lane`.

Layer 1 - Client intake: Adds source-file tabs for change-order ledgers and contract page text. The workbook/source-file package now carries plain-English evidence rows that operators can inspect before loading.

Layer 2 - Source adapters: Adds named adapter outputs for change orders and contract page text, with quality-gate checks for tenant, version, source document lineage, synthetic-only policy, and evidence-row references.

Layer 3 - Canonical model: Loads the new families through `source.source_record_snapshot` and deterministic `source.canonical_fact_assertion` rows. The new facts include page-text character counts, annualized change-order spend, recurring change-order spend, change-order counts, and conservative recurring avoidable percentage assumptions that remain unconfirmed.

Layer 4 - Products: Extends the Source overlay projection with additive `source.contract_360` and `consumption.sourcing_contract_v1` fields for document page text and change-order exposure.

## Client Applicability

- All clients: No.
- Specific clients: One synthetic/demo contract-depth package only.
- Internal only: Operator loaders, quality gates, and proof outputs.
- Public/demo only: Yes, for governed synthetic demonstration data.
- Feature flag: None.

## Changes Included

- Added `change_orders.csv` and `contract_page_text.csv` to the package source files.
- Extended the evidence manifest with change-order ledger evidence documents.
- Added one not-finance-confirmed change-order candidate opportunity.
- Updated `src/lib/source/contract-depth-package/adapter.ts`.
- Updated `src/lib/source/contract-depth-package/projection.ts`.
- Updated `scripts/source/project-contract-depth-package.ts`.
- Updated `scripts/source/load-contract-depth-package.ts`.
- Updated `scripts/source/project-contract-depth-package-layer4.ts`.
- Updated focused Source package and loader tests.

## QA / Validation

- `tsx scripts/source/project-contract-depth-package.ts --package-dir=datasets/source/contract-depth/meridian-contract-depth-v1-20260828 --out-dir=/tmp/source-depth-doc-gap-projection --adapter-out-dir=/tmp/source-depth-doc-gap-adapter` - PASS.
- Projection preview expected 342 Layer 2 adapter rows, 30 evidence documents, 30 page-text rows, 8 change-order rows, and 6 opportunities - PASS.
- `tsx scripts/source/load-contract-depth-package.ts --mode=plan --package-dir=datasets/source/contract-depth/meridian-contract-depth-v1-20260828 --proof-dir=/tmp/source-depth-doc-gap-layer23-plan` - PASS.
- `jest src/lib/source/contract-depth-package/__tests__/adapter.test.ts src/lib/source/contract-depth-package/__tests__/projection.test.ts --runInBand` - PASS.
- `jest scripts/source/__tests__/load-contract-depth-package.test.ts scripts/source/__tests__/project-contract-depth-package-layer4.test.ts --runInBand` - PASS.

## Rollout Plan

1. Merge by PR only.
2. Let the repo-owned ACA main deploy workflow build and deploy the web/runtime image.
3. Run the contract-depth data-build ACA Job in Layer 2 mode with the new package hash and idempotency key.
4. Run the same job in Layer 3 mode only after Layer 2 readback matches the 342-row adapter expectation.
5. Run the Layer 4 overlay refresh only after Layer 3 readback proves the new page-text and change-order fact counts.
6. Capture signed-in product proof for the affected Source workspace and contract-detail screens.

## Deployment Authority

- Repo-owned deploy workflow: Required for runtime scripts and product projection code.
- Shared runtime mutators: Not allowed outside the repo-owned ACA deployment workflow.
- Approved image digest: To be recorded by the ACA main deploy workflow.
- ACA runtime invariant: Required before live-proof claims.
- Worker image invariant: Required before running the data-build job.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR and redeploy the previous ACA image through the repo-owned workflow. If data was already loaded, rerun the Layer 4 overlay using the prior known-good load run or remove the overlay activation for this package run; do not delete source-layer evidence rows without a separate data-retention decision.

## Audit Evidence

- PR diff for this release record and the contract-depth package code/data files.
- Package projection preview output showing adapter and projection quality gates.
- Layer 2/3 loader plan output showing the new package hash and 342 expected adapter rows.
- Future ACA data-build job proof bundle for Layer 2, Layer 3, and Layer 4.
- Future signed-in browser proof for Source and contract-detail surfaces.

## Known Gaps

This candidate does not apply the Azure data-build job, refresh production cubes, or prove signed-in UI behavior by itself. Those steps remain required before calling the data live.
