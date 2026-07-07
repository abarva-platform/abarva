# 2026-05-31-effort-estimator-ai-ops-cost — AI Ops Cost In Move Business Cases

## Release ID

`2026-05-31-effort-estimator-ai-ops-cost`

## Status

`candidate`

## Plain-English Summary

Threads modeled AI operating cost into the Move effort estimator and business-case compiler. A Move can now carry AI run cost as a third cost axis next to build and change effort, while existing Moves without AI ops input continue to behave exactly as before.

## Layer Impact

- `global-control-lane`: Extends shared expert-kernel business-case logic so all clients can model token, embedding, evaluation, and tier-drift run cost when a Move supplies AI operating-cost inputs.

## Client Applicability

- All clients: The optional field is shared across Move/business-case generation.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None. The change is backward-compatible; AI ops cost appears only when the caller supplies the input model.

## Changes Included

- `src/lib/programs/expert-kernel/effort-estimator.ts` accepts optional AI operating-cost input and exposes `aiOpsCost` plus `buildVsChange.aiOpsCost`.
- `src/lib/programs/expert-kernel/business-case-compiler.ts` carries the AI ops estimate and includes its three-year total in investment, net return, and payback math.
- `src/lib/programs/move-business-case.ts` passes Move-supplied AI ops input through to the expert kernel.
- Unit tests cover omitted-input compatibility, third-axis effort split behavior, investment math, and originated Move pass-through.

## QA / Validation

- Pass: `npx jest src/lib/programs/expert-kernel/__tests__/effort-estimator-ai-ops.test.ts src/lib/programs/expert-kernel/__tests__/move-business-case-ai-ops.test.ts --runInBand` (5 tests).
- Pass: `npx eslint src/lib/programs/expert-kernel/effort-estimator.ts src/lib/programs/expert-kernel/business-case-compiler.ts src/lib/programs/move-business-case.ts src/lib/programs/expert-kernel/__tests__/effort-estimator-ai-ops.test.ts src/lib/programs/expert-kernel/__tests__/move-business-case-ai-ops.test.ts src/lib/programs/expert-kernel/exports/board-grade/__tests__/verdict-explainer.test.ts`.
- Pass: `npm run qa:agent-quality:corpus` (60 cases across Apex, Meridian, First Capital, and SkyHarbor).
- Pass: `npx tsc --noEmit --pretty false`.
- Pass: `npm run release:check -- --base origin/main --head HEAD`.

## Rollout Plan

Merge to `main` and deploy through the normal Vercel production path. No database migration is required; callers can begin supplying AI ops inputs when the UI/API slices are ready.

## Rollback Plan

`gh pr revert <PR number>` removes the optional AI ops wiring. Since all new fields are optional and no data is migrated, rollback has no persistent-state cleanup.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- Local validation: pending.

## Known Gaps

This slice wires the model into expert-kernel outputs. Rendering the three-axis business-case card, vendor scorecard inference economics, BAFO pricing-tier language, pattern-failure modes, and Tower AI Ops Cost Ledger remain separate Wave 1 slices.
