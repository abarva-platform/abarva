# 2026-08-23-source-360-page-fact-contract — Source 360 Page Fact Contract

## Release ID

`2026-08-23-source-360-page-fact-contract`

## Status

`candidate`

## Plain-English Summary

Adds a local proof artifact that maps Source 360 page needs to deterministic ECL supply before any product route is repointed. The contract makes clear which Source tabs are supplied by the current commercial projections and which tabs must remain gated until a named builder/projection exists.

## Layer Impact

- `global-control-lane`: proof-runner and local product-readiness artifact behavior only. No product route, shared runtime setting, or browser UI changes are activated.
- `client-data-lane`: no canonical schema, tenant data, source input, migration, or Azure data-plane mutation. The proof runner now routes generated source-room paths consistently when run outside the default output folder.
- Layer 4 products: adds a Source 360 page-level consumption contract only. It does not repoint product routes or change the browser UI.

## Client Applicability

- All clients: no runtime change.
- Specific clients: none.
- Internal only: local ECL proof and product-readiness planning.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/ecl/write_source_360_page_fact_contract.py`
- `scripts/ecl/run_commercial_contract_proof.py`
- `scripts/ecl/validate_commercial_proof_acceptance.py`
- `scripts/ecl/write_commercial_proof_bundle_manifest.py`
- `.github/workflows/ecl-no-stop-data-pipeline.yml`

## QA / Validation

- `python3 scripts/ecl/write_source_360_page_fact_contract.py --out-dir /tmp/ecl-source-page-contract-proof`
  - Passed with 14 rows, 9 supplied rows, 5 missing-projection rows, and 0 issues.
- `python3 scripts/ecl/run_commercial_contract_proof.py --out-dir /tmp/ecl-commercial-source-page-contract-full-proof-3`
  - Passed with disposable Postgres load/readback, acceptance summary, and proof-bundle manifest.
  - Acceptance summary: 0 issues, 55 documents checked, 383 field-lineage rows, 14 Source 360 page-contract rows.
  - Proof manifest: 29 artifact hashes and 67 source-room hashes.

## Rollout Plan

Merge to `main`. This is a local proof/reporting change only; there is no data-plane load, route repoint, feature flag, or product runtime activation in this slice.

## Deployment Authority

- Repo-owned deploy workflow: not required for functionality; any post-merge ACA deploy is the standard main-branch workflow only.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: not claimed in this slice.

## Rollback Plan

Revert the PR. Existing commercial proof artifacts and product routes continue to behave as before.

## Audit Evidence

- Local proof output: `/tmp/ecl-commercial-source-page-contract-full-proof-3/commercial_proof_acceptance_summary.json`
- Local Source page contract: `/tmp/ecl-commercial-source-page-contract-full-proof-3/source_360_page_fact_contract.csv`
- Local proof manifest: `/tmp/ecl-commercial-source-page-contract-full-proof-3/proof_bundle_manifest.json`

## Known Gaps

- Product route repointing remains closed.
- Browser proof remains not started for this Source 360 ECL contract.
- Source tabs for Events, Compare, Value, Approvals, and Sourcing Opportunities are intentionally marked as missing projections until their builders exist.
