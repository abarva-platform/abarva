# 2026-08-23-ecl-product-browser-qa-gate — ECL Product Browser QA Gate

## Release ID

`2026-08-23-ecl-product-browser-qa-gate`

## Status

`candidate`

## Plain-English Summary

Adds a future browser QA gate package for Source, Home, Tower, and Intelligence. The package records the route-level acceptance criteria and proof artifacts required before any page can claim ECL-backed browser proof, while explicitly refusing route repointing and browser-live claims in this release.

## Layer Impact

Release lane: `internal-admin`.

No data layer changes. This affects local gate preparation for future product browser QA only.

## Client Applicability

- All clients: Not directly active.
- Specific clients: None.
- Internal only: ECL product QA and operator proof preparation.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds `scripts/ecl/write_ecl_product_browser_qa_gate_package.py`.
- Adds `scripts/ecl/validate_ecl_product_browser_qa_gate_package.py`.
- Adds npm scripts for product browser QA gate package generation and validation.

## QA / Validation

- Pass: `python3 -m py_compile scripts/ecl/write_ecl_product_browser_qa_gate_package.py scripts/ecl/validate_ecl_product_browser_qa_gate_package.py`
- Pass: `python3 scripts/ecl/run_no_stop_execution_queue.py`
- Pass: `python3 scripts/ecl/run_ecl_dense_azure_gate_local_proof.py`
- Pass: `npm run ecl:product-browser-qa-gate:package`
- Pass: `npm run ecl:product-browser-qa-gate:validate`
- Pass: `npm run release:check`

## Rollout Plan

Merge to main only. The future route/browser QA gate still requires explicit authorization to repoint routes or claim live browser proof.

## Deployment Authority

- Repo-owned deploy workflow: Not used.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not affected.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Not claimed by this release.

## Rollback Plan

Revert this PR to remove the browser QA gate package scripts and npm entries. No data rollback is required because this release performs no data-plane mutation.

## Audit Evidence

- PR URL.
- Local command output from the QA / Validation section.
- Generated local gate artifacts under `reports/ecl-product-browser-qa-gate-package-2026-08-23`.

## Known Gaps

- Product route repointing is not authorized or performed.
- Browser/live proof is not captured or claimed.
- Azure lab/preprod load and independent readback remain hard-gated.
