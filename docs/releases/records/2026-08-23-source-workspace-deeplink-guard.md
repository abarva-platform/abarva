# 2026-08-23-source-workspace-deeplink-guard — Source Workspace Deep-Link Guard

## Release ID

`2026-08-23-source-workspace-deeplink-guard`

## Status

`candidate`

## Plain-English Summary

Source Workspace now refuses to substitute another contract when a contract deep link points to an ID that is not present in the active governed Source provider result set. The page shows a withheld/not-found state instead of rendering the first available contract as if it matched the requested link.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 — Products: Source Workspace view-model behavior only. No source data, canonical data, projection tables, cube tables, migrations, or loaders are changed.

## Client Applicability

- All clients: yes, for the guarded Source Workspace route.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: no new flag. Existing provider-selection behavior is unchanged.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/buildViewModel.ts`
- `src/app/(maestro)/source/preview/workspace/__tests__/viewModel.explore.test.ts`

## QA / Validation

- `npx jest --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/viewModel.explore.test.ts' --runInBand` — passed, 7 tests.
- `npx eslint 'src/app/(maestro)/source/preview/workspace/buildViewModel.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/viewModel.explore.test.ts'` — passed.

## Rollout Plan

Merge through PR to `main`. The repo-owned Azure Container Apps main deploy workflow will build and deploy the web image. No data-plane mutation or migration is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR.
- Approved image digest: produced by the main deploy workflow after merge.
- ACA runtime invariant: required after deploy before claiming the change is live.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes, for any claim that the guarded route behavior is live.

## Rollback Plan

Revert the PR or deploy the previous approved web image through the repo-owned ACA main deploy workflow. No data rollback is required.

## Audit Evidence

- PR URL and merge commit.
- Focused Jest output.
- Focused ESLint output.
- ACA main deploy run and runtime invariant proof after merge.
- Optional signed-in browser proof for a missing contract deep link.

## Known Gaps

This change does not create aliases between older contract identifiers and the active governed Source contract IDs. If an older identifier must resolve to a current row, that mapping must be supplied by the Source/ECL data layer rather than inferred in the page.
