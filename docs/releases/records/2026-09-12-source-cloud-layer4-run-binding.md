# 2026-09-12-source-cloud-layer4-run-binding - Source Cloud Layer 4 Run Binding

## Release ID

`2026-09-12-source-cloud-layer4-run-binding`

## Status

`candidate`

## Plain-English Summary

This release makes the Source cloud-consumption Layer 4 loader validate against the Layer 3 load run that actually wrote the canonical rows. Operators may provide that run explicitly; when omitted, the current run remains the default. This keeps multi-step batch loads deterministic without weakening any readback gate.

## Layer Impact

`client-data-lane`: Source loader execution and operator proof only. No canonical schema or product read model changes.

## Client Applicability

- All clients: Yes, for tenants using the Source cloud-consumption package loader.
- Specific clients: None named.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `scripts/source/load-cloud-consumption-package.mjs`
- `scripts/source/__tests__/load-cloud-consumption-package.test.ts`
- `package.json` operator entrypoint for idempotent Layer 4 control-readiness migration reapply

## QA / Validation

- PASS: `node --check scripts/source/load-cloud-consumption-package.mjs`.
- PASS: targeted cloud-consumption loader tests.
- PASS: Layer 4 operator readback with an explicit Layer 3 run binding.
- Required after merge: the controlled migration reapply job, because some environments already record the migration as applied while retaining the older view definition.
- Required after merge: repo-owned ACA deploy and the affected cloud package verify job.

## Rollout Plan

Merge through the protected `main` branch, deploy through the repo-owned ACA main workflow, then run the cloud-consumption Layer 2, Layer 3, and Layer 4 jobs with `SOURCE_CLOUD_CONSUMPTION_PACKAGE_LAYER3_LOAD_RUN_ID` set to the Layer 3 run ID when the jobs use separate run IDs.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: ACA schema/data jobs only through `npm run ops:aca-job`.
- Approved image digest: To be captured after the main deploy workflow.
- ACA runtime invariant: Required before post-deploy data jobs.
- Worker image invariant: Required before post-deploy data jobs.
- Feature/env flag update path: None.
- Live signed-in proof required: Source cloud Contract 360 and Optimize affected contracts.

## Rollback Plan

Rollback the web runtime to the prior approved digest if the loader regresses. No schema rollback is required. Re-run the prior loader image only after confirming its package and Layer 3 run binding are compatible.

## Audit Evidence

- PR URL: pending.
- CI/check output: pending.
- ACA deploy digest and runtime invariant: pending.
- ACA data job proof bundle: captured for the execution that exposed and verified the run binding.

## Known Gaps

This release does not reconcile the separate portfolio register and depth populations or invent missing source evidence. It only makes the Layer 3 to Layer 4 execution binding explicit.
