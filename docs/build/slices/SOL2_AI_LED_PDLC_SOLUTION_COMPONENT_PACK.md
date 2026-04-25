# SOL2 · AI-led PDLC Solution Component Pack

Slice ID: SOL2
Slice name: AI-led PDLC Solution Component Pack
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-25
Author: Code (sole)

Formalizes the AbarVa POV on **what an AI-led product development
lifecycle is composed of** as a deterministic library of canonical
solution components. Programs, Atlas, Nexus, and Steward can recommend,
sequence, and govern these components without inventing them at
runtime. **Library only — does not generate live architectures, invoke
models, or read tenant state.**

## What changed

- New module
  [src/lib/solutions/ai-led-pdlc-components.ts](../../../src/lib/solutions/ai-led-pdlc-components.ts):
  - Public types: `AiLedPdlcComponentKey`,
    `AiLedPdlcSolutionComponent`, `AiLedPdlcComponentPackSummary`.
  - Public helpers:
    - `listAiLedPdlcSolutionComponents()` — full pack in canonical
      order.
    - `getAiLedPdlcSolutionComponent(key)` — single component or
      `null`.
    - `recommendPdlcComponentsFromInputs(input)` — pure pattern
      overlap on `failureModes` (PF1 keys) and `patternKeys` (I1
      keys); canonical-order results.
    - `summarizePdlcSolutionComponentPack()` — aggregate counts.
  - Re-export: `AI_LED_PDLC_COMPONENT_KEYS_IN_ORDER`.

- New tests
  [src/__tests__/integration/solutions/ai-led-pdlc-components.test.ts](../../../src/__tests__/integration/solutions/ai-led-pdlc-components.test.ts):
  Deterministic tests covering: 14 canonical components in canonical
  order; full required schema and minimum-cardinality per component;
  PF1 and I1 cross-reference validation (every `relatedFailureModes`
  entry is a canonical PF1 key, every `relatedPatterns` entry is a
  canonical I1 key); DORA metric coverage; null on unknown keys;
  recommendation by failure-mode and pattern overlap with canonical
  ordering; summary reconciliation; no-fabricated-dollars; module
  hygiene.

## Fourteen canonical components

| # | Key | Primary problem solved | Required workshops |
|---|---|---|---|
| 1 | `context_as_code_foundation` | Drift of AI suggestions from house conventions | current_state_discovery, data_foundation_assessment |
| 2 | `ai_assisted_requirements` | Vague stories causing late rework | use_case_framing, value_framing |
| 3 | `spec_to_code_workflow` | Inconsistent module shapes from AI scaffolds | architecture_solution_design, use_case_framing |
| 4 | `ai_code_review` | Reviewer fatigue from convention nits | architecture_solution_design, governance_risk_review |
| 5 | `ai_test_generation` | Uneven coverage and missed edge cases | architecture_solution_design |
| 6 | `secure_coding_guardrails` | Secrets and vulnerable deps at AI velocity | governance_risk_review, data_foundation_assessment |
| 7 | `architecture_decision_records` | Lost rationale and unchallenged tool decisions | architecture_solution_design, governance_risk_review, executive_decision_review |
| 8 | `developer_knowledge_graph` | Confident-wrong AI answers from fragmented context | data_foundation_assessment, operating_model_alignment |
| 9 | `dora_telemetry_layer` | Anecdotal velocity / quality claims | data_foundation_assessment, value_framing |
| 10 | `ai_adoption_measurement` | Tool sprawl with no evidence of value | adoption_change_readiness, operating_model_alignment |
| 11 | `human_in_loop_approval` | Reactive governance on regulated changes | governance_risk_review, executive_decision_review |
| 12 | `release_risk_intelligence` | On-call reactivity at higher deploy frequency | governance_risk_review, operating_model_alignment |
| 13 | `engineering_coach_agent` | Anecdotal coaching across larger spans | adoption_change_readiness, operating_model_alignment |
| 14 | `value_ledger_for_pdlc` | Indefensible value claims to executive sponsors | value_framing, executive_decision_review, operating_model_alignment |

Each component carries: `key`, `name`, `definition`, `problemSolved`,
`requiredCurrentStateInputs` (≥3), `requiredMetrics` (≥2; DORA where
applicable), `targetCapabilities` (≥2), `enablingTools` (≥2),
`governanceRequirements` (≥2), `implementationSteps` (≥3),
`expectedOutcomes` (≥2), `risks` (≥1), `relatedFailureModes` (≥1; PF1
subset), `relatedPatterns` (≥1; I1 subset), `requiredWorkshops` (≥1),
`deliverablesProduced` (≥1), and the
`createdFrom: 'deterministic_solution_component_pack'` marker.

## Helper functions

- `listAiLedPdlcSolutionComponents()` — returns the full canonical
  pack. Pure and byte-equal across calls.
- `getAiLedPdlcSolutionComponent(key)` — returns the canonical record
  or `null` for unknown / non-canonical keys.
- `recommendPdlcComponentsFromInputs({ failureModes, patternKeys, currentStateNotes })` —
  returns components whose `relatedFailureModes` overlap with
  `failureModes` OR whose `relatedPatterns` overlap with `patternKeys`.
  Order is canonical regardless of input order. `currentStateNotes` is
  reserved for forward compatibility and does not affect the result
  today.
- `summarizePdlcSolutionComponentPack()` — aggregate
  `byRequiredWorkshopCount` and the unique sets of related failure
  modes and patterns.

## Deterministic invariants

- The pack list is byte-equal across repeated calls (test enforced).
- `getAiLedPdlcSolutionComponent` returns `null` for unknown keys
  including keys that belong to PF1 or I1 (test enforced).
- Recommendation is union-semantics on failure-mode OR pattern overlap
  (test enforced).
- Recommendation order is canonical regardless of input order (test
  enforced).
- Recommendation ignores unknown failure-mode and pattern keys without
  throwing (test enforced).
- Every `relatedFailureModes` entry is a canonical PF1 key (test
  enforced via runtime import of
  `AI_PROGRAM_FAILURE_KEYS_IN_ORDER`).
- Every `relatedPatterns` entry is a canonical I1 Sentinel pattern key
  (test enforced).
- The DORA telemetry component names all four canonical DORA metrics
  in `requiredMetrics`; at least eight components reference at least
  one DORA metric (test enforced).
- No component invents a dollar amount in any string field (test
  enforced via `\$\s?\d` regex sweep).
- `createdFrom` is always `'deterministic_solution_component_pack'`
  (test enforced).

## What is NOT yet wired to runtime

- No live composition: this module does not generate architectures
  per tenant or per program. It is a library of canonical components.
- No LLM invocation: components are hand-authored; no Claude / OpenAI
  / Pinecone calls.
- No UI surfacing: no component renderer inside Programs / Tower /
  Intelligence / Admin yet — surface bindings are deferred.
- No persistence: every call rebuilds from the in-memory pack.

## What is deferred

- **SOL3 — Component-to-program recommendation surface** — wires the
  pack into Programs detail so the Maestro and Nexus can surface
  candidate components from the program's failure-mode / pattern mix.
- **SOL4 — Atlas portfolio rationalization** — uses the pack to grade
  the portfolio's coverage of canonical components and recommend
  rationalization moves.
- **SOL5 — Per-tenant component adoption tracking** — tracks which
  components a tenant has adopted, to what depth, and ties to the
  value ledger.
- **SOL6 — Component-to-workshop scheduling** — uses
  `requiredWorkshops` to schedule the next workshop given the active
  program / tenant state.

## Honest fallbacks used

- Component content is hand-authored; no language implies live
  retrieval or runtime computation.
- Enabling tools are named without endorsement and without a price
  claim; the same pack works for tenants that have substituted any
  named tool with an equivalent.
- `requiredCurrentStateInputs` is a checklist, not a resolved citation
  chain; no `E-###` or fake citation appears anywhere in the pack.
- Module imports nothing from Sentinel / Atlas / Nexus / Agent
  runtime, Source UI, legacy `/programs`, `mock.ts`, auth, or
  supabase (test enforced).

## Validation

- `npx tsc --noEmit --pretty false` — pass
- `npx jest src/__tests__/integration/solutions/ai-led-pdlc-components.test.ts`
  — all tests pass
- `npm run build` — pass

## Status

Code complete. Pending founder review.
