# 2026-08-21-home-orientation-visible-tenant-header — Home Orientation Tenant Header

## Release ID

`2026-08-21-home-orientation-visible-tenant-header`

## Status

`candidate`

## Plain-English Summary

Home generated orientation packs now render under the active tenant's visible name instead of inheriting the default authored model header. This keeps redirected signed-in surfaces from showing one tenant's title over another tenant's generated orientation body.

## Layer Impact

Layer 4 / Products (`global-control-lane`): Home rendering now binds the orientation-pack shell header to the resolved tenant identity. No tenant inputs, canonical rows, graph state, registry state, projections, or data-plane writes are changed.

## Client Applicability

- All clients: Yes, for signed-in Home generated orientation-pack rendering.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Home orientation-pack model identity binding.
- Home route source contract assertion for non-default orientation-pack headers.

## QA / Validation

Pass:

- `npx jest --runTestsByPath 'src/app/(maestro)/home/__tests__/home-admin-boundary-contract.test.ts' --runInBand` — pass, 6/6 tests.
- `npx eslint 'src/app/(maestro)/home/page.tsx' 'src/app/(maestro)/home/__tests__/home-admin-boundary-contract.test.ts'` — pass.
- `npx tsc --noEmit` — pass.
- `git diff --check` — pass.
- `npm run release:check` — pass.

## Rollout Plan

Merge to main. The repo-owned Azure Container Apps main deploy workflow builds and deploys the runtime image.

## Deployment Authority

- Repo-owned deploy workflow: Approved for this session.
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Captured by the deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Post-deploy crawl for visible tenant identity.

## Rollback Plan

Revert this PR and allow the repo-owned main deploy workflow to restore the prior Home orientation-pack header behavior. No data rollback is required.

## Audit Evidence

PR, CI checks, deployment run, runtime invariant proof, and post-deploy crawl artifact path.

## Known Gaps

This does not change route access behavior; the named Source and Tower P1 crawl findings were observed rendering Home because the crawl persona is redirected to `/home`.
