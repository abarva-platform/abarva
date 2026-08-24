# 2026-08-24-source-ecl-proof-label — Source ECL Proof Label

## Release ID

`2026-08-24-source-ecl-proof-label`

## Status

`candidate`

## Plain-English Summary

The Source preview proof-layer rows now describe available ECL cube rows as returned by a governed ECL projection read instead of labeling them as a V4 snapshot. The row counts and source data are unchanged; this corrects the user-visible provenance wording.

## Layer Impact

global-control-lane: Source workspace display text for ECL-backed proof-layer availability. This is product code shared by clients when the ECL projection DB provider is selected.

global-control-lane QA: Adds a focused adapter assertion so ECL proof rows cannot silently regress to the wrong provenance label.

## Client Applicability

- All clients: Source preview users when the ECL projection DB provider is selected.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Source provider selection controls whether the ECL projection DB path is used.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/live/portfolioAdapter.ts`
- `src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts`

## QA / Validation

- `npx jest --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts' --runInBand` passed.
- `npx eslint 'src/app/(maestro)/source/preview/workspace/live/portfolioAdapter.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts'` passed.

## Rollout Plan

Merge to main. The repo-owned Azure Container Apps main deploy workflow builds and deploys the resulting image for the shared Product/Lab web runtime.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: Resolved by the deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required by the deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Source ECL preview smoke after deploy.

## Rollback Plan

Revert the PR or redeploy the prior known-good ACA image if the Source preview renders incorrect proof-layer text.

## Audit Evidence

- PR URL: to be attached after PR creation.
- Focused Jest and ESLint output in PR checks or local command output.
- Post-deploy Source ECL preview browser proof if merged and deployed.

## Known Gaps

This release only corrects proof-layer provenance wording. It does not add new cube slices, rebuild ECL data, or repoint the default Source provider.
