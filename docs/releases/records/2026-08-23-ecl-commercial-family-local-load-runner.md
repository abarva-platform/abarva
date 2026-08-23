# 2026-08-23-ecl-commercial-family-local-load-runner — ECL Commercial Local Load Runner

## Release ID

`2026-08-23-ecl-commercial-family-local-load-runner`

## Status

`candidate`

## Plain-English Summary

Adds a fail-closed commercial-family load runner for the ECL Source execution lane. The runner is built for a future governed data-build job, but this release proves it only against local/disposable database targets and keeps Azure, route repointing, deployment, and shared data-plane mutation out of scope.

## Layer Impact

- Release lane: `internal-admin`.
- Layer 1 client/source-room proof artifacts: reads the existing commercial proof and source-room artifacts as inputs; does not modify active tenant inputs.
- Layer 2/3 ECL build/load path: can generate the commercial ECL SQL artifact and load it into an explicitly marked safe database target.
- Layer 4 products: no product route, projection consumer, browser surface, or live module behavior changes.

## Client Applicability

- All clients: no direct runtime effect.
- Specific clients: none.
- Internal only: yes, operator/data-build readiness.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/ecl/run_ecl_commercial_family_load.py`
- `scripts/ecl/validate_ecl_commercial_family_load.py`
- `scripts/ecl/__tests__/run-ecl-commercial-family-load-tests.mjs`
- `package.json` scripts for dry-run, validation, and focused tests
- `reports/ecl-commercial-family-local-load-2026-08-23/` dry-run status/progress artifacts

## QA / Validation

- PASS: `npm run ecl:commercial-family-load:dry-run`
- PASS: `npm run ecl:commercial-family-load:validate`
- PASS: `npm run test:ecl-commercial-family-load`
- PASS: `python3 -m py_compile scripts/ecl/run_ecl_commercial_family_load.py scripts/ecl/validate_ecl_commercial_family_load.py`
- PASS: `git diff --check`
- PASS: `npm run release:check`

The focused test starts a disposable local Postgres instance, proves refusal cases, loads the commercial family twice with the same idempotency key, verifies row counts, and checks that missing/unknown states remain gaps rather than zero-valued facts.

## Rollout Plan

Merge only. This release does not submit an ACA job, does not apply a shared migration, does not mutate Azure data, does not repoint product routes, and does not deploy.

## Deployment Authority

- Repo-owned deploy workflow: not used.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: unchanged.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: not claimed in this release.

## Rollback Plan

Revert the PR to remove the local runner, validator, test, scripts, and dry-run artifacts. No data-plane rollback is required because this release performs no shared writes.

## Audit Evidence

- Dry-run status: `reports/ecl-commercial-family-local-load-2026-08-23/ecl_commercial_family_load_runner_status.json`
- Progress tracker: `reports/ecl-commercial-family-local-load-2026-08-23/ecl_commercial_execution_progress.json`
- Focused test: `npm run test:ecl-commercial-family-load`

## Known Gaps

- No Azure/ACA job submission.
- No shared lab/preprod data-plane load.
- No independent Azure readback.
- No product route repointing or browser proof.
