# 2026-06-29-cio-tower-quality-report-outdir — Make Tower Quality Reports ACA-Writable

## Release ID

`2026-06-29-cio-tower-quality-report-outdir`

## Status

`candidate`

## Plain-English Summary

The Tower quality checker successfully reached Azure/Postgres in the private VNet, but failed when writing its HTML/JSON report under `/app/out` inside the non-root ACA image. This change makes the report directory configurable and defaults to `/tmp/cio-tower-quality` in ACA so live operator quality proof can complete.

## Layer Impact

- `global-control-lane`: Updates an internal validation script used by the shared ACA operator job. No user-facing route behavior changes.
- `client-data-lane`: Enables Tower data-quality proof for all canonical tenants after the standardized Tower load.

## Client Applicability

- All clients: Applies to the shared Tower quality proof path for all canonical tenants.
- Specific clients: None.
- Internal only: Operator proof script behavior.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `scripts/tower/validate-cio-tower-quality.mjs` now honors `TOWER_CIO_QUALITY_OUT_DIR`.
- The script defaults to `/tmp/cio-tower-quality` when running in ACA, where the non-root container can write proof files.

## QA / Validation

- `pass`: `node scripts/tower/validate-cio-tower-quality.mjs` completed locally with `300/300` question checks and `1/1` non-DB integrity check, writing its report under the local `out/cio-tower-quality` path.
- `pending`: `npm run release:check` must pass before PR.
- `pending after deploy`: rerun `tower:cio:quality` through the ACA private operator job using the deployed digest image, where the report path should resolve to `/tmp/cio-tower-quality`.

## Rollout Plan

Merge to `main`; the repo-owned ACA main deploy workflow builds and deploys the corrected image. Then rerun the Tower quality job in the private VNet operator.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: repo-owned main deploy only
- Approved image digest: produced by the main deploy workflow after merge
- ACA runtime invariant: required by deploy workflow
- Worker image invariant: required by deploy workflow
- Feature/env flag update path: none
- Live signed-in proof required: Tower quality job must complete against live Azure data after deploy.

## Rollback Plan

Rollback by redeploying the prior approved main digest. This change only affects where the quality script writes proof artifacts.

## Audit Evidence

- Pre-fix failure: ACA operator `tower:cio:quality` failed with `EACCES: permission denied, mkdir '/app/out/cio-tower-quality'`.
- PR URL: pending.
- Operator quality output: pending.

## Known Gaps

This change only fixes the proof-script output directory. It does not change Tower dashboard values, the standardized Tower source files, the live `cio_tower` schema contents, or signed-in browser behavior. The live ACA quality job must be rerun after deployment before this release can be treated as live-proven.
