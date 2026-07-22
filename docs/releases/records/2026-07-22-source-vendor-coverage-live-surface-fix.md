# 2026-07-22-source-vendor-coverage-live-surface-fix — Wire the governed vendor-coverage answer to the real live Source chat surface

## Release ID

`2026-07-22-source-vendor-coverage-live-surface-fix`

## Status

`candidate` — typecheck/lint/test clean locally. Live signed-in proof to be captured after deploy.

## Plain-English Summary

Follow-up to `2026-07-22-source-vendor-coverage-governed-chat-answer` (PR #5341, merged and
deployed). That release built a real, governed, structured vendor-coverage chat answer and wired
its client-side rendering into `UniversalCanvasShell.tsx` / `AvaBottomBar.tsx`. Live-verifying it
in a signed-in browser after deploy — seeding real vendor-response facts on a real Healthcare Demo
event through the real ingestion API, then asking the vendor-coverage question in the actual
Source event chat — surfaced that **`UniversalCanvasShell.tsx` is not mounted anywhere in the live
app**. The real event page (`src/app/(maestro)/source/events/[eventId]/page.tsx`) renders
`SourceAnalyticsCanvas`, which has no chat of its own; the actual chat surface the user sees and
typed into is the platform-wide `AtlasPageStateProvider` + `AgentColumn` (rendered by `AppShell`
on every page), which already calls the same `/api/v1/source/[eventId]/nexus/ask` route but never
requested NDJSON and never rendered a structured answer.

This is the same class of defect this session has caught before (orphaned/unmounted components —
see `[[project_moves_orphaned_components_repair]]`), caught here specifically because live-proof
was attempted rather than assumed from a green test suite. The PR #5341 backend (governance gate,
`vendor-coverage-governed-answer.ts`, the route's NDJSON branch) is unaffected and correct — this
fix only moves the CLIENT wiring to the component that is actually live, and does not touch or
revert any of PR #5341's backend work.

## Layer Impact

- `global-control-lane`: `AtlasPageStateProvider.tsx` and `AgentColumn.tsx` are shared shell
  infrastructure used by every Atlas-enabled surface (Tower, Programs, Source, Intelligence, Home,
  Setup), not just Source. The new NDJSON request path and `agentAnswer` rendering are strictly
  additive and only engage when `isSourceAskSurface(surface)` is true (unchanged gating) and the
  route actually emits an `agent-answer` line — every other surface's behavior is unchanged.

## Client Applicability

- All clients: yes — no gate, no flag. Same as PR #5341: gated by real vendor-response data
  presence, not a feature flag.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/shell/atlas-page-state.ts` — added `agentAnswer?: AvaAnswerPacket` to `ChatTurn`.
- `src/components/shell/AtlasPageStateProvider.tsx` — the Source branch of `ask()` now sends
  `Accept: application/x-ndjson` and parses the route's NDJSON lines (mirroring the same
  buffer/newline-split pattern already used lower in this same file for `/api/chat/agent`'s
  streaming loop, and matching `AvaAsk.tsx`'s established parse pattern). Falls back to a plain
  `res.json()` read if the response has no body stream. The resulting `agentAnswer` is stored on
  the pushed `ChatTurn`.
- `src/components/shell/AgentColumn.tsx` — `ChatBubble` gained an `agentAnswer?: AvaAnswerPacket`
  prop, threaded from `turn.agentAnswer` at the conversation-map call site. When present, renders
  `AgentAnswerRenderer` (`showProse={false}`, since the bubble already shows the directAnswer via
  the existing `AgentResponseBody`) below the existing text/response-parts content — the same
  `AgentAnswerRenderer` component already live on Home/Intelligence/Tower.
- Tests: extended the existing `atlas-page-state-timeout.test.ts` (source-literal-assertion
  pattern, the established convention for this exact hard-to-mount client provider) with a new
  case asserting the NDJSON opt-in and agent-answer parsing exist in the real source. Also fixed
  a pre-existing, unrelated single/double-quote mismatch in that same file's earlier assertions
  (confirmed broken on `main` before this change via `git stash`; fixed forward since already
  editing this file). Added `agent-column-agent-answer.test.ts` with the same literal-assertion
  pattern for `AgentColumn.tsx` (no existing render-test harness for this "use client" component).

## QA / Validation

- `pass` — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p
  tsconfig.json` — clean on every changed file (only the pre-existing, unrelated
  `@xyflow/react`/`@dagrejs/dagre` node_modules-drift errors remain, confirmed pre-existing on
  `main`).
- `pass` — `npx eslint` on all 5 changed/new files — 0 errors, 0 warnings.
- `pass` — `atlas-page-state-timeout.test.ts` (4/4, including 1 new case + 1 pre-existing-broken
  case fixed forward) + `agent-column-agent-answer.test.ts` (1/1 new) — 5/5 pass.
- `pass` — regression sweep, `npx jest src/components/shell src/__tests__/integration/atlas
  src/lib/shell` — 2 pre-existing failing suites both before and after (confirmed identical via
  `git stash`), unrelated to this change (`atlas-ask-route.test.ts` — Tower/programs `/api/v1/
  atlas/ask` bullet-formatting; `admin-shell-vocabulary.test.ts` — CommandPalette admin-route
  labels).
- `manual` — direct network-request confirmation during discovery: typing a vendor-coverage
  question into the real Source event chat hit `POST /api/v1/source/{eventId}/nexus/ask` (the
  correct route), but the default (pre-fix) response carried no NDJSON/agent-answer — confirming
  the real gap this fix closes. Full live signed-in re-verification (real table rendering via
  `AgentAnswerRenderer`) to be captured after deploy — see Audit Evidence.

## Rollout Plan

Merge to `main` via the repo-owned ACA main-deploy workflow. No migration, no flag.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: to be recorded after merge and deploy.
- ACA runtime invariant: to be verified after merge and deploy.
- Worker image invariant: N/A.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the merge commit. Reverting restores the pre-fix behavior where the Source chat's
`AtlasPageStateProvider` path never requests or renders a structured answer (prose-only, as
before PR #5341) — no data migration either direction.

## Audit Evidence

- PR: [abarva-platform/abarva#5346](https://github.com/abarva-platform/abarva/pull/5346).
- Deploy run: to be recorded after merge.
- ACA runtime invariant: to be recorded after merge and deploy.
- Live signed-in proof: to be captured — the same Healthcare Demo event
  (`cea10d0a-6d5d-49d2-8522-173c2d6fd520`) already seeded with real vendor-response facts (Vendor
  Alpha / Vendor Beta, 4 of 6 levers each, via the real `POST /facts/ingest-file` API) during
  discovery. Ask the same vendor-coverage question in the real chat and confirm a real table
  renders.
- Test/typecheck/lint logs: see QA / Validation.

## Known Gaps

- `UniversalCanvasShell.tsx` / `AvaBottomBar.tsx` (from PR #5341) remain in the tree, now
  confirmed dead code (not mounted from any page). Not deleted here — out of scope for this fix,
  and this session's convention is not to delete speculatively. Flagged as real cleanup debt: a
  future pass should either mount them somewhere real or remove them; leaving unreachable code
  that looks live risks a repeat of this exact class of mistake.
- Same known, deliberate governance-model limitation as PR #5341: vendor-response facts are
  honestly `retrievability: "not_indexed"` / `agent_readiness_status: "not_reviewed"`; the gate
  runs with `requireAgentReady: false` by design.
