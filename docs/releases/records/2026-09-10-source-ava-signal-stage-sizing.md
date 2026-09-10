# 2026-09-10-source-ava-signal-stage-sizing — Source aVa Signal-Stage Sizing

## Release ID

`2026-09-10-source-ava-signal-stage-sizing`

## Status

`candidate`

## Plain-English Summary

Aligns Source aVa contract-optimization answers with the Source dashboard rule for signal-stage opportunities. Signal-stage levers stay visible as evidence-gated advisory rows, but aVa no longer includes them in sized opportunity totals or generated value charts.

## Layer Impact

Affected lane: `global-control-lane`.

Layer 4 answer presentation only. Source reads the same governed contract, opportunity, evidence, and posture context. This release changes deterministic aVa answer and exhibit construction so signal-stage rows are labelled separately from sized candidate opportunity value.

## Client Applicability

- All clients: Source workspace aVa answers for selected Contract 360 contexts.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/ava/source-workspace-visual-answer.ts`
- `src/lib/source/ava/__tests__/source-workspace-visual-answer.test.ts`

## QA / Validation

- `npx prettier --write src/lib/source/ava/source-workspace-visual-answer.ts src/lib/source/ava/__tests__/source-workspace-visual-answer.test.ts` — PASS.
- `npx jest --runTestsByPath src/lib/source/ava/__tests__/source-workspace-visual-answer.test.ts --runInBand` — PASS. Jest emitted pre-existing duplicate manual mock warnings.
- `npx eslint src/lib/source/ava/source-workspace-visual-answer.ts src/lib/source/ava/__tests__/source-workspace-visual-answer.test.ts` — PASS.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` — PASS.
- `npm run release:check` — PASS.
- `git diff --check` — PASS.

## Rollout Plan

Open a PR, merge through the protected repository workflow, and let the repo-owned Azure Container Apps main deploy workflow publish the approved main image. No schema migration, data-build job, or feature flag is required.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none.
- Approved image digest: populated after deploy.
- ACA runtime invariant: required before claiming live.
- Worker image invariant: unchanged except normal main-image synchronization by the deploy workflow.
- Feature/env flag update path: none.
- Live signed-in proof required: Source workspace aVa answer on a selected Contract 360 Optimize context.

## Rollback Plan

Revert the PR or deploy the prior digest-pinned web image. No data rollback is required because this release does not mutate source, canonical, or projection rows.

## Audit Evidence

Inspect the PR diff, local validation output, CI checks, ACA deploy workflow, runtime-invariant proof, and live signed-in Source workspace aVa smoke result.

## Known Gaps

This release does not add benchmark comparator fields, target-term fields, or finance-confirmed outcome data. It only prevents signal-stage opportunity rows from being counted or charted as sized opportunity value in aVa responses.
