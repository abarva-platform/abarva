# 2026-07-07-source-step-insights — Per-step "✦ Intelligence" insight layer (value pool · value bridge · should-cost)

## Release ID

`2026-07-07-source-step-insights`

## Status

`candidate`

## Plain-English Summary

Each Source workflow step's "✦ Intelligence" tab now delivers ITS killer,
value-proving insight — a plain-English "so what" headline plus a Recharts chart —
grounded in the deterministic fact/lever engine. This is the first cohesive slice
of a per-step insight model: SIZE value (Strategy) → EXPOSE traps (Scope) → SHOW
leverage (RFP) → PROVE savings (Pricing) → ASSURE realization (Value). Three
insights ship in this slice:

- **Strategy → Value Pool** (`ValuePoolInsight`): a horizontal Recharts bar chart,
  one floating low–high $ range bar per value LEVER from `evaluateValueLevers`,
  colored by value type, biggest-first. So-what: "$X–Y at stake across N levers;
  biggest is <lever> ($Z)." LIVE from committed facts; a clearly-marked SAMPLE from
  the archetype's illustrative bands when no fact quantifies a lever; an honest
  empty state ("provide evidence to size this") when there is nothing to size.
- **Pricing → Value Bridge** (`ValueBridgeInsight`): the value-type waterfall as a
  Recharts bar chart (one floating range bar per classified value type), from
  `buildValueWaterfall`. So-what: the ≥20% classified-value framing. Every honesty
  rule of the original `ValueWaterfall` is preserved (shared `waterfall-honesty.ts`):
  insufficient → "needs evidence" (never $0), total sums only quantified bands,
  protected/risk-adjusted stated apart, provenance badge, doctrine footer.
- **Evaluation → Should-Cost Normalization** (`ShouldCostInsight`): a grouped/stacked
  Recharts bar chart per vendor (HEADLINE price + normalizing adjustments =
  NORMALIZED TCO), with the winner flipping after normalization. So-what: the trap —
  "Vendor B is cheapest on paper; normalized, A wins by $X." Vendor-bid data is NOT
  in the fact model yet, so this ships as a clearly-badged **MODEL** (illustrative
  AMS vendors, badge reads "Model", note says it goes live when vendor responses are
  ingested) — never presented as real bids.

Also removes an orphaned detour: the never-mounted `/intelligence` Recharts charts
component and its dead feature flag.

## Layer Impact

- `experimental`: the per-step insights render only when `source_analytics` is on
  (Lakeshore enrolled). Flag-off, the Source event page is byte-identical — the
  insight is never mounted.
- `global-control-lane`: new view-model types (`StepInsightView` union +
  `stepInsight?` on `StageAnalyticsView`), a pure builder
  (`step-insight-builder.ts`), three Recharts components, and the Intelligence-tab
  wiring. All additive and flag-gated; no change to any flag-off path.
- Removes the `intelligence_quality_charts` flag (its charts component was orphaned
  after the quality lens was sunset by #4535) — no runtime behavior change, the flag
  was never mounted.

## Client Applicability

- All clients: no — flag-gated.
- Specific clients: Lakeshore (via `source_analytics` includeTenants), on the
  redesigned Source event canvas.
- Internal only: no.
- Public/demo only: no.
- Feature flag: `source_analytics` (existing; Lakeshore on).

## Changes Included

- `src/components/source/canvas/analytics/view-model.ts` — `StepInsightKind`,
  `StepInsightView` discriminated union (`value_pool` | `value_bridge` |
  `should_cost_normalization` + declared future kinds), and `stepInsight?` on
  `StageAnalyticsView`.
- `src/lib/source/facts/view/step-insight-builder.ts` — pure builder:
  facts + archetype + stageKey → the right `StepInsightView` (live / sample / empty).
- `src/components/source/canvas/analytics/insights/*` — `InsightShell`,
  `ValuePoolInsight`, `ValueBridgeInsight`, `ShouldCostInsight`, `StepInsightPanel`,
  `waterfall-honesty.ts` (shared honesty helpers), `index.ts`.
- `src/components/source/canvas/analytics/ScopeAnalyticsStage.tsx` — Intelligence tab
  leads with `view.stepInsight` (no double-render of the waterfall when the insight
  is the value bridge).
- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx` — accepts +
  attaches `stepInsight`.
- `src/app/(maestro)/source/events/[eventId]/page.tsx` — builds the step insight from
  the same facts the stage view reads, passes it to the canvas.
- Deleted: `src/components/intelligence/charts/QualityCoverageCharts.tsx` +
  `src/components/intelligence/__tests__/QualityCoverageCharts.test.tsx`; removed the
  `intelligence_quality_charts` flag (union entry + FEATURE_FLAGS def) from
  `src/lib/features/registry.ts`.
- Tests: `insights/__tests__/{ValuePoolInsight,ValueBridgeInsight,ShouldCostInsight}.test.tsx`
  + `facts/view/__tests__/step-insight-builder.test.ts`.

## QA / Validation

- `tsc -p tsconfig.json` filtered to changed files: 0 errors in `src/` (only stale
  `.next/dev/types/*` generated-file errors remain, pre-existing).
- `eslint` on all changed files + tests: clean (exit 0).
- `jest` — the 4 new suites (24 tests) pass; the existing
  `ValueWaterfall.honesty.test.tsx` still passes unchanged; full
  `src/components/source/canvas/analytics/` (27 tests) + `src/lib/source/facts/`
  (110 tests) green.
- Value-pool: one bar per lever from a fixture, biggest-first, honest empty on no
  facts. Value-bridge: insufficient → "needs evidence" (scoped), quantified-only
  total, doctrine footer. Should-cost: renders the vendor comparison AND is marked a
  MODEL (not live), the paper-cheapest ≠ the normalized winner.
- Recharts 3.8.1 + React 19 + `'use client'`: components render server-safe;
  ResponsiveContainer mocked to a fixed size in tests so the real chart tree mounts.
- `node scripts/release-check.mjs --base origin/main --head HEAD`: pass.

## Rollout Plan

Merge to main via squash PR. No migration, no data build. Renders only when
`source_analytics` is on for the tenant (Lakeshore). The repo-owned ACA main deploy
workflow ships it; no shared-runtime mutation from this branch.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (only path that
  ships shared web images).
- Shared runtime mutators: none in this change.
- Approved image digest: set by the main deploy workflow at deploy time.
- ACA runtime invariant: unchanged by this PR (no env/flag/scale/secret mutation).
- Worker image invariant: unchanged.
- Feature/env flag update path: none — reuses the existing `source_analytics` flag;
  removes the unused `intelligence_quality_charts` flag.
- Live signed-in proof required: yes, before claiming `live-proven` — a Lakeshore
  signed-in view of a Source event's Strategy / Pricing / Evaluation Intelligence
  tabs showing the value pool, value bridge, and should-cost insights.

## Rollback Plan

Revert the squash commit. No migration to reverse, no data mutation. Flag-off
already neutralizes the feature at runtime, so a revert is only needed to remove the
code.

## Audit Evidence

- PR URL + CI run (to be filled at merge).
- The 4 new jest suites + the preserved `ValueWaterfall.honesty.test.tsx`.
- `release-check` pass output.

## Known Gaps

- Should-cost ships as a MODEL: it goes live per-vendor only when vendor responses
  are ingested into the fact model (typed vendor bid price + retained-FTE delta + SLA
  / transition adjustments). Until then the badge reads "Model" and the note says so.
- The remaining spine insights (Scope evidence-gap-priced, RFP protected-vs-exposed,
  Responses vendor-dodge-map, BAFO captured-vs-target, Value committed-vs-realized)
  are declared in the view-model but not yet built — the Intelligence tab falls back
  to the IntelPanel read for those steps.
- Live signed-in Lakeshore browser proof pending (see Deployment Authority).
