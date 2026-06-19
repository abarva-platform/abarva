# 2026-06-19-source-draft-loading-state — Loading feedback for Draft-with-Sentinel

## Release ID

`2026-06-19-source-draft-loading-state`

## Status

`candidate`

## Plain-English Summary

On the Source canvas, clicking "Draft with Sentinel" starts a governed document
generation that takes several seconds, but the button gave no feedback — so it
looked broken even though the document was being written. This threads the
existing in-progress state into the next-move card: while drafting, the primary
button reads "Drafting…", is disabled, and shows a wait cursor. Found live during
First Capital QA, where the generated memo was excellent but the click felt dead.

## Layer Impact

- `global-control-lane`: two Source canvas components (`StageNextMoveCard.tsx`,
  `UniversalCanvasShell.tsx`). UI feedback only — no generation/behavior change;
  reuses the existing `pendingGenerationByCode` state.

## Client Applicability

- All clients: yes — Source canvas next-move card.
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none.

## Changes Included

- Branch `fix/source-draft-loading-state`. `StageNextMoveCard` gains a `pending`
  prop (disabled + "Drafting…" + wait cursor); `UniversalCanvasShell` passes
  `draftPending` from `pendingGenerationByCode[nextMove.draftArtifactCode]`.

## QA / Validation

- `eslint` on both files → **PASS** (exit 0).
- Typecheck — **runs in CI**.
- Post-deploy live re-verification on the First Capital event canvas — **pending**.

## Rollout Plan

Merge to main → ACA build/deploy → re-pin traffic to the new main revision.

## Rollback Plan

Revert the commit. UI-only; nothing persistent.

## Audit Evidence

- PR: (filled on open) `fix/source-draft-loading-state`
- Live observation: "Draft with Sentinel" gave no feedback during a >45s
  generation that did complete server-side.

## Known Gaps

This adds feedback but does not make generation asynchronous. Source generation
is still synchronous/slow (>45s, timeout-prone); porting the Moves durable-worker
enqueue pattern is the larger follow-up and is out of scope here.
