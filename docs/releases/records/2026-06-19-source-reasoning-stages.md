# 2026-06-19-source-reasoning-stages — Analysis + Recommendation stages + resolver (Phase 1, Slices 1.3/1.4/1.5)

## Release ID

`2026-06-19-source-reasoning-stages`

## Status

`candidate`

## Plain-English Summary

Completes the **pure reasoning spine**: the archetype resolver (which frameworks to
run for a given archetype/rigor/stage), the Analysis stage (runs the resolved
frameworks → structured findings), and the Recommendation stage (turns findings
into exactly one Reasoning Envelope). Honest by construction: only evidence-anchored
findings become claims; the classifier becomes an assumption; and when no
gate-defining claim rests on usable evidence, it emits a grounded **refusal** with a
minimum-data request instead of a fabricated recommendation. **Still dormant — the
live generate path is untouched; nothing calls these yet** (the flag-gated wiring is
Slice 1.6).

## Layer Impact

- `global-control-lane`: new dormant code under `src/lib/source/reasoning/`. No
  schema/data/runtime change. Reuses Slice 1.0 (envelope + gate) and Slice 1.2
  (framework registry + adapter).

## Client Applicability

- All clients: shared but **inert** until Slice 1.6 wires it behind a flag.
- Specific clients: n/a · Internal only: no · Public/demo only: no · Feature flag: none (dormant)

## Changes Included

- `archetype-resolver.ts` (1.4) — `resolveAnalysisPlan(archetype, rigor, stage)`.
- `analysis-stage.ts` (1.3) — `runAnalysisStage(ctx)` → resolved frameworks + results + skipped.
- `recommendation-stage.ts` (1.5) — `runRecommendationStage(ctx, analysis, {envelopeId, now})` → one ReasoningEnvelope (+ refusal path).
- `__tests__/reasoning-stages.test.ts`.

Stacked on Slices 1.0 (#3704, merged) and 1.2 (#3705).

## QA / Validation

- `jest src/lib/source/reasoning/` → **PASS** (22/22 across envelope-gate + registry + stages).
- The Recommendation stage's output is validated through the 1.0 gate in tests
  (both the refusal path and the evidence-anchored-claims path pass).
- `eslint` → **PASS** (exit 0). Typecheck — CI.

## Rollout Plan

Merge after Slice 1.2. No runtime effect (dormant). No migration/flag.

## Rollback Plan

Revert the commit. Dormant; nothing on the live path depends on it.

## Audit Evidence

- PR: `feat/source-reasoning-stages`. Tests 22/22.
- Plan: `docs/codex-handoff/SOURCE_INTELLIGENCE_OS_PHASE1_BUILD_PLAN.md`.

## Known Gaps

The Recommendation stage's challenge model + risk-scoring are foundational (claims
are marked challenged; full steelman/EV deepen later). Real recommendations require
the evidence-anchored frameworks (should-cost etc.) to be wired — until then the
stage honestly refuses. The next live-touch slice is **1.6** (flag-gated route
wiring); **1.1** (classify-at-intake) still needs its additive migration.
