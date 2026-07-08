# 2026-07-08-source-canvas-chat-thread-render — Render the aVa Conversation Thread on the Source Analytics Canvas

## Release ID

`2026-07-08-source-canvas-chat-thread-render`

## Status

`candidate`

## Plain-English Summary

The prior release (`2026-07-08-source-canvas-real-chat-input`, #4588) mounted `AskAnythingBar` on the Source event analytics canvas so a user could type a question to aVa. Live signed-in browser testing (the explicit follow-up that release's "Known Gaps" called for) confirmed the POST to `/api/chat/agent` fires and returns 200 — but nothing renders back to the user. Not even the user's own sent question is echoed anywhere on the page. Root cause: `AskAnythingBar` is a composer only (text input + send button); the component that renders the actual conversation thread (user turns + assistant replies), `AgentColumn`, was never mounted on this canvas.

This release mounts `AgentColumn` (via the Source-specific wrapper `SentinelAgentColumn`) on the canvas, following the SAME established pattern already used by every other Source page (`SourceIndexPage`, the scorecard page, the value-ledger page, the artifact-detail page): a fixed-width `SentinelAgentColumn` as one flex child of `<main>`, with the scrollable work pane as the other. `AgentColumn` reads the identical shared `AtlasPageState` that `AskAnythingBar`'s composer writes into via `pageState.ask(...)` — both already funnel through the same `AppShell`/`AtlasPageStateProvider` tree, so no new context plumbing was needed to make the thread appear.

`AskAnythingBar` was kept mounted rather than removed. `AgentColumn` does not fully subsume it: `AskAnythingBar` carries inline file-attachment support (the "Wave 1" paperclip, extracting text client-side via `FileReader` for non-Programs surfaces) that `AgentColumn`'s own built-in composer does not have, and the existing `SourceAnalyticsCanvas.chat.test.tsx` (7 tests, from #4588) locks in `AskAnythingBar`'s specific props (`surface`, `scopeLabel`, `agent`, `placeholder`). Ripping it out would both regress the attachment feature and break a tested contract without confirmed full subsumption. The two composers coexist safely because they write into the same shared state — a message sent from either one now appears in the `AgentColumn` thread.

`SentinelAgentColumn`'s `quote`/`agentContext`/`actions` do not fabricate any stage-specific claim. `quote` reuses `honestAvaContext()` (already added in #4588) verbatim — the same "N of M steps left" / "all steps complete" line derived from `taskCompletion()`, the SAME evidence backing the page's own progress bar. A new `honestAgentActions()` helper builds the `actions` list from the same `view.tasks` evidence: up to two outstanding task titles become "What's needed for…" suggestions (using only the task's own real `title`/`subtitle`), and a final generic "What's left before the `<Stage>` gate?" action closes the list — honest even when every task is complete. No invented capability or stage-specific claim not backed by real, on-screen task data.

## Layer Impact

- `global-control-lane`: `SourceAnalyticsCanvas.tsx` is shared UI shipped behind the pre-existing `source_analytics` flag, used identically for every tenant that flag is on for. No schema, migration, or route/API change — this is purely a client composition change (mount an existing, already-tested component; derive its content from evidence the file already computes).

## Client Applicability

- All clients: Yes — all clients/tenants with `source_analytics` enabled see the live conversation thread render. Behavior for tenants without the flag is unchanged (they still render `UniversalCanvasShell`, untouched).
- Specific clients: N/A — flag-gated, not client-specific.
- Internal only: No.
- Public/demo only: No.
- Feature flag: `source_analytics` (pre-existing; no new flag introduced).

## Changes Included

- Modified: `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx` —
  - Mounts `<SentinelAgentColumn quote={honestAvaContext(resolvedStageView)} agentContext={...} actions={honestAgentActions(resolvedStageView)} surface="source-detail" />` as the first flex child of `<main>`, matching the layout already established by the scorecard/value/artifact Source pages (`<main style={{flex:1, display:'flex'}}>` with `SentinelAgentColumn` + a scrollable work pane as siblings).
  - Wraps the existing stage-rail + stage-view grid (previously the sole content of `<main>`) in a new scrollable work-pane `<div>`, unchanged in content/behavior — this is a layout restructure only, no prop or data changes to `AnalyticsStageRail`/`ScopeAnalyticsStage`/`AvaLauncher`.
  - Adds `honestAgentActions(view)`: derives up to 3 suggested actions purely from `view.tasks` (real task titles/subtitles) — never a fabricated capability.
  - `AskAnythingBar` mount is unchanged (still present, same props) — kept for its attachment support and to preserve the existing tested contract.
- New: `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.thread.test.tsx` — 1 test rendering the REAL (unmocked) `AskAnythingBar` + `SentinelAgentColumn`/`AgentColumn` composition with a mocked `fetch` (streaming-body shape matching the existing `StewardChat.attachments.test.tsx` pattern), typing a question into the real composer, submitting it, and asserting: the POST body carries `surface: "source-detail"` and `surfaceContext.sourceEventId`; the user's own sent question renders in the thread; the mocked assistant response also renders in the thread. This is the round-trip proof the prior release's "Known Gaps" called for, at the component level.

## QA / Validation

Status: pass

- PASS: `npx tsc --noEmit -p tsconfig.json`, run directly as a tracked, non-backgrounded command (exit code confirmed 0 both times) — baseline on clean `origin/main` (`25c986d1a`, #4588 included): 0 lines / 0 errors. Post-change: 0 lines / 0 errors. Net-new = 0.
- PASS: `npx eslint` on both changed/new files — 0 errors, 0 warnings.
- PASS: `npx jest src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx` — 7/7 green, unchanged (the pre-existing #4588 suite).
- PASS: `npx jest src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.thread.test.tsx` — 1/1 green (new live-thread round-trip test).
- PASS: `npx jest src/components/source/canvas/analytics/__tests__` (full directory) — 36/36 green.
- PASS: `npx jest src/components/source src/components/programs src/components/shell src/components/agent` — same pre-existing failures as clean `origin/main` baseline (`admin-shell-vocabulary.test.ts`, `SourcingReactivePanel.test.tsx`, `ProgramOriginationWorkspace.test.tsx`, `AvaAsk.test.tsx`, `AgentDock.test.tsx` — 12 tests across 5 suites), verified via `git stash -u` + rerun on unmodified `origin/main`: identical failures. None of these files import `SourceAnalyticsCanvas`, `AgentColumn`, or `SentinelAgentColumn`.
- PASS: Full repo `npx jest` run compared baseline (clean `origin/main`, `git stash -u`) vs. post-change: 332 failed suites / 683 failed tests both before and after — `diff` of the sorted `FAIL` line lists shows the identical 332 files in both runs (only timing numbers differ). Post-change adds exactly 1 passed suite and 1 passed test (the new thread test) with zero net-new failures.

## Rollout Plan

1. Merge to `main` via squash-merge PR (no direct push).
2. ACA main deploy workflow builds and deploys the new image per the standard runbook; no migration, no schema change, no new flag to flip.
3. Gated behind the pre-existing `source_analytics` flag — activates automatically for tenants already running with that flag on, no explicit flip required.
4. Post-deploy, a live signed-in browser proof (type a question, confirm both the question and the answer render in the thread) is required before calling this change live-proven.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (unchanged by this PR).
- Shared runtime mutators: None — no `az containerapp update`, no image build commands, no env/flag/secret changes.
- Approved image digest: N/A at PR time — set by the standard main-deploy workflow on merge.
- ACA runtime invariant: N/A — no runtime image, env var, or flag mutation in this change.
- Worker image invariant: N/A — no worker job touched.
- Feature/env flag update path: None — no new flag introduced.
- Live signed-in proof required: Yes, before calling this change "live-proven".

## Rollback Plan

Revert the PR. The change is additive/structural only (mounts an existing, already-used-elsewhere component; restructures one file's layout; adds one new test file) — no migration, no data write, no schema change. Rollback is a pure code revert with no data cleanup required.

## Audit Evidence

- PR: see PR URL reported alongside this record.
- CI: pending (repo is in speed-mode; local validation is authoritative per AGENTS.md).
- TypeScript: net-new errors = 0 (baseline and post-change logs both confirmed 0 lines / exit code 0).
- ESLint: 0 errors/warnings on all changed/new files.
- Jest: 8/8 green in the chat+thread test files (7 pre-existing + 1 new); 36/36 green across the full `analytics/__tests__` directory; full-repo run shows identical 332 pre-existing failing suites before and after (stash-and-compare), with the new test as the only net-new passing test.

## Known Gaps

- **Live signed-in browser proof is a required follow-up.** This release makes the conversation thread render at the component/test level; it does not itself include a live signed-in browser session confirming the same behavior against the real deployed `/api/chat/agent` route for a real tenant event. That end-to-end proof is the explicit next step before this is called live-proven.
- Visual QA of the new flex-row layout (`SentinelAgentColumn` + scrollable work pane) at various viewport widths has not been performed in a live browser in this session — the layout mirrors the established scorecard/value pages' pattern exactly, but has not been screenshot-verified here.
- Two composers (`AskAnythingBar` and `AgentColumn`'s own built-in input) are now both present on this canvas. This is intentional (see Plain-English Summary) but is a UX question worth a design pass in a follow-up: whether long-term the canvas should consolidate to one composer once/if `AgentColumn` gains attachment support, or whether the two-composer layout (thread column + floating bottom bar) is the intended durable pattern.
