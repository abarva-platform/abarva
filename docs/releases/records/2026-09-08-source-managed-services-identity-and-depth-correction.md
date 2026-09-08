# 2026-09-08-source-managed-services-identity-and-depth-correction — Source Managed Services Identity and Depth Correction

## Release ID

`2026-09-08-source-managed-services-identity-and-depth-correction`

## Status

`candidate`

## Plain-English Summary

Corrects a synthetic managed-services contract-depth package so the contract, evidence, and action rows use the selected incumbent vendor identity consistently. The package also gains the missing source-system depth required by the governed loader: resource model, pricing bridge, invoice line detail, batch/job volumetrics, and QBR scorecards. The change preserves candidate-only value posture; no realized savings are created.

## Layer Impact

Layer 1 client intake: updates the synthetic source files for one managed-services package and adds the missing source-system extracts for resource, pricing, invoice, operational, and QBR evidence.

Layer 2 source adapters: increases the package adapter row set from the thin shape to the full gated shape, with deterministic vendor identity and CSV-safe legal-name handling.

Layer 3 canonical model: requires a digest-pinned ACA data-build job rerun so canonical contract, vendor-linked facts, document text, optimization, calculation, evidence, and fact-assertion rows are updated from the corrected source package.

Layer 4 products: requires a Layer 4 projection refresh so Source 360, Contract 360, Optimize, aVa grounding, and the Tower bridge no longer surface the retired package vendor identity and can read the added depth rows.

Release lane: `client-data-lane` for synthetic reference data and Source/Tower projections.

## Client Applicability

- All clients: No.
- Specific clients: Composite reference tenant only.
- Internal only: Yes, for demo/reference data operations.
- Public/demo only: Yes.
- Feature flag: Existing Source/Tower product routing only; no new feature flag.

## Changes Included

- `datasets/source/contract-depth/meridian-managed-services-depth-v1-20260907/source-files/*`
- `scripts/source/__tests__/managed-services-package-identity.test.ts`
- This release record.

## QA / Validation

Candidate validation before PR:

- `pass` — contract-depth package plan gate for the managed-services package. Adapter quality gate passed with 249 Layer 2 rows: 1 contract, 8 clauses, 5 change orders, 12 page-text rows, 5 application rows, 5 scope rows, 12 spend rows, 48 ticket-volume rows, 12 performance rows, 11 resource-model rows, 7 pricing-bridge rows, 50 invoice-line rows, 60 batch/job rows, 4 QBR rows, 3 optimization rows, and 6 evidence-document rows.
- `pass` — source arithmetic reconciliation: 12 invoice-month totals match the 12 monthly spend rows, actual spend totals `$12.546M`, resource model totals 93 FTE with 9 onshore / 84 offshore and `$11.88M` billed base.
- `pass` — page-text hash reconciliation for all 12 document text rows.
- `pass` — focused tests for managed-services package identity, contract-depth loader guardrails, and Layer 4 projection guardrails.

Required after merge/deploy:

- Layer 2 ACA apply and verify proof for the corrected package.
- Layer 3 ACA apply and verify proof for the corrected package.
- Document-evidence ACA apply proof for the corrected package.
- Source Layer 4 ACA apply and verify proof for the corrected package.
- Tower bridge apply and verify proof for the corrected package.
- Signed-in product proof showing the corrected vendor identity and no retired vendor literal in Source 360/Optimize/aVa payloads.

## Rollout Plan

Merge via PR. The repo-owned Azure Container Apps main deploy workflow builds and deploys the approved image. Data activation then runs through digest-pinned ACA Jobs using the existing contract-depth package scripts, document-evidence companion loader, Source Layer 4 projection script, and Tower bridge script with package-specific environment overrides.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None outside the repo-owned ACA deploy workflow.
- Approved image digest: Captured after ACA main deploy.
- ACA runtime invariant: Required before data jobs.
- Worker image invariant: Required before data jobs.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

If validation fails before product proof, stop before product-surface use and run a reviewed cleanup/correction job scoped only to this dataset version/load run. If the web image regresses, roll back via the repo-owned ACA main deploy lane. Do not delete broad tenant data or shared projections outside a targeted follow-up data job.

## Audit Evidence

- PR URL: to be filled.
- Main deploy run: to be filled.
- ACA data-job proof bundles: to be filled.
- Signed-in Source/aVa proof: to be filled.

## Known Gaps

Live Azure data-build proof and signed-in product proof are pending for this candidate.
