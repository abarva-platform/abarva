# 2026-08-12-source-vendor360-cockpit-binding — Source Vendor 360 Cockpit Binding

## Release ID

`2026-08-12-source-vendor360-cockpit-binding`

## Status

`candidate`

## Plain-English Summary

The Source workspace opening page now presents a Vendor 360 cockpit instead of the older portfolio-context story. The page leads with a governed verdict, a three-row action queue, a top-contract peer section, and proof layers that explain source systems, grain, freshness, reconciliation, and lineage. The browser renders prepared labels and rows; it does not recompute portfolio aggregates.

## Layer Impact

- Layer 3 canonical model: No schema or data-plane changes. Existing Source rows and governed pure functions remain the source of truth.
- Layer 4 products: Updates the Source workspace route at `/source/preview/workspace` to consume a server-built cockpit bundle from the existing portfolio adapter.

Release lane: `global-control-lane`

## Client Applicability

- All clients: Source workspace users who can access the preview workspace route.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/live/portfolioAdapter.ts`
- `src/app/(maestro)/source/preview/workspace/lenses/ContextLens.tsx`
- `src/app/(maestro)/source/preview/workspace/buildViewModel.ts`
- `src/app/(maestro)/source/preview/workspace/page.tsx`
- Focused Source workspace view-model tests.

## QA / Validation

- `git diff --check` passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` passed.
- `NODE_OPTIONS=--max-old-space-size=4096 npx eslint 'src/app/(maestro)/source/preview/workspace/page.tsx' 'src/app/(maestro)/source/preview/workspace/buildViewModel.ts' 'src/app/(maestro)/source/preview/workspace/lenses/ContextLens.tsx' 'src/app/(maestro)/source/preview/workspace/live/portfolioAdapter.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/viewModel.explore.test.ts'` passed.
- `NODE_OPTIONS=--max-old-space-size=4096 npx jest --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/viewModel.explore.test.ts' --runInBand` passed: 2 suites, 25 tests.

## Rollout Plan

Merge through the protected repository flow. The route becomes active through the repo-owned Azure Container Apps main deployment workflow after the merged commit is built and deployed.

## Deployment Authority

- Repo-owned deploy workflow: Required for shared Product/Lab web runtime.
- Shared runtime mutators: None in this release candidate.
- Approved image digest: To be produced by the repo-owned deploy workflow.
- ACA runtime invariant: Required before any live claim.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for `/source/preview/workspace` after deployment.

## Rollback Plan

Revert the cockpit binding commit or redeploy the previous known-good ACA image digest through the approved rollback path. No migrations or data rollback are required.

## Audit Evidence

- Local type, lint, and focused Jest output from this release branch.
- Pull request and ACA deployment evidence once promoted.
- Signed-in browser screenshot of `/source/preview/workspace` after deployment.

## Known Gaps

The portfolio row does not currently expose a source document id for top contracts. The cockpit renders `not established` and names the needed upstream field rather than inventing document identifiers.
