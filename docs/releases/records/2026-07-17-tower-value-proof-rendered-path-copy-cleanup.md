# 2026-07-17-tower-value-proof-rendered-path-copy-cleanup — Tower Rendered Funnel Copy Cleanup

## Release ID

`2026-07-17-tower-value-proof-rendered-path-copy-cleanup`

## Status

`candidate`

## Plain-English Summary

Tower's rendered Value Proof Funnel detail page now applies claimable-value wording to the live stage caveats. This closes the browser-proven gap where the detail view still displayed old "realized value/savings" caveat language even after the summary copy was cleaned up.

## Layer Impact

- `global-control-lane`: updates shared Tower presentation copy for all clients using the Tower mart detail view.
- Presentation layer: applies claimable-value wording in the actual rendered Value Proof Funnel detail path.
- Governance layer: preserves the existing value-claim gate and does not alter metric calculations.

## Client Applicability

- All clients: safer Tower value-proof detail copy.
- Specific clients: Healthcare Demo/Meridian is the signed-in proof target.
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
- Pending: signed-in Healthcare Demo Tower browser proof after ACA deploy.

## Rollout Plan

Merge through the protected PR lane. The repo-owned ACA main deploy workflow builds and deploys the digest-pinned image. Signed-in Healthcare Demo/Meridian Tower proof is required before calling the rendered copy cleanup live-proven.

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

This does not redesign the Tower data mart, add usage feeds, or change value-claim calculations.
