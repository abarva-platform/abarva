# SOL5 · Healthcare AI Archetypes

Slice ID: SOL5
Slice name: Healthcare AI Archetypes
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-25
Author: Code (sole)

Formalizes the AbarVa POV on **what AI work in payer and provider
healthcare looks like** as a deterministic library of canonical
archetypes. Programs, Atlas, Nexus, and Steward can recommend, scope,
and govern healthcare AI engagements without inventing archetypes at
runtime. **Library only — does not generate live architectures, invoke
models, read tenant state, or endorse a named vendor.**

This slice is a peer to SOL2 (the AI-led PDLC solution component pack),
focused specifically on the healthcare vertical. SOL2 names *how* an
AI-led delivery shop runs; SOL5 names *what* AI work in healthcare is
shaped like — the recurring archetypes that show up across discovery,
design, and value-conversation engagements with payers and providers.

## What changed

- New module
  [src/lib/solutions/healthcare-ai-archetypes.ts](../../../src/lib/solutions/healthcare-ai-archetypes.ts):
  - Public types: `HealthcareAiArchetypeKey`, `HealthcareAiArchetype`,
    `HealthcareAiArchetypePackSummary`.
  - Public helpers:
    - `listHealthcareAiArchetypes()` — full pack in canonical order.
    - `getHealthcareAiArchetype(key)` — single archetype or `null`.
    - `recommendHealthcareAiArchetypes(input)` — pure substring
      overlap on `workflowKeywords` and `valueDriverKeywords`;
      canonical-order results.
    - `summarizeHealthcareAiArchetypes()` — aggregate unique
      workflows, architecture blocks, workshops, and data sources.
  - Re-exports: `HEALTHCARE_AI_ARCHETYPE_KEYS` (frozen),
    `HEALTHCARE_AI_ARCHETYPES`.

- New tests
  [src/__tests__/integration/solutions/healthcare-ai-archetypes.test.ts](../../../src/__tests__/integration/solutions/healthcare-ai-archetypes.test.ts):
  Deterministic tests covering 12 canonical archetypes in canonical
  order, full required schema and minimum-cardinality per archetype,
  specific-content checks for ambient downstream coverage, HCC
  RAF / submission / audit coverage, prior authorization evidence
  packet / clinical policy / payer workflow coverage, distinctness of
  revenue integrity vs denial prevention, vendor deny-list, lookup
  null-on-unknown, recommendation by keyword overlap, summary
  reconciliation, no-fabricated-dollars, and module hygiene.

## Twelve canonical archetypes

| # | Key | Clinical / business problem |
|---|---|---|
| 1 | `ambient_clinical_value_chain` | Clinician documentation burden that drags coding, billing, and quality |
| 2 | `hcc_risk_adjustment_coding_accuracy` | Under- and over-capture of HCCs that distorts RAF and exposes audit risk |
| 3 | `prior_authorization_automation` | High-friction PA that delays care and produces avoidable denials |
| 4 | `clinical_documentation_improvement` | Inpatient documentation gaps driving downstream coding inaccuracy |
| 5 | `care_management_next_best_action` | Care manager panels too large for manual triage |
| 6 | `patient_access_scheduling_optimization` | Hard-to-access scheduling and high no-show rate |
| 7 | `revenue_integrity_ai` | Charge capture leakage and undercoding before submission |
| 8 | `population_health_analytics` | Lagging, indefensible measurement of attributed populations |
| 9 | `clinical_contact_center_ai` | High-volume scheduling, billing, and triage at low first-call resolution |
| 10 | `provider_network_intelligence` | Stale directory data and reactive credentialing |
| 11 | `denial_prevention_ai` | Reactive, per-claim denial work that lets root causes recur |
| 12 | `patient_experience_personalization` | Generic outreach that ignores language, channel, and condition mix |

Each archetype carries: `key`, `name`, `clinicalBusinessProblem`,
`workflowImpacted` (≥2), `currentStateInputsRequired` (≥3),
`dataSourcesRequired` (≥3), `architectureBuildingBlocks` (≥3),
`vendorStartupConsiderations` (≥2 — categories, not branded
endorsements), `buildBuyPartnerConsiderations` (≥2),
`governanceRiskConsiderations` (≥2), `valueMetrics` (≥2),
`requiredWorkshops` (≥2), `smesRequired` (≥2),
`deliverablesGenerated` (≥2), `patternsUsed` (≥1),
`failureModesAddressed` (≥1), `likelySystemsImpacted` (≥2 — e.g. EHR,
billing, payer system), and the
`createdFrom: 'deterministic_healthcare_archetype_pack'` marker.

## Helper functions

- `listHealthcareAiArchetypes()` — returns the full canonical pack in
  canonical order. Pure and byte-equal across calls.
- `getHealthcareAiArchetype(key)` — returns the canonical record or
  `null` for unknown / non-canonical keys.
- `recommendHealthcareAiArchetypes({ workflowKeywords, valueDriverKeywords })` —
  returns archetypes whose `workflowImpacted` contains any
  case-insensitive workflow keyword OR whose `valueMetrics` contains
  any case-insensitive value-driver keyword. Order is canonical
  regardless of input order. Empty / unknown keywords are ignored
  without throwing.
- `summarizeHealthcareAiArchetypes()` — aggregate
  `uniqueWorkflows`, `uniqueArchitectureBlocks`, `uniqueWorkshops`,
  and `uniqueDataSources`, each sorted ascending and de-duplicated;
  `totalCount` equals 12.

## Deterministic invariants

- The pack list is byte-equal across repeated calls (test enforced).
- `getHealthcareAiArchetype` returns `null` for unknown keys including
  PF1 / I1 keys (test enforced).
- Recommendation is union-semantics on workflow OR value-driver
  keyword overlap (test enforced).
- Recommendation order is canonical regardless of input order (test
  enforced).
- Recommendation ignores unknown / empty keywords without throwing
  (test enforced).
- The `ambient_clinical_value_chain` archetype names downstream
  coding, billing, and quality workflow entries explicitly (test
  enforced).
- The `hcc_risk_adjustment_coding_accuracy` archetype names RAF,
  submission, and audit workflow entries explicitly (test enforced).
- The `prior_authorization_automation` archetype mentions evidence
  packet, clinical policy, and payer workflow across its fields (test
  enforced via joined-string substring match).
- `revenue_integrity_ai` and `denial_prevention_ai` carry distinct
  problem statements and value-metric sets (test enforced).
- No archetype's `vendorStartupConsiderations` (or any other field)
  contains a branded endorsement from the deny-list `["Suki",
  "Nuance DAX", "Abridge", "Epic-specific endorsement"]` (test
  enforced via literal substring match).
- No archetype invents a dollar amount in any string field (test
  enforced via `\$\s?\d` regex sweep).
- `createdFrom` is always `'deterministic_healthcare_archetype_pack'`
  (test enforced).

## Vendor neutrality stance

`vendorStartupConsiderations` deliberately uses **category labels**
("ambient documentation specialists", "clinical natural language
processing platforms", "risk-adjustment coding platforms",
"prior authorization automation specialists", etc.) rather than
naming a specific company. Reasons:

- The pack ships across tenants whose vendor short-list differs.
- An endorsement embedded in a deterministic library is a permanent
  liability if the named vendor regresses or is acquired.
- Discovery and design conversations should land on a category fit
  first; the named-vendor short-list is a tenant-level decision
  captured downstream in Atlas / Programs.

The test deny-list (`Suki`, `Nuance DAX`, `Abridge`,
`Epic-specific endorsement`) makes this stance enforceable rather than
a stylistic suggestion.

## What is NOT yet wired to runtime

- No live composition: this module does not generate per-tenant
  healthcare architectures, score per-tenant readiness, or rank the
  archetype short-list against a live program.
- No LLM invocation: archetypes are hand-authored; no Claude / OpenAI
  / Pinecone calls.
- No UI surfacing: no archetype renderer inside Programs / Tower /
  Intelligence / Admin yet — surface bindings are deferred.
- No persistence: every call rebuilds from the in-memory pack.

## What is deferred

- **Per-tenant archetype short-list surface** — wires the pack into
  Programs detail so the Maestro and Nexus can surface candidate
  archetypes from the tenant's stated workflow / value-driver mix.
- **Atlas portfolio fit grading** — uses the pack to grade the
  portfolio's healthcare archetype coverage and recommend
  rationalization moves.
- **Workshop scheduler binding** — uses `requiredWorkshops` to
  schedule the next workshop given the active program / tenant state.

## Honest fallbacks used

- Archetype content is hand-authored; no language implies live
  retrieval or runtime computation.
- `vendorStartupConsiderations` are categories, not branded
  endorsements (test enforced via deny-list).
- `currentStateInputsRequired` is a checklist, not a resolved citation
  chain; no `E-###` or fake citation appears anywhere in the pack.
- Module imports nothing from Sentinel / Atlas / Nexus / Agent
  runtime, Source UI, legacy `/programs`, `mock.ts`, auth, or
  supabase (test enforced).

## Validation

- `npx tsc --noEmit --pretty false` — pass
- `npx jest src/__tests__/integration/solutions/healthcare-ai-archetypes.test.ts`
  — all tests pass
- `npm run build` — pass

## Status

Code complete. Pending founder review.
