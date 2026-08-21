# 2026-08-21-tenant-visible-identity-binding — Tenant Visible Identity Binding

## Release ID

`2026-08-21-tenant-visible-identity-binding`

## Status

`candidate`

## Plain-English Summary

Home and Source entry routes now derive visible tenant identity from the canonical tenant resolver before falling back to legacy active-client rows. The retired Home queue URL also returns to Home instead of forcing a single legacy proof tenant.

## Layer Impact

Layer 4 / Products (`global-control-lane`): Home and Source route rendering now use the same server-side tenant binding for visible labels and projection keys. No canonical data, registry, graph, or tenant input files are changed.

## Client Applicability

- All clients: Yes, for signed-in Home and Source route rendering.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Home route tenant identity binding.
- Source new intake and portfolio tenant identity binding.
- Retired Home queue redirect target.
- Source route source-contract tests for tenant resolver precedence.

## QA / Validation

Passed locally:

- `npx jest --runTestsByPath 'src/app/(maestro)/home/__tests__/home-admin-boundary-contract.test.ts' 'src/app/(maestro)/source/__tests__/tenant-resolution-source-contract.test.ts' --runInBand`
- `npx eslint 'src/app/(maestro)/home/page.tsx' 'src/app/(maestro)/home/queue/page.tsx' 'src/app/(maestro)/source/new/page.tsx' 'src/app/(maestro)/source/portfolio/page.tsx' 'src/app/(maestro)/home/__tests__/home-admin-boundary-contract.test.ts' 'src/app/(maestro)/source/__tests__/tenant-resolution-source-contract.test.ts'`
- `npx tsc --noEmit`
- `npm run release:check`
- `git diff --check`

## Rollout Plan

Merge to main. The repo-owned Azure Container Apps main deploy workflow builds and deploys the runtime image.

## Deployment Authority

- Repo-owned deploy workflow: Approved for this session.
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Captured by the deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Post-deploy crawl for Home and Source tenant identity.

## Rollback Plan

Revert this PR and allow the repo-owned main deploy workflow to restore the prior route behavior. No data rollback is required.

## Audit Evidence

PR, CI checks, deployment run, runtime invariant proof, and post-deploy crawl artifact path.

## Known Gaps

This does not change tenant data, Source event rows, projections, or data-plane state.
