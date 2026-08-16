# 2026-08-16-source-list-tenant-identity — Source List Tenant Identity

## Release ID

`2026-08-16-source-list-tenant-identity`

## Status

`candidate`

## Plain-English Summary

Adds the authenticated active tenant display name to the Source workspace
Vendor 360 banner. The page already carried tenant context in its view model;
this release makes that identity visible on the list surface used by the
post-deploy crawl.

This change does not mutate tenant data, refresh Source cubes, write canonical
tables, activate registries, update Active Tenant Access, or make a live-client
truth claim.

## Layer Impact

- `global-control-lane`: signed-in Source workspace presentation.
- Layer 4 product surface only: visible Source list copy.
- No Layer 1 intake, Layer 2 adapter, Layer 3 canonical, Source cube, or
  data-plane state changes.

## Client Applicability

- All signed-in clients using the Source workspace list surface.
- Feature flag: none.

## Changes Included

- Renders the active tenant display name in the Source Vendor 360 cockpit
  banner alongside the existing dataset label and counts.

## QA / Validation

- Pass: `npx eslint 'src/app/(maestro)/source/preview/workspace/lenses/ContextLens.tsx'`.
- Pass: `npm test -- --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/workspace-ava-contract.test.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts' --runInBand`.
  - Note: Jest emitted pre-existing duplicate manual mock warnings for markdown
    parser mocks; the targeted suites passed 27/27.
- Pass: `npx tsc --noEmit`.
- Pass: `npm run release:check`.

## Rollout Plan

Merge through PR. The repo-owned ACA main deploy workflow may rebuild and
deploy the shared web image after merge; it is the only approved path that may
shift shared web traffic.

## Deployment Authority

- Repo-owned deploy workflow: permitted after merge and is the only deployment
  authority for shared Product/Lab web traffic.
- Shared runtime mutators: none outside the repo-owned deploy workflow.
- ACA runtime invariant: required if the repo-owned main ACA deploy runs.
- Live signed-in proof required: post-deploy crawl should re-check the Source
  list tenant-identity finding.

## Rollback Plan

Revert this PR. No data rollback is required because this release performs no
data-plane mutation.

## Audit Evidence

- PR checks and merge commit.
- ACA deploy proof if the repo-owned main deploy workflow runs after merge.
- Post-deploy crawl result if the repo-owned crawl runs after deploy.

## Known Gaps

This is a display-only tenant identity fix. It does not change Source data
availability, cube refresh state, or aVa answer grounding.
