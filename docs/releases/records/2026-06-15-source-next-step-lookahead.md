# 2026-06-15-source-next-step-lookahead — Canvas previews what the next step needs

## Release ID

`2026-06-15-source-next-step-lookahead`

## Status

`candidate`

## Release Lane

`global-control-lane`

## Plain-English Summary

Operators discovered each stage's data needs reactively — only once they got there. This adds a calm
**"Next: <stage> will need — start gathering"** panel to the decluttered Source canvas, listing the *next*
stage's required evidence (e.g. on Strategy it shows Scope's needs: application inventory, ticket history, org
baseline, contract baseline) with a link to open that stage in the Workspace.

It is **spec-driven** (`nextStepNeeds` reads the canonical evidence requirements one stage forward) and therefore
identical on every stage — Strategy previews Scope, Scope previews RFP, and so on. This is the "see what's next"
move of the universal step loop, not a P0/Scope special-case.

## Layer Impact

- `global-control-lane`: a pure helper `nextStepNeeds(stage)` (next stage + its required evidence from
  `evidenceForStage`) and a calm `NextStepLookahead` panel rendered at the foot of the decluttered canvas
  (`SourceDeclutteredWorkspace`). No schema, API, or data change.

## Client Applicability

- All clients: the decluttered canvas previews the next stage's needs.
- Specific clients: SkyHarbor — the live IT-outsourcing event this was requested against.
- Internal only: None.
- Public/demo only: None.
- Feature flag: lives on the decluttered canvas, gated by `workspace_explorer_source` (unchanged).

## Changes Included

- `next-step-needs.ts`: pure `nextStepNeeds(stage)` → `{ nextStage, nextStageLabel, needs }` (required evidence
  of the following stage), plus `next-step-needs.test.ts`.
- `UniversalCanvasShell.tsx`: `NextStepLookahead` panel + styles; rendered above the canvas footer.

## QA / Validation

- PASS: `npx eslint` clean · `tsc --noEmit` clean · `jest next-step-needs + source-event-canvas-render` 39/39.
- Pending: live on ACA — open a SkyHarbor Strategy event, confirm the "Next: Scope will need" panel lists
  Scope's required evidence with the Workspace link.

## Rollout Plan

Merge → CI → rebuild image → `containerapp update` → shift traffic → open a SkyHarbor event and confirm the
look-ahead panel.

## Rollback Plan

Revert the PR — removes the panel + helper. No data/schema to unwind; the canvas surface flag is unchanged.

## Audit Evidence

PR diff (helper + panel + tests + this record), CI checks, local eslint/tsc/jest output, and the post-deploy
capture of the look-ahead on a live event.

## Known Gaps

- The look-ahead lists the next stage's **required** evidence by name; it does not yet show per-item loaded/gap
  status or downloadable templates (those are the by-step explorer's job and the templates follow-on).
- It previews only the immediate next stage, not a full all-remaining-stages data map (deliberate — keeps it to
  the essentials).
