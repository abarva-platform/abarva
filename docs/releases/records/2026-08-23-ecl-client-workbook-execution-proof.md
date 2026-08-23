# 2026-08-23-ecl-client-workbook-execution-proof — ECL Client Workbook Execution Proof

## Release ID

`2026-08-23-ecl-client-workbook-execution-proof`

## Status

`candidate`

## Plain-English Summary

This change turns the product-first ECL intake plan into a practical local workbook-execution proof. It generates one folder per business-facing workbook, with a readable HTML guide, field guide, prefilled example rows, source-extract recipes, and product-consumption mapping. A validator rejects thin examples, missing partial-intake behavior, missing product coverage, missing folder files, and overcollection language.

## Layer Impact

- Layer 1 Client Intake: local proof package only. No active client workbook package is replaced.
- Layer 2 Source Adapters: no adapter behavior changes.
- Layer 3 Canonical Enterprise Model: no schema, migration, or data-plane change.
- Layer 4 Products: product needs are mapped to workbook folders as planning evidence only. No route is repointed.
- Control lane: the no-stop queue adds workbook package build and validation slices.

## Client Applicability

- All clients: no runtime behavior change.
- Specific clients: none.
- Internal only: ECL workbook execution planning and validation.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/ecl/build_ecl_client_workbook_execution_package.py`
- `scripts/ecl/validate_ecl_client_workbook_execution_package.py`
- `docs/architecture/ecl-no-stop-execution-queue.json`
- `docs/architecture/ECL_NO_STOP_EXECUTION_QUEUE_2026_08_22.md`
- `.github/workflows/ecl-no-stop-data-pipeline.yml`

## QA / Validation

- Pass: `python3 scripts/ecl/build_ecl_client_workbook_execution_package.py`
- Pass: `python3 scripts/ecl/validate_ecl_client_workbook_execution_package.py`
- Pass: `python3 scripts/ecl/run_no_stop_execution_queue.py`
- Pass: `python3 -m py_compile` for the new scripts and queue runner scripts.
- Pass: `npm run release:check`

## Rollout Plan

Merge to `main`. The repo-owned ACA deploy workflow may rebuild and deploy the application image after merge, but this change does not activate a product route, mutate tenant data, or upload workbook packages.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only after merge to `main`.
- Shared runtime mutators: none in this PR.
- Approved image digest: resolved by the deploy workflow if deployed.
- ACA runtime invariant: checked by the deploy workflow if deployed.
- Worker image invariant: checked by the deploy workflow if deployed.
- Feature/env flag update path: none.
- Live signed-in proof required: required before any product-route claim, not for these local planning artifacts.

## Rollback Plan

Revert the PR. No workbook package, tenant input, database, route, migration, or runtime rollback is required.

## Audit Evidence

- Workbook package summary: `outputs/ecl-client-workbook-execution-2026-08-23/workbook_execution_package_summary.json`
- Workbook package validation: `outputs/ecl-client-workbook-execution-2026-08-23/workbook_execution_package_validation_summary.json`
- No-stop queue run: `outputs/ecl-no-stop-execution-run/execution-summary.json`

## Known Gaps

Client-facing workbook package replacement, dense synthetic source promotion, active tenant input replacement, Azure data-plane mutation, migration execution, product route repointing, and legacy retirement remain hard-gated and out of scope.
