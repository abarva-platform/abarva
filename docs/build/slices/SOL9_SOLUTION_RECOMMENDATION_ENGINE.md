# SOL9 · Solution Recommendation Engine

Slice ID: SOL9
Slice name: Solution Recommendation Engine
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-25
Author: Code (sole)

Pure deterministic library that unifies SOL3 archetypes, SOL4 / SOL5
component packs, the SOL6 build/buy/partner evaluator, and the SOL7
detail read model into a single Nexus-facing recommendation layer. Given
a caller-supplied context (industry, business problem, signals, dataset
domains, preferences) the engine returns a deterministic, scored,
reason-annotated set of archetype recommendations together with
build/buy/partner guidance, missing inputs, and a concrete next action.
**Library only — does not invoke models, does not read tenant runtime
state, does not mutate persistence.**

## What changed

- New module
  [src/lib/solutions/solution-recommendation-engine.ts](../../../src/lib/solutions/solution-recommendation-engine.ts):
  - Public types: `SolutionRecommendationInput`,
    `SolutionRecommendationScore`, `SolutionRecommendationReason`,
    `SolutionRecommendationMissingInput`,
    `SolutionRecommendationNextAction`, `SolutionRecommendation`,
    `SolutionRecommendationSummary`.
  - Public helpers:
    - `recommendSolutionArchetypesForContext(input)` — scored,
      reason-annotated archetype recommendations sorted by raw score
      with canonical-order tiebreaks and capped at 5 results.
    - `summarizeSolutionRecommendations(recs)` — at-a-glance summary
      (count, top archetype, high-confidence count, total missing
      inputs).
    - `getTopSolutionRecommendation(input)` — convenience top-1
      accessor returning `null` only when the engine returns no
      records.

- New tests
  [src/__tests__/integration/solutions/solution-recommendation-engine.test.ts](../../../src/__tests__/integration/solutions/solution-recommendation-engine.test.ts):
  deterministic suite covering output determinism, healthcare,
  analytics, PDLC, KYC scenario priors, sparse-input placeholder
  semantics, build/buy/partner guidance shape, summary reconciliation,
  no-fabricated-dollars on the serialized output, and module hygiene
  (no model providers, no live runtime, no forbidden imports).

## Public surface

```ts
recommendSolutionArchetypesForContext(input: SolutionRecommendationInput)
  : readonly SolutionRecommendation[];

summarizeSolutionRecommendations(recs: readonly SolutionRecommendation[])
  : SolutionRecommendationSummary;

getTopSolutionRecommendation(input: SolutionRecommendationInput)
  : SolutionRecommendation | null;
```

## Scoring rules (deterministic)

The engine iterates over every SOL3 archetype and computes a raw score
by summing weighted match signals.

| Reason kind | Weight | Trigger |
|---|---|---|
| `industry_match` | 4 | `input.industry` substring-matches archetype `sector` or `capabilityFamily` (case-insensitive, both directions). |
| `failure_mode_match` | 3 per match | Each `input.detectedFailureModes` entry that appears in `failureModesAddressed`. |
| `pattern_match` | 3 per match | Each `input.detectedPatterns` entry that appears in `patternsUsed`. |
| `capability_match` | 2 per match | Each `input.desiredOutcomes` or `input.currentStateSignals` keyword that substring-matches `problemStatement` or `businessOutcomes`. |
| `dataset_match` | 2 per match | Each `input.availableDatasetDomains` keyword that substring-matches `currentStateInputsRequired` or `architectureBuildingBlocks`. |
| `preference_match` | 1 | `input.buildBuyPreference` ≠ `'no_preference'` and the preference word appears in archetype `buildBuyPartnerConsiderations`. |

Normalization: `normalized = min(1, raw / 24)`. Bands: `low` < 0.34,
`medium` < 0.67, `high` ≥ 0.67. Confidence: `high` if normalized ≥ 0.67
AND missing-input count ≤ 1, `medium` if normalized ≥ 0.34, else `low`.

Filters: only archetypes with `raw ≥ 1` are returned. Sort descending
by raw score with canonical SOL3 archetype-order as tiebreak. Cap at 5
recommendations per call.

## Special-case priors

The engine applies four deterministic keyword priors that bias scoring
toward the conventional sector mapping when caller context is sparse on
explicit failure modes / patterns:

- Healthcare keywords (`clinical`, `ambient`, `hcc`, `prior auth`,
  `prior authorization`, `payer`, `ehr`, `healthcare`, `health care`,
  `utilization management`, `risk adjustment`) bias the three healthcare
  archetypes (`healthcare_ambient_clinical_value_chain`,
  `hcc_risk_adjustment_coding_accuracy`,
  `prior_authorization_utilization_management`).
- Analytics keywords (`data`, `lakehouse`, `semantic`, `bi`,
  `warehouse`, `feature store`, `analytics`, `data foundation`,
  `metric`, `reporting`) bias `analytics_modernization`.
- PDLC keywords (`pdlc`, `dora`, `code review`,
  `developer productivity`, `engineering`, `devex`,
  `software development`, `sdlc`) — or the
  `ai_governance_operating_model_gap` failure-mode marker — bias
  `ai_led_pdlc_transformation`.
- KYC keywords (`kyc`, `onboarding`, `customer due diligence`, `aml`,
  `know your customer`, `customer onboarding`) bias
  `kyc_customer_onboarding_ai`.

Each prior adds a +4 bonus and surfaces a `capability_match` reason so
the basis is visible in the serialized recommendation.

## Build / buy / partner guidance

For every recommendation the engine derives a deterministic
`BuildBuyPartnerScenarioInput` and calls SOL6's
`evaluateBuildBuyPartnerScenario`:

- `differentiation` is `high` when the failure-mode overlap between
  caller input and archetype `failureModesAddressed` is ≥ 2, else
  `medium`.
- `internalCapabilityPresent` is `true` when `existingPlatforms.length
  > 0`.
- `timeToValuePressure` mirrors `input.urgency` (default `medium`).
- `regulatedContext` is `true` when
  `input.regulatorySensitivity === 'high'`.
- `dataRightsRequired` is `tenant_owned` under regulated context else
  `shared`.
- `marketCapabilityMaturity` is a deterministic switch on archetype
  key (`mature` for analytics, contact center, predictive maintenance,
  finance; `emerging` for PDLC, ambient clinical, KYC, service ops;
  `fragmented` for HCC, prior auth, build-buy-partner evaluation, AI
  governance).
- `workflowComplexity` is `high` when failure-mode overlap ≥ 1 else
  `medium`.

The engine keeps the SOL6 evaluator's `recommendedOption`, `rationale`,
and `governanceWarnings` on the recommendation so callers see the same
build/buy/partner posture SOL6 would surface in isolation.

## Sparse-input behavior

If the caller supplies no `industry`, no `desiredOutcomes`, no
`currentStateSignals`, no `detectedFailureModes`, AND no
`detectedPatterns`, the engine returns a single placeholder
recommendation:

- Anchored to the first canonical SOL3 archetype so the record is
  fully shaped.
- `score.band` and `confidence` both `low`.
- Four explicit `missingInputs` entries with `blocks_recommendation`
  impact.
- `nextAction.kind === 'capture_inputs'` with explicit prompt copy.
- Build/buy/partner guidance defaults to `partner` with a provisional
  rationale and a single warning that the posture is provisional until
  inputs are captured.

## Hard rules

- No imports from `src/lib/source/**`, `src/lib/nexus/**`,
  `src/lib/sentinel/**`, `src/lib/atlas/**`, `src/lib/agent/**`,
  `src/lib/auth/**`, `supabase`.
- No `Math.random`, no clock reads, no live model calls, no `fetch`,
  no React hooks, no placeholder copy (`Coming soon`, `TBD`,
  `Lorem ipsum`).
- Only imports SOL3 (`solution-archetype-registry`) and SOL6
  (`build-buy-partner-framework`) — the SOL3 sector / failure-mode /
  pattern / building-block surface plus the SOL6 evaluator are
  sufficient to derive the full recommendation.
- Tests cover module hygiene by reading the file with
  `fs.readFileSync` and asserting forbidden tokens / forbidden imports
  do not appear.

## Validation

```bash
npx tsc --noEmit --pretty false
npx jest src/__tests__/integration/solutions/solution-recommendation-engine.test.ts
npx jest src/__tests__/integration/solutions/solution-archetype-registry.test.ts
npx jest src/__tests__/integration/solutions/build-buy-partner-framework.test.ts
npm run build
python3 -c "import json; json.load(open('docs/build/build-slices.json')); json.load(open('docs/build/production-readiness.json'))"
```

## Acceptance criteria

- Module exports `SolutionRecommendationInput`,
  `SolutionRecommendationScore`, `SolutionRecommendationReason`,
  `SolutionRecommendationMissingInput`,
  `SolutionRecommendationNextAction`, `SolutionRecommendation`,
  `SolutionRecommendationSummary`,
  `recommendSolutionArchetypesForContext`,
  `summarizeSolutionRecommendations`, and
  `getTopSolutionRecommendation` as the canonical contract.
- Healthcare scenario (`industry: 'healthcare'` + clinical workflow
  desired outcome) returns a top recommendation in the healthcare
  archetype set.
- Analytics scenario (`desiredOutcomes` of `data foundation` and
  `semantic layer`) returns `analytics_modernization` as top.
- PDLC scenario (`detectedFailureModes:
  ['ai_governance_operating_model_gap']` or PDLC keyword signal)
  returns `ai_led_pdlc_transformation` as top.
- KYC scenario (`industry: 'banking'` + `customer onboarding` outcome)
  returns `kyc_customer_onboarding_ai` as top.
- Sparse input returns a single placeholder with `missingInputs.length
  > 0` AND `nextAction.kind === 'capture_inputs'`.
- Every recommendation carries `buildBuyPartnerGuidance` with
  `recommendedOption ∈ {build, buy, partner}`.
- `summarizeSolutionRecommendations` reconciles to the recommendation
  list (`totalRecommendations`, `topArchetypeKey`,
  `highConfidenceCount`, `totalMissingInputs`).
- Serialized recommendations contain no fabricated dollar amounts.
- Module imports SOL3 and SOL6 and nothing from forbidden directories;
  contains none of the forbidden tokens (`Math.random`, clock reads,
  `fetch(`, `anthropic`, `openai`, `useState`, `useEffect`,
  `Coming soon`, `TBD`, `Lorem ipsum`).

## Notes

- SOL9 is a *library*, not a UI. The recommendation engine is consumed
  by the future Solution Intelligence Canvas (SOL10+) and by Nexus when
  composing per-tenant solution drafts. SOL9 itself does not render or
  persist anything.
- The four special-case priors and the deterministic
  `marketCapabilityMaturity` switch keep the engine sector-aware
  without invoking a live vendor catalog or a live model.
- The sparse-input placeholder is intentionally tied to the first
  canonical archetype so the contract shape is uniform across all
  outputs; downstream renderers branch on
  `nextAction.kind === 'capture_inputs'` rather than on archetype
  identity.
