# 2026-07-17-tower-value-proof-copy-cleanup — Tower Value-Proof Copy Cleanup

## Release ID

`2026-07-17-tower-value-proof-copy-cleanup`

## Status

`candidate`

## Plain-English Summary

Tower's value-proof funnel now avoids the remaining "realized value/savings" caveat phrasing in the executive display. The page keeps the same financial controls, but uses claimable-value language so Meridian/Healthcare Demo is not implied to have realized or booked savings.

## Layer Impact

- `global-control-lane`: updates shared Tower presentation copy normalization only.
- Presentation layer: updates Tower value-proof copy normalization only.
- Governance layer: preserves the existing claimable-value gate and outcome-proof boundary.

## Client Applicability

- All clients: Tower value-proof funnel copy uses safer claimable-value language.
- Specific clients: Healthcare Demo/Meridian proof path is the validation target.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/tower/TowerIndexPage.tsx`

## QA / Validation

- Pass: `npm test -- --runInBand src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx`
- Pass: `npx eslint src/components/tower/TowerIndexPage.tsx` (existing warnings only)
- Pass: `npx tsc --noEmit --pretty false`
- Pass: `npm run release:check`
- Pass: `git diff --check`

## Rollout Plan

Merge through the protected PR lane. The repo-owned ACA main deploy workflow builds and deploys the digest-pinned image. Signed-in Meridian/Healthcare Demo Tower proof is required before calling the cleanup live-proven.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the workflow
- Approved image digest: produced by the ACA main deploy workflow
- ACA runtime invariant: required after deploy
- Worker image invariant: not affected
- Feature/env flag update path: not affected
- Live signed-in proof required: yes

## Rollback Plan

Revert the presentation-only commit and redeploy through the ACA main deploy workflow.

## Audit Evidence

- PR and deployment proof to be attached after merge.
- Signed-in Tower screenshots and DOM crawl under `proof/`.

## Known Gaps

This does not redesign the Tower data mart, add new source-adapter feeds, or change value-claim calculations.
