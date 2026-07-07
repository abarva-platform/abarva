# 2026-06-15-source-retire-legacy-surfaces — Delete orphaned Deliverables page + dead ProgressionPanel; retirement plan

## Release ID
`2026-06-15-source-retire-legacy-surfaces`

## Status
`candidate`

## Release Lane
`global-control-lane`

## Plain-English Summary
First, safe pass of the legacy-surface cleanup. Deletes the **orphaned standalone Deliverables page**
(`/source/deliverables` — 0 inbound links; pulled from the nav earlier, generation is in-context now) and the
**dead `ProgressionPanel`** code in the Workspace Explorer (no longer rendered after the by-step rework). Adds
a **retirement plan** documenting the safe sequence for removing the remaining legacy surfaces — which are
feature-flag fallbacks and must NOT be deleted until the new flow is the default.

## Layer Impact
- `global-control-lane`: removes the `/source/deliverables` route; removes `ProgressionPanel` / `ProgressionRow`
  / `NEED_KIND_META` / `PROGRESSION_*` styles + the `progression` prop from `WorkspaceExplorer`, and the now-dead
  progression computation + imports from the workspace page. No schema/API change; no behavior change (the
  deleted page was orphaned and the dead code was not rendered).

## Client Applicability
- All clients: the orphaned Deliverables route is gone; no functional change.
- Specific clients: SkyHarbor — where the cleanup was requested.
- Internal only: None. Public/demo only: None.
- Feature flag: none (removes dead/orphaned code only).

## Changes Included
- Delete `src/app/(maestro)/source/deliverables/page.tsx`.
- `WorkspaceExplorer.tsx`: remove dead ProgressionPanel cascade.
- `workspace/page.tsx`: drop the unused progression computation + imports.
- `docs/source/SOURCE_LEGACY_SURFACE_RETIREMENT_PLAN.md`: the flag-flip-then-delete plan for the rest.

## QA / Validation
- PASS: `npx eslint` clean (0 warnings) · `tsc` clean · `jest WorkspaceExplorer` 5/5.
- Confirmed `/source/deliverables` had 0 inbound links (docs-only references).

## Rollout Plan
Merge → CI → rebuild image → containerapp update → shift traffic. No user-visible change to verify beyond the
explorer still rendering by-step.

## Rollback Plan
Revert the PR — restores the orphaned page + dead code. No data/schema to unwind.

## Audit Evidence
PR diff (deletions + retirement plan + this record), CI checks, local eslint/tsc/jest output, and the inbound-
link audit showing the Deliverables page was orphaned.

## Known Gaps
- This is only the SAFE first pass. The flag-fallback legacy surfaces (old per-stage pages, EventWorkspace
  tabs, source-progression) are retired per `SOURCE_LEGACY_SURFACE_RETIREMENT_PLAN.md` — after the new flow is
  flipped to default, which itself is gated on live verification.
