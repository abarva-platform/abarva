# SOL5 · Healthcare AI Solution Archetypes

Slice ID: SOL5
Slice name: Healthcare AI Solution Archetypes
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-25
Author: Code (sole)

Formalizes the AbarVa POV on **the canonical high-impact AI archetypes
a healthcare provider, payer, or integrated delivery network typically
pursues** as a deterministic library. Programs, Atlas, and the workshop
surfaces can subscribe to this pack to surface candidate archetypes
without inventing them at runtime. **Library only — does not generate
live architectures, invoke models, or read tenant state.**

## What changed

- New module
  [src/lib/solutions/healthcare-ai-archetypes.ts](../../../src/lib/solutions/healthcare-ai-archetypes.ts):
  - Public types: `HealthcareAiArchetypeKey`,
    `HealthcareAiArchetype`, `HealthcareAiArchetypeSummary`.
  - Public exports: `HEALTHCARE_AI_ARCHETYPE_KEYS` (frozen tuple in
    canonical order), `HEALTHCARE_AI_ARCHETYPES` (registry).
  - Public helpers:
    - `listHealthcareAiArchetypes()` — full pack in canonical order.
    - `getHealthcareAiArchetype(key)` — single archetype or `null`.
    - `recommendHealthcareAiArchetypes(input)` — pure substring
      overlap on `workflowKeywords` and `valueDriverKeywords`;
      canonical-order results.
    - `summarizeHealthcareAiArchetypes()` — aggregate counts and
      sorted unique sets.

- New tests
  [src/__tests__/integration/solutions/healthcare-ai-archetypes.test.ts](../../../src/__tests__/integration/solutions/healthcare-ai-archetypes.test.ts):
  37 deterministic tests covering: 8 canonical archetypes in canonical
  order; full required schema and minimum-cardinality per archetype;
  ambient downstream workflow coverage (coding / billing / quality);
  HCC downstream workflow coverage (RAF / submission / audit); prior
  authorization required substrings (`evidence packet`,
  `clinical policy`, `payer workflow`); vendor branding deny-list on
  `vendorStartupConsiderations`; null on unknown keys; recommendation
  by workflow / value-driver overlap with canonical ordering; summary
  reconciliation; no-fabricated-dollars; module hygiene.

## Eight canonical archetypes

| # | Key | Primary problem solved |
|---|---|---|
| 1 | `ambient_clinical_value_chain` | Documentation burden + downstream coding / billing / quality value left on the table |
| 2 | `hcc_risk_adjustment_coding_accuracy` | Under-capture of risk-adjusted disease burden + audit exposure |
| 3 | `prior_authorization_automation` | Care delay + administrative burden in the payer workflow |
| 4 | `clinical_documentation_improvement` | Severity / quality capture gaps that no human CDI team can review at scale |
| 5 | `care_management_next_best_action` | Calendar-driven outreach instead of risk-driven outreach |
| 6 | `patient_access_scheduling_optimization` | Access leakage and patient experience friction |
| 7 | `revenue_integrity_ai` | Charge capture, denial, and underpayment leakage missed by rule-based edits |
| 8 | `population_health_analytics` | Defensible value-based-care performance reporting and rising-risk identification |

Each archetype carries: `key`, `name`, `clinicalBusinessProblem`,
`workflowImpacted` (≥2; for ambient and HCC the workflow set includes
explicit downstream entries),
`currentStateInputsRequired` (≥3),
`dataSourcesRequired` (≥3 — EHR / claims / ADT / scheduling / payer
policy),
`architectureBuildingBlocks` (≥3),
`vendorStartupConsiderations` (≥2; phrased as **vendor categories**,
not as branded endorsements),
`buildBuyPartnerConsiderations` (≥2),
`governanceRiskConsiderations` (≥2),
`valueMetrics` (≥2),
`requiredWorkshops` (≥2),
`smesRequired` (≥2),
`deliverablesGenerated` (≥2),
`patternsUsed` (≥1; references I1 Sentinel pattern keys),
and the
`createdFrom: 'deterministic_healthcare_archetype_pack'` marker.

## Helper functions

- `listHealthcareAiArchetypes()` — returns the full canonical pack.
  Pure and byte-equal across calls.
- `getHealthcareAiArchetype(key)` — returns the canonical record or
  `null` for unknown / non-canonical keys.
- `recommendHealthcareAiArchetypes({ workflowKeywords, valueDriverKeywords })` —
  returns archetypes whose `workflowImpacted` join contains any of the
  supplied workflow keywords OR whose `valueMetrics` join contains any
  of the supplied value-driver keywords. Match is substring,
  case-insensitive. Order is canonical regardless of input order.
- `summarizeHealthcareAiArchetypes()` — aggregate `totalCount` and
  sorted-ascending unique sets of workflows, architecture blocks, and
  required workshops.

## What is deterministic

- The pack list is byte-equal across repeated calls (test enforced).
- `getHealthcareAiArchetype` returns `null` for unknown keys including
  pattern keys that belong to I1 (test enforced).
- Recommendation is union-semantics on workflow OR value-driver overlap
  (test enforced).
- Recommendation order is canonical regardless of input order (test
  enforced).
- Recommendation ignores unknown keywords without throwing (test
  enforced).
- Ambient downstream workflow coverage is enforced: the
  `ambient_clinical_value_chain.workflowImpacted` set contains at least
  two entries hitting `coding`, `billing`, or `quality`.
- HCC downstream workflow coverage is enforced: the
  `hcc_risk_adjustment_coding_accuracy.workflowImpacted` set contains
  entries naming `RAF`, `submission`, or `audit`.
- The `prior_authorization_automation` archetype contains the literal
  substrings `evidence packet`, `clinical policy`, and `payer workflow`
  somewhere across its fields (test enforced).
- `vendorStartupConsiderations` does not present a denied list of
  named brands (`Suki`, `Nuance DAX`, `Abridge`,
  `Epic-specific endorsement`) as endorsements (test enforced).
- No archetype invents a dollar amount in any string field (test
  enforced via `\$\s?\d` regex sweep).
- `createdFrom` is always `'deterministic_healthcare_archetype_pack'`
  (test enforced).

## What is NOT yet wired to runtime

- No live composition: this module does not generate architectures
  per tenant or per program. It is a library of canonical archetypes.
- No LLM invocation: archetypes are hand-authored; no Claude / OpenAI
  / Pinecone calls.
- No UI surfacing: no archetype renderer inside Programs / Tower /
  Intelligence / Admin yet — surface bindings are deferred.
- No persistence: every call rebuilds from the in-memory pack.
- No live data binding: `dataSourcesRequired` enumerates the
  categories of data sources expected, not concrete tenant feeds.
- No specific vendor evaluations: vendor considerations are phrased
  as vendor categories, not as branded ranked recommendations.

## What is deferred

- **SOL6 — Healthcare AI build / buy / partner framework** — will
  introduce a rigorous build-vs-buy-vs-partner evaluation framework
  and integrate vendor evaluation against tenant context (mature
  scoring, RFx readiness, contracting risk). The deny-list scan in
  this slice is a guardrail; SOL6 is the system of record for vendor
  intelligence.
- Tenant-specific archetype recommendations grounded in the tenant's
  current-state context (data foundation, workflow inventory,
  contract mix) are deferred to a later wiring slice.
- Per-archetype value-realization tracking against the value ledger
  is deferred.

## Honest fallbacks used

- Archetype content is hand-authored; no language implies live
  retrieval or runtime computation.
- Vendor / startup considerations are written as **vendor categories**
  ("ambient documentation specialists", "clinical NLP platforms",
  "payer connectivity vendors") rather than as branded endorsements.
  EHR products may be cited as data-source examples (e.g.
  `Epic, Cerner, Meditech, athenahealth` inside
  `dataSourcesRequired`) because the EHR is a factual data source, not
  a recommended vendor for the archetype's solution layer.
- `currentStateInputsRequired` is a discovery checklist, not a
  resolved citation chain; no `E-###` or fake citation appears
  anywhere in the pack.
- `patternsUsed` references I1 Sentinel pattern keys
  (`value_ledger_incompleteness`, `evidence_chain_gap`,
  `gate_governance_gap`, `program_context_sparsity`) without
  importing from `src/lib/sentinel/**`; the relationship is by
  identifier, not by runtime call.
- Module imports nothing from Sentinel / Atlas / Nexus / Agent
  runtime, Source UI, legacy `/programs`, `mock.ts`, auth, or
  supabase (test enforced); the module imports nothing from `next/*`
  or `react` (test enforced).

## Validation

- `npx tsc --noEmit --pretty false` — pass
- `npx jest src/__tests__/integration/solutions/healthcare-ai-archetypes.test.ts`
  — 37 tests pass
- `npm run build` — pass

## Status

Code complete. Pending founder review.
