# 2026-07-22-source-vendor-coverage-ask-anything-bar-fix — Second live-surface correction: AskAnythingBar, not AgentColumn

## Release ID

`2026-07-22-source-vendor-coverage-ask-anything-bar-fix`

## Status

`candidate` — typecheck/lint/test clean locally. Live signed-in proof to be captured after deploy.

## Plain-English Summary

Second correction in the same live-verify chain as
`2026-07-22-source-vendor-coverage-live-surface-fix` (PR #5346, merged, deployed). That fix moved
the governed vendor-coverage answer's rendering from the dead `UniversalCanvasShell`/
`AvaBottomBar` to `AtlasPageStateProvider` + `AgentColumn`, reasoning that `AgentColumn` was the
real conversation-thread renderer. Re-verifying live after that deploy — asking the same seeded
vendor-coverage question in the real "Ask aVa" floating widget on the Source event page — showed
the same generic advisor-read card as before, with no vendor table, and direct DOM inspection
confirmed neither a "Conversation" label nor `AgentColumn`'s `ChatBubble` markup exist on that
page at all.

The actual component rendering the floating "Ask aVa" bar on every agent surface (confirmed by
its own header comment: *"AskAnythingBar · viewport-fixed bottom toolbar, present on every agent
surface"*) is `src/components/agent/AskAnythingBar.tsx`. It reads `AtlasPageStateProvider`'s
**transient** in-flight state (`currentResponse` / `currentResponseParts`) — not the persisted
`conversation`/`ChatTurn[]` list `AgentColumn` renders — because it shows only the latest turn's
answer in a small popup card, not a scrolling thread. `AtlasPageStateProvider` had no transient
equivalent for `agentAnswer`, so `AskAnythingBar` had nothing to read even though the prior fix's
NDJSON parsing was working correctly end-to-end at the network level (confirmed via direct request
inspection in both live-verify passes).

`AgentColumn`'s `agentAnswer` wiring from the prior fix is left in place, not reverted — its own
header comment describes a full "Mode A" sidebar conversation view, a plausible real surface
elsewhere in the shell layout spec (AgentRail), even though it isn't what renders on this
particular page.

## Layer Impact

- `global-control-lane`: `AtlasPageStateProvider.tsx` and `AskAnythingBar.tsx` are shared shell
  infrastructure used on every Atlas-enabled surface. The new `currentAgentAnswer` transient state
  and its rendering are strictly additive — `undefined` on every surface except when a real
  `agent-answer` NDJSON line arrives (currently only the Source vendor-coverage answer).

## Client Applicability

- All clients: yes — no gate, no flag. Same as the prior two records in this chain.
- Specific clients: none. Internal only: no. Public/demo only: no. Feature flag: none.

## Changes Included

- `src/lib/shell/atlas-page-state.ts` — added `currentAgentAnswer?: AvaAnswerPacket` to
  `AtlasPageState` (the transient in-flight-turn state, alongside the existing
  `currentResponse`/`currentResponseParts`).
- `src/components/shell/AtlasPageStateProvider.tsx` — added `currentAgentAnswer` state; set from
  the parsed NDJSON `agent-answer` line in the Source branch of `ask()`; cleared alongside
  `currentResponse`/`currentResponseParts` at turn start, turn end (both the Source and
  `/api/chat/agent` completion paths), and in `clearResponse()`; exposed on the context `value`.
- `src/components/agent/AskAnythingBar.tsx` — reads `pageState?.currentAgentAnswer`; included in
  `hasResponse`; renders `AgentAnswerRenderer` (`showProse={false}`, `maxHeight: 420` scroll area)
  below the existing response text/parts card when present.
- Tests: `ask-anything-bar-agent-answer.test.ts` (new, source-literal-assertion pattern matching
  the established convention for these hard-to-mount client components — no existing render-test
  harness for `AskAnythingBar.tsx` either).

## QA / Validation

- `pass` — `tsc --noEmit` clean on every changed file (same pre-existing, unrelated
  `@xyflow/react`/`@dagrejs/dagre` node_modules-drift errors only).
- `pass` — `eslint` — 0 errors, 0 warnings on all 3 changed/new files.
- `pass` — 5/5 tests pass (1 new `AskAnythingBar` case + the 4 from the prior fix, re-run
  together, confirming no regression from this additional change).
- `manual` — live-verify attempt after the prior deploy is what surfaced this gap: real network
  request confirmed hitting `nexus/ask` correctly, but the rendered popup showed the old generic
  advisor-read card, and direct DOM/body-text inspection confirmed no `AgentColumn` markup exists
  on the page. Full live signed-in re-verification (real table via `AgentAnswerRenderer` inside
  the actual "Ask aVa" popup) to be captured after this deploy.

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

Revert the merge commit. Reverting removes the transient `currentAgentAnswer` state and its
`AskAnythingBar` rendering — the popup reverts to prose/response-parts-only, matching pre-fix
behavior. No data migration either direction.

## Audit Evidence

- PR: to be recorded on open.
- Deploy run: to be recorded after merge.
- ACA runtime invariant: to be recorded after merge and deploy.
- Live signed-in proof: to be captured — same seeded Healthcare Demo event
  (`cea10d0a-6d5d-49d2-8522-173c2d6fd520`), same vendor-coverage question, asked via the real
  "Ask aVa" floating widget.
- Test/typecheck/lint logs: see QA / Validation.

## Known Gaps

- Same known, deliberate governance-model limitation as the prior two records in this chain
  (`retrievability: "not_indexed"` / `requireAgentReady: false`, deliberate).
- `AgentColumn`'s `agentAnswer` wiring (from the prior fix) has not been live-verified against a
  real page that actually mounts it (e.g. an AgentRail full-drawer surface, if one exists) — it
  compiles and is internally consistent, but this session has not confirmed a live page renders
  `AgentColumn` at all. Flagged, not chased further in this pass, since `AskAnythingBar` is now
  confirmed as the surface that matters for this feature.
