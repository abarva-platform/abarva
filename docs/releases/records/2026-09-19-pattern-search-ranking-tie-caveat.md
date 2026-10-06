# 2026-09-19-pattern-search-ranking-tie-caveat — keyword pattern search says when its result is corpus order, not a ranking

## Release ID

`2026-09-19-pattern-search-ranking-tie-caveat`

## Status

`candidate`

## Plain-English Summary

`search_patterns` on the advisor surface ranks a 3,569-entry doctrine corpus by
keyword overlap — a count of how many query tokens appear in each entry — and
returns the top few. Vector retrieval is not live; this is the documented
stand-in.

Two things were wrong with it, and this release settles the first and fixes the
second.

### The complaint that was already recorded: substring matching

Matching is `haystack.includes(token)`, so `ai` matches inside `available`,
`maintain`, `detail`. The known consequence is that the four-token query
`AI use case portfolio` scores 3,524 of 3,569 entries above zero.

**Decision: retire, not repair — and the measurement is why.** Word-boundary
matching is the obvious fix. Measured over the real corpus before being
rejected:

| matcher | entries above zero, `AI use case portfolio` |
|---|---|
| substring (today) | 3,524 of 3,569 — 98.7% |
| word boundary | 3,200 of 3,569 — 89.7% |
| boundary + inflectional tail | 3,226 of 3,569 — 90.4% |

Returning 90% of the corpus instead of 99% is not retrieval. The cause is not
the matching strategy but term frequency: on an exact word-boundary basis
`governance` still appears in 2,260 entries (63%), `operating` in 2,283, `risk`
in 2,512. A binary token-overlap score over a corpus like that cannot
discriminate however the tokens are matched.

And the repair costs real recall, which is what the standing rule asks to be
measured on an acronym corpus rather than assumed. Share of substring's hits
that word-boundary matching keeps:

| token | kept |
|---|---|
| `ml` | 6% |
| `ai` | 32% |
| `erp` | 32% |
| `sla` | 56% |
| `kpi` | 69% |
| `sow` | 93% |
| `crm`, `rfp` | 100% |

So the tempting fix loses most of the recall on the shortest acronyms and buys a
result set that is still almost the whole corpus. The scorer stays as it is until
pgvector retrieval lands, and the numbers now sit in the code above it so nobody
re-derives the boundary fix and believes they solved it.

### The defect that was actually shipping: corpus order presented as relevance

The score is a count of tokens present, so a four-token query tops out at 4 — and
**72 corpus entries reach it.** The sort is stable, so `.slice(0, limit)` returns
the first few of those 72 **in manifest insertion order**. Which patterns the
advisor is shown is decided by file order, and it is stable across calls, so it
looks deliberate.

That harm is independent of matching: word-boundary matching still leaves 65 tied
for the same query. So rather than change what is retrieved, the tool now tells
the caller when the list it is holding cannot be a ranking. `search_patterns`
returns a `ranking_caveat` when the top score ties wider than the slice returned,
naming the tie size and instructing the advisor to present the results as
examples of the shape the query matches rather than as the closest matches.

**The caveat discriminates; it is not constant noise.** Over a sample of 510
patterns searched by their own full name at a limit of 20, it fires for 32.5%.
A long specific query (`vendor lock-in concentration risk in application managed
services`, 7 scoring tokens) ties only 3 and produces no caveat.

### A measurement that corrected my own assumption

The negative-control test was first written as "searching a pattern by its own
name separates, so no caveat". That is false on this corpus. A two-token name
like `Analytics Modernization` ties **578** entries at the top score of 2. The
test failed, the assumption was wrong rather than the code, and the case now uses
a long query — with the 32.5% figure recorded beside it so the next reader does
not re-derive the same wrong intuition.

A companion case in the unit suite had the same flaw in a quieter form: it passed
`topScoreTieCount(ranked)` as the returned count, which makes the condition true
by construction, so it re-proved the case above it and said nothing about
separation. Rewritten.

## Layer Impact

Release lane: `global-control-lane`.

- **Products · Intelligence (advisor surface)** — `search_patterns` gains one
  optional field in its success payload. No change to which patterns are
  retrieved, scored, or ordered.
- **Canonical model** — untouched. The pattern manifest is read only and
  unchanged.
- No schema, no migration, no route, no runtime config, no image.

## Client Applicability

- All clients: yes — any tenant whose advisor session calls `search_patterns`
  sees the added caveat when the top score ties wider than the slice returned
- Specific clients: none singled out
- Internal only: no
- Public/demo only: no
- Feature flag: none — the field is additive and appears only when the condition
  holds

The change can only make the surface more cautious about a list it was already
returning. It cannot remove or reorder a result.

## Changes Included

| file | change |
|---|---|
| `src/lib/agent/tools/intelligence/_shared.ts` | records the retire-not-repair decision with its measurements; adds `topScoreTieCount` and `describeRankingTie` |
| `src/lib/agent/tools/intelligence/searchPatterns.ts` | computes the caveat over the full scored list and attaches `ranking_caveat` when it applies |
| `src/lib/agent/tools/intelligence/__tests__/_shared.test.ts` | 7 cases added; one pre-existing companion case rewritten |
| `src/lib/agent/tools/intelligence/__tests__/sentinel-tools.test.ts` | 2 handler cases added |

The scorer itself is byte-for-byte unchanged, so the case that deliberately
documents substring behaviour still holds — and must still fail on the day
word-boundary matching actually arrives, which remains the intended signal.

## QA / Validation

**Status: pass.**

| check | result |
|---|---|
| `_shared.test.ts` + `sentinel-tools.test.ts` | **pass** — 41/41 (was 32) |
| `npx tsc --noEmit` | **pass** — exit 0 |
| `npx eslint` on the four changed files | **pass** — exit 0 |
| `node scripts/release-check.mjs --base origin/main --head HEAD` | **pass** — exit 0 |

### Mutation results

Each applied to a clean tree, measured, restored.

| mutation | expected | observed |
|---|---|---|
| `topScoreTieCount` always returns 0 | caught | 4 of 41 red |
| `describeRankingTie` always returns null | caught | 3 of 41 red |
| `describeRankingTie` fires unconditionally | caught | 5 of 41 red |
| caveat computed over the **slice** instead of the full scored list | caught | 1 of 41 red |
| caveat never attached to the payload | caught | 1 of 41 red |

The fourth is the one worth naming: computing the tie over the already-sliced
list would make the caveat mathematically unable to fire, while leaving every
other test green. That is the way this wiring would most plausibly be got wrong,
and the handler case asserts the reported tie exceeds the slice size specifically
to catch it.

## Rollout Plan

Squash merge to `main`. The advisor surface picks it up on the next ACA deploy
through the repo-owned workflow. No separate rollout step, no flag, no migration.

## Deployment Authority

This ships as ordinary application code through the repo-owned deploy path. It
mutates no runtime configuration of its own.

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged
- Shared runtime mutators: none in this change
- Approved image digest: whatever the main deploy produces for the merge SHA;
  not pinned by this release
- ACA runtime invariant: unchanged by this release; the standing invariant still
  applies to the deploy that carries it
- Worker image invariant: unaffected — no worker path touched
- Feature/env flag update path: n/a
- Live signed-in proof required: **yes, and owed.** The added field is visible to
  the advisor and can change what it says about a result list. This record claims
  `merged` only.

## Rollback Plan

Revert the commit. The `ranking_caveat` field disappears and the tool returns
exactly what it returned before — retrieval, scoring and ordering are untouched
by this change, so there is no result-shape migration either way.

## Audit Evidence

- Decision and its measurements: the block above `scorePatternsByKeyword` in
  `src/lib/agent/tools/intelligence/_shared.ts`
- Behaviour: the `ranking ties` describe block in `__tests__/_shared.test.ts`,
  and the two `searchPatternsTool` cases in `__tests__/sentinel-tools.test.ts`
- PR URL and CI run: recorded on the PR

## Known Gaps

- **Signed-in acceptance is owed.** Nobody has watched the advisor receive a
  `ranking_caveat` and seen what it then says to a user. The field instructs the
  model; it does not constrain it.
- **`validate_synthesis` uses the same scorer and did not get the caveat.** Its
  consumer slices to `maxAligned` with the same tie behaviour. It was left alone
  because what it does with the list — alignment rather than presentation —
  needs its own read, and widening the change without that read is the move this
  item existed to refuse.
- **The scorer is still the stand-in it always was.** Nothing here improves
  retrieval. The 3,524-of-3,569 behaviour is unchanged and deliberate, and the
  case documenting it is unchanged.
- **The measurements are a snapshot.** They were taken against the corpus at this
  SHA and are recorded as prose, not asserted by a test, because exact counts
  would go stale on the next corpus load. The properties they support are what
  the tests pin.
