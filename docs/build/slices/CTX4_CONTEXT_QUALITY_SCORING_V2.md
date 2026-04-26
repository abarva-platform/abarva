# CTX4 · Context Pack Quality Scoring v2

Slice ID: CTX4
Slice name: Context Pack Quality Scoring v2
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-25
Author: Lane E (parallel build pack)

Adds a deterministic, pure scorer that grades a CTX2 Unified Context
Pack across **ten canonical dimensions** and emits an overall band
plus risks and recommendations. The scorer is the canonical "is this
pack good enough to act on?" verdict that any agent runtime would
consult after CTX2 builds the pack. **No model call, no live
retrieval, no `Date.now` reads, no randomness, no UI build, no
migrations.**

CTX4 is a structural observer of the CTX2 pack value. It does not
import any agent runtime, any source/auth/supabase module, or any
model SDK. It does not invoke any CTX2 runtime helper either; it
inspects the pack's already-deterministic shape (sections,
hasContent flags, governance constraints, identity, work-object
resolution).

## What changed

- New module
  [src/lib/architecture/context-quality-v2.ts](../../../src/lib/architecture/context-quality-v2.ts):
  - Public types: `ContextQualityDimension`, `ContextQualityBand`,
    `ContextQualityDimensionScore`, `ContextQualityRisk`,
    `ContextQualityRecommendation`, `ContextQualityV2Score`.
  - `scoreContextQualityV2(pack)` — pure scorer that grades the
    pack across ten dimensions, computes the overall band, and
    derives risks plus recommendations.
  - `classifyContextQualityV2(score)` — re-derives the overall
    band (idempotent on a given score).
  - `summarizeContextQualityV2(score)` — counters and the top-3
    risks / recommendations for surface-level summaries.
  - `getContextQualityRecommendations(score)` — convenience
    accessor for the recommendations array.
  - `CONTEXT_QUALITY_DIMENSIONS` — canonical ten-key dimension
    order.
  - Reads only from `@/lib/architecture/unified-context-builder`
    (CTX2 read-only type alignment).

- New tests
  [src/__tests__/integration/architecture/context-quality-v2.test.ts](../../../src/__tests__/integration/architecture/context-quality-v2.test.ts):
  24 deterministic tests covering byte-equal output, the
  ten-dimension constant invariant, sparse / refused inputs,
  complete-pack scoring, evidence-strength variation, governance
  variation, refusal under empty tenantKey or unresolved work
  object, summary reconciliation, and module hygiene.

## How a score is built

```text
UnifiedContextPack (from CTX2)
        │
        ▼
scoreContextQualityV2
        │
        ├── 10 dimension scorers (each returns 0..1 + band + rationale)
        │
        ├── computeRefusalSignal (tenant / work object / floor)
        │
        ├── overallBand = lowest(dimension bands) unless refused
        │
        ├── generateRisks (per-dimension thresholds)
        │
        ├── generateRecommendations (per-risk template)
        │
        ▼
ContextQualityV2Score { overallScore, overallBand, dimensionScores,
                        risks, recommendations, refused, basis }
```

## Ten canonical dimensions

Every score always carries all ten in this order. Scores are in
`[0, 1]`; bands are derived deterministically from the score.

| Dimension                  | What it measures                                                  |
|----------------------------|-------------------------------------------------------------------|
| `completeness`             | Ratio of non-empty sections to the canonical twelve.              |
| `evidence_strength`        | Whether evidence section carries `usable_as_evidence: true` ids.  |
| `pattern_grounding`        | Whether patterns section names ≥1 pattern key.                    |
| `solution_grounding`       | Whether solution archetype is grounded for archetype work objects.|
| `workflow_state`           | Whether phase / status / hard gates are present.                  |
| `data_readiness`           | How many dataset summaries are present.                           |
| `governance_safety`        | Hard vs soft governance constraint coverage.                      |
| `missing_input_severity`   | Inverse penalty from honest-empty sections + unknown tenant.      |
| `sparsity_risk`            | `1 − empty_sections / total_sections`.                            |
| `actionability`            | Per-kind heuristic: tenant + work object + needed sections.       |

## Band thresholds (per dimension)

- `score ≥ 0.7` → `usable`
- `score ≥ 0.4` → `partial`
- `score ≥ 0.15` → `weak`
- `score < 0.15` → `refused`

## Overall band rule

The overall band is the **lowest** of the ten dimension bands —
unless a refusal signal fires, in which case the overall band is
forced to `refused`.

## Refusal signals

`refused: true` is set when **any** of these hold:

- `pack.identity.tenantKey` is empty.
- `pack.workObject.resolved` is `false`.
- The overall (mean) score is below the `0.15` floor.

When refused, `refusalReason` is populated with a short string
naming the cause.

## Risks

Risks are generated from dimension scores with these triggers:

| Risk kind                  | Trigger                                                   | Severity                        |
|----------------------------|-----------------------------------------------------------|---------------------------------|
| `tenant_scope_unclear`     | Empty tenantKey.                                          | high                            |
| `work_object_unresolved`   | `pack.workObject.resolved === false`.                     | high                            |
| `missing_evidence`         | `evidence_strength < 0.4`.                                | medium / high under 0.2         |
| `missing_governance`       | `governance_safety < 0.6`.                                | medium / high under 0.3         |
| `sparse_inputs`            | `sparsity_risk < 0.5`.                                    | medium / high under 0.3         |
| `low_actionability`        | `actionability < 0.6`.                                    | medium / high under 0.3         |

## Recommendations

Recommendations follow risks deterministically, deduped by `kind`:

| Recommendation kind          | Source risk                       |
|------------------------------|-----------------------------------|
| `resolve_work_object`        | `work_object_unresolved`          |
| `capture_inputs`             | `tenant_scope_unclear`            |
| `load_evidence`              | `missing_evidence`                |
| `add_governance_constraint`  | `missing_governance`              |
| `request_workshop`           | `sparse_inputs`                   |
| `defer_to_steward`           | `low_actionability`               |

## Audit basis

Every score carries:

- `basis.scorerVersion` — fixed string `"ctx4.v1"`.
- `basis.source` — fixed string `"deterministic_context_quality_scoring"`.
- `createdFrom` — fixed string `"deterministic_seed"`.

These let callers assert the no-live-model invariant directly on a
score value without re-reading the source.

## What is intentionally NOT in CTX4 v1

- **Machine-learned weighting.** Dimension weights are uniform
  (mean) for v1. A future slice may introduce learned or
  configurable weights via a deterministic weight table.
- **Trend / drift tracking across calls.** CTX4 grades a single
  pack snapshot. Diffing two scores over time is left to a future
  slice.
- **Live evidence retrieval.** CTX4 does not call EVID2; it grades
  what CTX2 emitted. When EVID2 lands and CTX2 populates evidence,
  CTX4's `evidence_strength` dimension will lift without a CTX4
  code change.
- **UI surface.** No component is rendered. A future slice can
  visualize a score on a debug surface.
- **Agent runtime invocation.** CTX4 does not call Nexus, Sentinel,
  Atlas, or Steward.

## Hygiene invariants

- No `Date.now()`, `Math.random()`, `new Date(` in the module body.
- No `fetch(`, no Anthropic / OpenAI SDK imports.
- No React state / effect hooks.
- No imports from `@/lib/sentinel`, `@/lib/atlas`, `@/lib/nexus`,
  `@/lib/source`, `@/lib/auth`, supabase, or
  `@/lib/programs/mock`.
- The only allowed cross-import is `@/lib/architecture/unified-context-builder`
  (CTX2 read-only type alignment).
- Same input pack → byte-equal score across calls.

## Validation commands

```bash
npx tsc --noEmit --pretty false
npx jest src/__tests__/integration/architecture/context-quality-v2.test.ts
npm run build
python3 -c "import json; json.load(open('docs/build/build-slices.json')); json.load(open('docs/build/production-readiness.json'))"
```

All four pass on 2026-04-25.

## Future slices that build on CTX4

- **CTX5 — Context score surface.** A read-only debug surface that
  visualizes a CTX4 score side-by-side with the CTX2 pack.
- **CTX6 — Score telemetry.** Aggregate score summaries across
  packs to highlight which work-object kinds are systematically
  weakest.
- **CTX7 — Weighted scoring.** Per-tenant or per-intent weight
  tables for the ten dimensions, retaining determinism.

## Acceptance criteria mapping

- Defines the canonical ten-dimension scorer shape with type-safe
  bodies — see public type list above and the
  `CONTEXT_QUALITY_DIMENSIONS` constant.
- Pure projection, no model calls — module hygiene tests assert
  the absence of forbidden tokens and forbidden imports.
- Honest refusal under empty tenant or unresolved work object —
  covered by the dedicated tests.
- Risk and recommendation generation traceable to dimension scores
  — covered by the governance and evidence variation tests.
- Byte-equal determinism — covered by paired-call equality tests
  on both happy-path and sparse inputs.
- No fabricated evidence citations — covered by the explicit
  no-`E-\d+` assertion on the serialized score.
