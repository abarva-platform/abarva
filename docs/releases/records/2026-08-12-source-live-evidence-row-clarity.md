# 2026-08-12-source-live-evidence-row-clarity — Source live evidence row clarity

## Release ID

`2026-08-12-source-live-evidence-row-clarity`

## Status

`candidate`

## Plain-English Summary

The live Source event workflow now makes completed evidence rows easier to recognize in the canonical stage canvas. Captured evidence rows show a green check, a muted completed-row treatment, and a `Done` status while still directing the operator to Files when artifact review remains open.

## Layer Impact

- Release lane: `global-control-lane`.
- Products: Source UI only. The change affects the presentation of the existing stage evidence request table in `SourceAnalyticsCanvas`.
- Canonical model: No change.
- Source adapters: No change.
- Client intake: No change.

## Client Applicability

- All clients: Yes, all users on the canonical Source event stage canvas receive the presentation change after deployment.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx`
- `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageApproval.test.tsx`
- `docs/backlog/tracks/04-source-commercial/SOURCE_NEW_EVENT_BEST_IN_CLASS_PROGRAM.md`

## QA / Validation

- `npx jest src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageApproval.test.tsx --runInBand` passed.
- `npx eslint src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageApproval.test.tsx` passed.
- `git diff --check` pending before PR.
- `npm run release:check -- --base origin/main --head HEAD` pending before PR.

## Rollout Plan

Merge through PR to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the resulting `main` image. No manual runtime mutation, data migration, or feature flag action is required.

## Deployment Authority

- Repo-owned deploy workflow: Required for production/lab activation.
- Shared runtime mutators: None in this PR.
- Approved image digest: Produced by the main deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy because the deploy workflow updates worker jobs with the approved digest.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, a Source event Scope route should show completed evidence rows with the new done treatment.

## Rollback Plan

Revert this PR and let the repo-owned ACA main deploy workflow redeploy the prior UI. No database rollback is required.

## Audit Evidence

- PR URL: pending.
- Local focused test and lint output from the candidate branch.
- Signed-in pre-slice route screenshot captured at `/Users/anand/Downloads/source-e2e-qa-20260810/src58-signed-in-scope-route-20260812T2048Z.png`.
- Post-deploy ACA runtime invariant and signed-in screenshot required after merge.

## Known Gaps

- This does not implement parser ingestion, artifact acceptance, approval automation, or workflow persistence changes.
- The previously shipped simple-front component path is not the canonical live Source event detail route; this slice targets the live analytics/stage canvas.
