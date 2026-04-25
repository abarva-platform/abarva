# SOL3 · Solution Archetype Registry

Slice ID: SOL3
Slice name: Solution Archetype Registry
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-25
Author: Code (sole)
Type: Library + tests + slice doc — no application code surface
binding, no runtime modification, no migrations, no model calls.

Defines the AbarVa POV on **what AI-led transformation engagements
look like** as a deterministic library of canonical solution
archetypes. Programs, Atlas, Nexus, and Steward can recommend,
sequence, and govern these archetypes without inventing them at
runtime. **Library only — does not generate live architectures, invoke
models, or read tenant state.**

## Purpose

A *solution archetype* is a named, recurring shape of an AI-led
engagement at AbarVa. It is not a stock template (templates flatten
the client) and it is not a per-tenant solution (those are composed
at runtime per SOL1). The archetype anchors what AbarVa must learn
(current-state inputs), what we should produce (deliverables,
components, building blocks), what governance we must wrap, and what
value we expect to harvest.

Twelve canonical archetypes are registered here; the registry is the
primary source of truth that downstream surfaces (SOL7 detail view,
SOL8 canvas) will bind to once they ship.

## What changed

- New module
  [src/lib/solutions/solution-archetype-registry.ts](../../../src/lib/solutions/solution-archetype-registry.ts):
  - Public types: `SolutionArchetypeKey`, `SolutionArchetype`,
    `SolutionArchetypeAgentRoles`, `SolutionArchetypeSummary`.
  - Public exports:
    - `SOLUTION_ARCHETYPE_KEYS` — frozen tuple of canonical keys in
      canonical order.
    - `SOLUTION_ARCHETYPES` — full registry record keyed by
      canonical key.
    - `listSolutionArchetypes()` — full list in canonical order,
      byte-equal across calls.
    - `getSolutionArchetype(key)` — single archetype or `null` for
      unknown keys.
    - `recommendSolutionArchetypes({ sectors, capabilityKeywords })`
      — pure substring / key union match on caller-supplied sectors
      OR capability keywords; canonical-order results; ignores
      unknown / empty tokens.
    - `summarizeSolutionArchetypes(archetypes?)` — counts and
      ascending-sorted unique sets across the supplied archetypes
      (defaults to the full canonical list).

- New tests
  [src/__tests__/integration/solutions/solution-archetype-registry.test.ts](../../../src/__tests__/integration/solutions/solution-archetype-registry.test.ts):
  Forty-five deterministic tests covering: 12 canonical archetypes
  in canonical order; byte-equal serialization; full required schema
  and minimum-cardinality per archetype; SOL2 cross-reference for the
  AI-led PDLC archetype; analytics-modernization concept-token check;
  healthcare-archetype clinical-workflow + governance check;
  build-vs-buy-vs-partner vendor + startup assessment check; null on
  unknown keys; recommendation by sector and capability with
  canonical ordering and union semantics; summary reconciliation;
  no-fabricated-dollars; no banned placeholder phrases; module
  hygiene.

## Twelve canonical archetypes

| # | Key | Sector | Capability family | Recommended first workshop |
|---|---|---|---|---|
| 1 | `ai_led_pdlc_transformation` | `cross_sector` | `engineering_pdlc` | `current_state_discovery` |
| 2 | `analytics_modernization` | `cross_sector` | `data_and_analytics` | `data_foundation_assessment` |
| 3 | `healthcare_ambient_clinical_value_chain` | `healthcare_payer_provider` | `clinical_workflow` | `governance_risk_review` |
| 4 | `hcc_risk_adjustment_coding_accuracy` | `healthcare_payer_provider` | `risk_adjustment` | `governance_risk_review` |
| 5 | `prior_authorization_utilization_management` | `healthcare_payer_provider` | `clinical_workflow` | `governance_risk_review` |
| 6 | `kyc_customer_onboarding_ai` | `banking` | `governance_and_risk` | `governance_risk_review` |
| 7 | `predictive_maintenance_modernization` | `industrial` | `operations_automation` | `data_foundation_assessment` |
| 8 | `build_buy_partner_evaluation` | `cross_sector` | `governance_and_risk` | `architecture_solution_design` |
| 9 | `service_operations_agentic_automation` | `shared_services` | `operations_automation` | `current_state_discovery` |
| 10 | `ai_governance_operating_model` | `cross_sector` | `governance_and_risk` | `operating_model_alignment` |
| 11 | `contact_center_ai_transformation` | `cross_sector` | `customer_engagement` | `current_state_discovery` |
| 12 | `finance_fpna_ai_automation` | `shared_services` | `finance_back_office` | `data_foundation_assessment` |

Each archetype carries: `key`, `name`, `sector`, `capabilityFamily`,
`problemStatement`, `businessOutcomes` (≥3),
`currentStateInputsRequired` (≥3), `patternsUsed` (≥1),
`failureModesAddressed` (≥1), `solutionComponents` (≥2),
`architectureBuildingBlocks` (≥3), `workshopsRequired` (≥2),
`smesRequired` (≥2), `buildBuyPartnerConsiderations` (≥2),
`governanceRiskConsiderations` (≥2), `deliverablesGenerated` (≥2),
`valueMetrics` (≥2), `agentRoles` (Nexus / Sentinel / Atlas /
Steward, all named), `recommendedFirstWorkshop`, and the
`createdFrom: 'deterministic_solution_archetype_registry'` marker.

## Helper functions

- `listSolutionArchetypes()` — returns the full canonical list. Pure
  and byte-equal across calls.
- `getSolutionArchetype(key)` — returns the canonical record or
  `null` for unknown / non-canonical keys (including SOL2 component
  keys, PF1 failure-mode keys, and I1 pattern keys).
- `recommendSolutionArchetypes({ sectors, capabilityKeywords })` —
  returns archetypes whose `sector` matches a supplied sector
  substring OR whose surface text overlaps with supplied capability
  keywords. Order is canonical regardless of input order. Unknown
  and empty / whitespace-only tokens are silently ignored.
- `summarizeSolutionArchetypes(archetypes?)` — returns
  `{ totalCount, sectors, uniqueWorkshops, uniqueArchitectureBlocks }`
  with ascending-sorted unique sets. Default param iterates the full
  canonical list (`totalCount === 12`).

## Deterministic invariants

- The registry list is byte-equal across repeated calls (test
  enforced).
- `getSolutionArchetype` returns `null` for unknown keys including
  keys that belong to SOL2, PF1, or I1 (test enforced).
- Recommendation is union-semantics on sector OR capability overlap
  (test enforced).
- Recommendation order is canonical regardless of input order (test
  enforced).
- Recommendation ignores unknown sector / capability tokens and
  empty / whitespace-only tokens without throwing (test enforced).
- The `ai_led_pdlc_transformation` archetype names at least one
  canonical SOL2 `AiLedPdlcComponentKey` in `solutionComponents`
  (test enforced via runtime import of
  `AI_LED_PDLC_COMPONENT_KEYS_IN_ORDER`).
- `analytics_modernization` mentions data foundation, governance,
  and semantic layer concepts somewhere in its strings (test
  enforced).
- The three healthcare archetypes
  (`healthcare_ambient_clinical_value_chain`,
  `hcc_risk_adjustment_coding_accuracy`,
  `prior_authorization_utilization_management`) reference clinical
  workflow + governance language (test enforced).
- `build_buy_partner_evaluation` references vendor / startup
  assessment (test enforced).
- Every archetype is tagged
  `createdFrom: 'deterministic_solution_archetype_registry'` (test
  enforced).
- No archetype invents a dollar amount in any string field (test
  enforced via `\$\s?\d` regex sweep on
  `JSON.stringify(SOLUTION_ARCHETYPES)`).
- No archetype contains banned placeholder phrases ("Coming soon",
  "TBD", "Lorem ipsum") in any string field (test enforced).

## What is NOT yet wired to runtime

- No live composition: this module does not generate per-tenant
  architectures. It is a library of canonical archetypes the
  composition flow (SOL1) refers to.
- No LLM invocation: archetype content is hand-authored; no Claude
  / OpenAI calls.
- No UI surfacing: no archetype detail view, list view, or canvas
  binding inside Programs / Tower / Intelligence / Admin yet —
  surface bindings are deferred to SOL7 / SOL8.
- No persistence: every call rebuilds from the in-memory registry.

## What is deferred

- **SOL7 — Solution archetype detail view** — wires the registry
  into the platform UI as a per-archetype detail page (problem
  statement, outcomes, current-state inputs, components, building
  blocks, workshops, governance, deliverables, value metrics, agent
  roles).
- **SOL8 — Solution archetype canvas** — composes a tenant's
  candidate archetype mix on the workshop canvas, grounded in
  Sentinel pattern detections, PF1 failure modes, and SOL2 component
  coverage.
- **SOL9 — Per-tenant archetype adoption tracking** — tracks which
  archetypes a tenant has activated, with what depth, against the
  value ledger.
- **SOL10 — Archetype-to-workshop scheduling** — uses
  `workshopsRequired` and `recommendedFirstWorkshop` to schedule the
  next workshop given the active program / tenant state.

## Honest fallbacks used

- Archetype content is hand-authored; no language implies live
  retrieval or runtime computation.
- The registry references SOL2 components for `ai_led_pdlc_transformation`
  by canonical key but does **not** assume SOL2 keys exist for every
  archetype: archetypes 2–12 reference solution components they
  expect to exist (governed data foundation, ambient scribe
  workflow, AI screening, etc.) without binding to a specific SOL2
  key set. Future SOL slices will widen the SOL2 component pack to
  cover those domains.
- The recommendation function is *substring* match on sector and
  surface text, not an LLM classifier. It is deterministic and
  inspectable; it never claims confidence it cannot defend.
- `currentStateInputsRequired` is a checklist, not a resolved
  citation chain; no `E-###` or fake citation appears anywhere in
  the registry.
- Module imports nothing from Sentinel / Atlas / Nexus / Agent
  runtime, Source UI, legacy `/programs`, `mock.ts`, auth, or
  supabase (test enforced).
- Module makes no `Date.now`, `Math.random`, `new Date(`, or
  `fetch(` calls; uses no React state hooks (test enforced).

## Validation

- `npx tsc --noEmit --pretty false` — pass
- `npx jest src/__tests__/integration/solutions/solution-archetype-registry.test.ts`
  — 45 / 45 tests pass
- `npm run build` — pass
- `python3 -c "import json; json.load(open('docs/build/build-slices.json'))"`
  — pass

## Status

Code complete. Pending founder review.
