# 2026-08-03-tower-loader-numeric-parser-hardening — Tower Loader Numeric Parser Hardening

## Release ID

`2026-08-03-tower-loader-numeric-parser-hardening`

## Status

`candidate`

## Plain-English Summary

Hardens the governed Tower source loader so placeholder punctuation in numeric source fields is treated as missing data instead of causing the load transaction to fail.

## Layer Impact

Release lanes: `client-data-lane`.

- Source adapters: normalizes numeric parsing for current-state source extracts before Tower measurements are promoted.
- Canonical model: preserves missing numeric values as `null`; it does not fabricate spend, value, usage, or outcome evidence.
- Products: Tower can receive the governed projection after the loader completes successfully.

## Client Applicability

- All clients: Applies to the shared loader pattern for this current-state source package.
- Specific clients: None named.
- Internal only: Operator reload execution and validation.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `scripts/source/skyharbor-v3/load_source_tower_measurements.sql`

## QA / Validation

- `npm run audit:tower-demo-story-data` passed.
- `npm test -- --runTestsByPath src/lib/tower/__tests__/readTowerCommandCenter.test.ts --runInBand` passed.
- `npm run release:check` pending for this candidate record.

## Rollout Plan

Merge through PR to `main`, deploy via the repo-owned Azure Container Apps main workflow, then rerun the governed current-state reload through the ACA operator job with the deployed digest-pinned image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned workflow and ACA operator job wrapper.
- Approved image digest: Set by the main workflow after merge.
- ACA runtime invariant: Required before live proof.
- Worker image invariant: Required by the main workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Tower tabs after the operator reload.

## Rollback Plan

Revert the parser hardening commit and redeploy through the same ACA main workflow. If a reload has already completed, rerun the previous approved loader image through the ACA operator job only after review.

## Audit Evidence

- PR URL: To be added.
- ACA operator job output: To be captured after deploy.
- Live Tower browser proof: To be captured after reload.

## Known Gaps

This does not change the source data itself. It only prevents invalid placeholder numerics from aborting the governed load.
