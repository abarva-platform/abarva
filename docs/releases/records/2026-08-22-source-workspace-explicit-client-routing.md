# 2026-08-22-source-workspace-explicit-client-routing — Source Workspace Explicit Client Routing

## Release ID

`2026-08-22-source-workspace-explicit-client-routing`

## Status

`candidate`

## Plain-English Summary

Source Workspace now preserves an explicitly requested client through the
workspace page, contract-detail API, and contract-optimization API. This prevents
a non-default Source workspace request from silently falling back to the signed-in
session default after the initial page load.

## Layer Impact

- `global-control-lane`: Shared Source Workspace routing and API behavior now
  carries the requested client key into detail and optimization reads.
- Layer 4 Products / Source: Product read paths are corrected. No intake files,
  source adapters, canonical tables, migrations, loaders, or client data are
  changed.

## Client Applicability

- All clients: Yes, for Source Workspace routes that include an explicit client
  parameter.
- Specific clients: Not limited to one client.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/page.tsx`
- `src/app/(maestro)/source/preview/workspace/WorkspaceClient.tsx`
- `src/app/(maestro)/source/preview/workspace/__tests__/page-tenant-routing.test.ts`
- `src/app/(maestro)/source/preview/workspace/__tests__/workspace-explicit-client-api-routing.test.ts`
- `src/app/api/source/workspace/contract/[contractId]/route.ts`
- `src/app/api/source/workspace/contract/[contractId]/optimization/route.ts`

## QA / Validation

- PASS: focused Jest for Source Workspace tenant routing and explicit-client API
  propagation:
  `npx jest --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/page-tenant-routing.test.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/workspace-explicit-client-api-routing.test.ts' --runInBand`.
- PASS: focused ESLint on all touched files.
- PASS: TypeScript check with local heap headroom:
  `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false --incremental false`.
- PASS: `git diff --check`.
- NOTE: Jest emitted pre-existing duplicate manual mock warnings for markdown
  mock packages; the focused suites passed.
- PENDING: `npm run release:check`.
- PENDING: live signed-in Source Workspace proof after merge and repo-owned ACA
  deployment.

## Rollout Plan

Merge to `main`. The repo-owned Azure Container Apps main deploy workflow builds
and deploys the production image for `app.abarva.ai`. No database migration,
data-build job, feature flag, or manual data operation is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR.
- Approved image digest: assigned by the main deploy workflow after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: not affected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Source Workspace explicit-client route must
  render the requested client's contract instead of the session default.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. No
database rollback is needed.

## Audit Evidence

- PR: pending.
- ACA deploy run: pending.
- Live signed-in proof: pending.
- Pre-fix live proof showed an explicit client workspace route rendering the
  signed-in session default after the request was normalized.

## Known Gaps

This release fixes explicit-client routing for Source Workspace detail and
optimization reads. It does not refresh any tenant data, rebuild cubes, mutate
Source evidence, or certify end-to-end Vendor 360 / Optimize readiness.
