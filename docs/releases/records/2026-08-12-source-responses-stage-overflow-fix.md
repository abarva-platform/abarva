# 2026-08-12-source-responses-stage-overflow-fix — Responses stage overflow fix

## Release ID

`2026-08-12-source-responses-stage-overflow-fix`

## Status

`candidate`

## Plain-English Summary

Two further overflow defects on the Source Responses stage, found by measuring the deployed page rather than the panels in isolation.

The vendor response completeness matrix is wider than the column it sits in, so it is meant to scroll inside its own card. It did not. The card is a CSS grid and the scroll container inside it is a grid item, which defaults to `min-width: auto` — a grid item sized to its content rather than to its track. The card therefore grew to fit the 720px table and its right-hand status badges rendered on top of the Q&A panel beside it.

In the long-response intake table, the status column was 118px but holds a non-wrapping pill. The longest label, "READY FOR DECISION PROOF", is 162px, so the pill crossed into the owner column and sat over "Procurement and sponsor". "2 BLOCKERS, 6 HOLDBACKS" did the same over "Evaluation lead".

Both are fixed at the container: the matrix scroll wrapper and its card now declare `min-width: 0` so the table scrolls instead of pushing outward, and the status column minimum is raised to fit the longest pill.

Measured across the whole rendered stage at 1292, 1100 and 900px: 0 overlapping text boxes, 0 elements spilling their container, 0 run-together cells.

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

- `src/components/source/canvas/responses/CompletenessMatrix.tsx`
- `src/components/source/canvas/responses/VendorResponseIngestionPathPanel.tsx`

## QA / Validation

- Measured the **whole stage view** rendered in a browser at 1292, 1100 and 900px: 0 overlaps, 0 spills, 0 run-together cells at every width. The previous release measured panels in isolation, which is why these two defects survived it; this harness renders `ResponsesStageView` so panels are measured in their real side-by-side layout.
- Confirmed against the live deployed page before the fix: 4 overlapping text boxes and 3 spilling elements remained, all in these two panels.
- `npx jest src/components/source/canvas/responses` — 11 suites, 20 tests passed.
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
- Live signed-in proof required: Yes. The completeness matrix must scroll inside its own card, and the intake status pills must stay inside the status column.

## Rollback Plan

Revert this PR and let the repo-owned ACA main deploy workflow redeploy the prior layout. No database rollback is required.

## Audit Evidence

- PR URL: pending.
- Whole-stage browser measurements at three viewport widths, live pre-fix measurement, focused test, lint and typecheck output.
- Post-deploy ACA runtime invariant and signed-in Responses-stage measurement required after merge.

## Known Gaps

- Only the Responses stage has been measured this way. The same `min-width: auto` grid-item pattern may exist on other Source surfaces and on Home, Tower, Moves and Intelligence; no sweep has been done.
- The measurement counts intersecting text boxes and containers, so it catches overlap and spill but not subtler issues such as cramped columns or awkward wrapping.
