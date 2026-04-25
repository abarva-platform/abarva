# SOL6 · Build / Buy / Partner Decision Framework

Slice ID: SOL6
Slice name: Build / Buy / Partner Decision Framework
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-25
Author: Code (sole)

Formalizes the AbarVa POV on **how to grade a capability scenario as
build, buy, or partner** as a deterministic, rule-based library. The
Maestro, Atlas, and Nexus can subscribe to this framework to surface a
defensible recommended option, rationale, trade-offs, governance
warnings, vendor / startup assessment factors, and enterprise readiness
risks for any capability under review. **Library only — does not
generate live decisions, invoke models, or read tenant state.**

## What changed

- New module
  [src/lib/solutions/build-buy-partner-framework.ts](../../../src/lib/solutions/build-buy-partner-framework.ts):
  - Public types: `BuildBuyPartnerOption`, `BuildBuyPartnerCriterion`,
    `BuildBuyPartnerCriterionDescriptor`, `BuildBuyPartnerScenarioInput`,
    `VendorStartupAssessmentFactor`, `EnterpriseReadinessRisk`,
    `BuildBuyPartnerRecommendation`.
  - Public helpers:
    - `listBuildBuyPartnerCriteria()` — twelve canonical criteria in
      canonical order.
    - `evaluateBuildBuyPartnerScenario(input)` — deterministic
      rule-based recommender returning option, confidence, rationale,
      trade-offs, governance warnings, vendor / startup assessment
      factors, and enterprise readiness risks.
    - `summarizeBuildBuyPartnerRecommendation(result)` — one-line
      headline plus leading rationale and warnings count.
  - Re-exports: `BUILD_BUY_PARTNER_CRITERIA`,
    `BUILD_BUY_PARTNER_CRITERION_DESCRIPTORS`.

- New tests
  [src/__tests__/integration/solutions/build-buy-partner-framework.test.ts](../../../src/__tests__/integration/solutions/build-buy-partner-framework.test.ts):
  Deterministic tests covering: 12 canonical criteria in canonical
  order with non-empty descriptors; deterministic evaluator output
  across repeated calls; build / buy / partner rule firing; fallback
  to partner with low confidence when no rule fires; governance
  warnings on regulated context and critical risk tags;
  vendor / startup assessment factors empty for build, non-empty for
  buy / partner; enterprise readiness risks always non-empty;
  no fabricated dollar amounts; no branded vendor names presented as
  endorsements; module hygiene.

## Twelve canonical criteria

| # | Key | Description |
|---|---|---|
| 1 | `time_to_value` | Elapsed time from kickoff to a defensible first realized outcome on the value ledger. |
| 2 | `strategic_differentiation` | Whether the capability is a competitive moat or a commodity workflow. |
| 3 | `data_rights_ip` | Who holds rights to data, models, prompts, and derived insights. |
| 4 | `integration_complexity` | Effort to connect the capability to existing systems of record without fragility. |
| 5 | `regulatory_risk` | Exposure to regulators, data-protection regimes, and audit obligations. |
| 6 | `enterprise_readiness` | Whether organization-grade controls (identity, audit, change) are met. |
| 7 | `total_cost_of_ownership` | Total capital, run, support, change, and exit cost across the planning horizon. |
| 8 | `vendor_lock_in` | Risk of single-vendor dependence on pricing, roadmap, and platform direction. |
| 9 | `model_governance` | Controls over training, evaluation, drift, and responsible-AI sign-off. |
| 10 | `talent_capacity` | Internal product, engineering, data, and responsible-AI capacity to staff the path. |
| 11 | `workflow_fit` | Alignment between capability and organization-specific workflows. |
| 12 | `scalability` | Ability to scale across the portfolio without proportional rework. |

Each descriptor carries `key`, `name`, `description`, `buildSignal`,
`buySignal`, and `partnerSignal` — the last three are short prose
statements of when each option is favored on that dimension.

## Decision rules

The evaluator is a pure rule-based function. Rules fire in order, and
the first firing rule wins:

- **Build** — fires when `differentiationLevel === 'high'` AND
  `internalCapabilityMaturity !== 'absent'`. Confidence is `'high'` for
  established maturity, `'medium'` when borderline (emerging maturity).
- **Buy** — fires when `timeToValueUrgency === 'high'` AND
  `marketCapabilityMaturity === 'mature'` AND differentiation is
  `'low'` or `'medium'`. Confidence is `'high'` unless internal
  capability is already established (then `'medium'`).
- **Partner** — fires when `timeToValueUrgency === 'high'` AND
  `marketCapabilityMaturity === 'fragmented'` AND differentiation is
  `'medium'` or `'high'`. Confidence is `'high'` unless internal
  capability is absent (then `'medium'`).
- **Fallback** — when no rule fires, the recommendation is `partner`
  with `'low'` confidence so the sponsor and responsible-AI practice
  route the scenario into a follow-on workshop.

## Governance, vendor diligence, and readiness

- `governanceWarnings` is non-empty when `regulatedContext === true`
  OR `criticalRiskTags` is non-empty. Both conditions surface as
  separate warnings when both fire.
- `vendorStartupAssessmentFactors` is empty for `build`
  recommendations and populated with at least seven factors for `buy`
  or `partner` recommendations: funding stage and runway, customer
  references at comparable scale, data security posture, model
  provenance and training-data posture, support service-level
  agreements, roadmap alignment, and integration / partner ecosystem.
- `enterpriseReadinessRisks` is always non-empty (six canonical risks):
  PHI compliance gap, model drift governance gap, vendor concentration
  risk, change management capacity gap, observability gap, and
  identity / audit gap.

## Helper functions

- `listBuildBuyPartnerCriteria()` — returns the twelve canonical
  descriptors in canonical order. Pure and byte-equal across calls.
- `evaluateBuildBuyPartnerScenario(input)` — returns the deterministic
  recommendation. Pure: same input → deeply equal output.
- `summarizeBuildBuyPartnerRecommendation(result)` — returns
  `{ headline, topRationale, warningsCount }` for surfacing in
  cards / briefs.

## Deterministic invariants

- `BUILD_BUY_PARTNER_CRITERIA` contains exactly twelve keys in
  canonical order (test enforced).
- Each criterion descriptor exposes non-empty `name`, `description`,
  `buildSignal`, `buySignal`, and `partnerSignal` (test enforced).
- `evaluateBuildBuyPartnerScenario` is byte-equal across repeated
  calls with the same input (test enforced).
- Build, buy, and partner rules each fire under the documented
  conditions (test enforced).
- Fallback returns `partner` with `'low'` confidence when no rule
  fires (test enforced).
- `governanceWarnings` is non-empty when regulated context is set or
  critical risk tags are supplied; both surface as distinct warnings
  when both apply (test enforced).
- `vendorStartupAssessmentFactors` is empty for `build` and non-empty
  for `buy` / `partner` (test enforced).
- `enterpriseReadinessRisks` is non-empty for every recommendation
  regardless of option (test enforced).
- Rationale and trade-offs each carry at least two entries on every
  recommendation (test enforced).
- No recommendation invents a dollar amount in any string field
  (test enforced via `\$\s?\d` regex sweep).
- The source contains no branded vendor names presented as
  endorsements (deny-list scan — Snowflake, Databricks, Epic,
  Microsoft Azure all absent; test enforced).
- `createdFrom` is always
  `'deterministic_build_buy_partner_framework'` (test enforced).

## What is NOT yet wired to runtime

- No live decision: this module does not pull tenant scenarios,
  vendor catalogs, or live market data. It is a deterministic
  framework over the supplied input.
- No LLM invocation: the framework is hand-authored; no Claude /
  OpenAI / Pinecone calls.
- No UI surfacing: no Build/Buy/Partner card inside Programs / Tower /
  Intelligence / Admin yet — surface bindings are deferred.
- No persistence: every call rebuilds the recommendation from the
  in-memory framework.

## What is deferred

- **Programs detail surface for the framework** — wires the
  evaluator into Programs detail so the Maestro can grade in-flight
  capability scenarios against the framework and surface the
  recommended option, governance warnings, and assessment factors.
- **Atlas portfolio rationalization view** — uses the framework to
  grade the portfolio's build / buy / partner mix and recommend
  rationalization moves where governance warnings or readiness risks
  pile up.
- **Vendor diligence runbook** — promotes the vendor / startup
  assessment factors into a per-engagement diligence checklist with
  named owners and revisit triggers.

## Honest fallbacks used

- Recommendation content is hand-authored; no language implies live
  retrieval or runtime computation.
- Vendor / startup assessment factors are named generically (funding
  stage, customer references, data security posture, model provenance,
  support SLA, roadmap alignment, integration / partner ecosystem)
  without endorsing any branded vendor.
- Enterprise readiness risks are named generically (PHI compliance
  gap, model drift, vendor concentration, change management,
  observability, identity / audit) without invoking sector or vendor
  specifics that the framework cannot defend.
- Module imports nothing from Sentinel / Atlas / Nexus / Agent
  runtime, Source UI, legacy `/programs`, `mock.ts`, auth, or
  supabase (test enforced).

## Validation

- `npx tsc --noEmit --pretty false` — pass
- `npx jest src/__tests__/integration/solutions/build-buy-partner-framework.test.ts`
  — all tests pass
- `npm run build` — pass

## Status

Code complete. Pending founder review.
