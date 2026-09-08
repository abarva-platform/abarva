# 2026-09-08-source-workspace-evidence-graph-visuals - Source Workspace Evidence And Graph Visuals

## Release ID

`2026-09-08-source-workspace-evidence-graph-visuals`

## Status

`candidate`

## Plain-English Summary

The Source workspace Evidence and Contract Graph tabs now render compact visual summaries above their audit tables. Evidence lanes show proportional row-count bars, graph volume shows substrate row-volume cards, and the mapping view shows a source-to-adapter-to-canonical-to-product flow before the detailed table.

## Layer Impact

Layer 4 - Products, `global-control-lane`: updates the Source workspace presentation layer only. Existing Source row counts and claim boundaries are reused as-is; no tenant data, loader, adapter, or canonical model writes are included.

## Client Applicability

- All clients: Source workspace users on the shared Source 360 route.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx`
- `src/app/(maestro)/source/preview/workspace/workspace.css`
- `src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts`

## QA / Validation

Pass before merge:

- `npm test -- WorkspaceExecutiveShell.performance.test.ts --runInBand`
- `npm test -- WorkspaceClient.ecl-browser.test.tsx --runInBand`
- `npx eslint 'src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx'`
- `npm run release:check`

Expected warning: Jest may report the existing duplicate manual mock warnings for markdown packages.

## Rollout Plan

Merge through PR and deploy through the repo-owned Azure Container Apps main deploy workflow.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned deploy workflow
- Approved image digest: assigned by the deploy workflow
- ACA runtime invariant: required after deploy
- Worker image invariant: required after deploy
- Feature/env flag update path: none
- Live signed-in proof required: Source workspace Evidence tab and Contract Graph Volume/Mapping subtabs render visual summaries without debug scaffolding or load errors.

## Rollback Plan

Revert the PR and redeploy through the repo-owned main deploy workflow. There are no schema or data rollback steps.

## Audit Evidence

Add PR URL, CI run, ACA deploy run, runtime invariant artifact, and signed-in Source workspace proof after merge/deploy.

## Known Gaps

This release does not change Source data coverage, optimization calculations, aVa grounding, or payload size.
