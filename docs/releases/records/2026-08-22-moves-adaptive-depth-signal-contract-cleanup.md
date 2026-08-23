# 2026-08-22-moves-adaptive-depth-signal-contract-cleanup — Moves Adaptive Depth Signal Contract Cleanup

## Release ID

`2026-08-22-moves-adaptive-depth-signal-contract-cleanup`

## Status

`candidate`

## Plain-English Summary

Removes an unused adaptive-depth signal from the Moves artifact-depth resolver contract and adds explicit resolution-confidence metadata. The removed signal was declared and inferred, but it did not affect scoring, applicability, story-beat decisions, prompts, or generation behavior. The confidence metadata makes it visible whether a tier came from structured signals, prose inference, mixed evidence, or defaults.

## Layer Impact

- Product layer: Moves artifact-depth generation control surface only.
- Data layers: No Layer 1, Layer 2, Layer 3, Layer 4, canonical, projection, registry, tenant-data, or data-plane writes.

## Client Applicability

- All clients: Applies to Moves artifact generation internals.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Removes the unused adaptive-depth source-maturity signal from the TypeScript contract, defaults, and prose-derived signal extraction.
- Adds `signalBasis`, `resolutionConfidence`, and confidence reasons to the adaptive-depth decision.
- Carries the confidence metadata into the prompt so prose-inferred tiering does not look identical to structured tiering.
- Leaves current scoring, artifact applicability, story-beat applicability, and generated artifact selection unchanged.

## QA / Validation

Status: `passed`.

- `npx jest src/lib/deliverables/__tests__/adaptive-depth.test.ts src/app/api/v1/deliverables/generate-phase/__tests__/route.test.ts --runInBand` — passed.
- `npx eslint src/lib/deliverables/adaptive-depth.ts src/lib/deliverables/__tests__/adaptive-depth.test.ts src/app/api/v1/deliverables/generate-phase/__tests__/route.test.ts` — passed.
- `npx tsc --noEmit --pretty false` — passed.

## Rollout Plan

Merge through PR to main. The repo-owned ACA deploy workflow may rebuild and deploy the app image. No data migration, tenant data change, registry activation, or data-plane load is required.

## Deployment Authority

- Repo-owned deploy workflow: Allowed for main merge.
- Shared runtime mutators: None beyond the repo-owned deploy workflow.
- ACA runtime invariant: Required if deployed.
- Worker image invariant: Required if worker image changes as part of the repo-owned deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: No; this is a contract cleanup with no intended runtime UX behavior change.

## Rollback Plan

Revert the PR. No data rollback is required.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/6663
- Local validation commands listed above.

## Known Gaps

- Source maturity should be reintroduced only when it has explicit scoring semantics and tests that prove its effect.
- The confidence metadata is diagnostic only in this release; it does not yet block low-confidence generation.
