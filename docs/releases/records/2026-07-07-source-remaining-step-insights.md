# 2026-07-07-source-remaining-step-insights — Advisor-grade per-step insights for the REMAINING Source steps (transition · exec-decision · value · responses · BAFO · selection)

## Release ID

`2026-07-07-source-remaining-step-insights`

## Status

`candidate`

## Plain-English Summary

This completes the Source per-step "✦ Intelligence" model. #4537 shipped the first
three step insights and #4539 deepened the model into advisor GUIDANCE (chart +
best-practice + benchmark + downstream-impact + a "so what" headline) and shipped Scope
+ RFP. This PR extends that SAME substrate (it does not fork it) to the six remaining
Source workflow steps. Two are LIVE from the seeded facts; four are honestly-badged
MODELs that each name the exact fact that flips them live.

Six new insights ship, each with its killer "so what" headline, a Recharts chart, and
the advisor layer (best-practice / benchmark / downstream):

- **Transition → Transition-risk exposure** (`transition_risk`, **LIVE**): the
  AMS.TRANSITION_RISK lever computes `transition_fee × overrun_cost_multiple ×
  (overrun_probability / 100)` from the seeded facts (`transition_fee` 3.1M,
  `overrun_probability` 30, `overrun_cost_multiple` 1.6). Chart: the probability-weighted
  exposure band (conservative→expected) vs the fee-at-risk a milestone plan caps it with.
  Best-practice = the lever's `rfpClause` ("milestone-based transition plan, fee-at-risk
  on slippage") + `whatToWatch`. So-what: "$X at risk if the transition overruns;
  milestone fees cap it at the $3.1M transition fee." Renders an honest empty (never $0)
  when the fee/probability facts are absent.

- **Executive Decision → Value + risk, board-ready** (`exec_decision`, **LIVE**): from
  the value bridge (`buildValueWaterfall`) — the classified value split into NEGOTIABLE
  (earned: incremental + solution), PROTECTED (a risk hedge), and RISK-ADJUSTED (a TCO
  normalization), each stated APART with a confidence band, plus a residual-risk read
  (levers still needing evidence, named). Chart: one range bar per bucket. So-what: "net
  negotiable value $X–Y; protected $P, risk-adjusted $R stated apart — <confidence>
  confidence." Never folds protected/risk into the negotiable number.

- **Value → Committed vs realized over time** (`value_realization`, **MODEL**): committed
  value (from the awarded levers) as a track over the term vs realized (`null`/pending).
  Chart: a LineChart, committed solid + realized dashed (null = a gap, never a fabricated
  number). Best-practice from `executiveImplication`. So-what: "committed $X; realization
  tracked here once actuals land." Flip fact: **periodic realized-value actuals per lever**.

- **Responses → Vendor dodge-map** (`response_coverage`, **MODEL**): per value dimension,
  whether vendors answered or dodged — every dimension shown "dodged" (the exposure) until
  proven answered. Chart: one range bar per dimension. Each dodged row carries its
  `evaluationImpact` (the thing to press). Flip fact: **vendor responses ingested per
  lever/clause**.

- **BAFO → Captured vs target** (`bafo_progress`, **MODEL**): value captured (0/pending)
  vs target by lever, with each lever's remaining `bafoAsk` (the lever left to pull).
  Chart: target vs captured bars per lever. Flip fact: **BAFO concession actuals per
  lever**.

- **Selection → Committed value by lever** (`committed_value`, **MODEL**, compact): the
  value the award locks, by lever — a compact bar set, not an over-built surface. Flip
  fact: **award facts (the executed contract confirming committed levers)**.

## Layer Impact

- `experimental` (lane): every new insight renders only when `source_analytics` is on
  (Lakeshore enrolled). Flag-off, the Source event page is byte-identical — the insight is
  never mounted.
- `global-control-lane` (lane): additive view-model changes (six new `StepInsightView`
  members + their row/point/slice view types, all extending the existing `AdvisorLayer`),
  six new Recharts components, six new builder functions in the existing pure
  `step-insight-builder.ts`, and the remaining stage→kind map entries. All additive and
  flag-gated; no change to any flag-off path and no change to the existing five insights.

## Client Applicability

- All clients: no — flag-gated.
- Specific clients: Lakeshore (via `source_analytics` includeTenants), on the redesigned
  Source event canvas — the Transition, Executive-Decision, Value, Responses, BAFO, and
  Selection steps' Intelligence tab.
- Internal only: no.
- Public/demo only: no.
- Feature flag: `source_analytics` (existing; Lakeshore on).

## Changes Included

- `src/components/source/canvas/analytics/view-model.ts` — six new members on
  `StepInsightKind` (`transition_risk`, `exec_decision`, `value_realization`,
  `response_coverage`, `bafo_progress`, `committed_value`) and their view interfaces
  (`TransitionRiskInsightView`, `ExecDecisionInsightView` + `ExecDecisionSliceView`,
  `ValueRealizationInsightView` + `ValueRealizationPointView`, `ResponseCoverageInsightView`
  + `ResponseCoverageRowView`, `BafoProgressInsightView` + `BafoProgressRowView`,
  `CommittedValueInsightView` + `CommittedValueBarView`), all `extends AdvisorLayer`; the
  placeholder future-kind strings replaced by these real kinds; all six added to the
  `StepInsightView` union.
- `src/components/source/canvas/analytics/insights/{TransitionRiskInsight,ExecDecisionInsight,ValueRealizationInsight,ResponseCoverageInsight,BafoProgressInsight,CommittedValueInsight}.tsx`
  (new) — the six Recharts components (`'use client'`), each wrapping `InsightShell` with
  its chart + advisor layer, matching the existing components' patterns exactly.
- `src/components/source/canvas/analytics/insights/StepInsightPanel.tsx`, `index.ts` —
  wire the six new kinds into the by-kind switch + barrel.
- `src/lib/source/facts/view/step-insight-builder.ts` — the remaining stage→kind entries
  in `stepInsightKindForStage` (`transition`, `exec_decision`/`executive_decision`,
  `value`, `responses`, `bafo`, `selection`); `buildTransitionRiskInsight`,
  `buildExecDecisionInsight`, `buildValueRealizationInsight`,
  `buildResponseCoverageInsight`, `buildBafoProgressInsight`, `buildCommittedValueInsight`
  (LIVE for transition/exec-decision from real facts; honest MODEL fallbacks; playbook-
  sourced advisor lines; the flip fact named on each model).
- No change needed to the canvas / event page — the existing generic path already builds
  `buildStepInsight({ stageKey, … })` for any stage the map covers and renders
  `view.stepInsight` by kind, so the new stages flow through unchanged.
- Tests:
  `insights/__tests__/{TransitionRiskInsight,ExecDecisionInsight,ValueRealizationInsight,ResponseCoverageInsight,BafoProgressInsight,CommittedValueInsight}.test.tsx`
  (new, 12 tests) + extended `facts/view/__tests__/step-insight-builder.test.ts`.

## QA / Validation

- `tsc -p tsconfig.json` filtered to changed files: 0 errors in my files (recharts 3.x
  Tooltip/Legend/Line formatter types matched to the existing insight components; the
  full-project tsc does not fail on my files).
- `eslint` on all changed files + tests: clean (exit 0).
- `jest` — the 6 new component suites (12 tests) + the extended builder suite (27 tests):
  39 tests pass.
- Transition (LIVE): the exposure band + fee-at-risk compute from the seeded facts fixture
  (`transition_fee` 3.1M × `overrun_cost_multiple` 1.6 × 30% = $1.488M expected, a real
  range with a conservative low end); no facts → honest empty, never $0.
- Exec-Decision (LIVE): classifies computed value into negotiable/protected/risk buckets,
  each stated apart (no bucket duplicated, real ranges); no lever computes → clearly-marked
  SAMPLE; residual-risk names the unsized levers, never a number.
- Value / Responses / BAFO / Selection (MODEL): each renders its "Model" badge + advisor
  layer, carries no fabricated tenant number (realized `null`, captured `0`, dodged
  status), and names the exact fact that flips it live.
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
- Feature/env flag update path: none — reuses the existing `source_analytics` flag.
- Live signed-in proof required: yes, before claiming `live-proven` — a Lakeshore
  signed-in view of a Source event's Transition + Executive-Decision Intelligence tabs
  showing the LIVE transition-risk exposure and the classified board read, and the Value /
  Responses / BAFO / Selection tabs showing their honestly-badged MODEL insights.

## Rollback Plan

Revert the squash commit. No migration to reverse, no data mutation. Flag-off already
neutralizes the feature at runtime, so a revert is only needed to remove the code.

## Audit Evidence

- PR URL + CI run (to be filled at merge).
- The 6 new jest component suites (12 tests) + the extended builder suite (27 tests).
- `release-check` pass output.

## Known Gaps

- **Transition-risk and Exec-Decision are LIVE; the other four are MODELs.** Transition
  computes from the seeded `transition_fee` / `overrun_probability` / `overrun_cost_multiple`
  facts; Exec-Decision computes from any levers the committed facts quantify. The remaining
  four are honestly badged MODEL and each names the fact that flips it live:
  - **Value → committed vs realized**: flips when **periodic realized-value actuals per
    lever** (run-cost, SLA-credit, productivity-credit actuals booked per period) are
    ingested. Committed is the real awarded-lever roll-up; realized is never fabricated.
  - **Responses → vendor dodge-map**: flips when **vendor responses are ingested per
    lever/clause** (a parsed vendor proposal whose commitments are extracted and matched to
    each dimension). Until then every dimension is shown "dodged" (the exposure).
  - **BAFO → captured vs target**: flips when **BAFO concession actuals per lever** (each
    negotiated concession booked against the lever it moves) are ingested. Captured is 0
    until then, never fabricated.
  - **Selection → committed value**: flips when **award facts** (the executed contract /
    award record confirming which levers the winning vendor committed) are ingested.
- **The $ magnitude of a MODEL lever uses the archetype illustrative scale.** Where a
  lever's facts are absent, its $ band is the archetype's illustrative AMS scale (ranges,
  never a point), the same doctrine as Scope/RFP — never presented as a Lakeshore number.
- **Benchmarks are labeled market ranges, not tenant-sourced.** All benchmark lines are
  prefixed "Market range —" and are AMS-category estimates, never Lakeshore's own numbers.
- Live signed-in Lakeshore browser proof pending (see Deployment Authority).
