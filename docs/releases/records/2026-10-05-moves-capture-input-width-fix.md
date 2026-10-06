# 2026-10-05-moves-capture-input-width-fix — Moves capture: full-width field inputs

## Release ID

`2026-10-05-moves-capture-input-width-fix`

## Status

`candidate`

## Plain-English Summary

On the redesigned 3-step phase capture, the free-text answer boxes (e.g. the P1
Charter "Sponsor contact", "Scope", and "Success" fields) rendered far too
narrow — about twenty characters wide — so the placeholder and typed text
overflowed and wrapped awkwardly, and the content did not use the width of the
canvas. The cause was a missing CSS rule: the textareas carry the class
`mcf-input`, but that class was never defined, so the browser fell back to a
textarea's default `cols=20` width. This adds the `mcf-input` rule (full width,
box-sizing, and the design-locked field styling — cream/ink/teal, 10px radius,
12/14 padding, vertical resize), so every free-text field fills its column.
Purely presentational; no field, key, save, gate, or evidence behaviour changes.

## Layer Impact

Release lane: `global-control-lane` — shared Moves capture presentation. It only
renders where `moves_capture_v2` is enabled (today: the synthetic demo tenant).

- `4 PRODUCTS` (Moves): CSS only. Adds `.mcf-input` (+ `.mcf-question` width
  guards) to `MovesCaptureFlow`. No TypeScript, data, or behaviour change.

## Client Applicability

- All clients: No — renders only where `moves_capture_v2` is on.
- Specific clients: whichever tenants are in that flag's `includeTenants`
  (currently the synthetic demo tenant used for the signed-in review).
- Internal only: No.
- Public/demo only: No.
- Feature flag: rides the existing `moves_capture_v2` (no new flag).

## Changes Included

- `src/components/strategic-moves/MovesCaptureFlow.tsx` — define `.mcf-input`
  (full-width textarea with design-locked styling + focus/placeholder states)
  and `.mcf-question` width guards so structured editors and inputs cannot
  overflow the column.

## QA / Validation

- `jest` (`MovesCaptureFlow`) — **PASS**: 9/9.
- `eslint` — **PASS**: 0 errors.
- `tsc --noEmit` — **PASS**: 0 errors.
- Static before/after render harness — **PASS**: the textarea fills its column
  with the fix; without it, it falls back to ~20 columns.
- Signed-in visual walk — **NOT RUN**: can't render signed-in off the private
  data plane from a dev box; owed as part of the demo-tenant walk.

## Rollout Plan

Merge to `main` via squash PR. Ships with the next ACA web image via the
repo-owned `aca-main-deploy` workflow. No flag change — it improves the capture
surface wherever `moves_capture_v2` is already enabled.

## Rollback Plan

Revert the PR. The change is a single CSS block addition with no data or
behaviour change, so reverting restores the prior rendering immediately with no
migration or flag action required.

## Deployment Authority

No ad-hoc Azure action. Ships only via the repo-owned `aca-main-deploy` workflow
on merge to `main`; shifts no shared traffic and touches no Container App
template, revision weight, or secret.

## Known Gaps

- The dock header crowding (the agent role label beside the mode icons in a
  narrow dock) and the "Paste client notes" button placement when the dock is
  open are separate, cosmetic items not addressed here; flagged for a follow-up
  if the signed-in walk shows they matter.
- No signed-in visual proof yet (not possible off the private data plane here).

## Audit Evidence

- CI: `jest`, `tsc`, `eslint`, `npm run release:check` on the PR.
