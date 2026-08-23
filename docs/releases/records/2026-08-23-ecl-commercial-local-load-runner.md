# 2026-08-23-ecl-commercial-local-load-runner — ECL Commercial Local Load Runner

## Release ID

`2026-08-23-ecl-commercial-local-load-runner`

## Status

`candidate`

## Plain-English Summary

This release adds the commercial-family load runner behind the merged preflight gate. The runner
requires the run contract, explicit gate manifest, readback contract, idempotency key, expected local
proof hashes, and an explicitly classified lab/preprod/disposable target before it can write. The
included proof uses a local JSON-backed mock database only; no ACA job is submitted and no shared
data plane is mutated.

## Layer Impact

Release lane: `client-data-lane` with internal-admin operator automation.

Layer 2 source adapter/data-build operations: adds an idempotent local/disposable load runner and
guard checks for a future commercial-family data-build job.

Layer 3 canonical model: no shared schema change, migration, canonical write, or active-source
promotion occurs in this release.

Layer 4 products: no route, read model, browser-visible surface, or deployment behavior changes.

## Client Applicability

All clients: none.

Specific clients: none.

Internal only: AbarVa operator-local proof and future job runner implementation.

Public/demo only: none.

Feature flag: none.

## Changes Included

- `scripts/ecl/load_ecl_commercial_family.py`
- `scripts/ecl/validate_ecl_commercial_local_load_runner.py`
- `scripts/ecl/__tests__/run-ecl-commercial-family-load-tests.mjs`
- `package.json` command aliases for runner, validator, and tests.
- Compact local proof artifacts under `reports/ecl-commercial-local-load-runner-2026-08-23/`.

## QA / Validation

- Pass: `npm run test:ecl-commercial-family-load`
- Pass: `python3 -m py_compile scripts/ecl/load_ecl_commercial_family.py scripts/ecl/validate_ecl_commercial_local_load_runner.py`
- Pass: local runner execution against a `/tmp` JSON-backed mock DB with an ephemeral local-disposable gate manifest.
- Pass: `npm run ecl:commercial-family:load:validate`
- Pass: `git diff --check`
- Pass: `npm run release:check`

## Rollout Plan

Merge-only. This PR does not deploy, mutate Azure, run an ACA Job, load shared data, apply
migrations, promote active tenant source, or repoint product routes. Actual lab/preprod execution
remains a future human/operations gate requiring approved job submission and independent readback.

## Deployment Authority

- Repo-owned deploy workflow: not used.
- Shared runtime mutators: none.
- Approved image digest: not provided in this local proof PR; required for future ACA execution.
- ACA runtime invariant: not applicable because no ACA update or job execution occurs.
- Worker image invariant: not applicable because no worker job is executed.
- Feature/env flag update path: none.
- Live signed-in proof required: not for this runner; required only after future approved load,
  readback, route wiring, and approved deployment workflow.

## Rollback Plan

Revert this PR. No runtime, shared data-plane, migration, route, or active-source rollback is
required because the proof uses local/mock persistence only.

## Audit Evidence

- `reports/ecl-commercial-local-load-runner-2026-08-23/ecl_commercial_local_load_status.json`
- `reports/ecl-commercial-local-load-runner-2026-08-23/ecl_commercial_local_load_row_counts.json`
- `reports/ecl-commercial-local-load-runner-2026-08-23/ecl_commercial_local_load_validation_summary.json`
- `reports/ecl-commercial-local-load-runner-2026-08-23/ecl_commercial_execution_progress.json`

## Known Gaps

The actual commercial-family lab/preprod load, ACA job execution, independent data-plane readback,
remaining dense source rooms, full nine-family validation, reload/readback, and Source browser QA are
not performed in this release.
