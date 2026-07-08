# 2026-07-08-source-ava-answer-modes-phase-a — Source aVa Answer-Mode Hardening (Phase A)

## Release ID

`2026-07-08-source-ava-answer-modes-phase-a`

## Status

`candidate`

## Plain-English Summary

This release hardens the Source aVa chat agent so it behaves like a senior sourcing advisor embedded in the current Source event, for a first slice of 6 workflow question types (Phase A of a 3-phase build): "where are we on this event?", "how do I do X in this UI?", "what evidence is still missing?", "where did this document come from?", "which version is authoritative?", and "what's blocking the gate?". Previously aVa answered these purely from LLM reasoning with no deterministic grounding, so its answers could drift from what the canvas actually shows (wrong stage, wrong evidence state, wrong "final" document). Now, when `source_analytics` is on for the tenant and the chat carries a Source event id, aVa classifies the question into one of 16 canonical answer modes (a deterministic keyword classifier, no LLM call), builds a mode-specific grounding block from the SAME deterministic reads the canvas uses (event facts, the live stage view, the artifact registry, the stage gate's confirmation keys), injects that into the prompt, and — for these 6 modes only — runs the model's reply through a quality gate (direct answer present, no banned "another model would do better" language, no raw internal ids, no contradiction of the grounded stage/gate state, includes a next step, and for incomplete-evidence answers, a named gap rather than a vague apology) with ONE targeted repair pass if it fails. The other 10 answer-taxonomy modes (value-at-stake, vendor comparison, risk exposure, etc.) are classified now (so the type and telemetry exist) but fall through unchanged to the existing chat behavior — Phase A does not touch their grounding or gating. This is purely additive: with the flag off, no event id present, or a non-Phase-A mode, the chat streams exactly as it did before this change.

## Layer Impact

- `global-control-lane`: New library modules (`src/lib/source/ava/answer-mode.ts`, `mode-grounding.ts`, `answer-quality-gate.ts`) and an additive extension of `src/app/api/chat/agent/route.ts` (the single shared chat endpoint used by every tenant/surface). No new tenant-specific behavior is introduced; the change is gated identically for every tenant that already has `source_analytics` on. No schema, migration, or data-plane change.

## Client Applicability

- All clients: Yes, for any client/tenant with the existing `source_analytics` feature flag enabled AND a Source event id present in the chat surface context. Behavior is byte-for-byte unchanged for every other client, surface, or turn.
- Specific clients: N/A — flag-gated, not client-specific.
- Internal only: No.
- Public/demo only: No.
- Feature flag: `source_analytics` (pre-existing flag; this release adds no new flag).

## Changes Included

- New: `src/lib/source/ava/answer-mode.ts` — `SourceAnswerMode` 16-value union type and `classifySourceAnswerMode()`, a deterministic (no-LLM) keyword/pattern classifier. Exports `PHASE_A_IMPLEMENTED_MODES` (the 6 modes this phase implements) and `isPhaseAImplementedMode()`.
- New: `src/lib/source/ava/mode-grounding.ts` — `buildModeGrounding()`, which builds a mode-specific grounding block for each of the 6 Phase A modes by composing existing deterministic reads: `readEventFacts`, `buildLiveStageView`, `listSourceArtifactsForSourceEventId`, `templateFactsPresent` (reused, not duplicated, from `task-evidence-hydration.ts`), and `confirmationKeysForStage`. `workflow_how_to` uses a small in-code deterministic knowledge table (intent → exact UI action) rather than data grounding, per design.
- New: `src/lib/source/ava/answer-quality-gate.ts` — `runSourceAnswerQualityGate()`, a deterministic quality gate mirroring Intelligence's `answer-safety.ts` pattern. Reuses `containsUnsafePublicText` and `sanitizePublicText` directly from `src/lib/intelligence/answer/answer-safety.ts` (no regex duplication). Implements 9 checks (direct answer present, mode classified, uses current event context, matches workflow state, no banned deflection language, no raw internal ids, gap/caveat present when evidence is incomplete, includes a next step, matches the read-once grounding facts) and a single targeted repair pass with re-check.
- New: `src/lib/source/ava/__tests__/answer-mode.test.ts`, `mode-grounding.test.ts`, `answer-quality-gate.test.ts` — 60 tests covering all 16 modes' classification (including the 10 deferred modes falling through honestly to `general_advisory` where unmatched), each of the 6 mode-grounding builders against fixture event/stage/artifact data, and the quality gate's repair-then-recheck loop.
- Modified: `src/app/api/chat/agent/route.ts` — additively wires mode classification + mode-specific grounding alongside the existing (#4567) value grounding, and adds a narrowly-scoped hold-then-gate path: ONLY when a Phase A mode was classified AND grounding is active, the agent's streamed text is held back (instead of streamed token-by-token), run through the quality gate, and emitted once (repaired if needed) before the response closes. Every other turn/surface streams exactly as before — unchanged code path.

## QA / Validation

- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` — baseline (origin/main `11e002208`) has 126 pre-existing `error TS` lines (162 total log lines); after this change, the log is identical (net-new = 0), confirmed by an empty `diff` between the sorted baseline and post-change `error TS` line sets.
- PASS: `npx eslint` on all changed files (`src/app/api/chat/agent/route.ts`, `src/lib/source/ava/**`) — 0 errors. One pre-existing warning (`sanitizeAutonomousDecisionLanguage` unused) in `route.ts` predates this change (confirmed against `origin/main` directly).
- PASS: `npx jest src/lib/source/ava/__tests__` — 60/60 new tests green (16-mode classifier including all 6 Phase A + 10 deferred modes; 6 mode-grounding builders against fixture data; quality-gate repair-then-recheck, banned-language rejection, id-scrub, workflow-state consistency).
- PASS (unaffected): `npx jest src/lib/ava-answer/__tests__ src/lib/intelligence/answer/__tests__` — same 2 pre-existing failures (`answer-safety.test.ts`, `harness.test.ts` in `evals/__tests__`) exist identically on a clean `origin/main` checkout (verified via `git stash` + re-run before restoring this branch's changes); this release introduces 0 new failures in Intelligence's `ava-answer` / `answer-safety` suites.

## Rollout Plan

1. Merge to main via squash-merge PR (no direct push).
2. ACA main deploy workflow builds and deploys the new image per the standard runbook; no migration, no schema change, no new flag to flip.
3. Because behavior is gated behind the pre-existing `source_analytics` flag + presence of a Source event id, no explicit flag flip is required for this PR to be safe to merge and deploy — it activates automatically (only the 6 new modes' grounding/gating) for tenants already running with that flag on.
4. Post-deploy, a live signed-in Source-event chat proof (asking a "where are we" / "what's blocking the gate" style question on a flagged tenant) should be captured before calling this release live-proven, per the ACA runtime invariant discipline.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (unchanged by this PR).
- Shared runtime mutators: None — this PR contains no `az containerapp update`, no image build commands, no env/flag/secret changes.
- Approved image digest: N/A at PR time — will be set by the standard main-deploy workflow on merge.
- ACA runtime invariant: N/A — no runtime image, env var, or flag mutation in this change; the existing `source_analytics` flag path already governs activation.
- Worker image invariant: N/A — no worker job touched.
- Feature/env flag update path: None — no new flag introduced; existing `source_analytics` flag path unchanged.
- Live signed-in proof required: Yes, before calling this change "live-proven" per the runtime invariant discipline — a signed-in chat turn on a `source_analytics`-enabled tenant's Source event, asking a Phase A question, should be captured post-deploy.

## Rollback Plan

Revert the PR. The change is additive (new files + an additive, narrowly-scoped extension of the chat route's existing grounding block); reverting removes the classifier, the mode-grounding module, the quality gate, and the route's use of them, restoring the prior (#4567) grounding-only behavior exactly. No migration, no data write, no schema change — rollback is a pure code revert with no data cleanup required.

## Audit Evidence

- PR: see PR URL reported alongside this record.
- CI: pending (repo is in speed-mode; local validation is authoritative per AGENTS.md).
- TypeScript: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` — net-new errors = 0 (log diff empty vs. `origin/main` baseline).
- ESLint: 0 errors on all changed files.
- Jest: 60/60 new Phase A tests green; Intelligence's `ava-answer`/`answer-safety` suites confirmed unaffected (same 2 pre-existing failures before and after this branch).
- Release check: `node scripts/release-check.mjs --base origin/main --head HEAD` — see PASS/FAIL noted in the PR.

## Known Gaps

- Only 6 of the 16 canonical Source aVa answer modes are implemented in this phase (`event_status`, `workflow_how_to`, `evidence_readiness`, `artifact_lineage`, `artifact_finality`, `stage_gate`). The remaining 10 (`value_at_stake`, `vendor_comparison`, `risk_exposure`, `clause_coverage`, `bafo_strategy`, `should_cost`, `committed_value`, `value_realization`, `stakeholder_alignment`, `general_advisory`) classify correctly but intentionally fall through to the existing (ungrounded-for-these-modes) chat behavior — deferred to Phase B/C per the build's explicit scope.
- The quality gate's repair pass is a single deterministic text transform (strip banned phrases, scrub ids, append a caveat/next-step line); it does not re-invoke the model. If repair cannot resolve every failed check, the repaired (best-effort) text still ships and the unresolved check ids are logged via `console.warn` for telemetry — there is no dedicated violations-table sink for these Phase A check ids yet (the shared Intelligence `ViolationType` union was intentionally left untouched, per the frozen-file list for this change).
- `stage_gate` grounding can only report a data-derived met/unmet state for the "evidence complete"-style confirm box (from the task checklist's `evidenceComplete` signal); the other confirm boxes (e.g. sponsor sign-off, stage-final) are reported as "requires human confirmation" because no per-box boolean is persisted yet in the gate view — this is an honest reporting limit, not a bug, and matches the codebase's existing honesty discipline (no fabricated attestations).
- No live signed-in browser proof was captured in this session (backend-only build); see Deployment Authority above for the required post-deploy proof step.
