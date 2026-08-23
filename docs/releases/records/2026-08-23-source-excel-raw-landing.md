# 2026-08-23-source-excel-raw-landing — Source Excel Raw Landing

## Release ID

`2026-08-23-source-excel-raw-landing`

## Status

`candidate`

## Plain-English Summary

Adds a local, deterministic landing proof for the current owner-facing source Excel workbook package. The proof inventories every current workbook, sheet, row, source-room extract, and mapping ledger before any source adapter or product projection interprets the data.

## Layer Impact

Lane: `client-data-lane`.

Layer 1 client intake: adds raw workbook/source-room inventory and row hash proof for the current owner-facing intake package.

Layer 2 source adapters: no adapter behavior changes. The report names intended adapter families for follow-on work.

Layer 3 canonical model: no canonical data changes.

Layer 4 products: no product route, cube, projection, or browser behavior changes.

## Client Applicability

- All clients: applies as an intake validation pattern.
- Specific clients: none.
- Internal only: local proof/report generation only.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/ecl/land_source_excel_workbooks.py`
- `scripts/ecl/validate_source_excel_raw_landing.py`
- package scripts for local generation and validation

## QA / Validation

Status: `pass`.

Candidate validation:

- `python3 -m py_compile scripts/ecl/land_source_excel_workbooks.py scripts/ecl/validate_source_excel_raw_landing.py`
- `npm run ecl:source-excel-raw:land -- --package-zip /Users/anand/Downloads/meridian-v2-2-2b-semantic-mapping-pilot-20260822-092150.zip --out-dir /tmp/source-excel-raw-landing-verify`
- `npm run ecl:source-excel-raw:validate -- --out-dir /tmp/source-excel-raw-landing-verify`
- `npm run release:check`

## Rollout Plan

Merge to main as local proof tooling. Azure Container Apps deployment may pick up the script, but no data-plane mutation occurs until an explicit operator job consumes it with a separate run contract.

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

- Local raw landing report under the supplied output directory.
- Validation command output.
- PR and CI checks after review.

## Known Gaps

This is raw Layer 1 proof only. It does not build canonical objects, load Azure, rebuild cubes, or prove product browser surfaces.
