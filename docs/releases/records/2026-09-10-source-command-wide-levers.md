# 2026-09-10-source-command-wide-levers — Source Command Wide Levers

## Release ID

`2026-09-10-source-command-wide-levers`

## Status

`candidate`

## Plain-English Summary

The command-center Levers panel now uses the full content grid width when it renders the action-order story. The component already applied the `sw-v2-span-3` class, but the stylesheet did not define that class, so the panel collapsed into the primary grid column and left a large unused region on the right side of the canvas.

This release defines the missing span class and adds a regression assertion that the class used for full-width command panels maps to `grid-column: 1 / -1`.

## Layer Impact

`global-control-lane`; Layer 4 Products: layout-only Source presentation change. No source adapter, canonical model, account-scoped data, loader, migration, retrieval, or calculation logic changes.

## Client Applicability

- All clients: Source command-center workspace users receive the layout fix.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/workspace.css`
- `src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts`

## QA / Validation

- PASS: `npm test -- --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts' --runInBand`
- PASS: `npm test -- --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx' --runInBand`
- PASS: `npx eslint 'src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx'`
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 ./node_modules/.bin/tsc --noEmit --pretty false`

## Rollout Plan

Merge through the protected repository PR path and deploy through the repo-owned ACA main deploy workflow.

## Deployment Authority

- Repo-owned deploy workflow: Required for the shared web runtime.
- Shared runtime mutators: None in this release.
- Approved image digest: To be captured by the deploy workflow after merge.
- ACA runtime invariant: Required before live proof.
- Worker image invariant: Required before live proof.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for `/source?workspaceTab=levers`.

## Rollback Plan

Revert this release commit and redeploy through the repo-owned ACA main deploy workflow. No data rollback is required because no data or schema was changed.

## Audit Evidence

- PR review should confirm the full-width grid class is defined in the stylesheet.
- Regression coverage asserts the full-width grid class exists and maps to `grid-column: 1 / -1`.
- Live proof after deploy should confirm the Source Levers panel spans the command-center canvas.

## Known Gaps

This release does not add new command-center report export or email workflow behavior. It only fixes the layout fidelity of the existing governed Levers surface.
