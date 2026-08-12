# 2026-08-12-source-stage-readback-feedback — Source Stage Readback Feedback

## Release ID

`2026-08-12-source-stage-readback-feedback`

## Status

`candidate`

## Plain-English Summary

The Source stage workflow now distinguishes captured input, stored files, typed fact readback, and file-review blockers. A completed checklist row no longer simply says "done" when file review still blocks stage approval, and a task is not described as live fact evidence until persisted evidence actually marks it complete.

## Layer Impact

- Release lane: `global-control-lane`.
- Products: Source event workspace presentation and view-model grounding.
- Canonical model: no schema, parser, calculation, or data migration change.
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
- `src/lib/source/source-event-shell-v2.ts`
- `src/lib/source/__tests__/source-event-shell-v2.test.ts`

## QA / Validation

Candidate validation status:

- `npm test -- --runTestsByPath src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageApproval.test.tsx src/lib/source/__tests__/source-event-shell-v2.test.ts --runInBand` passed.
- Broader lint, typecheck, diff, and release checks are required before merge.
- Signed-in browser proof on a live Source event workspace is required after the repo-owned ACA deploy.

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

Revert the PR. Since this is presentation and view-model grounding only, rollback does not require data repair or migration rollback.

## Audit Evidence

- PR URL and merge commit.
- Focused test, lint, typecheck, release check outputs.
- ACA deploy workflow run and runtime invariant proof.
- Signed-in browser screenshot and DOM/readback proof.

## Known Gaps

This does not add new parsers, new source-system adapters, or an artifact quality scorer. It makes the existing stage evidence/readback state more explicit and prevents template-bound tasks from appearing as live facts without persisted evidence.
