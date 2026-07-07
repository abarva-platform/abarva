# 2026-06-15-source-explorer-lead-with-steps — Explorer leads with steps; Uploaded vs Pending

## Release ID
`2026-06-15-source-explorer-lead-with-steps`

## Status
`candidate`

## Release Lane
`global-control-lane`

## Plain-English Summary
The Workspace Explorer page led with a full-width "What's needed to advance" ProgressionPanel (a vertical
list with non-obvious Upload/Prepare/Generate buttons) — burying the by-step explorer below the fold. That is
not the Finder-style, upload-by-step view that was asked for.

This removes the ProgressionPanel so the page leads with the explorer: left = the lifecycle steps as folders,
right = that step's documents, each marked simply **Uploaded ✓** or **Pending** (with a working Upload that
opens the governed upload panel scoped to the step). Simple uploaded-vs-pending, aligned to the step.

## Layer Impact
- `global-control-lane`: `WorkspaceExplorer` drops the ProgressionPanel render; the per-step list shows each
  required document as Uploaded/Pending (`isRequirementUploaded` best-effort match against the step's uploaded
  items) with the existing governed Upload. No schema/API change.

## Client Applicability
- All clients: the Explorer leads with the by-step view (Uploaded vs Pending).
- Specific clients: SkyHarbor — where the ProgressionPanel-led page was flagged live.
- Internal only: None. Public/demo only: None.
- Feature flag: within the `workspace_explorer_source` surface (unchanged).

## Changes Included
- `WorkspaceExplorer.tsx`: remove ProgressionPanel render + `progression` from destructure; per-step
  Uploaded/Pending rows with badge + working Upload; Uploaded badge/dot styles.
- `WorkspaceExplorer.test.tsx`: assert the renamed "Documents for this step" heading.

## QA / Validation
- PASS: `npx eslint` (1 harmless unused-`ProgressionPanel` warning) · `tsc` clean · `jest` 5/5.
- Pending: live on ACA — open a SkyHarbor event Workspace, confirm left=steps, right=docs Uploaded/Pending,
  and that Upload opens the governed panel.

## Rollout Plan
Merge → CI → rebuild image → containerapp update → shift traffic → open the Workspace and confirm.

## Rollback Plan
Revert the PR — restores the ProgressionPanel. No data/schema to unwind.

## Audit Evidence
PR diff, CI checks, local eslint/tsc/jest output, the live screenshot of the ProgressionPanel-led page that
motivated it, and the post-deploy capture of the by-step Uploaded/Pending explorer.

## Known Gaps
- Uploaded/Pending matching is best-effort (a distinctive word in the requirement label vs uploaded item
  names); deterministic requirement↔file matching is the follow-on.
- The dead `ProgressionPanel` function is left in place (1 lint warning) to avoid a wider cascade; it can be
  removed in a cleanup pass.
- `main` branch instability (other actors resetting it) can revert this in a later deploy built off a
  regressed main — flagged for coordination.
