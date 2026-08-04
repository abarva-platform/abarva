# 2026-08-04-source-workspace-agentdock-migration — Replace the Source Workspace's bespoke toolbar and aVa panel with the shared AgentDock

## Release ID

`2026-08-04-source-workspace-agentdock-migration`

## Status

`candidate`

## Plain-English Summary

Per explicit direction after live review, the Source Workspace (`/source/preview/workspace`, now the
canonical `/source` landing page) had a redundant second toolbar directly under the main AbarVa nav
— a repeated logo, an in-page back/forward history control, a search field, and an "Ask aVa" button
— plus a hand-rolled "Ask aVa" side panel that answered from a small set of hardcoded canned
responses rather than a real chat agent. The direction was: remove the second toolbar entirely, and
replace the bespoke aVa panel with the same shared `AgentDock` component (and interaction pattern —
collapsed floating chip → full expand overlay with HTML/PDF export, suggested questions, and the
standard human-approval disclaimer) already used by the Moves "Move advisor" surface.

This release does both. `AgentDock` (`src/components/agent/AgentDock.tsx`) was already a generic,
surface-agnostic component — not Moves-specific — so no changes were made to it. Source already had
one working `AgentDock` integration (`SourceEventsAgentDockView.tsx`, used on `/source/events`); this
release follows that file's proven `/api/chat/agent` wiring pattern, combined with Moves'
`defaultMode="collapsed"` / `collapsedRestoreMode="expand"` dock-mode configuration (matching the
reference screenshot), rather than `/source/events`' `side-rail` mode.

## Layer Impact

- `client-data-lane`: every changed file is scoped to
  `src/app/(maestro)/source/preview/workspace/` — the Source Workspace's own toolbar, view-model, and
  a small number of lens/canvas buttons that pointed at the removed aVa panel. `AgentDock` itself and
  its `/api/chat/agent` backend are untouched, shared infrastructure already used by Moves, Tower, and
  `/source/events` — this release only adds one more caller.

## Client Applicability

- All clients: this is the Source Workspace's UI shell, not tenant-scoped data or logic.

## Changes Included

- `WorkspaceClient.tsx`: removed the entire secondary toolbar row (repeated logo, `SOURCE` label,
  tenant name, in-page back/forward, search input, "Ask aVa" button) — the page now goes straight
  from the black `SOURCE WORKSPACE · LIVE` status strip into the Explorer/canvas grid, per direction.
  Preserved the narrow-width "Explorer" drawer toggle by moving it into the status strip (dropping it
  entirely would have left mobile/narrow viewports with no way to open the Explorer at all). Replaced
  the 3-column grid (Explorer / canvas / aVa panel) with a 2-column grid (Explorer / canvas), and
  wrapped the canvas in `<AgentDock>` — mirroring exactly how Moves wraps
  `P0OriginationContractCanvas` — with a `thread`/`onMessage` pair calling `/api/chat/agent` the same
  way `SourceEventsAgentDockView.tsx` already does, grounded in `vm.avaSurfaceContext`.
- `buildViewModel.ts`: removed `avaCanvas`/`openAvaCanvas`/`closeAvaCanvas`/`avaStyle`/`toggleAva`/
  `avaBtnBg|Fg|Border`/`avaOpen`/`avaClosed`/`openAva`/`closeAva`/`avaResult`/`pinResult`/`clearResult`
  and the `buildAvaResult()` canned-answer generator (three hardcoded response branches keyed off a
  `avaKey` — real chat via `AgentDock` replaces this outright, not a second answer source next to it).
  Reshaped the old `avaCtx`/`avaSuggestions` (built for the bespoke panel) into `avaSurfaceContext`
  (a plain object for `AgentDock`'s `surfaceContext` prop) and `avaSuggestedActions` (real
  `{id,label,body}` suggested-action objects). Simplified `shellCols`/`explorerRail` now that the
  Explorer no longer needs to auto-collapse to make room for a docked aVa panel (`AgentDock`'s
  "expand" mode is an overlay, not a grid column).
- `viewModel.tsx`: removed the now-unused `ava`/`avaKey`/`avaCanvas` state fields and
  `openAvaCanvas`/`closeAvaCanvas` methods from `WorkspaceState`/`INITIAL_STATE`/`WorkspaceViewModel`.
- Deleted `AvaPanel.tsx` and `canvases/AvaOptimizationCanvas.tsx` — both fully superseded, no other
  callers.
- `canvases/ContractCanvas.tsx`, `lenses/ExploreLens.tsx`: removed three "Ask aVa about X" contextual
  shortcut buttons (`askAvaWhy`, `askAvaOptimize`, `askAvaSlice`) that opened the old panel with a
  prefilled canned question. `AgentDock` has no external/imperative open-with-message API, so there is
  no drop-in equivalent — documented as a known gap below rather than left as dead UI.

## QA / Validation

- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit -p .`
- PASS: `npx eslint src/app/(maestro)/source/preview/workspace/`
- PASS: `npx jest src/lib/source/data-model/__tests__/ src/app/(maestro)/source/preview/workspace/__tests__/` (35/35, no regression from the numeric-coercion test added in the prior release)
- Grep-verified no remaining references to any removed `ava*` symbol or the two deleted files anywhere
  under `src/app/(maestro)/source/preview/workspace/`.
- Live signed-in proof: pending post-deploy — `/source` must show no second toolbar under the main
  nav, and a collapsed aVa chip that expands into the shared modal (HTML/PDF export, suggested
  questions, composer, approval disclaimer) matching the Moves "Move advisor" reference.

## Rollout Plan

Merge through PR to `main`; `aca-main-deploy` builds and deploys automatically. No migration, no
feature flag — this is a code-only UI change.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: assigned by the deploy workflow on merge.
- ACA runtime invariant: standard post-deploy check applies.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: required before this release is marked `released`.

## Rollback Plan

Code rollback by reverting the PR. No data mutation, no schema change — this is pure client-side UI
composition over the same governed portfolio data the Workspace already reads.

## Audit Evidence

- This PR's diff and CI run.
- `src/components/source/SourceEventsAgentDockView.tsx` — the existing Source `AgentDock` integration
  this release's backend wiring pattern is copied from.
- `src/components/strategic-moves/StrategicMoveOriginateClient.tsx` (lines ~1005–1054) — the Moves
  `AgentDock` usage (`defaultMode`/`collapsedRestoreMode`/dock-mode config) this release matches.
- Post-deploy: live signed-in screenshot of `/source` showing the single toolbar and the aVa dock in
  both collapsed and expanded states.

## Known Gaps

- Three contextual "Ask aVa about X" shortcut buttons (contract "why this surfaced", contract
  "draft the strategy", Explore-lens "about this cut") were removed rather than rewired, because
  `AgentDock` has no external imperative API to open itself with a prefilled message from another
  component. Restoring an equivalent contextual shortcut would require adding such an API to
  `AgentDock` itself — a shared-component change affecting every surface that uses it (Moves, Tower,
  `/source/events`), intentionally out of scope for this release.
- The removed toolbar's in-page search field (`vm.query`/`onQuery`, filtering the Explorer tree) and
  in-page back/forward history (`vm.back`/`vm.fwd`, distinct from browser history) no longer have any
  UI control pointing at them. The underlying state (`S.q`, `S.hist`/`S.hi`) is harmless dead
  plumbing — left in place rather than stripped further, since removing it serves no functional
  purpose and widens this release's diff for no benefit.
- Live signed-in proof against the deployed revision is still pending (see Deployment Authority).
