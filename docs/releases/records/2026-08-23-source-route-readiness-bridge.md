# 2026-08-23-source-route-readiness-bridge — Source Route Readiness Gate

## Release ID

`2026-08-23-source-route-readiness-bridge`

## Status

`candidate`

## Plain-English Summary

Adds a local Source 360 route-readiness proof before any product route is switched to the new ECL projection path. The proof verifies that local ECL Source 360 projections and static previews are ready for adapter design, while the current signed-in Source workspace remains unrepointed and browser-live proof is not claimed.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3 / Canonical model: no data-model change.
- Layer 4 / Products: no route is repointed. The change adds a proof gate that documents the current Source read path and the exact remaining product-route/browser gates.
- Release/QA: the no-stop ECL queue and CI proof artifact now include Source route-readiness evidence.

## Client Applicability

- All clients: no direct runtime impact.
- Specific clients: none.
- Internal only: local ECL proof and release-control evidence.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Adds `scripts/ecl/validate_source_360_route_readiness.py`.
- Adds `source_360_route_readiness_*` artifacts to the no-stop queue.
- Updates the ECL execution tracker and queue documentation.
- Updates `.github/workflows/ecl-no-stop-data-pipeline.yml` to compile, validate, assert, and package the new proof.

## QA / Validation

Validation performed:

- PASS: `python3 -m py_compile scripts/ecl/run_no_stop_execution_queue.py scripts/ecl/validate_no_stop_execution_queue.py scripts/ecl/validate_ecl_operator_status_report.py scripts/ecl/validate_source_360_route_readiness.py`
- PASS: `python3 scripts/ecl/run_no_stop_execution_queue.py`
- PASS: `python3 scripts/ecl/validate_ecl_operator_status_report.py`
- PASS: `python3 scripts/ecl/validate_source_360_route_readiness.py`
- PASS after release-record correction: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to `main`. The repo-owned ACA deploy workflow may rebuild and redeploy the app image, but this change does not alter runtime Source routes or shared data.

## Deployment Authority

- Repo-owned deploy workflow: yes, after merge through the standard main deploy workflow.
- Shared runtime mutators: none in this change.
- Approved image digest: produced by the repo-owned deploy workflow.
- ACA runtime invariant: standard post-deploy invariant applies if the main deploy workflow runs.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: not for this local proof change; required before claiming product route/browser proof.

## Rollback Plan

Revert the PR. Since the change is proof/report wiring only, rollback does not require data migration, route repointing, or tenant data restoration.

## Audit Evidence

- PR URL after opening.
- CI run for `ECL no-stop data pipeline`.
- Generated `outputs/ecl-source-route-readiness-2026-08-23/source_360_route_readiness_summary.json`.
- Generated `outputs/ecl-source-route-readiness-2026-08-23/source_360_route_readiness.md`.

## Known Gaps

Product route repointing and signed-in browser proof remain behind their declared hard gates.
