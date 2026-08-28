# 2026-08-28-meridian-phs-default-ecl-paths — Meridian PHS Default ECL Paths

## Release ID

`2026-08-28-meridian-phs-default-ecl-paths`

## Status

`candidate`

## Plain-English Summary

This release keeps the Meridian/PHS demo on governed ECL serving paths by default. Home uses the Meridian ECL Home bundle instead of the older checked-in review snapshot, and Tower reads its command-center view from `serving.tower_*` through the ECL reader instead of the pre-ECL CIO Tower mart reader.

## Layer Impact

Layer 4 products: Home and Tower default routes are aligned to governed ECL serving data for the Meridian/PHS demo path.

QA/control plane: the product serving-route fence now follows the Tower route import graph so imported pre-ECL Tower schema reads cannot hide behind a shallow file list.

## Client Applicability

- All clients: the stronger static fence applies globally.
- Specific clients: Meridian/PHS demo path receives the Home default ECL read.
- Internal only: none.
- Public/demo only: Meridian/PHS demo readiness.
- Feature flag: none.

## Changes Included

- `src/app/(maestro)/home/page.tsx`
- `src/app/(maestro)/tower/page.tsx`
- `scripts/ecl/__tests__/run-ecl-product-serving-route-fence-tests.mjs`

## QA / Validation

- `npm run test:ecl-product-serving-route-fence` passed locally.
- `npm run ecl:product-browser:predeploy-gate` passed all static ECL provider and surface checks; its only local failure was the existing dependency-backed Jest command because this clean worktree has no installed Next/Jest dependencies.
- `git diff --check` passed locally.

## Rollout Plan

Merge through PR, then deploy through the repo-owned Azure Container Apps main deploy workflow. No data-plane mutation is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned deploy workflow
- Approved image digest: resolved by the deploy workflow after merge
- ACA runtime invariant: required before live-proof claim
- Worker image invariant: required by deploy workflow
- Feature/env flag update path: none
- Live signed-in proof required: Home and Tower Meridian default routes

## Rollback Plan

Revert this release commit and redeploy through the repo-owned ACA main deploy workflow. Data loaded through ECL remains unchanged.

## Audit Evidence

- Local focused fence output showing zero direct projection reads and zero reachable pre-ECL Tower schema reads.
- PR checks and ACA deploy evidence after merge.

## Known Gaps

Live signed-in proof is pending until this candidate is merged and deployed.
