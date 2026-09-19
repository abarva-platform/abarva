# 2026-09-19-source-new-completed-event-state — Source New Completed Event State

## Release ID

`2026-09-19-source-new-completed-event-state`

## Status

`candidate`

## Plain-English Summary

Source New event workspaces now render completed events as terminal. A completed event shows an event-status panel and final-stage note instead of presenting a pending next action. Active events keep their current-stage action.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 Products: updates Source New workspace presentation only. No canonical model, source adapter, tenant data, artifact, approval, lifecycle write, or stage mapping behavior changes.

## Client Applicability

- All clients: Yes, wherever the Source New workspace is enabled.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/source/new-workspace/SourceNewWorkspace.tsx` — renders completed events with terminal status copy and no pending next-action CTA.
- `src/components/source/new-workspace/SourceNewWorkspace.test.tsx` — adds behavioral coverage for completed and active event rendering.

## QA / Validation

- Pass: `npx jest src/components/source/new-workspace/SourceNewWorkspace.test.tsx src/lib/source/new-workspace/phase-state.test.ts --runInBand`
- Pass: `npx eslint src/components/source/new-workspace/SourceNewWorkspace.tsx src/components/source/new-workspace/SourceNewWorkspace.test.tsx src/lib/source/new-workspace/phase-state.ts src/lib/source/new-workspace/phase-state.test.ts`
- Pass: `npm run typecheck`
- Pass: `npm run release:check`

## Rollout Plan

Merge through PR, then deploy through the repo-owned Azure Container Apps main deployment workflow. No migration, data-plane job, feature flag, or manual data correction is required.

## Deployment Authority

- Repo-owned deploy workflow: Required for shared Product/Lab runtime deployment.
- Shared runtime mutators: None in this change.
- Approved image digest: To be produced by the repo-owned deploy workflow after merge.
- ACA runtime invariant: Required after deployment before claiming live proof.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, inspect a completed Source New event and an active Source New event after deployment.

## Rollback Plan

Revert the PR and redeploy the previous approved web image. No data rollback is required because the change is presentation-only.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/7928
- Focused component test, scoped lint, typecheck, and release check output from this branch.
- Post-deploy signed-in Source New readback for completed and active event states.

## Known Gaps

No live signed-in proof has been captured for this candidate before merge/deploy.
