# 2026-08-09-source-contract-evidence-portability - Source Contract Evidence Portability

## Release ID

`2026-08-09-source-contract-evidence-portability`

## Status

`candidate`

## Plain-English Summary

This release turns the Source golden-contract evidence loader from a single-package canary into a reusable tenant/package loader, then adds a second synthetic tenant evidence package for two contract families. The evidence package includes source extracts, synthetic PDF artifacts, parsed page/clause rows, four-ledger reconciliation, finance confirmation, and field-level sourcing instructions. The package is generated and validated locally; it is not loaded by this PR.

## Layer Impact

- Release lane: `client-data-lane`
- Client intake: Adds repeatable evidence-package files and sourcing instructions for a second synthetic tenant.
- Source adapters: Parameterizes the contract evidence loader so tenant key, aliases, package directory, dataset id, version, and contract ids are supplied at runtime.
- Canonical model: No canonical schema change.
- Products: Source Contract 360 can consume the same `source.golden_contract_*`, `doc.*`, and `tower.value_claim` projections after the package is loaded by the approved data job.

## Client Applicability

- All clients: Loader portability and package validator are shared tooling.
- Specific clients: One synthetic healthcare tenant package is added for portability proof.
- Internal only: The package remains synthetic demo evidence until an approved operator job loads it.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `scripts/source/load-source-golden-contract-evidence.mjs`
- `scripts/source/build-meridian-contract-evidence-package.mjs`
- `scripts/source/validate-source-contract-evidence-package.mjs`
- `datasets/source/contract-intelligence/meridian-golden-20260809/**`
- `package.json` Source evidence scripts

## QA / Validation

- `node scripts/source/load-source-golden-contract-evidence.mjs | jq '{event, tenant_key, dataset_id, dataset_version, contract_ids, source_rows: .evidence_rows.source_rows}'` passed for the existing default package.
- `npm run source:contract-evidence:meridian:build` passed and generated two-contract evidence package with 592 internally generated evidence rows.
- `node scripts/source/load-source-golden-contract-evidence.mjs --package-dir datasets/source/contract-intelligence/meridian-golden-20260809 --tenant-key meridian_health_global --tenant-alias meridian,meridian-health --dataset-id meridian-source-v1-202608-golden-evidence --dataset-version v1-golden-evidence --contract-id CF-001,CF-003` passed dry-plan mode with 608 CSV rows, 6 PDFs, and 30 PDF extraction rows.
- Independent line-level reconciliation check passed for both selected contract families.
- `npm run source:contract-evidence:meridian:validate` passed with no failures.
- `npx eslint scripts/source/load-source-golden-contract-evidence.mjs scripts/source/build-meridian-contract-evidence-package.mjs scripts/source/validate-source-contract-evidence-package.mjs` passed.

## Rollout Plan

Merge to main through PR. The repo-owned ACA deploy workflow may deploy the code/tooling. The evidence package is not active until the approved Source data job runs `npm run source:contract-evidence:meridian:apply` with proof capture and readback.

## Deployment Authority

- Repo-owned deploy workflow: Required for web/runtime code availability.
- Shared runtime mutators: None in this PR.
- Approved image digest: Determined by ACA deploy workflow after merge.
- ACA runtime invariant: Required before claiming runtime availability.
- Worker image invariant: Required before running the data job.
- Feature/env flag update path: None.
- Live signed-in proof required: Required after data load to prove Contract 360 consumes the second-tenant evidence.

## Rollback Plan

Revert the PR to remove the reusable loader changes and generated package. If the package has already been loaded, run a tenant/dataset-scoped delete for `meridian-source-v1-202608-golden-evidence` through the approved operator path, then verify zero rows for that dataset across `source.golden_contract_*`, `source.contract_pdf_*`, `doc.*`, and associated Tower canary claims.

## Audit Evidence

- PR diff and merge record.
- Local package validator output.
- Loader dry-plan JSON output.
- Operator job proof bundle after apply, if run after merge.
- Signed-in Contract 360 screenshots for the selected second-tenant contract families after apply, if run after merge.

## Known Gaps

The package is generated and validated but not loaded by this PR. Browser proof for the second tenant golden-contract evidence requires an approved post-merge operator job and signed-in runtime verification.
