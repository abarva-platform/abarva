# 2026-06-15-source-explorer-docs-only — Explorer right pane = documents only (no scaffold dump)

## Release ID
`2026-06-15-source-explorer-docs-only`

## Status
`candidate`

## Release Lane
`global-control-lane`

## Plain-English Summary
The by-step explorer's right pane still dumped raw substrate rows under "Also in this step" — internal
requirement placeholders (`EVID SRC DEC FINALIST PRICING · MISSING`) and gate-criterion/approval rows
(`GATE DEC 01 · REVIEW`) — and the left counts counted those scaffold rows (97, 12, 14…). None of that is a
document.

This makes the right pane **documents only**: per step it shows the canonical documents, each **Uploaded ✓**
(clickable to preview the matched file) or **Pending** (with Upload). Real uploaded files / generated drafts
that aren't tied to a requirement appear under "Other documents" with their real names. The scaffold noise
(missing-state placeholders, gate/approval rows) is filtered out entirely. The left counts now show the number
of **documents per step**, not substrate rows.

## Layer Impact
- `global-control-lane`: `WorkspaceExplorer` — right pane renders `docRows` (requirement ↔ matched file) +
  `extraDocs` (real uploads only); `realDocs` filters out `kind: approval` and `state: missing`; the raw
  `filtered.map` dump is removed; stage counts use `evidenceForStage(stage).length`. No schema/API change.

## Client Applicability
- All clients: the explorer right pane shows documents (Uploaded/Pending), not scaffold rows.
- Specific clients: SkyHarbor — where the dump was flagged live.
- Internal only: None. Public/demo only: None.
- Feature flag: within `workspace_explorer_source` (unchanged).

## Changes Included
- `WorkspaceExplorer.tsx`: docs-only right pane (`realDocs`/`matchedDoc`/`docRows`/`extraDocs`); per-step
  document counts; remove the raw item dump + now-unused `stateTone`/`STATE_STYLE`/`ITEM_TOPLINE_STYLE`/
  `NEED_ROW_STYLE`; add `docRowStyle`.

## QA / Validation
- PASS: `npx eslint` clean (0 warnings) · `tsc` clean · `jest WorkspaceExplorer` 5/5.
- Pending: live on ACA — open a step, confirm only Uploaded/Pending documents show (no EVID/GATE codes) and the
  counts are small.

## Rollout Plan
Merge → CI → rebuild image → containerapp update → shift traffic → open a Workspace step and confirm.

## Rollback Plan
Revert the PR — restores the raw item dump. No data/schema to unwind.

## Audit Evidence
PR diff, CI checks, local eslint/tsc/jest output, the live screenshot of the scaffold dump that motivated it,
and the post-deploy capture of the documents-only pane.

## Known Gaps
- Requirement ↔ file matching is best-effort (distinctive word in the requirement label vs file name); a
  deterministic key is the follow-on. Unmatched real uploads still surface under "Other documents" so nothing
  is hidden.
