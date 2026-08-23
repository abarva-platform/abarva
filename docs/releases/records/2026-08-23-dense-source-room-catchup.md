# 2026-08-23-dense-source-room-catchup — Dense Source Room Catch-Up

## Release ID

`2026-08-23-dense-source-room-catchup`

## Status

`candidate`

## Plain-English Summary

Adds local tooling to generate and validate dense synthetic source-room extracts across the full intake scope. The package is source-system shaped and marked as synthetic, so adapters can be tested against realistic volume without treating the values as client-attested truth.

## Layer Impact

Lane: `client-data-lane`.

Layer 1 client intake: adds local synthetic source-room generation and validation for all intake families.

Layer 2 source adapters: no adapter behavior changes. The generated files are intended for follow-on adapter QA.

Layer 3 canonical model: no canonical data changes.

Layer 4 products: no product route, cube, projection, or browser behavior changes.

## Client Applicability

- All clients: applies as a synthetic intake QA pattern.
- Specific clients: none.
- Internal only: local proof/report generation only.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/ecl/generate_dense_source_room_extracts.py`
- `scripts/ecl/validate_dense_source_room_extracts.py`
- package scripts for local generation and validation

## QA / Validation

Status: `pass`.

Candidate validation:

- `python3 -m py_compile scripts/ecl/generate_dense_source_room_extracts.py scripts/ecl/validate_dense_source_room_extracts.py`
- `npm run ecl:source-room-dense:generate -- --out-dir /tmp/source-room-depth-catchup-verify`
- `npm run ecl:source-room-dense:validate -- --out-dir /tmp/source-room-depth-catchup-verify`
- `npm run release:check`

## Rollout Plan

Merge to main as local proof tooling. No runtime or data-plane change occurs until a later operator job consumes generated outputs with an explicit run contract.

## Deployment Authority

- Repo-owned deploy workflow: normal main deploy if merged.
- Shared runtime mutators: none in this change.
- Approved image digest: not applicable for local proof tooling.
- ACA runtime invariant: not applicable unless deployed by the normal main workflow.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: no, because no product route changes.

## Rollback Plan

Revert the proof scripts and package-script entries. No database rollback is required because this change does not mutate persistence.

## Audit Evidence

- Local generated dense source-room package under the supplied output directory.
- Validation command output.
- PR and CI checks after review.

## Known Gaps

This is source-room depth generation only. It does not map those rows into canonical objects, load Azure, rebuild cubes, or prove product browser surfaces.
