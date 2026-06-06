# 2026-06-06 — Intelligence→Move pattern binder: relevance-bound + fail-closed

## Release ID

`2026-06-06-intelligence-binder-fail-closed`

## Status

`candidate`

## Plain-English Summary

Fixes a real mis-binding on the live Lakeshore Intelligence brief. The "Evaluate Kyriba global treasury rollout" decision card cited pattern `PAT-LSH-D18-00479` — "Prioritize City and State Procurement Calendars For Timing Local Bids," a public-sector procurement pattern with nothing to do with treasury. That id then flowed into the "Shape as Move" URL and the Nexus origination message.

Root cause (traced in code, not guessed): the Lakeshore brief builder (`lakeshore-live.ts`) bound each bet to the corpus pattern at its **array position** in a `depth_score`-ranked list — pure positional alignment, zero relevance matching. The Kyriba bet (top initiative by value) was bound to the top-depth pattern, which happened to be the off-domain D18 procurement pattern. (`PAT-LSH-D18-00479` is a real `corpus_patterns` row — it is genuinely loaded, just wrongly bound; it is not in `genome_patterns`, which is a different store.)

Fix: pattern binding is now **relevance-driven and fails closed**. Each bet's use case is scored against every candidate pattern (shared meaningful-token overlap on the pattern's title + category + overlays); the highest-relevance candidate that clears a minimum threshold binds; if none clears it, the bet binds **nothing** rather than an off-domain pattern. The relevance logic lives in a new pure module (`pattern-relevance.ts`) so it is unit-testable without the data plane.

## Layer Impact

- `global-control-lane`: corrects how the live Intelligence brief binds patterns to decision bets for Lakeshore (and any tenant served by `lakeshore-live`). Behavior change: off-domain / irrelevant patterns are no longer bound to a decision card.

## Client Applicability

- All clients served by the live brief builder: Yes (Lakeshore is the active one). Internal only: No. Public/demo only: No. Feature flag: N/A.

## Changes Included

- `src/lib/intelligence-v3/pattern-relevance.ts` — new pure module: `patternRelevanceScore`, `selectRelevantPatternRows`, `MIN_PATTERN_RELEVANCE`.
- `src/lib/intelligence-v3/lakeshore-live.ts` — replaced the positional `patterns.slice(index, index+1)` bet binding with relevance-ranked + fail-closed `selectRelevantPatternRows(...)` over the full candidate set.
- `src/lib/intelligence-v3/__tests__/pattern-relevance.test.ts` — proves a Kyriba bet binds the treasury pattern (not the higher-`depth_score` govtech one) and fails closed when nothing is relevant.
- `docs/releases/records/2026-06-06-intelligence-binder-fail-closed.md` — this record.

## QA / Validation

**Status: PASS.**

- `npx jest src/lib/intelligence-v3/__tests__/pattern-relevance.test.ts` → **4 tests passing** (on-domain > off-domain; Kyriba binds treasury over higher-depth govtech; fails closed; empty-set safe).
- `npx jest src/lib/intelligence-v3` → **4 suites / 12 tests passing** — no regression.
- `npx tsc --noEmit` → **0 errors** in the changed files (only the pre-existing missing-optional-dependency errors remain).
- No existing test depended on the old positional binding.

## Rollout Plan

Merge to main → Vercel production deploy. The live Lakeshore brief immediately stops citing off-domain patterns; the Kyriba decision binds a treasury pattern (or none, honestly).

## Rollback Plan

Revert the PR. Restores the positional binding (and the mis-bind). No schema or persisted state.

## Audit Evidence

- Trace: `lakeshore-live.ts` bet map (was `patterns.slice(index, index+1)`), card consumption at `intelligence-v4/IntelligenceBrief.tsx:101` (`leadBet.bindingPatterns[0].pattern.id`), and the screenshot Shape-as-Move URL carrying `patternId=PAT-LSH-D18-00479`.
- Test run: jest 4/4 + 12/12; tsc clean.

## Known Gaps

- **Scope:** this is the code guardrail on the Lakeshore brief binder (the part agreed in this session). The parallel thread (with live data access) owns the live re-bind of the existing decision + the corpus reconciliation (the "10k generated vs ~12–52 live" loading discrepancy).
- The card's secondary fallback (`patternsTriggered[0]`, a depth-ranked display list) is unchanged; when a bet legitimately fails closed, the lead-pattern label may fall back to that display list. A follow-up can relevance-rank `patternsTriggered` too.
- The same positional-binding pattern should be audited in any other tenant `*-live` brief builders.
