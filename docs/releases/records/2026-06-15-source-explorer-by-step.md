# 2026-06-15-source-explorer-by-step — Workspace Explorer organized by step (Finder feel)

## Release ID

`2026-06-15-source-explorer-by-step`

## Status

`candidate`

## Release Lane

`global-control-lane`

## Plain-English Summary

The Workspace Explorer dumped every item into one flat list grouped only by *kind* (All / Deliverables /
Evidence / Approvals) — a wall of rows with raw codes and "missing" everywhere. That is not the Mac-Finder,
review-and-upload-**by-step** explorer that was designed.

This re-axes the explorer to **steps as folders**:

1. The **left nav is the lifecycle steps** (Strategy, Scope, RFP … Value) as folders, ordered by the canonical
   source lifecycle, each with its item count. ("All items" stays as a catch-all; stage-less items fall under
   "Event".)
2. Selecting a step shows **only that step's items** (human names, state, date), and above them a **"Needed for
   this step"** section derived from the canonical evidence requirements for that stage — each need shows where
   it comes from, the readiness state it must reach, and an **Upload** affordance. Required needs are flagged
   distinctly from recommended ones, so the **gaps** are obvious.
3. The right pane keeps the item preview; generate/upload panels are unchanged.

So you can now review and upload **by step**, see what each step needs vs. what's loaded, and act on the gaps —
instead of scrolling one 90-row dump.

## Layer Impact

- `global-control-lane`: presentation re-axis of `WorkspaceExplorer` — the left nav switches from kind-based to
  step-based folders (`stageOf` / `stageLabel`, ordered by `SOURCE_STAGE_ORDER`); the item list filters by step;
  a "Needed for this step" section reads `evidenceForStage(stage)` from the canonical specs. No schema, API, or
  data change — same `items` prop, same generate/upload routes.

## Client Applicability

- All clients: the Workspace Explorer is organized by step with the per-step needs panel.
- Specific clients: SkyHarbor — where the flat dump was flagged live.
- Internal only: None.
- Public/demo only: None.
- Feature flag: the Explorer surface is gated by `workspace_explorer_source` (unchanged); this is a layout
  change within it.

## Changes Included

- `WorkspaceExplorer.tsx`: step-folder nav + step filter (`stageOf`, `stageLabel`, `stageFolders`); the
  "Needed for this step" section from `evidenceForStage`; supporting styles; removed the now-unused kind nav.
- `WorkspaceExplorer.test.tsx`: assert the step folder renders and the per-step needs section surfaces.

## QA / Validation

- PASS: `npx eslint` clean · `tsc --noEmit` clean · `jest WorkspaceExplorer` 5/5 (incl. the new by-step test).
- Pending: live on ACA — open a SkyHarbor event Workspace, confirm the left nav is steps, selecting a step
  shows its items + "Needed for this step", and Upload is scoped to the step.

## Rollout Plan

Merge → CI → rebuild image → `containerapp update` → shift traffic → open the Workspace on a SkyHarbor event
and confirm the by-step layout + per-step needs.

## Rollback Plan

Revert the PR — restores the kind-based nav. No data/schema to unwind; the Explorer surface flag is unchanged.

## Audit Evidence

PR diff (step nav + step filter + needs section + test + this record), CI checks, local eslint/tsc/jest output,
the live screenshot of the flat 90-row dump that motivated it, and the post-deploy capture of the by-step
explorer.

## Known Gaps

- **Templates aren't downloadable files yet.** The "Needed for this step" rows show *what to provide* (source +
  required state) and an Upload action, but a per-requirement downloadable template doesn't exist as a file —
  that is a separate data effort. The Upload path is real today.
- **Per-need loaded/gap matching is coarse.** The needs section lists what the step requires and the item list
  shows what's loaded, but they are not yet reconciled one-to-one (a need isn't auto-ticked when a matching
  file lands). Deterministic need↔item matching is the follow-on.
