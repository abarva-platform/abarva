# 2026-05-30-atlas-banned-phrase-guardrail — Atlas system-prompt banned-phrase guardrail (ME-1)

## Release ID

`2026-05-30-atlas-banned-phrase-guardrail`

## Status

`candidate`

## Plain-English Summary

Closes Atlas ME-1 from the 2026-05-30 IAC e2e audit. The IAC archetype copy is already guarded by `honesty-invariants.test.ts` — no archetype may use "industry standard", "everyone is doing", or "best practice" verbatim. But the Atlas LLM was unconstrained, so the model echoed those consensus phrases when the user asked. This change adds an `Honesty discipline:` section to the Atlas system prompt that (a) bans the three literal phrases in Atlas output, (b) tells the model to answer the substance without echoing the phrase when the user uses it, and (c) redirects the model to cite sources by name and date (peer cohort, vendor report, internal benchmark) instead of appealing to unnamed consensus. The prompt version bumps to `tower-w6-v3-banned-phrase-guard` so downstream telemetry attributes the behavior shift.

## Layer Impact

- **runtime-app-lane (Atlas):** Tightens the Atlas LLM system prompt assembled in `src/lib/atlas/prompt.ts` and consumed by `src/lib/atlas/llm.ts` and `src/lib/atlas/orchestrator.ts`. No DB, no broker contract, no UI surface change. No new dependencies.

## Client Applicability

- All clients: every Atlas-served tenant gets the tightened prompt on next request.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none — guardrail is unconditional.

## Changes Included

- `src/lib/atlas/prompt.ts` — adds `Honesty discipline:` section with the three banned phrases and the source-citation redirect. Bumps `ATLAS_PROMPT_VERSION` to `tower-w6-v3-banned-phrase-guard`.
- `src/lib/agent/__tests__/system-prompt-guardrails.test.ts` — new test that pins the guard clause: each banned phrase must be named verbatim in the prompt, the framing label must be present, the source-citation redirect must be present, and the prompt version must reflect the guard.

## QA / Validation

- PASS — `npx jest src/lib/agent/__tests__/system-prompt-guardrails.test.ts` (6 tests)
- PASS — `npx jest src/lib/agent` (43 suites, 666 tests)
- PASS — `npx tsc --noEmit` (clean)
- N/A — `src/lib/atlas/value-grounding.test.ts` fails on `healthcare` vs `healthcare_provider` industry string; verified pre-existing on `origin/main` (unrelated to this PR).

## Rollout Plan

Merge to `main`. The next Atlas LLM request picks up the new system prompt; no migration, no cache warm, no client-side change. Telemetry rows tagged with `tower-w6-v3-banned-phrase-guard` mark the cutover.

## Rollback Plan

Revert the PR. The previous prompt version (`tower-w6-v2-executive-current-state`) ships again and the model regains the freedom to use the phrases. No DB rollback required.

## Audit Evidence

- ME-1 originated in the Atlas IAC e2e (untracked working dir: `reports/2026-05-30-atlas-iac-e2e/ISSUES_CURATED.md`) — model echoed "best practice" / "industry standard" verbatim despite IAC-copy guards.
- Existing IAC archetype copy guard: `src/lib/atlas/iac/__tests__/honesty-invariants.test.ts` lines 22–26 and 165 (banned phrases enumerated).
- New prompt-level guard mirrors the same `BANNED_PHRASES` list so copy guards and LLM guards stay synchronized.

## Known Gaps

- The test asserts the prompt **contains** the banned-phrase instructions; it does not assert the live model output is free of the phrases. An end-to-end eval against a real model run (e.g., extending the Atlas Tier-1 invariants eval to fail when output contains a banned literal outside a quoted citation) is a follow-up — skipped here because it requires real model calls in CI.
- The guard is phrase-literal. A future model that paraphrases ("widely adopted across the industry", "common consensus") would not be caught by string match. The source-citation redirect in the prompt mitigates this but does not prove it. A semantic eval is a follow-up.
- IAC archetype copy and the system prompt now duplicate the `BANNED_PHRASES` list. A shared constant would prevent drift; deferred to keep this PR focused on the user-visible fix.
