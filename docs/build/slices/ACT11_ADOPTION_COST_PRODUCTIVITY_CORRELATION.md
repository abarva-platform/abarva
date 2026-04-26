# ACT11 · Adoption × Cost × Productivity Correlation Read Model

Slice ID: ACT11
Slice name: Adoption × Cost × Productivity Correlation Read Model
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-26
Author: Wave4 Lane E (Code-only)
Type: Application code (deterministic read model + integration
tests). No application UI, no runtime modification, no migrations,
no model calls, no live integrations, no statistics.

Operationalizes the **cross-dimension correlation** surface of the
AI Control Tower contract ([ACT1](./ACT1_AI_CONTROL_TOWER_CONTRACT.md))
by projecting a deterministic, cross-tenant set of **structural
correlation pairings** between AI adoption ([ACT3](./ACT3_AI_ADOPTION_USAGE_READ_MODEL.md)),
AI cost (cost rails / ACT8 follow-on), AI productivity / DORA
([ACT7](./ACT7_AI_PRODUCTIVITY_DORA_READ_MODEL.md)), and AI value
realization ([ACT4](./ACT4_VALUE_OUTCOME_LEDGER_READ_MODEL.md)).

This slice is **types + seed + helpers + tests only**; no surface
binds it yet.

---

## A. What this slice ships

### Module

[`src/lib/tower/adoption-cost-productivity-correlation.ts`](../../../src/lib/tower/adoption-cost-productivity-correlation.ts)

Public types and tuples:

- `CORRELATION_SIGNAL_KINDS` and `CorrelationSignalKind`
  (`'adoption' | 'cost' | 'productivity_dora' | 'value_realization'`).
- `CORRELATION_DIRECTIONS` and `CorrelationDirection`
  (`'positive' | 'negative' | 'neutral' | 'unknown'`).
- `CORRELATION_STRENGTHS` and `CorrelationStrength`
  (`'weak' | 'moderate' | 'strong' | 'unknown'`).
- `CorrelationPairing`.
- `CorrelationSummary`.

Public helpers:

- `buildCorrelationSeed()` — returns the canonical seed.
- `summarizeCorrelations(pairings?)` — reconciles totals; defaults
  to the canonical seed.
- `getStrongCorrelations(pairings?)` — returns only `strong`
  pairings.

### Tests

[`src/__tests__/integration/tower/adoption-cost-productivity-correlation.test.ts`](../../../src/__tests__/integration/tower/adoption-cost-productivity-correlation.test.ts)

49 deterministic integration tests covering shape and determinism,
4 × 4 × 4 (signal kind × direction × strength) coverage, summary
reconciliation, helper behavior, no-fabrication invariants, and
module hygiene.

### Manifest updates

- `docs/build/build-slices.json` gains an `ACT11` entry (status
  `code_complete`, risk `low`, `dependsOn: ["ACT3","ACT6","ACT7"]`).
- `docs/build/production-readiness.json` gains a note on the
  `ai_control_tower` component acknowledging ACT11. The component
  is **not promoted**; status is preserved.

---

## B. No-fabrication contract

1. **No statistical inference.** Every pairing is a structural seed
   pairing; the module performs no Pearson / Spearman / regression.
   Tests scan the serialized seed for those terms and fail on any
   match.
2. **No invented dollar amounts.** Cost references are keyed by
   canonical seed ids (`ai-cost-seed-*`); a `\$\s*\d` regex scan is
   enforced.
3. **No vendor brand claims.** A deny-list scan blocks `OpenAI`,
   `Anthropic`, `Cohere`, `Mistral`, `Databricks`, `Snowflake`,
   `Microsoft Copilot`, `GitHub Copilot`.
4. **No live telemetry claim.** Every pairing carries
   `seed_value: true` and
   `createdFrom: 'deterministic_adoption_cost_productivity_correlation_seed'`.
5. **Honest "unknown".** Both `direction` and `strength` carry an
   `unknown` band so the Tower can render an honest absence rather
   than a fabricated coefficient.

---

## C. What this slice does NOT do

- No Atlas brief composition (lands in ACT9.x).
- No Tower UI — no JSX, no React, no DOM.
- No connector binding; seed is the only data source.
- No per-tenant scoping (cross-tenant shape only).
- No persistence; no supabase, no migrations.
- No statistical coefficient computation.

---

## D. Validation

- `npx tsc --noEmit --pretty false` — pass.
- `npx jest src/__tests__/integration/tower/adoption-cost-productivity-correlation.test.ts`
  — 49 / 49 pass.

---

## E. Status

Code complete. Pending founder review for promotion to `verified`.
Does not promote any production-readiness component.
