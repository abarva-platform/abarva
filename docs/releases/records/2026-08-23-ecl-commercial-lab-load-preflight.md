# 2026-08-23-ecl-commercial-lab-load-preflight — ECL Commercial Lab Load Preflight

## Release ID

`2026-08-23-ecl-commercial-lab-load-preflight`

## Status

`candidate`

## Plain-English Summary

This release adds a safe-by-default preflight surface for a future commercial-family lab/preprod data-build load. It generates the load run contract, command plan, explicit gate-manifest template, local proof-hash requirements, output proof-bundle locations, and independent row-for-row readback comparison contract. Execute mode is guarded by a separate approval manifest and remains non-mutating in this release.

## Layer Impact

Release lane: `client-data-lane` with internal-admin operator preflight automation.

Layer 2 source adapter/data-build operations: adds a future load preflight contract and gate validation before any operator job can be submitted.

Layer 3 canonical model: no schema change, migration, load, canonical write, or active-source promotion occurs.

Layer 4 products: no route, read model, browser-visible surface, or deployment behavior changes.

## Client Applicability

All clients: none.

Specific clients: none.

Internal only: AbarVa operator preflight planning for a future commercial-family lab/preprod load.

Public/demo only: none.

Feature flag: none.

## Changes Included

- `scripts/ecl/run_ecl_commercial_lab_load_preflight.py`
- `scripts/ecl/validate_ecl_commercial_lab_load_preflight.py`
- `scripts/ecl/__tests__/run-ecl-commercial-lab-load-preflight-tests.mjs`
- `package.json` command aliases for preflight, validation, and tests.
- Compact preflight evidence under `reports/ecl-commercial-lab-load-preflight-2026-08-23/`.

## QA / Validation

- Pass: `npm run ecl:commercial-lab-load:preflight`
- Pass: `npm run ecl:commercial-lab-load:validate`
- Pass: `npm run test:ecl-commercial-lab-load-preflight`
- Pass: `python3 -m py_compile scripts/ecl/run_ecl_commercial_lab_load_preflight.py scripts/ecl/validate_ecl_commercial_lab_load_preflight.py`
- Pass: `git diff --check`
- Pass: `npm run release:check`

## Rollout Plan

Merge-only. This PR does not deploy, mutate Azure, run an ACA Job, load data, apply migrations, promote active tenant source, or repoint product routes. A future execution lane must provide a separate explicit gate manifest, digest-pinned image, private data-plane target, proof-bundle output binding, and human approval.

## Deployment Authority

- Repo-owned deploy workflow: not used.
- Shared runtime mutators: none.
- Approved image digest: not provided in this preflight PR; required for future execution.
- ACA runtime invariant: not applicable because no ACA update or job execution occurs.
- Worker image invariant: not applicable because no worker job is executed.
- Feature/env flag update path: none.
- Live signed-in proof required: not for this preflight; required only after future approved load, readback, route wiring, and approved deployment workflow.

## Rollback Plan

Revert this PR. No runtime, data-plane, migration, route, or active-source rollback is required because the change is local preflight automation and compact reports only.

## Audit Evidence

- `reports/ecl-commercial-lab-load-preflight-2026-08-23/ecl_commercial_lab_load_run_contract.json`
- `reports/ecl-commercial-lab-load-preflight-2026-08-23/ecl_commercial_lab_load_command_plan.json`
- `reports/ecl-commercial-lab-load-preflight-2026-08-23/ecl_commercial_lab_load_gate_validation.json`
- `reports/ecl-commercial-lab-load-preflight-2026-08-23/ecl_commercial_lab_load_readback_contract.json`
- `reports/ecl-commercial-lab-load-preflight-2026-08-23/ecl_commercial_execution_progress.json`

## Known Gaps

The actual commercial-family lab/preprod load, Azure job execution, independent data-plane readback, remaining dense source rooms, full nine-family validation, reload/readback, and Source browser QA are not performed in this release.
