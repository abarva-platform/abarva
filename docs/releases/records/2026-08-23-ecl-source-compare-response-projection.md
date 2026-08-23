# 2026-08-23-ecl-source-compare-response-projection — ECL Source Compare Response Projection

## Release ID

`2026-08-23-ecl-source-compare-response-projection`

## Status

`candidate`

## Plain-English Summary

Adds a local ECL proof slice for Source Compare using submitted vendor-response data instead of synthetic market benchmarks. The commercial source-room proof now includes response tracker, pricing response lines, and evaluation scorecard extracts, then projects three Compare rows for Source 360 with vendor, rank, price delta, score, exceptions, source basis, and an explicit award-approval boundary.

## Layer Impact

- Layer 1 Client Intake: adds three proof-only source-room extracts for vendor response, pricing response lines, and scorecard facts.
- Layer 2 Source Adapters: extends the commercial proof builder to map those extracts into ECL objects, review events, and projection rows.
- Layer 3 Canonical Model: no migration apply and no Azure data-plane mutation. Candidate bidder vendors are represented as local proof objects only.
- Layer 4 Products: Source 360 page contract now has all 14 deterministic page facts supplied locally; the live Source route is not repointed.

## Client Applicability

- All clients: no runtime behavior change.
- Specific clients: none.
- Internal only: local proof tooling and architecture documentation.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/ecl/build_commercial_contract_slice.py`
- `scripts/ecl/validate_commercial_proof_acceptance.py`
- `scripts/ecl/validate_source_360_route_readiness.py`
- `scripts/ecl/write_commercial_client_extraction_mapping.py`
- `scripts/ecl/write_commercial_field_lineage.py`
- `scripts/ecl/write_commercial_product_consumption_mapping.py`
- `scripts/ecl/write_source_360_page_fact_contract.py`
- `docs/architecture/sql-drafts/ecl_product_projection_tables_v1_draft.sql`
- `.github/workflows/ecl-no-stop-data-pipeline.yml`

## QA / Validation

- Pass: `python3 -m py_compile ...`
- Pass: `python3 scripts/ecl/run_commercial_contract_proof.py --out-dir /tmp/ecl-source-compare-proof-v3`
- Pass: `python3 scripts/ecl/validate_commercial_proof_acceptance.py --out-dir /tmp/ecl-source-compare-proof-v3`
- Pass: `python3 scripts/ecl/run_no_stop_execution_queue.py`
- Pass: `python3 scripts/ecl/validate_ecl_operator_status_report.py`
- Pass: `npm run release:check -- --base origin/main --head HEAD`
- Pass: `git diff --check`

## Rollout Plan

Merge to main only after local proof and PR checks pass. This release is proof tooling and documentation; it does not load Azure, apply migrations, mutate active tenant inputs, repoint product routes, or claim browser-live proof.

## Deployment Authority

- Repo-owned deploy workflow: main merge may trigger the standard ACA workflow, but this change has no runtime adoption path.
- Shared runtime mutators: none.
- Approved image digest: not applicable before merge/deploy.
- ACA runtime invariant: not applicable to local proof output.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: required before any future Source route repointing; not claimed here.

## Rollback Plan

Revert the PR. Since no database migration, Azure data-plane load, active tenant replacement, or product route repointing is performed, rollback is code/documentation only.

## Audit Evidence

- Local commercial proof acceptance summary.
- Local disposable Postgres DB proof.
- Source 360 route-readiness summary.
- No-stop execution queue output.
- PR checks and release check.

## Known Gaps

Source route repointing, deployed runtime proof, and signed-in browser QA remain closed gates for a later slice.
