# 2026-07-08-source-ava-answer-modes-phase-b — Source aVa Answer-Mode Hardening (Phase B)

## Release ID

`2026-07-08-source-ava-answer-modes-phase-b`

## Status

`candidate`

## Plain-English Summary

This release extends the Source aVa chat agent's answer-mode hardening (Phase A, PR #4583) with the 8 vendor/value/commercial answer modes: "what's our value at stake?", "compare vendors", "what's the should-cost / TCO normalization?", "what's the commercial risk here?", "what's our RFP clause coverage?", "what's the BAFO strategy?", "what did the award commit?", and "how is value realization tracking?". Every mode-specific grounding block reuses the SAME deterministic `buildStepInsight()` builder the canvas "✦ Intelligence" tab already renders for the corresponding stage (Strategy/Pricing → value pool + value bridge, Responses → response coverage, Evaluation → should-cost normalization, RFP → clause coverage, BAFO → captured-vs-target, Selection → committed value, Value → realization) — it never re-derives a number. Every lever/value figure a Phase B block surfaces also carries its VALUE-TYPE CLASSIFICATION (expected concession / incremental negotiated / solution tightening / protected / risk-adjusted), reusing `evaluateValueLevers`'s existing classification via each insight row's `valueType` field, so aVa can never fold vendor price movement into one blended "savings" claim. The quality gate (from Phase A) gains 3 additional checks scoped to these 8 modes: traceability (every $ figure the answer states must appear verbatim in the grounding block — the same quote-not-compute discipline as #4567, checked post-hoc), value-type-breakdown presence (when the grounding carries a classified breakdown, the answer must name at least one value type), and generic-ask rejection (BAFO/vendor modes must use the specific data the grounding provides rather than a vague "negotiate harder"). This is purely additive: with the flag off, no event id present, or a mode outside Phase A/B's 14 implemented modes (`stakeholder_alignment`, `general_advisory` remain deferred to Phase C), the chat streams exactly as it did before this change.

## Layer Impact

- `global-control-lane`: Extends the existing Phase A library modules (`src/lib/source/ava/answer-mode.ts`, `mode-grounding.ts`, `answer-quality-gate.ts`) and the same additive extension point in `src/app/api/chat/agent/route.ts` (the single shared chat endpoint used by every tenant/surface). No new tenant-specific behavior; gated identically for every tenant that already has `source_analytics` on. No schema, migration, or data-plane change — Phase B reads the SAME `source_event_facts` reader functions (`readRfpClausePresentLeverKeys`, `readCommittedValueLevers`, `readBafoConcessionLevers`, `readRealizedValueLevers`, `readVendorLeverResponses`, `readVendorBids`) the canvas call-site already uses.

## Client Applicability

- All clients: Yes, for any client/tenant with `source_analytics` enabled AND a Source event id present in the chat surface context. Behavior is byte-for-byte unchanged for every other client, surface, or turn.
- Specific clients: N/A — flag-gated, not client-specific.
- Internal only: No.
- Public/demo only: No.
- Feature flag: `source_analytics` (pre-existing flag; this release adds no new flag).

## Changes Included

- Modified: `src/lib/source/ava/answer-mode.ts` — adds `PHASE_B_IMPLEMENTED_MODES` (the 8 modes this phase implements), `isPhaseBImplementedMode()`, and `isGroundedAnswerMode()` (true for any Phase A or Phase B mode). Re-labels the Phase B rule ids from `.deferred` to `.core` (behavior-preserving; same regex patterns, now implemented rather than classify-only) and sharpens a few patterns (e.g. `vendor_comparison` also matches "vendor coverage"/"who addressed/dodged"). Phase A's 6 modes/behavior are untouched.
- Modified: `src/lib/source/ava/mode-grounding.ts` — adds 8 new builder functions (`buildValueAtStakeGrounding`, `buildVendorComparisonGrounding`, `buildShouldCostGrounding`, `buildRiskExposureGrounding`, `buildClauseCoverageGrounding`, `buildBafoStrategyGrounding`, `buildCommittedValueGrounding`, `buildValueRealizationGrounding`), each calling `buildStepInsight()` for its stage and rendering the insight's headline/rows/bars plus a grouped VALUE-TYPE CLASSIFICATION section. `vendor_comparison` grounds BOTH the Responses (`response_coverage`) and Evaluation (`should_cost_normalization`) facets when signals exist for either, honestly labeling the other as model/pending when only one has data. `risk_exposure` surfaces each lever's `commercialRisk` field from the archetype's `ValueLeverRule` (never inventing a risk note when the archetype declares none). `bafo_strategy` names each still-open lever's specific `bafoAsk` from the archetype. Extends `BuildModeGroundingInput` with `archetype`, `baselineAmount`, and the 6 per-lever/per-vendor signal maps (`rfpClausePresentLeverKeys`, `committedValueByLeverKey`, `bafoConcessionByLeverKey`, `realizedValueByLeverKey`, `vendorResponses`, `vendorBids`) — all optional, all reused verbatim from the existing reader/builder contracts. Phase A's 6 builders are untouched.
- Modified: `src/lib/source/ava/answer-quality-gate.ts` — adds 3 checks (`traceable_to_grounding`, `includes_value_type_breakdown`, `uses_specific_ask_when_available`), each scoped to the relevant Phase B modes (vacuous pass for Phase A/C modes) via `PHASE_B_VALUE_MODES` / `PHASE_B_ASK_MODES` sets. Extends `SourceAnswerQualityGateInput` with optional `groundingBlockText` (the raw block, for the traceability scan) and `groundingHasSpecificAsk`. Repair pass: traceability failures strip the specific untraceable `$` token and append a caveat; value-type-breakdown failures append the grounding's own classification lines verbatim (quoted, not re-derived); generic-ask failures append a pointer back to the grounding's specific data. Same one-pass, never-loop, never-silently-ship-uncaught-failures discipline as Phase A; unresolved checks are logged via `console.warn`. Phase A's 9 existing checks and their repair logic are untouched.
- Modified: `src/app/api/chat/agent/route.ts` — additively wires Phase B mode classification alongside Phase A: `isGroundedAnswerMode()` now gates the read-and-ground branch (was `isPhaseAImplementedMode()`); for Phase B modes, the route conditionally reads the exact per-lever/per-vendor signal each mode's insight needs (mirroring the canvas call-site's per-stage-only reads in `source/events/[eventId]/page.tsx`) and resolves the archetype via `resolveValueArchetype(null)` (same resolution the canvas and #4567's value grounding use). The quality-gate call now threads `groundingBlockText` and `groundingHasSpecificAsk` alongside the existing Phase A fields. Every other turn/surface/mode streams exactly as before — unchanged code path.
- New: `src/lib/source/ava/__tests__/mode-grounding-phase-b.test.ts` — 26 tests covering all 8 Phase B builders against fixture archetype/lever/vendor/BAFO/committed/realized data, asserting LIVE-vs-MODEL provenance switching, the value-type classification appearing correctly, honest empty-archetype handling, and the "ground what exists, honestly label the rest as model/pending" behavior for `vendor_comparison`.
- Modified: `src/lib/source/ava/__tests__/answer-mode.test.ts` — extends the existing classification suite with `PHASE_B_IMPLEMENTED_MODES` / `isPhaseBImplementedMode` / `isGroundedAnswerMode` coverage; Phase A's existing assertions are unchanged.
- Modified: `src/lib/source/ava/__tests__/answer-quality-gate.test.ts` — adds test suites for the 3 new checks (traceability pass/fail/repair, value-type-breakdown pass/fail/repair/not-required, generic-ask pass/fail/repair/not-required/out-of-scope) plus a regression check confirming a passing Phase A turn is untouched by the Phase B checks.

## QA / Validation

- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`, run directly under a tracked process (no inner `&`/wrapper). Origin/main baseline (`3af70d8e7`, the exact commit this branch is based on) re-verified at 126 `error TS` lines (162 total log lines, confirmed non-empty). After this change: identical 126 errors / 162 log lines. Net-new = 0, proven by an empty `diff` between the sorted per-file `error TS` line sets AND by confirming none of the 7 changed/new Phase B files (`route.ts`, `answer-mode.ts`, `mode-grounding.ts`, `answer-quality-gate.ts`, the 3 test files) appear anywhere in the post-change error log (0 matches each). No rebase was needed — origin/main had not moved since Phase A merged.
- PASS: `npx eslint` on all changed files — 0 errors. One pre-existing warning (`sanitizeAutonomousDecisionLanguage` unused in `route.ts`) predates this change (confirmed identical on `origin/main` directly, unrelated code).
- PASS: `npx jest src/lib/source/ava/__tests__` — 99/99 tests green (60 pre-existing Phase A tests unchanged + 39 new: 13 added to `answer-mode.test.ts`, 26 in the new `mode-grounding-phase-b.test.ts`, plus the quality-gate extension suites folded into `answer-quality-gate.test.ts`).
- PASS (unaffected): `npx jest src/lib/source/facts/view/__tests__` (step-insight-builder + ava-grounding-context) — 76/76 green, confirming the deterministic insight/value-grounding substrate Phase B reuses is untouched.
- PASS (unaffected): `npx jest src/lib/intelligence/answer` — same 2 pre-existing failures (`answer-safety.test.ts`, `evals/__tests__/harness.test.ts`) exist identically on a clean `origin/main` checkout (verified via `git stash -u` + re-run before restoring this branch's changes); 0 new failures introduced.
- PASS (unaffected): `npx jest src/lib/source` (full tree) and `npx jest src/app/api/chat/agent/__tests__` — same pre-existing failure counts as origin/main baseline in both cases (10 failed suites / 31 failed tests in `src/lib/source`; 3 failed suites / 38 passed in the chat-agent test dir), confirmed via the same stash-and-compare method; the pass-count delta (+39 in `src/lib/source`) is exactly this release's new tests, all green.
- PASS: `npm run test:behaviors` (195/195) and `npm run test:nav` (26/26) — unaffected.
- PASS: `node scripts/release-check.mjs --base origin/main --head HEAD` — see PASS/FAIL noted in the PR.

## Rollout Plan

1. Merge to main via squash-merge PR (no direct push).
2. ACA main deploy workflow builds and deploys the new image per the standard runbook; no migration, no schema change, no new flag to flip.
3. Because behavior is gated behind the pre-existing `source_analytics` flag + presence of a Source event id, no explicit flag flip is required for this PR to be safe to merge and deploy — it activates automatically (only the 8 new modes' grounding/gating) for tenants already running with that flag on.
4. Post-deploy, a live signed-in Source-event chat proof (asking a "what's our value at stake" / "compare vendors" / "what's the BAFO strategy" style question on a flagged tenant with real vendor/lever facts loaded) should be captured before calling this release live-proven, per the ACA runtime invariant discipline.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (unchanged by this PR).
- Shared runtime mutators: None — this PR contains no `az containerapp update`, no image build commands, no env/flag/secret changes.
- Approved image digest: N/A at PR time — will be set by the standard main-deploy workflow on merge.
- ACA runtime invariant: N/A — no runtime image, env var, or flag mutation in this change; the existing `source_analytics` flag path already governs activation.
- Worker image invariant: N/A — no worker job touched.
- Feature/env flag update path: None — no new flag introduced; existing `source_analytics` flag path unchanged.
- Live signed-in proof required: Yes, before calling this change "live-proven" per the runtime invariant discipline — a signed-in chat turn on a `source_analytics`-enabled tenant's Source event, asking a Phase B question, should be captured post-deploy.

## Rollback Plan

Revert the PR. The change is additive (8 new builder functions + 3 new gate checks + an additive, narrowly-scoped extension of the route's existing mode-classification branch); reverting removes the Phase B grounding builders, the 3 gate-check extensions, and the route's use of them, restoring the prior (Phase A) behavior exactly — Phase A's 6 modes are entirely untouched by this change and require no rollback consideration. No migration, no data write, no schema change — rollback is a pure code revert with no data cleanup required.

## Audit Evidence

- PR: see PR URL reported alongside this record.
- CI: pending (repo is in speed-mode; local validation is authoritative per AGENTS.md).
- TypeScript: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` — net-new errors = 0 (log diff empty vs. `origin/main` baseline `3af70d8e7`; 126 errors / 162 log lines identical before and after).
- ESLint: 0 errors on all changed files.
- Jest: 99/99 Source aVa tests green (60 Phase A unchanged + 39 new Phase B); Intelligence's `answer-safety`/`harness` suites, the full `src/lib/source` tree, and `src/app/api/chat/agent/__tests__` all confirmed to have identical pre-existing failure counts before and after this branch (stash-and-compare method).
- Release check: `node scripts/release-check.mjs --base origin/main --head HEAD` — see PASS/FAIL noted in the PR.

## Known Gaps

- 2 of the 16 canonical Source aVa answer modes remain deferred to Phase C: `stakeholder_alignment` and `general_advisory`. They classify correctly but intentionally fall through to the existing (ungrounded-for-these-modes) chat behavior.
- `vendor_comparison`'s should-cost facet and `should_cost` itself both read `readVendorBids`; when the chat route classifies a `vendor_comparison` question it fetches the vendor-bid signal even though only the should-cost half of that mode's grounding needs it — this is a minor redundant-read cost against an already-cheap Postgres read, not a correctness issue, and mirrors the "read what the insight needs" contract from the canvas call-site.
- The quality gate's repair pass remains a single deterministic text transform (strip/append), same as Phase A; it does not re-invoke the model. Unresolved checks after repair are logged via `console.warn` for telemetry only — there is no dedicated violations-table sink for these check ids yet (the shared Intelligence `ViolationType` union remains intentionally untouched, per the frozen-file list for this change).
- No live signed-in browser proof was captured in this session (backend-only build); see Deployment Authority above for the required post-deploy proof step.
