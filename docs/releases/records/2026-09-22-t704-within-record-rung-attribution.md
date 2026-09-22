# 2026-09-22-t704-within-record-rung-attribution

## Release ID

`2026-09-22-t704-within-record-rung-attribution`

## Status

`candidate`

## Plain-English Summary

The execution board decides how far along an item is — filed, PR open, merged,
deployed, signed-in proven — by reading the operator register. A register record
is long and discursive: one routinely claims item A while naming item B's
branch, pull request or verdict as context.

The board matched an id **anywhere** in a record and handed the **whole record**
to the rung derivation, which then took the highest rung **any sentence in it**
stated — including the sentences that were about somebody else.

A previous change fixed the boundary *between* records. This is the other half:
attribution *within* one.

### The live case, measured before any code was written

On the register frozen at `2026-09-22T18:20Z`, one item read rung 4 `PR / CI`,
quoting a sentence from its own claim line that reads, in full, that **a
different item is NOT taken** and names **that other item's** pull request. The
item has no pull request of its own. It was not named in the sentence at all.

### What the rung decides

This is not a display nuisance. `rung === 0` is the queue's claimable filter and
`rung === 7` is its `isFinished` test, so an item that absorbs a neighbour's
proof language leaves the bucket it belongs in and the work stops being offered.

## The rule, and why the obvious version of it is wrong

Attribution is **per token, nearest id wins** — the shape the queue generator
already proved for release verdicts. Find the proof word the rule fired on, read
the nearest id reference to it, and accept the rung only if that id is this item.
A sentence naming no id at all belongs to the record's subject and is kept.

**The first attempt was cruder and it was measured to be wrong.** Dropping any
sentence that names a foreign id looks right on the case above and deletes a real
merge: one item's genuine squash-merge is written with two sibling ids in the
trailing clause. That blunt rule dropped **8 own-leading sentences carrying real
proof**, and pushed items to `Open` — which is *claimable*, so it would have
offered finished work to the next agent. It was discarded, not tuned.

The two cases pull in opposite directions on purpose:

| sentence shape | nearest id to the proof word | outcome |
|---|---|---|
| own id, proof word, sibling ids trailing | own | **kept** |
| own id leading, proof word beside a foreign id | foreign | **dropped** |

Neither is decided by which id came first, which is why the second mutation
below exists.

## Layer Impact

- `internal-admin`. Operator tooling only. No product surface, tenant data,
  schema, migration, projection, flag, route or runtime behaviour. Nothing under
  `src/` imports `scripts/exec/*`, it is in no image, and no Container App reads
  it.
- The narrowing is **opt-in**: the derivation filters only when given an id. The
  outcome and narrative corpora pass none and are byte-for-byte unaffected.
- The blocker corpus is **deliberately left whole**. The blocker rules were
  reworked by a separate item, and narrowing both in one change would make this
  change's movement unattributable.

## Client Applicability

- All clients: no · Specific clients: none · Internal only: yes
- Public/demo only: no · Feature flag: none

## Changes Included

- `scripts/exec/build-source-board.mjs`
- `scripts/exec/build-source-board.test.mjs`

## QA / Validation

### Blast radius, on frozen inputs whose checksums were re-verified after both runs

Both generators ran over the same frozen copies of the four operator documents
with the same structure map.

| | count |
|---|---|
| ids compared | **411** |
| unchanged rung | **391** |
| rung moved **down** | **20** |
| rung moved **up** | **0** |
| ids lost | **0** |
| ids newly present | **0** |

**All 20 were read individually, not counted.** Every one took its old rung from
a sentence whose proof word belongs to a different id — a sibling's merge SHA, a
neighbour's deploy carrier, another item's release line, a headline tally. Two
were checked against the register by hand: one has no pull request of its own at
all (every PR number on its lines is nearest to a different id), and the other's
deploy sentence says in its own words that it is *not* a deployment-proof line
for any item.

### Bucket delta

| bucket | before | after |
|---|---|---|
| claimable | 0 | **2** |
| blocked on the owner | 185 | **189** |
| held | 1 | 1 |
| expired-idle | 90 | 90 |
| expired-in-flight | 120 | 120 |
| released | 135 | 135 |

**Direction, which is the safety argument.** Filtering removes matches and can
never create one, so a rung can only fall. The change therefore only ever
*surfaces* work; it cannot hide any. Both newly claimable items were checked to
be genuinely unstarted rather than finished work being re-offered.

### Red first, on the same suite both sides

| | result |
|---|---|
| before the fix | **7 passed, 3 failed** |
| after the fix | **10 passed, 0 failed** |

Two of the five new cases pass on unfixed code **by design** — they are the
guardrails the over-broad fix breaks, and a suite where every new case goes red
would not have caught it.

### Five mutations, each confirmed to have landed

Each mutation's file hash was compared before and after substitution; a mutation
that leaves the file identical is worth nothing. Measured **with the in-file
parser invariants disabled**, so the numbers are what the behavioural fixtures
catch on their own rather than what the invariant refuses at import:

| deliberate break | result |
|---|---|
| attribution reverted entirely | **3 failed** |
| first id instead of nearest id | **1 failed** |
| sentence-wide veto (the discarded first attempt) | **1 failed** |
| bare pull-request numbers counted as item ids | **2 failed** |
| a sentence naming no id dropped instead of kept | **1 failed** |

With the invariants enabled, four of the five are refused at import before any
fixture runs, which is the stronger behaviour and the reason both measurements
are reported.

### Two fixture defects found and fixed during that measurement

Reported because they are the reason the mutation numbers are trustworthy:

- Three fixtures stated a verdict word at the **start of their backlog row**,
  which the attributable-status rule admits as status. Those rows supplied the
  rung by themselves, so the cases passed whatever the attribution did — two
  mutations survived them. The rows were rewritten to state no proof.
- The pull-request-number case wrote the id **adjacent to the verb**, so the id
  was nearer than the PR number either way and the case could not disagree with
  the mutation it was written for. It now places the PR number nearer.

### Other gates

| What | Result |
|---|---|
| the queue generator's own suite | **133 passed, 0 failed**, unchanged both sides |
| `eslint` on both changed files | exit code **0** |
| `tsc` | not applicable — neither file enters the program (`.mjs` is absent from `include`); the local run aborts with the known out-of-memory exit 134, so CI's typecheck job is the authority |

## Rollout Plan

Merge to `main`. Operator tooling only: no image build, migration, flag, traffic
shift or runtime change. The next board regeneration picks it up.

## Deployment Authority

- Repo-owned deploy workflow: not exercised beyond the ordinary main deploy
- Shared runtime mutators: none · Approved image digest: not applicable
- ACA runtime invariant: not applicable · Worker image invariant: not applicable
- Feature/env flag update path: none · Live signed-in proof required: **no**, and
  structurally rather than as a judgement call — nothing under `src/` imports
  these scripts, they are in no image, and no Container App reads them

## Known Gaps

- **The sentence is the reach, and the register does not always write in
  sentences.** A record written as one long pipe-delimited run with no full stop
  is a single sentence to this rule, and nearest-id is then doing all the work
  over a long span. That is the same limit the release-attribution rule accepted,
  and it is not narrowed here.
- **The blocker corpus still sees the whole record.** That was left deliberately
  so this movement could be attributed, and it means the same class of leak may
  remain on the blocker axis for records the body does not override.
- **Only the claim corpus changes in practice.** The item's own row is included
  in the same corpus and is now attributed too, but no measured movement came
  from a row rather than a record.
- **Numeric ids are matched only in the `item N` form**, matching the existing
  claim grammar. A bare `#35` written without `item` is not read as an id by the
  attribution, so a sentence using that shorthand can still leak.

## Rollback Plan

Revert the PR. Rung derivation returns to taking the highest rung any sentence
of a record states, including sentences about other items.

## Audit Evidence

- The frozen input checksums, re-verified unchanged after both generator runs.
- The 411-id before/after rung comparison, with the 20 movers and the sentence
  each one had taken its rung from.
- Both mutation tables, with the file hash changing on every substitution.
- The two fixture defects above, with what each one had been proving instead.
