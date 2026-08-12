# 2026-08-12-source-evidence-contract-table — Source Stage Evidence Row Contract

## Release ID

`2026-08-12-source-evidence-contract-table`

## Status

`candidate`

## Plain-English Summary

The Source stage workflow now presents evidence requests as an operational row contract: what evidence is needed, whether it is required, which source or owner should provide it, the expected grain and history, the template or parser target, what artifact or insight will change, current status, and the next action. This reduces ambiguity before upload without changing any evidence semantics or making missing evidence look complete.

## Layer Impact

- Release lane: `global-control-lane`.
- Products: Source event workspace presentation only. The stage canvas renders existing view-model fields more clearly.
- Canonical model: no schema or calculation change.
- Source adapters: no parser or upload behavior change.

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

- `npx jest src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageApproval.test.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageFallbacks.test.tsx --runInBand` passed.
- `npx eslint src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageApproval.test.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageFallbacks.test.tsx` passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` passed.
- `git diff --check` passed.
- `npm run release:check` passed.
- Signed-in browser proof on a live Source event workspace: not run before merge; required after repo-owned ACA deploy.

## Rollout Plan

Merge through PR to `main`. The repo-owned ACA main deploy workflow builds and deploys the shared web image. No migration or manual data-plane job is required.

## Deployment Authority

- Repo-owned deploy workflow: required for live activation.
- Shared runtime mutators: none in this change.
- Approved image digest: captured by the ACA main deploy workflow after merge.
- ACA runtime invariant: required before live claim.
- Worker image invariant: no worker image change expected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Source event stage workspace.

## Rollback Plan

Revert the PR. Since this is presentation-only, rollback does not require data repair or migration rollback.

## Audit Evidence

- PR URL and merge commit.
- Focused test, lint, typecheck, release check outputs.
- ACA deploy workflow run and runtime invariant proof.
- Signed-in browser screenshot and DOM/readback proof.

## Known Gaps

This does not implement new parsing, new source-system adapters, or artifact quality scoring. It only makes the existing required-evidence contract explicit in the stage UI, including the operational grain/history and artifact-impact fields the user needs before uploading.
