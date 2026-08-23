# 2026-08-23-ecl-product-browser-gate-status — ECL Product Browser Gate Status

## Release ID

`2026-08-23-ecl-product-browser-gate-status`

## Status

`candidate`

## Plain-English Summary

Adds the product browser QA gate package to the post-queue local proof chain and exposes it as an operator status denominator. The status report now tracks readiness for Source, Home, Tower, and Intelligence browser QA while still refusing route repointing and browser-live claims.

## Layer Impact

Release lane: `internal-admin`.

No data layer changes. This affects local proof orchestration and status reporting only.

## Client Applicability

- All clients: Not directly active.
- Specific clients: None.
- Internal only: ECL operator progress tracking and browser QA preparation.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Extends `scripts/ecl/run_ecl_dense_azure_gate_local_proof.py` to run the product browser QA gate package and validator.
- Adds `product_browser_qa_gate` to no-stop operator status denominators.
- Updates the operator status validator to require the new denominator.

## QA / Validation

- Pass: `python3 -m py_compile scripts/ecl/run_ecl_dense_azure_gate_local_proof.py scripts/ecl/run_no_stop_execution_queue.py scripts/ecl/validate_ecl_operator_status_report.py`
- Pass: `python3 scripts/ecl/run_no_stop_execution_queue.py`
- Pass: `python3 scripts/ecl/run_ecl_dense_azure_gate_local_proof.py`
- Pass: `python3 scripts/ecl/validate_ecl_operator_status_report.py --allow-in-progress`
- Pass: `npm run release:check`

## Rollout Plan

Merge to main only. Future browser QA still requires explicit authorization to repoint routes, run signed-in browser proof, and claim live product proof.

## Deployment Authority

- Repo-owned deploy workflow: Not used.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not affected.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Not claimed by this release.

## Rollback Plan

Revert this PR to remove the product browser QA gate denominator and post-queue proof extension. No data rollback is required because this release performs no data-plane mutation.

## Audit Evidence

- PR URL.
- Local command output from the QA / Validation section.
- Generated local status and product browser gate artifacts under `outputs/ecl-no-stop-execution-run` and `reports/ecl-product-browser-qa-gate-package-2026-08-23`.

## Known Gaps

- Product route repointing is not authorized or performed.
- Browser/live proof is not captured or claimed.
- Azure lab/preprod load and independent readback remain hard-gated.
