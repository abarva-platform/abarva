# 2026-07-07-source-scope-rfp-insights — Advisor-grade Scope + RFP per-step insights (scope-to-value coverage · lever-to-clause coverage)

## Release ID

`2026-07-07-source-scope-rfp-insights`

## Status

`candidate`

## Plain-English Summary

This deepens the Source per-step "✦ Intelligence" model from a chart into advisor
GUIDANCE, and ships the two exemplars of that deeper model: the **Scope** and **RFP**
steps. An insight is no longer just a chart — every insight now carries four advisor
parts the UI shows: the data read (a chart), best-practice (what a great sourcing
advisor for THIS archetype knows), a benchmark (a labeled market comparison), and the
downstream cost of getting this step wrong.

Two new insights ship:

- **Scope → Scope-to-value coverage** (`ScopeCoverageInsight`): one horizontal bar per
  value LEVER, its low–high $ at stake. A lever is REACHABLE (green) when every fact its
  computation requires is present under the current scope/evidence, or STRANDED (amber)
  when required evidence is missing/out of scope. So-what: "$X of $Y reachable under
  current scope; $Z stranded because <missing evidence>." Each stranded lever names WHY
  (the missing evidence family). LIVE reachable-vs-stranded from real committed facts; a
  clearly-badged MODEL (every lever shown as what a complete scope unlocks) when the
  event has no facts yet. Best-practice pulls each lever's `whatToWatch` + its
  `requiredEvidence` families; benchmark is a labeled AMS market range; downstream:
  "scope sets your ceiling — a lever left out of scope can't be recovered in RFP,
  Evaluation, or BAFO."

- **RFP → Lever-to-clause coverage** (`RfpClauseInsight`): one bar per value LEVER, its
  $ at stake, marked PROTECTED (green, the RFP requires its clause) or EXPOSED (amber).
  There is no structured RFP-draft in the fact model yet, so this defaults to a MODEL —
  every lever is EXPOSED ("to require") — until an RFP-draft signal exists. So-what:
  "your $X pool depends on N levers; best-in-class AMS RFPs protect each with a clause;
  M exposed ($Z)." Each exposed lever carries a CLAUSE LIBRARY: the exact `rfpClause` +
  `bafoAsk` text (real advisor knowledge, verbatim from the archetype playbook) to drop
  into the RFP. Benchmark: a labeled market line ("~70% of AMS RFPs omit the volume-band
  step-down clause"); downstream: "the RFP is the last point to lock a lever into a
  requirement — an unprotected lever can't be recovered in Evaluation or BAFO."

The advisor layer (`bestPractice` / `benchmark` / `downstreamImpact`) is added to the
shared insight shape and rendered by `InsightShell` as labeled lines beneath the chart,
so EVERY insight kind — not just Scope/RFP — can now show advisor guidance. This extends
the #4537 substrate; it does not fork it.

## Layer Impact

- `experimental` (lane): the new insights render only when `source_analytics` is on
  (Lakeshore enrolled). Flag-off, the Source event page is byte-identical — the insight
  is never mounted.
- `global-control-lane` (lane): additive view-model changes (an `AdvisorLayer` mixin;
  two new `StepInsightView` members `scope_coverage` / `rfp_clause_coverage`; the
  existing insight kinds now extend `AdvisorLayer`), two new Recharts components, new
  builder functions in the existing pure `step-insight-builder.ts`, and two new entries
  in the stage→kind map. All additive and flag-gated; no change to any flag-off path.

## Client Applicability

- All clients: no — flag-gated.
- Specific clients: Lakeshore (via `source_analytics` includeTenants), on the redesigned
  Source event canvas, Scope and RFP steps' Intelligence tab.
- Internal only: no.
- Public/demo only: no.
- Feature flag: `source_analytics` (existing; Lakeshore on).

## Changes Included

- `src/components/source/canvas/analytics/view-model.ts` — `AdvisorLayer` mixin
  (`bestPractice?` / `benchmark?` / `downstreamImpact?`); `ScopeCoverageInsightView` +
  `ScopeCoverageRowView`; `RfpClauseInsightView` + `RfpClauseRowView`; both new members
  added to `StepInsightKind` and the `StepInsightView` union; `ValuePool` / `ValueBridge`
  / `ShouldCost` views now `extends AdvisorLayer`.
- `src/components/source/canvas/analytics/insights/InsightShell.tsx` — renders the
  advisor layer (best-practice list · benchmark · downstream impact) as design-system
  labeled lines beneath the chart, for every insight kind.
- `src/components/source/canvas/analytics/insights/ScopeCoverageInsight.tsx` (new),
  `RfpClauseInsight.tsx` (new) — the two Recharts components (`'use client'`).
- `src/components/source/canvas/analytics/insights/StepInsightPanel.tsx`, `index.ts` —
  wire the two new kinds into the by-kind switch + barrel.
- `src/components/source/canvas/analytics/insights/{ValuePoolInsight,ValueBridgeInsight,ShouldCostInsight}.tsx`
  — pass their `advisor` through to `InsightShell` (so the advisor layer renders for
  every kind).
- `src/lib/source/facts/view/step-insight-builder.ts` — `scope`→`scope_coverage`,
  `rfp`→`rfp_clause_coverage` in `stepInsightKindForStage`; `buildScopeCoverageInsight`
  + `buildRfpClauseInsight` (reachability from real facts, playbook-sourced advisor
  lines, honest MODEL fallback).
- Part D wiring: no change needed to `ScopeAnalyticsStage` / `SourceAnalyticsCanvas` /
  the event page — the existing generic path already builds `buildStepInsight({ stageKey:
  viewStage, … })` for any stage the map covers and renders `view.stepInsight` by kind.
  Scope/RFP now return their kinds, so they flow through unchanged.
- Tests:
  `insights/__tests__/{ScopeCoverageInsight,RfpClauseInsight}.test.tsx` (new) +
  extended `facts/view/__tests__/step-insight-builder.test.ts`.

## QA / Validation

- `tsc -p tsconfig.json` filtered to changed files: 0 errors in `src/` (recharts 3.x
  Tooltip/Legend formatter types matched to the existing insight components, so the
  full-project tsc does not fail on my files).
- `eslint` on all changed files + tests: clean (exit 0).
- `jest` — the 2 new suites + the extended builder suite: 21 tests pass; the full
  `insights/__tests__/` (5 suites, 15 tests) green (the 3 prior components still pass
  after the advisor-layer wiring).
- Scope: reachable-vs-stranded computed from a facts fixture (all-evidence → all
  reachable, nothing stranded; missing evidence → that lever stranded, its $ counted as
  stranded, honest reachable/stranded headline). No-facts → honest MODEL badge, no
  fabricated tenant numbers, ranges only.
- RFP: exposed levers list the real `rfpClause` + `bafoAsk` text verbatim; always a
  MODEL (no RFP-draft signal yet); advisor best-practice/benchmark/downstream render.
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
  signed-in view of a Source event's Scope + RFP Intelligence tabs showing the
  scope-to-value coverage and lever-to-clause coverage insights with their advisor lines.

## Rollback Plan

Revert the squash commit. No migration to reverse, no data mutation. Flag-off already
neutralizes the feature at runtime, so a revert is only needed to remove the code.

## Audit Evidence

- PR URL + CI run (to be filled at merge).
- The 2 new jest suites + the extended builder suite (21 tests) + the preserved insight
  suites.
- `release-check` pass output.

## Known Gaps

- **Scope reachability is live-from-facts; the $ magnitude of a stranded lever is a
  model.** Reachable-vs-stranded is decided from real committed facts (whether each
  lever's citationRequired computation inputs are present). A reachable lever's $ band is
  real (computed by `evaluateValueLevers`); a stranded lever's $ band uses the archetype
  illustrative scale (it has no facts to compute from — that is the definition of
  stranded). The fact that closes this: the missing evidence family lands (e.g. ticket
  volumes for the volume-band lever), which both makes the lever reachable AND lets its $
  compute for real.
- **RFP protected-vs-exposed is a MODEL.** There is no structured RFP-draft in the fact
  model yet, so every lever is shown as EXPOSED ("to require"). The clause + BAFO text is
  real advisor knowledge (verbatim from the archetype playbook), but the protected/exposed
  determination is modeled. The signal that closes this: an RFP-draft signal — an
  uploaded/authored RFP whose required clauses are extracted into the fact model — at
  which point a lever whose clause the RFP requires flips to PROTECTED.
- **Benchmarks are labeled market ranges, not tenant-sourced.** The Scope/RFP benchmark
  lines are prefixed "Market range —" and are AMS-category estimates, never presented as
  Lakeshore's own numbers. A tenant-sourced benchmark would replace them when peer data
  is in the corpus.
- Live signed-in Lakeshore browser proof pending (see Deployment Authority).
