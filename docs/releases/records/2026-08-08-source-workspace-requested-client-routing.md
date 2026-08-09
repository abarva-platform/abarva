# 2026-08-08-source-workspace-requested-client-routing — Source Workspace Requested Client Routing

## Release ID

`2026-08-08-source-workspace-requested-client-routing`

## Status

`candidate`

## Plain-English Summary

The Source Workspace server page now honors an explicit requested client when resolving which governed Source portfolio to render. If an explicit requested client cannot be resolved, the page does not silently fall back to another tenant's portfolio.

## Layer Impact

- global-control-lane: The route now uses the shared tenant resolver's fail-closed behavior for explicit client requests.
- client-data-lane: Source Workspace tenant selection is resolved before building the tenant-scoped Source portfolio snapshot shown to the user.

## Client Applicability

- All clients: Applies to every tenant using the shared Source Workspace route.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/page.tsx`
- `src/app/(maestro)/source/preview/workspace/__tests__/page-tenant-routing.test.ts`

## QA / Validation

- pass: Targeted unit test for Source Workspace requested-client routing.
- pass: Targeted ESLint for the changed page and test.
- pass: TypeScript compile.
- pass: Release gate.
- pending: Live signed-in proof after deployment.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps deployment workflow builds and deploys the shared web image. No manual data migration or feature flag is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Produced by the main deploy workflow.
- ACA runtime invariant: Must pass in the main deploy workflow before live proof.
- Worker image invariant: Not applicable to this web-route-only change.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Source Workspace must be checked with a requested client parameter and without the parameter.

## Rollback Plan

Revert the PR and redeploy the prior shared web image through the repo-owned workflow. No schema or data rollback is required.

## Audit Evidence

- PR URL after creation.
- GitHub checks for tests, typecheck, release gate, and deployment.
- Live signed-in browser proof showing the route no longer defaults to an unrelated portfolio for an explicit client request.

## Known Gaps

This change only fixes the page-level tenant routing. It does not create or load missing Source data for any tenant.
