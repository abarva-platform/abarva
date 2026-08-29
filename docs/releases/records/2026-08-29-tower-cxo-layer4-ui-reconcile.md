# 2026-08-29-tower-cxo-layer4-ui-reconcile — Tower Layer 4 CXO Wording

## Release ID

`2026-08-29-tower-cxo-layer4-ui-reconcile`

## Status

`candidate`

## Plain-English Summary

Tower now presents the active Layer 4 product projection in simpler executive terms. The headline no longer compresses partial value proof into a misleading single gate number, the value proof chart keeps approved spend, promised value, measured value, Finance approval, and board-claimable value separate, and the AI portfolio opens on a full initiatives/tools table before lens-specific views.

## Layer Impact

Layer 4 Products, `global-control-lane`: updates Tower presentation and tab behavior only. The change reads the same governed serving rows and does not create, alter, or backfill source, adapter, canonical, projection, or cube rows.

## Client Applicability

- All clients: Tower users on the shared Product/Lab runtime receive the presentation update.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Tower command-center tab badge uses open evidence actions for the Evidence & Actions tab.
- Tower executive headline and summary use board-claimable value and open-claim count instead of a single gate-break sentence.
- Tower value proof chart uses a non-substituting value-state sequence.
- AI Portfolio tab defaults to the full initiatives/tools table and keeps Cost, Risk, and Adoption lens controls interactive.
- Focused Tower component tests updated for the revised presentation contract.

## QA / Validation

- `npx jest src/components/tower/command-center/__tests__/TowerCommandCenter.test.tsx --runInBand` passed.
- `npx jest src/lib/tower/command-center/__tests__/view-model.test.ts --runInBand` passed.
- `npx eslint src/components/tower/command-center/TowerCommandCenter.tsx src/components/tower/command-center/views/CommandCenterView.tsx src/components/tower/command-center/views/ContractTabs.tsx` passed.

## Rollout Plan

Merge by pull request to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the digest-pinned web image. No database migration or data rebuild is required for this presentation-only release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this change
- Approved image digest: populated by the main deploy workflow after merge
- ACA runtime invariant: required before live claim
- Worker image invariant: required before live claim
- Feature/env flag update path: none
- Live signed-in proof required: yes, `/tower` with an authenticated tenant session

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. No data rollback is required because the change is product presentation only.

## Audit Evidence

- Pull request and CI checks for this release.
- Main deploy workflow run after merge.
- ACA runtime invariant proof after deploy.
- Signed-in Tower browser proof after deploy.

## Known Gaps

None known for this Layer 4 presentation change.
