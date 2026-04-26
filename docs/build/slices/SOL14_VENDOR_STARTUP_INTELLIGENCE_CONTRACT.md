# SOL14 · Vendor / Startup Intelligence Contract

Slice ID: SOL14
Slice name: Vendor / Startup Intelligence Contract
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-26
Author: Code (sole)

Formalizes the AbarVa point of view on **how a tenant should classify,
assess, and govern vendor and startup candidates across the canonical
AI / data fabric / agent platform landscape** as a deterministic
library. Programs, Atlas, Nexus, and Steward surfaces can score,
summarize, and reject vendor candidates without re-inventing the
categories, the readiness model, or the evidence basis at runtime.
**Library only — does not generate live vendor briefs, invoke models,
read tenant state, fetch external data, or call any external API.**

**No real vendor names** are used. All seed entries reference
category-shaped placeholder ids (e.g. `vendor_cdp_001`,
`vendor_ams_002`) so downstream surfaces never accidentally inherit a
branded recommendation from the seed.

## What changed

- New module
  [src/lib/solutions/vendor-startup-intelligence.ts](../../../src/lib/solutions/vendor-startup-intelligence.ts):
  - Public types: `VendorIntelligenceCategory`,
    `VendorAssessmentReadiness`, `VendorEvidenceBasis`,
    `VendorAssessment`, `VendorIntelligenceCategoryMetadata`,
    `VendorIntelligenceSummary`, `VendorIntelligenceSeed`.
  - Public helpers:
    - `listVendorCategories()` — full canonical 9-category pack in
      canonical order.
    - `buildVendorAssessmentSeed()` — deterministic seed of vendor
      assessments tagged
      `createdFrom: 'deterministic_vendor_startup_intelligence_seed'`.
    - `summarizeVendorAssessments(assessments)` — deterministic
      summary covering totals, by-category counts, by-readiness
      counts, not-recommended count, unknown-readiness flag, and
      pilot-or-production-ready count.
    - `getNotRecommendedVendors(assessments)` — filter helper that
      returns the not-recommended subset.
  - Re-exports: `VENDOR_INTELLIGENCE_CATEGORIES`,
    `VENDOR_ASSESSMENT_READINESS_VALUES`,
    `VENDOR_EVIDENCE_BASIS_VALUES`.

- New tests
  [src/__tests__/integration/solutions/vendor-startup-intelligence.test.ts](../../../src/__tests__/integration/solutions/vendor-startup-intelligence.test.ts):
  Deterministic tests covering: 9 canonical categories in canonical
  order; 5 canonical readiness states all represented in the seed;
  no real vendor names anywhere in the seed, the categories, or the
  source file (whole-word case-insensitive denylist scan); placeholder
  ids follow the `vendor_<category>_<NNN>` shape; deterministic
  byte-equal output across calls; summary totals reconcile against the
  seed; not-recommended assessments carry a non-null reason; module
  hygiene including no `fetch(` / `axios` / `http` / `https` /
  `node-fetch` imports; no `Date.now` / `Math.random` / `new Date`; no
  banned vendor names; no `useState` / `useEffect`; no Coming soon /
  TBD / Lorem ipsum placeholders.

## Nine canonical categories

| # | Key | Name | Primary lens |
|---|---|---|---|
| 1 | `cdp` | Customer data platforms | Identity resolution, profile assembly, consent, audience activation |
| 2 | `cx_ai` | Customer experience AI | Conversational, recommendation, journey orchestration |
| 3 | `ams` | Agentic management systems | Composition, handoff, observability, governance for multi-agent work |
| 4 | `data_fabric` | Data and knowledge fabric | Storage, retrieval, semantic, graph layers for AI / analytic workloads |
| 5 | `agent_platform` | Agent runtime platforms | Hosting, scheduling, isolation of agent workloads with policy controls |
| 6 | `observability` | AI and agent observability | Telemetry, tracing, evaluation, regression alerting |
| 7 | `security` | AI security and trust | Prompt injection defense, output redaction, isolation guardrails |
| 8 | `evaluation` | Evaluation and benchmarks | Eval harnesses, golden-set management, benchmark gating |
| 9 | `other` | Other AI-adjacent capabilities | Specialty modality / vertical / glue capabilities outside the eight |

Every category carries `key`, `name`, `description`, and at least one
`exampleCapabilities` entry so reviewer surfaces can describe the
category without re-deriving the wording per evaluation.

## Five canonical readiness states

| State | Meaning |
|---|---|
| `unknown` | Capability fit is asserted; readiness cannot be judged from current evidence |
| `preliminary` | Capability fit is documented; gaps remain before pilot scope can be approved |
| `pilot_ready` | Capability fit and enterprise posture support a scoped pilot with documented gates |
| `production_ready` | Capability fit, governance, and enterprise posture support tenant production use |
| `not_recommended` | Capability fit fails or governance / evidence posture disqualifies the candidate |

`not_recommended` rows carry a non-null `notRecommendedReason` string;
all other rows carry `null`.

## Evidence basis enum

| Value | Meaning |
|---|---|
| `public_documentation` | Public material from the candidate (docs, white papers, public posts) |
| `tenant_observed_signal` | Signal collected from tenant interaction or tenant-side telemetry |
| `reference_call` | Structured reference call with a peer customer at comparable maturity |
| `security_questionnaire` | Completed security questionnaire or attested control mapping |
| `hands_on_evaluation` | Tenant-runnable evaluation against tenant data and shapes |
| `no_evidence` | No documented evidence basis exists yet |

## Deterministic seed

`buildVendorAssessmentSeed()` returns a frozen seed of vendor
assessments. Every entry uses a category-shaped placeholder id
(`vendor_cdp_001`, `vendor_ams_002`, etc.). The seed covers all 9
categories and all 5 readiness states. The seed is tagged
`createdFrom: 'deterministic_vendor_startup_intelligence_seed'`.

## Helper functions

- `listVendorCategories()` — full canonical 9-category pack. Pure and
  byte-equal across calls.
- `buildVendorAssessmentSeed()` — deterministic vendor assessment
  seed. Pure and byte-equal across calls.
- `summarizeVendorAssessments(assessments)` — deterministic summary
  covering totals, per-category counts, per-readiness counts, the
  not-recommended count, an `hasUnknownReadiness` flag, and the
  pilot-or-production-ready count.
- `getNotRecommendedVendors(assessments)` — filter helper that
  returns the not-recommended subset. Pure.

## Deterministic invariants

- `listVendorCategories` is byte-equal across repeated calls (test
  enforced).
- `buildVendorAssessmentSeed` is byte-equal across repeated calls
  (test enforced).
- `summarizeVendorAssessments` is byte-equal across repeated calls
  for the same input (test enforced).
- Summary totals reconcile against the seed length (test enforced).
- Every readiness state appears in the seed at least once (test
  enforced).
- Every category appears in the seed at least once via category-key
  validation (test enforced).
- `not_recommended` assessments carry a non-null reason; others carry
  `null` (test enforced).
- Placeholder ids follow `vendor_<category>_<NNN>` (test enforced).
- No string field invents a dollar amount (test enforced).

## Module hygiene

The library does not import from Sentinel, Atlas, Nexus, Agent
runtime, Source UI, legacy `/programs`, `mock.ts`, auth, or supabase.
It does not call `Date.now`, `Math.random`, or `new Date`, does not
call `fetch`, does not import `axios`, `node-fetch`, `http`, or
`https`, does not invoke Claude / OpenAI / Pinecone runtime, and does
not use `useState` or `useEffect`. The source file does not endorse
any named AI vendor as a branded recommendation; a literal whole-word
substring scan over the source asserts the deny-list never appears.

## Future composition

Programs, Atlas, Nexus, and Steward surfaces will compose this
contract with SOL6's build / buy / partner evaluator and SOL9's
recommendation engine to produce a single defensible vendor / startup
brief per capability request. SOL14 stays a pure library so the
composition is auditable and re-runnable without live model calls or
external fetching.

## Validation commands

```
npx tsc --noEmit --pretty false
npx eslint --max-warnings=0 src/lib/solutions/vendor-startup-intelligence.ts src/__tests__/integration/solutions/vendor-startup-intelligence.test.ts
npx jest src/__tests__/integration/solutions/vendor-startup-intelligence.test.ts
npm run build
python3 -c "import json; json.load(open('docs/build/build-slices.json'))"
```

## Acceptance criteria

- Pack contains exactly the 9 canonical vendor categories in
  canonical order.
- Seed exposes all 5 canonical readiness states at least once.
- Every assessment carries a category from the canonical 9 and an
  evidence basis from the canonical list.
- Vendor placeholder ids follow `vendor_<category>_<NNN>`; ids are
  unique across the seed.
- `not_recommended` assessments carry a non-null reason; others carry
  `null`.
- Seed is tagged
  `createdFrom: 'deterministic_vendor_startup_intelligence_seed'`.
- `summarizeVendorAssessments` totals reconcile against the seed
  length and against `getNotRecommendedVendors`.
- Output is deterministic and byte-equal across repeated calls for
  the same input.
- No string field invents a dollar amount.
- No real vendor names appear in the seed, the categories, or the
  source file (whole-word case-insensitive denylist scan).
- Module imports nothing from Sentinel / Atlas / Nexus / Agent
  runtime, Source UI, legacy `/programs`, `mock.ts`, auth, or
  supabase; no `fetch(` / `axios` / `node-fetch` / `http` / `https`
  imports; no `Date.now` / `Math.random` / `new Date`; no `useState`
  / `useEffect`; no Coming soon / TBD / Lorem ipsum.
