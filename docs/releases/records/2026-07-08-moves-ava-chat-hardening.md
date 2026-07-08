# 2026-07-08-moves-ava-chat-hardening — Moves aVa chat hardening (increment 1)

## Release ID

`2026-07-08-moves-ava-chat-hardening`

## Status

`candidate`

## Plain-English Summary

Moves aVa (the Nexus chat agent inside Strategic Moves phase workspaces) previously answered from generic context (tenant name, phase label, evidence *count*, latest gate action) with no phase-grounded contract and no scope discipline. This release adds a deterministic hardening layer, modeled on the Nexus voice doctrine and Source aVa's answer-quality-gate patterns already in this codebase:

- **`MovesAvaChatPacket`** (`src/lib/programs/ava-chat/packet.ts`) — a structured grounding packet built from whatever real Move state is available this turn (checklist status, gate criteria, evidence needs, feed-forward, approved-inputs-pack presence). Anything not loaded is recorded in `missingInputs` with a caveat instruction rather than silently omitted or guessed — "a phase should never start blank, but chat must never fake depth it doesn't have."
- **Answer-mode classifier** (`answer-modes.ts`) — deterministic keyword/regex classification into the 12 specified Moves-chat answer modes (`phase_guidance`, `evidence_gap`, `upload_mapping`, `draft_final_change`, `next_phase_readiness`, `gate_blocker`, `solution_lane_explanation`, `workshop_preparation`, `source_implication`, `tower_measurement`, `risk_control`, `out_of_scope_redirect`), plus a bounded redirect for ad hoc broad-strategy questions (points to Intelligence, never a flat refusal).
- **Source/Tower awareness** (`source-tower-awareness.ts`) — keyword scan of the question text; when vendor/contract/commercial terms appear, the packet carries a Source-workstream suggestion; when value/metric/adoption terms appear, it carries a Tower-metric-contract suggestion.
- **Banned-language guard** (`banned-language.ts`) — deterministic post-hoc scan for three categories: Claude-deflection language, internal-ID/schema leaks (UUIDs, `moveId`/`programId`/table names), and workflow-bypass claims ("I've approved," "promoted to enterprise context," etc.).
- **Quality gate** (`quality-gate.ts`) — 8 named checks (direct answer, Move/phase grounding, deterministic-state usage, caveat-when-incomplete, next action, banned language, Source/Tower mention when relevant) with a repair-instruction list per failed check. Violations-only, no auto-repair inside the module (the caller decides) — same pattern as `checkNexusVoice` and the Source answer-quality-gate.
- **Route wiring** (`src/app/api/chat/agent/route.ts`) — flag-gated (`moves_ava_chat_hardening`), additive-only: builds the packet from the engagement/evidence/gate data already loaded for `/strategic-moves/<id>/phase/<n>` surfaces, classifies the question, and appends a compact grounding block to the existing system prompt. Falls back to the pre-existing phase-pack-only prompt on any error — never blocks the chat turn.

**Product rule preserved:** chat is additive to the workflow. The phase remains completable with chat off. Nothing in this release lets chat upload evidence, confirm a template mapping, confirm What Changed, approve a phase, advance a gate, or promote to enterprise context — those all still require the existing UI actions.

## Layer Impact

- **global-control-lane**: new pure library module `src/lib/programs/ava-chat/` (no DB access, no side effects); additive wiring in the shared chat route `src/app/api/chat/agent/route.ts` (new imports + one new `let` + one `if` block inside the existing `programId` enrichment branch + one array entry in the existing prompt-block list); one new flag in `src/lib/features/registry.ts`.
- No schema, migration, or new route changes.

## Client Applicability

- All clients: No — new flag defaults OFF (tenant policy).
- Specific clients: Lakeshore (first proof tenant for `moves_ava_chat_hardening`).
- Internal only: No.
- Public/demo only: No.
- Feature flag: `moves_ava_chat_hardening` (tenant policy, `includeTenants: ["lakeshore"]`).

## Changes Included

- `src/lib/programs/ava-chat/` (new): `types.ts`, `packet.ts`, `answer-modes.ts`, `source-tower-awareness.ts`, `banned-language.ts`, `quality-gate.ts`, `system-prompt.ts`, `index.ts`, and `__tests__/` (5 suites, 37 tests).
- `src/app/api/chat/agent/route.ts` — additive import + flag-gated packet-building/injection for `/strategic-moves/*` surfaces.
- `src/lib/features/registry.ts` — new `moves_ava_chat_hardening` flag entry.

## QA / Validation

- `npx jest src/lib/programs/ava-chat --runInBand` — 5 suites / 37 tests passed, covering all 12 specified prompts' answer-mode classification, Source/Tower awareness, banned-language categories, packet no-blank-prompt guarantee, and quality-gate pass/fail cases with repair instructions.
- `NODE_OPTIONS='--max-old-space-size=6144' ./node_modules/.bin/tsc --noEmit --pretty false --incremental false` — 0 errors, full repo.
- `npx eslint src/app/api/chat/agent/route.ts src/lib/programs/ava-chat/ src/lib/features/registry.ts` — 0 errors (1 pre-existing unused-var warning on an unrelated import, confirmed present before this change via `git stash` diff).
- `npx jest src/app/api/chat/agent/__tests__ src/lib/programs src/lib/features src/lib/agent --runInBand` — confirmed identical failure count before/after this change via `git stash` (15 pre-existing failing suites / 23 pre-existing failing tests, unrelated to this change — e.g. `steward-trust-spine-wiring.test.ts` string-match assertions and an unrelated industry-profile coverage test); no new failures introduced.
- Live signed-in browser smoke test on Lakeshore for the 6 specified prompts: pending, see Known Gaps / Audit Evidence (to be captured post-deploy).

## Rollout Plan

Standard Code-lane PR → squash-merge to `main` → `aca-main-deploy.yml` auto-builds and deploys to `ca-abarva-web-lab-eastus`. Flag change takes effect immediately for Lakeshore on the new revision; no migration, no worker job, no env var change required (an env-var allowlist override path exists per the flag's summary but is not used here).

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (unchanged).
- Shared runtime mutators: None — deploy only via the repo-owned workflow on merge.
- Approved image digest: whatever `aca-main-deploy.yml` produces for this merge commit (verify post-merge per the runtime-invariant check the workflow runs itself).
- ACA runtime invariant: to be confirmed post-deploy (same pattern as the prior Moves cross-tenant rollout release — the workflow's own verification step gates traffic shift).
- Worker image invariant: N/A — no worker-job code touched.
- Feature/env flag update path: in-code `includeTenants` array.
- Live signed-in proof required: Yes — Lakeshore, the 6 specified prompts (see Known Gaps).

## Rollback Plan

Revert the single commit (or drop Lakeshore from `moves_ava_chat_hardening`'s `includeTenants`), merge, redeploy. No data migration. The wiring is wrapped in a try/catch that falls back to the pre-existing phase-pack-only prompt on any error, so even a runtime failure in the new packet builder degrades gracefully rather than breaking the chat turn — this is true even without a rollback, but the flag/revert path remains the clean way to fully remove the new behavior.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/4593 (merged as `0fbfdd9378ac460ae7e813cdb6222290c6b261d7`)
- CI run (all 21 checks passed): https://github.com/abarva-platform/abarva/pull/4593/checks
- Deploy run (success, runtime invariant verified — digest `sha256:1d5201f00d83c52d4bae21ee2187750a23644c5984c88abf81b600a4b3f13f3c`): https://github.com/abarva-platform/abarva/actions/runs/28966894228
- Live smoke-test proof, Lakeshore: `proof/moves-ava-chat-hardening-live-2026-07-08/README.md`. **Important finding, not a success confirmation:** the live pass discovered that `programId` does not appear to reach `/api/chat/agent` for the live `/strategic-moves/<id>/phase/<n>` chat panel — on a fresh, single-turn conversation on this exact Move's phase page, aVa stated "No active Move session is visible in this conversation." Because the new hardening block (like the pre-existing "Active program" context and phase pack) only builds inside the route's `if (programId)` branch, it never executed on this live pass — it did not error, it simply never ran. No console errors, no 5xxs, no banned language, and no workflow-bypass claims were observed across all 6 prompts either way.

## Known Gaps

- **Blocking discovery from live proof: `programId` does not appear to reach this chat route on the live `/strategic-moves/<id>/phase/<n>` surface.** This predates this release (it also blocks the pre-existing basic "Active program"/phase-pack context, not just the new hardening packet) but was only surfaced by this release's live-proof pass, since no existing integration test asserts `programId` reaches the route from the real client component. **This is now the top-priority follow-up** — until it's root-caused and fixed, neither the old nor the new grounding can take effect on this surface, regardless of how complete the packet/classifier/quality-gate logic is. Suspect area: what `StrategicMovePhaseClient.tsx`'s chat dock actually sends as `body.programId` / `surfaceContext.programId` versus what `canonicalizeFromBody` expects.
- **Full packet richness not yet wired.** The route currently populates the packet from what's already loaded in that code path (evidence *count*, latest gate *action*) — not the richer `buildPhaseWorkflow`/`buildFeedForwardPack`/`buildApprovedInputsPack` outputs the phase-workspace UI computes separately. Those fields are correctly marked `missingInputs`/caveated rather than fabricated, but a follow-up increment should thread the same deterministic builders the phase-workspace panel already uses into this chat path for full richness (selectedBuildingBlocks, phaseTemplates, recommendedSessions, currentStateAssessment, uploadedTemplateMappings, whatChangedSummary are all still empty/null at the route-wiring layer today). This is secondary until the `programId` gap above is fixed.
- **Quality gate not wired into the live streaming response.** `runMovesAvaQualityGate` is fully built and unit-tested but not yet called post-hoc on the assistant's generated text inside the route. Once wired, it would have caught the live-observed lack of Move grounding as a `references_move_or_phase` failure and could drive a repair pass — reinforcing why this is worth prioritizing after the `programId` fix.
- Not yet wired for any surface other than `/strategic-moves/<id>/phase/<n>` (e.g. `/strategic-moves/<id>` detail view or `/strategic-moves/new` origination) — scoped to the phase-workspace chat surface specified in the request.
