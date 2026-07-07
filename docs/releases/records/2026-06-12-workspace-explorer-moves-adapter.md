# 2026-06-12-workspace-explorer-moves-adapter — Workspace Explorer Moves Adapter

## Release ID

`2026-06-12-workspace-explorer-moves-adapter`

## Status

`candidate`

## Plain-English Summary

Workspace Explorer now has a read-only Moves adapter. When `workspace_explorer_moves` is enabled, a Strategic Move detail page shows a Workspace link and `/strategic-moves/[moveId]/workspace` renders the shared Explorer shell over that Move's File Cabinet and generated deliverable rows. File Cabinet rows come from `move_artifacts`; generated deliverables and their `cited_input_ids` lineage come from `generated_artifacts`.

## Layer Impact

- `global-control-lane`: Adds a Moves read adapter and flagged route using the existing shared Workspace Explorer shell.
- `public-demo`: Enables a consistent Moves workspace surface for demo tenants when the flag is enabled.

## Client Applicability

- All clients: No change while `workspace_explorer_moves` is off.
- Specific clients: Tenants with `workspace_explorer_moves` enabled can open the Moves workspace.
- Internal only: No.
- Public/demo only: Useful for demo and pilot Moves walkthroughs.
- Feature flag: `workspace_explorer_moves`.

## Changes Included

- Adds Moves workspace mapping from `move_artifacts` and `generated_artifacts`.
- Adds `listGeneratedArtifactsForMove` helper for generated deliverable lineage.
- Adds `/strategic-moves/[moveId]/workspace` behind `workspace_explorer_moves`.
- Adds a flagged Workspace link to Strategic Move detail.
- Adds adapter mapping tests.

## QA / Validation

- Passed: `npm test -- --runTestsByPath src/lib/workspace-explorer/__tests__/moves-adapter-mapping.test.ts src/components/workspace-explorer/__tests__/WorkspaceExplorer.test.tsx --runInBand`
- Passed: `npx eslint` on touched TS/TSX files
- Passed: `npx tsc --noEmit --pretty false`
- Passed: `npm run audit:architecture-rules`
- Passed: `npm run release:check -- --base origin/main --head HEAD`
- Passed: `git diff --check`

## Rollout Plan

Merge to `main`. The route remains hidden unless `workspace_explorer_moves` is enabled for a tenant. No migration or deployment flag flip is included in this slice.

## Rollback Plan

Revert the PR or disable `workspace_explorer_moves`. No data rows are changed by the adapter.

## Audit Evidence

- PR URL and CI run for this release candidate.
- Local test output from the QA commands above.
- Runtime sources: `move_artifacts` and `generated_artifacts`.

## Known Gaps

- No live ACA browser, DB row, or Log Analytics verification is included in this slice.
- Moves upload/version from Explorer remains a later slice; this adapter is read-only.
- Source ENGINE migration remains quarantined and is not touched.
