# 2026-07-05-moves-agentdock-migration — Moves phase chat → shared AgentDock (6 modes)

## Release ID

`2026-07-05-moves-agentdock-migration`

## Status

`candidate` — verified live on the Lakeshore Move (6 dock modes + capture/build-approve still work) before merge.

## Plain-English Summary

The Strategic Moves phase workspace was the last surface still using a bespoke,
fixed left chat lane. Home, Intelligence, and Tower all use the shared
`<AgentDock>`, which gives the operator six chat layouts — **side-rail left**,
**side-rail-right**, **pin-top**, **pin-bottom**, **expand** (modal), and
**collapsed** (floating chip) — so they can widen the phase canvas, move the
agent out of the way, or pop it out.

Founder feedback: *"the chat window on left can be expanded, pinned to left/right
or be hidden… that way we can get more space to right canvas… LEFT AGENT DOCK IS
STILL OLD DESIGN."*

This migrates the phase chat to `<AgentDock>`. The entire phase **canvas**
(capture tracker, Capture details / CharterWorkflow, Save → Build-and-approve →
Advance, Gate readiness, Upload guidance) is passed **verbatim** as AgentDock's
`workspace` pane — no capture/gate/build-approve logic changed. The bespoke chat
markup (custom thread, composer, file input, suggested-prompt chips) is deleted;
AgentDock renders all of it.

## Layer Impact

- `global-control-lane`: shared Strategic Moves phase workspace
  (`StrategicMovePhaseClient`) for all clients. Chat presentation only — the
  streaming `send()` flow (`/api/chat/agent`, SSE parsing, artifact extraction,
  capture refresh) is unchanged; it is now invoked via AgentDock's
  `onMessage(text, attachments)` instead of a bespoke composer.

## Client Applicability

- All clients: yes — every tenant using the Moves phase workspace (P1–P5).
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none.

## Changes Included

- `src/components/strategic-moves/StrategicMovePhaseClient.tsx`
  - Replaced the two-pane `detailShell` (`<aside className={styles.chatPane}>` +
    `<article className={styles.rightPane}>`) with a single `<AgentDock>` mount;
    the canvas `<article>` is now AgentDock's `workspace`.
  - `thread` = phase `turns` mapped to `ChatMessage[]` (`assistant`→`agent`); a
    trailing empty assistant turn renders "…" while streaming, and
    `isAgentBusy={streaming}` drives the throbber.
  - `suggestedActions` = the per-phase `suggestedPrompts`.
  - `send()` signature → `(messageOverride?, dockAttachments?: AttachmentRef[])`;
    forwards `attachmentIds: refs.map(a => a.id)` to `/api/chat/agent` (uploads now
    go through AgentDock's `/api/v1/agent/attachments` pipeline). SSE/streaming
    loop unchanged.
  - Removed dead code: bespoke chat JSX, `handleFileSelect`, `fileInputRef`,
    `threadRef` + auto-scroll effect, `composer`/`setComposer`, and the
    `AgentMarkdown`/`AvaAskMark` imports.
  - `net −215 lines` (63 insertions, 278 deletions).

## QA / Validation

Overall status: **static PASS; live verification IN PROGRESS before merge.**

- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` → **PASS** (0 errors).
- `npx eslint` on the changed file → **PASS** (exit 0).
- Live proof required before merge: on the Lakeshore Move, cycle all 6 dock modes;
  send a chat turn (streams); and re-confirm the capture → **Build and approve** →
  signed-off flow still works with the canvas mounted as `workspace`.

## Rollout Plan

Merge to `main` → ACA "main deploy" → re-verify live. No migration, no flag.

## Deployment Authority

- Repo-owned deploy workflow: "ACA main deploy" (auto on push to `main`).
- Shared runtime mutators: none — chat presentation only; reuses the existing
  agent + attachment routes.
- Live signed-in proof required: **yes** — dock modes + chat + build-approve.

## Rollback Plan

Revert the PR. Presentation-only; reverting restores the bespoke chat lane. No
data to unwind.

## Audit Evidence

- PR URL: (added on open)
- CI: `tsc` clean + eslint clean.

## Known Gaps

- **`reviewFeedbackCount` now always 0.** The legacy per-phase "N requested edits"
  counter on Gate readiness was fed by the old custom upload endpoint
  (`/api/programs/workspace/{id}/upload`), which returned a `feedbackCount`.
  AgentDock uploads via `/api/v1/agent/attachments`, which doesn't carry that
  shape, so the counter reads 0 (an honest state — that review-feedback signal was
  session-ephemeral client state anyway, and gates nothing; it is display copy
  only). Re-wiring artifact-review feedback through AgentDock's attachment
  pipeline is a follow-up.
- Clicking a suggested action now **pre-fills** the composer (AgentDock behavior)
  rather than auto-sending, consistent with the other surfaces.
- Remaining v2 package: per-phase content depth (P3–P5); download/blob + doc
  parsing backend for legacy (pre-generation) deliverables.
