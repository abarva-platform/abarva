# 2026-06-12-workspace-explorer-governed-upload — Workspace Explorer Governed Upload

## Release ID

`2026-06-12-workspace-explorer-governed-upload`

## Status

`candidate`

## Plain-English Summary

Workspace Explorer can now open a governed Source upload flow from the Source event canvas. The new `Upload` chip sends users to the Explorer upload panel, which posts multipart files to the existing Source artifact upload route. That route remains the single write path for Source uploads: it applies the sensitive-upload guard, stores accepted bytes, creates a source artifact registry row, syncs canvas evidence/gates when possible, and writes an activity log row.

## Layer Impact

- `global-control-lane`: Adds a reusable Workspace Explorer upload intent and UI panel. The panel is read/write only through existing module upload routes and does not introduce a new generic deliverables API.
- `public-demo`: Source demo users with `workspace_explorer_source` enabled see an Upload chip and a governed upload form in the Source Workspace Explorer.

## Client Applicability

- All clients: No change while `workspace_explorer_source` is off.
- Specific clients: Any tenant with `workspace_explorer_source` enabled receives the Source Workspace upload affordance.
- Internal only: No.
- Public/demo only: Useful for demo and pilot flows where Source evidence needs to be uploaded through the governed path.
- Feature flag: `workspace_explorer_source`.

## Changes Included

- Adds `WorkspaceUploadIntent` to the Workspace Explorer contract.
- Adds a governed upload panel to `WorkspaceExplorer`.
- Wires `/source/events/[eventId]/workspace?intent=upload&stage=...` to the existing Source artifact upload route.
- Adds a Source canvas `Upload` chip next to `Workspace` and `Generate`.
- Extends tests for Explorer upload behavior and Source canvas chip rendering.

## QA / Validation

- Passed: `npm test -- --runTestsByPath src/components/workspace-explorer/__tests__/WorkspaceExplorer.test.tsx src/__tests__/integration/source/source-event-canvas-render.test.tsx --runInBand`
- Passed: `git diff --check`
- Passed: `npm run audit:architecture-rules`
- Passed: `npx eslint` on touched TS/TSX files
- Passed: `npx tsc --noEmit --pretty false`
- Passed: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to `main`. The behavior remains hidden unless `workspace_explorer_source` is enabled for a tenant. No migration is included in this slice.

## Rollback Plan

Revert the PR or disable `workspace_explorer_source`. Existing Source upload routes and previously uploaded artifact rows are not changed by rollback.

## Audit Evidence

- PR URL and CI run for this release candidate.
- Local test output from the QA commands above.
- Existing governed upload route: `src/app/api/v1/source/[eventId]/artifacts/upload/route.ts`.

## Known Gaps

- No live ACA upload, DB row, or Log Analytics verification is included in this slice.
- Moves Workspace upload is intentionally deferred until the Moves adapter slice.
- Source artifact upload records a new registry row and reports the returned version; this slice does not add server-side supersede/backfill behavior beyond the existing upload route.
