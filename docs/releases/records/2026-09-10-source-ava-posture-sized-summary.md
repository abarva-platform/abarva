# 2026-09-10-source-ava-posture-sized-summary — Source aVa Posture Sized Summary

## Release ID

`2026-09-10-source-ava-posture-sized-summary`

## Status

`released`

## Plain-English Summary

Keeps Source selected-contract posture summaries aligned with the Optimize dashboard rule for signal-stage opportunities. Signal-stage rows remain visible as evidence-gated advisory rows, but they no longer inflate the potential value summary that is passed into aVa contract answers.

## Layer Impact

Affected lane: `global-control-lane`.

Layer 4 presentation and answer-context projection only. Source reads the same governed contract and opportunity rows; this release changes how selected-contract posture totals are summarized before they are rendered or handed to aVa.

## Client Applicability

- All clients: Source workspace selected-contract summaries and selected-contract aVa answers.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/buildViewModel.ts`
- `src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts`

## QA / Validation

- `npx prettier --write src/app/(maestro)/source/preview/workspace/buildViewModel.ts src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts` — PASS.
- `npx jest --runTestsByPath src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts src/lib/source/ava/__tests__/source-workspace-visual-answer.test.ts --runInBand` — PASS. Jest emitted pre-existing duplicate manual mock warnings.
- `npx eslint src/app/(maestro)/source/preview/workspace/buildViewModel.ts src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts` — PASS.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` — PASS.
- `npm run release:check` — PASS.
- `git diff --check` — PASS.
- PR checks for #7526 — PASS.
- ACA main deploy carried this change forward to active SHA `f2bd2fddad32b26f0016618ef292b8af303e2f24` — PASS.
- `node scripts/deploy/check-aca-runtime-invariant.mjs --expected-image acrabarvalab001.azurecr.io/abarva/web@sha256:48e7df951294db34501ce1b2a8cf028e7ddb94e1ba03c9a9e751aae514c9c653 --out-dir /tmp/source-final-runtime-invariant-f2bd2fdd` — PASS.
- Live signed-in Source workspace aVa smoke on `https://app.abarva.ai` — PASS. The selected-contract posture summary used the sized-only opportunity total and did not repeat the all-row signal-inclusive potential value.

## Rollout Plan

Open a PR, merge through the protected repository workflow, and let the repo-owned Azure Container Apps main deploy workflow publish the approved main image. No schema migration, data-build job, or feature flag is required.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none.
- Approved image digest: `sha256:48e7df951294db34501ce1b2a8cf028e7ddb94e1ba03c9a9e751aae514c9c653`.
- ACA runtime invariant: PASS on active revision `ca-abarva-web-lab-eastus--mf2bd2fdd`.
- Worker image invariant: PASS for required worker jobs on the same digest.
- Feature/env flag update path: none.
- Live signed-in proof required: completed for Source workspace selected-contract aVa answer where signal-stage opportunity rows are present.

## Rollback Plan

Revert the PR or deploy the prior digest-pinned web image. No data rollback is required because this release does not mutate source, canonical, or projection rows.

## Audit Evidence

Inspect the PR diff, local validation output, CI checks, ACA deploy workflow, runtime-invariant proof, and live signed-in Source workspace aVa smoke result.

## Known Gaps

This release does not add benchmark comparator fields, target-term fields, or finance-confirmed outcome data. It only prevents signal-stage opportunity rows from being counted in selected-contract potential value summaries.
