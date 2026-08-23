# 2026-08-23-ecl-source-event-review-projection — ECL Source Event And Approval Projection

## Release ID

`2026-08-23-ecl-source-event-review-projection`

## Status

`candidate`

## Plain-English Summary

Adds a local ECL projection for Source Events and Approvals. The projection shows active review/workflow gates with owners, due dates, reasons, and evidence needed, but does not infer approval or vendor comparison from complete source data.

## Layer Impact

- `global-control-lane`: proof tooling, CI count checks, release tracker, and draft projection DDL only. No product route, shared runtime setting, or browser UI behavior is activated.
- `client-data-lane`: no tenant input mutation, Azure data-plane load, approved migration, or active client replacement. The new rows are generated only in the local proof bundle.
- Layer 1 source room: adds `source_review_queue.csv` as the commercial workflow/review extract.
- Layer 3 review: promotes 10 source review-queue rows into `ecl_review.review_event`.
- Layer 4 products: adds draft projection supply for Source Events and Approvals. Source Compare remains gated until bid-response/evaluation extracts exist.

## Client Applicability

- All clients: No runtime impact.
- Specific clients: None.
- Internal only: Yes, local ECL proof and synthetic fixture scaffolding only.
- Public/demo only: No live demo route change.
- Feature flag: None.

## Changes Included

- Adds `ecl_projection.source_event_workspace` to the draft product projection DDL.
- Adds a tenant-composite unique key to `ecl_review.review_event` so projections can FK to review rows without relying on ID alone.
- Updates the commercial proof builder to emit 10 review events and 10 Source event-workspace projection rows.
- Updates Source 360 page fact contracts from 11 supplied / 3 missing to 13 supplied / 1 missing.
- Updates commercial extraction guidance, product-consumption mapping, field-level lineage, proof-bundle manifest, route-readiness checks, CI count assertions, and execution tracker notes.
- Adds planted negative probes for missing review-event FK and gated event rows without evidence payloads.

## QA / Validation

- Pass: `python3 -m py_compile scripts/ecl/build_commercial_contract_slice.py scripts/ecl/validate_commercial_proof_acceptance.py scripts/ecl/validate_source_360_route_readiness.py scripts/ecl/write_commercial_client_extraction_mapping.py scripts/ecl/write_commercial_field_lineage.py scripts/ecl/write_commercial_product_consumption_mapping.py scripts/ecl/write_commercial_proof_bundle_manifest.py scripts/ecl/write_source_360_page_fact_contract.py`
- Pass: `python3 scripts/ecl/run_commercial_contract_proof.py --out-dir /tmp/ecl-source-events-proof-v2-1787466623`
- Pass: `python3 scripts/ecl/validate_commercial_proof_acceptance.py --out-dir /tmp/ecl-source-events-proof-v2-1787466623`
- Pass: `python3 scripts/ecl/run_no_stop_execution_queue.py`
- Pass: `python3 scripts/ecl/validate_ecl_operator_status_report.py`
- Observed proof: 68 source files, 574 source records, 10 review events, 10 Source event-workspace rows, 5 Events rows, 5 Approvals rows, 10 gated rows, and 0 review-event drift.
- Observed page contract: 14 rows, 13 supplied, 1 missing projection, browser proof not started.
- Observed proof bundle: 31 artifact hashes and 68 source-room hashes.

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

- Local proof output: `/tmp/ecl-source-events-proof-v2-1787466623/commercial_proof_acceptance_summary.json`
- Local DB proof: `/tmp/ecl-source-events-proof-v2-1787466623/commercial_contract_supply_db_proof.txt`
- Source event projection CSV: `/tmp/ecl-source-events-proof-v2-1787466623/source_event_workspace_projection.csv`
- Source page contract summary: `/tmp/ecl-source-events-proof-v2-1787466623/source_360_page_fact_contract_summary.json`

## Known Gaps

- Source Compare remains a missing projection because bid-response, pricing-response, and evaluation-scorecard extracts do not exist yet.
- Product routes are not repointed.
- Browser QA is not started for this projection.
- No Azure data-plane load or migration authorization is included.
