# 2026-07-21-tower-ava-quadrant-chart-fix — Fix silent 2x2 chart failures in Tower aVa chat

## Release ID

`2026-07-21-tower-ava-quadrant-chart-fix`

## Status

`candidate`

## Plain-English Summary

Follow-up to `2026-07-20-tower-ava-answer-discard-fix` (PR #5173). That fix addressed why Tower aVa's model answers were being discarded before reaching the client. This release addresses the separate, original finding from the 25-question eval: 0/25 chart blocks ever rendered in the chat, even on explicit 2x2/heatmap/trend asks.

Investigation found the chart-rendering pipeline (`src/lib/cio-tower/tower-chat-artifacts.ts`, a genuinely complete, recently-built feature — table→chart conversion, quadrant-matrix support, wired all the way through `TowerIndexPage.tsx` → `AtlasChatPanel` → `AgentDock` → `AnswerChartRenderer`) already exists end-to-end. It was not missing infrastructure. Live-verified in a signed-in browser session (not just code reading): asked the exact 2x2-shaped question from the eval against production, confirmed via `recharts`/SVG DOM inspection that no chart rendered from the chat response, then traced the exact cause.

Root cause: `scoreFromQuadrantLabel()` — the function that turns a quadrant-position label like "High Value / Lower Complexity" into plottable x/y coordinates — hardcoded the literal words "value" and "complexity" as the only recognized axis dimension names. The live answer's actual axes were "value" and "evidence confidence" ("High Value / **Lower Evidence**"), which the regex never matched, so every row silently failed to produce a point and the chart was dropped with no error. A second, related bug: when a "2x2" question's table has no quadrant-label column and fewer than 2 numeric columns, the code still tagged the resulting chart `kind: "quadrant-matrix"` while giving it a `{data, xKey, yKey}` shape instead of the `{points}` shape a quadrant renderer needs — an invisible, silently-broken chart object.

## Layer Impact

- `global-control-lane`: `src/lib/cio-tower/tower-chat-artifacts.ts` — the Tower aVa chat-to-chart conversion pipeline, used by every tenant's Tower chat surface. No schema, route, or config changes.

## Client Applicability

- All clients: yes — shared Tower chat rendering pipeline.
- Feature flag: none.

## Changes Included

- `src/lib/cio-tower/tower-chat-artifacts.ts`:
  - `scoreFromQuadrantLabel()` rewritten to detect generic High/Moderate/Low qualifier words in each half of a quadrant label (split on `/`), independent of which dimension name follows — instead of requiring the literal words "value" (y-axis) and "complexity" (x-axis). "No X" (e.g. "No Value Claim") returns null on purpose, excluding that point from the plot rather than guessing a coordinate for something the model explicitly flagged as having no measurable position. The exact same numeric scale is preserved (y: 82/58/35, x: 78/58/38) so labels using the original "value"/"complexity" wording plot at identical coordinates — verified by the pre-existing test still passing unchanged.
  - `chartFromTable()`: when a "2x2"-classified question's table has no quadrant-label column and fewer than 2 numeric columns, the chart now downgrades to `kind: "horizontal-bar"` (whose data shape matches what's actually being returned) instead of staying mislabeled `"quadrant-matrix"` with an incompatible shape.
- `src/lib/cio-tower/__tests__/tower-chat-artifacts.test.ts`: two new tests — one reproducing the exact live-eval failure case verbatim (5-row "value vs. evidence confidence" table, asserts 4 correct points and 1 correctly-excluded row), one covering the shape-mismatch downgrade.

## QA / Validation

- Live-verified the bug first, in a signed-in browser session against production, before writing any fix: asked "Create a 2x2 matrix of our AI initiatives by business value and evidence confidence" against the Healthcare Demo tenant, confirmed via `document.querySelectorAll('svg')`/`recharts-*` class inspection that no chart rendered from the chat turn (only pre-existing static dashboard charts were present), and confirmed no console errors — consistent with a silent, no-op failure rather than a crash.
- `npx eslint` on both touched files — clean.
- `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false --incremental false` — no errors.
- `npx jest src/lib/cio-tower` — 37 passed / 37 total (was 35/35 before this change on the same fresh worktree, immediately after the previous PR's merge; net +2 is the two new tests, no existing assertions changed).

## Rollout Plan

Merge to `main` via PR (squash merge). The repo-owned `.github/workflows/aca-main-deploy.yml` workflow auto-deploys on merge. No migration, no feature flag, no env var change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (auto-triggers on merge to `main`).
- Shared runtime mutators: none.
- ACA runtime invariant: to be confirmed post-deploy, same pattern as prior releases today.
- Live signed-in proof required: yes — re-ask the same "2x2 by value and evidence confidence" question post-deploy and confirm an actual rendered chart (SVG) appears in the chat thread, not just the decision table.

## Rollback Plan

Revert the merge commit (logic-only change, no migration or data mutation) and let `aca-main-deploy` redeploy from the reverted `main`.

## Audit Evidence

- Parent release: `docs/releases/records/2026-07-20-tower-ava-answer-discard-fix.md`, PR [#5173](https://github.com/abarva-platform/abarva/pull/5173).
- PR: (added once opened)
- Isolated-worktree test run: `npx jest src/lib/cio-tower` (37 passed / 37 total).
- Pre-fix live evidence: browser session against `https://app.abarva.ai/tower`, signed in as Healthcare Demo, DOM inspection confirming zero rendered chart SVGs from the chat turn.

## Known Gaps

- This fix addresses the quadrant/2x2 chart path specifically, since that's the exact case verified live. Other `visualContract.recommendedVisual` types (`heatmap`, `bubble`, `treemap`, `sankey`) route through `chartKindForTowerVisualContract()` to different `AnswerChartKind` values, some of which may not have a corresponding SVG builder implemented in `svg-charts.ts` — not verified in this pass. A follow-up live sweep across all `recommendedVisual` types (not just 2x2) would close that gap.
- Live signed-in re-verification of this specific fix (not just the unit test) is queued as the immediate next step after this PR deploys.
