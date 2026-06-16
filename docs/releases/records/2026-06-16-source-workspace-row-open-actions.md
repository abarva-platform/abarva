# 2026-06-16-source-workspace-row-open-actions — Source Workspace Row Open Actions

## Release ID

`2026-06-16-source-workspace-row-open-actions`

## Status

`candidate`

## Plain-English Summary

The Source event workspace now behaves more like a focused file explorer. The large right-side preview rail is removed, files remain in a compact table, and each real file row has a direct Open action. The Open action prefers the artifact download/stream endpoint so uploaded or generated evidence opens through the tenant-scoped artifact route instead of depending on a fragile detail page.

## Layer Impact

- `global-control-lane`: Updates shared Source workspace UI behavior for every client using Source events.
- `internal-admin`: No admin-only behavior changed.
- `client-data-lane`: No schema, ingestion, search, or client data changes.

## Client Applicability

- All clients: Source event workspaces receive the compact row-action behavior after deployment.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/workspace-explorer/WorkspaceExplorer.tsx`: removes the preview rail, changes the table's final column to Action, and links file rows to `downloadHref` before falling back to `href`.
- `src/components/workspace-explorer/__tests__/WorkspaceExplorer.test.tsx`: covers the compact table, absence of preview metadata, and the download-first Open action.

## QA / Validation

- `npx jest src/components/workspace-explorer/__tests__/WorkspaceExplorer.test.tsx src/lib/workspace-explorer/__tests__/source-adapter-mapping.test.ts --runInBand` passed: 2 suites, 12 tests.
- ESLint and release checks must pass before merge.
- Live signed-in browser verification is required after Azure deployment because local clean worktree validation cannot prove the authenticated production route.

## Rollout Plan

Merge to `main`, let the Azure Container Apps main deploy workflow build and deploy the updated app image, then verify a signed-in Source event workspace in the browser. The expected live proof is a compact two-column workspace shell, no right preview rail, and file-row Open actions that resolve through `/api/v1/source/artifacts/[artifactId]/download`.

## Rollback Plan

Revert the PR or redeploy the prior Azure Container Apps image. No migration or data rollback is required.

## Audit Evidence

- Pull request, CI checks, and Azure deployment run for this change.
- Focused Jest output for the workspace explorer and source adapter mapping suites.
- Post-deploy browser screenshot or crawl evidence from a signed-in SkyHarbor Source event workspace.

## Known Gaps

Signed-in live browser verification depends on an authenticated session. If the automation only reaches the Clerk one-time-code screen, record the route as deployment-ready but auth-blocked rather than click-verified.
