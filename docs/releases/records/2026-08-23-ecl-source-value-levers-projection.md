# 2026-08-23-ecl-source-value-levers-projection — ECL Source Value Levers Projection

## Release ID

`2026-08-23-ecl-source-value-levers-projection`

## Status

`candidate`

## Plain-English Summary

Adds a local ECL projection for Source value and sourcing-opportunity facts. The projection shows modeled opportunities and blocked value, but keeps claimable value at zero until finance attestation and owner approval exist.

## Layer Impact

- `global-control-lane`: proof tooling, CI count checks, release tracker, and draft projection DDL only. No product route, shared runtime setting, or browser UI behavior is activated.
- `client-data-lane`: no tenant input mutation, Azure data-plane load, approved migration, or active client replacement. The new projection is generated only in the local proof bundle.
- Layer 3 canonical context: no canonical source-of-truth change beyond the existing local proof rows.
- Layer 4 products: adds draft projection supply for Source Value and Sourcing Opportunities. Product routes are not repointed.
- Proof automation: expands the commercial proof bundle, page fact contract, route-readiness guard, and CI count checks.

## Client Applicability

- All clients: No runtime impact.
- Specific clients: None.
- Internal only: Yes, local ECL proof and synthetic fixture scaffolding only.
- Public/demo only: No live demo route change.
- Feature flag: None.

## Changes Included

- Adds `ecl_projection.source_value_levers` to the draft product projection DDL.
- Updates the commercial proof builder to emit 5 Source value-lever rows.
- Updates Source 360 page fact contracts from 9 supplied / 5 missing to 11 supplied / 3 missing.
- Updates commercial product-consumption mapping from 6 to 7 rows.
- Updates field-level lineage to cover Source value-lever fields.
- Updates proof-bundle manifest, acceptance checks, route-readiness checks, CI count assertions, and execution tracker notes.

## QA / Validation

- Pass: `python3 -m py_compile scripts/ecl/build_commercial_contract_slice.py scripts/ecl/validate_commercial_proof_acceptance.py scripts/ecl/write_commercial_field_lineage.py scripts/ecl/write_commercial_product_consumption_mapping.py scripts/ecl/write_commercial_proof_bundle_manifest.py scripts/ecl/write_source_360_page_fact_contract.py scripts/ecl/validate_source_360_route_readiness.py`
- Pass: `python3 scripts/ecl/run_commercial_contract_proof.py --out-dir /tmp/ecl-source-value-levers-proof-v2`
- Observed proof: 5 Source value-lever rows, 5 gated rows, 0 claimable value, 0 primary metric drift, 5 model-inferred benchmark payload rows.
- Observed page contract: 14 rows, 11 supplied, 3 missing projection, browser proof not started.
- Observed proof bundle: 30 artifact hashes and 67 source-room hashes.

## Rollout Plan

Merge through PR to `main`. This is schema-draft and proof-tooling only. No Azure data-plane load, migration application, route repointing, feature flag, or traffic shift is included.

## Deployment Authority

- Repo-owned deploy workflow: May build/deploy the web image after merge if the normal main workflow runs, but the change is dormant proof tooling.
- Shared runtime mutators: None.
- Approved image digest: Not applicable before merge workflow.
- ACA runtime invariant: Required only if the normal repo-owned deployment workflow runs.
- Worker image invariant: Required only if the normal repo-owned deployment workflow runs.
- Feature/env flag update path: None.
- Live signed-in proof required: Not for this dormant proof change. Required before any Source route claims this projection.

## Rollback Plan

Revert the PR. Because no live migration or data-plane load is performed, rollback is code/docs/proof-tooling only.

## Audit Evidence

- Local proof output: `/tmp/ecl-source-value-levers-proof-v2/commercial_proof_acceptance_summary.json`
- Local DB proof: `/tmp/ecl-source-value-levers-proof-v2/commercial_contract_supply_db_proof.txt`
- Source value projection CSV: `/tmp/ecl-source-value-levers-proof-v2/source_value_levers_projection.csv`
- Source page contract summary: `/tmp/ecl-source-value-levers-proof-v2/source_360_page_fact_contract_summary.json`

## Known Gaps

- Events, Compare, and Approvals remain missing projections because sourcing workflow, vendor response, and review-event producers do not exist yet.
- Product routes are not repointed.
- Browser QA is not started for this projection.
- No Azure data-plane load or migration authorization is included.
