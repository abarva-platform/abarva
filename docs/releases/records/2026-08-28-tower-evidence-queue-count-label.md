# 2026-08-28-tower-evidence-queue-count-label — Tower Evidence Queue Count And Tab Routing

## Release ID

`2026-08-28-tower-evidence-queue-count-label`

## Status

`candidate`

## Plain-English Summary

The Tower executive footer points to the same Evidence & Actions review queue
count shown in the tab label. The release also hardens Tower tab state so a
stale `?tab=` query value cannot undo a local click on a top tab, footer link,
or executive Review button.

## Layer Impact

- Products: Tower presentation logic only in the `global-control-lane`. The
  change updates a Layer 4 command-center label, fallback count, and tab-state
  synchronization.
- Canonical model: No change.
- Source adapters: No change.
- Client intake: No change.

## Client Applicability

- All clients: Tenants using the Tower command center projection receive the UI
  copy/count correction after deployment.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/tower/command-center/views/CommandCenterView.tsx`
- `src/components/tower/command-center/TowerCommandCenter.tsx`
- `src/components/tower/command-center/__tests__/TowerCommandCenter.test.tsx`

## QA / Validation

- PASS: `npx jest src/components/tower/command-center/__tests__/TowerCommandCenter.test.tsx --runInBand`
- PASS: `npx eslint src/components/tower/command-center/TowerCommandCenter.tsx src/components/tower/command-center/__tests__/TowerCommandCenter.test.tsx`

## Rollout Plan

Merge by PR to `main`. The repo-owned Azure Container Apps main deployment
workflow builds and deploys the digest-pinned web image to
`ca-abarva-web-lab-eastus`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: Azure Container Apps web image update only through
  the repo-owned workflow
- Approved image digest: To be recorded by the deployment workflow after merge
- ACA runtime invariant: Required after deployment
- Worker image invariant: Required after deployment
- Feature/env flag update path: None
- Live signed-in proof required: Yes, Tower command center route

## Rollback Plan

Revert the UI copy/count helper change and redeploy through the same ACA main
workflow. No schema, loader, adapter, or tenant-data rollback is required.

## Audit Evidence

- PR and CI evidence for this release candidate
- ACA main deploy run after merge
- Signed-in Tower route proof after deployment

## Known Gaps

This does not repair source-data quality or distribution. It keeps tab routing
and executive copy aligned with the review queue population.
