# ACT2 · AI Portfolio Inventory Read Model

Slice ID: ACT2
Slice name: AI Portfolio Inventory Read Model
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-25
Author: Code (sole)
Type: Application code (deterministic read model + integration
tests). No application UI, no runtime modification, no migrations,
no model calls, no live integrations.

Operationalizes dimension #1 of the AI Control Tower contract
([ACT1](./ACT1_AI_CONTROL_TOWER_CONTRACT.md)) by projecting a
deterministic, cross-tenant inventory of AI use cases into a typed
read model. The Tower will compose this read model into Atlas brief
content, scorecards, and pressure cards in later slices (ACT9, ACT10).
This slice is **types + seed + helpers + tests only**; no surface
binds it yet.

---

## A. What this slice ships

### Module

[`src/lib/tower/ai-portfolio-inventory.ts`](../../../src/lib/tower/ai-portfolio-inventory.ts)

Public types:

- `AI_USE_CASE_STAGES` (canonical tuple) and `AiUseCaseStage`.
- `AI_USE_CASE_RISK_LEVELS` and `AiUseCaseRiskLevel`.
- `AI_USE_CASE_VALUE_READINESS_STATES` and `AiUseCaseValueReadiness`.
- `AI_USE_CASE_ADOPTION_STATUSES` and `AiUseCaseAdoptionStatus`.
- `AI_USE_CASE_DATA_READINESS_STATES` and `AiUseCaseDataReadiness`.
- `AI_USE_CASE_GOVERNANCE_STATUSES` and `AiUseCaseGovernanceStatus`.
- `AI_USE_CASE_OWNER_SCOPES` and `AiUseCaseOwnerScope`.
- `AiUseCaseOwner`.
- `AiUseCaseInventoryItem`.
- `AiPortfolioInventorySummary`.

Public helpers:

- `buildAiPortfolioInventory()` — returns the canonical seed.
- `summarizeAiPortfolioInventory(items?)` — reconciles totals; sorts
  unique sets ascending; defaults to the canonical seed.
- `getAiUseCasesByStage(items, stage)` — filters by stage in input
  order.
- `getBlockedAiUseCases(items)` — convenience wrapper for the
  `blocked` stage.
- `getValueReadinessGaps(items)` — items whose `valueReadiness` is
  `'unmeasured'` or `'declined'`. Atlas cannot defend a value claim
  for these.

### Tests

[`src/__tests__/integration/tower/ai-portfolio-inventory.test.ts`](../../../src/__tests__/integration/tower/ai-portfolio-inventory.test.ts)

45 deterministic tests across the following blocks:

- **Shape & determinism** — ≥ 18 records, byte-equal across calls,
  canonical stage tuple, every record carries
  `createdFrom: 'deterministic_ai_portfolio_seed'`, every id matches
  the `ai-use-case-seed-{n}` shape, every id is unique, every record
  has a non-empty `name` and `nextAction`.
- **Stage coverage** — every canonical stage has ≥ 2 records.
- **Per-row invariants** — every blocked record has a non-empty
  `blockerReason`; only blocked records carry `blockerReason`; every
  record has ≥ 1 technology stack entry; every record carries an
  owner role and canonical responsibility scope; `linkedPrograms`
  and `linkedPatterns` are arrays.
- **Distribution constraints** — ≥ 6 unique business functions,
  ≥ 2 production records with `valueReadiness:
  'measured_in_production'`, ≥ 2 records with
  `governanceStatus: 'flagged'`.
- **Summary reconciliation** — `byStage` and `byRiskLevel` reconcile
  to `totalUseCases`; every canonical key is present (zero allowed);
  `blockedCount` equals `byStage.blocked`;
  `measuredInProductionCount` and `ungovernedCount` agree with their
  defining filters; `uniqueBusinessFunctions` and
  `uniqueTechnologyStacks` are sorted ascending and de-duplicated;
  no-arg call summarizes the canonical seed.
- **Helper behaviors** — `getAiUseCasesByStage('blocked')` matches
  `getBlockedAiUseCases`; `getAiUseCasesByStage` returns only
  matching stage; `getValueReadinessGaps` returns only unmeasured /
  declined items and excludes measured / projected /
  in-pilot-measurement items.
- **No fabrication** — `JSON.stringify(inventory)` never carries a
  dollar number, a branded vendor endorsement (`OpenAI`, `Anthropic`,
  `Cohere`, `Mistral`, `Databricks`, `Snowflake`,
  `Microsoft Copilot`, `GitHub Copilot`), or a banned placeholder
  (`Coming soon`, `TBD`, `Lorem ipsum`).
- **Module hygiene** — module source contains no imports from
  Source / Sentinel / Atlas / Nexus / Agent runtime, auth, or
  supabase; no `Date.now` / `Math.random` / `new Date(` / `fetch(`;
  no `anthropic` / `openai` / `useState` / `useEffect`; no banned
  placeholder text.

### Manifest updates

- [`docs/build/build-slices.json`](../build-slices.json) gains an
  `ACT2` entry (category `ACT`, status `code_complete`, risk `low`,
  `dependsOn: ["ACT1"]`).
- [`docs/build/production-readiness.json`](../production-readiness.json)
  gains a note on the `ai_control_tower` component acknowledging the
  ACT2 inventory dimension. The component is **not promoted**;
  status is preserved.

---

## B. Why this slice exists

The AI Control Tower contract names seven canonical dimensions. The
first dimension — **AI Portfolio Inventory** — is the foundation
every other dimension reads against. Atlas cannot frame
"where the portfolio stands" until the inventory has a deterministic
shape; Sentinel cannot detect portfolio sparsity until the inventory
exists; Steward cannot flag unowned cases until ownership is captured
in the read model.

ACT2 establishes that shape. Once this read model is canonical, ACT3
through ACT8 layer adoption / value / risk / cost / productivity /
readiness onto the same inventory keys. ACT9 composes the Atlas brief
from the seven dimension read models. ACT10 implements the surface.

This slice is **deliberately deterministic and seed-only** so that
later slices land against a stable contract.

---

## C. Distribution shape (test-enforced)

The seed contains 22 deterministic records distributed as follows:

| Stage | Count |
|---|---|
| idea | 4 |
| discovery | 4 |
| pilot | 4 |
| production | 4 |
| scaled | 2 |
| retired | 2 |
| blocked | 2 |

Stage minimums are tested at ≥ 2 each. The total exceeds the 18
minimum required by the spec.

Business functions covered (sorted ascending):

- Customer Support
- Engineering
- Finance
- HR
- Legal
- Marketing
- Operations
- Procurement
- Risk

Tests assert ≥ 6; the seed carries 9.

Distribution invariants additionally tested:

- ≥ 2 production records carry
  `valueReadiness: 'measured_in_production'` (Engineering code
  completion, Customer support intent classification, plus the
  Engineering test failure clustering record at `ai-use-case-seed-20`
  and the Customer support self-service assistant scaled to all
  regions and Operations demand forecast scaled records cover the
  scaled stage).
- ≥ 2 records carry `governanceStatus: 'flagged'` (HR resume
  screening assistant, Finance forecast assistant — both blocked).
- Every blocked record carries a non-empty `blockerReason`.
- Every record carries ≥ 1 technology stack entry.

---

## D. No-fabrication contract

The seed honors the ACT1 §K no-fabrication rules:

1. **No fake dollars.** Tested via `\$\s*\d` regex on the serialized
   inventory.
2. **No fake citations.** No `E-###` evidence id appears anywhere in
   the seed.
3. **No live model claim.** Every record carries
   `createdFrom: 'deterministic_ai_portfolio_seed'`. Module source
   has no `anthropic` / `openai` / `fetch(` / `Date.now` /
   `Math.random` / `new Date(`.
4. **No vendor brand claims.** Vendors that are not yet selected are
   phrased as `(vendor not selected)`. The deny-list scan blocks
   `OpenAI`, `Anthropic`, `Cohere`, `Mistral`, `Databricks`,
   `Snowflake`, `Microsoft Copilot`, and `GitHub Copilot`.
5. **No "industry average" claims.** Seed prose names actions and
   scopes only.
6. **No "we deliver X% productivity uplift" claims.** Seed prose
   names actions and scopes only.
7. **No claim that the operating model is mature.** Records that
   reference operating-model concerns link the relevant
   `ai_governance_operating_model_gap` / `program_context_sparsity` /
   `gate_governance_gap` patterns rather than asserting maturity.
8. **No silent suppression.** Use cases that are blocked, retired,
   declined, or `unmeasured` honestly carry that state. The
   `getValueReadinessGaps` helper exists specifically so the Tower
   surface can render "value gap" instead of a fabricated dollar.

---

## E. What this slice does NOT do

- **No Atlas brief composition.** The Atlas Tower brief is composed
  from this read model (and its sibling dimension read models) in
  ACT9. ACT2 emits no prose framing.
- **No Tower UI.** The `/tenant/{tenantKey}/tower` surface is built
  in ACT10. ACT2 has no JSX, no React components, no DOM.
- **No connector binding.** The seed is the only data source. ACT2.x
  follow-up slices replace the seed with a connector-backed
  projection (Steward-owned).
- **No tenant scoping.** The seed is cross-tenant by design — it is
  an **inventory shape** rather than a per-tenant inventory. Per-
  tenant binding happens in ACT2.x once Steward captures inventory
  per tenant.
- **No persistence.** No supabase, no migrations, no Drizzle, no
  JSON file write.
- **No tests against React, DOM, or runtime APIs.** Integration
  coverage is purely deterministic.

---

## F. Future ACT2.x follow-up

These items are explicitly deferred:

- **ACT2.1 — Per-tenant inventory binding.** Replace the seed with a
  Steward-captured, per-tenant inventory while preserving the read
  model contract.
- **ACT2.2 — Inventory completeness scoring.** Atlas surfaces
  inventory completeness as a scorecard; Sentinel detects sparsity.
- **ACT2.3 — Inventory edit / approval flow.** Steward owns the
  capture surface; Atlas refuses to advance Tower brief content
  until the inventory is reviewed.
- **ACT2.4 — Value readiness lifecycle.** Helper transitions from
  `unmeasured` → `projected` → `in_pilot_measurement` →
  `measured_in_production`, with audit emission per transition.

---

## G. Validation

- `npx tsc --noEmit --pretty false` — pass.
- `npx jest src/__tests__/integration/tower/ai-portfolio-inventory.test.ts`
  — 45 passed.
- `npm run build` — pass (covered separately).
- `python3 -c "import json; json.load(open('docs/build/build-slices.json')); json.load(open('docs/build/production-readiness.json'))"`
  — pass.

---

## H. Status

Code complete. Pending founder review for promotion to `verified`.
Conservative — does not promote any production-readiness component.
