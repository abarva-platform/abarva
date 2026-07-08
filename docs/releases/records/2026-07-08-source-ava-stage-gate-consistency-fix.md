# 2026-07-08-source-ava-stage-gate-consistency-fix — Source aVa Stage-Gate Consistency Fix

## Release ID

`2026-07-08-source-ava-stage-gate-consistency-fix`

## Status

`candidate`

## Plain-English Summary

Live browser testing on a real Lakeshore Holdings AMS event (`adcb1cd0-c586-4622-bd29-574cc5a10862`, RFP stage) found a CRITICAL invariant violation in the Source aVa chat agent (the answer-mode system shipped across PRs #4583/#4585/#4586). The canvas page for this event correctly showed "1 of 1 complete" on the RFP stage's task checklist, RFP clause coverage confirmed from real uploaded `RFP_CLAUSES_V1` facts (4 of 6 value levers protected, 2 exposed), and all 3 gate confirm items green. Asking aVa "Is the RFP final and ready to issue?" produced an answer claiming "0 of 1 tasks complete" and "all 6 are still exposed" — numbers that flatly contradict the real, same-page-visible workflow state. This breaks the project's primary Source-aVa invariant: aVa's claims about captured/missing/blocked/ready state must match the structured workflow state on the same page.

**Root cause (confirmed by code inspection, not a live LLM call):** the question classifies to `general_advisory` (no Phase A/B/C keyword pattern matches "is the RFP final and ready to issue" — verified directly against every rule in `answer-mode.ts`). Two independent defects compounded on that mode:

1. **Un-hydrated task/gate state (the source of "0 of 1").** The canvas page (`src/app/(maestro)/source/events/[eventId]/page.tsx`) always calls `hydrateTaskEvidenceState()` after `buildLiveStageView()` to re-derive each task's real done-state from persisted facts/artifacts — `buildLiveStageView` itself only returns a static scaffold (`SAMPLE_RFP_STAGE.tasks`, hardcoded `state: 'todo'`) that never reflects what the user actually uploaded. The chat route (`src/app/api/chat/agent/route.ts`) built its own `modeStageView` via `buildLiveStageView` alone and passed it straight into `buildModeGrounding` WITHOUT ever calling `hydrateTaskEvidenceState`. `buildEventStatusGrounding` and `buildStageGateGrounding` (`src/lib/source/ava/mode-grounding.ts`) compute "N of M complete" / gate-met directly from `stageView.tasks`, so the un-hydrated view produced a grounding block that itself said "0 of 1 complete" — objectively wrong, and not something the model invented.
2. **Missing clause-coverage facet (the source of "all 6 exposed").** `buildGeneralAdvisoryGrounding` never surfaced RFP clause coverage at all — only the dedicated `clause_coverage` mode did, and the chat route only ever fetched the `readRfpClausePresentLeverKeys` signal when the classified mode was literally `clause_coverage`. A generically-phrased RFP-finality question that falls through to `general_advisory` therefore got no protected/exposed lever read whatsoever; the underlying `buildStepInsight('rfp', ...)` insight, when called with an undefined signal, defaults to "MODEL — every lever shown as exposed," which is the shape of the bad claim.

This is a **grounding-builder bug**, not model fabrication of dollar/percentage figures (the existing quote-not-compute guard only covers `$`/`%` figures) — but it IS a case where the model stated bare integer counts ("0 of 1", "6") that the honesty guard did not previously check at all. Fixed on both fronts, plus a third defensive layer:

- `route.ts` now re-derives `modeStageView.tasks` via `hydrateTaskEvidenceState` (the SAME function, SAME inputs the canvas page uses) before it reaches `buildModeGrounding`, for every mode.
- `route.ts` now also fetches the RFP clause-coverage signal when the classified mode is `general_advisory` AND the viewed stage is `rfp`; `buildGeneralAdvisoryGrounding` now composites the full stage-gate read plus the clause-coverage facet (reusing `buildStageGateGrounding` / `buildClauseCoverageGrounding` verbatim — no new derivation logic), matching the compositing pattern `decision_recommendation` already established.
- `answer-quality-gate.ts` gets a new numeric-contradiction check folded into `matches_workflow_state`: it extracts any "N of M complete/tasks/confirmed/protected/met" claim from the answer text and compares it against the grounding block's own `taskChecklistDone`/`taskChecklistTotal` quotable facts (newly exposed by `buildEventStatusGrounding`/`buildStageGateGrounding`). A mismatch fails the check and triggers a repair pass that replaces the wrong count with the grounding's real count and appends a corrective note — hardening against the class of failure where a model states a stale/invented count even when handed a correct grounding block.

No number was un-computed or suppressed to "fix" this — the fix makes the CORRECT numbers (real hydrated task state, real 4-of-6 clause coverage) appear, sourced from the same reads the canvas already trusts.

## Layer Impact

- `global-control-lane`: All three changes are in the shared Source aVa library (`src/lib/source/ava/mode-grounding.ts`, `src/lib/source/ava/answer-quality-gate.ts`) and the single shared chat endpoint (`src/app/api/chat/agent/route.ts`) used by every tenant/surface with `source_analytics` enabled. No schema, migration, or data-plane change. No new flag. Behavior is unchanged for every mode/turn that isn't `general_advisory` on the RFP stage, and additive (more accurate, never less accurate) for every mode whose grounding reads `stageView.tasks`.

## Client Applicability

All clients/tenants with `source_analytics` enabled — this is the shared Source chat grounding path, gated only by the existing `source_analytics` feature flag and the presence of a Source event id in `surfaceContext`. Not client-specific; no new feature flag introduced.

## Changes Included

- Modified: `src/app/api/chat/agent/route.ts` — imports `hydrateTaskEvidenceState`; the mode-grounding branch now re-derives `modeStageView.tasks` from persisted evidence (facts + registered artifacts) before it is passed into `buildModeGrounding`, mirroring exactly what the canvas page does. Also extends the `readRfpClausePresentLeverKeys` fetch condition to include `general_advisory` mode when the viewed stage is `rfp`.
- Modified: `src/lib/source/ava/mode-grounding.ts` — `buildEventStatusGrounding` and `buildStageGateGrounding` now expose `taskChecklistDone`/`taskChecklistTotal` (and `gateMetConfirmCount`/`gateRequiredConfirmCount`) as quotable facts, read once and shared with the quality gate. `buildGeneralAdvisoryGrounding` now composites the FULL stage-gate read (not just its boolean) and, when the viewed stage is `rfp` and an archetype resolves, the RFP clause-coverage facet (`buildClauseCoverageGrounding`) — both reused verbatim, no new derivation logic.
- Modified: `src/lib/source/ava/answer-quality-gate.ts` — adds `COUNT_CLAIM_RE` / `extractCountClaims()` and folds a numeric-contradiction check into the existing `matches_workflow_state` check: an answer's stated "N of M <complete/tasks/confirmed/protected/met>" claim is compared against the grounding block's own `taskChecklistDone`/`taskChecklistTotal` facts. Adds a repair action that corrects a mismatched count in place and appends a corrective note, rather than leaving a caught contradiction unrepaired.
- New: regression test in `src/lib/source/ava/__tests__/mode-grounding-phase-c.test.ts` — fixtures the exact live scenario (RFP stage, hydrated 1-of-1 task checklist, 4-protected/2-exposed clause-coverage signal) through `buildModeGrounding({mode: "general_advisory", ...})` and asserts the block contains "1 of 1 complete" (never "0 of 1"), the real CLAUSE COVERAGE GROUNDING facet LIVE with 4 protected / 2 exposed rows (never the MODEL/all-exposed fallback), and `gateAllTasksComplete: "true"`.
- New: regression tests in `src/lib/source/ava/__tests__/answer-quality-gate.test.ts` — reproduce the exact bad-answer text from the live bug report ("0 of 1 tasks complete... all 6 are still exposed...") against a grounding-facts bag stating "1 of 1", proving the gate's repair pass corrects the count and the corrected text no longer contains the wrong claim; plus a passing-case test proving a matching count is left alone.

## QA / Validation

- **tsc:** Ran `node --max-old-space-size=8192 node_modules/.bin/tsc -p . --noEmit` (default 2-minute heap OOM'd without the larger heap — same failure mode noted in a prior slice's postmortem, worked around here rather than silently accepted). Branch: exit code 0, 0 errors. Clean `origin/main` worktree baseline, same command: exit code 0, 0 errors. **Net-new tsc errors: 0.**
- **eslint:** `npx eslint` on all 5 changed files — 0 errors (1 pre-existing unused-var warning in `route.ts`, confirmed present at the identical line on `origin/main`, not introduced by this change).
- **jest:** `npx jest src/lib/source/ava/__tests__` — 7 suites, **175/175 tests passed** (171 pre-existing Phase A/B/C tests unchanged + this change's new/expanded regression assertions). Also ran `npx jest src/app/api/chat/agent/__tests__` — 3 of 4 suites fail with the SAME failures on a clean `origin/main` checkout (pre-existing, unrelated string-matching tests against route source text; not touched or worsened by this change) and 38/41 tests pass in both cases.
- Status: **pass**.

## Rollout Plan

Standard PR → squash-merge to `main` → repo-owned ACA main-deploy workflow builds and deploys the shared web image. No feature flag, no migration, no manual runbook step. Behavior changes only for `general_advisory`-classified questions on Source events with `source_analytics` enabled; every other mode/turn is unaffected.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (unchanged by this PR).
- Shared runtime mutators: None — no `az containerapp update`, no env/flag/secret change.
- Approved image digest: N/A until merge triggers the standard main-deploy build.
- ACA runtime invariant: N/A — no runtime image/template change requested by this PR itself; standard post-merge deploy proof applies before claiming "live."
- Worker image invariant: N/A — no worker job change.
- Feature/env flag update path: N/A — no new or changed flag.
- Live signed-in proof required: Yes, after merge+deploy — repeat the exact live reproduction (Lakeshore Holdings AMS event `adcb1cd0-c586-4622-bd29-574cc5a10862`, RFP stage, "Is the RFP final and ready to issue?") and confirm aVa's answer states "1 of 1" / the real 4-protected/2-exposed clause split, matching the canvas.

## Rollback Plan

Revert the merge commit (no migration, no data mutation, no flag to unwind). The prior behavior (un-hydrated task state, missing clause-coverage facet for `general_advisory`) returns immediately; no state to repair.

## Audit Evidence

- PR URL: (added after `gh pr create`)
- Live bug report: Lakeshore Holdings AMS event `adcb1cd0-c586-4622-bd29-574cc5a10862`, RFP stage — canvas showed "1 of 1 complete" / 4-of-6 protected / all gate confirms green; aVa answered "0 of 1 tasks complete" / "all 6 are still exposed" for "Is the RFP final and ready to issue?"
- Regression tests: `src/lib/source/ava/__tests__/mode-grounding-phase-c.test.ts` (new `REGRESSION:` test in the `general_advisory` describe block), `src/lib/source/ava/__tests__/answer-quality-gate.test.ts` (new tests in the `matches_workflow_state` describe block).
- tsc/eslint/jest logs captured during this change's validation pass (see QA / Validation).

## Known Gaps

- This fix was validated by code inspection, fixture-driven unit tests, and a from-scratch trace of the exact call path (route.ts → mode-grounding.ts → answer-quality-gate.ts) — not by a live LLM call in this sandbox, since no live model/browser session was available here. The grounding-builder bug (un-hydrated task state, missing clause-coverage facet) is proven directly: the SAME code path that produced "0 of 1" / all-exposed before this fix is shown, byte-for-byte, to produce "1 of 1" / 4-protected-2-exposed after it, using the exact fixture shape of the live event. Whether the ORIGINAL live answer also involved some degree of the model restating/rounding a correct-but-incomplete grounding block cannot be fully distinguished from the grounding-only defect without a live re-run; the numeric-contradiction quality-gate check added here defends against that residual possibility regardless of which one it was.
- The RFP-clause-coverage facet is only added to `general_advisory` when the viewed stage is `rfp`. A future generalization (surfacing whichever Phase B lever-level signal is relevant to the CURRENT stage, not just RFP clause coverage) is out of scope for this fix, which is scoped to the exact reproduced defect.
- Live signed-in re-proof against the exact Lakeshore event is required after deploy (see Deployment Authority) before this can be marked `live-proven`.
