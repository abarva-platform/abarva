# SOL3 · Solution Archetype Registry

Slice ID: SOL3
Slice name: Solution Archetype Registry
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-25
Author: Code (sole)

Formalizes the AbarVa POV on **what the broad shapes of a solution are**
as a deterministic registry of canonical solution archetypes that sit
*above* the SOL2 component packs. Each archetype carries a problem
statement, business outcomes, current-state inputs, patterns,
component references, architecture building blocks, workshops, SMEs,
build/buy/partner considerations, governance/risk considerations,
deliverables, value metrics, and the per-agent role for Nexus,
Sentinel, Atlas, and Steward. Programs, Atlas, Nexus, and Steward can
reach for an archetype to frame an engagement; SOL2 (and future
component packs) hangs underneath as the canonical inventory of
components that compose the archetype. **Library only — does not
generate live architectures, invoke models, or read tenant state.**

## What changed

- New module
  [src/lib/solutions/solution-archetype-registry.ts](../../../src/lib/solutions/solution-archetype-registry.ts):
  - Public types: `SolutionArchetypeKey`, `SolutionArchetype`,
    `SolutionArchetypeAgentRoles`,
    `SolutionArchetypeRegistrySummary`.
  - Public exports:
    - `SOLUTION_ARCHETYPE_KEYS` — frozen tuple of the eight keys in
      canonical order.
    - `SOLUTION_ARCHETYPES` — the registry record keyed by key.
  - Public helpers:
    - `listSolutionArchetypes()` — full registry in canonical order,
      byte-equal across calls.
    - `getSolutionArchetype(key)` — single archetype or `null` for
      unknown.
    - `recommendSolutionArchetypes({ sectors, capabilityKeywords })` —
      pure rule-based union match on sector substring or keyword
      substring against name / problem statement / business outcomes;
      canonical-order results; ignores unknown gracefully.
    - `summarizeSolutionArchetypes()` — aggregate `totalCount`,
      sorted-ascending `sectors`, `uniqueWorkshops`, and
      `uniqueArchitectureBlocks`.

- New tests
  [src/__tests__/integration/solutions/solution-archetype-registry.test.ts](../../../src/__tests__/integration/solutions/solution-archetype-registry.test.ts):
  Deterministic tests covering: canonical key tuple in canonical order;
  byte-equal `listSolutionArchetypes` across calls; full required
  field set per archetype with minimum-cardinality enforcement; all
  four `agentRoles` populated; `ai_led_pdlc_transformation` references
  at least one canonical SOL2 `AiLedPdlcComponentKey`;
  `getSolutionArchetype` null on unknown / `''` / SOL2 keys; recommend
  by sector substring; recommend by capability keyword; recommend
  union semantics on sectors OR capabilityKeywords; recommend
  canonical-order regardless of input order; recommend ignores
  unknown tokens without throwing; recommend determinism across
  calls; summary `totalCount === 8` and sorted-ascending sectors /
  uniqueWorkshops / uniqueArchitectureBlocks; no-fabricated-dollars on
  the registry blob; module hygiene (no Date.now / Math.random / new
  Date / fetch / anthropic / openai / supabase / forbidden imports /
  next/* / react).

- Manifest entry appended in
  [docs/build/build-slices.json](../build-slices.json) with the SOL3
  shape mirroring SOL2.

## Eight canonical archetypes

| # | Key | Sector | Primary problem reframed |
|---|---|---|---|
| 1 | `ai_led_pdlc_transformation` | Cross-industry | Velocity claims anecdotal without context layer + DORA + governance |
| 2 | `analytics_modernization` | Cross-industry | Metric drift across fragmented marts blocks executive trust |
| 3 | `healthcare_ambient_clinical_value_chain` | Healthcare | Documentation burden; ambient pilots stall in disconnected EHR workflows |
| 4 | `hcc_risk_adjustment_coding_accuracy` | Healthcare | Coding accuracy drives risk-adjustment revenue and audit exposure |
| 5 | `prior_authorization_utilization_management` | Healthcare | PA queues delay care and miss regulatory turnaround |
| 6 | `kyc_customer_onboarding_ai` | Financial services | Onboarding queues stall on document collection and screening |
| 7 | `predictive_maintenance_modernization` | Industrial | Mixed monitoring posture; pilots stall without unified telemetry spine |
| 8 | `build_buy_partner_evaluation` | Cross-industry | Build/buy/partner decisions made by sponsor preference, not evidence |

Each archetype carries: `key`, `name`, `sector`, `problemStatement`,
`businessOutcomes` (≥3), `currentStateInputsRequired` (≥3),
`patternsUsed` (≥1), `solutionComponents` (≥2),
`architectureBuildingBlocks` (≥3), `workshopsRequired` (≥2),
`smesRequired` (≥2), `buildBuyPartnerConsiderations` (≥2),
`governanceRiskConsiderations` (≥2), `deliverablesGenerated` (≥2),
`valueMetrics` (≥2), `agentRoles` (`nexus`, `sentinel`, `atlas`,
`steward` — one sentence each), and the
`createdFrom: 'deterministic_solution_archetype_registry'` marker.

## Helper functions

- `listSolutionArchetypes()` — returns the full canonical registry.
  Byte-equal across calls (test enforced via `JSON.stringify` equality
  on two calls).
- `getSolutionArchetype(key)` — returns the canonical record or `null`
  for unknown keys, including keys that belong to SOL2 (`'context_as_code_foundation'`).
- `recommendSolutionArchetypes({ sectors, capabilityKeywords })` —
  returns archetypes whose `sector` substring-matches any caller
  sector, OR whose `name` / `problemStatement` / `businessOutcomes`
  substring-match any caller capability keyword. Order is canonical
  regardless of input order. Empty input set returns `[]`. Unknown
  tokens are ignored without throwing.
- `summarizeSolutionArchetypes()` — `totalCount === 8`, plus the
  sorted-ascending lists of sectors, unique workshops, and unique
  architecture building blocks observed across the registry.

## What is deterministic today

- The registry is byte-equal across repeated calls (test enforced).
- `getSolutionArchetype` returns `null` for unknown keys and for SOL2
  component keys (test enforced).
- Recommendation is union-semantics on sectors OR capability keywords
  (test enforced).
- Recommendation order is canonical regardless of input order (test
  enforced).
- Recommendation ignores unknown sector and keyword tokens without
  throwing (test enforced).
- The `ai_led_pdlc_transformation` archetype references at least one
  canonical SOL2 `AiLedPdlcComponentKey` in its `solutionComponents`
  list (test enforced via runtime import of
  `AI_LED_PDLC_COMPONENT_KEYS_IN_ORDER`).
- Every archetype carries all four `agentRoles` populated with
  one-sentence statements (test enforced).
- No archetype invents a dollar amount in any string field — the
  full `JSON.stringify(SOLUTION_ARCHETYPES)` blob does not match the
  `\$\s*\d` pattern (test enforced).
- `createdFrom` is always `'deterministic_solution_archetype_registry'`
  (test enforced).

## What is NOT yet wired to runtime

- No UI: there is no archetype renderer inside Programs / Tower /
  Intelligence / Admin / Source yet — surface bindings are deferred.
- No recommender beyond rule-based: matching is pure substring
  overlap on sector / name / problem statement / business outcomes;
  there is no embedding match, no model invocation, no per-tenant
  scoring.
- No SOL3 ↔ ADM3 binding: archetypes are not yet bound to tenant
  dataset / domain inventory; the `currentStateInputsRequired` field
  remains a checklist, not a resolved citation chain.
- No persistence: every call rebuilds from the in-memory registry.
- No live composition: this module does not generate per-tenant or
  per-program architectures.

## What is deferred to SOL4+

- **SOL4 — Component-pack expansion** — additional component packs
  (analogous to SOL2) for analytics modernization, healthcare ambient,
  HCC risk adjustment, prior authorization, KYC, and predictive
  maintenance, so each archetype's `solutionComponents` field can
  reference canonical component keys as the AI-led PDLC archetype
  already does today.
- **SOL5 — Archetype-to-program recommendation surface** — wires the
  registry into Programs detail so the Maestro and Nexus can surface
  candidate archetypes from the program's intake brief and current
  state.
- **SOL6 — Atlas portfolio archetype coverage** — uses the registry
  to grade the portfolio's archetype mix and recommend rationalization
  across active engagements.
- **SOL7 — Per-tenant archetype adoption tracking** — tracks which
  archetypes a tenant has adopted, to what depth, and ties to the
  value ledger.
- **SOL8 — Archetype-to-workshop scheduling** — uses
  `workshopsRequired` to schedule the next workshop given the active
  archetype and tenant state.

## Honest fallbacks used

- All archetype content is hand-authored; no language implies live
  retrieval or runtime computation.
- Sector labels are descriptive (`Cross-industry`, `Healthcare`,
  `Financial services`, `Industrial`); no ISIC / NAICS code claim is
  made.
- `patternsUsed` holds descriptive labels rather than canonical I1
  Sentinel pattern keys (a deliberate choice documented in the
  module's header comment): SOL3 spans archetypes whose internal
  patterns are domain-specific and outside the I1 product-failure /
  governance pattern set. Future SOL4 component packs may bind their
  own pattern subsets.
- `solutionComponents` carries descriptive labels by default; the
  `ai_led_pdlc_transformation` archetype is the one case wired to
  canonical SOL2 component keys today (test enforced). Other
  archetypes will be wired as their component packs land.
- Recommendation is rule-based substring matching, not semantic
  similarity. The matcher is intentionally simple, deterministic, and
  inspectable.
- Module imports nothing from Sentinel / Atlas / Nexus / Agent
  runtime, Source UI, legacy `/programs`, `mock.ts`, auth, supabase,
  `next/*`, or `react` (test enforced).

## Validation

- `npx tsc --noEmit --pretty false` — pass
- `npx jest src/__tests__/integration/solutions/solution-archetype-registry.test.ts` — all
  tests pass (35 tests)
- `npm run build` — pass

## Status

Code complete. Pending founder review.
