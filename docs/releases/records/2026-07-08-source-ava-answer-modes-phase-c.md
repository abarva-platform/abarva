# 2026-07-08-source-ava-answer-modes-phase-c — Source aVa Answer-Mode Hardening (Phase C, final)

## Release ID

`2026-07-08-source-ava-answer-modes-phase-c`

## Status

`candidate`

## Plain-English Summary

This release completes the Source aVa chat agent's 16-mode answer-mode hardening series (Phase A #4583, Phase B #4585). It implements the final 2 fully-grounded modes — `decision_recommendation` ("what should we do / who should we award?") and `contract_optimization` ("should we renegotiate the incumbent, or rebid?") — and grounds `general_advisory` (the catch-all "senior sourcing judgment" fallback), which previously classified but fell through to ungrounded chat behavior. `decision_recommendation` and `contract_optimization` are COMPOSITE builders: neither re-implements any math or text from a prior builder. `decision_recommendation` calls `buildStepInsight('executive_decision')` for the classified negotiable/protected/risk-adjusted value split, then literally calls the EXISTING `buildVendorComparisonGrounding`, `buildBafoStrategyGrounding`, `buildStageGateGrounding`, and `buildEvidenceReadinessGrounding` functions and concatenates their output as the vendor, BAFO, and "unresolved award conditions" facets. `contract_optimization` calls `buildStepInsight('strategy')` (value_pool — incumbent leakage/opportunity) and `buildStepInsight('scope')` (scope_coverage — reachable-vs-stranded, including the potential-at-risk benchmark banding), surfacing each lever's own `triggerLogic`/`valueBasis` text from the archetype rule rather than inventing a renew/renegotiate/rebid framework beyond what the archetype already encodes. `general_advisory` is a compact roll-up (current stage + value bridge headline + top open items) built by calling `buildEventStatusGrounding`, `buildValueAtStakeGrounding`, `buildEvidenceReadinessGrounding`, `buildStageGateGrounding`, and `buildBafoStrategyGrounding` — again, no new derivation logic. `stakeholder_alignment` remains the one deliberately deferred mode: it asks about human sentiment/consensus ("has the committee agreed?"), a state this event-bound deterministic tool has no persisted signal for, so grounding it would mean fabricating a "who agrees with what" read the data model does not capture — it stays an honest classify-only passthrough.

This release also adds an export mechanism for the 5 modes the spec calls "exportable" (`decision_recommendation`, `value_at_stake`, `vendor_comparison`, `bafo_strategy`, `contract_optimization`): a new pure function `exportSourceAnswerPacket()` that renders an ALREADY-GENERATED chat turn (the final answer text + the SAME mode-grounding block + quotable facts already computed for that turn) to a markdown string. It makes no model call and does not re-ground — it is a pure serializer over data the caller already has in hand. No `AvaAnswerPacket` object exists on the Source chat route today (that contract belongs to Intelligence/Home's `src/lib/ava-answer/*`, a different answer surface, as Phase A/B's own module docs state); this export is scoped to what the Source route actually produces. UI wiring (a download button in the chat surface) was evaluated and deferred — see Known Gaps.

Finally, this release adds a full 16-mode fixture suite (`answer-modes-fixture-suite.test.ts`) giving every one of the 16 canonical Source aVa answer modes at least one fixture assertion matching the specific per-mode bullet the design calls for (e.g. artifact_finality: client-final recognized when present, a bare generated draft never called final; bafo_strategy: specific per-lever ask, not a generic "negotiate harder"; decision_recommendation: composite assembly, traceable, richer).

## Layer Impact

- `global-control-lane`: Extends the existing Phase A/B library modules (`src/lib/source/ava/answer-mode.ts`, `mode-grounding.ts`, `answer-quality-gate.ts`) and the same additive extension point in `src/app/api/chat/agent/route.ts` (the single shared chat endpoint used by every tenant/surface). Adds one new pure module, `src/lib/source/ava/export-answer-packet.ts`, with no route/UI wiring yet. No schema, migration, or data-plane change — Phase C reads the SAME `source_event_facts` reader functions Phase B already reads (`readBafoConcessionLevers`, `readVendorLeverResponses`, `readVendorBids`), conditionally extended to also fire for `decision_recommendation`.

## Client Applicability

- All clients: Yes, for any client/tenant with `source_analytics` enabled AND a Source event id present in the chat surface context. Behavior is byte-for-byte unchanged for every other client, surface, or turn.
- Specific clients: N/A — flag-gated, not client-specific.
- Internal only: No.
- Public/demo only: No.
- Feature flag: `source_analytics` (pre-existing flag; this release adds no new flag).

## Changes Included

- Modified: `src/lib/source/ava/answer-mode.ts` — adds `decision_recommendation` and `contract_optimization` to the `SourceAnswerMode` union (moved out of the classify-only-passthrough set), adds `PHASE_C_IMPLEMENTED_MODES` (`decision_recommendation`, `contract_optimization`, `general_advisory`), `isPhaseCImplementedMode()`, and extends `isGroundedAnswerMode()` to include Phase C. Adds 2 new classification rules ordered BEFORE Phase B's broader value/risk rules (more specific "what should we do" / "renew vs rebid" phrasing must not be swallowed by `value_at_stake`/`risk_exposure`). `stakeholder_alignment` is now the ONLY mode left in the deferred/classify-only-passthrough set, with its reasoning documented in the module doc. Phase A/B's existing modes/rules are untouched.
- Modified: `src/lib/source/ava/mode-grounding.ts` — adds 3 new builder functions: `buildDecisionRecommendationGrounding` (composites `buildExecDecisionFacet` — a thin new wrapper around `buildStepInsight('executive_decision')` — plus calls to the EXISTING `buildVendorComparisonGrounding`/`buildBafoStrategyGrounding`/`buildStageGateGrounding`/`buildEvidenceReadinessGrounding`), `buildContractOptimizationGrounding` (calls `buildStepInsight('strategy')` and `buildStepInsight('scope')`, surfacing each lever's `triggerLogic`/`valueBasis` from `ValueLeverRule`), and `buildGeneralAdvisoryGrounding` (calls `buildEventStatusGrounding`, `buildValueAtStakeGrounding`, `buildEvidenceReadinessGrounding`, `buildStageGateGrounding`, `buildBafoStrategyGrounding`). Extends the `buildModeGrounding` switch with the 3 new cases. Phase A/B's 14 existing builders are untouched (called, never modified).
- Modified: `src/lib/source/ava/answer-quality-gate.ts` — adds `PHASE_C_VALUE_MODES` (`decision_recommendation`, `contract_optimization` — both state $ figures composited from existing groundings) and `PHASE_C_ASK_MODES` (`decision_recommendation`, whose composited BAFO facet can name a specific ask), unioned into the existing `traceable_to_grounding` / `includes_value_type_breakdown` / `uses_specific_ask_when_available` checks. `general_advisory` is deliberately excluded from both new sets — it gets a lighter bar by design (compact, general-purpose) but still passes every core Phase A check unchanged. Phase A's 9 checks and Phase B's 3 checks are untouched.
- Modified: `src/app/api/chat/agent/route.ts` — additively wires Phase C mode classification alongside Phase A/B: the archetype is now resolved whenever `isPhaseBImplementedMode || isPhaseCImplementedMode` (previously Phase B only); the BAFO-concession, vendor-response, and vendor-bid signal reads are conditionally extended to also fire for `decision_recommendation` (mirroring exactly which signals its composited facets need). Every other turn/surface/mode streams exactly as before — unchanged code path.
- New: `src/lib/source/ava/export-answer-packet.ts` — `exportSourceAnswerPacket()` (pure function; renders an already-generated answer text + grounding block + quotable facts to markdown, no model call, no re-grounding), `isExportableSourceAnswerMode()` / `EXPORTABLE_SOURCE_ANSWER_MODES` (the 5 spec-named exportable modes: `decision_recommendation`, `value_at_stake`, `vendor_comparison`, `bafo_strategy`, `contract_optimization`).
- New: `src/lib/source/ava/__tests__/mode-grounding-phase-c.test.ts` — unit coverage for the 3 Phase C builders, including proof that the composite builders assemble (not re-derive) existing builder output, and honest-empty/omission behavior when an underlying facet has nothing to ground.
- New: `src/lib/source/ava/__tests__/export-answer-packet.test.ts` — coverage for the export function and the exportable-mode predicate, including a purity check (identical input → identical output) and proof the grounding block is included verbatim.
- New: `src/lib/source/ava/__tests__/answer-modes-fixture-suite.test.ts` — the full 16-mode fixture suite: at least one fixture assertion per mode, matching the specific per-mode bullet list (direct answer / mode-appropriate structure / no banned language / matches workflow state / value-type breakdown where relevant / vendor-specific asks where data exists / concise for how-to+status / richer for vendor+value+decision).
- Modified: `src/lib/source/ava/__tests__/answer-mode.test.ts` — adds a Phase C classification describe block (6 new classification cases + `PHASE_C_IMPLEMENTED_MODES`/`isPhaseCImplementedMode` coverage); corrects one now-stale Phase B assertion that expected `general_advisory` to be ungrounded.
- Modified: `src/lib/source/ava/__tests__/answer-quality-gate.test.ts` — adds Phase C describe blocks: the 3 extended checks applied to `decision_recommendation`/`contract_optimization`, and `general_advisory`'s lighter-bar behavior (vacuous pass on value-type/ask checks, but core Phase A checks still enforced).

## QA / Validation

Status: pass

- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`, run directly under a tracked background process (no inner `&`/wrapper), completed, log confirmed non-empty. Origin/main baseline (`8b6828e12`, the exact commit this branch is based on, re-verified via `git stash -u` + rerun) is 126 `error TS` lines / 162 total log lines — unchanged from Phase B's recorded baseline. After this change: identical 126 errors / 162 log lines. Net-new = 0, proven by an EMPTY `diff` between the sorted baseline and post-change logs, AND by grepping the post-change log for every one of the 10 changed/new files (`route.ts`, `answer-mode.ts`, `mode-grounding.ts`, `answer-quality-gate.ts`, `export-answer-packet.ts`, and the 5 test files) — 0 matches each. No rebase was needed; origin/main had not moved since Phase B merged.
- PASS: `npx eslint` on all 10 changed/new files — 0 errors. One pre-existing warning (`sanitizeAutonomousDecisionLanguage` unused in `route.ts`) confirmed identical on `origin/main` directly (unrelated, pre-existing).
- PASS: `npx jest src/lib/source/ava/__tests__` — 171/171 tests green (99 pre-existing Phase A/B tests, 2 with minor corrections for now-accurate Phase C behavior + 72 new: 6 Phase C classification cases + supporting assertions in `answer-mode.test.ts`, ~15 in `mode-grounding-phase-c.test.ts`, ~11 in `answer-quality-gate.test.ts`'s Phase C blocks, 9 in `export-answer-packet.test.ts`, and the full 16-mode fixture suite in `answer-modes-fixture-suite.test.ts`).
- PASS (unaffected): `npx jest src/lib/source/facts/view/__tests__` — 76/76 green, confirming the deterministic insight/value-grounding substrate Phase C reuses is untouched.
- PASS (unaffected): `npx jest src/lib/intelligence/answer` — same 2 pre-existing failures (`answer-safety.test.ts`, `evals/__tests__/harness.test.ts`) exist identically on a clean `origin/main` checkout (verified via `git stash -u` + re-run before restoring this branch's changes); 0 new failures.
- PASS (unaffected): `npx jest src/lib/source` (full tree) and `npx jest src/app/api/chat/agent/__tests__` — same pre-existing failure counts as the origin/main baseline (10 failed suites / 31 failed tests in `src/lib/source`, confirmed via stash-and-compare; 3 failed suites / 38 passed in `src/app/api/chat/agent/__tests__`); the pass-count delta in `src/lib/source` (+72) is exactly this release's new/corrected tests, all green.
- PASS: `npm run test:behaviors` (195/195) and `npm run test:nav` (26/26) — unaffected.
- PASS: `node scripts/release-check.mjs --base origin/main --head HEAD` — see PASS/FAIL noted in the PR.

## Rollout Plan

1. Merge to main via squash-merge PR (no direct push).
2. ACA main deploy workflow builds and deploys the new image per the standard runbook; no migration, no schema change, no new flag to flip.
3. Because behavior is gated behind the pre-existing `source_analytics` flag + presence of a Source event id, no explicit flag flip is required for this PR to be safe to merge and deploy — it activates automatically (only the 3 new/newly-grounded modes) for tenants already running with that flag on. `exportSourceAnswerPacket` has no caller yet (no UI wiring in this release), so it is inert until a future release wires it in.
4. Post-deploy, a live signed-in Source-event chat proof is required before calling this release live-proven — see Known Gaps for the specific scenarios.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (unchanged by this PR).
- Shared runtime mutators: None — this PR contains no `az containerapp update`, no image build commands, no env/flag/secret changes.
- Approved image digest: N/A at PR time — will be set by the standard main-deploy workflow on merge.
- ACA runtime invariant: N/A — no runtime image, env var, or flag mutation in this change; the existing `source_analytics` flag path already governs activation.
- Worker image invariant: N/A — no worker job touched.
- Feature/env flag update path: None — no new flag introduced; existing `source_analytics` flag path unchanged.
- Live signed-in proof required: Yes, before calling this change "live-proven" per the runtime invariant discipline — see Known Gaps for the required scenarios.

## Rollback Plan

Revert the PR. The change is additive (3 new/newly-grounded builder functions + 1 new pure export module with no callers yet + narrowly-scoped extensions to the route's existing mode-classification branch and the quality gate's existing check sets); reverting removes the Phase C grounding builders, the extended check sets, the export module, and the route's use of them, restoring the prior (Phase A + Phase B) behavior exactly. No migration, no data write, no schema change — rollback is a pure code revert with no data cleanup required.

## Audit Evidence

- PR: see PR URL reported alongside this record.
- CI: pending (repo is in speed-mode; local validation is authoritative per AGENTS.md).
- TypeScript: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` — net-new errors = 0 (log diff empty vs. `origin/main` baseline `8b6828e12`; 126 errors / 162 log lines identical before and after).
- ESLint: 0 errors on all 10 changed/new files.
- Jest: 171/171 Source aVa tests green (99 pre-existing Phase A/B + 72 new/corrected Phase C); Intelligence's `answer-safety`/`harness` suites, the full `src/lib/source` tree, and `src/app/api/chat/agent/__tests__` all confirmed to have identical pre-existing failure counts before and after this branch (stash-and-compare method).
- Release check: `node scripts/release-check.mjs --base origin/main --head HEAD` — see PASS/FAIL noted in the PR.

## Known Gaps

- This is a backend/logic-only build with no dev server run in this session. Live signed-in browser proof for the following 5 required scenarios is DEFERRED to a post-deploy live verification pass: (1) artifact finality after a client-final upload, (2) evidence readiness after files are uploaded, (3) a value-lever question after vendor pricing exists, (4) BAFO strategy after finalist responses exist, (5) how-to guidance for a client-final upload.
- `stakeholder_alignment` remains the ONE mode of the 16 that is intentionally NOT grounded — it asks about human sentiment/consensus (has the committee/sponsor agreed?), which this event-bound deterministic tool has no persisted signal for. Grounding it would require fabricating a "who agrees with what" state the data model does not capture. It classifies correctly and falls through to existing (ungrounded) chat behavior, same as before.
- The export mechanism (`exportSourceAnswerPacket`) ships as a pure function + unit tests only. UI wiring (a download/export button in the Source chat surface) was evaluated and deferred: the natural hook is the shared `AgentDock` component (`src/components/agent/AgentDock.tsx`, ~2,300 lines, used by every agent surface — Nexus/Sentinel/Atlas/Steward), which is outside this slice's file list and would require a non-trivial protocol change (threading `groundingBlockText`/`quotableFacts` from the route response into client-side message state, which the current streaming-text protocol does not carry). Wiring the button is a follow-up.
- The quality gate's repair pass remains a single deterministic text transform (strip/append), same as Phase A/B; it does not re-invoke the model. Unresolved checks after repair are logged via `console.warn` for telemetry only.
