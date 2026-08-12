# 2026-08-12-source-stage-ready-artifact-copy — Source Stage-Ready Copy Alignment

## Release ID

`2026-08-12-source-stage-ready-artifact-copy`

## Status

`candidate`

## Plain-English Summary

When a Source stage has all required workflow inputs completed but still has artifact review gaps, the stage workflow rail now tells the user to review Files before approval. Previously that rail could still say to open the approval gate, which contradicted the stage-ready panel and could make a blocked stage look ready.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 - Products: Updates Source workflow presentation copy only. No canonical data, source adapter, intake template, tenant data, or metric logic changes.

## Client Applicability

- All clients: Yes. The Source stage workflow uses shared product components.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx`
- `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageApproval.test.tsx`

## QA / Validation

- `npm test -- --runTestsByPath src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageApproval.test.tsx --runInBand` passed.
- `npx eslint src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageApproval.test.tsx` passed.
- `git diff --check` passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` passed.
- `npm run release:check` passed.

## Rollout Plan

Merge to `main`, let the repo-owned Azure Container Apps main deploy workflow build and deploy the exact merge SHA, then verify the signed-in Source stage workflow route.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: To be captured from the deploy evidence bundle after merge.
- ACA runtime invariant: Required before claiming live.
- Worker image invariant: Required before claiming live.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR and redeploy through the same repo-owned ACA workflow. No schema or data rollback is required.

## Audit Evidence

- Pull request URL: pending.
- Merge SHA: pending.
- ACA deploy run: pending.
- Signed-in browser proof: pending.

## Known Gaps

This does not change the artifact review queue, approval policy, parser behavior, or generated artifact quality. It only removes contradictory stage-ready copy in the blocked-artifact state.
