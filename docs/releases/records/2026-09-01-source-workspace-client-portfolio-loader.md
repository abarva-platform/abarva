# 2026-09-01-source-workspace-client-portfolio-loader — Source Workspace Client Portfolio Loader

## Release ID

`2026-09-01-source-workspace-client-portfolio-loader`

## Status

`candidate`

## Plain-English Summary

The Source workspace now renders its operator shell immediately and loads the heavier contract portfolio data through a tenant-guarded API request. This improves the perceived route transition while preserving the same governed Source portfolio read path.

## Layer Impact

Layer 4 product surface only, in the `global-control-lane`. The change moves when the existing Source workspace portfolio read happens; it does not change canonical data, serving views, calculations, loaders, schemas, or customer-scoped records.

## Client Applicability

- All clients: Source workspace route composition and portfolio-loading behavior.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: Existing provider override behavior remains guarded by `SOURCE_WORKSPACE_ALLOW_PROVIDER_QUERY_OVERRIDE`.

## Changes Included

- `/source/workspace` renders a client portfolio loader instead of awaiting the heavy portfolio read inside the route component.
- `/api/source/workspace/portfolio` performs the tenant-guarded portfolio read and returns the same Source workspace payload.
- The Source workspace loading shell is shared by the route-level loader and the client-side portfolio loader.
- Focused Source route tests cover the new page/API responsibility split.

## QA / Validation

- `npm test -- --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/page-tenant-routing.test.ts'` passed.
- `npx eslint 'src/app/(maestro)/source/workspace/page.tsx' 'src/app/(maestro)/source/workspace/loading.tsx' 'src/app/(maestro)/source/workspace/SourceWorkspaceLoadingShell.tsx' 'src/app/(maestro)/source/workspace/WorkspaceClientLoader.tsx' 'src/app/api/source/workspace/portfolio/route.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/page-tenant-routing.test.ts'` passed.

## Rollout Plan

Merge through the protected GitHub PR path. The repo-owned Azure Container Apps main deploy workflow builds and deploys the merged SHA to the shared product/lab runtime.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: Resolved by the repo-owned deploy workflow.
- ACA runtime invariant: Required before claiming deployment complete.
- Worker image invariant: Required by the deploy workflow.
- Feature/env flag update path: None.
- Live route proof required: Yes, for initial paint, final data load, and navigation persistence.

## Rollback Plan

Revert the PR and redeploy through the same ACA main deploy workflow. No data rollback is required because this release does not mutate data.

## Audit Evidence

Inspect the PR, focused test output, lint output, release check, ACA deployment run, and signed-in route proof captured after deployment.

## Known Gaps

This does not shorten the underlying portfolio query itself. If the API request remains slow, a separate read-model or query optimization pass is still required.
