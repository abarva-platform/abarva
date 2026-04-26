# ACT4 · AI Value / Outcome Ledger Read Model

Slice ID: ACT4
Slice name: AI Value / Outcome Ledger Read Model
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-25
Author: Code (sole)
Type: Application code (deterministic read model + integration
tests). No application UI, no runtime modification, no migrations,
no model calls, no live integrations.

Operationalizes the value-and-outcome dimension of the AI Control
Tower contract ([ACT1](./ACT1_AI_CONTROL_TOWER_CONTRACT.md)). Builds
on the AI Portfolio Inventory read model
([ACT2](./ACT2_AI_PORTFOLIO_INVENTORY_READ_MODEL.md)) by attaching a
deterministic, cross-tenant ledger of value claims keyed by program
key and AI use case key. Atlas will compose this read model into
Tower brief content, scorecards, and value-gap pressure cards in
later slices (ACT9, ACT10). This slice is **types + seed + helpers
+ tests only**; no surface binds it yet.

---

## A. What this slice ships

### Module

[`src/lib/tower/ai-value-outcome-ledger.ts`](../../../src/lib/tower/ai-value-outcome-ledger.ts)

Public types:

- `VALUE_LEDGER_CATEGORIES` (canonical tuple) and `ValueLedgerCategory`.
- `VALUE_MEASUREMENT_UNITS` and `ValueMeasurementUnit`.
- `VALUE_READINESS_STATES` and `ValueReadinessState`.
- `VALUE_COUNTERFACTUAL_CONFIDENCE_LEVELS` and
  `ValueCounterfactualConfidence`.
- `VALUE_GOVERNANCE_REVIEW_STATUSES` and
  `ValueGovernanceReviewStatus`.
- `ValueLedgerEntry`.
- `ValueOutcomeLedgerSummary`.

Public helpers:

- `buildAiValueOutcomeLedger()` — returns the canonical seed.
- `summarizeAiValueOutcomeLedger(entries?)` — reconciles totals;
  exposes every canonical category / readiness / measurement-unit
  key (zero allowed); sorts unique sets ascending; defaults to the
  canonical seed.
- `getMeasuredEntries(entries?)` — returns entries whose readiness
  is `'measured_in_pilot'` or `'measured_in_production'`.
- `getProjectedOnlyEntries(entries?)` — returns entries whose
  readiness is `'projected_only'`.
- `getEntriesByCategory(category, entries?)` — filters by category
  in input order.
- `computeVariance(entry)` — pure function that returns
  `{ varianceAbs, variancePercent }`. Returns `null` fields when
  `realizedValue` is `null`; refuses to divide by zero.

### Tests

[`src/__tests__/integration/tower/ai-value-outcome-ledger.test.ts`](../../../src/__tests__/integration/tower/ai-value-outcome-ledger.test.ts)

69 deterministic tests across the following blocks:

- **Shape & determinism** — ≥ 16 entries, byte-equal across calls,
  canonical category and readiness tuples in stable order, every
  entry carries `seed_value: true` and `createdFrom:
  'deterministic_value_outcome_ledger_seed'`, every id matches the
  `value-seed-{n}` shape, ids are unique, every entry has a
  non-empty initiative, counterfactual, and ownerRole, every entry
  carries ≥ 1 note.
- **Category & readiness coverage** — every canonical category and
  every canonical readiness state has ≥ 1 entry; every entry uses
  canonical categories, readiness states, measurement units,
  counterfactual confidence labels, and governance review statuses.
- **Per-row invariants** — entries with `realizedValue !== null`
  have non-null `varianceAbs` / `variancePercent`; entries with
  `realizedValue === null` have null variance fields; linked claim
  ids use the canonical `claim-seed-` prefix; every numeric value
  is finite.
- **Distribution constraints** — ≥ 4 entries with `realizedValue
  !== null`; ≥ 2 entries with `governanceReviewStatus: 'flagged'`;
  ≥ 2 entries linked to `programKey` (canonical seed strings);
  ≥ 2 entries linked to `aiUseCaseKey` (canonical seed strings).
- **`computeVariance`** — null on null realized; correct positive,
  negative, and zero math; safe handling of zero `projectedValue`;
  matches the precomputed seed values field-by-field.
- **Summary reconciliation** — `byCategory`, `byReadiness`, and
  `byMeasurementUnit` reconcile to `totalEntries`; every canonical
  key is present (zero allowed); `measuredCount` counts
  `measured_in_pilot` + `measured_in_production`;
  `projectedOnlyCount` equals `byReadiness.projected_only`;
  `flaggedGovernanceCount` agrees with the defining filter;
  `uniqueInitiatives` is sorted ascending and de-duplicated; no-arg
  call summarizes the canonical seed.
- **Helper behaviors** — `getMeasuredEntries`,
  `getProjectedOnlyEntries`, and `getEntriesByCategory` filter
  correctly; helpers default to the canonical seed when no entries
  argument is supplied.
- **No fabrication** — `JSON.stringify(ledger)` never carries a
  `$`-prefixed dollar narrative; every dollar-denominated entry uses
  the `'usd_seed'` measurement unit; never carries a branded vendor
  endorsement (`OpenAI`, `Anthropic`, `Cohere`, `Mistral`,
  `Databricks`, `Snowflake`, `Microsoft Copilot`, `GitHub Copilot`)
  or banned placeholder (`Coming soon`, `TBD`, `Lorem ipsum`); every
  entry carries the `seed_value: true` provenance flag.
- **Module hygiene** — module source contains no imports from
  Source / Sentinel / Atlas / Nexus / Agent runtime, auth, or
  supabase; no `Date.now` / `Math.random` / `new Date(` / `fetch(`;
  no `anthropic` / `openai` / `useState` / `useEffect`; no banned
  placeholder text.

### Manifest updates

- [`docs/build/build-slices.json`](../build-slices.json) gains an
  `ACT4` entry (category `ACT`, status `code_complete`, risk `low`,
  `dependsOn: ["ACT2"]`).
- [`docs/build/production-readiness.json`](../production-readiness.json)
  gains a note on the `ai_control_tower` and `audit_governance`
  components acknowledging the ACT4 value / outcome ledger
  dimension. Components are **not promoted**; statuses are
  preserved.

---

## B. Why this slice exists

The AI Control Tower contract names value-and-outcome capture as a
first-class concern. ACT2 captured the inventory; ACT4 captures the
*claims* about value those inventory items produce — projected,
baseline, realized, and the counterfactual that justifies the
realized number.

Atlas refuses to claim a defended dollar number without three
artefacts: a baseline, a measured value, and a counterfactual. This
read model encodes those artefacts deterministically so Tower brief
composition can render value gaps honestly: "projected only", "no
baseline", or "declined" instead of a fabricated dollar.

Once ACT4 is canonical, ACT5+ layer adoption / risk / cost /
productivity / readiness on top of the same inventory and ledger
keys; ACT9 composes the Atlas Tower brief from the seven dimension
read models; ACT10 implements the Tower surface.

This slice is **deliberately deterministic and seed-only** so that
later slices land against a stable contract.

---

## C. Distribution shape (test-enforced)

The seed contains 18 deterministic entries spread across all seven
canonical categories and all seven canonical readiness states.

| Readiness | Count |
|---|---|
| projected_only | 3 |
| baseline_pending | 1 |
| baseline_set | 2 |
| in_pilot_measurement | 2 |
| measured_in_pilot | 3 |
| measured_in_production | 5 |
| declined | 2 |

| Category | Count |
|---|---|
| cost_avoidance | 2 |
| productivity | 4 |
| revenue_lift | 2 |
| risk_reduction | 3 |
| customer_experience | 3 |
| employee_experience | 2 |
| compliance | 2 |

Distribution invariants additionally tested:

- ≥ 4 entries with `realizedValue !== null` (5 in the seed).
- ≥ 2 entries with `governanceReviewStatus: 'flagged'` (HR resume
  screening fairness remediation declined; Finance forecast
  assistant data access blocker; Finance invoice extraction pilot
  capture).
- ≥ 2 entries linked to a canonical `programKey` (Customer support
  deflection, Customer support response suggestion baseline,
  Customer support self-service NPS uplift, Customer support voice
  transcript quality scoring all link `contact-center-ai`;
  Operations demand forecast scaled links `demand-forecasting-ai`).
- ≥ 2 entries linked to a canonical `aiUseCaseKey` (every entry in
  the seed names an `ai-use-case-seed-{n}` key from ACT2).

---

## D. No-fabrication contract

The seed honors the ACT1 §K no-fabrication rules and adds two
ledger-specific guarantees:

1. **No fake dollars.** Tested via `\$\s*\d` regex on the serialized
   ledger.
2. **`'usd_seed'` is the only allowed dollar unit.** No entry uses
   `'usd'` or `'dollar'` as a measurement unit. The Tower surface
   must render `'usd_seed'` as a *seed projection*, not as an
   audited dollar fact.
3. **`seed_value: true` on every entry.** No entry can be silently
   promoted to a "live" claim until per-tenant binding lands in
   ACT4.x.
4. **No live model claim.** Every entry carries
   `createdFrom: 'deterministic_value_outcome_ledger_seed'`. Module
   source has no `anthropic` / `openai` / `fetch(` / `Date.now` /
   `Math.random` / `new Date(`.
5. **No vendor brand claims.** The deny-list scan blocks `OpenAI`,
   `Anthropic`, `Cohere`, `Mistral`, `Databricks`, `Snowflake`,
   `Microsoft Copilot`, and `GitHub Copilot`.
6. **No "industry average" claims.** Every counterfactual names a
   comparison condition tied to the same program / inventory record
   rather than a benchmark.
7. **No claim that the ledger is audited.** Entries carry honest
   readiness states; the helper `getProjectedOnlyEntries` exists
   specifically so Tower content can render projection-only entries
   as gaps rather than as defended claims.
8. **No silent suppression.** Declined claims are kept in the
   ledger with `readiness: 'declined'` and a non-empty
   counterfactual narrative explaining the comparison condition that
   would have applied.

---

## E. What this slice does NOT do

- **No Atlas brief composition.** Atlas brief composition lands in
  ACT9. ACT4 emits no prose framing.
- **No Tower UI.** The `/tenant/{tenantKey}/tower` surface is built
  in ACT10. ACT4 has no JSX, no React components, no DOM.
- **No connector binding.** The seed is the only data source. ACT4.x
  follow-up slices replace the seed with a connector-backed
  projection (Steward-owned).
- **No tenant scoping.** The seed is cross-tenant by design — it is
  a *ledger shape* rather than a per-tenant ledger. Per-tenant
  binding happens in ACT4.x once Steward captures value claims per
  tenant.
- **No persistence.** No supabase, no migrations, no Drizzle, no
  JSON file write.
- **No model gateway routing.** No call site touches MG2 or any
  model provider SDK.
- **No tests against React, DOM, or runtime APIs.** Integration
  coverage is purely deterministic.

---

## F. Future ACT4.x follow-up

These items are explicitly deferred:

- **ACT4.1 — Per-tenant ledger binding.** Replace the seed with a
  Steward-captured, per-tenant ledger while preserving the read
  model contract.
- **ACT4.2 — Value gap scorecard.** Atlas surfaces value-gap counts
  (projected_only, baseline_pending, declined) as a Tower
  scorecard.
- **ACT4.3 — Counterfactual evidence binding.** Every claim
  references one or more EVID2 / EVID3 evidence ids; the EVID3
  evaluator replaces the `evidenceLinkedClaimIds` strings with
  resolved evidence pointers.
- **ACT4.4 — Variance attribution narrative.** Atlas brief composes
  a one-paragraph variance narrative per measured claim, capped at
  the brief length limit.

---

## G. Validation

- `npx tsc --noEmit --pretty false` — pass.
- `npx jest src/__tests__/integration/tower/ai-value-outcome-ledger.test.ts`
  — 69 passed.
- `npm run build` — pass (covered separately).
- `python3 -c "import json; json.load(open('docs/build/build-slices.json')); json.load(open('docs/build/production-readiness.json'))"`
  — pass.

---

## H. Status

Code complete. Pending founder review for promotion to `verified`.
Conservative — does not promote any production-readiness component;
adds a single note each on `ai_control_tower` and `audit_governance`.
