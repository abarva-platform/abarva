# 2026-08-23-ecl-source-preview-proof-slices — ECL Source Preview Proof Slices

## Release ID

`2026-08-23-ecl-source-preview-proof-slices`

## Status

`candidate`

## Plain-English Summary

This change turns the next three Source 360 commercial proof slices from named backlog rows into executable local proof commands. The no-stop runner now renders both a healthy contract preview and a deliberately weak contract preview, rejects client-visible builder vocabulary, and runs a stronger grammar gate over generated contract documents.

## Layer Impact

- Layer 2 Source adapters: no client intake or adapter behavior changes.
- Layer 3 Canonical Enterprise Model: no schema, migration, or shared data-plane changes.
- Layer 4 Products: local static Source 360 preview proof only. No product route is repointed.
- Control lane: the local ECL no-stop queue now has ten executable proof slices and one explicit product-route hard gate.

## Client Applicability

- All clients: no runtime behavior change.
- Specific clients: none.
- Internal only: ECL proof automation and synthetic commercial proof artifacts.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `docs/architecture/ecl-no-stop-execution-queue.json`
- `docs/architecture/ECL_NO_STOP_EXECUTION_QUEUE_2026_08_22.md`
- `scripts/ecl/render_source_360_contract_preview.py`
- `scripts/ecl/build_commercial_contract_slice.py`
- `scripts/ecl/validate_commercial_document_quality.py`

## QA / Validation

- `python3 scripts/ecl/run_no_stop_execution_queue.py` passed with `10 / 10` executable slices, `0` queued-for-proof slices, and `1` hard-gated product-route/browser slice.
- Clean-output simulation passed: preflight reported missing generated evidence paths, then the runner generated them and postflight accepted.
- `python3 -m py_compile scripts/ecl/render_source_360_contract_preview.py scripts/ecl/validate_commercial_document_quality.py scripts/ecl/build_commercial_contract_slice.py scripts/ecl/run_no_stop_execution_queue.py scripts/ecl/validate_no_stop_execution_queue.py` passed.
- Static preview QA passed for the healthy contract and the deliberately weak contract.
- Forbidden-language scan over generated static preview HTML and generated contract markdown returned no hits.
- `npm run release:check` passed.

## Rollout Plan

Merge to `main`. The repo-owned ACA deploy workflow may rebuild and deploy the application image after merge, but this change does not activate a new product route or mutate tenant data.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only after merge to `main`.
- Shared runtime mutators: none in this PR.
- Approved image digest: resolved by the deploy workflow if deployed.
- ACA runtime invariant: checked by the deploy workflow if deployed.
- Worker image invariant: checked by the deploy workflow if deployed.
- Feature/env flag update path: none.
- Live signed-in proof required: not for these local proof scripts; required before any product-route claim.

## Rollback Plan

Revert the PR. The change is limited to scripts, docs, and local proof automation; no data-plane rollback is required.

## Audit Evidence

- Local runner output: `outputs/ecl-no-stop-execution-run/execution-summary.json`
- Healthy preview QA: `outputs/ecl-commercial-contract-supply-correction-2026-08-22/source_360_static_preview/mer-ctr-rcm-001-source-360-preview-qa.json`
- Weak preview QA: `outputs/ecl-commercial-contract-supply-correction-2026-08-22/source_360_static_preview/mer-ctr-sso-bpo-001-source-360-preview-qa.json`
- Document grammar summary: `outputs/ecl-commercial-contract-supply-correction-2026-08-22/commercial_document_quality_summary.json`

## Known Gaps

Product route repointing and signed-in browser proof remain hard-gated. Active tenant source replacement, dense document promotion, Azure data-plane mutation, migration execution, and legacy retirement remain out of scope.
