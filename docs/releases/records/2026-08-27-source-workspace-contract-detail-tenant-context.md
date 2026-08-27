# 2026-08-27-source-workspace-contract-detail-tenant-context — Source Workspace Contract Detail Tenant Context

## Release ID

`2026-08-27-source-workspace-contract-detail-tenant-context`

## Status

`candidate`

## Plain-English Summary

Source Workspace contract-detail reads now use the same explicit workspace client context as the page that selected the contract, while still checking tenant access before any data-plane read. This prevents the workspace from listing contracts under one authorized client context and then loading per-contract detail under a different active-session fallback.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 Products: updates Source Workspace API routes for contract detail and contract optimization launch context handling. The routes remain projections over the governed Source read model and do not change canonical data, adapters, loaders, schemas, or write-side tenant data.

## Client Applicability

- All clients: yes, for Source Workspace contract-detail reads and optimization launches.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/api/source/workspace/contract/[contractId]/route.ts`
- `src/app/api/source/workspace/contract/[contractId]/optimization/route.ts`
- `src/app/api/source/workspace/contract/[contractId]/__tests__/route.test.ts`
- `src/app/(maestro)/source/preview/workspace/__tests__/workspace-explicit-client-api-routing.test.ts`

## QA / Validation

- Pass: focused Jest route and routing contract suite:
  `jest --runTestsByPath 'src/app/api/source/workspace/contract/[contractId]/__tests__/route.test.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/workspace-explicit-client-api-routing.test.ts' 'src/app/api/source/workspace/contract/[contractId]/optimization/__tests__/route.test.ts' --runInBand`
- Pass: scoped ESLint:
  `eslint 'src/app/api/source/workspace/contract/[contractId]/route.ts' 'src/app/api/source/workspace/contract/[contractId]/optimization/route.ts' 'src/app/api/source/workspace/contract/[contractId]/__tests__/route.test.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/workspace-explicit-client-api-routing.test.ts'`
- Pass: scoped whitespace check:
  `git diff --check -- 'src/app/api/source/workspace/contract/[contractId]/route.ts' 'src/app/api/source/workspace/contract/[contractId]/optimization/route.ts' 'src/app/api/source/workspace/contract/[contractId]/__tests__/route.test.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/workspace-explicit-client-api-routing.test.ts'`

## Rollout Plan

Merge through PR to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the resulting image. After deployment, run signed-in Source Workspace proof for the affected contract-detail routes and verify per-contract detail returns successfully for authorized client context and remains blocked for unauthorized client context.

## Deployment Authority

- Repo-owned deploy workflow: required for production activation.
- Shared runtime mutators: none in this PR.
- Approved image digest: produced by the repo-owned ACA deploy workflow.
- ACA runtime invariant: required after deployment before claiming live.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR and redeploy the previous known-good ACA image through the repo-owned deploy workflow. No database rollback or tenant data cleanup is required because this release changes only route-level read-context handling.

## Audit Evidence

- PR diff for the Source Workspace contract-detail and optimization routes.
- Focused Jest output listed in QA / Validation.
- Scoped ESLint output listed in QA / Validation.
- Scoped `git diff --check` output listed in QA / Validation.
- Post-deploy signed-in Source Workspace proof for authorized and unauthorized client contexts.

## Known Gaps

Live signed-in production proof is required after deploy before this can be called live-proven.
