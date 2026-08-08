# 2026-08-08-source-scope-value-proof-copy — Source Contract Scope And Value Proof Copy

## Release ID

`2026-08-08-source-scope-value-proof-copy`

## Status

`candidate`

## Plain-English Summary

This release tightens the Source Contract 360 contract-detail experience. The Relationship tab stops exposing internal "value ledger" language and instead explains "value proof" in client-facing terms. The Scope tab is simplified so an absent scope extract is shown as a clear evidence gap, not a noisy zero-count status panel.

## Layer Impact

- `global-control-lane` / Layer 4 Products: updates Source workspace presentation only. No canonical data, adapter, loader, or migration changes are included.

## Client Applicability

- All clients: yes, for tenants using the Source workspace contract-detail surface.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing Source workspace routing only.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/canvases/ContractCanvas.tsx`
- `src/app/(maestro)/source/preview/workspace/buildViewModel.ts`
- `src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts`

## QA / Validation

- `npx tsc --noEmit --pretty false` passed.
- `npx eslint src/app/\(maestro\)/source/preview/workspace --max-warnings=0` passed.
- `npm test -- --runTestsByPath src/app/\(maestro\)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts --runInBand` passed.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the updated web image. No database migration or operator job is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this change
- Approved image digest: produced by the repo-owned deploy workflow
- ACA runtime invariant: required after deploy
- Worker image invariant: unchanged
- Feature/env flag update path: none
- Live signed-in proof required: Source Contract 360 Scope and Relationship tabs

## Rollback Plan

Revert this PR and redeploy through the repo-owned ACA workflow.

## Audit Evidence

Inspect the PR diff, local validation output, deploy workflow run, and signed-in Source workspace screenshots after deployment.

## Known Gaps

This does not create new contract scope data. It only makes missing scope evidence clearer and removes internal ledger language from the visible relationship story.
