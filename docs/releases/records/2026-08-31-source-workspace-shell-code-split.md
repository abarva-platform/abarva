# 2026-08-31-source-workspace-shell-code-split - Source Workspace Shell Code Split

## Release ID

`2026-08-31-source-workspace-shell-code-split`

## Status

`candidate`

## Plain-English Summary

The Source workspace now lazy-loads its chart-heavy executive canvas behind the already-visible app shell and workspace loading frame. This keeps the product navigation and initial Source frame responsive while the richer tab and chart views load.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 products: Source workspace rendering only. No tenant data, adapters, canonical rows, projections, cubes, or retrieval paths are changed.

## Client Applicability

- All clients: Source workspace users receive the lighter initial client render path.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/WorkspaceClient.tsx`
- `src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx`

## QA / Validation

- `npm test -- --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts'` - passed, 20 tests.
- `npx eslint 'src/app/(maestro)/source/preview/workspace/WorkspaceClient.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx'` - passed.
- `npm run release:check -- --changed-only` - pending before release.

## Rollout Plan

Merge through a protected pull request, then deploy through the repo-owned Azure Container Apps main deploy workflow.

## Deployment Authority

- Repo-owned deploy workflow: Required for shared web runtime rollout.
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Produced by the deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required if the deploy workflow updates worker jobs.
- Feature/env flag update path: None.
- Live signed-in proof required: Recommended for perceived-load and tab-click behavior.

## Rollback Plan

Revert the pull request and redeploy through the same ACA workflow. No database rollback is required.

## Audit Evidence

Pull request, focused Source workspace test output, ESLint output, release check output, and ACA deploy workflow evidence after merge.

## Known Gaps

This does not change server-side portfolio query latency or signed-in browser proof. It only reduces the initial client-side rendering burden from the chart-heavy Source canvas.
