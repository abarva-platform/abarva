# 2026-07-08-source-canvas-real-chat-input — Reachable aVa Chat Input on the Source Analytics Canvas

## Release ID

`2026-07-08-source-canvas-real-chat-input`

## Status

`candidate`

## Plain-English Summary

Live browser testing found a real gap: the Source event analytics canvas (the "three-beat" page rendered behind the `source_analytics` flag) had NO way to type a question to aVa. Its only chat-adjacent element, `AvaLauncher`, is a purely presentational FAB with hardcoded per-stage sample suggestion chips that do nothing when clicked, and there is no `<input>`/`<textarea>` anywhere on the page. This meant the grounded Source aVa answer-mode pipeline built across three prior releases (Phase A #4583, Phase B #4585, Phase C — all live at `/api/chat/agent`, keyed on `surfaceContext.sourceEventId` + the `source_analytics` flag) was unreachable from the actual event canvas a user works in — the backend could answer, but nothing on screen let a user ask.

This release mounts the existing, working `AskAnythingBar` composer (already used on Programs surfaces) onto the Source analytics canvas, additively, alongside the untouched `AvaLauncher`. No new chat plumbing was built: `AskAnythingBar` reads `surfaceContext` from the same `AtlasPageState` that `AppShell` already populates, and `SourceAnalyticsCanvas` already passed `surfaceContext.sourceEventId` into `AppShell` before this change — so the grounded answer-mode pipeline becomes reachable purely by mounting the composer inside the same `AppShell` tree, no new wiring to the chat route.

Separately, this release fixes a stale-data honesty bug found during the same testing: `AvaLauncher`'s banner text is a hardcoded sample claim (e.g. "Two steps left on Scope — volumetrics and the sponsor letter") that was shown on a REAL, live event where Scope was actually complete — a directly contradictory claim. The canvas now derives the launcher's status line from the SAME task-completion evidence that already drives the page's own "N of M complete" progress bar, whenever a live stage view is present and the route did not explicitly supply its own launcher content. A route-supplied `avaLauncher` is still trusted verbatim; only the otherwise-stale sample fallback is replaced.

## Layer Impact

- `global-control-lane`: `SourceAnalyticsCanvas.tsx` and `AvaLauncher.tsx` are shared UI shipped behind the pre-existing `source_analytics` flag, used identically for every tenant that flag is on for. No schema, migration, or route/API change — this is purely a client composition change (mount an existing composer; derive an existing status computation one level higher).

## Client Applicability

- All clients: Yes — any client/tenant with `source_analytics` enabled sees the new input and the corrected launcher banner. Behavior for tenants without the flag is unchanged (they still render `UniversalCanvasShell`, untouched).
- Specific clients: N/A — flag-gated, not client-specific.
- Internal only: No.
- Public/demo only: No.
- Feature flag: `source_analytics` (pre-existing; no new flag introduced).

## Changes Included

- Modified: `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx` — mounts `<AskAnythingBar agent="sentinel" surface="source-detail" scopeLabel={`${event.code} · ${stageLabel}`} />` alongside the existing `<AvaLauncher>` (additive, not a replacement). Adds `taskCompletion()` (mirrors `ScopeAnalyticsStage`'s existing done/total derivation verbatim — not re-invented) and `honestAvaContext()`, used to override the launcher's `context` line with an honest, status-derived line ONLY when a live `stageView` is present and the route did not explicitly pass its own `avaLauncher` prop. Raises the grid's bottom padding and passes a raised `bottomOffset` to `AvaLauncher` so the new fixed-position bar and the FAB do not visually collide.
- Modified: `src/components/source/canvas/analytics/AvaLauncher.tsx` — adds an optional `bottomOffset` prop (default `24`, preserving prior behavior for any other caller) so the FAB/popover can be repositioned above the new fixed bar without altering its own internals. `AvaLauncher` has no other caller in the repo, so this is a safe, backward-compatible addition.
- New: `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx` — 7 tests: (1) `AskAnythingBar` mounts with `surface="source-detail"`, `agent="sentinel"`, and an event+stage `scopeLabel`; (2) `AvaLauncher` still renders alongside it (additive); (3) structural render sanity; (4) the stale sample claim ("Two steps left…") does NOT appear when a live stage view says all tasks are complete; (5) the honest "N of M left" line is derived from the SAME live task-completion evidence when incomplete; (6) an explicitly-supplied `avaLauncher` from the route is trusted verbatim; (7) the ordinary SAMPLE launcher context is unchanged when there is no live `stageView` at all (pure sample mode, prior behavior preserved).

## QA / Validation

Status: pass

- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`, run directly under a tracked background process (no inner `&`/wrapper), completed (exit code 0), log confirmed empty (0 lines) both ways. **Baseline note:** the prompt's assumed ~126-error baseline is STALE — `origin/main` (`c334950cd`, the exact commit this branch is based on) includes `4d096281b fix(types): restore main typecheck baseline`, so the freeze has been lifted. Measured baseline tsc = 0 errors / 0 log lines (verified twice, once via an improperly-backgrounded run that was discarded, once via a correctly-tracked background Bash call). Post-change tsc = 0 errors / 0 log lines, identical. Net-new = 0. Grepped the post-change log for `SourceAnalyticsCanvas.tsx` and `AvaLauncher.tsx` — 0 matches (log is empty, so trivially true, but confirmed explicitly per the validation requirement).
- PASS: `npx eslint` on both changed files + the new test file — 0 errors, 0 warnings.
- PASS: `npx jest src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx` — 7/7 green.
- PASS: `npx jest src/components/source/canvas/analytics/__tests__` (full existing suite: `ScopeCoverageInsight.potential.test.tsx`, `StrategyStage.test.tsx`, `TaskChecklist.upload.test.tsx`, `ValueWaterfall.honesty.test.tsx`, plus the new chat test) — 35/35 green, no regressions.
- PASS (unaffected): `npx jest src/components/programs/__tests__/AgentCanvas.test.tsx` — 11/11 green, confirming Programs' existing `AskAnythingBar`/AtlasPageState usage is unaffected.
- PASS (confirmed pre-existing, unrelated): `npx jest src/components/programs` and `npx jest src/components/source` (full trees) each show 2-3 pre-existing failures (`ProgramOriginationWorkspace.test.tsx`, `SourcingReactivePanel.test.tsx`, and `UniversalCanvasShell`'s `AgentDock`-copy assertions in the integration suite) — verified via `git stash` (removing this change) + rerun on unmodified `origin/main`: identical failures, identical counts, before and after. None of the failing files import `SourceAnalyticsCanvas`, `AvaLauncher`, or anything this release touched.
- PASS: `npm run test:nav` — 26/26 green (unaffected).
- Not run in this session: `npm run test:behaviors`, `npm run test:integration` (no DB/Clerk credentials in this environment for the DB-backed suites; the targeted suites above cover every file this release touches).

## Rollout Plan

1. Merge to `main` via squash-merge PR (no direct push).
2. ACA main deploy workflow builds and deploys the new image per the standard runbook; no migration, no schema change, no new flag to flip.
3. Because the change is gated behind the pre-existing `source_analytics` flag (this component only renders when that flag is on for the tenant), no explicit flag flip is required — it activates automatically for tenants already running with that flag on.
4. Post-deploy, a live signed-in browser proof is required before calling this release live-proven — see Known Gaps.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (unchanged by this PR).
- Shared runtime mutators: None — this PR contains no `az containerapp update`, no image build commands, no env/flag/secret changes.
- Approved image digest: N/A at PR time — set by the standard main-deploy workflow on merge.
- ACA runtime invariant: N/A — no runtime image, env var, or flag mutation in this change; the existing `source_analytics` flag path already governs activation.
- Worker image invariant: N/A — no worker job touched.
- Feature/env flag update path: None — no new flag introduced.
- Live signed-in proof required: Yes, before calling this change "live-proven" — see Known Gaps.

## Rollback Plan

Revert the PR. The change is additive (one new composer mounted alongside the untouched `AvaLauncher`; one new optional prop on `AvaLauncher` with a default that preserves prior behavior for any other caller, of which there are none today; one new test file). No migration, no data write, no schema change — rollback is a pure code revert with no data cleanup required.

## Audit Evidence

- PR: see PR URL reported alongside this record.
- CI: pending (repo is in speed-mode; local validation is authoritative per AGENTS.md).
- TypeScript: net-new errors = 0 (baseline and post-change logs both empty/0 lines; baseline confirmed genuinely 0 — not the stale ~126 figure — because `origin/main` already includes the `main typecheck baseline` restoration commit `4d096281b`).
- ESLint: 0 errors/warnings on all changed/new files.
- Jest: 35/35 green in `src/components/source/canvas/analytics/__tests__` (28 pre-existing + 7 new); Programs' `AgentCanvas.test.tsx` (11/11) confirms no regression to the existing `AskAnythingBar` usage on Programs surfaces; pre-existing unrelated failures in `ProgramOriginationWorkspace.test.tsx` / `SourcingReactivePanel.test.tsx` / the `UniversalCanvasShell` integration suite confirmed identical before and after via stash-and-compare.

## Known Gaps

- **Live signed-in browser proof is a required follow-up.** This release makes the chat input REACHABLE on the Source analytics canvas and fixes the stale launcher claim; it does not itself include a live signed-in browser session proving a real typed question flows through `AskAnythingBar` → `/api/chat/agent` → the grounded Source aVa answer-mode pipeline (Phase A/B/C) → a rendered answer, for a real tenant event. That end-to-end round-trip proof is the explicit next step before this is called live-proven, per the runtime invariant discipline.
- The `AvaLauncher` FAB's raised position (`bottomOffset={112}`) and the canvas's increased bottom padding were sized from `AskAnythingBar`'s approximate rendered height (eyebrow + input row + padding); this has not been visually confirmed in a live browser in this session. A visual QA pass alongside the live-proof pass above should confirm no residual overlap at various viewport widths.
- `AgentDock.tsx` (the 2,325-line shared chat rail used by other agent surfaces) was intentionally left untouched, per scope — this release does not evaluate whether `AgentDock` should eventually also mount on this canvas.
