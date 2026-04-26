# ACT8 · Tech & Data Readiness Read Model

Slice ID: ACT8
Slice name: Tech & Data Readiness Read Model
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-26
Author: Code (sole)
Type: Application code (deterministic read model + integration
tests). No application UI, no runtime modification, no migrations,
no model calls, no live integrations.

Operationalizes the **Tech & Data Readiness** dimension of the AI
Control Tower contract ([ACT1](./ACT1_AI_CONTROL_TOWER_CONTRACT.md))
by projecting a deterministic, cross-tenant set of readiness signals
into a typed read model. The Tower will compose this read model into
Atlas brief content, scorecards, and pressure cards in later slices
(ACT9, ACT10). This slice is **types + seed + helpers + tests
only**; no surface binds it yet.

---

## A. What this slice ships

### Module

[`src/lib/tower/tech-data-readiness.ts`](../../../src/lib/tower/tech-data-readiness.ts)

Public types and tuples:

- `TECH_READINESS_DIMENSIONS` (canonical tuple of six sub-dimensions:
  `data_quality`, `integration_apis`, `cloud_readiness`,
  `model_gateway_readiness`, `security_posture`, `observability`)
  and `TechReadinessDimension`.
- `TECH_READINESS_LEVELS` (`'low' | 'medium' | 'high' | 'unknown'`)
  and `TechReadinessLevel`.
- `TECH_READINESS_ASSESSMENT_SOURCES` (`'seed_only'`,
  `'manual_capture'`, `'platform_review_seed'`,
  `'security_review_seed'`, `'data_council_seed'`) and
  `TechReadinessAssessmentSource`.
- `TechReadinessSignal`, `TechReadinessSummary`, `TechReadinessGap`.

Public helpers:

- `buildTechDataReadinessSeed()` — returns the canonical seed.
- `summarizeTechDataReadiness(signals?)` — reconciles totals, sorts
  unique sets ascending; defaults to the canonical seed.
- `getReadinessGaps(signals?)` — filters to entries whose level is
  `low` or `unknown`. These are the entries Atlas surfaces as
  foundation gaps so the Tower can render attention rather than a
  fabricated readiness number.

### Tests

[`src/__tests__/integration/tower/tech-data-readiness.test.ts`](../../../src/__tests__/integration/tower/tech-data-readiness.test.ts)

53 deterministic integration tests covering shape & determinism,
dimension and level coverage, per-row invariants (`liveTelemetry:
false` on every signal, canonical assessment source, canonical
dimension and level, non-empty headlines and notes), distribution
constraints (≥ 5 unique domain labels and a sample of required
role-based labels), summary reconciliation, `getReadinessGaps`
behavior, no-fabrication invariants (no fake dollars, no branded
vendor endorsements, no banned placeholder language, no positive
live-telemetry claims), and module hygiene (no banned imports, no
`Date.now` / `Math.random` / `new Date(` / `fetch(` / `anthropic` /
`openai` / `useState` / `useEffect`).

### Manifest updates

- `docs/build/build-slices.json` gains an ACT8 entry.
- `docs/build/production-readiness.json` gains a note on the
  `ai_control_tower` component acknowledging the ACT8 dimension and
  appending an ACT8 sentence to `nextAction`. The component is **not
  promoted**; status is preserved.

---

## B. Distribution shape (test-enforced)

| Constraint | Floor |
|---|---|
| Total signals | ≥ 20 |
| Dimensions covered | all 6 (≥ 1 each) |
| Levels present | all 4 (≥ 1 each) |
| Low-level signals | ≥ 3 |
| Unknown-level signals | ≥ 1 |
| Unique domain labels | ≥ 5 |

Domains covered include Customer Data Domain, Contact Center
Platform, Store Operations Platform, Demand Forecasting Domain,
Identity & Access Domain, Platform Cloud Foundations, Risk &
Compliance Data Domain, Marketing Analytics Domain, and Edge &
Mobile Surfaces. `domainLabel` is a role-based label; the seed
cannot be mistaken for live tenant data.

---

## C. No-fabrication contract

Every signal carries `liveTelemetry: false` and `createdFrom:
'deterministic_tech_data_readiness_seed'`. Every `assessmentSource`
is one of the seed-tagged values. Tests block fake dollars, branded
vendor endorsements (OpenAI / Anthropic / Cohere / Mistral /
Databricks / Snowflake / Microsoft Copilot / GitHub Copilot),
banned placeholder language (Coming soon / TBD / Lorem ipsum), and
any positive live-telemetry phrase outside the negated
`liveTelemetry: false` field.

---

## D. What this slice does NOT do

- No Atlas brief composition (deferred to ACT9).
- No Tower UI (deferred to ACT10).
- No connector binding, no per-tenant scoping, no persistence, no
  migrations, no Drizzle, no supabase.
- No live telemetry.

---

## E. Validation

- `npx tsc --noEmit --pretty false` — pass.
- `npx jest src/__tests__/integration/tower/tech-data-readiness.test.ts`
  — 53/53 pass.

---

## F. Status

Code complete. Pending founder review for promotion to `verified`.
Conservative — does not promote any production-readiness component.
