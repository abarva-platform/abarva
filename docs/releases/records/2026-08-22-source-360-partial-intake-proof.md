# 2026-08-22-source-360-partial-intake-proof — Source 360 Partial Intake Proof

## Release ID

`2026-08-22-source-360-partial-intake-proof`

## Status

`candidate`

## Plain-English Summary

Adds local proof tooling for Source 360 contract and vendor projections. The proof now covers both a fully supplied local commercial source room and a partial-intake scenario where a required operational extract is missing. Missing evidence is carried forward as an explicit gap and rendered as unavailable, not as zero or as a silent blank.

## Layer Impact

Release lane: `internal-admin`.

Layer 2 source adapters: adds local validation tooling around commercial source-room inputs and partial-intake gap handling.

Layer 4 products: adds static Source 360 preview generation from local projection CSVs. This is proof tooling only; it does not repoint a product route.

## Client Applicability

- All clients: none directly.
- Specific clients: none.
- Internal only: Source 360 local proof and validation workflow.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/ecl/build_commercial_contract_slice.py` now emits local projection CSVs for Source Contract 360, Source Vendor 360, and Tower command-center rows alongside the SQL proof artifact.
- `scripts/ecl/build_source_360_partial_intake_proof.py` creates a named partial-intake proof with an explicit gap register.
- `scripts/ecl/render_source_360_contract_preview.py` renders a static Source 360 contract preview and validates visible page content.

## QA / Validation

- `python3 scripts/ecl/run_commercial_contract_proof.py` passed with disposable local Postgres proof.
- `python3 scripts/ecl/build_source_360_partial_intake_proof.py` passed with `5 / 5` contract rows, `5 / 5` vendor rows, `55 / 55` document-quality pass, `15 / 44` scope links resolved, and `29` required scope additions recorded.
- `python3 scripts/ecl/render_source_360_contract_preview.py --out-dir outputs/ecl-commercial-contract-supply-correction-2026-08-22` passed with zero visible snake-case hits.
- `python3 scripts/ecl/render_source_360_contract_preview.py --out-dir outputs/source-360-partial-intake-proof-2026-08-22` passed with zero visible snake-case hits and missing SLA evidence rendered as unavailable.
- `python3 -m py_compile scripts/ecl/build_commercial_contract_slice.py scripts/ecl/render_source_360_contract_preview.py scripts/ecl/build_source_360_partial_intake_proof.py scripts/ecl/validate_commercial_source_room.py scripts/ecl/run_commercial_contract_proof.py` passed.

## Rollout Plan

Merge to main as local proof tooling only. No Azure load, no migration, no runtime route repointing, no feature flag, and no traffic change.

## Deployment Authority

- Repo-owned deploy workflow: not applicable.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: not for this local proof candidate; required before any product route claim.

## Rollback Plan

Revert the PR that adds these proof scripts. Generated `outputs/` artifacts are local and are not required for runtime rollback.

## Audit Evidence

- Local full proof output: `outputs/ecl-commercial-contract-supply-correction-2026-08-22/commercial_proof_run_summary.json`.
- Local partial proof output: `outputs/source-360-partial-intake-proof-2026-08-22/source_360_partial_intake_summary.json`.
- Static preview QA outputs under each proof directory's `source_360_static_preview/`.

## Known Gaps

- Browser proof remains not started.
- Product route repointing remains out of scope.
- Partial-intake proof models one missing extract; additional missing-owner and delayed-file scenarios should be added as Source 360 expands.
