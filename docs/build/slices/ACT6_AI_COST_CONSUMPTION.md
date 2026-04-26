# ACT6 — AI Cost / Consumption Read Model

## Purpose

ACT6 operationalizes the AI Cost & Consumption dimension of the AI
Control Tower contract (ACT1). It introduces a deterministic, seed-only
read model that projects license, token, API call, and round-number USD
cost records keyed by canonical scope (tenant / program / workflow /
user) so the Tower can compose Atlas brief content, scorecards, and
pressure cards in later slices.

## What changed

- Added `src/lib/tower/ai-cost-consumption.ts` exporting:
  - Canonical enums `AI_COST_CONSUMPTION_SCOPES`, `AI_COST_UNITS`,
    `AI_COST_UTILIZATION_LEVELS`.
  - Public types `AiCostConsumptionEntry`, `AiCostConsumptionSummary`,
    `AiCostBudget`.
  - Pure helpers `buildAiCostConsumptionSeed()`,
    `summarizeAiCostConsumption()`, `getOverBudgetEntries()`, and
    `calculateAiCostUtilization()`.
- Added `src/__tests__/integration/tower/ai-cost-consumption.test.ts`
  with 62 deterministic assertions covering enum coverage, seed
  determinism, scope / unit / utilization distribution, no-fabrication
  invariants (placeholder provider labels, round-number USD
  placeholders, `seed_value: true`, `createdFrom` provenance), summary
  reconciliation, and over-budget filtering.
- Appended an ACT6 slice entry to `docs/build/build-slices.json`.
- Appended an ACT6 line to `notes` and an ACT6 sentence to `nextAction`
  on the `ai_control_tower` component in
  `docs/build/production-readiness.json` (no status promotion).

## Out of scope

- No live integrations, model calls, retrieval, or fetch calls.
- No per-tenant binding to captured Model Gateway audit records or real
  license inventories.
- No persistence, migrations, or supabase changes.
- No Atlas brief composition wiring (deferred to ACT9).
- No UI surface, no route changes, no Steward or Source coupling.

## Why safe

- Module is deterministic: every value is a string / numeric / boolean
  literal; no `Date.now`, `Math.random`, `new Date`, `fetch`, or
  provider SDK references.
- Provider labels are placeholders (`provider_alpha`, `provider_beta`,
  `provider_gamma`) — no real vendor names appear.
- USD figures are round-number placeholders (0 / 100 / 500 / 1000 /
  2500 / 5000) and every entry carries `seed_value: true` and
  `createdFrom: 'deterministic_ai_cost_consumption_seed'`.
- No production status is promoted by this slice.

## How to re-run

```
npx tsc --noEmit --pretty false
npx jest src/__tests__/integration/tower/ai-cost-consumption.test.ts
```

## Readiness impact

- `ai_control_tower` component status preserved at `code_complete`.
- One ACT6 line appended to `notes` documenting the new dimension.
- One ACT6 sentence appended (UNION) to `nextAction` documenting the
  follow-up Atlas brief composition step.
- Top-level `lastUpdated` set to `2026-04-26`.

## Cross-references

- Contract: ACT1 AI Control Tower contract.
- Sibling dimensions: ACT2 (portfolio inventory), ACT3 (adoption /
  usage), ACT4 (value / outcome ledger), ACT5 (risk / governance), ACT7
  (productivity / DORA).
- Manifests: `docs/build/build-slices.json`,
  `docs/build/production-readiness.json`.
