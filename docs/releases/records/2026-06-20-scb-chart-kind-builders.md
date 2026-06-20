# 2026-06-20-scb-chart-kind-builders — Chart-kind → renderer-builder map (W4.3)

## Release ID

`2026-06-20-scb-chart-kind-builders`

## Status

`candidate`

## Plain-English Summary

Closes the output-recipe → renderer contract. The experts' recipes carry a gate-validated `chartKind`, but their free-text `chartBuilder` values were authored loosely and mostly do not match the real board-grade `svg-charts` exports (which are domain-named). This adds a single canonical map from each `AnswerChartKind` to a real `svg-charts` builder, so the W4.1 chart renderer dispatches on the validated `chartKind` and always resolves a real builder. **Additive and dormant — pure map + helper, no runtime call site.**

## Layer Impact

- **global-control-lane (additive, dormant):** new pure module `src/lib/intelligence/answer/chart-kind-builders.ts`. Consumed by the (future) W4.1 renderer; no runtime route imports it yet.

## Client Applicability

- All clients: No runtime change — dormant map.
- Specific clients: None.
- Internal only: Yes — renderer contract used by W4.1.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/intelligence/answer/chart-kind-builders.ts` — `CHART_KIND_TO_BUILDER` + `builderForChartKind()`.

## QA / Validation

Validation: Pass. `tsc --noEmit` clean. Runtime check: all 10 mapped builders resolve to real exported functions in `expert-kernel/exports/board-grade/svg-charts.ts` (imported, `typeof === "function"`), and all 10 `chartKind`s used across the 35 experts' recipes are covered. Automated unit tests: not-run as jest yet (inline tsx check captured here).

## Rollout Plan

Merge to `main`. No runtime rollout — dormant map. W4.1 (Codex) consumes it when wiring the chart renderer.

## Deployment Authority

Not applicable — additive build-time code with no runtime call sites.

- Repo-owned deploy workflow: n/a
- Shared runtime mutators: none
- Approved image digest: n/a
- ACA runtime invariant: n/a
- Worker image invariant: n/a
- Feature/env flag update path: n/a
- Live signed-in proof required: No.

## Rollback Plan

Revert the PR — no runtime call sites.

## Known Gaps

- The board-grade kit has no generic categorical `bar` or `line` builder; `bar`/`range-bar` map to `opportunityRangeBar` and `line` to `adoptionCurve` as the closest honest stand-ins. A dedicated generic bar/line builder could be added later.
- Recipes' own `chartBuilder` strings are now advisory only (the map is authoritative); a later cleanup could drop or normalize them.

## Audit Evidence

- PR URL: (filled on creation) `claude/scb-recipes` → `main`.
- CI: `npm run release:check`, `tsc` clean, builder-resolution check (10/10) in PR description.
