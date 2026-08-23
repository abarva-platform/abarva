# 2026-08-23-ecl-source-room-producer-coverage — ECL Source Room Producer Coverage

## Release ID

`2026-08-23-ecl-source-room-producer-coverage`

## Status

`candidate`

## Plain-English Summary

Adds local reporting that maps dense source-room families to ECL tables. The report separates tables that have source-family producers from tables that require downstream snapshot, projection, or cube builders after canonical load.

## Layer Impact

Lane: `client-data-lane`.

Layer 1 client intake: consumes the dense source-room manifest and family row counts.

Layer 2 source adapters: documents the next adapter actions per table, but does not implement the adapters.

Layer 3 canonical model: no schema or persisted data changes.

Layer 4 products: no product route, cube, projection, or browser behavior changes.

## Client Applicability

- All clients: applies as a local ECL loading-readiness proof pattern.
- Specific clients: none.
- Internal only: local proof/report generation only.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/ecl/write_dense_source_room_ecl_producer_coverage.py`
- package script for local source-room producer coverage reporting

## QA / Validation

Status: `pass`.

Candidate validation:

- `python3 -m py_compile scripts/ecl/write_dense_source_room_ecl_producer_coverage.py`
- `npm run ecl:source-room-producers:report -- --generate --dense-out-dir /tmp/source-room-depth-catchup-verify --out-dir /tmp/ecl-source-room-producer-coverage-verify`
- `npm run release:check`

## Rollout Plan

Merge as local proof/report tooling. No runtime or data-plane change occurs until later adapter or operator-job work consumes the report.

## Deployment Authority

- Repo-owned deploy workflow: normal main deploy if merged.
- Shared runtime mutators: none in this change.
- Approved image digest: not applicable for local proof tooling.
- ACA runtime invariant: not applicable unless deployed by the normal main workflow.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: no, because no product route changes.

## Rollback Plan

Revert the proof script and package-script entry. No database rollback is required because this change does not mutate persistence.

## Audit Evidence

- Local generated producer coverage summary, CSV, and Markdown report under the supplied output directory.
- Validation command output.
- PR and CI checks after review.

## Known Gaps

This report is a loading-readiness denominator. It does not implement the all-family adapters, load Azure, rebuild context packs, rebuild cubes, or prove product browser surfaces.
