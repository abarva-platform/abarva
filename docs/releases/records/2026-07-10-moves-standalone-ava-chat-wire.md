# 2026-07-10-moves-standalone-ava-chat-wire — Wire real aVa chat into the standalone Moves workspace

## Release ID

`2026-07-10-moves-standalone-ava-chat-wire`

## Status

`candidate`

## Plain-English Summary

Every release record for today's "standalone Moves" migration (explorer platform default, gate
capture/signoff, phase canvas/CTA/how-to polish) listed the identical Known Gap: "Live signed-in
proof is pending deployment." Live-checking it found the concrete instance of that unverified
claim: the "Ask aVa" panel on the new standalone phase workspace (`MovesPhaseStandaloneClient.tsx`)
had three suggested-question buttons with **no `onClick` handler at all**, and no way to type a
custom question — clicking them did nothing. The panel showed real, Move-specific context text but
had zero actual chat wiring.

This release ports the working `send` logic from the retired `StrategicMovePhaseClient` (same
`/api/chat/agent` endpoint, same `surfaceContext` shape) into the new standalone client: the three
suggested questions now actually send, and a composer (textarea + Send button, Enter-to-send) lets
a user ask anything. Responses stream in and render in a real thread inside the same popover.

Critically preserves the `programId` fix from earlier this session:
`canonicalizeSurface` (`src/lib/agent/surface.ts`) reads `surfaceContext.programId` specifically,
not `moveId` — omitting it previously made aVa answer "No active Move session is visible." Both
fields are sent, matching the proven-live payload shape.

## Layer Impact

- `global-control-lane`: `MovesPhaseStandaloneClient.tsx` is the sole phase-workspace implementation
  for all tenants after today's migration — this fix applies platform-wide, no flag.

## Client Applicability

- All clients: yes — no tenant gating, no feature flag.

## Changes Included

- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`: added `AvaChatMessage` type,
  `avaThread`/`avaInput`/`avaStreaming` state, and a `sendAvaMessage` function (ported from the
  retired `StrategicMovePhaseClient`'s `send`, same endpoint/payload shape, same 180s hang-guard
  abort). Wired the three suggested-question buttons to call it. Added a composer (textarea + Send
  button, Enter submits / Shift+Enter newlines) since none existed before. Added CSS for the
  message thread and composer, matching the existing `mxw-ava-*` visual language.
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`: added two
  regression tests — one asserting a suggested-question click sends the correct `programId` in
  both the top-level body and `surfaceContext` (guards the exact prior regression) and renders the
  streamed response; one asserting the composer accepts typed input, sends it, clears the field,
  and renders the response. Polyfilled `TextEncoder`/`TextDecoder`/`ReadableStream` in the test
  file — jsdom's test environment doesn't provide these globally, though the component runs in a
  real browser in production where all three always exist.

## QA / Validation

- `npx eslint` on both changed files: PASS — 0 errors (isolated git worktree off `origin/main`,
  symlinked `node_modules`).
- `NODE_OPTIONS="--max-old-space-size=8192" npx tsc --noEmit -p .`: PASS — 0 errors, same worktree.
- `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`: PASS —
  4/4 tests (2 pre-existing + 2 new).
- Live post-deploy proof: NOT YET RUN — pending merge/deploy. Plan: open a real Move's phase page,
  click "Ask aVa," click a suggested question, confirm a real streamed answer renders (not a dead
  button); separately type a custom question and confirm it sends and renders.

## Rollout Plan

Merge to `main` → `aca-main-deploy.yml` builds/deploys → verify ACA runtime invariant → open a live
Move's phase workspace, click "Ask aVa," click a suggested question and confirm a real answer
streams in; type a custom question and confirm the same.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: to be confirmed post-merge.
- ACA runtime invariant: to be verified via `scripts/deploy/check-aca-runtime-invariant.mjs`.
- Worker image invariant: unaffected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes — see Rollout Plan. This release exists specifically because
  the prior six migration releases skipped this step; do not repeat that gap here.

## Rollback Plan

Revert the commit. Purely additive (new state, new function, new composer markup/CSS) — the
existing suggested-question buttons and popover shell are unchanged except for the added
`onClick`; no data, migration, or flag impact.

## Audit Evidence

- Confirmed dead via direct code read: `git grep -l "Ask about this phase"` on `origin/main` found
  `MovesPhaseStandaloneClient.tsx`; the button JSX had no `onClick` prop and no `onClick`/`onSubmit`
  handler existed anywhere in the file prior to this change.
- Traced the correct fix by retrieving the retired `StrategicMovePhaseClient.tsx`'s `send` function
  from git history (commit `fd7f62a88`, the last commit before it was deleted in the sunset
  migration) rather than reinventing the chat-send mechanics or the `programId` fix from scratch.
- This is the first live-verification pass any of today's six standalone-Moves release records has
  actually received — every one of them shipped on unit tests + typecheck only.

## Known Gaps

- This fixes the chat *send* mechanism only. It does not add rich artifact rendering (the retired
  client's inline gate-update/pattern-match cards) — responses render as plain streamed text.
  Revisit if the standalone workspace needs that richness later.
- The composer has no attachment/paperclip support, unlike `AgentDock`. If file-attached questions
  become a real need here, that's separate, larger scoped work (likely swapping to `AgentDock`
  properly rather than extending this lightweight popover further).
