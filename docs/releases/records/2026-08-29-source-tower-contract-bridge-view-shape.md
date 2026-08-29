# 2026-08-29-source-tower-contract-bridge-view-shape — Source Tower Bridge View Shape

## Release ID

`2026-08-29-source-tower-contract-bridge-view-shape`

## Status

`candidate`

## Plain-English Summary

The Source-to-Tower bridge now reads the deployed Source contract projection without assuming optional governance columns are physically present on that view. It keeps the governed annual value and load-run lineage, and supplies explicit reviewed/accepted defaults for the Tower fact attributes used by the mart projection.

## Layer Impact

Layer 4 Products/projections.

- Lane: `client-data-lane`
- Impact: The Tower mart operator projection can consume governed Source contract rows after Source Layer 4 is applied. No client intake, adapter, canonical object, or product UI copy changes are included.

## Client Applicability

- All clients: No.
- Specific clients: Tenants using the Source contract-depth to Tower mart bridge.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Tower mart Source contract bridge query.
- Focused regression assertion for annual value, governance defaults, and load-run lineage aliases.

## QA / Validation

- PASS: `npx jest src/scripts/tower/__tests__/project-tower-mart-source-contracts.test.ts --runInBand`
- PASS: `npx eslint src/scripts/tower/project-tower-mart.ts src/scripts/tower/__tests__/project-tower-mart-source-contracts.test.ts`
- PASS: `npm run release:check`
- PASS: `git diff --check`

## Rollout Plan

Merge to main through a pull request. Deploy through the repo-owned Azure Container Apps main workflow. After deployment, rerun the governed Source Layer 4 verify job and Tower mart write/readback job with the approved digest-pinned image.

## Deployment Authority

- Repo-owned deploy workflow: Required after merge.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: Captured after deployment.
- ACA runtime invariant: Required before operator jobs.
- Worker image invariant: Required before operator jobs.
- Feature/env flag update path: None.
- Live signed-in proof required: Tower page proof after mart readback succeeds.

## Rollback Plan

Revert the pull request and redeploy. If a mart projection was written with this bridge, rerun the previous approved mart projection job for the tenant.

## Audit Evidence

- Failed Tower mart operator run before this fix: `/tmp/tower-mart-projection-meridian-health-20260829T0359Z/04-logs.txt`.
- Future evidence after rollout: PR checks, ACA deploy evidence, Source Layer 4 verify output, Tower mart proof bundle, and signed-in Tower proof.

## Known Gaps

The Tower mart operator job failed before this fix because the bridge expected columns that the deployed Source projection did not expose. This release is not complete until the post-deploy Tower mart write/readback job succeeds.
