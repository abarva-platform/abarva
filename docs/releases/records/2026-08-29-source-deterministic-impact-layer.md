# 2026-08-29-source-deterministic-impact-layer — Source deterministic impact layer

## Release ID

`2026-08-29-source-deterministic-impact-layer`

## Status

`candidate`

## Plain-English Summary

Source can now read deterministic impact views generated from a governed contract-depth package. The workspace uses those rows for candidate action cards, evidence coverage, vendor position, page storyline, and aVa grounding instead of making executive claims from broad portfolio headers alone.

## Layer Impact

Release lanes: `global-control-lane`, `client-data-lane`.

Layer 3 canonical model: no schema change. Existing canonical contract, clause, scope, spend, performance, service-credit, opportunity, calculation, evidence, and page-text objects remain the truth source.

Layer 4 products: adds read-model views that translate canonical facts into product-safe Source claims. The UI reads those views as product substrate and keeps finance confirmation, evidence gaps, and blockers visible.

## Client Applicability

- All clients: The product code can read the new views when they exist and gracefully shows empty impact rows when they do not.
- Specific clients: None named in this public release record.
- Internal only: Operator validation scripts and readback checks.
- Public/demo only: The scoped synthetic contract-depth package can populate the views for demo use only.
- Feature flag: Existing Source workspace provider controls remain unchanged.

## Changes Included

- `scripts/source/project-contract-depth-package-layer4.ts`
- `scripts/source/__tests__/project-contract-depth-package-layer4.test.ts`
- `src/lib/source/data-model/types.ts`
- `src/lib/source/data-model/read-adapter.ts`
- `src/app/(maestro)/source/preview/workspace/live/portfolioAdapter.ts`
- `src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx`
- `src/app/(maestro)/source/workspace/page.tsx`
- Focused workspace adapter and view-model test fixture updates.

## QA / Validation

- `npx jest scripts/source/__tests__/project-contract-depth-package-layer4.test.ts --runInBand` passed.
- `npx jest --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/viewModel.explore.test.ts' --runInBand` passed.
- `npx eslint 'src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx' 'src/app/(maestro)/source/preview/workspace/live/portfolioAdapter.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/viewModel.explore.test.ts' 'src/lib/source/data-model/read-adapter.ts' 'src/lib/source/data-model/types.ts' 'scripts/source/project-contract-depth-package-layer4.ts'` passed.
- `git diff --check` passed.
- Full `npx tsc --noEmit --pretty false --incremental false` was attempted locally and stopped with a Node heap out-of-memory error before producing type diagnostics.

## Rollout Plan

Merge through PR to main. The repo-owned Azure Container Apps main deploy workflow builds and deploys the web image. After deployment, run the existing governed ACA data-build job for the contract-depth Layer 4 apply/verify step so the new views are physically created and read back. Then run signed-in Source workspace proof for the scoped synthetic package.

## Deployment Authority

- Repo-owned deploy workflow: Required for shared web runtime.
- Shared runtime mutators: None from this PR.
- Approved image digest: Produced by the main ACA deploy workflow after merge.
- ACA runtime invariant: Required before claiming live product proof.
- Worker image invariant: Required before claiming data-build job proof.
- Feature/env flag update path: No new flag required.
- Live signed-in proof required: Yes, Source workspace and contract/action drilldown must be checked after deploy and Layer 4 job completion.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. The Layer 4 views can remain harmless if unused; if a data rollback is required, run the existing governed package loader rollback or purge path for the scoped package only after operator approval.

## Audit Evidence

- PR URL and merged commit SHA.
- ACA main deploy workflow run for the merged SHA.
- ACA data-build job proof bundle for the Layer 4 apply/verify step.
- Signed-in Source workspace screenshots or machine proof showing candidate action cards, evidence coverage, vendor positions, and no unsupported realized-savings language.

## Known Gaps

- Full TypeScript check could not complete locally due Node heap out-of-memory.
- Live signed-in proof is still required after merge, deployment, and the governed Layer 4 job.
- Broad legacy Source workspace data-path retirement is out of scope for this candidate.
