# 2026-08-23-ecl-aca-commercial-load-readback-plan - ECL ACA Commercial Load Plan

## Release ID

`2026-08-23-ecl-aca-commercial-load-readback-plan`

## Status

`candidate`

## Plain-English Summary

This release revises the ECL Source execution order so the first PR slice is the ACA data-build job contract and commercial-family lab/preprod load/readback plan. It does not generate dense source-room payloads for the remaining families, write Azure data, deploy, repoint routes, or claim browser proof.

## Layer Impact

Layer 2 operator execution: Adds a plan-only ACA data-build job contract that follows the repo data-build job rule and records the required inputs, outputs, proof bundle, progress, and no-execution boundary.

Layer 3 data-plane preparation: Defines the commercial family as the first future gated lab/preprod data-plane action and records a row-for-row independent readback plan against the existing local commercial proof.

Layer 1 and Layer 4: No active tenant source, dense remaining-family source rooms, product routes, or browser-visible surfaces are changed.

## Client Applicability

- All clients: None at runtime.
- Specific clients: None.
- Internal only: ECL Source operator planning and PR review artifacts.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `scripts/ecl/write_ecl_aca_commercial_load_readback_plan.py`
- `scripts/ecl/validate_ecl_aca_commercial_load_readback_plan.py`
- `reports/ecl-aca-commercial-load-readback-plan-2026-08-23/`

## QA / Validation

- Passed: `python3 scripts/ecl/write_ecl_aca_commercial_load_readback_plan.py`
- Passed: `python3 scripts/ecl/validate_ecl_aca_commercial_load_readback_plan.py`
- Passed: `python3 -m py_compile scripts/ecl/write_ecl_aca_commercial_load_readback_plan.py scripts/ecl/validate_ecl_aca_commercial_load_readback_plan.py`
- Passed: `npm run release:check`

## Rollout Plan

No runtime rollout. Merge only records the plan and contract. Any commercial lab/preprod load remains behind explicit Azure data-plane write approval, digest-pinned job execution, proof bundle capture, and independent readback.

## Deployment Authority

- Repo-owned deploy workflow: Not invoked.
- Shared runtime mutators: None.
- Approved image digest: Not applicable in this PR.
- ACA runtime invariant: Not applicable because no ACA runtime or job was submitted.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Required only after a later Source route adoption lane; not claimed here.

## Rollback Plan

Revert the PR to remove the plan generator, validator, and report artifacts. No data-plane rollback is needed because this release does not mutate Azure, shared databases, active tenant inputs, routes, runtime flags, or traffic.

## Audit Evidence

- `reports/ecl-aca-commercial-load-readback-plan-2026-08-23/aca_data_build_job_contract.json`
- `reports/ecl-aca-commercial-load-readback-plan-2026-08-23/commercial_family_lab_preprod_load_plan.json`
- `reports/ecl-aca-commercial-load-readback-plan-2026-08-23/commercial_row_for_row_readback_plan.json`
- `reports/ecl-aca-commercial-load-readback-plan-2026-08-23/ecl_ordered_execution_progress.json`
- `reports/ecl-aca-commercial-load-readback-plan-2026-08-23/aca_commercial_plan_validation_summary.json`

## Known Gaps

The ACA job is not submitted, commercial data is not loaded, independent readback is not executed, remaining eight dense source rooms are deferred, full nine-family validation is deferred, reload/readback is deferred, and Source route/browser QA is deferred behind hard gates.
