# 2026-06-15-source-workspace-visual-polish — Source Workspace Visual Polish

## Release ID

`2026-06-15-source-workspace-visual-polish`

## Status

`candidate`

## Plain-English Summary

This release tightens the Source workspace file explorer after live review showed the first table version was structurally correct but visually too heavy. The file table now gets more horizontal space, the preview pane behaves like a compact inspector instead of a document hero, and internal-looking labels are mapped to operator-friendly text.

## Layer Impact

- `global-control-lane`: Updates the shared Source workspace UI used by Source events across clients.
- No data-plane, ingestion, parsing, approval, or storage behavior changes are included.

## Client Applicability

- All clients: Source workspace layout and file inspector polish.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/workspace-explorer/WorkspaceExplorer.tsx`: adjusts the file explorer grid, table density, compact preview typography, detail row styling, and human-readable owner/source labels.
- `src/components/workspace-explorer/__tests__/WorkspaceExplorer.test.tsx`: adds regression coverage that raw `user_...` owner IDs and `source_artifacts registry` labels are not rendered in the workspace UI.

## QA / Validation

- `npx jest src/components/workspace-explorer/__tests__/WorkspaceExplorer.test.tsx --runInBand` passed.
- `npx eslint src/components/workspace-explorer/WorkspaceExplorer.tsx src/components/workspace-explorer/__tests__/WorkspaceExplorer.test.tsx` passed.
- `git diff --check` passed.

## Rollout Plan

Merge to `main`, build the normal Azure Container Apps image, deploy the new image to the web container app, and verify the signed-in Source workspace in Chrome. No migration or feature flag change is required.

## Rollback Plan

Revert the UI commit or roll Azure Container Apps traffic back to the previous known-good revision. Because this is a presentation-only change, rollback does not require data repair.

## Audit Evidence

- Focused Jest and ESLint output from this branch.
- Signed-in Chrome screenshot after deploy should show the compact table and inspector.
- Azure Container Apps revision/image metadata after rollout.

## Known Gaps

This does not redesign the broader Source workflow, ingestion quarantine, or parsing contract. It only corrects the visual quality of the workspace file explorer already deployed.
