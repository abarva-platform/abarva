# 2026-08-24-ecl-client-intake-provenance-adapter — ECL Client Intake Provenance And Plausibility Gates

## Release ID

`2026-08-24-ecl-client-intake-provenance-adapter`

## Status

`candidate`

## Plain-English Summary

This release adds a structural origin marker to ECL source files, proves the first direct client-intake-to-ECL application adapter against the active reference intake shape, and tightens dense source-room validation so synthetic relationship and categorical patterns cannot pass merely because they are internally consistent.

## Layer Impact

Release lane: `client-data-lane`.

Layer 1 — Client Intake: no client-facing workbook or intake file is changed.

Layer 2 — Source Adapters: adds a local adapter proof that reads the registry-declared active applications intake CSV and emits ECL source/context SQL.

Layer 3 — Canonical Model: adds `source_file.origin` so downstream consumers can distinguish client-intake rows from synthetic-generator rows.

Layer 4 — Products: no product route or default provider changes are included. The new gates protect later product projections from synthetic uniformity and deployment-count drift.

## Client Applicability

- All clients: ECL source provenance contract and validation gates.
- Specific clients: none.
- Internal only: reference-intake adapter proof and dense synthetic source-room plausibility checks.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Adds `origin` to `ecl_source.source_file` with an enforced vocabulary.
- Updates existing ECL loaders to mark generated source files as `synthetic_generator`.
- Adds a client-intake application adapter proof script.
- Adds dense source-room plausibility gates for fixed graph strides, unreachable dimensions, overly uniform categories, and insufficient finance time depth.
- Adds local tests for the client-intake adapter and dense source-room planted-failure gate.
- Wires the new tests into the ECL no-stop data pipeline workflow.

## QA / Validation

- `python3 -m py_compile scripts/ecl/load_client_intake_applications_layer.py scripts/ecl/generate_dense_source_room_extracts.py scripts/ecl/validate_dense_source_room_extracts.py` — passed.
- `python3 scripts/ecl/generate_dense_source_room_extracts.py --out-dir /tmp/ecl-dense-source-room-final-check && python3 scripts/ecl/validate_dense_source_room_extracts.py --out-dir /tmp/ecl-dense-source-room-final-check` — passed with 14 extracts and 7,080 rows.
- `npm run test:ecl-client-intake-application-adapter` — passed; 306 intake rows loaded as 259 base applications and 77 deployments, with unknown source origin rejected.
- `npm run test:ecl-dense-source-room-stride-gate` — passed; planted fixed-stride relationship set rejected.
- `npm run test:ecl-object-type-catalog` — passed.
- `npm run test:ecl-projection-schema-reconciliation` — passed against `origin/main`.

## Rollout Plan

Merge to main through PR review and squash merge. The shared ACA deploy workflow may build the web image from main, but this release does not require a runtime route change, data-plane mutation, Azure load, or provider repointing.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` remains the only shared web deploy lane.
- Shared runtime mutators: none in this release.
- Approved image digest: not applicable before merge.
- ACA runtime invariant: required only if the main deploy workflow runs.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: not required for this schema/script-only candidate.

## Rollback Plan

Revert the PR. If any local proof artifacts were generated, discard them; no Azure data-plane rows, product defaults, or live traffic are changed by this release.

## Audit Evidence

- PR for this release.
- Local command output listed in QA / Validation.
- ECL no-stop workflow proof after PR creation.

## Known Gaps

This proves one client-intake adapter family only. Additional intake tabs still need adapters before ECL can claim complete Layer 1 to Layer 3 coverage.
