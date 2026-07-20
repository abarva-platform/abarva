# 2026-07-20-source-focused-upload-wiring — Source Focused Step Upload Wiring

## Release ID

`2026-07-20-source-focused-upload-wiring`

## Status

`candidate`

## Plain-English Summary

The new Source event shell now uses the real governed upload component inside its focused "provide" step panel. A user who uploads volumetrics from the contract shell posts to the existing Source artifact route and, when the task has a fact template, the existing fact-ingest route. The visible dropzone is no longer a presentational placeholder.

## Layer Impact

- `global-control-lane` Product UI: The Source event shell keeps the HTML-contract layout while reusing the proven task uploader behavior.
- `global-control-lane` Data path usage: No new endpoint, schema, or storage path is introduced. Uploads continue through the existing artifact registry and optional typed fact-ingest route.
- `global-control-lane` Test coverage: Adds a shell-level regression so `SourceAnalyticsCanvas` itself proves the focused provide step is wired to upload + fact ingest.

## Client Applicability

- All clients: Applies to Source event pages that render `SourceAnalyticsCanvas`.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Source analytics routing only.

## Changes Included

- `src/components/source/canvas/analytics/TaskChecklist.tsx`
- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx`
- `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx`
- `src/lib/source/source-event-shell-v2.ts`

## QA / Validation

- `npm test -- --runTestsByPath src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx src/components/source/canvas/analytics/__tests__/TaskChecklist.upload.test.tsx --runInBand` — passed, 18/18 tests.
- `npx eslint src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx src/components/source/canvas/analytics/TaskChecklist.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx src/components/source/canvas/analytics/__tests__/TaskChecklist.upload.test.tsx src/lib/source/source-event-shell-v2.ts` — passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false` — passed.

## Rollout Plan

Merge through PR to `main`, then let the repo-owned Azure Container Apps main deploy workflow build and deploy the digest-pinned image. No manual Azure mutation is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: Assigned by the ACA main deploy workflow after merge.
- ACA runtime invariant: Required after deploy before claiming live.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, verify the Source event focused provide step renders a real file input/dropzone in production.

## Rollback Plan

Revert this PR. The old task checklist uploader remains unchanged, and no data migration or schema rollback is needed.

## Audit Evidence

- Candidate PR and checks.
- Focused unit test proving Source shell upload + fact ingest wiring.
- Post-deploy ACA runtime invariant and signed-in browser proof.

## Known Gaps

This only wires focused provide-step uploads. It does not redesign the full Files workspace, approval behavior, or dynamic Intelligence Explorer content.
