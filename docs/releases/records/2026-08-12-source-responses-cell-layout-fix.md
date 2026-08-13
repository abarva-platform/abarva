# 2026-08-12-source-responses-cell-layout-fix — Responses stage cell layout fix

## Release ID

`2026-08-12-source-responses-cell-layout-fix`

## Status

`candidate`

## Plain-English Summary

Two layout defects on the Source Responses stage made text run together or overlap on screen.

In the evaluation scorecard, each table cell stacks a heading over a supporting line — a criterion name over its guidance, a posture pill over a value over a caveat, a score over its rationale. Those children were bare inline elements with no separator, so the browser placed them on the same line and the texts joined into one string: "Normalized 5-year TCOShows cost position after transition..." and "RISK$96.4MComplete workbook with normalized run...". 36 cells were affected.

In the vendor response profiles panel, the small metric tiles (Sections, Completeness, 5-year TCO, Transition) inherited the card's body font size for their labels. "Completeness" and "5-year TCO" were then wider than their grid column and spilled sideways over the neighbouring tile, so the labels visibly overlapped each other.

Measured on the rendered page at 1292px before the fix: 63 overlapping text boxes, 6 elements spilling outside their container, 36 run-together cells. After the fix, all three counts are zero, and they stay zero at 1440, 1100, 900 and 768px.

The scorecard fix makes the cell's children block-level rather than making the cell itself a grid container, because a `<td>` with `display: grid` drops out of table layout and would break column alignment across rows. The profiles fix matches the metric size already used by the file-readiness panel on the same stage, and adds `overflow-wrap` as a backstop so no future label can spill regardless of length.

## Layer Impact

- Release lane: `global-control-lane`.
- Products: Source Responses-stage presentation only.
- Canonical model: No change.
- Source adapters: No change.
- Client intake: No change.

## Client Applicability

- All clients: Yes, all users on the Source Responses-stage canvas.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/source/canvas/responses/VendorEvaluationScorecardPanel.tsx`
- `src/components/source/canvas/responses/VendorResponseProfilesPanel.tsx`
- `src/components/source/canvas/responses/__tests__/responses-cell-layout.test.tsx` (new)

## QA / Validation

- Measured the rendered panels in a real browser at 1440, 1292, 1100, 900 and 768px: **0 overlapping text boxes, 0 elements spilling their container, 0 run-together cells** at every width. The same measurement against the pre-fix build reports 63 / 6 / 36.
- `npx jest src/components/source/canvas/responses` — 11 suites, 20 tests passed.
- The new regression test was verified to fail against the original markup before being kept: reverting one cell to bare inline children makes it fail, restoring the fix makes it pass. It pins three things — no run-together children inside a table cell, the `<td>` stays a table cell so columns stay aligned, and the metric tile constrains and wraps its label.
- `npx eslint` on both changed components — clean.
- `NODE_OPTIONS=--max-old-space-size=12288 npx tsc -p tsconfig.json --noEmit` — clean.
- `git diff --check` — clean.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — see PR body.

## Rollout Plan

Merge through PR to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the resulting `main` image. No manual runtime mutation, migration apply, or feature flag action is required.

## Deployment Authority

- Repo-owned deploy workflow: Required for production/lab activation.
- Shared runtime mutators: None in this PR.
- Approved image digest: Produced by the main deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes. The scorecard cells and the profile metric tiles must render with no run-together or overlapping text.

## Rollback Plan

Revert this PR and let the repo-owned ACA main deploy workflow redeploy the prior layout. No database rollback is required.

## Audit Evidence

- PR URL: pending.
- Before/after browser measurements at five viewport widths, focused test, lint and typecheck output from the candidate branch.
- Post-deploy ACA runtime invariant and signed-in Responses-stage screenshot required after merge.

## Known Gaps

- The measurement harness renders the two panels standalone rather than inside the full app shell, so it does not exercise the global CSS reset. Live post-deploy verification still applies.
- Only the two panels with observed defects were changed. A broader sweep of every Source surface for the same markup pattern was not performed here.
