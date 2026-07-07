# 2026-06-13-moves-workspace-generate-intent — Moves Workspace Generate Intent

## Release ID

`2026-06-13-moves-workspace-generate-intent`

## Status

`candidate`

## Plain-English Summary

The Moves Workspace Explorer can now open a governed Generate panel when the URL carries `?intent=generate`. The panel lists the board-grade documents already supported by the Move registry and calls the existing per-module Moves document routes without changing their API contract. Source generation remains unchanged and continues to use its existing JSON POST route by default.

## Layer Impact

- `global-control-lane`: updates the shared Workspace Explorer generate client so it can support both Source JSON generation and Moves board-grade HTML generation.
- `global-control-lane`: wires the Moves workspace page to expose existing board-grade document candidates behind the `workspace_explorer_moves` feature flag.

## Client Applicability

- All clients: no behavior changes while `workspace_explorer_moves` is disabled.
- Specific clients: tenants with `workspace_explorer_moves` enabled can use the Moves workspace generate panel.
- Internal only: none.
- Public/demo only: none.
- Feature flag: `workspace_explorer_moves`.

## Changes Included

- Added optional request metadata to `WorkspaceGenerateCandidate` for existing GET/HTML routes.
- Extended `WorkspaceExplorer` to preserve the default Source POST/JSON path while supporting Moves GET/HTML routes.
- Added Moves generate candidates from the existing board-artifacts registry.
- Wired `/strategic-moves/[moveId]/workspace?intent=generate` to show the generate panel.
- Added component coverage for the Moves GET/HTML generate path.

## QA / Validation

- Pass: `npm ci` completed in the clean worktree. Existing npm audit vulnerability noise was reported but did not block dependency install.
- Pass: `npx jest src/components/workspace-explorer/__tests__/WorkspaceExplorer.test.tsx --runInBand`
- Pass: `npx eslint src/components/workspace-explorer/WorkspaceExplorer.tsx src/components/workspace-explorer/__tests__/WorkspaceExplorer.test.tsx src/lib/workspace-explorer/moves-adapter.ts src/lib/workspace-explorer/types.ts 'src/app/(maestro)/strategic-moves/[moveId]/workspace/page.tsx'`
- Pass: `npx tsc --noEmit --pretty false`
- Pass: `npm run audit:architecture-rules`
- Pass: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge through PR after checks pass. Deploy the resulting image to the Azure Container Apps lab, keep `workspace_explorer_moves` tenant-gated, then verify the SkyHarbor workspace generate path against the live ACA revision.

## Rollback Plan

Disable `workspace_explorer_moves` for affected tenants to hide the workspace route, or revert this PR. No destructive data migration is included.

## Audit Evidence

- PR, CI run, local validation output, and live ACA SkyHarbor proof will be attached after merge/deploy verification.

## Known Gaps

This slice only exposes existing Moves generators from the Workspace Explorer. Generated-artifact approval and phase-advance proof are validated in the converged live proof slice rather than implemented here.
