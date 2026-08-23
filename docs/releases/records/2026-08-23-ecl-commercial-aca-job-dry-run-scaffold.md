# 2026-08-23-ecl-commercial-aca-job-dry-run-scaffold — ECL Commercial ACA Job Dry-Run Scaffold

## Release ID

`2026-08-23-ecl-commercial-aca-job-dry-run-scaffold`

## Status

`candidate`

## Plain-English Summary

This release adds a dry-run-only scaffold for the commercial-family ECL Source data-build job. It packages the compact commercial proof-plan bundle, writes the job spec, run manifest, idempotency key, status paths, validation output, and quality gate output required by the ACA data-build job rule, and records which bindings are still missing for a later approved execution.

## Layer Impact

Release lane: `client-data-lane` with internal-admin operator scaffolding.

Layer 2 source adapter/data-build operations: adds local operator scaffolding for a future ACA Container Apps Job request.

Layer 3 canonical model: no schema, migration, canonical write, or active-source promotion is performed.

Layer 4 products: no product route, read model, or browser-visible behavior changes.

## Client Applicability

All clients: none.

Specific clients: none.

Internal only: AbarVa operator dry-run planning for the ECL commercial-family load lane.

Public/demo only: none.

Feature flag: none.

## Changes Included

- `scripts/ecl/run_ecl_commercial_aca_job_dry_run.py`
- `scripts/ecl/validate_ecl_commercial_aca_job_dry_run.py`
- `scripts/ecl/__tests__/run-ecl-commercial-aca-job-dry-run-tests.mjs`
- `package.json` command aliases for the runner, validator, and test.
- Compact dry-run evidence under `reports/ecl-commercial-aca-job-dry-run-2026-08-23/`.

## QA / Validation

- Pass: `python3 scripts/ecl/run_ecl_commercial_aca_job_dry_run.py`
- Pass: `python3 scripts/ecl/validate_ecl_commercial_aca_job_dry_run.py`
- Pass: `node scripts/ecl/__tests__/run-ecl-commercial-aca-job-dry-run-tests.mjs`
- Pass: `python3 -m py_compile scripts/ecl/run_ecl_commercial_aca_job_dry_run.py scripts/ecl/validate_ecl_commercial_aca_job_dry_run.py`
- Pass: `npm run release:check`

## Rollout Plan

Merge-only. This PR does not deploy, mutate Azure, load data, apply migrations, promote active tenant source, or repoint product routes. A future execution lane must provide explicit operator approval and required ACA/data-plane bindings.

## Deployment Authority

- Repo-owned deploy workflow: not used.
- Shared runtime mutators: none.
- Approved image digest: not provided in this dry-run PR; required for future execution.
- ACA runtime invariant: not applicable because no ACA update or job execution occurs.
- Worker image invariant: not applicable because no worker job is executed.
- Feature/env flag update path: none.
- Live signed-in proof required: not for this scaffold; required only after future approved load, readback, route wiring, and deployment workflow.

## Rollback Plan

Revert this PR. No runtime, data-plane, migration, or route rollback is required because the change is local scaffolding and compact reports only.

## Audit Evidence

- `reports/ecl-commercial-aca-job-dry-run-2026-08-23/ecl_commercial_aca_job_spec.json`
- `reports/ecl-commercial-aca-job-dry-run-2026-08-23/ecl_commercial_aca_run_manifest.json`
- `reports/ecl-commercial-aca-job-dry-run-2026-08-23/ecl_commercial_aca_status.json`
- `reports/ecl-commercial-aca-job-dry-run-2026-08-23/ecl_commercial_aca_quality_gate.json`
- `reports/ecl-commercial-aca-job-dry-run-2026-08-23/ecl_commercial_execution_progress.json`

## Known Gaps

Future execute mode remains intentionally gated. The first commercial-family lab/preprod load, independent row-for-row readback, remaining dense source rooms, full nine-family validation, reload/readback, and Source browser QA are not performed in this release.
