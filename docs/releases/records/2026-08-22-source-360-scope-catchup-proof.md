# 2026-08-22-source-360-scope-catchup-proof — Source 360 Scope Catch-Up Proof

## Release ID

`2026-08-22-source-360-scope-catchup-proof`

## Status

`candidate`

## Plain-English Summary

Adds local proof tooling for Source 360 scope catch-up. The proof starts from a partial commercial source-room run where contract scope names are present but the dense application inventory is not complete. It then declares the missing application objects in a local overlay and proves reconciliation can catch up from `15 / 44` resolved scope links to `44 / 44`, without rewriting older intake files or pretending missing objects were already present.

## Layer Impact

Release lane: `internal-admin`.

Layer 2 source adapters: adds local validation tooling that turns recorded contract-scope gaps into a dense application overlay for proof purposes.

Layer 4 products: reuses the static Source 360 preview proof to validate that the catch-up state renders as complete and does not expose builder vocabulary. This does not repoint a product route.

## Client Applicability

- All clients: none directly.
- Specific clients: none.
- Internal only: Source 360 local proof and validation workflow.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/ecl/build_source_360_scope_catchup_proof.py` creates a local dense-scope application overlay from recorded required additions and proves scope reconciliation catches up.
- Local proof artifacts are generated under `outputs/source-360-scope-catchup-proof-2026-08-22/` when the script is run.

## QA / Validation

- `python3 scripts/ecl/run_commercial_contract_proof.py` passed with disposable local Postgres proof.
- `python3 scripts/ecl/build_source_360_scope_catchup_proof.py` passed with `29` dense-scope application rows declared, scope resolution moving from `15 / 44` to `44 / 44`, and `0` required additions remaining.
- `python3 scripts/ecl/render_source_360_contract_preview.py --out-dir outputs/source-360-scope-catchup-proof-2026-08-22` passed with `44 / 44` scope links resolved, selected contract scope `12 / 12`, `0` dense additions remaining, and zero visible snake-case hits.
- `python3 -m py_compile scripts/ecl/build_source_360_scope_catchup_proof.py scripts/ecl/render_source_360_contract_preview.py scripts/ecl/run_commercial_contract_proof.py` passed.

## Rollout Plan

Merge to main as local proof tooling only. No Azure load, no migration, no active tenant input mutation, no old intake-file rewrite, no runtime route repointing, no feature flag, and no traffic change.

## Deployment Authority

- Repo-owned deploy workflow: not applicable.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: not for this local proof candidate; required before any product route claim.

## Rollback Plan

Revert the PR that adds the proof script and release record. Generated `outputs/` artifacts are local and are not required for runtime rollback.

## Audit Evidence

- Local full proof output: `outputs/ecl-commercial-contract-supply-correction-2026-08-22/commercial_proof_run_summary.json`.
- Local catch-up proof output: `outputs/source-360-scope-catchup-proof-2026-08-22/source_360_scope_catchup_summary.json`.
- Static preview QA output: `outputs/source-360-scope-catchup-proof-2026-08-22/source_360_static_preview/mer-ctr-rcm-001-source-360-preview-qa.json`.

## Known Gaps

- Browser proof remains not started.
- Product route repointing remains out of scope.
- This proves local catch-up mechanics; it does not authorize Azure data-plane mutation or product runtime adoption.
