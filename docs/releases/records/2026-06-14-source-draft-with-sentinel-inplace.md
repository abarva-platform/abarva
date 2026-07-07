# 2026-06-14-source-draft-with-sentinel-inplace — "Draft with Sentinel" drafts in place via the left dock

## Release ID

`2026-06-14-source-draft-with-sentinel-inplace`

## Status

`candidate`

## Release Lane

`global-control-lane`

## Plain-English Summary

On the decluttered Source canvas, the Next-move card's **"Draft with Sentinel"** button navigated to the bare
Workspace (which lands on the upload panel) — pointing *away* from the Sentinel dock that is already on the
left of the same screen. That is incoherent: one intent (draft this stage's artifact with Sentinel) was
fractured across three surfaces (the left chat dock, the right card, and the Workspace generate panel).

This wires "Draft with Sentinel" to run the **same governed generation as the Workspace** — `handleArtifactGenerate`,
which persists the artifact and runs the quality gate — but **in place, narrated in the left dock**:

1. Click "Draft with Sentinel" → the left Sentinel dock posts the intent + a "drafting…" status, runs the
   governed generation (no navigation), then posts the result ("drafted and persisted … gaps are flagged, not
   invented") or an honest failure with the missing-upstream detail.
2. The artifact persists to the Workspace and the linked gate criterion clears — same as the Workspace path.
3. "Author manually" still opens the Document Explorer for hands-on writing; non-draft moves
   (advance / open gate / open evidence) are unchanged.

Net: one Sentinel, one place. The Strategy page becomes the canonical pattern every later step repeats — the
step's artifact is drafted by the dock in place, reviewed, the gate clears, you advance.

## Layer Impact

- `global-control-lane`: `UniversalCanvasShell` gains `handleDraftWithSentinel` (calls the existing governed
  `handleArtifactGenerate` and narrates it into the dock `thread`); `SourceDeclutteredWorkspace` wires the
  primary draft button to it. `stage-next-move.ts` adds `draftArtifactCode` to the resolved view (set only on
  the draft move) so the canvas knows which artifact to generate. No schema, API, or runtime-dependency change
  — generation uses the already-deployed `/artifacts/[code]/generate` route.

## Client Applicability

- All clients: "Draft with Sentinel" now drafts in place instead of navigating to upload.
- Specific clients: SkyHarbor — where the broken navigation was found live during the IT-outsourcing E2E.
- Internal only: None.
- Public/demo only: None.
- Feature flag: gated by `workspace_explorer_source` (the decluttered canvas).

## Changes Included

- `stage-next-move.ts`: `StageNextMoveView.draftArtifactCode?` set to `config.artifactCodes[0]` on the draft move.
- `UniversalCanvasShell.tsx`: new `handleDraftWithSentinel(code)` (governed generation + dock narration, with a
  double-fire guard); import `specByCode` for the artifact's display name; pass `onDraftWithSentinel` into
  `SourceDeclutteredWorkspace`; primary button routes to it when `draftArtifactCode` is set; the prior
  navigate-to-generate-panel routing is removed.
- `stage-next-move.test.ts`: assert the draft move exposes `draftArtifactCode` and the post-draft gate move does not.

## QA / Validation

- PASS: `npx eslint` clean on both files · `tsc --noEmit -p tsconfig.json` clean (only pre-existing missing
  optional deps).
- PASS: `jest stage-next-move + source-event-canvas-render` — 41/41.
- Pending: live re-check on ACA — click "Draft with Sentinel" on a SkyHarbor Strategy event → governed draft
  runs in place, the dock narrates it, the artifact persists, no navigation.

## Rollout Plan

Merge → CI → rebuild image (`az acr build`) → `containerapp update --revision-suffix` → shift 100% traffic →
click "Draft with Sentinel" on the live SkyHarbor event and confirm in-place governed draft + dock narration.

## Rollback Plan

Revert the PR — restores the prior routing (primary draft → Workspace). No data/schema to unwind; the flag also
gates the whole decluttered surface.

## Audit Evidence

PR diff (next-move field + draft handler + wiring + tests + this record), CI checks, local eslint/tsc/jest
output, and the live screenshots: the broken "Draft with Sentinel → upload page" that motivated it, plus the
post-deploy capture of the dock narrating the governed draft in place.

## Known Gaps

- The dock narration is status text, not yet a rich inline artifact card with Open / Mark-complete affordances
  in the chat thread (the result is reviewed from the Workspace). A follow-up can render the persisted artifact
  as a card directly in the dock.
- Generation runs synchronously behind the request (kept alive by the heartbeat); the broader async/durable
  end-state remains a separate follow-up.
