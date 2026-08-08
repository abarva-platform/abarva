# 2026-08-08-tower-command-center-declutter — Tower Command Center Declutter

## Release ID

`2026-08-08-tower-command-center-declutter`

## Status

`candidate`

## Plain-English Summary

The Tower Command Center opening tab now reads as a focused executive cockpit instead of a dense report page. The first screen keeps the board verdict, three critical proof metrics, the read-model scope, and two decision visuals. Detailed proof queues and lineage detail remain available in the dedicated Tower tabs instead of competing for attention on the first screen.

## Layer Impact

Release lane: `global-control-lane`.

Products: Updates the Tower Layer 4 projection UI only. No canonical model, adapter, tenant input, loader, or mart calculation is changed.

## Client Applicability

- All clients: Tower Command Center users receive the decluttered opening tab after rollout.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/tower/command-center/views/CommandCenterView.tsx`
- `src/components/tower/command-center/TowerCommandCenter.module.css`
- `src/components/tower/command-center/charts/ValueWaterfallChart.tsx`
- `src/components/tower/command-center/__tests__/TowerCommandCenter.test.tsx`

## QA / Validation

- `npx eslint src/components/tower/command-center/views/CommandCenterView.tsx src/components/tower/command-center/charts/ValueWaterfallChart.tsx src/components/tower/command-center/__tests__/TowerCommandCenter.test.tsx` passed.
- `npm test -- --runTestsByPath src/components/tower/command-center/__tests__/TowerCommandCenter.test.tsx src/components/tower/command-center/__tests__/render-harness.test.tsx` passed, with only existing duplicate manual-mock warnings.
- Render harness regenerated under `/Users/anand/Downloads/tower-command-center-declutter-qa-2026-08-08`.
- Playwright screenshot checks at `1728x960` and `1440x900` showed no page-level vertical overflow and confirmed removed clutter labels were absent from the rendered DOM.

## Rollout Plan

Merge through the protected repository PR path. The repo-owned Azure Container Apps main deploy workflow builds and deploys the resulting main image.

## Deployment Authority

- Repo-owned deploy workflow: Required for shared product runtime rollout.
- Shared runtime mutators: None in this change.
- Approved image digest: Produced by the main deploy workflow after merge.
- ACA runtime invariant: Must be proven by the deploy workflow and post-deploy runtime checks before claiming live proof.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Tower Command Center route after ACA rollout.

## Rollback Plan

Revert the PR and redeploy main through the repo-owned Azure Container Apps workflow. No migration or data rollback is required.

## Audit Evidence

- PR URL and merge commit after publication.
- Focused Jest and ESLint command output from this release branch.
- Render harness HTML and screenshots under `/Users/anand/Downloads/tower-command-center-declutter-qa-2026-08-08`.
- ACA deployment evidence and signed-in Tower route proof after rollout.

## Known Gaps

This release does not change Tower mart projection, lineage loading, or source-data interpretation. Those are separate data-plane and analytics-model concerns.
