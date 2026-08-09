# 2026-08-09-source-workspace-portfolio-landing — Source Workspace Portfolio Landing

## Release ID

`2026-08-09-source-workspace-portfolio-landing`

## Status

`candidate`

## Plain-English Summary

The Source workspace no longer opens on an internal tab named "Home". The first Source workspace tab is now "Portfolio", and the opening findings lead with contract leverage, vendor concentration, and evidence discipline instead of a zero-result renewal caveat or implementation-function language. This makes the Source top-nav click visibly land in Source, not appear to bounce back to Home.

## Layer Impact

- Release lane: `global-control-lane`
- Products: Updates the Source workspace presentation model and first-screen copy. No business facts, loaders, schemas, or semantic calculations change.
- Canonical model: No change.
- Source adapters: No change.
- Client intake: No change.

## Client Applicability

- All clients: Yes, for the shared Source workspace route.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/viewModel.tsx`
- `src/app/(maestro)/source/preview/workspace/buildViewModel.ts`
- `src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts`

## QA / Validation

- `npx eslint 'src/app/(maestro)/source/preview/workspace/buildViewModel.ts' 'src/app/(maestro)/source/preview/workspace/viewModel.tsx' 'src/app/(maestro)/source/preview/workspace/lenses/ContextLens.tsx'` — passed.
- `npx jest --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/viewModel.explore.test.ts' --runInBand` — passed, with pre-existing duplicate manual mock warnings.
- Live pre-fix browser reproduction confirmed top-nav Source lands on `/source/preview/workspace`; the visible confusion was the internal Source tab label "Home".

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the app image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: Produced by the deploy workflow after merge.
- ACA runtime invariant: Verify after deploy.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, verify the Source top-nav click lands on Source Workspace with the `Portfolio` tab active.

## Rollback Plan

Revert this PR and redeploy through the same repo-owned ACA workflow. No migration rollback is required.

## Audit Evidence

- Pull request and merge commit.
- Focused Jest and ESLint output.
- Live signed-in browser proof after ACA deployment.

## Known Gaps

This release fixes the Source/Home landing ambiguity and first-screen copy. It does not complete the larger Contract 360 visual redesign, contract relationship graph expansion, or golden-contract evidence QA.
