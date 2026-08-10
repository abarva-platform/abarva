# 2026-08-10-source-stage-approval-workspace-routing — Source Stage Approval Routing

## Release ID

`2026-08-10-source-stage-approval-workspace-routing`

## Status

`candidate`

## Plain-English Summary

Completed Source stages now route users to the event canvas approval workspace instead of the standalone intake-approval route. The per-event approval card also reconciles a fully completed stage checklist into a ready approval display, so a completed evidence workflow does not appear beside stale gate-count language.

## Layer Impact

- `global-control-lane`: shared Source workflow shell behavior for every tenant.
- Product / Source: stage handoff links open the in-event approvals workspace where the stage gate action actually lives.
- Source read model: no schema or data changes; the shell view reconciles completed stage checklist state with the approval item presented inside the event canvas.

## Client Applicability

- All clients: yes, through shared Source event workflow.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/approvals-inbox.ts`
- `src/lib/source/source-event-shell-v2.ts`
- `src/lib/source/__tests__/approvals-inbox.test.ts`
- `src/lib/source/__tests__/source-event-shell-v2.test.ts`

## QA / Validation

- Pass: `npx jest src/lib/source/__tests__/approvals-inbox.test.ts src/lib/source/__tests__/source-event-shell-v2.test.ts src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageApproval.test.tsx --runInBand` — 21/21 passed. Existing duplicate manual mock warnings were emitted by Jest.
- Pass: `npx eslint src/lib/source/approvals-inbox.ts src/lib/source/source-event-shell-v2.ts src/lib/source/__tests__/approvals-inbox.test.ts src/lib/source/__tests__/source-event-shell-v2.test.ts src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageApproval.test.tsx`.
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false`.
- Pass: `npm run release:check`.

## Rollout Plan

Merge through PR. The repo-owned ACA main deploy workflow builds and deploys the exact merged SHA. No migration, data load, or feature flag change is required.

## Deployment Authority

- Repo-owned deploy workflow: required for live runtime rollout.
- Shared runtime mutators: none in this change.
- Approved image digest: produced by the main deploy workflow after merge.
- ACA runtime invariant: required before claiming live.
- Worker image invariant: standard main deploy workflow check.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for a complete Source workflow smoke. This release includes local regression coverage but does not by itself prove a full browser progression.

## Rollback Plan

Revert the PR. Stage handoff links return to the prior route behavior.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/6124
- Local QA output: focused Jest 21/21 passed.
- Release record: this file.

## Known Gaps

This does not yet fix parsers that store files without satisfying stage readiness, the upload widget retaining stale selected files, or the need for an explicit stage/type selector in the Files workspace.
