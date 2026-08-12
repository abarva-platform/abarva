# 2026-08-12-source-stage-ready-primary-action — Source Stage Ready Primary Action

## Release ID

`2026-08-12-source-stage-ready-primary-action`

## Status

`candidate`

## Plain-English Summary

The Source stage workspace now gives users one obvious next action when required inputs are complete. If file-review gaps still exist, the primary button sends the user to Files to accept client-final artifacts, while approval remains available only as an exception path. If no file-review gaps remain, the primary action opens the approval gate directly.

## Layer Impact

- Release lane: `global-control-lane`.
- Products: Source event workspace presentation and navigation clarity.
- Canonical model: no schema, calculation, parser, or data migration change.
- Source adapters: no source-system adapter change.

## Client Applicability

- All clients: yes, any tenant using the shared Source stage workflow.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx`
- `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageApproval.test.tsx`

## QA / Validation

Candidate validation status:

- `npm test -- --runTestsByPath src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageApproval.test.tsx --runInBand` passed.
- `npx eslint src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageApproval.test.tsx` passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` passed.
- `git diff --check` passed.
- `npm run release:check` is required before merge.
- Signed-in browser proof on a live Source stage workspace is required after the repo-owned ACA deploy.

## Rollout Plan

Merge through PR to `main`. The repo-owned ACA main deploy workflow builds and deploys the shared web image. No migration, feature flag, or manual data-plane job is required.

## Deployment Authority

- Repo-owned deploy workflow: required for live activation.
- Shared runtime mutators: none in this change.
- Approved image digest: captured by the ACA main deploy workflow after merge.
- ACA runtime invariant: required before live claim.
- Worker image invariant: no worker image change expected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Source event stage workspace.

## Rollback Plan

Revert the PR. Since this is presentation and navigation clarity only, rollback does not require data repair or migration rollback.

## Audit Evidence

- PR URL and merge commit.
- Focused test, lint, typecheck, diff, and release check outputs.
- ACA deploy workflow run and runtime invariant proof.
- Signed-in browser screenshot and DOM proof.

## Known Gaps

This does not create new generated artifacts, score artifact quality, or parse new evidence. It only clarifies the ready-stage forward path using the existing stage and artifact-readiness state.
