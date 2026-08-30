# 2026-08-30-source-renewal-choice-headline — Source Renewal Choice Headline

## Release ID

`2026-08-30-source-renewal-choice-headline`

## Status

`candidate`

## Plain-English Summary

Source 360 now promotes the deterministic renewal-choice fact into the executive cockpit when it exists: active auto-renew rows whose notice deadline has already passed, and the annual value that remains cancellable. The proof-layer row already carried this computation; this release makes the first-screen verdict and metric labels match that computed fact instead of burying it behind a generic deadline label.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 Products: updates Source 360 cockpit presentation over existing Source read models and pure renewal-exposure computation.

Layer 3 Canonical Model: no schema or data changes.

Layer 2 Source Adapters: no adapter changes.

Layer 1 Client Intake: no intake changes.

## Client Applicability

- All clients: yes, for Source 360 workspaces with renewal/notice fields loaded.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: no.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/live/portfolioAdapter.ts`
- `src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx`
- `src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts`

## QA / Validation

- `npx jest --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts' --runInBand` passed.
- `npx eslint 'src/app/(maestro)/source/preview/workspace/live/portfolioAdapter.ts' 'src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts'` passed.

## Rollout Plan

Open a PR, squash merge to `main`, and allow the repo-owned Azure Container Apps main deploy workflow to build and deploy the resulting image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: resolved by the deploy workflow.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required after deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, verify Source 360 renders the renewal-choice headline and does not expose blocked utilization evidence prose as proof.

## Rollback Plan

Revert the Source cockpit presentation change through a PR and redeploy with the same ACA workflow. No database rollback is required.

## Audit Evidence

- PR URL: pending.
- CI checks: pending.
- ACA deploy run: pending.
- Live proof bundle: pending.

## Known Gaps

This release does not create new contract evidence, change renewal dates, or finance-confirm opportunity values. It only changes how already-computed renewal posture is surfaced in the executive cockpit.
