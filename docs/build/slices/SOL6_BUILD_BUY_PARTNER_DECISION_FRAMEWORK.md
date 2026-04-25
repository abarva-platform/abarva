# SOL6 · Build / Buy / Partner Decision Framework

Slice ID: SOL6
Slice name: Build / Buy / Partner Decision Framework
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-25
Author: Code (sole)

Formalizes the AbarVa point of view on **how a tenant should reason
about building, buying, or partnering for a capability** as a
deterministic library. Programs, Atlas, Nexus, and Steward surfaces can
recommend, justify, and govern a build / buy / partner decision without
re-inventing the criteria, the vendor / startup assessment factors, or
the enterprise-readiness risks at runtime. **Library only — does not
generate live architectures, invoke models, read tenant state, or call
any external API.**

## What changed

- New module
  [src/lib/solutions/build-buy-partner-framework.ts](../../../src/lib/solutions/build-buy-partner-framework.ts):
  - Public types: `BuildBuyPartnerOption`,
    `BuildBuyPartnerCriterion`, `BuildBuyPartnerCriterionMetadata`,
    `VendorStartupAssessmentFactor`, `EnterpriseReadinessRisk`,
    `BuildBuyPartnerScenarioInput`, `BuildBuyPartnerSignal`,
    `BuildBuyPartnerRecommendation`,
    `BuildBuyPartnerEvaluationResult`.
  - Public helpers:
    - `listBuildBuyPartnerCriteria()` — full canonical 14-criteria
      pack in canonical order.
    - `listVendorStartupAssessmentFactors()` — vendor / startup
      assessment factors covering capability, commercial,
      governance, integration, and enterprise-readiness categories.
    - `listEnterpriseReadinessRisks()` — enterprise-readiness risk
      pack with mitigations and severity.
    - `evaluateBuildBuyPartnerScenario(input)` — deterministic
      rule-based evaluator.
    - `summarizeBuildBuyPartnerRecommendation(result)` — short
      summary string.
  - Re-export: `BUILD_BUY_PARTNER_CRITERIA`.

- New tests
  [src/__tests__/integration/solutions/build-buy-partner-framework.test.ts](../../../src/__tests__/integration/solutions/build-buy-partner-framework.test.ts):
  Deterministic tests covering: 14 canonical criteria in canonical
  order; ≥8 vendor / startup factors covering all five categories;
  ≥5 enterprise-readiness risks; deterministic byte-equal
  recommendations across calls; build / buy / partner rule
  coverage; governance warnings present when regulated context or
  high-risk tags are present; vendor / startup checks populated when
  option is not build; confidence and option enums verified;
  no-fabricated-dollars; module hygiene; no banned-vendor literal
  substring scan over the source file.

## Fourteen canonical decision criteria

| # | Key | Weight | Primary lever |
|---|---|---|---|
| 1 | `time_to_value` | high | How fast a usable, governed capability must reach production |
| 2 | `strategic_differentiation` | high | Whether the capability defines moat or is table-stakes parity |
| 3 | `data_rights_ip` | high | Who owns the data, derived signals, and downstream artifacts |
| 4 | `integration_complexity` | medium | Internal systems, identities, and event paths to reconcile |
| 5 | `regulatory_risk` | high | Privacy, financial reporting, health, safety, cross-border exposure |
| 6 | `enterprise_readiness` | high | SSO, RBAC, audit, observability, support, incident response |
| 7 | `total_cost_of_ownership` | medium | Lifetime cost across licensing, ops, governance, talent |
| 8 | `vendor_lock_in` | medium | Cost to migrate away if the chosen path becomes unavailable |
| 9 | `model_governance` | high | Model selection, prompts, retrieval, output gating discipline |
| 10 | `talent_capacity` | medium | Whether internal capacity exists to deliver and operate |
| 11 | `workflow_fit` | medium | How specialized the workflow is versus a generic pattern |
| 12 | `scalability` | medium | Scale envelope, peak events, geography expansion posture |
| 13 | `ecosystem_maturity` | medium | Maturity, fragmentation, standards alignment of the market |
| 14 | `change_management_burden` | low | Organizational change, role redesign, adoption work implicit |

Each criterion carries `key`, `name`, `description`, `buildSignal`,
`buySignal`, `partnerSignal`, and `weight`. The signals are narrative
justifications used by Programs and Atlas surfaces to explain why a
given criterion favors one option for the supplied scenario.

## Vendor / startup assessment factors

The factor pack covers all five canonical categories:

| Category | Factors |
|---|---|
| `capability` | capability depth and roadmap, evaluation and benchmark evidence |
| `commercial` | commercial durability, contract terms and exit rights |
| `governance` | governance and audit posture, data handling and residency |
| `integration` | integration surface and APIs |
| `enterprise_readiness` | enterprise support and operations, change partnership and references |

Each factor publishes a non-empty list of red-flag and green-flag
signals so reviewers can score a candidate offering without
re-deriving the questions per evaluation.

## Enterprise readiness risk pack

The risk pack names canonical enterprise readiness risks with
mitigations and severity. Categories covered include identity and
access, data residency and retention, audit logging and observability,
model governance gap, support and escalation, roadmap and continuity,
and change and adoption burden. Each risk publishes at least one
mitigation that procurement, security, and the program team can apply
before pilot scope is approved.

## Deterministic evaluator

`evaluateBuildBuyPartnerScenario(input)` is a pure function over the
typed `BuildBuyPartnerScenarioInput`. It produces a
`BuildBuyPartnerEvaluationResult` whose JSON is byte-equal across
repeated calls for the same input.

Top-level decision rules (evaluated in order):

1. **build** when `differentiation === 'high'` AND
   `internalCapabilityPresent === true`. The moat is preserved by
   keeping the capability and its feedback loop internal.
2. **buy** when `timeToValuePressure === 'high'` AND
   `marketCapabilityMaturity === 'mature'` AND
   `differentiation !== 'high'`. The market already encodes the
   pattern; speed and parity at lower cost win.
3. **partner** when `marketCapabilityMaturity === 'fragmented'` AND
   `differentiation !== 'low'`. Best-of-breed pieces are stitched
   while the market settles.
4. **partner** when no other rule fires and
   `marketCapabilityMaturity === 'emerging'`. Invention risk is
   shared and the offering can be shaped around the tenant operating
   model.
5. **partner** as the conservative default when no top-level rule
   fires cleanly. Confidence drops to `low`.

Signal generation is per-criterion: every criterion is classified into
a favored option with a narrative rationale drawn from the criterion
metadata. Confidence is derived from how many signals agree with the
top-level option:

- `high` when at least four signals agree
- `medium` when two or three signals agree
- `low` otherwise

Governance warnings populate when `regulatedContext === true` or
`highRiskTags.length > 0` or `dataRightsRequired === 'tenant_owned'`.
Vendor / startup checks populate when the recommended option is not
`build`.

## Helper functions

- `listBuildBuyPartnerCriteria()` — full canonical 14-criteria pack.
  Pure and byte-equal across calls.
- `listVendorStartupAssessmentFactors()` — canonical assessment
  factors covering all five categories with red-flag and green-flag
  signals.
- `listEnterpriseReadinessRisks()` — canonical risk pack with
  mitigations and severity.
- `evaluateBuildBuyPartnerScenario(input)` — deterministic rule-based
  evaluator. Pure and byte-equal across calls.
- `summarizeBuildBuyPartnerRecommendation(result)` — short summary
  string suitable for Atlas brief panels.

## Deterministic invariants

- All list helpers are byte-equal across repeated calls (test
  enforced).
- `evaluateBuildBuyPartnerScenario` is byte-equal across repeated
  calls for the same input (test enforced).
- The build / buy / partner rules each have positive coverage tests
  with the canonical input shape (test enforced).
- Governance warnings populate when regulated context or high-risk
  tags are present (test enforced).
- Vendor / startup checks populate when option is not build (test
  enforced).
- Confidence and option values are restricted to documented enums
  (test enforced).
- No string field invents a dollar amount (test enforced).

## Module hygiene

The library does not import from Sentinel, Atlas, Nexus, Agent
runtime, Source UI, legacy `/programs`, `mock.ts`, auth, or supabase.
It does not call `Date.now`, `Math.random`, or `new Date`, does not
call `fetch`, does not invoke Claude / OpenAI / Pinecone runtime, and
does not use `useState` or `useEffect`. The source file does not
endorse any named AI vendor as a branded recommendation; a literal
substring scan over the source asserts the deny-list never appears.

## Future composition

Programs and Atlas surfaces will compose this framework with PF1
failure-mode signals, I1 pattern signals, and SOL2 component
recommendations to produce a single defensible build / buy / partner
brief per capability request. SOL6 stays a pure library so the
composition is auditable and re-runnable without live model calls.

## Validation commands

```
npx tsc --noEmit --pretty false
npx jest src/__tests__/integration/solutions/build-buy-partner-framework.test.ts
npm run build
python3 -c "import json; json.load(open('docs/build/build-slices.json'))"
```

## Acceptance criteria

- Pack contains exactly the 14 canonical decision criteria in
  canonical order.
- Vendor / startup assessment factor pack publishes at least eight
  factors covering all five categories.
- Enterprise readiness risk pack publishes at least five risks with
  mitigations and severity.
- `evaluateBuildBuyPartnerScenario` is deterministic and byte-equal
  across repeated calls for the same input.
- The build, buy, and partner rules each fire on documented inputs.
- Governance warnings populate when regulated context or high-risk
  tags are present.
- Vendor / startup checks populate when the recommended option is
  not build.
- Confidence is one of `low`, `medium`, `high`. Option is one of
  `build`, `buy`, `partner`.
- No string field invents a dollar amount.
- Module imports nothing from Sentinel / Atlas / Nexus / Agent
  runtime, Source UI, legacy `/programs`, `mock.ts`, auth, or
  supabase; no `Date.now` / `Math.random` / `new Date` / `fetch`; no
  `useState` / `useEffect`; no banned vendor names appear in source.
