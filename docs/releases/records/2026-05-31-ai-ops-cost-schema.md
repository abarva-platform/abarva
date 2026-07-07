# 2026-05-31-ai-ops-cost-schema — AI Ops Cost Schema And Calculators

## Release ID

`2026-05-31-ai-ops-cost-schema`

## Status

`candidate`

## Plain-English Summary

Adds the first deterministic AI operating-cost model for Moves: token inference, embedding refresh/query cost, evaluation cost, optional fine-tune cost, pricing-tier breaches, model-tier drift, and per-call unit economics. This is the foundation for showing AI run cost next to build and change cost.

## Layer Impact

- `global-control-lane`: Adds shared expert-kernel modeling types, catalogs, and calculators available to all Move/business-case surfaces once wired by follow-up PRs.

## Client Applicability

- All clients: The calculator is shared and tenant-neutral.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None; no UI path is changed in this slice.

## Changes Included

- New `src/lib/programs/expert-kernel/ai-ops-cost/` module with schema, provider catalogs, embedding/eval defaults, and calculator exports.
- New unit tests for inference, cache pricing, embedding, eval, pricing-tier breaches, model-tier drift, alternate provider catalogs, and validation.

## QA / Validation

- Pass: `npx jest src/lib/programs/expert-kernel/ai-ops-cost/__tests__/calculator.test.ts --runInBand` (10 tests).
- Pass: `npx eslint src/lib/programs/expert-kernel/ai-ops-cost`.
- Pass: `npx tsc --noEmit --pretty false`.
- Pass: `npm run release:check -- --base origin/main --head HEAD`.

## Rollout Plan

Merge to `main`. This slice is pure TypeScript and has no runtime route, database migration, or tenant-data effect until later wiring PRs consume the module.

## Rollback Plan

`gh pr revert <PR number>` removes the optional module. No data rollback is required.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- Local validation: pending.

## Known Gaps

The `on_prem_oss` tier records public token rates only where a provider publishes them; Custom Model Import hosting economics stay deferred to the second wave because they require GPU/CMU utilization inputs rather than per-token public pricing.
